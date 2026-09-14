# ════════════════════════════════════════
# FILE: skills/search_web.py
# PURPOSE: DuckDuckGo/Bing web search with knowledge cache ingestion.
# MODIFIES: memory/knowledge/
# ════════════════════════════════════════

from __future__ import annotations

import requests
from bs4 import BeautifulSoup

from knowledge_manager import KnowledgeManager

SKILL_NAME = "search_web"
SKILL_DESCRIPTION = "Search the web and cache useful pages for offline knowledge."
SKILL_PARAMETERS = {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}


def execute(query: str) -> str:
    try:
        response = requests.post("https://duckduckgo.com/html/", data={"q": query}, timeout=8, headers={"User-Agent": "JARVIS/3.0"})
        if response.status_code >= 400:
            response = requests.get(f"https://www.bing.com/search?q={query}", timeout=8, headers={"User-Agent": "JARVIS/3.0"})
        soup = BeautifulSoup(response.text, "html.parser")
        texts = [item.get_text(" ", strip=True) for item in soup.select(".result, li.b_algo")[:5]]
        answer = "\n".join(text for text in texts if text)[:2000]
        if answer:
            KnowledgeManager().ingest_text(answer, f"search:{query}", "web-search")
            return answer
        return "No search results found."
    except Exception as exc:
        chunks = KnowledgeManager().query_knowledge(query, 3)
        if chunks:
            return "\n".join(chunk["text"] for chunk in chunks)
        return f"Search unavailable offline: {exc}"

