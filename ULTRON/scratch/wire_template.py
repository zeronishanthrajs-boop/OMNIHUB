from pathlib import Path

dashboard_file = Path("dashboard.py")
lines = dashboard_file.read_text(encoding="utf-8").splitlines(keepends=True)

print("Total lines before:", len(lines))

target = '@app.get("/", response_class=HTMLResponse)'
idx = -1
for i, line in enumerate(lines):
    if target in line:
        idx = i
        break

if idx != -1:
    new_tail = """# ============================================================
# PRIMARY ANTIGRAVITY WORKSPACE DASHBOARD
# ============================================================

@app.get("/", response_class=HTMLResponse)
async def dashboard_home():
    template_path = Path("templates/antigravity.html")
    if template_path.exists():
        return HTMLResponse(content=template_path.read_text(encoding="utf-8"))
    return HTMLResponse("<html><body style='background:#0c0c0e;color:#fff;'>Antigravity template not found.</body></html>", status_code=404)
"""
    updated = "".join(lines[:idx]) + new_tail
    dashboard_file.write_text(updated, encoding="utf-8")
    print("Updated dashboard.py successfully.")
else:
    print("Could not find target line.")
