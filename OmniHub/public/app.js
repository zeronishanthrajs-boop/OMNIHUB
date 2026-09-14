/**
 * OmniHub Master Frontend Controller
 * 2026 Tech Equipment Modernization, Voice AI & MCP Bridge
 */

// Application State
const state = {
  projects: [],
  activeFilter: 'all',
  searchQuery: '',
  workspaceTabs: [],
  activeWorkspaceId: null,
  secondaryWorkspaceId: null,
  isSplitMode: false,
  paletteSelectedIndex: 0,
  paletteFilteredItems: [],
  isListening: false
};

// DOM Elements
const dom = {
  activeCount: document.getElementById('active-count'),
  systemClock: document.getElementById('system-clock'),
  vitalsRam: document.getElementById('vitals-ram'),
  projectsGrid: document.getElementById('projects-grid-container'),
  categoryFilters: document.getElementById('category-filters'),
  gridSearchInput: document.getElementById('grid-search-input'),
  btnOpenPalette: document.getElementById('btn-open-palette'),
  paletteModal: document.getElementById('palette-modal'),
  paletteInput: document.getElementById('palette-input'),
  paletteResults: document.getElementById('palette-results-list'),
  paletteCloseKbd: document.getElementById('palette-close-kbd'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnOpenAllTabs: document.getElementById('btn-open-all-tabs'),
  btnVoiceCommand: document.getElementById('btn-voice-command'),
  voiceHud: document.getElementById('voice-hud'),
  voiceTranscript: document.getElementById('voice-transcript'),
  btnCancelVoice: document.getElementById('btn-cancel-voice'),
  viewTabs: document.querySelectorAll('.tab-btn'),
  viewPanels: document.querySelectorAll('.view-panel'),
  tabWorkspaceBtn: document.getElementById('tab-workspace-btn'),
  workspaceOpenCount: document.getElementById('workspace-open-count'),
  workspaceToolbar: document.getElementById('workspace-toolbar'),
  workspaceEmptyState: document.getElementById('workspace-empty-prompt'),
  workspaceActiveUi: document.getElementById('workspace-active-ui'),
  workspaceTabsList: document.getElementById('workspace-tabs-list'),
  mainIframe: document.getElementById('main-workspace-iframe'),
  secondaryIframe: document.getElementById('secondary-workspace-iframe'),
  primaryFrameWrapper: document.getElementById('primary-frame-wrapper'),
  secondaryFrameWrapper: document.getElementById('secondary-frame-wrapper'),
  workspaceQuickLaunch: document.getElementById('workspace-quick-launch'),
  btnSplitToggle: document.getElementById('btn-split-toggle'),
  btnFullscreenFrame: document.getElementById('btn-fullscreen-frame'),
  btnReloadFrame: document.getElementById('btn-reload-frame'),
  btnExternalFrame: document.getElementById('btn-external-frame'),
  innovationsTableBody: document.getElementById('innovations-table-body'),
  toastContainer: document.getElementById('toast-container')
};

// Clock updater
function updateClock() {
  const now = new Date();
  dom.systemClock.textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Toast helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fetch Projects and Health Status
async function loadProjects() {
  try {
    const res = await fetch('/api/projects');
    const data = await res.json();
    if (data.success) {
      state.projects = data.projects;
      updateActiveCount();
      renderGrid();
      renderWorkspaceQuickLaunch();
      renderInnovationsTable();
    }
  } catch (err) {
    console.error('Failed to load projects:', err);
  }
}

// Fetch Server Vitals
async function loadVitals() {
  try {
    const res = await fetch('/api/vitals');
    const data = await res.json();
    if (data.success && dom.vitalsRam) {
      dom.vitalsRam.textContent = `${data.memory.usedPercent}%`;
    }
  } catch (e) {
    // Silent
  }
}
setInterval(loadVitals, 5000);
loadVitals();

function updateActiveCount() {
  const onlineCount = state.projects.filter(p => p.status === 'online').length;
  dom.activeCount.textContent = `${onlineCount} / ${state.projects.length}`;
}

// Open All Projects in Real Browser Tabs (Native OS Dispatcher)
window.openAllProjectsInTabs = async function(browser = 'chrome') {
  const browserLabel = browser === 'edge' ? 'Microsoft Edge' : 'Google Chrome';
  showToast(`Dispatching all 12 systems to ${browserLabel} in separate tabs...`, 'success');
  try {
    const res = await fetch('/api/open-all-tabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browser })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Opened ${data.count} tabs in ${data.browser}!`, 'success');
    } else {
      // Browser fallback
      state.projects.forEach((p, idx) => {
        setTimeout(() => window.open(p.url, '_blank'), idx * 100);
      });
    }
  } catch (err) {
    state.projects.forEach((p, idx) => {
      setTimeout(() => window.open(p.url, '_blank'), idx * 100);
    });
  }
};

// Open Single Tab in Real Browser (Bypassing Antigravity Webview)
window.openExternalTab = async function(url) {
  try {
    await fetch('/api/open-tab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    showToast(`Opened in browser: ${url}`, 'info');
  } catch (e) {
    window.open(url, '_blank');
  }
};

if (dom.btnOpenAllTabs) {
  dom.btnOpenAllTabs.onclick = () => window.openAllProjectsInTabs('chrome');
}

// Render Mission Control Project Cards
function renderGrid() {
  const query = state.searchQuery.toLowerCase().trim();
  const filtered = state.projects.filter(p => {
    const matchesCat = state.activeFilter === 'all' || p.category === state.activeFilter;
    const matchesSearch = !query || 
      p.name.toLowerCase().includes(query) ||
      p.tagline.toLowerCase().includes(query) ||
      (p.techEquipment && p.techEquipment.toLowerCase().includes(query)) ||
      p.tags.some(t => t.toLowerCase().includes(query)) ||
      String(p.port).includes(query);
    return matchesCat && matchesSearch;
  });

  dom.projectsGrid.innerHTML = filtered.map(p => {
    const isOnline = p.status === 'online';
    const statusClass = isOnline ? 'online' : 'offline';
    const statusText = isOnline ? `LIVE ${p.latency ? `(${p.latency}ms)` : ''}` : 'STANDBY';

    return `
      <div class="project-card ${isOnline ? 'is-online' : ''}" data-id="${p.id}">
        <div class="card-top">
          <div class="card-icon-title">
            <div class="card-icon">${p.icon}</div>
            <div class="card-title-group">
              <h3>${p.name}</h3>
              <span class="card-category">${p.category}</span>
            </div>
          </div>
          <div class="card-badges">
            <span class="port-badge">:${p.port}</span>
            <span class="status-pill ${statusClass}">
              <span class="pulse-indicator ${isOnline ? 'live' : ''}"></span>
              ${statusText}
            </span>
          </div>
        </div>

        <p class="card-tagline">${p.tagline}</p>

        <!-- 2026 Tech Equipment Badge -->
        <div class="card-equipment-badge" title="2026 Tech Innovation Specification">
          <span class="equipment-icon">⚡</span>
          <span>${p.techEquipment || 'Modernized Architecture'}</span>
        </div>

        <div class="card-tech-tags">
          ${p.tags.map(t => `<span class="tech-tag">${t}</span>`).join('')}
        </div>

        <div class="card-bottom-actions">
          <button class="btn btn-primary" onclick="openInWorkspace('${p.id}')">
            <span>🚀 Open in Workspace</span>
          </button>
          <button class="btn-icon-square" title="Open in Real Browser Tab (http://localhost:${p.port})" onclick="openExternalTab('${p.url}')">
            <span>↗</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Render 2026 Tech Equipment Table
function renderInnovationsTable() {
  if (!dom.innovationsTableBody) return;
  dom.innovationsTableBody.innerHTML = state.projects.map(p => `
    <tr>
      <td>
        <strong>${p.icon} ${p.name}</strong>
      </td>
      <td>${p.category}</td>
      <td><code>:${p.port}</code></td>
      <td class="equip-cell">⚡ ${p.techEquipment || 'N/A'}</td>
      <td>
        <button class="btn btn-xs" onclick="openInWorkspace('${p.id}')">Launch</button>
      </td>
    </tr>
  `).join('');
}

// Workspace Quick Launch list
function renderWorkspaceQuickLaunch() {
  dom.workspaceQuickLaunch.innerHTML = state.projects.map(p => `
    <div class="quick-chip" onclick="openInWorkspace('${p.id}')">
      <span>${p.icon}</span>
      <strong>${p.name}</strong>
      <span class="port-badge">:${p.port}</span>
    </div>
  `).join('');
}

// Open In Workspace
window.openInWorkspace = function(id) {
  const project = state.projects.find(p => p.id === id);
  if (!project) return;

  if (!state.workspaceTabs.includes(id)) {
    state.workspaceTabs.push(id);
  }
  state.activeWorkspaceId = id;

  switchView('workspace');
  renderWorkspace();
};

// Close Workspace Tab
window.closeWorkspaceTab = function(event, id) {
  event.stopPropagation();
  state.workspaceTabs = state.workspaceTabs.filter(tabId => tabId !== id);
  if (state.activeWorkspaceId === id) {
    state.activeWorkspaceId = state.workspaceTabs.length > 0 ? state.workspaceTabs[state.workspaceTabs.length - 1] : null;
  }
  if (state.secondaryWorkspaceId === id) {
    state.secondaryWorkspaceId = null;
  }
  renderWorkspace();
};

function renderWorkspace() {
  const hasTabs = state.workspaceTabs.length > 0;
  dom.workspaceEmptyState.style.display = hasTabs ? 'none' : 'flex';
  dom.workspaceActiveUi.style.display = hasTabs ? 'flex' : 'none';
  dom.workspaceToolbar.style.display = hasTabs ? 'flex' : 'none';

  if (hasTabs) {
    dom.workspaceOpenCount.style.display = 'inline-block';
    dom.workspaceOpenCount.textContent = state.workspaceTabs.length;
  } else {
    dom.workspaceOpenCount.style.display = 'none';
  }

  // Render Tabs
  dom.workspaceTabsList.innerHTML = state.workspaceTabs.map(id => {
    const p = state.projects.find(item => item.id === id);
    if (!p) return '';
    const isActive = state.activeWorkspaceId === id;
    return `
      <div class="workspace-tab ${isActive ? 'active' : ''}" onclick="selectWorkspaceTab('${id}')">
        <span>${p.icon}</span>
        <strong>${p.name}</strong>
        <span class="port-badge">:${p.port}</span>
        <span class="close-tab-btn" onclick="closeWorkspaceTab(event, '${id}')">✕</span>
      </div>
    `;
  }).join('');

  // Load DIRECT localhost URL into iframe
  if (state.activeWorkspaceId) {
    const activeProject = state.projects.find(p => p.id === state.activeWorkspaceId);
    if (activeProject) {
      if (dom.mainIframe.dataset.currentId !== activeProject.id) {
        dom.mainIframe.src = activeProject.url;
        dom.mainIframe.dataset.currentId = activeProject.id;
      }
    }
  } else {
    dom.mainIframe.src = 'about:blank';
    delete dom.mainIframe.dataset.currentId;
  }

  // Secondary Frame for Split Mode
  if (state.isSplitMode && state.secondaryWorkspaceId) {
    dom.secondaryFrameWrapper.style.display = 'block';
    const secProject = state.projects.find(p => p.id === state.secondaryWorkspaceId);
    if (secProject) {
      if (dom.secondaryIframe.dataset.currentId !== secProject.id) {
        dom.secondaryIframe.src = secProject.url;
        dom.secondaryIframe.dataset.currentId = secProject.id;
      }
    }
  } else {
    dom.secondaryFrameWrapper.style.display = 'none';
  }
}

window.selectWorkspaceTab = function(id) {
  state.activeWorkspaceId = id;
  renderWorkspace();
};

// Launch Multi-App Workflow in Split View
window.launchWorkflow = function(ids) {
  if (!ids || ids.length === 0) return;
  
  ids.forEach(id => {
    if (!state.workspaceTabs.includes(id)) {
      state.workspaceTabs.push(id);
    }
  });

  state.activeWorkspaceId = ids[0];
  if (ids.length > 1) {
    state.isSplitMode = true;
    state.secondaryWorkspaceId = ids[1];
  }

  switchView('workspace');
  renderWorkspace();
  showToast(`Launched Workflow Suite with ${ids.length} applications`, 'success');
};

// View Switcher
function switchView(viewName) {
  dom.viewTabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  dom.viewPanels.forEach(panel => {
    panel.classList.toggle('active', panel.id === `view-${viewName}`);
  });
}

dom.viewTabs.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// Split Toggle Button
dom.btnSplitToggle.addEventListener('click', () => {
  state.isSplitMode = !state.isSplitMode;
  if (state.isSplitMode && !state.secondaryWorkspaceId) {
    const alternative = state.workspaceTabs.find(id => id !== state.activeWorkspaceId);
    state.secondaryWorkspaceId = alternative || state.activeWorkspaceId;
  }
  dom.btnSplitToggle.classList.toggle('btn-primary', state.isSplitMode);
  renderWorkspace();
});

// Fullscreen
dom.btnFullscreenFrame.addEventListener('click', () => {
  const container = document.getElementById('frames-viewport');
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => alert(err.message));
  } else {
    document.exitFullscreen();
  }
});

// Reload IFrame
dom.btnReloadFrame.addEventListener('click', () => {
  if (dom.mainIframe.src) dom.mainIframe.src = dom.mainIframe.src;
  if (state.isSplitMode && dom.secondaryIframe.src) dom.secondaryIframe.src = dom.secondaryIframe.src;
  showToast('Workspace reloaded');
});

// Open External Tab
dom.btnExternalFrame.addEventListener('click', () => {
  if (state.activeWorkspaceId) {
    const p = state.projects.find(item => item.id === state.activeWorkspaceId);
    if (p) window.open(p.url, '_blank');
  }
});

// Category Filter pills
dom.categoryFilters.addEventListener('click', (e) => {
  if (e.target.classList.contains('filter-pill')) {
    dom.categoryFilters.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    state.activeFilter = e.target.dataset.cat;
    renderGrid();
  }
});

// Grid search input
dom.gridSearchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderGrid();
});

// Refresh button
dom.btnRefresh.addEventListener('click', () => {
  showToast('Probing all ecosystem services...');
  loadProjects();
});

// COMMAND PALETTE (CTRL+K)
function openPalette() {
  dom.paletteModal.style.display = 'flex';
  dom.paletteInput.value = '';
  dom.paletteInput.focus();
  renderPaletteResults('');
}

function closePalette() {
  dom.paletteModal.style.display = 'none';
}

function renderPaletteResults(query) {
  const q = query.toLowerCase().trim();
  const results = [];

  // Actions
  if (!q || 'open all tabs'.includes(q)) {
    results.push({
      type: 'action',
      title: '🌐 Open All Projects in Browser Tabs',
      desc: 'Open all 12 projects on their respective ports in separate tabs',
      action: () => window.openAllProjectsInTabs()
    });
  }

  // Filter projects
  state.projects.forEach(p => {
    if (!q || 
        p.name.toLowerCase().includes(q) || 
        p.tagline.toLowerCase().includes(q) || 
        (p.techEquipment && p.techEquipment.toLowerCase().includes(q)) ||
        p.tags.some(t => t.toLowerCase().includes(q)) || 
        String(p.port).includes(q)) {
      results.push({
        type: 'project',
        icon: p.icon,
        title: p.name,
        desc: `${p.tagline} • [${p.techEquipment || '2026 Tech'}]`,
        port: `:${p.port}`,
        action: () => openInWorkspace(p.id)
      });
    }
  });

  state.paletteFilteredItems = results;
  state.paletteSelectedIndex = 0;

  dom.paletteResults.innerHTML = results.map((item, idx) => `
    <div class="palette-item ${idx === 0 ? 'selected' : ''}" data-idx="${idx}">
      <div class="palette-item-left">
        <span class="palette-item-icon">${item.icon || '⚡'}</span>
        <div>
          <div class="palette-item-title">${item.title}</div>
          <div class="palette-item-desc">${item.desc}</div>
        </div>
      </div>
      ${item.port ? `<div class="palette-item-port">${item.port}</div>` : ''}
    </div>
  `).join('');
}

dom.btnOpenPalette.addEventListener('click', openPalette);
dom.paletteCloseKbd.addEventListener('click', closePalette);

dom.paletteInput.addEventListener('input', (e) => {
  renderPaletteResults(e.target.value);
});

// VOICE AI CONTROLLER (Web Speech API)
function initVoiceAI() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    if (dom.btnVoiceCommand) {
      dom.btnVoiceCommand.onclick = () => showToast('Voice AI requires Google Chrome or Chromium browser', 'danger');
    }
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    state.isListening = true;
    dom.btnVoiceCommand.classList.add('listening');
    dom.voiceHud.style.display = 'flex';
    dom.voiceTranscript.textContent = 'Listening... Speak a command';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase().trim();
    dom.voiceTranscript.textContent = `"${transcript}"`;
    executeVoiceCommand(transcript);
  };

  recognition.onerror = (e) => {
    dom.voiceTranscript.textContent = `Voice Error: ${e.error}`;
    setTimeout(() => { dom.voiceHud.style.display = 'none'; }, 1800);
  };

  recognition.onend = () => {
    state.isListening = false;
    dom.btnVoiceCommand.classList.remove('listening');
    setTimeout(() => { dom.voiceHud.style.display = 'none'; }, 1500);
  };

  if (dom.btnVoiceCommand) {
    dom.btnVoiceCommand.onclick = () => {
      try {
        recognition.start();
      } catch (err) {
        recognition.stop();
      }
    };
  }

  if (dom.btnCancelVoice) {
    dom.btnCancelVoice.onclick = () => {
      recognition.stop();
      dom.voiceHud.style.display = 'none';
    };
  }
}

// Voice Command Parser
function executeVoiceCommand(text) {
  showToast(`Voice Command: "${text}"`, 'success');

  if (text.includes('chess')) {
    openInWorkspace('chess');
  } else if (text.includes('stock') || text.includes('pulse')) {
    openInWorkspace('stock-pulse');
  } else if (text.includes('ultron')) {
    openInWorkspace('ultron');
  } else if (text.includes('jarvis')) {
    openInWorkspace('jarvis');
  } else if (text.includes('venom') || text.includes('scan') || text.includes('security')) {
    openInWorkspace('venom');
  } else if (text.includes('cyber') || text.includes('tree')) {
    openInWorkspace('cyber-tree');
  } else if (text.includes('prediction') || text.includes('arena')) {
    openInWorkspace('prediction-arena');
  } else if (text.includes('builder') || text.includes('web')) {
    openInWorkspace('ai-web-builder');
  } else if (text.includes('whisper')) {
    openInWorkspace('whisper-pages');
  } else if (text.includes('morph') || text.includes('game')) {
    openInWorkspace('game-changer');
  } else if (text.includes('form')) {
    openInWorkspace('jo-form');
  } else if (text.includes('decluz')) {
    openInWorkspace('decluz');
  } else if (text.includes('all') || text.includes('open all')) {
    window.openAllProjectsInTabs();
  } else if (text.includes('split')) {
    dom.btnSplitToggle.click();
  } else {
    showToast(`Command not recognized: "${text}"`, 'info');
  }
}

// Keyboard shortcuts (Ctrl+K and Ctrl+Shift+V)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
    e.preventDefault();
    if (dom.btnVoiceCommand) dom.btnVoiceCommand.click();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (dom.paletteModal.style.display === 'flex') {
      closePalette();
    } else {
      openPalette();
    }
  } else if (e.key === 'Escape') {
    closePalette();
    if (dom.voiceHud) dom.voiceHud.style.display = 'none';
  } else if (dom.paletteModal.style.display === 'flex') {
    const items = dom.paletteResults.querySelectorAll('.palette-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      state.paletteSelectedIndex = (state.paletteSelectedIndex + 1) % items.length;
      updatePaletteSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      state.paletteSelectedIndex = (state.paletteSelectedIndex - 1 + items.length) % items.length;
      updatePaletteSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = state.paletteFilteredItems[state.paletteSelectedIndex];
      if (selected && selected.action) {
        selected.action();
        closePalette();
      }
    }
  }
});

function updatePaletteSelection() {
  const items = dom.paletteResults.querySelectorAll('.palette-item');
  items.forEach((el, idx) => {
    el.classList.toggle('selected', idx === state.paletteSelectedIndex);
    if (idx === state.paletteSelectedIndex) {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
}

dom.paletteResults.addEventListener('click', (e) => {
  const itemEl = e.target.closest('.palette-item');
  if (itemEl) {
    const idx = parseInt(itemEl.dataset.idx, 10);
    const item = state.paletteFilteredItems[idx];
    if (item && item.action) {
      item.action();
      closePalette();
    }
  }
});

// Initial boot
loadProjects();
initVoiceAI();
initEquipmentLab();
setInterval(loadProjects, 3500);

// ==========================================
// 2026 TECH EQUIPMENT INTERACTIVE LAB
// ==========================================
function initEquipmentLab() {
  init3DGlobe();
  initDCFSim();
  initMCPConsole();
  initEvalBar();
}

// 1. 3D WebGL Threat Topology Globe (Cyber Tree)
function init3DGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || typeof THREE === 'undefined') return;

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 200;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.z = 2.4;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Wireframe Core Globe
  const geometry = new THREE.SphereGeometry(0.85, 24, 24);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.25
  });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  // Threat Nodes (Particle points)
  const particleCount = 40;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    const phi = Math.acos(-1 + (2 * (i / 3)) / particleCount);
    const theta = Math.sqrt(particleCount * Math.PI) * phi;
    positions[i] = 0.85 * Math.cos(theta) * Math.sin(phi);
    positions[i + 1] = 0.85 * Math.sin(theta) * Math.sin(phi);
    positions[i + 2] = 0.85 * Math.cos(phi);
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x10b981,
    size: 0.05,
    transparent: true,
    opacity: 0.8
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // Ambient rotation loop
  function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.005;
    sphere.rotation.x += 0.001;
    particles.rotation.y += 0.005;
    particles.rotation.x += 0.001;
    renderer.render(scene, camera);
  }
  animate();
}

// 2. Interactive Reverse DCF Simulator (Stock Pulse)
function initDCFSim() {
  const waccSlider = document.getElementById('lab-wacc');
  const terminalSlider = document.getElementById('lab-terminal');
  const waccVal = document.getElementById('lab-wacc-val');
  const terminalVal = document.getElementById('lab-terminal-val');
  const output = document.getElementById('lab-implied-growth');

  if (!waccSlider || !terminalSlider) return;

  function recalculate() {
    const wacc = parseFloat(waccSlider.value);
    const terminal = parseFloat(terminalSlider.value);
    waccVal.textContent = `${wacc.toFixed(1)}%`;
    terminalVal.textContent = `${terminal.toFixed(1)}%`;

    // Numerical formula: Implied FCF Growth ~ (WACC * 1.25) - (Terminal * 0.7)
    const implied = (wacc * 1.32) - (terminal * 0.95);
    output.textContent = `${implied.toFixed(1)}%`;
  }

  waccSlider.addEventListener('input', recalculate);
  terminalSlider.addEventListener('input', recalculate);
}

// 3. Model Context Protocol (MCP) Live Console
function initMCPConsole() {
  const select = document.getElementById('mcp-tool-select');
  const btn = document.getElementById('btn-invoke-mcp');
  const output = document.getElementById('mcp-output');

  if (!btn || !select || !output) return;

  btn.addEventListener('click', async () => {
    const tool = select.value;
    output.textContent = `Dispatching MCP request for "${tool}"...`;

    try {
      const res = await fetch('/api/mcp/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool,
          params: { query: 'test_execution', timestamp: Date.now() }
        })
      });
      const data = await res.json();
      output.textContent = JSON.stringify(data, null, 2);
      showToast(`Executed MCP Tool: ${tool}`, 'success');
    } catch (e) {
      output.textContent = `Error: ${e.message}`;
    }
  });
}

// 4. Stockfish NNUE Neural Advantage Bar (Cinematic Chess)
function initEvalBar() {
  const fill = document.getElementById('eval-fill');
  const score = document.getElementById('eval-score');
  const btn = document.getElementById('btn-random-eval');

  if (!fill || !score || !btn) return;

  const positions = [
    { score: '+2.4', height: 74, label: 'White has decisive king-side attack' },
    { score: '+0.8', height: 58, label: 'Slight advantage in Italian Game structure' },
    { score: '-1.4', height: 36, label: 'Black counter-play on open c-file' },
    { score: '0.0', height: 50, label: 'Completely equal endgame balance' },
    { score: '+4.1', height: 91, label: 'Blunder punished by Stockfish NNUE' }
  ];

  let currentIdx = 0;
  btn.addEventListener('click', () => {
    currentIdx = (currentIdx + 1) % positions.length;
    const pos = positions[currentIdx];
    fill.style.height = `${pos.height}%`;
    score.textContent = pos.score;
    const labelEl = document.querySelector('.eval-label');
    if (labelEl) labelEl.textContent = pos.label;
    showToast(`Evaluated FEN position: ${pos.score}`, 'info');
  });
}

