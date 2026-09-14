"""
ULTRON Data Privacy & Compliance Engine (Items 285-294)
Provides local-only data mode enforcement, portable exports, true permanent wipe,
PII detection in synthesized apps, consent gates, and telemetry anonymization.
"""

import os
import sys
import time
import json
import re
import shutil
from typing import Dict, List, Any, Optional, Tuple

class PrivacyEngine:
    def __init__(self):
        self.local_only_mode = True
        self.cloud_consent_granted = False
        self.telemetry_opt_in = False
        self.log_retention_days = 30
        self.attributions: List[Dict[str, str]] = [
            {"library": "Chart.js", "license": "MIT", "url": "https://cdnjs.cloudflare.com/ajax/libs/chart.js/4.4.0/chart.umd.min.js"},
            {"library": "Lucide Icons", "license": "ISC", "url": "https://unpkg.com/lucide@latest"}
        ]

    # 285: Local-only data mode
    def is_local_only_enforced(self) -> bool:
        backend = os.environ.get("LLM_BACKEND", "local")
        return backend == "local" or self.local_only_mode

    # 286: Portable per-project data export
    def export_portable_summary(self, project_id: str) -> Dict[str, Any]:
        import project_manager as pm
        proj = pm.get_project(project_id)
        if not proj:
            return {}
        return {
            "format": "ULTRON_PORTABLE_V1",
            "project_id": proj.get("id"),
            "title": proj.get("title"),
            "goal": proj.get("goal"),
            "version": proj.get("version"),
            "created_at": proj.get("created_at"),
            "total_revisions": len(proj.get("chat", [])),
            "logical_tree": proj.get("logical_tree", {}),
            "html_code": proj.get("code", "")
        }

    # 287: True permanent delete (wipes all snapshots, versions, directory)
    def true_permanent_delete(self, project_id: str) -> bool:
        import project_manager as pm
        proj_dir = os.path.join("projects", project_id)
        if os.path.exists(proj_dir):
            shutil.rmtree(proj_dir)
            return True
        return pm.delete_project(project_id)

    # 288: Visible data retention policy
    def get_retention_policy(self) -> Dict[str, Any]:
        return {
            "policy_name": "ULTRON Local-First Autonomous Retention Policy",
            "default_retention_days": 30,
            "permanent_pin_exemption": True,
            "local_storage_only": True,
            "cloud_sync": False,
            "user_data_encrypted": True
        }

    # 289: Consent prompt before cloud fallback
    def check_cloud_fallback_consent(self) -> Tuple[bool, str]:
        if not self.cloud_consent_granted and os.environ.get("LLM_BACKEND") != "local":
            return False, "Operator consent required before outbound cloud LLM dispatch."
        return True, "Cloud dispatch authorized by operator."

    def grant_cloud_consent(self, grant: bool = True):
        self.cloud_consent_granted = grant

    # 290: Sample-data PII detection
    PII_PATTERNS = [
        (r'\b\d{3}-\d{2}-\d{4}\b', "SSN (Social Security Number)"),
        (r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b', "Credit Card Number"),
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b', "Email Address (Sample)")
    ]

    def scan_for_pii(self, html_code: str) -> List[Dict[str, str]]:
        warnings = []
        for pat, pii_type in self.PII_PATTERNS:
            matches = re.findall(pat, html_code)
            if matches:
                # Exclude standard template sample emails like test@example.com
                real_looking = [m for m in matches if "example.com" not in m]
                if real_looking:
                    warnings.append({"type": pii_type, "count": len(real_looking), "sample": real_looking[0][:15] + "..."})
        return warnings

    # 291: Configurable log retention window
    def set_log_retention(self, days: int):
        self.log_retention_days = max(1, days)

    # 292: No unauthorized telemetry
    def is_telemetry_authorized(self) -> bool:
        return self.telemetry_opt_in

    def set_telemetry_opt_in(self, opt_in: bool):
        self.telemetry_opt_in = opt_in

    # 293: License / attribution tracking
    def get_license_attributions(self) -> List[Dict[str, str]]:
        return list(self.attributions)

    # 294: Anonymization option for exported telemetry
    def anonymize_telemetry_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        data_str = json.dumps(data)
        # Anonymize user names, paths, IPs
        data_str = re.sub(r'c:\\\\users\\\\[^\\\\]+', lambda m: 'C:\\\\Users\\\\REDACTED', data_str, flags=re.I)
        data_str = re.sub(r'/home/[^/]+', lambda m: '/home/REDACTED', data_str, flags=re.I)
        data_str = re.sub(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b', '127.0.0.1', data_str)
        return json.loads(data_str)

privacy = PrivacyEngine()
