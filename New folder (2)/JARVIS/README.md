# JARVIS v2.0 - Local Assistant & Cloud Memory

JARVIS (Just A Rather Very Intelligent System) is a complete, fully functional local AI assistant designed for Windows 11 (optimized for 8GB RAM systems). It features a cinematic, holographic Iron Man-inspired HUD web interface, local speech recognition (Whisper) and synthesis (VITS), system diagnostic feeds, and a hybrid multi-cloud memory architecture (Supabase, GitHub, Pinecone).

JARVIS stores absolutely nothing locally except the core app code itself. All conversation logs, preference configurations, semantic vector embeddings, and learned subject study guides live in the cloud across free tier services, persisting forever even if you reinstall your operating system.

---

## 1. Prerequisites

Before installing, ensure the following core utilities are active on your Windows 11 machine:

- **Python 3.10+**: Ensure Python is checked in your system PATH variables.
- **Ollama**: Download and install from [ollama.com](https://ollama.com/download). Make sure the Ollama application is active in your taskbar.
- **Git**: Download and install from [git-scm.com](https://git-scm.com).

---

## 2. Quick Start

1. Double-click `install.bat` to automatically build your virtual environment, install locked libraries, pull AI models (`mistral:7b`, `llava:7b`, `nomic-embed-text`), and generate your `.env` configuration file.
2. Complete your cloud credentials inside the newly created `.env` file (see the [Cloud Setup](#3-cloud-setup) section below).
3. Double-click `run.bat` to boot up Ollama in the background, spin up the FastAPI websocket server, and automatically launch your cinematic HUD in your web browser at `http://localhost:8000`.

---

## 3. Cloud Setup

To utilize JARVIS's persistent memory and active learning modules, you must set up the following free cloud integrations:

### A. Supabase Database (free at [supabase.com](https://supabase.com))
1. Register for an account and click **New Project**.
2. Go to **Project Settings** -> **API**.
3. Copy **Project URL** -> `SUPABASE_URL` in `.env`.
4. Copy **anon/public key** -> `SUPABASE_KEY` in `.env`.
5. Open the **SQL Editor** from the left panel, paste the following SQL commands, and click **Run** to set up your schemas:

```sql
-- 1. Create Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL DEFAULT 'default',
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    source TEXT NOT NULL DEFAULT 'llm'
);

-- 2. Create Learned Topics Index Table
CREATE TABLE learned_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic TEXT UNIQUE NOT NULL,
    summary TEXT NOT NULL,
    github_file_path TEXT NOT NULL,
    chunk_count INT NOT NULL,
    learned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_urls TEXT[]
);

-- Create simple indexes for faster keyword querying
CREATE INDEX idx_conversations_msg ON conversations USING gin (to_tsvector('english', message));
CREATE INDEX idx_learned_topics_name ON learned_topics(topic);
```

### B. GitHub Memory Repository (free at [github.com](https://github.com))
1. Create a new **Private Repository** named `jarvis-memory`. Do not initialize it with a README.
2. Go to your profile settings: **Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Tokens (classic)**.
3. Click **Generate new token (classic)**, name it, and select the checkmark for **`repo`** (gives full control of private repositories).
4. Generate the token, copy it, and paste it under `GITHUB_TOKEN` in your `.env`.
5. Enter your username and repo name in your `.env` under `GITHUB_REPO` (e.g. `yourusername/jarvis-memory`).

### C. Pinecone RAG Index (free at [pinecone.io](https://pinecone.io))
1. Register for an account and click **Create Index** inside the dashboard.
2. Configure the index as follows:
   - **Index Name**: `jarvis-memory`
   - **Dimension**: `768` (Required for nomic-embed-text vector sizes)
   - **Metric**: `Cosine`
   - **Environment/Cloud**: `GCP` (Select the free starter tier instance)
3. Copy your API Key -> `PINECONE_API_KEY` in `.env`.
4. Copy your index name -> `PINECONE_INDEX` in `.env`.

### D. Google Calendar Integration (Optional)
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project, navigate to the **API Library**, search for the **Google Calendar API**, and click **Enable**.
3. Go to the **OAuth Consent Screen** page, select **External**, input your email, and add the `/auth/calendar.readonly` scope.
4. Go to **Credentials**, click **Create Credentials** -> **OAuth Client ID**, select **Desktop Application** as the type, and click Create.
5. Click **Download JSON** on your client ID, rename the file to `credentials.json`, and place it in the `data/` folder inside the JARVIS project directory.
6. Trigger the link by clicking the **`[Link OAuth]`** button on your HUD top-right corner to open a browser consent screen. This generates your permanent `token.json` automatically.

---

## 4. Active Learning System

This is the primary feature of JARVIS v2.0. Everything JARVIS studies online is permanently compiled and stored in the cloud.

### The Pipeline Flow:
1. **Initiation**: Say *"Learn about Photosynthesis"* or click the **📚** button in your HUD to type your topic.
2. **Deduplication Check**: JARVIS queries Supabase to check if the topic has been learned before. If found, it offers to refresh.
3. **Estimation**: JARVIS crawls the Wikipedia page sections and abstract indices using a compliant browser user agent, returning a progress pop-up:
   $$\text{Learning Time Estimate (mins)} = (\text{Sections} \times 0.8) + (\text{Vector Chunks} \times 0.1) + 2$$
4. **Scraping**: Once approved, JARVIS downloads full encyclopedia logs and DuckDuckGo API snippets (10-20%).
5. **Token Segmentation**: Text is mathematically sliced into precise 500-token blocks using `tiktoken` (35%).
6. **Local Embedding**: Chunks are transformed into 768-dimension vectors locally via Ollama `nomic-embed-text` (55%).
7. **Pinecone Upload**: Embeddings are batch uploaded to your Pinecone index under the `"knowledge"` namespace (70%).
8. **Mistral Synthesis**: JARVIS prompts `mistral:7b` to write an objective 3-paragraph summary and list 5 key facts (85%).
9. **GitHub Sync**: The complete encyclopedia archive, summary, and bulleted facts are written to `knowledge/{topic_slug}.md` and pushed to your GitHub repository.
10. **Database Indexing**: The metadata index is stored inside Supabase `learned_topics` (95%).
11. **RAG Integration**: You can now ask questions about the topic. JARVIS will query the Pinecone `"knowledge"` namespace, fetch matching context slices, and answer using Mistral, displaying the `[LEARNED]` badge.

---

## 5. Voice & Console Commands Reference

JARVIS automatically parses conversational input for system controls and application launches:

| Category | Command Examples | Action Triggered |
| :--- | :--- | :--- |
| **App Launches** | *“Open Chrome”*, *“Open Task Manager”*, *“Open Notepad”* | Subprocess execution of Windows 11 applications |
| **Web Browser** | *“Open youtube.com”*, *“Search Google for black holes”* | Opens browser tab or Google search query |
| **Windows Controls**| *“Click”*, *“Right Click”*, *“Double Click”*, *“Scroll down”* | Physical cursor movements and actions via `pyautogui` |
| **Keyboard Macros**| *“Type hello world”*, *“Press Enter”* | Keyboard macros (Requires user safety confirmation) |
| **Media Keys** | *“Volume up”*, *“Volume down”*, *“Mute”*, *“Play”*, *“Pause”* | Simulates system hardware media key presses |
| **Hardware diagnostics**| *“Diagnostics”*, *“System Stats”*, *“Vitals”* | Reports CPU, Memory, Disk, and Battery diagnostics |
| **Daily Report** | *“What's the weather in London?”*, *“Read news headlines”* | Connects to wttr.in weather and RSS BBC feed |
| **Google Calendar**| *“Any meetings tomorrow?”*, *“What's on my calendar?”* | Queries Google Calendar events from API |
| **Active Learning** | *“Learn about Quantum Computing”* | Launches active cloud learning pipeline |
| **Memory Purging** | *“Forget about Ancient Rome”* | Purges topic from Supabase, GitHub, and Pinecone |

---

## 6. Accessing HUD from a Mobile Phone

You can view the fully animated HUD and engage voice commands from your phone:

1. Open your PC terminal, run `ipconfig`, and find your IPv4 Address (e.g. `192.168.1.42`).
2. Ensure your phone and PC are connected to the same local Wi-Fi network.
3. Open your mobile browser and navigate to: `http://[YOUR-PC-IP]:8000` (e.g. `http://192.168.1.42:8000`).
4. Click the central orb on your phone to toggle mobile mic speech dictation.

---

## 7. Troubleshooting

- **PyAudio Installation Error (C++ Build Tools)**:
  If PyAudio fails to install during `install.bat`, open a command prompt and run:
  `pip install pipwin` followed by `pipwin install pyaudio` OR download the precompiled wheel from standard Windows unofficial binaries.
- **Coqui TTS Failing to Load**:
  Coqui requires C++ build dependencies on Windows. If Coqui fails to install or compile, JARVIS automatically launches `pyttsx3` fallback with Microsoft David (Windows male voice) which requires zero external setups and runs instantly on CPU.
- **Port 8000 is Busy**:
  If another application is using port 8000, open `main.py`, locate `port=8000` at the bottom, change it to `port=8080`, and launch `run.bat` again.
