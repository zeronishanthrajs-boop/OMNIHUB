import sys

def patch():
    with open("templates/antigravity.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add toast CSS before </style>
    toast_css = """
  .toast-notice {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #18181b;
    color: #f4f4f5;
    border: 1px solid #27272a;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 99999;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
  }
  .toast-notice.show {
    opacity: 1;
    transform: translateY(0);
  }
  .toast-notice.error {
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }
</style>"""
    if ".toast-notice" not in content:
        content = content.replace("</style>", toast_css, 1)

    # 2. Add Export button in Live App toolbar
    old_toolbar = """          <div style="display:flex;align-items:center;gap:6px;">
            <div class="nav-icon-btn" onclick="reloadSandboxIframe()" title="Reload App">"""
    new_toolbar = """          <div style="display:flex;align-items:center;gap:6px;">
            <div class="nav-icon-btn" onclick="exportProjectZip()" title="Download .ZIP Export">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </div>
            <div class="nav-icon-btn" onclick="reloadSandboxIframe()" title="Reload App">"""
    if "Download .ZIP Export" not in content:
        content = content.replace(old_toolbar, new_toolbar, 1)

    # 3. Add showToast function after const $$
    toast_fn = """  const $$ = sel => document.querySelectorAll(sel);

  function showToast(msg, isError = false) {
    let toast = $("#toastNotice");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toastNotice";
      toast.className = "toast-notice";
      document.body.appendChild(toast);
    }
    toast.className = "toast-notice" + (isError ? " error" : "");
    toast.innerHTML = isError
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:#ef4444;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${escapeHtml(msg)}</span>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:#38bdf8;"><path d="M20 6L9 17l-5-5"/></svg><span>${escapeHtml(msg)}</span>`;
    
    setTimeout(() => toast.classList.add("show"), 10);
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3500);
  }"""
    if "function showToast" not in content:
        content = content.replace("  const $$ = sel => document.querySelectorAll(sel);", toast_fn, 1)

    # 4. Update pollServerState to sync activeProjectId
    old_poll_proj = """      if (data.status_code === "approved" && data.active_project_id && (!state.activeProjectId || state.activeProjectId !== data.active_project_id)) {
        state.activeProjectId = data.active_project_id;
        loadProjectsCatalog();
        reloadSandboxIframe();
      }"""
    new_poll_proj = """      if (data.active_project_id && (!state.activeProjectId || state.activeProjectId !== data.active_project_id)) {
        state.activeProjectId = data.active_project_id;
        loadProjectsCatalog();
        reloadSandboxIframe();
      }"""
    content = content.replace(old_poll_proj, new_poll_proj, 1)

    # 5. Update saveProjectPermanent and exportProjectZip
    old_save_export = """  window.saveProjectPermanent = async function() {
    if (!state.activeProjectId) {
      alert("No active project selected");
      return;
    }
    try {
      const res = await fetch(`/api/projects/${state.activeProjectId}/save`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        $("#permSaveLabel").textContent = d.is_permanent ? "⭐ Permanent" : "💾 Save";
        loadProjectsCatalog();
      }
    } catch (e) {
      alert("Save toggle failed");
    }
  };

  window.exportProjectZip = function() {
    if (!state.activeProjectId) {
      alert("No active project selected");
      return;
    }
    window.location.href = `/api/projects/${state.activeProjectId}/export`;
  };"""

    new_save_export = """  window.saveProjectPermanent = async function() {
    const btn = $("#permSaveLabel");
    const oldText = btn ? btn.textContent : "💾 Save";
    if (btn) btn.textContent = "⏳ Saving...";
    try {
      const url = state.activeProjectId ? `/api/projects/${state.activeProjectId}/save` : "/api/projects/save-current";
      const res = await fetch(url, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        if (d.project_id) {
          state.activeProjectId = d.project_id;
        }
        if (btn) btn.textContent = d.is_permanent ? "⭐ Permanent" : "💾 Save";
        showToast(d.is_permanent ? "Saved permanently (exempt from 30d purge)" : "Project saved.");
        await loadProjectsCatalog();
      } else {
        if (btn) btn.textContent = oldText;
        showToast("Save failed", true);
      }
    } catch (e) {
      if (btn) btn.textContent = oldText;
      showToast("Save failed: " + e.message, true);
    }
  };

  window.exportProjectZip = async function() {
    const btn = document.querySelector("button[onclick='exportProjectZip()'] span");
    const oldText = btn ? btn.textContent : "📦 Export";
    if (btn) btn.textContent = "⏳ Exporting...";
    try {
      const url = state.activeProjectId 
        ? `/api/projects/${state.activeProjectId}/export` 
        : "/api/projects/export-current";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Server returned status " + res.status);
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      let filename = (state.activeProjectId || "ultron_project") + ".zip";
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1].trim();

      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      showToast("Downloaded " + filename);
    } catch (e) {
      console.error("Export zip error:", e);
      showToast("Export failed: " + e.message, true);
    } finally {
      if (btn) btn.textContent = oldText;
    }
  };"""
    content = content.replace(old_save_export, new_save_export, 1)

    # 6. Update exportAllProjectsZip
    old_export_all = """  window.exportAllProjectsZip = function() {
    window.location.href = "/api/projects/export-all";
  };"""
    new_export_all = """  window.exportAllProjectsZip = async function() {
    try {
      showToast("Generating master backup archive...");
      const res = await fetch("/api/projects/export-all");
      if (!res.ok) throw new Error("Server returned status " + res.status);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `ultron_all_projects_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      showToast("Master backup downloaded.");
    } catch (e) {
      showToast("Export all failed: " + e.message, true);
    }
  };"""
    content = content.replace(old_export_all, new_export_all, 1)

    with open("templates/antigravity.html", "w", encoding="utf-8") as f:
        f.write(content)

    print("[OK] Successfully patched templates/antigravity.html")

if __name__ == "__main__":
    patch()
