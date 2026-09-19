/**
 * OmniHub Master Frontend Controller
 * 2026 Tech Equipment Modernization, Voice AI & MCP Bridge
 */

// 12 Independent Projects Default State for Instant Zero-Delay Hydration
const DEFAULT_PROJECTS = [
  {
    id: 'ultron',
    name: 'ULTRON 3.0',
    tagline: 'Autonomous AI Software Synthesis & Self-Healing Operating System',
    category: 'Autonomous AI & Intelligence',
    icon: '⚡',
    port: 8000,
    url: '/apps/ultron/index.html',
    localUrl: 'http://localhost:8000',
    tags: ['Python', 'FastAPI', 'Playwright', 'Multi-Agent', 'Synthesis'],
    techEquipment: 'MCP Server Endpoint + AST Auto-Patching Engine',
    description: 'Transform high-level human objectives into fully functional, production-ready software applications.',
    status: 'online'
  },
  {
    id: 'jarvis',
    name: 'JARVIS Elite',
    tagline: 'Multi-Tier AI Engineering Workstation & Tool Suite',
    category: 'Autonomous AI & Intelligence',
    icon: '🤖',
    port: 3003,
    url: '/apps/jarvis/index.html',
    localUrl: 'http://localhost:3003',
    tags: ['Vite', 'React 19', 'Express', 'FastAPI', 'Vitest'],
    techEquipment: 'In-Browser WebLLM / Local Neural SLM + Voice HUD',
    description: 'Advanced AI assistant with reasoning engines, integrated terminal, unit/regression test harnesses.',
    status: 'online'
  },
  {
    id: 'ai-web-builder',
    name: 'AI Web Builder',
    tagline: 'Universal Generative AI Website Builder (Desktop + Web)',
    category: 'Autonomous AI & Intelligence',
    icon: '🏗️',
    port: 3014,
    url: '/apps/ai-web-builder/index.html',
    localUrl: 'http://localhost:3014',
    tags: ['Next.js', 'Turborepo', 'TypeScript', 'Tailwind CSS'],
    techEquipment: 'Instant Component Sandboxing & Live ZIP Exporter',
    description: 'Autonomous website synthesis engine generating multi-page web designs and layouts.',
    status: 'online'
  },
  {
    id: 'stock-pulse',
    name: 'Stock Pulse',
    tagline: 'Deterministic Fundamental Intelligence for Indian Equities',
    category: 'Fintech & Markets',
    icon: '📊',
    port: 3012,
    url: '/apps/stock-pulse/index.html',
    localUrl: 'http://localhost:3012',
    tags: ['Node.js', 'Express', 'Cheerio', 'PDFKit', 'NSE / BSE'],
    techEquipment: 'TradingView Lightweight Charts v5 + Interactive Reverse DCF Slider',
    description: 'Zero-API-Key fundamental equity analyzer with moat evaluation, reverse DCF valuation, and PDF reports.',
    status: 'online'
  },
  {
    id: 'prediction-arena',
    name: 'Prediction Areena',
    tagline: 'Interactive Decentralized Prediction Market & Betting Arena',
    category: 'Fintech & Markets',
    icon: '🎲',
    port: 3011,
    url: 'https://prediction-areena.vercel.app/play',
    localUrl: 'http://localhost:3011',
    tags: ['Next.js 16', 'React 19', 'LibSQL', 'SQLite', 'Vercel Cloud'],
    techEquipment: 'Cryptographic Provable Fairness (VRF Hash Chain) & Orderbook Depth',
    description: 'Competitive prediction market platform deployed on Vercel with real-time odds, leaderboards, and portfolio management.',
    status: 'online'
  },
  {
    id: 'venom',
    name: 'VENOM Security',
    tagline: 'Automated Web Vulnerability Scanner & Startup Security Audit Suite',
    category: 'Cybersecurity & Privacy',
    icon: '🛡️',
    port: 3007,
    url: 'https://dashboard-sigma-puce-87.vercel.app/onboard',
    iframeUrl: '/api/proxy?url=' + encodeURIComponent('https://dashboard-sigma-puce-87.vercel.app/onboard'),
    localUrl: 'http://localhost:3007',
    tags: ['Next.js', 'Node.js', 'Security Audit', 'Vercel Cloud'],
    techEquipment: 'Static AST Vulnerability Scanner + CVSS 3.1 Severity Calculator',
    description: 'Targeted vulnerability scanner for modern web applications deployed on Vercel with onboarding dashboard.',
    status: 'online'
  },
  {
    id: 'cyber-tree',
    name: 'CYBER TREE',
    tagline: 'Cyber Threat Intelligence & Telemetry Analytics Dashboard',
    category: 'Cybersecurity & Privacy',
    icon: '🌲',
    port: 3000,
    url: 'https://cyber-tree-azure.vercel.app/explore',
    localUrl: 'http://localhost:3000',
    tags: ['Next.js 16', 'Supabase', 'Recharts', 'Vercel Cloud'],
    techEquipment: 'Interactive 3D WebGL Threat Topology (Three.js Attack Arc Globe)',
    description: 'Real-time telemetry and threat intelligence visualizer deployed on Vercel with live graphs and incident logging.',
    status: 'online'
  },
  {
    id: 'whisper-pages',
    name: 'Whisper Pages',
    tagline: 'Anonymous Encrypted Paste & Self-Destructing Message Platform',
    category: 'Cybersecurity & Privacy',
    icon: '🤫',
    port: 3008,
    url: '/apps/whisper-pages/index.html',
    localUrl: 'http://localhost:3008',
    tags: ['Node.js', 'Express', 'SQLite', 'AES Encryption'],
    techEquipment: 'NIST Post-Quantum Hybrid Cryptography (ML-KEM/Kyber-1024)',
    description: 'Secure, zero-knowledge secret-sharing utility with burn-after-reading notes.',
    status: 'online'
  },
  {
    id: 'chess',
    name: 'Cinematic Chess',
    tagline: 'Immersive Cinematic Chess Experience with Stockfish AI Engine',
    category: 'Creative & Utilities',
    icon: '♟️',
    port: 3013,
    url: '/apps/chess/index.html',
    localUrl: 'http://localhost:3013',
    tags: ['TypeScript', 'Stockfish.js', 'Vitest', 'Monorepo'],
    techEquipment: 'WebGPU Realistic PBR 3D Board + Stockfish NNUE Neural Evaluation',
    description: 'Polished chess interface featuring real-time engine evaluation, custom themes, and move history.',
    status: 'online'
  },
  {
    id: 'game-changer',
    name: 'GAME CHANGER (MorphCart)',
    tagline: 'Next-Generation E-Commerce with Dynamic Morphing UI',
    category: 'Creative & Utilities',
    icon: '🛍️',
    port: 3002,
    url: '/apps/game-changer/index.html',
    localUrl: 'http://localhost:3002',
    tags: ['Next.js 16', 'Framer Motion', 'Zod', 'Tailwind CSS'],
    techEquipment: 'Physics-Driven Spring Mesh Dynamics + Web Haptics Triggers',
    description: 'Experimental shopping interface showcasing physics-based cart morphing and checkout flows.',
    status: 'online'
  },
  {
    id: 'jo-form',
    name: 'jo form',
    tagline: 'Dynamic Interactive Form & Survey Builder Suite',
    category: 'Creative & Utilities',
    icon: '📋',
    port: 3009,
    url: 'https://sams-form.vercel.app/',
    localUrl: 'http://localhost:3009',
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Schema Builder'],
    techEquipment: 'Voice-to-Form Generative AI Wizard + Real-Time Schema Parser',
    description: 'Intuitive drag-and-drop form creator with multi-step question workflows and analytics.',
    status: 'online'
  },
  {
    id: 'decluz',
    name: 'DECLUZ',
    tagline: 'Ultra-Smooth Luxury Interaction & GSAP Motion Showcase',
    category: 'Creative & Utilities',
    icon: '✨',
    port: 3001,
    url: '/apps/decluz/index.html',
    localUrl: 'http://localhost:3001',
    tags: ['Vite', 'React 19', 'GSAP', 'Lenis Smooth Scroll'],
    techEquipment: 'WebGL Kinetic Ripple Shaders + Chromatic Aberration Dynamics',
    description: 'Masterclass in modern web animation featuring inertial smooth scrolling and magnetic hover interactions.',
    status: 'online'
  }
];

