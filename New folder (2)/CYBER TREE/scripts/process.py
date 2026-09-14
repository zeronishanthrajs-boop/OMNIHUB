import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import hashlib
import numpy as np
import httpx
import re
from datetime import datetime
from html.parser import HTMLParser
from db_client import DBClient
from openai import OpenAI
from dotenv import load_dotenv
from classify import predict

class ArticleTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.text_parts = []
        self.skip_tags = {'script', 'style', 'nav', 'header', 'footer', 'aside', 'form', 'head', 'noscript', 'iframe', 'svg'}
        self.skip_classes_ids = {'sidebar', 'trending', 'popular', 'widget', 'footer', 'header', 'menu', 'related', 'popular-posts'}
        self.current_stack = []
        self.should_collect = True

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        
        attrs_dict = dict(attrs)
        cls = attrs_dict.get('class', '').lower()
        element_id = attrs_dict.get('id', '').lower()
        
        should_skip_attr = False
        for skip in self.skip_classes_ids:
            if skip in cls or skip in element_id:
                should_skip_attr = True
                break
                
        if tag_lower in self.skip_tags or should_skip_attr:
            self.current_stack.append(tag_lower)
            self.should_collect = False

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in self.skip_tags or tag_lower in self.current_stack:
            if tag_lower in self.current_stack:
                self.current_stack.remove(tag_lower)
            if not self.current_stack:
                self.should_collect = True
            
        if tag_lower in {'p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'tr', 'article', 'section'}:
            self.text_parts.append('\n')

    def handle_data(self, data):
        if self.should_collect:
            self.text_parts.append(data)

def extract_article_content(html_content):
    parser = ArticleTextExtractor()
    try:
        parser.feed(html_content)
    except Exception as e:
        print(f"Error parsing HTML: {e}")
    
    text = "".join(parser.text_parts)
    paragraphs = []
    for block in text.split('\n'):
        cleaned = block.strip()
        cleaned = " ".join(cleaned.split())
        if len(cleaned) > 20:
            paragraphs.append(cleaned)
        elif len(cleaned) > 5 and any(cleaned.lower().startswith(h) for h in ['cve-', 'cwe-', 'cisa']):
            paragraphs.append(cleaned)
            
    return "\n\n".join(paragraphs)

def fetch_real_content(url, default_text):
    if not url or not url.startswith("http"):
        return default_text
    try:
        print(f"Fetching real content from URL: {url} ...")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        }
        resp = httpx.get(url, headers=headers, timeout=10.0, follow_redirects=True)
        if resp.status_code == 200:
            html = resp.text
            extracted = extract_article_content(html)
            if len(extracted) > len(default_text) * 1.5 or len(extracted) > 300:
                print(f"Successfully extracted {len(extracted)} chars of real content.")
                return extracted
            else:
                print(f"Extracted content is too short ({len(extracted)} chars). Falling back to RSS summary.")
        else:
            print(f"Failed to fetch content, status code: {resp.status_code}. Falling back to RSS summary.")
    except Exception as e:
        print(f"Error fetching content: {e}. Falling back to RSS summary.")
        
    return default_text

load_dotenv()

def get_embedding(text, openai_client=None):
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key and openai_client:
        try:
            resp = openai_client.embeddings.create(
                input=[text],
                model="text-embedding-3-small",
                dimensions=384
            )
            return resp.data[0].embedding
        except Exception as e:
            print(f"OpenAI Embedding API error: {e}. Falling back to mock embedding.")
            
    # Deterministic mock embedding generator of 384 dimensions
    dimensions = 384
    vector = []
    # Deterministic seed based on text hash
    seed_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
    state = int(seed_hash[:8], 16)
    
    for _ in range(dimensions):
        # LCG (Linear Congruential Generator) for fast deterministic numbers
        state = (state * 1103515245 + 12345) & 0xffffffff
        val = (state / 4294967295.0) * 2.0 - 1.0
        vector.append(val)
        
    # Normalize to unit length (so cosine similarity is just dot product)
    arr = np.array(vector)
    norm = np.linalg.norm(arr)
    if norm > 0:
        arr = arr / norm
    return arr.tolist()

