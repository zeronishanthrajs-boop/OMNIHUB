# ════════════════════════════════════════
# FILE: skills/view_file.py
# PURPOSE: Read text, markdown, CSV, JSON, PDF, and DOCX files.
# MODIFIES: none
# ════════════════════════════════════════

from __future__ import annotations

import csv
import json
import os

from .common import resolve_user_path

SKILL_NAME = "view_file"
SKILL_DESCRIPTION = "Read a local file and return its text contents."
SKILL_PARAMETERS = {"type": "object", "properties": {"filename": {"type": "string"}}, "required": ["filename"]}


def execute(filename: str) -> str:
    path = resolve_user_path(filename)
    if not os.path.exists(path):
        return f"File not found: {filename}"
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext in {".txt", ".md", ".py", ".js", ".css", ".html"}:
            with open(path, "r", encoding="utf-8", errors="ignore") as handle:
                return handle.read()[:4000]
        if ext == ".json":
            with open(path, "r", encoding="utf-8", errors="ignore") as handle:
                return json.dumps(json.load(handle), indent=2)[:4000]
        if ext == ".csv":
            rows = []
            with open(path, "r", encoding="utf-8", errors="ignore", newline="") as handle:
                for row in csv.reader(handle):
                    rows.append(" | ".join(row))
            return "\n".join(rows)[:4000]
        if ext == ".pdf":
            from pdfminer.high_level import extract_text

            return extract_text(path)[:4000]
        if ext == ".docx":
            from docx import Document

            doc = Document(path)
            return "\n".join(paragraph.text for paragraph in doc.paragraphs)[:4000]
        with open(path, "r", encoding="utf-8", errors="ignore") as handle:
            return handle.read()[:4000]
    except Exception as exc:
        return f"Failed to read file: {exc}"