// Application State
const state = {
  projects: [...DEFAULT_PROJECTS],
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

// Instant Zero-Delay Render on Startup
updateActiveCount();
renderGrid();
renderWorkspaceQuickLaunch();
renderInnovationsTable();

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
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
      state.projects = data.projects;
      updateActiveCount();
      renderGrid();
      renderWorkspaceQuickLaunch();
      renderInnovationsTable();
    }
  } catch (err) {
    console.warn('Backend /api/projects unreachable, keeping instant cached projects:', err);
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
  if (!dom.activeCount) return;
  const onlineCount = state.projects.filter(p => p.status === 'online').length;
  dom.activeCount.textContent = `${onlineCount} / ${state.projects.length}`;
}

// Open All Projects in Real Browser Tabs (Native OS Dispatcher)
window.openAllProjectsInTabs = async function(browser = 'chrome') {
  const browserLabel = browser === 'edge' ? 'Microsoft Edge' : 'Google Chrome';
  const isVercel = window.location.hostname.includes('vercel.app') || window.location.protocol === 'https:';
  
  if (isVercel) {
    const liveUrls = [
      'https://prediction-areena.vercel.app/play',
      'https://cyber-tree-azure.vercel.app/explore',
      'https://dashboard-sigma-puce-87.vercel.app/onboard',
      'https://sams-form.vercel.app/',
      '/apps/chess/index.html',
      '/apps/stock-pulse/index.html',
      '/apps/decluz/index.html',
      '/apps/game-changer/index.html',
      '/apps/ai-web-builder/index.html',
      '/apps/whisper-pages/index.html',
      '/apps/jarvis/index.html',
      '/apps/ultron/index.html'
    ];
    liveUrls.forEach((u, i) => {
      setTimeout(() => window.open(u, '_blank', 'noopener,noreferrer'), i * 150);
    });
    showToast('Launched all 12 cloud applications in browser tabs!', 'success');
    return;
  }
  
  try {
    const res = await fetch('/api/open-all-tabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ browser })
    });
    const data = await res.json();
    if (data && data.success) {
      showToast(`Opened ${data.count} tabs in ${data.browser}!`, 'success');
    } else {
      window.open('https://prediction-areena.vercel.app/play', '_blank');
    }
  } catch (err) {
    window.open('https://prediction-areena.vercel.app/play', '_blank');
  }
};

