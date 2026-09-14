# 🕸️ CYBER TREE — Autonomous Threat Intelligence Platform

CYBER TREE is a self-sustaining, autonomous threat intelligence platform designed to index cyber security reports, extract knowledge nodes, automatically map relationships, verify hypotheses, retrain machine learning models, heal its graph database, and serve human research queries through a Gemini AI assistant.

The platform is designed to run forever, autonomously powered entirely by scheduled GitHub Actions workflows.

---

## 🚀 Live Platform
- **Production Dashboard:** [https://cyber-tree-azure.vercel.app/](https://cyber-tree-azure.vercel.app/)

---

## 🏛️ System Architecture

```text
                  +-----------------------------------+
                  |        CYBER TREE PLATFORM        |
                  +-----------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-------------------+                               +--------------------+
|    Next.js UI     |  <---- [Global Search] ---->  |   Supabase Prod    |
|   (Vercel Prod)   |  <--- [/api/system-health] ->  |  / SQLite Fallback |
+-------------------+                               +--------------------+
          |                                                   |
          | [User Prompts]                                    |
          v                                                   | [Write Nodes & Logs]
+-------------------+                                         |
|    Gemini API     | -- (Generates AI Answers) --------------+
| (2.5 Flash Free)  |
+-------------------+
          ^
          | [Query Context]
          +---------------------------------------------------+
                                                              |
+-------------------------------------------------------------+------+
|             AUTONOMOUS GITHUB ACTIONS PIPELINE WORKFLOWS           |
+--------------------------------------------------------------------+
|  1. collect.py          -> Scrapes feeds, advisories & security blogs|
|  2. process.py          -> Extracts structured nodes with classifier |
|  3. relate.py           -> Links newly indexed nodes into graph      |
|  4. embed.py            -> Generates vector embeddings for nodes     |
|  5. cluster_nodes.py    -> Computes intelligence graph clusters      |
|  6. trend_detector.py   -> Detects emerging trends in clusters       |
|  7. hypothesis_engine.py-> Generates threat actor & malware forecasts |
|  8. evidence_linker.py  -> Verifies forecasts against incoming data  |
|  9. learning_engine.py  -> Evaluates accuracy & adjusts confidences  |
| 10. model_updater.py    -> Retrains classifier & commits back to Git |
| 11. source_discoverer.py-> Auto-discovers RSS feeds from graph nodes |
| 12. dead_source_detector-> Prunes dead / broken sources              |
| 13. knowledge_healer.py -> Merges duplicates & links orphan nodes    |
| 14. backup.py           -> Automatic platform state backups         |
| 15. monitor.py          -> Continuous pipeline health monitoring     |
+--------------------------------------------------------------------+
```

---

## 🛠️ Technology Stack
- **Frontend/Web App:** Next.js (App Router), React, TailwindCSS, Recharts
- **Backend APIs:** Next.js Serverless Routes
- **Database:** Supabase (PostgreSQL with `pgvector` & FTS), Node `sqlite` (Local dev fallback)
- **Machine Learning & AI:** Gemini 2.5 Flash, Hugging Face Transformers (`all-MiniLM-L6-v2` embeddings, custom text classification pipeline)
- **Execution & Orchestration:** GitHub Actions (Cron triggers & workflow dispatches)

---

## 📅 Roadmap & Execution Phases

### Phase 1: Core Scraper Pipeline
- Implemented `collect.py` to crawl RSS feeds, CVE bulletins, and major cybersecurity blogs.
- Handles duplicate deduplication and formats ingested items as raw articles.

### Phase 2: Knowledge Extraction Engine
- Built custom Zero-Shot classifier models for cyber threat intelligence categorization.
- Created `process.py` backend to extract nodes (Threat Actors, Vulnerabilities, Malware, Techniques, Weaknesses, Technologies, Incidents) from raw text.

### Phase 3: Relationship Linker
- Implemented `relate.py` to build a semantic knowledge graph.
- Maps connections between nodes using keyword-based heuristics, entity mentions, and co-occurrences.

### Phase 4: Frontend Explorer
- Created UI routes `/`, `/explore`, `/explore/[id]`, `/search`, `/similar` and `/timeline`.
- Displays incident timelines, full-text and tag search, and interactive relationship graph visualizations.

### Phase 5: Semantic Search & Vector Embeddings
- Integrated `all-MiniLM-L6-v2` sentence transformers to vectorize nodes.
- Enabled semantic searches and cosine similarity lookups for similar node recommendation.

### Phase 6: Pattern Detection & Hypotheses
- Implemented community detection algorithms (Louvain/Label Propagation) to cluster related nodes.
- Built `trend_detector.py` to identify emerging cyber attack patterns.
- Built `hypothesis_engine.py` to generate forward-looking predictions.

### Phase 7: Self-Improving Intelligence
- Implemented `learning_engine.py` to calculate prediction confirmation rates.
- Created `model_updater.py` to retrain text classification models using confirmed data, auto-committing the retrained model back to GitHub.

### Phase 8: Autonomous Maintenance
- Developed `source_discoverer.py` and `dead_source_detector.py` to discover and prune RSS feeds.
- Built `knowledge_healer.py` to merge duplicate nodes and connect orphan nodes.
- Created `/sources` management dashboard.

### Phase 9: Research Assistant
- Created `research_assistant.py` with hybrid (vector + full-text) search retrieval.
- Developed Gemini-powered `/research` Q&A chat interface with interactive inline citation badges.

### Phase 10: Unified Command Center (Final)
- Built unified dashboard `/` with live pipeline health monitoring, knowledge growth charts, and quick actions.
- Implemented Ctrl+K / Cmd+K global search bar with categorized dropdown results.
- Added real-time workflow status indicators directly into the top navigation.