# Deprecated keyword classifier in favor of ML classifier
# Def kept for compatibility if needed elsewhere
def classify_node_type(title, content):
    res = predict(f"{title} {content[:300]}")
    return res["node_type"]

def run():
    db = DBClient()
    job_id = db.log_job("process", datetime.utcnow(), status="running")
    
    processed_count = 0
    errors = []
    
    openai_key = os.getenv("OPENAI_API_KEY")
    openai_client = OpenAI(api_key=openai_key) if openai_key else None
    
    try:
        raw_sources = db.get_unprocessed_raw_sources(limit=500)
        print(f"Found {len(raw_sources)} unprocessed raw sources.")
        
        for raw in raw_sources:
            try:
                # Parse content
                content_str = raw.get("raw_content") or ""
                title = ""
                summary = ""
                content = content_str
                
                # Check if it was JSON serialized from feedparser
                if content_str.startswith("{") and content_str.endswith("}"):
                    try:
                        entry_data = json.loads(content_str)
                        title = entry_data.get("title", "")
                        summary = entry_data.get("summary", "") or entry_data.get("description", "")
                        # Fetch real content from source_url with 10s timeout
                        content = fetch_real_content(raw["source_url"], summary)
                    except Exception:
                        pass
                
                if not title:
                    # Fallback for plain text
                    lines = [l.strip() for l in content_str.split("\n") if l.strip()]
                    title = lines[0] if lines else f"Raw article from {raw['source_name']}"
                    summary = lines[1] if len(lines) > 1 else content_str
                    if raw.get("source_url") and raw["source_url"].startswith("http"):
                        content = fetch_real_content(raw["source_url"], content_str)
                    else:
                        content = content_str
                
                # Classify text using TF-IDF + LR model
                classification = predict(f"{title} {content[:300]}")
                node_type = classification["node_type"]
                confidence = classification["confidence"]
                
                # Extract external IDs
                import re
                cve_match = re.search(r"(CVE-\d{4}-\d{4,7})", (title + " " + content).upper())
                external_id = cve_match.group(1) if cve_match else None
                
                # Extract tags (keywords)
                tags = [node_type, raw["source_name"].lower().replace(" ", "_")]
                if external_id:
                    tags.append(external_id.lower())
                
                # Clean up summary
                if len(summary) > 200:
                    summary_short = summary[:197] + "..."
                else:
                    summary_short = summary
                    
                # Generate embedding
                embedding_text = f"Title: {title}\nSummary: {summary_short}\nType: {node_type}"
                emb = get_embedding(embedding_text, openai_client)
                
                node_payload = {
                    "node_type": node_type,
                    "title": title,
                    "summary": summary_short,
                    "content": content,
                    "tags": tags,
                    "confidence": confidence,
                    "source_url": raw["source_url"],
                    "source_name": raw["source_name"],
                    "external_id": external_id,
                    "embedding": emb,
                    "metadata": {
                        "raw_source_id": raw["id"],
                        "collected_at": raw["collected_at"]
                    }
                }
                
                db.insert_node(node_payload)
                db.mark_raw_source_processed(raw["id"])
                processed_count += 1
                print(f"Processed raw article into node: {title} ({node_type})")
                
            except Exception as e:
                error_msg = f"Failed to process raw source {raw.get('id')}: {str(e)}"
                print(error_msg)
                errors.append(error_msg)
                db.mark_raw_source_processed(raw["id"], error=str(e))
                
        # Flush any remaining nodes in queue
        print("Flushing processed nodes to database...")
        db.flush()
        
        status = "success" if not errors else "partial"
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status=status,
            rows_processed=processed_count,
            error_message="\n".join(errors) if errors else None,
            notes=f"Processed {processed_count} raw articles into nodes"
        )
        print(f"Processing job finished. Total processed: {processed_count}")
        
    except Exception as e:
        print(f"Critical error in processing job: {e}")
        db.update_job_log(
            job_id,
            datetime.utcnow(),
            status="failed",
            error_message=str(e)
        )
        raise e

if __name__ == "__main__":
    run()
