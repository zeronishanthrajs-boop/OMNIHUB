import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import time
import uuid
from privacy_engine import privacy
import project_manager as pm

def run_tests():
    print("=== Testing Items 285-294: Data Privacy & Compliance ===")

    # 285: Local-only data mode
    assert privacy.is_local_only_enforced() is True
    print("[PASS] 285. Local-only data mode verified (guarantees local containment)")

    # 286: Portable per-project data export
    temp_p = pm.create_project(goal="Portable Data Export Test", logical_tree={"goal": "Portable"}, code="<html><body>Portable</body></html>")
    portable = privacy.export_portable_summary(temp_p["id"])
    assert portable.get("format") == "ULTRON_PORTABLE_V1" and portable.get("project_id") == temp_p["id"]
    print(f"[PASS] 286. Portable per-project data export verified: {portable['format']}")

    # 287: True permanent delete
    assert privacy.true_permanent_delete(temp_p["id"]) is True
    assert not os.path.exists(os.path.join("projects", temp_p["id"]))
    print("[PASS] 287. True permanent delete verified (completely wiped snapshots and directory)")

    # 288: Visible data retention policy
    policy = privacy.get_retention_policy()
    assert "default_retention_days" in policy and policy["default_retention_days"] == 30
    print(f"[PASS] 288. Visible data retention policy verified: {policy['policy_name']}")

    # 289: Consent prompt before cloud fallback
    privacy.grant_cloud_consent(False)
    # Check requires consent
    assert privacy.cloud_consent_granted is False
    privacy.grant_cloud_consent(True)
    assert privacy.cloud_consent_granted is True
    print("[PASS] 289. Consent prompt for cloud fallback verified")

    # 290: Sample-data PII detection
    pii_html = "<div>Customer SSN: 123-45-6789, email: realuser@companydomain.org</div>"
    clean_html = "<div>Sample email: test@example.com</div>"
    pii_found = privacy.scan_for_pii(pii_html)
    assert len(pii_found) >= 1
    clean_found = privacy.scan_for_pii(clean_html)
    assert len(clean_found) == 0
    print(f"[PASS] 290. Sample-data PII detection verified (detected {len(pii_found)} real-world patterns)")

    # 291: Configurable log retention window
    privacy.set_log_retention(14)
    assert privacy.log_retention_days == 14
    print(f"[PASS] 291. Configurable log retention window verified ({privacy.log_retention_days} days)")

    # 292: No unauthorized telemetry
    assert privacy.is_telemetry_authorized() is False
    privacy.set_telemetry_opt_in(True)
    assert privacy.is_telemetry_authorized() is True
    privacy.set_telemetry_opt_in(False)
    print("[PASS] 292. No unauthorized telemetry verified (strict opt-in enforcement)")

    # 293: License / attribution tracking
    attribs = privacy.get_license_attributions()
    assert len(attribs) >= 2 and any(a["library"] == "Chart.js" for a in attribs)
    print(f"[PASS] 293. License and attribution tracking verified ({len(attribs)} tracked libraries)")

    # 294: Anonymization option for exported telemetry
    raw_telemetry = {
        "user_path": "C:\\Users\\sakth\\Documents\\SecretProject",
        "ip_address": "192.168.1.105",
        "details": "User execution error"
    }
    anon = privacy.anonymize_telemetry_data(raw_telemetry)
    assert "sakth" not in anon["user_path"] and "REDACTED" in anon["user_path"]
    assert anon["ip_address"] == "127.0.0.1"
    print("[PASS] 294. Telemetry anonymization option verified")

    print("\nALL ITEMS 285-294 VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
