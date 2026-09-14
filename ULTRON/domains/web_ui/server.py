from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime

app = FastAPI(
    title="ULTRON Microservice API Engine",
    description="High-performance domain service synthesized autonomously by ULTRON.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataItem(BaseModel):
    id: Optional[int] = None
    title: str
    status: str = "active"
    created_at: Optional[str] = None

db_store: List[dict] = [
    {"id": 1, "title": "Quantum Core Online", "status": "active", "created_at": "2026-09-10T12:00:00Z"},
    {"id": 2, "title": "Glassmorphism Synthesis Engine", "status": "active", "created_at": "2026-09-10T12:01:00Z"}
]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "backend_api",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/items", response_model=List[DataItem])
def get_items():
    return db_store

@app.post("/api/items", response_model=DataItem)
def create_item(item: DataItem):
    new_id = len(db_store) + 1
    record = {
        "id": new_id,
        "title": item.title,
        "status": item.status,
        "created_at": datetime.datetime.now().isoformat()
    }
    db_store.append(record)
    return record
<style id="ultron-healed-styles">

/* === ULTRON Autonomous Astra-Grade Polish & Transitions === */
* { box-sizing: border-box; }
a, button, input, select, textarea, .card, .btn, .nav-link {
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
button:hover, .btn:hover {
  transform: translateY(-1.5px);
  filter: brightness(1.08);
}
button:active, .btn:active {
  transform: translateY(0.5px);
}
#ultron-toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}
.ultron-toast {
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 240, 255, 0.3);
  color: #f8fafc;
  padding: 12px 20px;
  border-radius: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 240, 255, 0.2);
  transform: translateY(20px);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: auto;
}
.ultron-toast.show {
  transform: translateY(0);
  opacity: 1;
}
@media (max-width: 768px) {
  #ultron-toast-container {
    bottom: 16px;
    right: 16px;
    left: 16px;
  }
  .ultron-toast {
    text-align: center;
  }
}

</style>
<script id="ultron-healed-scripts">

// === ULTRON Interactive Micro-Engine & Toast System ===
window.showToast = window.showToast || function(message, duration) {
  duration = duration || 3000;
  var container = document.getElementById('ultron-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ultron-toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'ultron-toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(function() {
    toast.classList.add('show');
  });
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
};

// Wire up any unhandled buttons or empty links with live feedback
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var targetId = this.getAttribute('href').substring(1);
      if (!targetId || targetId === '#') {
        e.preventDefault();
        window.showToast('Navigating: ' + (this.textContent.trim() || 'Home'));
        return;
      }
      var targetElem = document.getElementById(targetId);
      if (targetElem) {
        e.preventDefault();
        targetElem.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.showToast('Section: ' + (this.textContent.trim() || targetId));
      }
    });
  });
});

</script>