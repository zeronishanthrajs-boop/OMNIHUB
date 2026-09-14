import os
import sys
import io
from pathlib import Path
from dotenv import load_dotenv

# Enforce UTF-8 output encoding on Windows to prevent UnicodeEncodeError for emojis
if sys.platform == "win32":
    try:
        if getattr(sys.stdout, "encoding", "").lower() != "utf-8":
            if hasattr(sys.stdout, "detach"):
                sys.stdout.flush()
                sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding="utf-8")
    except Exception:
        pass
    try:
        if getattr(sys.stderr, "encoding", "").lower() != "utf-8":
            if hasattr(sys.stderr, "detach"):
                sys.stderr.flush()
                sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding="utf-8")
    except Exception:
        pass

# Path setups
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# Load environment variables
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

# App Profiles
USER_NAME = os.getenv("USER_NAME", "Nisha")
CITY = os.getenv("CITY", "Mumbai")
WAKE_WORD = os.getenv("WAKE_WORD", "jarvis").strip().lower()
MIC_INDEX = os.getenv("MIC_INDEX", "").strip()  # Physical microphone device index override

# AI Models (Optimized for 8GB RAM CPU-safe/NVIDIA)
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral:7b")
VISION_MODEL = os.getenv("VISION_MODEL", "llava:7b")
EMBED_MODEL = "nomic-embed-text"
WHISPER_MODEL = "base"
TTS_SPEAKER = os.getenv("TTS_SPEAKER", "p273")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
GITHUB_REPO = os.getenv("GITHUB_REPO", "").strip()

# Google Calendar
GOOGLE_CREDENTIALS_PATH = os.getenv("GOOGLE_CREDENTIALS_PATH", "data/credentials.json")

def is_github_enabled() -> bool:
    return bool(GITHUB_TOKEN and GITHUB_REPO)

def get_cloud_status() -> dict:
    return {
        "github": is_github_enabled(),
    }

if __name__ == "__main__":
    print("=== JARVIS Configuration Loaded ===")
    print(f"User: {USER_NAME}")
    print(f"City: {CITY}")
    print(f"Wake Word: {WAKE_WORD}")
    print(f"Ollama Brain: {OLLAMA_MODEL}")
    print(f"Ollama Vision: {VISION_MODEL}")
    print(f"Cloud Status: {get_cloud_status()}")
