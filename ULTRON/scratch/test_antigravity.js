
(function() {
  let execution_state = { is_running: false, status_code: "idle", status: "Idle — Ready for prompt" };
  window.execution_state = execution_state;

  const state = {
    activeFolder: localStorage.getItem("ultron_active_folder") || "ULTRON",
    selectedModel: "ULTRON",
    selectedContext: "Local",
    activeProjectId: null,
    activeProject: null,
    activeView: "home",
    splitOpen: true,
    projects: [],
    folders: JSON.parse(localStorage.getItem("ultron_folders") || '["ULTRON"]'),
    folderOpenState: JSON.parse(localStorage.getItem("ultron_folder_open") || '{"ULTRON": true}'),
    filterQuery: "",
    isFilterActive: false,
    historyIndex: -1,
    pollTimer: null,
    isExecuting: false,
    executionState: execution_state
  };

  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

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
  }

  function init() {
    state.isExecuting = false;
    setupPromptInput();
    $("#activeFolderLabel").textContent = state.activeFolder;
    if (window.loadProjectsCatalog) window.loadProjectsCatalog();
    if (window.startStatePolling) window.startStatePolling();
    if (window.loadGovernanceRules) window.loadGovernanceRules();
    if (window.testEngineConnection) window.testEngineConnection();
  }

  let missionHistory = JSON.parse(localStorage.getItem('ultron_mission_history') || '[]');
  let missionHistoryIdx = -1;

  function setupPromptInput() {
    const input = $("#mainPromptInput");
    const sendBtn = $("#sendPromptBtn");
    const guardrail = $("#promptGuardrailNotice");

    if (sendBtn) {
      sendBtn.onclick = (e) => {
        e.preventDefault();
        submitPrompt();
      };
    }

    // 79. Draft autosave restore
    const savedDraft = localStorage.getItem('ultron_prompt_draft');
    if (savedDraft && input && !input.value) {
      input.value = savedDraft;
      if (sendBtn) sendBtn.classList.add("active");
    }

    if (!input) return;

    input.addEventListener("input", () => {
      // 71. Auto-growing textarea
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 180) + "px";
      const val = input.value.trim();

      // 79. Draft autosave
      localStorage.setItem('ultron_prompt_draft', input.value);

      // 76. Length/clarity guardrails
      if (guardrail) {
        if (val.length > 0 && val.length < 5) {
          guardrail.style.display = "block";
          guardrail.textContent = "⚠️ Notice: Goal is very brief. Ensure clear functional boundaries.";
        } else if (val.length > 2500) {
          guardrail.style.display = "block";
          guardrail.textContent = "⚠️ Notice: Prompt exceeds 2500 characters. Consider breaking down scope.";
        } else {
          guardrail.style.display = "none";
        }
      }

      // 73. Waveform trigger on typing
      triggerWaveformRipple();

      if (val.length > 0) {
        if (sendBtn) sendBtn.classList.add("active");
      } else {
        if (sendBtn) sendBtn.classList.remove("active");
      }
    });

    input.addEventListener("keydown", e => {
      // 74. Keyboard dispatch via Ctrl+Enter or plain Enter
      if ((e.key === "Enter" && e.ctrlKey) || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        if (input.value.trim().length > 0) {
          submitPrompt();
        }
      } else if (e.key === "ArrowUp") {
        // 75. Input history recall
        if (missionHistory.length > 0 && (missionHistoryIdx === -1 || input.selectionStart === 0)) {
          e.preventDefault();
          if (missionHistoryIdx < missionHistory.length - 1) {
            missionHistoryIdx++;
            input.value = missionHistory[missionHistory.length - 1 - missionHistoryIdx];
            input.dispatchEvent(new Event("input"));
          }
        }
      } else if (e.key === "ArrowDown") {
        if (missionHistoryIdx > 0) {
          e.preventDefault();
          missionHistoryIdx--;
          input.value = missionHistory[missionHistory.length - 1 - missionHistoryIdx];
          input.dispatchEvent(new Event("input"));
        } else if (missionHistoryIdx === 0) {
          e.preventDefault();
          missionHistoryIdx = -1;
          input.value = "";
          input.dispatchEvent(new Event("input"));
        }
      }
    });

    setupPromptWaveform();
  }

  // 73. Reactive Waveform Canvas
  let waveCtx = null;
  let wavePhase = 0;
  let waveEnergy = 0.2;
  function setupPromptWaveform() {
    const cvs = $("#promptWaveform");
    if (!cvs) return;
    waveCtx = cvs.getContext("2d");
    renderWaveform();
  }

  function triggerWaveformRipple() {
    waveEnergy = Math.min(waveEnergy + 0.35, 1.0);
  }

  function renderWaveform() {
    if (!waveCtx) return;
    const cvs = $("#promptWaveform");
    const w = cvs.width, h = cvs.height;
    waveCtx.clearRect(0, 0, w, h);
    wavePhase += 0.08;
    waveEnergy = Math.max(waveEnergy * 0.96, 0.15);

    waveCtx.beginPath();
    waveCtx.moveTo(0, h / 2);
    for (let x = 0; x < w; x += 3) {
      const y = (h / 2) + Math.sin(x * 0.2 + wavePhase) * (h * 0.38 * waveEnergy);
      waveCtx.lineTo(x, y);
    }
    waveCtx.strokeStyle = "#00ffcc";
    waveCtx.lineWidth = 1.6;
    waveCtx.stroke();
    requestAnimationFrame(renderWaveform);
  }

  // Load Projects from backend and sync dynamic folders
  window.loadProjectsCatalog = async function() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        state.projects = await res.json();
        // Dynamically discover any folders from loaded projects
        state.projects.forEach(p => {
          const f = p.folder || "ULTRON";
          if (!state.folders.includes(f)) {
            state.folders.push(f);
          }
        });
        localStorage.setItem("ultron_folders", JSON.stringify(state.folders));
      }
    } catch (e) {
      console.warn("Could not load backend projects:", e);
    }
    renderProjectsTree();
    renderFolderMenu();
  };

  // Render Projects Tree in Sidebar
  function renderProjectsTree() {
    const root = $("#projectsTreeRoot");
    root.innerHTML = "";

    if (!state.folders.includes(state.activeFolder)) {
      state.folders.unshift(state.activeFolder);
    }

    state.folders.forEach(folderName => {
      const folderProjects = state.projects.filter(p => (p.folder || "ULTRON") === folderName);
      
      const filtered = state.filterQuery 
        ? folderProjects.filter(p => (p.title || p.goal || '').toLowerCase().includes(state.filterQuery.toLowerCase()))
        : folderProjects;

      const isOpen = state.folderOpenState[folderName] !== false;

      const folderDiv = document.createElement("div");
      folderDiv.className = "tree-folder" + (isOpen ? " open" : "");

      const titleRow = document.createElement("div");
      titleRow.className = "folder-title-row";
      titleRow.onclick = () => {
        state.folderOpenState[folderName] = !folderDiv.classList.contains("open");
        folderDiv.classList.toggle("open");
        localStorage.setItem("ultron_folder_open", JSON.stringify(state.folderOpenState));
      };

      titleRow.innerHTML = `
        <svg class="folder-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span class="folder-name">${escapeHtml(folderName)}</span>
        <span style="font-size:10px;color:var(--text-muted);">${folderProjects.length}</span>
      `;
      folderDiv.appendChild(titleRow);

      const itemsDiv = document.createElement("div");
      itemsDiv.className = "folder-items";

      if (filtered.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.style.padding = "5px 8px";
        emptyDiv.style.fontSize = "11px";
        emptyDiv.style.color = "var(--text-muted)";
        emptyDiv.style.fontStyle = "italic";
        emptyDiv.textContent = state.filterQuery ? "No matching conversations" : "No conversations yet";
        itemsDiv.appendChild(emptyDiv);
      } else {
        filtered.forEach(p => {
          const itDiv = document.createElement("div");
          const isActive = state.activeProjectId === p.id;
          itDiv.className = "tree-item" + (isActive ? " active" : "");
          itDiv.onclick = (e) => {
            e.stopPropagation();
            openProjectConversation(p);
          };

          const dotHtml = isActive ? `<span class="active-indicator-dot"></span>` : "";
          const timeHtml = p.relative_time_str ? `<span>${p.relative_time_str}</span>` : "";

          itDiv.innerHTML = `
            <span class="tree-item-title" title="${escapeHtml(p.title || p.goal)}">${escapeHtml(p.title || p.goal)}</span>
            <div class="tree-item-meta">
              ${timeHtml}
              ${dotHtml}
            </div>
          `;
          itemsDiv.appendChild(itDiv);
        });
      }

      folderDiv.appendChild(itemsDiv);
      root.appendChild(folderDiv);
    });
  }

  // Render Folder Selector Popover
  function renderFolderMenu() {
    const menu = $("#folderMenu");
    if (!menu) return;
    menu.innerHTML = "";

    state.folders.forEach(f => {
      const item = document.createElement("div");
      item.className = "popover-item" + (state.activeFolder === f ? " active" : "");
      item.onclick = () => selectFolder(f);
      item.innerHTML = `<span>📁 ${escapeHtml(f)}</span>`;
      menu.appendChild(item);
    });

    const divider = document.createElement("div");
    divider.style.borderTop = "1px solid var(--border-subtle)";
    divider.style.margin = "4px 0";
    menu.appendChild(divider);

    const addNew = document.createElement("div");
    addNew.className = "popover-item";
    addNew.onclick = () => promptNewFolder();
    addNew.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Create New Folder...</span>`;
    menu.appendChild(addNew);
  }

  // Open Project Conversation
  window.openProjectConversation = async function(proj) {
    state.activeProjectId = proj.id;
    state.activeProject = proj;
    state.activeView = "conversation";
    $("#homeView").style.display = "none";
    $("#conversationView").classList.add("active");
    $("#convTitle").textContent = proj.title || proj.goal;

    renderProjectsTree();

    try {
      const res = await fetch(`/api/projects/${proj.id}`);
      if (res.ok) {
        const fullProj = await res.json();
        state.activeProject = fullProj;
        renderProjectChatStream(fullProj);
        updateSplitViewWithProject(fullProj);
      }
    } catch (e) {
      console.error("Failed to load project details:", e);
    }
  };

  // Render Chat Messages from Loaded Project
  function renderProjectChatStream(proj) {
    const stream = $("#chatStream");
    stream.innerHTML = "";

    // 1. Initial Prompt
    const userMsg = document.createElement("div");
    userMsg.className = "msg-user";
    userMsg.innerHTML = `
      <div class="msg-avatar">U</div>
      <div class="msg-content">
        <span class="msg-author">You</span>
        <div class="msg-bubble">${escapeHtml(proj.goal || proj.title)}</div>
      </div>
    `;
    stream.appendChild(userMsg);

    // 2. Boss Verification Block
    const agentBlock = document.createElement("div");
    agentBlock.className = "agent-step-card open";
    agentBlock.innerHTML = `
      <div class="agent-step-header" onclick="this.parentElement.classList.toggle('open')">
        <div class="step-label">
          <span>⚡ Boss Approval & Verification</span>
          <span class="step-badge">SUCCESS</span>
        </div>
        <span style="font-size:11px;color:var(--text-muted);">${proj.version ? 'v' + proj.version : 'v1.0'}</span>
      </div>
      <div class="agent-step-body">
        <p><strong>Logical Tree:</strong> Fully verified and mapped across frontend and backend domains.</p>
        <p><strong>DOM Readiness:</strong> Interactive sandbox verified and deployed to sandbox.</p>
      </div>
    `;
    stream.appendChild(agentBlock);

    // 3. Iterative chat history
    if (proj.chat && proj.chat.length > 0) {
      proj.chat.forEach(msg => {
        if (msg.sender === "user") {
          const uDiv = document.createElement("div");
          uDiv.className = "msg-user";
          uDiv.innerHTML = `
            <div class="msg-avatar">U</div>
            <div class="msg-content">
              <span class="msg-author">You</span>
              <div class="msg-bubble">${escapeHtml(msg.text)}</div>
            </div>
          `;
          stream.appendChild(uDiv);
        } else {
          if (msg.version_created || msg.type === "code_update") {
            const aDiv = document.createElement("div");
            aDiv.className = "agent-step-card open";
            aDiv.innerHTML = `
              <div class="agent-step-header" onclick="this.parentElement.classList.toggle('open')">
                <div class="step-label">
                  <span>⚡ ULTRON Evolution Engine</span>
                  <span class="step-badge">${msg.version_created ? 'v' + msg.version_created : 'UPDATE'}</span>
                </div>
              </div>
              <div class="agent-step-body">${escapeHtml(msg.text)}</div>
            `;
            stream.appendChild(aDiv);
          } else {
            const cDiv = document.createElement("div");
            cDiv.className = "msg-assistant";
            cDiv.innerHTML = `
              <div class="msg-avatar ultron-avatar">⚡</div>
              <div class="msg-content">
                <span class="msg-author">ULTRON</span>
                <div class="msg-bubble">${renderMarkdown(msg.text)}</div>
              </div>
            `;
            stream.appendChild(cDiv);
          }
        }
      });
    }

    stream.scrollTop = stream.scrollHeight;
  }

  function updateSplitViewWithProject(proj) {
    if (proj.id) {
      $("#sandboxIframe").src = `/projects/${proj.id}/app?t=${Date.now()}`;
      $("#sandboxStatusUrl").textContent = `http://127.0.0.1:8000/projects/${proj.id}/app`;
      $("#sandboxVerLabel").textContent = "v" + (proj.version || "1.0");
    }

    if (proj.logical_tree) {
      renderTreeNodes(proj.logical_tree);
    }

    $("#permSaveLabel").textContent = proj.is_permanent ? "⭐ Permanent" : "💾 Save";
  }

  let currentRawTreeData = null;
  let treeRawMode = false;

  window.toggleRawTree = function() {
    treeRawMode = !treeRawMode;
    const treeViewer = $("#treeViewer");
    const rawViewer = $("#treeRawJsonViewer");
    const btn = $("#rawTreeToggleBtn");
    if (treeRawMode) {
      treeViewer.style.display = "none";
      rawViewer.style.display = "block";
      rawViewer.textContent = JSON.stringify(currentRawTreeData || {}, null, 2);
      if (btn) btn.textContent = "🌳 Visual Tree";
    } else {
      treeViewer.style.display = "block";
      rawViewer.style.display = "none";
      if (btn) btn.textContent = "{ } Raw JSON";
    }
  };

  window.filterTreeNodes = function(query) {
    const q = (query || "").toLowerCase();
    const blocks = document.querySelectorAll("#treeViewer .tree-node-block");
    blocks.forEach(b => {
      const text = b.textContent.toLowerCase();
      b.style.display = (!q || text.includes(q)) ? "block" : "none";
    });
  };

  window.exportTreeSpec = function() {
    if (!currentRawTreeData) {
      alert("No active tree to export.");
      return;
    }
    const spec = JSON.stringify(currentRawTreeData, null, 2);
    const blob = new Blob([spec], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logical_tree_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function renderTreeNodes(tree) {
    currentRawTreeData = tree;
    const container = $("#treeViewer");
    if (!tree) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">No logical tree data available.</div>`;
      return;
    }

    let html = "";
    if (tree.intent) {
      html += `
        <details open class="tree-node-block" style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;">
          <summary class="tree-node-title" style="cursor:pointer;font-weight:600;color:#00ffcc;user-select:none;">🎯 Intent & Constraints</summary>
          <div class="tree-node-items" style="margin-top:8px;padding-left:8px;border-left:2px solid rgba(0,255,204,0.3);color:var(--text-secondary);font-size:13px;">${escapeHtml(tree.intent)}</div>
        </details>
      `;
    }

    if (tree.screens && tree.screens.length > 0) {
      html += `
        <details open class="tree-node-block" style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;">
          <summary class="tree-node-title" style="cursor:pointer;font-weight:600;color:#3b82f6;user-select:none;">🖥️ Screens & UI Views (${tree.screens.length})</summary>
          <div class="tree-node-items" style="margin-top:8px;padding-left:8px;border-left:2px solid rgba(59,130,246,0.3);font-size:13px;">
            ${tree.screens.map(s => `<div class="tree-node-click" onclick="highlightTreeNode('${escapeHtml(s.name || s.id)}', 'code')" style="margin-bottom:4px;cursor:pointer;padding:2px 4px;border-radius:4px;transition:background 0.15s;" onmouseover="this.style.background='rgba(59,130,246,0.15)'" onmouseout="this.style.background='transparent'"><strong>${escapeHtml(s.name || s.id)}:</strong> <span style="color:var(--text-muted);">${escapeHtml(s.purpose || s.details || '')}</span> <span style="font-size:10px;color:#3b82f6;margin-left:4px;">↗ View Code</span></div>`).join('')}
          </div>
        </details>
      `;
    }

    if (tree.features && tree.features.length > 0) {
      html += `
        <details open class="tree-node-block" style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;">
          <summary class="tree-node-title" style="cursor:pointer;font-weight:600;color:#a855f7;user-select:none;">✨ Key Features (${tree.features.length})</summary>
          <div class="tree-node-items" style="margin-top:8px;padding-left:8px;border-left:2px solid rgba(168,85,247,0.3);font-size:13px;">
            ${tree.features.map(f => `<div class="tree-node-click" onclick="highlightTreeNode('${escapeHtml(f.name || f.id)}', 'code')" style="margin-bottom:4px;cursor:pointer;padding:2px 4px;border-radius:4px;transition:background 0.15s;" onmouseover="this.style.background='rgba(168,85,247,0.15)'" onmouseout="this.style.background='transparent'">• <strong>${escapeHtml(f.name || f.id)}:</strong> <span style="color:var(--text-muted);">${escapeHtml(f.details || '')}</span> <span style="font-size:10px;color:#a855f7;margin-left:4px;">↗ View Code</span></div>`).join('')}
          </div>
        </details>
      `;
    }

    if (tree.verification && tree.verification.length > 0) {
      html += `
        <details open class="tree-node-block" style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px;">
          <summary class="tree-node-title" style="cursor:pointer;font-weight:600;color:#10b981;user-select:none;">🛡️ DOM Verification & Checks (${tree.verification.length})</summary>
          <div class="tree-node-items" style="margin-top:8px;padding-left:8px;border-left:2px solid rgba(16,185,129,0.3);font-size:13px;">
            ${tree.verification.map(v => `<div class="tree-node-click" onclick="highlightTreeNode('${escapeHtml(v.check || v.id)}', 'logs')" style="margin-bottom:4px;color:#34d399;cursor:pointer;padding:2px 4px;border-radius:4px;transition:background 0.15s;" onmouseover="this.style.background='rgba(16,185,129,0.15)'" onmouseout="this.style.background='transparent'">✓ ${escapeHtml(v.check || v.id)} <span style="font-size:10px;color:#10b981;margin-left:4px;">↗ View Telemetry</span></div>`).join('')}
          </div>
        </details>
      `;
    }

    container.innerHTML = html || `<div style="color:var(--text-muted);font-size:12px;">Structured tree empty.</div>`;
    if (treeRawMode && $("#treeRawJsonViewer")) {
      $("#treeRawJsonViewer").textContent = JSON.stringify(tree, null, 2);
    }
  }

  // Procedural Sound Synthesizer via native Web Audio API
  let audioCtx = null;
  let audioEnabled = false;

  window.toggleAudio = function() {
    audioEnabled = !audioEnabled;
    const icon = $("#audioIcon");
    if (icon) icon.textContent = audioEnabled ? "🔊" : "🔇";
    if (audioEnabled && !audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {}
    }
    if (audioEnabled) playTone(440, 'sine', 0.12);
  };

  function playTone(freq, type='sine', duration=0.1) {
    if (!audioEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
  }

  // Left Nav Rail View Switcher
  window.switchNavView = function(viewName) {
    document.querySelectorAll(".nav-rail-item").forEach(item => item.classList.remove("active"));
    const btn = $(`#navBtn${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`);
    if (btn) btn.classList.add("active");

    if (viewName === "command") {
      state.activeView = state.activeProjectId ? "conversation" : "home";
      if (state.activeProjectId) {
        $("#conversationView").classList.add("active");
        $("#homeView").style.display = "none";
      } else {
        $("#homeView").style.display = "flex";
        $("#conversationView").classList.remove("active");
      }
    } else if (viewName === "projects") {
      openHistoryModal();
    } else if (viewName === "agents") {
      if (typeof switchTab === 'function') switchTab('tabTree');
    } else if (viewName === "activity") {
      if (typeof switchTab === 'function') switchTab('tabLogs');
    } else if (viewName === "settings") {
      openSettingsModal();
    }
    playTone(600, 'sine', 0.08);
  };

  // Keyboard Navigation for Nav Rail (1-5 or Alt+1-5)
  document.addEventListener("keydown", function(e) {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.altKey || !e.ctrlKey) {
      if (e.key === "1" || (e.altKey && e.key === "1")) { switchNavView("command"); }
      else if (e.key === "2" || (e.altKey && e.key === "2")) { switchNavView("projects"); }
      else if (e.key === "3" || (e.altKey && e.key === "3")) { switchNavView("agents"); }
      else if (e.key === "4" || (e.altKey && e.key === "4")) { switchNavView("activity"); }
      else if (e.key === "5" || (e.altKey && e.key === "5")) { switchNavView("settings"); }
    }
  });

  // Switch to New Conversation (Home view)
  window.openNewConversation = function() {
    state.activeProjectId = null;
    state.activeProject = null;
    state.activeView = "home";
    state.isExecuting = false;
    if (execution_state) execution_state.is_running = false;
    $("#homeView").style.display = "flex";
    $("#conversationView").classList.remove("active");
    if ($("#topActiveProjName")) $("#topActiveProjName").textContent = "No Project";
    const input = $("#mainPromptInput");
    if (input) {
      input.value = "";
      input.style.height = "auto";
    }
    const sendBtn = $("#sendPromptBtn");
    if (sendBtn) sendBtn.classList.remove("active");
    renderProjectsTree();
    setTimeout(() => { if (input) input.focus(); }, 50);
  };

  // Submit Prompt to Launch Autonomous Execution
  window.submitPrompt = async function() {
    const input = $("#mainPromptInput");
    const goal = input ? input.value.trim() : "";
    if (!goal) return;

    // 78. Mid-run edit lock: only block if server execution is actively in progress
    if (execution_state && execution_state.is_running) {
      showToast("An execution run is already actively in progress. Please wait for completion or click reset.", true);
      return;
    }

    // 75. Input history record
    missionHistory.push(goal);
    try {
      localStorage.setItem('ultron_mission_history', JSON.stringify(missionHistory.slice(-50)));
    } catch(e) {}
    missionHistoryIdx = -1;

    // 79. Clear autosaved draft
    try {
      localStorage.removeItem('ultron_prompt_draft');
    } catch(e) {}

    state.isExecuting = true;
    if (execution_state) execution_state.is_running = true;

    state.activeView = "conversation";
    $("#homeView").style.display = "none";
    $("#conversationView").classList.add("active");
    $("#convTitle").textContent = goal;
    // 77. Submit-state feedback
    $("#convStatusBadge").textContent = "SUBMITTED — REASONING STARTED";
    $("#convStatusBadge").className = "status-badge running";
    if ($("#topActiveProjName")) $("#topActiveProjName").textContent = goal;

    const stream = $("#chatStream");
    stream.innerHTML = `
      <div class="msg-user">
        <div class="msg-avatar">U</div>
        <div class="msg-content">
          <span class="msg-author">You</span>
          <div class="msg-bubble">${escapeHtml(goal)}</div>
        </div>
      </div>
      <div class="agent-step-card open" id="activeAgentCard">
        <div class="agent-step-header">
          <div class="step-label">
            <span>⚡ Boss Goal Evaluation</span>
            <span class="step-badge" id="activeStepBadge">RUNNING</span>
          </div>
        </div>
        <div class="agent-step-body" id="activeStepBody">
          Initiating multi-agent workflow in <strong>${escapeHtml(state.activeFolder || "ULTRON")}</strong>...
        </div>
      </div>
    `;

    const useMock = state.selectedContext === "Mock Mode";

    // 80. Console-to-Boss direct link: sends goal to /api/run which invokes boss node
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal: goal, 
          mock: useMock,
          folder: state.activeFolder || "ULTRON"
        })
      });
      if (res.ok) {
        state.isExecuting = true;
      } else {
        state.isExecuting = false;
        if (execution_state) execution_state.is_running = false;
        const err = await res.json().catch(() => ({ message: "Failed to launch execution" }));
        showToast(err.message || "Failed to launch execution", true);
      }
    } catch (e) {
      state.isExecuting = false;
      if (execution_state) execution_state.is_running = false;
      console.error("Execution error:", e);
      showToast("Network connection error: " + e.message, true);
    }
  };

  // Submit Iterative Follow-up Request
  window.submitFollowUp = async function() {
    const input = $("#followUpInput");
    const prompt = input.value.trim();
    if (!prompt) return;

    input.value = "";

    const stream = $("#chatStream");
    const uDiv = document.createElement("div");
    uDiv.className = "msg-user";
    uDiv.innerHTML = `
      <div class="msg-avatar">U</div>
      <div class="msg-content">
        <span class="msg-author">You</span>
        <div class="msg-bubble">${escapeHtml(prompt)}</div>
      </div>
    `;
    stream.appendChild(uDiv);

    // Show thinking / chatbot typing indicator
    const pendingDiv = document.createElement("div");
    pendingDiv.id = "pendingAssistantMsg";
    pendingDiv.className = "msg-assistant";
    pendingDiv.innerHTML = `
      <div class="msg-avatar ultron-avatar">⚡</div>
      <div class="msg-content">
        <span class="msg-author">ULTRON</span>
        <div class="msg-bubble">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    `;
    stream.appendChild(pendingDiv);
    stream.scrollTop = stream.scrollHeight;

    const pid = state.activeProjectId || "current";
    try {
      const res = await fetch(`/api/projects/${pid}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt, mock: state.selectedContext === "Mock Mode" })
      });

      const pending = $("#pendingAssistantMsg");
      if (pending) pending.remove();

      if (res.ok) {
        const data = await res.json();
        if (data.project && data.project.id) {
          state.activeProjectId = data.project.id;
          state.activeProject = data.project;
        }

        if (data.type === "code_update") {
          // Code update: render evolution card & update sandbox
          const aCard = document.createElement("div");
          aCard.className = "agent-step-card open";
          aCard.innerHTML = `
            <div class="agent-step-header" onclick="this.parentElement.classList.toggle('open')">
              <div class="step-label">
                <span>⚡ ULTRON Evolution Engine</span>
                <span class="step-badge">v${data.project.version}</span>
              </div>
            </div>
            <div class="agent-step-body">${escapeHtml(data.summary || data.reply || "Code updated.")}</div>
          `;
          stream.appendChild(aCard);
          updateSplitViewWithProject(data.project);
          showToast(`Updated application to v${data.project.version}`);
        } else {
          // Conversational chat: render assistant bubble
          const aDiv = document.createElement("div");
          aDiv.className = "msg-assistant";
          aDiv.innerHTML = `
            <div class="msg-avatar ultron-avatar">⚡</div>
            <div class="msg-content">
              <span class="msg-author">ULTRON</span>
              <div class="msg-bubble">${renderMarkdown(data.reply || data.summary || "I'm here to assist you.")}</div>
            </div>
          `;
          stream.appendChild(aDiv);
        }
      } else {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        const errDiv = document.createElement("div");
        errDiv.className = "msg-assistant";
        errDiv.innerHTML = `
          <div class="msg-avatar ultron-avatar">⚡</div>
          <div class="msg-content">
            <span class="msg-author">ULTRON</span>
            <div class="msg-bubble" style="color:#fca5a5;">Error: ${escapeHtml(err.message || 'Failed')}</div>
          </div>
        `;
        stream.appendChild(errDiv);
      }
    } catch (e) {
      const pending = $("#pendingAssistantMsg");
      if (pending) pending.remove();
      const errDiv = document.createElement("div");
      errDiv.className = "msg-assistant";
      errDiv.innerHTML = `
        <div class="msg-avatar ultron-avatar">⚡</div>
        <div class="msg-content">
          <span class="msg-author">ULTRON</span>
          <div class="msg-bubble" style="color:#fca5a5;">Network error: ${escapeHtml(e.message)}</div>
        </div>
      `;
      stream.appendChild(errDiv);
    }
    stream.scrollTop = stream.scrollHeight;
  };

  // State Polling Loop (LangGraph State & Live Updates)
  function startStatePolling() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(pollServerState, 1500);
  }

  async function pollServerState() {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) return;
      const data = await res.json();
      execution_state = data;
      window.execution_state = data;
      state.executionState = data;
      state.isExecuting = !!data.is_running;

      const badge = $("#convStatusBadge");
      if (badge && data.status_code) {
        badge.textContent = data.status_code.toUpperCase();
        if (data.is_running) {
          badge.className = "status-badge running";
        } else if (data.status_code === "approved") {
          badge.className = "status-badge approved";
        } else if (data.status_code === "clarifying") {
          badge.className = "status-badge clarifying";
        } else {
          badge.className = "status-badge";
        }
      }

      if (data.status_code === "approved") {
        const stepBadge = $("#activeStepBadge");
        if (stepBadge) {
          stepBadge.textContent = "COMPLETED";
          stepBadge.className = "step-badge approved";
        }
        const stepBody = $("#activeStepBody");
        if (stepBody && stepBody.textContent.includes("Initiating multi-agent workflow")) {
          stepBody.innerHTML = `Multi-agent synthesis complete! Boss approved release. App ready in sandbox.`;
        }
      }

      if (data.status_code === "clarifying") {
        pollClarification();
      } else {
        $("#clarificationAnchor").innerHTML = "";
      }

      if (data.active_project_id && (!state.activeProjectId || state.activeProjectId !== data.active_project_id)) {
        state.activeProjectId = data.active_project_id;
        loadProjectsCatalog();
        reloadSandboxIframe();
      }

      pollLogs();
    } catch (e) {}
  }

  async function pollClarification() {
    try {
      const res = await fetch("/api/clarification");
      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          const anchor = $("#clarificationAnchor");
          anchor.innerHTML = `
            <div class="clarification-box">
              <div class="clarification-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Boss Clarification Required</span>
              </div>
              <div class="clarification-question">${escapeHtml(data.question)}</div>
              <div class="clarification-input-row">
                <input type="text" class="clarification-input" id="clarificationInput" placeholder="Provide requested clarification..." onkeydown="if(event.key==='Enter') submitClarification();">
                <button class="btn-clarify-submit" onclick="submitClarification()">Resume Execution</button>
              </div>
            </div>
          `;
        }
      }
    } catch (e) {}
  }

  window.submitClarification = async function() {
    const input = $("#clarificationInput");
    if (!input || !input.value.trim()) return;
    const resp = input.value.trim();

    try {
      await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: resp })
      });
      $("#clarificationAnchor").innerHTML = "";
    } catch (e) {
      alert("Failed to submit clarification");
    }
  };

  /* ============================================================
     RIGHT INTEL DECK CONTROLLER (Items 96-120: 5 Modes)
  ============================================================ */
  state.telemetryLogs = [];
  state.activeTelemetryFilter = "ALL";
  state.currentProjectCode = "";
  state.governanceRules = {
    scope: true,
    sandbox: true,
    verification: true,
    zero_placeholder: true,
    added: []
  };

  async function pollLogs() {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        state.telemetryLogs = await res.json();
        renderTelemetryLogs();
      }
    } catch (e) {}
  }

  function renderTelemetryLogs() {
    const viewer = $("#logsViewer");
    if (!viewer) return;
    const filter = state.activeTelemetryFilter || "ALL";
    let list = state.telemetryLogs || [];

    if (filter !== "ALL") {
      list = list.filter(l => (l.node || "SYSTEM").toUpperCase() === filter.toUpperCase());
    }

    if (list.length === 0) {
      viewer.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">No telemetry records for filter [${filter}].</div>`;
      return;
    }

    const badgeColors = {
      BOSS: "rgba(0,255,204,0.15);color:#00ffcc;border:1px solid rgba(0,255,204,0.3)",
      PLANNER: "rgba(59,130,246,0.15);color:#3b82f6;border:1px solid rgba(59,130,246,0.3)",
      COORDINATOR: "rgba(168,85,247,0.15);color:#a855f7;border:1px solid rgba(168,85,247,0.3)",
      WORKER: "rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3)",
      ERROR: "rgba(239,68,68,0.2);color:#ef4444;border:1px solid rgba(239,68,68,0.4)",
      SYSTEM: "rgba(161,161,170,0.15);color:#a1a1aa;border:1px solid rgba(161,161,170,0.3)"
    };

    viewer.innerHTML = list.map(l => {
      const node = (l.node || "SYSTEM").toUpperCase();
      const style = badgeColors[node] || badgeColors.SYSTEM;
      const ts = l.timestamp || new Date().toLocaleTimeString();
      // Check for violation alerts
      if (node === "ERROR" || (l.stage && l.stage.toLowerCase().includes("violation"))) {
        surfaceRuleViolation(l.stage, l.body);
      }
      return `
        <div class="telemetry-entry" data-node="${node}" style="padding:6px 8px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:4px;font-size:11.5px;line-height:1.4;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="color:#71717a;font-size:10px;">[${escapeHtml(ts)}]</span>
            <span style="font-size:9.5px;padding:1px 5px;border-radius:3px;font-weight:bold;${style}">${escapeHtml(node)}</span>
            <strong style="color:#e4e4e7;font-size:11px;">${escapeHtml(l.stage || 'Event')}</strong>
          </div>
          <div style="color:#a1a1aa;white-space:pre-wrap;font-family:monospace;font-size:11px;">${escapeHtml(l.body || '')}</div>
        </div>
      `;
    }).join("");
  }

  // 112: Log filtering by node
  window.filterLogsByNode = function(node) {
    state.activeTelemetryFilter = node;
    $$("#telemetryFilterButtons button").forEach(b => {
      b.classList.toggle("active", b.dataset.node === node);
    });
    renderTelemetryLogs();
  };

  // 113: Log export
  window.exportTelemetryLogs = function() {
    const list = state.telemetryLogs || [];
    const text = list.map(l => `[${l.timestamp || ''}] [${(l.node || 'SYSTEM').toUpperCase()}] ${l.stage}:\n${l.body}\n`).join("\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ultron_telemetry_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Telemetry stream exported");
  };

  // 104-108: Code Inspector Tab
  window.fetchProjectCode = async function() {
    const pre = $("#codeInspectorPre");
    const pathEl = $("#codeFilePath");
    const countEl = $("#codeLineCount");
    if (!pre) return;

    try {
      let code = "";
      let path = "domains/web_ui/index.html";
      if (state.activeProjectId) {
        const res = await fetch(`/api/projects/${state.activeProjectId}`);
        if (res.ok) {
          const d = await res.json();
          code = d.code || "";
          path = `projects/${d.id}/index.html`;
        }
      }
      if (!code) {
        const res = await fetch("/web_ui/index.html");
        if (res.ok) {
          code = await res.text();
        }
      }
      state.currentProjectCode = code || "<!-- No code synthesized yet -->";
      const lines = state.currentProjectCode.split("\n").length;
      if (pathEl) pathEl.textContent = path;
      if (countEl) countEl.textContent = `${lines} lines`;
      pre.textContent = state.currentProjectCode;
    } catch (e) {
      pre.textContent = "<!-- Error loading code: " + e.message + " -->";
    }
  };

  // 107: Real-time search/filter in code
  window.filterCodeInspector = function(query) {
    const pre = $("#codeInspectorPre");
    if (!pre || !state.currentProjectCode) return;
    const q = (query || "").trim();
    if (!q) {
      pre.textContent = state.currentProjectCode;
      return;
    }
    const escaped = escapeHtml(state.currentProjectCode);
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi");
    const highlighted = escaped.replace(regex, m => `<mark style="background:#f59e0b;color:#000;border-radius:2px;padding:0 2px;">${m}</mark>`);
    pre.innerHTML = highlighted;
  };

  // 108: One-click clipboard copy
  window.copyCodeInspector = function() {
    const code = state.currentProjectCode || ($("#codeInspectorPre") ? $("#codeInspectorPre").textContent : "");
    if (!code) {
      showToast("No code to copy", true);
      return;
    }
    navigator.clipboard.writeText(code).then(() => {
      showToast("📋 Code copied to clipboard!");
    }).catch(() => {
      showToast("Clipboard copy failed", true);
    });
  };

  // 98: Tree node click-through
  window.highlightTreeNode = function(keyword, targetTab) {
    if (targetTab === "code") {
      switchSplitTab("code");
      setTimeout(() => {
        const input = $("#codeSearchInput");
        if (input) {
          input.value = keyword;
          filterCodeInspector(keyword);
        }
        showToast(`Navigated to Code: highlighted "${keyword}"`);
      }, 100);
    } else {
      switchSplitTab("logs");
      setTimeout(() => {
        filterLogsByNode("ALL");
        showToast(`Navigated to Telemetry: "${keyword}"`);
      }, 100);
    }
  };

  // 99-103: Evolution Deck
  window.renderEvolutionDeck = async function() {
    const stream = $("#evolutionChatStream");
    const badge = $("#evolutionVersionBadge");
    if (!stream) return;

    if (state.activeProjectId) {
      try {
        const res = await fetch(`/api/projects/${state.activeProjectId}`);
        if (res.ok) {
          const proj = await res.json();
          if (badge) badge.textContent = proj.version ? `v${proj.version}` : "v1.0";
          
          let html = "";
          html += `
            <div class="msg-user" style="display:flex;gap:8px;align-items:flex-start;">
              <div class="msg-avatar" style="width:24px;height:24px;background:#3b82f6;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;">U</div>
              <div style="background:rgba(255,255,255,0.06);padding:8px 12px;border-radius:6px;font-size:12px;color:#fff;flex:1;">
                <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px;">Operator (Initial Goal)</div>
                <div>${escapeHtml(proj.goal || proj.title || '')}</div>
              </div>
            </div>
          `;

          if (proj.chat && proj.chat.length > 0) {
            proj.chat.forEach(msg => {
              const isUser = msg.sender === "user";
              html += `
                <div class="${isUser ? 'msg-user' : 'msg-assistant'}" style="display:flex;gap:8px;align-items:flex-start;${isUser ? '' : 'flex-direction:row-reverse;'}">
                  <div class="msg-avatar ${isUser ? '' : 'ultron-avatar'}" style="width:24px;height:24px;background:${isUser ? '#3b82f6' : '#00ffcc'};color:${isUser ? '#fff' : '#000'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;">
                    ${isUser ? 'U' : '⚡'}
                  </div>
                  <div style="background:${isUser ? 'rgba(255,255,255,0.06)' : 'rgba(0,255,204,0.08)'};border:1px solid ${isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,255,204,0.2)'};padding:8px 12px;border-radius:6px;font-size:12px;color:#fff;flex:1;">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:2px;">
                      <span>${isUser ? 'Operator' : 'ULTRON'}</span>
                      ${msg.version_created ? `<span class="step-badge" style="font-size:9px;color:#00ffcc;">v${msg.version_created}</span>` : ''}
                    </div>
                    <div style="white-space:pre-wrap;">${escapeHtml(msg.text || '')}</div>
                  </div>
                </div>
              `;
            });
          }
          stream.innerHTML = html;
          loadSuggestionChips(proj.id);
          return;
        }
      } catch (e) {}
    }
    loadSuggestionChips(null);
  };

  // 102: Proactive suggestion chips
  window.loadSuggestionChips = async function(projectId) {
    const container = $("#deckSuggestionChips");
    if (!container) return;

    let suggestions = [
      "✨ Add Dark / Cyberpunk Theme Toggle",
      "📊 Add Real-Time Data Visualization",
      "💾 Add LocalStorage State Persistence",
      "🔍 Add Search & Filter Controls",
      "📥 Add CSV / JSON Data Export"
    ];

    if (projectId) {
      try {
        const res = await fetch(`/api/projects/${projectId}/suggestions`);
        if (res.ok) {
          const d = await res.json();
          if (d.suggestions && d.suggestions.length > 0) {
            suggestions = d.suggestions;
          }
        }
      } catch (e) {}
    }

    container.innerHTML = suggestions.map(s => `
      <button class="suggestion-chip" onclick="applySuggestionChip('${escapeHtml(s)}')" style="white-space:nowrap;padding:4px 10px;background:rgba(0,255,204,0.08);border:1px solid rgba(0,255,204,0.25);border-radius:12px;color:#00ffcc;font-size:10.5px;cursor:pointer;transition:all 0.15s;">
        ${escapeHtml(s)}
      </button>
    `).join("");
  };

  // 103: One-click chip apply
  window.applySuggestionChip = function(text) {
    const input = $("#followUpInput");
    const deckInput = $("#deckEvolutionInput");
    if (input) input.value = text;
    if (deckInput) deckInput.value = text;
    submitFollowUp();
  };

  window.submitDeckEvolution = function() {
    const deckInput = $("#deckEvolutionInput");
    if (!deckInput || !deckInput.value.trim()) return;
    const text = deckInput.value.trim();
    const input = $("#followUpInput");
    if (input) input.value = text;
    deckInput.value = "";
    submitFollowUp();
  };

  // 114-120: Rules Tab Controller
  window.fetchDeckRules = async function() {
    try {
      const res = await fetch("/api/rules");
      if (res.ok) {
        const d = await res.json();
        const container = $("#deckRulesListContainer");
        if (!container) return;
        const added = d.added || [];
        if (added.length === 0) {
          container.innerHTML = `<div style="color:var(--text-muted);font-size:11px;">No custom guardrail rules active.</div>`;
          return;
        }
        container.innerHTML = added.map(r => {
          const isConcern = r.status === "concern";
          return `
            <div style="padding:6px 10px;background:${isConcern ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)'};border:1px solid ${isConcern ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'};border-radius:6px;font-size:11.5px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <strong style="color:${isConcern ? '#ef4444' : '#00ffcc'};font-size:10.5px;">${escapeHtml(r.id)}</strong>
                <span class="step-badge" style="font-size:9px;color:${isConcern ? '#ef4444' : '#10b981'};">${escapeHtml((r.status || 'ACTIVE').toUpperCase())}</span>
              </div>
              <div style="color:#e4e4e7;">${escapeHtml(r.text)}</div>
              ${r.concern ? `<div style="color:#f87171;font-size:10.5px;margin-top:2px;">⚠️ ${escapeHtml(r.concern)}</div>` : ''}
            </div>
          `;
        }).join("");
      }
    } catch (e) {}
  };

  window.toggleGovernanceRule = function(ruleKey, isChecked) {
    state.governanceRules[ruleKey] = isChecked;
    showToast(`Guardrail Rule [${ruleKey}] ${isChecked ? 'ENABLED' : 'DISABLED'}`);
  };

  window.addNewGuardrailRuleFromDeck = async function() {
    const input = $("#deckNewRuleInput");
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    try {
      const res = await fetch("/api/rules/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        input.value = "";
        showToast("New guardrail rule submitted for review");
        fetchDeckRules();
      }
    } catch (e) {
      showToast("Failed to add rule: " + e.message, true);
    }
  };

  window.surfaceRuleViolation = function(title, msg) {
    const banner = $("#rulesViolationAlert");
    const tEl = $("#rulesViolationTitle");
    const mEl = $("#rulesViolationMsg");
    if (banner && tEl && mEl) {
      tEl.textContent = title || "Security Rule Violation";
      mEl.textContent = msg || "Guardrail safety boundary violation detected.";
      banner.style.display = "block";
    }
  };

  window.toggleSplitPanel = function() {
    state.splitOpen = !state.splitOpen;
    const panel = $("#splitPanel");
    const btn = $("#toggleSplitBtn");
    if (state.splitOpen) {
      panel.classList.remove("closed");
      if (btn) btn.classList.add("active-preview");
    } else {
      panel.classList.add("closed");
      if (btn) btn.classList.remove("active-preview");
    }
  };

  window.switchSplitTab = function(tabName) {
    $$(".split-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tab === tabName);
    });
    $("#tabContentSandbox").classList.toggle("active", tabName === "sandbox");
    $("#tabContentReactor").classList.toggle("active", tabName === "reactor");
    $("#tabContentTree").classList.toggle("active", tabName === "tree");
    $("#tabContentEvolution").classList.toggle("active", tabName === "evolution");
    $("#tabContentCode").classList.toggle("active", tabName === "code");
    $("#tabContentLogs").classList.toggle("active", tabName === "logs");
    $("#tabContentRules").classList.toggle("active", tabName === "rules");

    if (tabName === "reactor") {
      resizeReactorCanvas();
    } else if (tabName === "tree") {
      fetchTreeData();
    } else if (tabName === "evolution") {
      renderEvolutionDeck();
    } else if (tabName === "code") {
      fetchProjectCode();
    } else if (tabName === "logs") {
      pollLogs();
    } else if (tabName === "rules") {
      fetchDeckRules();
    }
  };

  /* ============================================================
     ARC REACTOR ANIMATION ENGINE (Items 56-70)
  ============================================================ */
  const reactorCanvas = $("#reactorCanvas");
  let rCtx = reactorCanvas ? reactorCanvas.getContext("2d") : null;
  let rW = 0, rH = 0, rDpr = 1;
  let rRotOuter = 0, rRotMid = 0, rRotInner = 0;
  let rLastFrame = performance.now();
  let rFpsCount = 0, rFpsLast = performance.now();
  let rPacketProgress = [0, 0.25, 0.5, 0.75]; // light packet positions

  const REACTOR_COLORS = {
    idle: [0, 255, 204],
    evaluating_goal: [157, 178, 255],
    planning: [168, 85, 247],
    coordinating: [59, 130, 246],
    synthesizing: [245, 158, 11],
    validating: [52, 211, 153],
    approved: [16, 185, 129],
    error: [239, 68, 68]
  };

  const rMotes = Array.from({length: 24}, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.25 + Math.random() * 0.65,
    speed: (0.2 + Math.random() * 0.3) * (Math.random() < 0.5 ? -1 : 1),
    size: 0.8 + Math.random() * 1.5,
    phase: Math.random() * Math.PI * 2
  }));

  function resizeReactorCanvas() {
    if (!reactorCanvas) return;
    const rect = reactorCanvas.parentElement.getBoundingClientRect();
    rDpr = Math.min(window.devicePixelRatio || 1, 2);
    rW = rect.width || 400;
    rH = rect.height || 300;
    reactorCanvas.width = rW * rDpr;
    reactorCanvas.height = rH * rDpr;
    if (rCtx) rCtx.setTransform(rDpr, 0, 0, rDpr, 0, 0);
  }
  window.addEventListener("resize", resizeReactorCanvas);

  function drawSegmentedRing(cx, cy, radius, segCount, rotation, color, baseAlpha, activeAlpha, litStart, litCount) {
    if (!rCtx) return;
    const step = (Math.PI * 2) / segCount;
    const gap = 0.3;
    for (let i = 0; i < segCount; i++) {
      const a0 = i * step + rotation;
      const a1 = a0 + step * (1 - gap);
      let isLit = false;
      if (litStart !== null && litCount > 0) {
        let rel = (i - litStart) % segCount;
        if (rel < 0) rel += segCount;
        isLit = rel < litCount;
      }
      rCtx.beginPath();
      rCtx.arc(cx, cy, radius, a0, a1);
      rCtx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${isLit ? activeAlpha : baseAlpha})`;
      rCtx.lineWidth = isLit ? 2.6 : 1.4;
      rCtx.stroke();
    }
  }

  function renderArcReactor(now) {
    if (!rCtx || !reactorCanvas) return;
    const dt = Math.min((now - rLastFrame) / 1000, 0.05);
    rLastFrame = now;

    // 70. Performance-safe FPS monitor
    rFpsCount++;
    if (now - rFpsLast > 500) {
      const fps = Math.round(rFpsCount / ((now - rFpsLast) / 1000));
      const el = $("#fpsReadout");
      if (el) el.textContent = fps;
      rFpsCount = 0;
      rFpsLast = now;
    }

    // 69. Reduced-motion check
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const curStatus = (execution_state && execution_state.status_code) || "idle";
    const speedMul = prefersReducedMotion ? 0 : (curStatus === "synthesizing" ? 1.8 : (curStatus === "idle" ? 0.35 : 1.0));
    const col = REACTOR_COLORS[curStatus] || REACTOR_COLORS.idle;

    rRotOuter += dt * 0.15 * speedMul;
    rRotMid -= dt * 0.25 * speedMul;
    rRotInner += dt * 0.4 * speedMul;

    rCtx.clearRect(0, 0, rW, rH);
    const cx = rW / 2;
    const cy = rH / 2;
    const base = Math.min(rW, rH);
    const R1 = base * 0.38; // outer bezel
    const R2 = base * 0.28; // telemetry ring
    const R3 = base * 0.18; // inner containment ring
    const Rcore = base * 0.08;

    // 58. Breathing ambient core glow
    const pulse = 0.6 + Math.sin(now / 800 * (curStatus === "synthesizing" ? 4 : 1.5)) * 0.3;
    const bg = rCtx.createRadialGradient(cx, cy, 0, cx, cy, R1 * 1.5);
    bg.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.08 * pulse).toFixed(3)})`);
    bg.addColorStop(1, "rgba(0,0,0,0)");
    rCtx.fillStyle = bg;
    rCtx.fillRect(0, 0, rW, rH);

    // 59. Directed Energy Filaments to 4 Agent Nodes (N, E, S, W)
    const targets = [
      { name: "boss", dx: 0, dy: -R1 * 1.15 },
      { name: "planner", dx: R1 * 1.15, dy: 0 },
      { name: "coordinator", dx: 0, dy: R1 * 1.15 },
      { name: "worker", dx: -R1 * 1.15, dy: 0 }
    ];

    targets.forEach((tgt, idx) => {
      // Draw filament line
      rCtx.beginPath();
      rCtx.moveTo(cx, cy);
      rCtx.lineTo(cx + tgt.dx, cy + tgt.dy);
      rCtx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.2)`;
      rCtx.lineWidth = 1;
      rCtx.stroke();

      // 60. Light Packet traveling animation along filament
      rPacketProgress[idx] = (rPacketProgress[idx] + dt * 0.4 * (speedMul || 0.2)) % 1.0;
      const px = cx + tgt.dx * rPacketProgress[idx];
      const py = cy + tgt.dy * rPacketProgress[idx];
      rCtx.beginPath();
      rCtx.arc(px, py, 2.5, 0, Math.PI * 2);
      rCtx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},0.85)`;
      rCtx.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},1)`;
      rCtx.shadowBlur = 6;
      rCtx.fill();
      rCtx.shadowBlur = 0;
    });

    // 57. Multi-tier segmented rings
    const litStart = Math.floor((now / 800 * speedMul * 3) % 36);
    drawSegmentedRing(cx, cy, R1, 36, rRotOuter, col, 0.15, 0.85, litStart, 6);
    drawSegmentedRing(cx, cy, R2, 24, rRotMid, [0, 255, 204], 0.18, 0.7, 0, 0);

    // Inner containment ring
    rCtx.beginPath();
    rCtx.arc(cx, cy, R3, 0, Math.PI * 2);
    rCtx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(0.4 * pulse).toFixed(3)})`;
    rCtx.lineWidth = 1.8;
    rCtx.stroke();

    // Dust motes
    for (const m of rMotes) {
      m.angle += dt * m.speed * (0.3 + speedMul * 0.4);
      const r = R3 + (R1 - R3) * m.radius + Math.sin(now / 1200 + m.phase) * 3;
      const mx = cx + Math.cos(m.angle) * r;
      const my = cy + Math.sin(m.angle) * r;
      rCtx.beginPath();
      rCtx.fillStyle = `rgba(0, 255, 204, ${(0.3 * pulse).toFixed(3)})`;
      rCtx.arc(mx, my, m.size, 0, Math.PI * 2);
      rCtx.fill();
    }

    // Central core
    const coreGrad = rCtx.createRadialGradient(cx, cy, 0, cx, cy, Rcore * 2);
    coreGrad.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${(0.8 * pulse).toFixed(3)})`);
    coreGrad.addColorStop(1, "rgba(0,0,0,0)");
    rCtx.fillStyle = coreGrad;
    rCtx.beginPath();
    rCtx.arc(cx, cy, Rcore * 2, 0, Math.PI * 2);
    rCtx.fill();

    rCtx.beginPath();
    rCtx.arc(cx, cy, Rcore * 0.5, 0, Math.PI * 2);
    rCtx.fillStyle = "#ffffff";
    rCtx.fill();

    const badge = $("#reactorStateBadge");
    if (badge) badge.textContent = curStatus.toUpperCase();

    requestAnimationFrame(renderArcReactor);
  }

  // Start reactor loop on mount
  setTimeout(() => {
    resizeReactorCanvas();
    requestAnimationFrame(renderArcReactor);
  }, 100);

  async function fetchTreeData() {
    try {
      const res = await fetch("/api/tree");
      if (res.ok) {
        const data = await res.json();
        renderTreeNodes(data.tree);
      }
    } catch (e) {}
  }

  // 82-84: Viewport Switching (Desktop 1920x1080, Tablet 1024x768, Mobile 375x667)
  window.setSandboxViewport = function(vp) {
    const iframe = $("#sandboxIframe");
    if (!iframe) return;
    $$("[id^='btnViewport']").forEach(b => b.classList.remove("active"));
    const activeBtn = $(`#btnViewport${vp.charAt(0).toUpperCase() + vp.slice(1)}`);
    if (activeBtn) activeBtn.classList.add("active");

    if (vp === "desktop") {
      iframe.style.width = "100%";
      iframe.style.maxWidth = "1920px";
      iframe.style.height = "100%";
      iframe.style.maxHeight = "1080px";
    } else if (vp === "tablet") {
      iframe.style.width = "1024px";
      iframe.style.maxWidth = "1024px";
      iframe.style.height = "768px";
      iframe.style.maxHeight = "768px";
    } else if (vp === "mobile") {
      iframe.style.width = "375px";
      iframe.style.maxWidth = "375px";
      iframe.style.height = "667px";
      iframe.style.maxHeight = "667px";
    }
  };

  // 91: Reset control - reverts sandbox to last approved/saved state
  window.resetSandboxState = function() {
    const iframe = $("#sandboxIframe");
    if (!iframe) return;
    if (state.activeProjectId) {
      iframe.src = `/projects/${state.activeProjectId}/app?t=${Date.now()}`;
    } else {
      iframe.src = `/web_ui/index.html?t=${Date.now()}`;
    }
    const fallback = $("#sandboxErrorFallback");
    if (fallback) fallback.style.display = "none";
    showToast("Sandbox reset to last approved state");
  };

  // 85-87: 3D Perspective Tilt on Sandbox (disabled on touch & prefers-reduced-motion)
  function setupSandboxTilt() {
    const wrapper = $("#sandboxTiltWrapper");
    const iframe = $("#sandboxIframe");
    if (!wrapper || !iframe) return;

    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isTouch || prefersReducedMotion) {
      iframe.style.transform = "none";
      return;
    }

    wrapper.addEventListener("mousemove", (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xPct = (x / rect.width) - 0.5;
      const yPct = (y / rect.height) - 0.5;
      const rotX = -yPct * 6;
      const rotY = xPct * 6;
      iframe.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    wrapper.addEventListener("mouseleave", () => {
      iframe.style.transform = "rotateX(0deg) rotateY(0deg)";
    });
  }
  setTimeout(setupSandboxTilt, 200);

  // 95: Full-screen Preview Mode
  window.toggleSandboxFullscreen = function() {
    const container = $("#sandboxContainer");
    if (!container) return;
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) container.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // 92 & 94: Live reload on update & broken-render fallback
  window.reloadSandboxIframe = function() {
    const iframe = $("#sandboxIframe");
    const fallback = $("#sandboxErrorFallback");
    if (!iframe) return;
    if (fallback) fallback.style.display = "none";
    const cur = iframe.src;
    iframe.src = cur.split("?")[0] + "?t=" + Date.now();
    iframe.onerror = () => {
      if (fallback) fallback.style.display = "flex";
    };
  };

  window.openAppInNewTab = function() {
    const iframe = $("#sandboxIframe");
    window.open(iframe.src, "_blank");
  };

  window.saveProjectPermanent = async function() {
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
  };

  window.saveAllProjectsPermanent = async function() {
    try {
      const res = await fetch("/api/projects/save-all", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        alert(d.message);
        loadProjectsCatalog();
      }
    } catch (e) {
      alert("Bulk save failed");
    }
  };

  window.exportAllProjectsZip = async function() {
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
  };

  window.clearAllProjectsData = async function() {
    if (!confirm("Are you sure you want to clear all stored project data?")) return;
    try {
      const res = await fetch("/api/projects/clear-all", { method: "POST" });
      if (res.ok) {
        state.projects = [];
        state.activeProjectId = null;
        state.activeProject = null;
        openNewConversation();
        loadProjectsCatalog();
        alert("All project data has been cleared.");
      }
    } catch (e) {
      alert("Clear failed: " + e);
    }
  };

  window.resetActiveExecution = async function() {
    state.isExecuting = false;
    if (execution_state) execution_state.is_running = false;
    await fetch("/api/reset", { method: "POST" });
    openNewConversation();
  };

  window.toggleSidebar = function() {
    $("#appSidebar").classList.toggle("collapsed");
  };

  window.toggleProjectsFilter = function() {
    const bar = $("#projectsFilterBar");
    const isShowing = bar.style.display !== "none";
    bar.style.display = isShowing ? "none" : "block";
    if (!isShowing) {
      const input = $("#projectSearchInput");
      input.focus();
      input.oninput = () => {
        state.filterQuery = input.value.trim();
        renderProjectsTree();
      };
    } else {
      state.filterQuery = "";
      renderProjectsTree();
    }
  };

  window.navigateHistory = function(dir) {
    if (state.projects.length === 0) return;
    state.historyIndex = Math.max(0, Math.min(state.projects.length - 1, state.historyIndex + dir));
    openProjectConversation(state.projects[state.historyIndex]);
  };

  window.openModelSelector = function(e) {
    e.stopPropagation();
    const menu = $("#modelMenu");
    positionPopover(menu, e.currentTarget);
  };

  window.selectModel = function(modelName) {
    state.selectedModel = modelName;
    $("#selectedModelLabel").textContent = modelName;
    $("#topBarModelBadge").textContent = modelName;
    closeAllPopovers();
  };

  window.openContextSelector = function(e) {
    e.stopPropagation();
    const menu = $("#contextMenu");
    positionPopover(menu, e.currentTarget);
  };

  window.selectContext = function(ctxName) {
    state.selectedContext = ctxName;
    $("#selectedContextLabel").textContent = ctxName;
    closeAllPopovers();
  };

  window.openFolderSelector = function(e) {
    e.stopPropagation();
    renderFolderMenu();
    const menu = $("#folderMenu");
    positionPopover(menu, e.currentTarget);
  };

  window.selectFolder = function(folderName) {
    state.activeFolder = folderName;
    localStorage.setItem("ultron_active_folder", folderName);
    $("#activeFolderLabel").textContent = folderName;
    closeAllPopovers();
    renderProjectsTree();
  };

  window.promptNewFolder = function() {
    closeAllPopovers();
    const name = prompt("Enter new project folder name:");
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (!state.folders.includes(trimmed)) {
        state.folders.push(trimmed);
        localStorage.setItem("ultron_folders", JSON.stringify(state.folders));
      }
      state.folderOpenState[trimmed] = true;
      localStorage.setItem("ultron_folder_open", JSON.stringify(state.folderOpenState));
      selectFolder(trimmed);
      renderProjectsTree();
    }
  };

  function positionPopover(popover, target) {
    closeAllPopovers();
    popover.classList.add("open");
    const rect = target.getBoundingClientRect();
    popover.style.top = (rect.bottom + 6) + "px";
    popover.style.left = rect.left + "px";
  }

  function closeAllPopovers() {
    $$(".popover-menu").forEach(p => p.classList.remove("open"));
  }
  document.addEventListener("click", closeAllPopovers);

  window.toggleVoiceInput = function() {
    const mic = $("#micBtn");
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser environment.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    mic.style.color = "#ef4444";
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = $("#mainPromptInput");
      input.value += (input.value ? " " : "") + transcript;
      mic.style.color = "";
      $("#sendPromptBtn").classList.add("active");
    };

    recognition.onerror = () => { mic.style.color = ""; };
    recognition.onend = () => { mic.style.color = ""; };
  };

  window.openSettingsModal = function() { $("#settingsModal").classList.add("open"); };
  window.openHistoryModal = function() {
    $("#historyModal").classList.add("open");
    renderProjectsCatalog();
  };

  window.renderProjectsCatalog = async function() {
    const body = $("#historyModalBody");
    const storageEl = $("#catalogStorageUsage");
    if (!body) return;

    // 139: Storage usage
    try {
      const sRes = await fetch("/api/projects/storage");
      if (sRes.ok) {
        const sData = await sRes.json();
        if (storageEl) storageEl.textContent = `Storage: ${sData.total_mb} MB across ${sData.total_projects} projects`;
      }
    } catch (e) {}

    const query = ($("#catalogSearchInput") ? $("#catalogSearchInput").value : "").toLowerCase().trim();
    const sort = ($("#catalogSortSelect") ? $("#catalogSortSelect").value : "updated");

    let list = [...(state.projects || [])];

    // 136: Search/filter
    if (query) {
      list = list.filter(p => (p.title || p.goal || p.id || '').toLowerCase().includes(query));
    }

    // 137: Sort
    if (sort === "created") {
      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    } else if (sort === "expiration") {
      list.sort((a, b) => (a.days_remaining || 9999) - (b.days_remaining || 9999));
    } else {
      list.sort((a, b) => (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || ''));
    }

    if (list.length === 0) {
      body.innerHTML = `<div style="color:var(--text-muted);padding:14px;text-align:center;">No matching projects found.</div>`;
      return;
    }

    body.innerHTML = list.map(p => {
      const isPerm = p.is_permanent;
      const days = p.days_remaining !== undefined ? p.days_remaining : 30;
      const isExpiringSoon = !isPerm && days <= 3;
      
      // 126 & 127: Badges
      let badgeHtml = "";
      if (isPerm) {
        badgeHtml = `<span class="badge-permanent" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">Permanent</span>`;
      } else if (isExpiringSoon) {
        badgeHtml = `<span class="badge-expiring-soon" style="background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">⏳ ${escapeHtml(p.time_remaining_str || 'Expiring Soon')}</span>`;
      } else {
        badgeHtml = `<span class="badge-countdown" style="background:rgba(255,255,255,0.06);color:#a1a1aa;padding:2px 6px;border-radius:4px;font-size:10px;">${escapeHtml(p.time_remaining_str || '30d left')}</span>`;
      }

      return `
        <div class="catalog-project-card" style="background:#121215;padding:10px 12px;border-radius:6px;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <div style="flex:1;min-width:0;cursor:pointer;" onclick="closeModal('historyModal');openProjectConversation({id:'${p.id}',title:'${escapeHtml(p.title || p.goal)}',isLiveBackend:true})">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span class="project-card-title" style="font-weight:600;font-size:12.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(p.title || p.goal)}</span>
              ${badgeHtml}
            </div>
            <div style="font-size:10.5px;color:var(--text-muted);font-family:var(--font-mono);">${p.id}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button class="action-btn-sm" onclick="event.stopPropagation();promptRenameProject('${p.id}', '${escapeHtml(p.title || p.goal)}')" title="Rename project">✏️</button>
            <button class="action-btn-sm" onclick="event.stopPropagation();toggleProjectPermanent('${p.id}')" title="Toggle Permanent Pin">${isPerm ? '⭐ Pinned' : '📌 Pin'}</button>
            <button class="action-btn-sm" onclick="event.stopPropagation();exportProjectZipById('${p.id}')" title="Download ZIP">📦</button>
            <button class="action-btn-sm" onclick="event.stopPropagation();deleteProjectById('${p.id}')" style="color:#ef4444;" title="Delete project">🗑</button>
          </div>
        </div>
      `;
    }).join("");
  };

  // 134: Project rename
  window.promptRenameProject = async function(projectId, oldTitle) {
    const newTitle = prompt("Enter new title for project:", oldTitle);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === oldTitle) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      if (res.ok) {
        showToast("Project renamed to " + newTitle.trim());
        await loadProjectsCatalog();
        renderProjectsCatalog();
      }
    } catch (e) {
      showToast("Rename failed: " + e.message, true);
    }
  };

  // 128: Permanent pin
  window.toggleProjectPermanent = async function(projectId) {
    try {
      const res = await fetch(`/api/projects/${projectId}/save`, { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        showToast(d.is_permanent ? "Project pinned as permanent" : "Project unpinned");
        await loadProjectsCatalog();
        renderProjectsCatalog();
      }
    } catch (e) {
      showToast("Failed to toggle permanence", true);
    }
  };

  // 131: Single project export
  window.exportProjectZipById = function(projectId) {
    window.location.href = `/api/projects/${projectId}/export`;
  };

  // 133: Project delete
  window.deleteProjectById = async function(projectId) {
    if (!confirm(`Are you sure you want to permanently delete project ${projectId}?`)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Project deleted");
        await loadProjectsCatalog();
        renderProjectsCatalog();
      }
    } catch (e) {
      showToast("Delete failed", true);
    }
  };

  // 138: Restore from ZIP
  window.handleRestoreZip = async function(file) {
    if (!file) return;
    showToast("Restoring project from archive...");
    try {
      const res = await fetch("/api/projects/restore", {
        method: "POST",
        headers: { "Content-Type": "application/zip" },
        body: file
      });
      if (res.ok) {
        const d = await res.json();
        showToast("Project restored successfully!");
        await loadProjectsCatalog();
        renderProjectsCatalog();
      } else {
        throw new Error("HTTP " + res.status);
      }
    } catch (e) {
      showToast("Restore failed: " + e.message, true);
    }
  };
  window.openScheduledTasksModal = function() { $("#scheduledModal").classList.add("open"); };
  window.closeModal = function(id) { $("#" + id).classList.remove("open"); };
  window.openIdeLauncher = function() { alert("Antigravity IDE integration: Ready and synchronized with ULTRON orchestrator."); };

  async function loadGovernanceRules() {
    try {
      const res = await fetch("/api/rules");
      if (res.ok) {
        const data = await res.json();
        const container = $("#rulesListContainer");
        if (container) {
          const all = [...(data.core || []), ...(data.added || [])];
          container.innerHTML = all.map(r => `
            <div style="background:#121215;padding:8px 10px;border-radius:6px;border:1px solid var(--border-subtle);font-size:11.5px;display:flex;justify-content:space-between;align-items:center;">
              <div><strong>${r.id}:</strong> ${escapeHtml(r.text)}</div>
              <span style="font-size:10px;font-family:var(--font-mono);color:${r.status==='active'?'#4ade80':'#a1a1aa'};">${r.status.toUpperCase()}</span>
            </div>
          `).join("");
        }
      }
    } catch (e) {}
  }

  window.addNewGuardrailRule = async function() {
    const input = $("#newRuleInput");
    const text = input.value.trim();
    if (!text) return;
    try {
      const res = await fetch("/api/rules/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      });
      if (res.ok) {
        input.value = "";
        loadGovernanceRules();
      }
    } catch (e) {
      alert("Failed to add rule");
    }
  };

  async function testEngineConnection() {
    try {
      const res = await fetch("/api/engine");
      if (res.ok) {
        const d = await res.json();
        const el = $("#settingsEngineStatus");
        if (el) {
          el.innerHTML = `Active Model: <strong>${d.model_name}</strong> | Backend: <strong>${d.backend.toUpperCase()}</strong> | Ollama Status: <span style="color:${d.is_local_online?'#4ade80':'#facc15'};">${d.is_local_online ? 'ONLINE (Zero Cost)' : 'STANDBY'}</span>`;
        }
      }
    } catch (e) {}
  }

  function renderMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);
    // Code blocks ```code```
    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (m, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    // Bullet points
    html = html.replace(/^\s*[-•]\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
    // Line breaks
    html = html.replace(/\n\n+/g, "<br><br>").replace(/\n/g, "<br>");
    return html;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
