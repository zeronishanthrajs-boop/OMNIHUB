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
