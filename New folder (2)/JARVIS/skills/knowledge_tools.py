# ════════════════════════════════════════
# FILE: skills/knowledge_tools.py
# PURPOSE: Voice-accessible knowledge ingestion and retrieval tools.
# MODIFIES: memory/knowledge/, memory/sources.db
# ════════════════════════════════════════

from knowledge_manager import KnowledgeManager

SKILL_NAME = "knowledge_tools"
SKILL_DESCRIPTION = "Learn from files or URLs and query local knowledge."
SKILL_PARAMETERS = {
    "type": "object",
    "properties": {"action": {"type": "string"}, "path": {"type": "string"}, "url": {"type": "string"}, "topic": {"type": "string"}},
    "required": ["action"],
}


def execute(action: str, path: str = "", url: str = "", topic: str = "") -> str:
    manager = KnowledgeManager()
    if action == "learn_from_file":
        chunks = manager.ingest_file(path)
        return f"I've learned from {path}. Stored {chunks} chunks."
    if action == "learn_from_url":
        chunks = manager.ingest_url(url)
        return f"I've learned from {url}. Stored {chunks} chunks."
    if action == "what_do_you_know_about":
        chunks = manager.query_knowledge(topic, 5)
        return "\n".join(chunk["text"] for chunk in chunks) if chunks else "I do not have local knowledge on that yet."
    return "Unknown knowledge action."

