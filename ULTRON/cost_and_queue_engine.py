"""
ULTRON Cost & Resource Management Engine (Items 307-316)
Provides pre-run compute estimation, cloud cost projection, priority queueing,
idle throttling, runaway protection, and configurable concurrency limits.
"""

import os
import sys
import time
import uuid
import heapq
from typing import Dict, List, Any, Optional, Tuple

class PriorityMissionQueue:
    def __init__(self, max_concurrent: int = 2):
        self.max_concurrent = max_concurrent
        self.queue = [] # heap entries: (-priority, timestamp, goal, req_id)
        self.active_missions: Dict[str, Dict[str, Any]] = {}
        self.idle_throttled = False

    # 307: Pre-run compute time estimate
    def estimate_compute_time(self, goal: str, is_local: bool = True) -> float:
        word_count = len(goal.split())
        # Base latency + scaling by complexity
        base = 2.5 if is_local else 1.2
        estimated = round(base + (word_count * 0.08), 1)
        return min(estimated, 15.0)

    # 308: Cloud-fallback cost estimate
    def estimate_cloud_cost(self, goal: str, is_local: bool = True) -> Dict[str, Any]:
        if is_local:
            return {"cost_usd": 0.00, "is_zero_cost": True, "currency": "USD", "provider": "Local Ollama"}
        est_tokens = len(goal.split()) * 4 + 800 # prompt + completion
        cost = round((est_tokens / 1000) * 0.0002, 5) # NVIDIA NIM / Llama pricing
        return {"cost_usd": cost, "is_zero_cost": False, "currency": "USD", "provider": "Cloud NIM", "tokens": est_tokens}

    # 309: Local-vs-cloud routing rules
    def determine_routing(self, goal: str, prefer_local: bool = True) -> str:
        if prefer_local:
            return "local"
        if any(w in goal.lower() for w in ["massive", "complex architecture", "70b", "distributed"]):
            return "cloud"
        return "local"

    # 312 & 313: Mission batch scheduling & Priority queue
    def enqueue_mission(self, goal: str, priority: int = 1, metadata: Optional[Dict[str, Any]] = None) -> str:
        req_id = f"req_{uuid.uuid4().hex[:6]}"
        # Higher priority value goes first (use negative priority for min-heap)
        heapq.heappush(self.queue, (-priority, time.time(), goal, req_id, metadata or {}))
        return req_id

    def dequeue_next_mission(self) -> Optional[Dict[str, Any]]:
        if not self.queue:
            return None
        neg_prio, ts, goal, req_id, meta = heapq.heappop(self.queue)
        return {"id": req_id, "goal": goal, "priority": -neg_prio, "queued_at": ts, "metadata": meta}

    def get_queue_depth(self) -> int:
        return len(self.queue)

    # 311: Idle-resource throttling
    def set_idle_throttling(self, is_throttled: bool):
        self.idle_throttled = is_throttled

    # 315: Runaway-usage auto-pause
    def check_runaway_guard(self, elapsed_seconds: float, token_count: int, threshold_sec: float = 600.0) -> Tuple[bool, Optional[str]]:
        if elapsed_seconds > threshold_sec:
            return True, f"Runaway Guard Triggered: Synthesis exceeded {threshold_sec}s threshold. Pausing run for operator safety."
        if token_count > 100000:
            return True, "Runaway Guard Triggered: Token consumption exceeded 100k safety envelope."
        return False, None

    # 316: Configurable concurrency limit
    def set_concurrency_limit(self, limit: int):
        self.max_concurrent = max(1, limit)

    def get_concurrency_limit(self) -> int:
        return self.max_concurrent

cost_and_queue = PriorityMissionQueue()