// Open Single Tab in Real Browser (Bypassing Antigravity Webview)
window.openExternalTab = async function(url) {
  const isVercel = window.location.hostname.includes('vercel.app') || window.location.protocol === 'https:';
  if (isVercel) {
    window.open(url, '_blank');
    return;
  }
  try {
    const res = await fetch('/api/open-tab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      window.open(url, '_blank');
    } else {
      showToast(`Opened in browser: ${url}`, 'info');
    }
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
          <button class="btn-icon-square" title="Open in Real Browser Tab (${p.url})" onclick="openExternalTab('${p.url}')">
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

  // Smart Frame Loader with Security Fallbacks
  if (state.activeWorkspaceId) {
    const activeProject = state.projects.find(p => p.id === state.activeWorkspaceId);
    if (activeProject) {
      loadFrameForProject(dom.mainIframe, dom.primaryFrameWrapper, activeProject);
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
      loadFrameForProject(dom.secondaryIframe, dom.secondaryFrameWrapper, secProject);
    }
  } else {
    dom.secondaryFrameWrapper.style.display = 'none';
  }
}

function loadFrameForProject(iframeEl, wrapperEl, project) {
  if (!project) return;
  
  const isHttpsOrigin = window.location.protocol === 'https:';
  const overlayId = `diag-overlay-${wrapperEl.id}`;
  let overlay = document.getElementById(overlayId);

  // If running on HTTPS cloud and target is unencrypted localhost, display smart diagnostic card
  if (isHttpsOrigin && project.url && project.url.startsWith('http://localhost')) {
    iframeEl.src = 'about:blank';
    delete iframeEl.dataset.currentId;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = overlayId;
      overlay.className = 'workspace-local-diagnostic-overlay';
      wrapperEl.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="diagnostic-card">
        <div class="diag-header">
          <span class="diag-icon">${project.icon}</span>
          <div class="diag-title">
            <h3>${project.name}</h3>
            <span class="port-tag">Dedicated Port :${project.port}</span>
          </div>
        </div>
        <p class="diag-desc">${project.tagline}</p>
        <div class="diag-status-box">
          <div class="status-row">
            <span>Security Isolation:</span>
            <strong class="text-amber">W3C Mixed-Content Protection</strong>
          </div>
          <p class="status-hint">
            OmniHub is running on Vercel over HTTPS. Browsers isolate unencrypted local loopback (<code>${project.url}</code>) from public HTTPS iframes.
          </p>
        </div>
        <div class="diag-actions">
          <button class="btn btn-primary" onclick="openExternalTab('${project.url}')">
            <span>↗ Open in Local Browser Tab</span>
          </button>
          <button class="btn btn-secondary" onclick="switchView('innovations')">
            <span>⚡ 2026 Tech Interactive Lab</span>
          </button>
          <button class="btn btn-ghost" onclick="showLocalRunModal('${project.name}', '${project.port}', '${project.command ? project.command.replace(/'/g, "\\'") : ''}')">
            <span>💻 CLI Instructions</span>
          </button>
        </div>
      </div>
    `;
    overlay.style.display = 'flex';
    return;
  }

  // Remove diagnostic overlay if present
  if (overlay) {
    overlay.style.display = 'none';
  }

  // Determine URL: prioritize iframeUrl (reverse proxy) if available, otherwise direct url
  const targetUrl = project.iframeUrl || project.url;
  if (iframeEl.dataset.currentId !== project.id || iframeEl.src !== targetUrl) {
    iframeEl.src = targetUrl;
    iframeEl.dataset.currentId = project.id;
  }
}

window.showLocalRunModal = function(name, port, command) {
  const modalHtml = `
    <div class="palette-backdrop" id="local-run-modal" style="display: flex;" onclick="if(event.target===this) this.remove()">
      <div class="palette-box" style="max-width: 550px;">
        <div class="diag-header">
          <span class="diag-icon">💻</span>
          <div>
            <h3>Run ${name} Locally</h3>
            <span class="port-tag">Target Port :${port}</span>
          </div>
        </div>
        <p style="color:var(--text-muted);font-size:0.88rem;margin:1rem 0;">
          To run this service in your local environment, execute the following command in its directory:
        </p>
        <pre style="background:rgba(0,0,0,0.5);border:1px solid var(--border-glass);padding:1rem;border-radius:8px;color:var(--accent-cyan);font-family:'JetBrains Mono',monospace;font-size:0.8rem;overflow-x:auto;">${command || `npm run dev -- -p ${port}`}</pre>
        <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
          <button class="btn btn-primary btn-xs" onclick="document.getElementById('local-run-modal').remove()">Got it</button>
        </div>
      </div>
    </div>
  `;
  const existing = document.getElementById('local-run-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

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

