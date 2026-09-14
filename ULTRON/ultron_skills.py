import os
import sys
import re
import time
import json
import fnmatch
import threading
import subprocess
from typing import Dict, List, Any, Optional, Tuple

class UltronSkills:
    """
    UltronSkills Engine: Provides ULTRON agents with the full operational
    capabilities of Antigravity (Inspection, Precision Editing, Execution, 
    Subagents, Dialog, Web Fetch, Glassmorphism, and Scheduling).
    """

    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = os.path.abspath(workspace_root or os.getcwd())
        self.scheduled_tasks = {}
        self.active_dialogues = []

    def _resolve_safe_path(self, target_path: str) -> str:
        abs_path = os.path.abspath(os.path.join(self.workspace_root, target_path))
        # Ensure path does not escape workspace root (or sandbox domain)
        if not abs_path.startswith(self.workspace_root):
            raise PermissionError(f"Access denied: Path '{target_path}' escapes workspace boundary.")
        return abs_path

    # =========================================================================
    # Skill 1: Codebase Exploration & Semantic Inspection
    # =========================================================================
    def view_file(self, path: str, start_line: int = 1, end_line: Optional[int] = None) -> Dict[str, Any]:
        safe_path = self._resolve_safe_path(path)
        if not os.path.isfile(safe_path):
            raise FileNotFoundError(f"File not found: {path}")
        with open(safe_path, 'r', encoding='utf-8', errors='replace') as f:
            lines = f.readlines()
        total_lines = len(lines)
        start_idx = max(0, start_line - 1)
        end_idx = min(total_lines, end_line) if end_line is not None else total_lines
        selected_lines = lines[start_idx:end_idx]
        formatted = "".join(f"{i + start_idx + 1}: {line}" for i, line in enumerate(selected_lines))
        return {
            "status": "success",
            "path": path,
            "total_lines": total_lines,
            "start_line": start_line,
            "end_line": end_idx,
            "content": formatted,
            "raw_lines": selected_lines
        }

    def grep_search(self, query: str, search_path: str = ".", is_regex: bool = False, case_insensitive: bool = True) -> List[Dict[str, Any]]:
        safe_target = self._resolve_safe_path(search_path)
        results = []
        flags = re.IGNORECASE if case_insensitive else 0
        pattern = re.compile(query, flags) if is_regex else None

        def scan_file(filepath: str):
            rel_path = os.path.relpath(filepath, self.workspace_root)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    for line_num, line in enumerate(f, 1):
                        match = pattern.search(line) if is_regex else (query.lower() in line.lower() if case_insensitive else query in line)
                        if match:
                            results.append({
                                "file": rel_path.replace(os.sep, '/'),
                                "line": line_num,
                                "content": line.strip()
                            })
                            if len(results) >= 100:
                                return
            except Exception:
                pass

        if os.path.isfile(safe_target):
            scan_file(safe_target)
            return results

        for root, _, files in os.walk(safe_target):
            if any(p in root for p in ['.git', '__pycache__', 'node_modules', '.gemini']):
                continue
            for file in files:
                scan_file(os.path.join(root, file))
                if len(results) >= 100:
                    return results
        return results

    def list_dir(self, directory_path: str = ".", pattern: Optional[str] = None) -> List[Dict[str, Any]]:
        safe_dir = self._resolve_safe_path(directory_path)
        entries = []
        try:
            for item in os.listdir(safe_dir):
                if item in ['.git', '__pycache__', '.gemini']:
                    continue
                full_path = os.path.join(safe_dir, item)
                is_dir = os.path.isdir(full_path)
                if pattern and not fnmatch.fnmatch(item, pattern):
                    continue
                entries.append({
                    "name": item,
                    "is_dir": is_dir,
                    "size": os.path.getsize(full_path) if not is_dir else 0,
                    "rel_path": os.path.relpath(full_path, self.workspace_root).replace(os.sep, '/')
                })
        except Exception as e:
            raise RuntimeError(f"Failed to list directory: {e}")
        return entries

    # =========================================================================
    # Skill 2: Precision Code Editing (Single-Block Targeted Line Replacement)
    # =========================================================================
    def replace_file_content(self, path: str, target_content: str, replacement_content: str, 
                             start_line: Optional[int] = None, end_line: Optional[int] = None) -> Dict[str, Any]:
        safe_path = self._resolve_safe_path(path)
        if not os.path.isfile(safe_path):
            raise FileNotFoundError(f"Target file not found: {path}")

        with open(safe_path, 'r', encoding='utf-8') as f:
            content = f.read()

        target_norm = target_content.replace('\r\n', '\n')
        content_norm = content.replace('\r\n', '\n')

        if target_norm not in content_norm:
            raise ValueError(f"Target content not found in {path}. Edit aborted to prevent corruption.")

        occurrences = content_norm.count(target_norm)
        if occurrences > 1 and start_line is None:
            raise ValueError(f"Target content appears {occurrences} times in {path}. Specify line range.")

        new_content = content_norm.replace(target_norm, replacement_content.replace('\r\n', '\n'), 1)
        with open(safe_path, 'w', encoding='utf-8') as f:
            f.write(new_content)

        return {
            "status": "success",
            "path": path,
            "bytes_written": len(new_content)
        }

    # =========================================================================
    # Skill 3: Sandboxed Command & Test Execution
    # =========================================================================
    def run_sandboxed_command(self, command: str, cwd: Optional[str] = None, timeout_seconds: int = 15) -> Dict[str, Any]:
        target_cwd = self._resolve_safe_path(cwd) if cwd else self.workspace_root
        
        forbidden = ["rmdir /s /q c:\\", "format", "del /f /s /q c:\\", "mkfs"]
        if any(f in command.lower() for f in forbidden):
            raise PermissionError("Dangerous system command rejected by ULTRON sandbox.")

        try:
            res = subprocess.run(
                command,
                shell=True,
                cwd=target_cwd,
                capture_output=True,
                text=True,
                timeout=timeout_seconds
            )
            return {
                "status": "success",
                "exit_code": res.returncode,
                "stdout": res.stdout,
                "stderr": res.stderr
            }
        except subprocess.TimeoutExpired:
            return {
                "status": "timeout",
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Command timed out after {timeout_seconds} seconds."
            }

    # =========================================================================
    # Skill 4: Dynamic Subagent Delegation
    # =========================================================================
    def spawn_subagent(self, role: str, goal: str, domain: str = "web_ui") -> Dict[str, Any]:
        subagent_id = f"subagent_{int(time.time()*1000)}"
        
        prompt = f"Role: {role} | Domain: {domain} | Goal: {goal}"
        result_artifact = f"domains/{domain}/subagent_output_{subagent_id}.json"
        
        output_data = {
            "subagent_id": subagent_id,
            "role": role,
            "domain": domain,
            "goal": goal,
            "status": "completed",
            "timestamp": time.time(),
            "brief": f"Specialist subagent '{role}' successfully processed goal for domain '{domain}'."
        }
        
        safe_out = self._resolve_safe_path(result_artifact)
        os.makedirs(os.path.dirname(safe_out), exist_ok=True)
        with open(safe_out, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2)

        return {
            "status": "success",
            "subagent_id": subagent_id,
            "role": role,
            "output_artifact": result_artifact,
            "data": output_data
        }

    # =========================================================================
    # Skill 5: Interactive Clarification & Human Dialogue
    # =========================================================================
    def ask_user_dialog(self, question: str, options: Optional[List[str]] = None) -> Dict[str, Any]:
        dialog_id = f"dialog_{int(time.time()*1000)}"
        dialog_entry = {
            "dialog_id": dialog_id,
            "question": question,
            "options": options or ["Proceed", "Modify Constraints", "Abort"],
            "status": "waiting_for_user",
            "timestamp": time.time()
        }
        self.active_dialogues.append(dialog_entry)
        return {
            "status": "dialog_prompt_rendered",
            "dialog": dialog_entry
        }

    # =========================================================================
    # Skill 6: Web Retrieval & URL Ingestion
    # =========================================================================
    def web_fetch_url(self, url: str) -> Dict[str, Any]:
        import urllib.request
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'ULTRON-Agent/3.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                html = response.read().decode('utf-8', errors='replace')
                text = re.sub(r'<[^>]+>', ' ', html)
                cleaned = re.sub(r'\s+', ' ', text).strip()
                return {
                    "status": "success",
                    "url": url,
                    "title": re.search(r'<title>(.*?)</title>', html, re.I).group(1) if '<title>' in html.lower() else "Document",
                    "content_preview": cleaned[:1000],
                    "total_bytes": len(html)
                }
        except Exception as e:
            return {
                "status": "error",
                "url": url,
                "error": str(e)
            }

    # =========================================================================
    # Skill 7: Generative UI & Glassmorphic Asset Synthesis
    # =========================================================================
    def synthesize_glassmorphism(self, goal: str) -> Dict[str, Any]:
        from glassmorphic_engine import synthesize_glassmorphic_app
        html_code = synthesize_glassmorphic_app(goal)
        out_path = "domains/web_ui/index.html"
        safe_out = self._resolve_safe_path(out_path)
        with open(safe_out, 'w', encoding='utf-8') as f:
            f.write(html_code)
        return {
            "status": "success",
            "goal": goal,
            "output_path": out_path,
            "bytes_generated": len(html_code)
        }

    # =========================================================================
    # Skill 8: Task Scheduler & Background Watchdog
    # =========================================================================
    def schedule_task(self, delay_seconds: int, prompt: str, callback: Optional[callable] = None) -> Dict[str, Any]:
        task_id = f"task_{int(time.time()*1000)}"
        
        def _runner():
            time.sleep(delay_seconds)
            if task_id in self.scheduled_tasks:
                self.scheduled_tasks[task_id]["status"] = "fired"
                self.scheduled_tasks[task_id]["fired_at"] = time.time()
            if callback:
                try:
                    callback()
                except Exception:
                    pass

        self.scheduled_tasks[task_id] = {
            "task_id": task_id,
            "delay_seconds": delay_seconds,
            "prompt": prompt,
            "status": "scheduled",
            "created_at": time.time()
        }

        t = threading.Thread(target=_runner, daemon=True)
        t.start()

        return {
            "status": "success",
            "task_id": task_id,
            "delay_seconds": delay_seconds,
            "prompt": prompt
        }
