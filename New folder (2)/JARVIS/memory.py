"""
Local-only memory compatibility layer.

This module keeps the older MemoryManager interface alive while routing all
runtime state to local SQLite/ChromaDB/Ollama paths. External vector/database
services are intentionally disabled.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

import ollama

from memory_manager import MemoryManager as LocalMemoryManager


@dataclass
class DisabledVectorStore:
    enabled: bool = False
    index: None = None

    async def upsert_conversation_async(self, *_args: Any, **_kwargs: Any) -> None:
        return None

    async def upsert_knowledge_chunks_async(self, *_args: Any, **_kwargs: Any) -> None:
        return None


class MemoryManager(LocalMemoryManager):
    def __init__(self):
        super().__init__()
        self.vector_db = DisabledVectorStore()
        self.conversation_history: list[dict[str, Any]] = []
        self.ollama_client = ollama.Client(host="http://localhost:11434")

    def generate_embedding(self, text: str) -> list[float]:
        try:
            res = self.ollama_client.embeddings(model="nomic-embed-text", prompt=text)
            return list(res["embedding"])
        except Exception:
            return [0.0] * 768

    async def save_conversation_async(self, user_text: str, assistant_text: str) -> None:
        self.save_turn(user_text, assistant_text)
        self.conversation_history.append(
            {
                "user": user_text,
                "response": assistant_text,
                "timestamp": time.time(),
            }
        )

    def get_history(self) -> list[dict[str, Any]]:
        return self.conversation_history[-10:]


JarvisMemoryCoordinator = MemoryManager


if __name__ == "__main__":
    manager = MemoryManager()
    print(f"Local memory ready: {manager.status}")
