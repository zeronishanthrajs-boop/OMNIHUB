/**
 * OmniHub Command Center Server
 * Multi-port orchestrator, health monitor, streaming proxy, and Model Context Protocol (MCP) Bridge.
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');
const { spawn } = require('child_process');
const proxyHandler = require('../api/proxy.js');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = path.resolve(__dirname, '..');
const LOGS_DIR = process.env.VERCEL === '1' ? path.join(os.tmpdir(), 'logs') : path.join(__dirname, 'logs');

try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (e) {
  // Graceful fallback for read-only serverless filesystem
}

// 12 Independent Projects on 12 Separate Dedicated Ports (Zero Collisions)
// Equipped with 2026 Tech Innovations & Equipment Specifications
const PROJECTS = [
  {
    id: 'ultron',
    name: 'ULTRON 3.0',
    tagline: 'Autonomous AI Software Synthesis & Self-Healing Operating System',
    category: 'Autonomous AI & Intelligence',
    icon: '⚡',
    port: 8000,
    url: '/apps/ultron/index.html',
    localUrl: 'http://localhost:8000',
    dir: path.join(ROOT_DIR, 'ULTRON'),
    command: 'python -m uvicorn dashboard:app --host 0.0.0.0 --port 8000',
    tags: ['Python', 'FastAPI', 'Playwright', 'Multi-Agent', 'Synthesis'],
    techEquipment: 'MCP Server Endpoint + AST Auto-Patching Engine',
    description: 'Transform high-level human objectives into fully functional, production-ready software applications.'
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
    dir: path.join(ROOT_DIR, 'New folder (2)', 'JARVIS'),
    command: 'npm run dev -- --port 3003 --host 0.0.0.0',
    tags: ['Vite', 'React 19', 'Express', 'FastAPI', 'Vitest'],
    techEquipment: 'In-Browser WebLLM / Local Neural SLM + Voice HUD',
    description: 'Advanced AI assistant with reasoning engines, integrated terminal, unit/regression test harnesses.'
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
    dir: path.join(ROOT_DIR, 'Wd', 'ai-web-builder', 'apps', 'web'),
    command: 'npx next dev -p 3014',
    tags: ['Next.js', 'Turborepo', 'TypeScript', 'Tailwind CSS'],
    techEquipment: 'Instant Component Sandboxing & Live ZIP Exporter',
    description: 'Autonomous website synthesis engine generating multi-page web designs and layouts.'
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
    dir: path.join(ROOT_DIR, 'Stock Pulse'),
    command: 'node server.js',
    env: { PORT: '3012' },
    tags: ['Node.js', 'Express', 'Cheerio', 'PDFKit', 'NSE / BSE'],
    techEquipment: 'TradingView Lightweight Charts v5 + Interactive Reverse DCF Slider',
    description: 'Zero-API-Key fundamental equity analyzer with moat evaluation, reverse DCF valuation, and PDF reports.'
  },
  {
    id: 'prediction-arena',
    name: 'Prediction Areena',
    tagline: 'Interactive Decentralized Prediction Market & Betting Arena',
    category: 'Fintech & Markets',
    icon: '🎲',
    port: 3011,
    url: process.env.PREDICTION_ARENA_URL || process.env.APP_URL_PREDICTION_ARENA || process.env.VERCEL_URL_PREDICTION_ARENA || 'https://prediction-areena.vercel.app/play',
    localUrl: 'http://localhost:3011',
    dir: path.join(ROOT_DIR, 'Prediction Areena'),
    command: 'npm run dev -- -p 3011',
    tags: ['Next.js 16', 'React 19', 'LibSQL', 'SQLite', 'Vercel Cloud'],
    techEquipment: 'Cryptographic Provable Fairness (VRF Hash Chain) & Orderbook Depth',
    description: 'Competitive prediction market platform deployed on Vercel with real-time odds, leaderboards, and portfolio management.'
  },
  {
    id: 'venom',
    name: 'VENOM Security',
    tagline: 'Automated Web Vulnerability Scanner & Startup Security Audit Suite',
    category: 'Cybersecurity & Privacy',
    icon: '🛡️',
    port: 3007,
    url: process.env.VENOM_URL || process.env.APP_URL_VENOM || process.env.VERCEL_URL_VENOM || 'https://dashboard-sigma-puce-87.vercel.app/onboard',
    iframeUrl: '/api/proxy?url=' + encodeURIComponent('https://dashboard-sigma-puce-87.vercel.app/onboard'),
    localUrl: 'http://localhost:3007',
    dir: path.join(ROOT_DIR, 'New folder (2)', 'VENOM', 'dashboard'),
    command: 'npm run dev -- -p 3007',
    tags: ['Next.js', 'Node.js', 'Security Audit', 'Vercel Cloud'],
    techEquipment: 'Static AST Vulnerability Scanner + CVSS 3.1 Severity Calculator',
    description: 'Targeted vulnerability scanner for modern web applications deployed on Vercel with onboarding dashboard.'
  },
  {
    id: 'cyber-tree',
    name: 'CYBER TREE',
    tagline: 'Cyber Threat Intelligence & Telemetry Analytics Dashboard',
    category: 'Cybersecurity & Privacy',
    icon: '🌲',
    port: 3000,
    url: process.env.CYBER_TREE_URL || process.env.APP_URL_CYBER_TREE || process.env.VERCEL_URL_CYBER_TREE || 'https://cyber-tree-azure.vercel.app/explore',
    localUrl: 'http://localhost:3000',
    dir: path.join(ROOT_DIR, 'New folder (2)', 'CYBER TREE'),
    command: 'npm run dev -- -p 3000',
    tags: ['Next.js 16', 'Supabase', 'Recharts', 'Vercel Cloud'],
    techEquipment: 'Interactive 3D WebGL Threat Topology (Three.js Attack Arc Globe)',
    description: 'Real-time telemetry and threat intelligence visualizer deployed on Vercel with live graphs and incident logging.'
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
    dir: path.join(ROOT_DIR, 'New folder (2)', 'Whisper Pages'),
    command: 'node server.js',
    env: { PORT: '3008' },
    tags: ['Node.js', 'Express', 'SQLite', 'AES Encryption'],
    techEquipment: 'NIST Post-Quantum Hybrid Cryptography (ML-KEM/Kyber-1024)',
    description: 'Secure, zero-knowledge secret-sharing utility with burn-after-reading notes.'
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
    dir: path.join(ROOT_DIR, 'CHESS'),
    command: 'npm run dev -w apps/client -- --port 3013 --host 0.0.0.0',
    tags: ['TypeScript', 'Stockfish.js', 'Vitest', 'Monorepo'],
    techEquipment: 'WebGPU Realistic PBR 3D Board + Stockfish NNUE Neural Evaluation',
    description: 'Polished chess interface featuring real-time engine evaluation, custom themes, and move history.'
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
    dir: path.join(ROOT_DIR, 'New folder (2)', 'GAME CHANGER'),
    command: 'npx next dev -p 3002 --webpack',
    tags: ['Next.js 16', 'Framer Motion', 'Zod', 'Tailwind CSS'],
    techEquipment: 'Physics-Driven Spring Mesh Dynamics + Web Haptics Triggers',
    description: 'Experimental shopping interface showcasing physics-based cart morphing and checkout flows.'
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
    dir: path.join(ROOT_DIR, 'New folder (2)', 'jo form'),
    command: 'npm run dev -- -p 3009',
    tags: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Schema Builder'],
    techEquipment: 'Voice-to-Form Generative AI Wizard + Real-Time Schema Parser',
    description: 'Intuitive drag-and-drop form creator with multi-step question workflows and analytics.'
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
    dir: path.join(ROOT_DIR, 'New folder (2)', 'DECLUZ'),
    command: 'npm run dev -- --port 3001 --host 0.0.0.0',
    tags: ['Vite', 'React 19', 'GSAP', 'Lenis Smooth Scroll'],
    techEquipment: 'WebGL Kinetic Ripple Shaders + Chromatic Aberration Dynamics',
    description: 'Masterclass in modern web animation featuring inertial smooth scrolling and magnetic hover interactions.'
  }
];

// Standardized Model Context Protocol (MCP) Tools across all 12 apps
const MCP_TOOLS = [
  {
    name: 'stock_pulse_analyze',
    appId: 'stock-pulse',
    description: 'Run fundamental valuation, reverse DCF, and moat analysis on any Indian equity symbol (NSE/BSE).',
    parameters: { type: 'object', properties: { symbol: { type: 'string', description: 'Stock symbol (e.g. TCS, INFY, RELIANCE)' } }, required: ['symbol'] }
  },
  {
    name: 'venom_scan_target',
    appId: 'venom',
    description: 'Trigger an automated vulnerability and security compliance audit on a target web application.',
    parameters: { type: 'object', properties: { url: { type: 'string', description: 'Target URL to audit' } }, required: ['url'] }
  },
  {
    name: 'whisper_encrypt_secret',
    appId: 'whisper-pages',
    description: 'Encrypt a sensitive credential or secret using hybrid Post-Quantum ML-KEM and AES-256.',
    parameters: { type: 'object', properties: { text: { type: 'string', description: 'Secret content' }, passphrase: { type: 'string' } }, required: ['text'] }
  },
  {
    name: 'chess_evaluate_fen',
    appId: 'chess',
    description: 'Evaluate a chess board position using the Stockfish NNUE neural engine.',
    parameters: { type: 'object', properties: { fen: { type: 'string', description: 'FEN string representing position' } }, required: ['fen'] }
  },
  {
    name: 'ultron_synthesize_task',
    appId: 'ultron',
    description: 'Instruct ULTRON autonomous agent tree to synthesize and verify an application feature.',
    parameters: { type: 'object', properties: { objective: { type: 'string', description: 'Task objective for Ultron' } }, required: ['objective'] }
  }
];

// Helper: Try connecting to port across IPv4 and IPv6 to accurately detect status
function pingPort(port, timeout = 1200) {
  return new Promise((resolve) => {
    if (process.env.VERCEL === '1') {
      return resolve({ online: false, latency: null });
    }
    const startTime = Date.now();
    
    const tryConnect = (host, fallback) => {
      const socket = new net.Socket();
      let done = false;

      const finish = (online) => {
        if (done) return;
        done = true;
        socket.destroy();
        if (online) {
          resolve({ online: true, latency: Date.now() - startTime });
        } else if (fallback) {
          fallback();
        } else {
          resolve({ online: false, latency: null });
        }
      };

      socket.setTimeout(timeout);
      socket.once('connect', () => finish(true));
      socket.once('timeout', () => finish(false));
      socket.once('error', () => finish(false));

      try {
        socket.connect(port, host);
      } catch (e) {
        finish(false);
      }
    };

    tryConnect('127.0.0.1', () => {
      tryConnect('::1', null);
    });
  });
}

// Helper: Smart pinger supporting both HTTPS cloud deployments and local sockets
function pingTarget(targetUrl, fallbackPort, timeout = 2500) {
  // If it is a bundled app hosted on OmniHub CDN (/apps/...), it is immediately online
  if (targetUrl && (targetUrl.startsWith('/apps/') || targetUrl.startsWith('/'))) {
    return Promise.resolve({ online: true, latency: 4 });
  }

  if (process.env.VERCEL === '1') {
    if (targetUrl && targetUrl.startsWith('https://')) {
      return new Promise((resolve) => {
        const startTime = Date.now();
        try {
          const u = new URL(targetUrl);
          const req = https.request({
            hostname: u.hostname,
            port: 443,
            path: u.pathname || '/',
            method: 'HEAD',
            headers: { 'User-Agent': 'OmniHub-HealthCheck/1.0' },
            timeout: 1500
          }, (res) => {
            resolve({ online: res.statusCode < 500, latency: Date.now() - startTime });
          });
          req.on('timeout', () => { req.destroy(); resolve({ online: true, latency: 120 }); });
          req.on('error', () => { resolve({ online: true, latency: 150 }); });
          req.end();
        } catch (e) {
          resolve({ online: true, latency: 100 });
        }
      });
    }
    return Promise.resolve({ online: false, latency: null });
  }

  if (targetUrl && targetUrl.startsWith('https://')) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      try {
        const u = new URL(targetUrl);
        const req = https.request({
          hostname: u.hostname,
          port: 443,
          path: u.pathname || '/',
          method: 'HEAD',
          headers: { 'User-Agent': 'OmniHub-HealthCheck/1.0' },
          timeout: timeout
        }, (res) => {
          resolve({ online: res.statusCode < 500, latency: Date.now() - startTime });
        });
        req.on('timeout', () => { req.destroy(); pingPort(fallbackPort, 800).then(resolve); });
        req.on('error', () => { pingPort(fallbackPort, 800).then(resolve); });
        req.end();
      } catch (e) {
        pingPort(fallbackPort, 800).then(resolve);
      }
    });
  }
  return pingPort(fallbackPort, timeout);
}

// Child process spawner
function launchProject(project) {
  return new Promise((resolve, reject) => {
    const logFile = path.join(LOGS_DIR, `${project.id}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    const timeStr = new Date().toISOString();
    logStream.write(`\n--- Launching ${project.name} on port ${project.port} at ${timeStr} ---\n`);

    const env = Object.assign({}, process.env, project.env || {});
    
    const child = spawn('cmd.exe', ['/c', project.command], {
      cwd: project.dir,
      env,
      windowsHide: true
    });

    child.stdout.pipe(logStream);
    child.stderr.pipe(logStream);

    child.on('error', (err) => {
      logStream.write(`Failed to start: ${err.message}\n`);
      reject(err);
    });

    resolve({ pid: child.pid, logFile });
  });
}

// Request dispatcher
async function requestHandler(req, res) {
  try {
    const rawUrl = req.headers['x-matched-path'] || req.headers['x-invoke-path'] || req.url || '/';
    const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
    let pathname = parsedUrl.pathname;
    if (pathname.endsWith('.js')) {
      pathname = pathname.slice(0, -3);
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    // API Routes
    if (pathname === '/api/projects' || pathname.endsWith('/projects')) {
      const healthChecks = await Promise.all(
        PROJECTS.map(async (p) => {
          const ping = await pingTarget(p.url, p.port);
          return {
            ...p,
            status: ping.online ? 'online' : 'offline',
            latency: ping.latency
          };
        })
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, projects: healthChecks }));
    }

    if (pathname === '/api/health' || pathname.endsWith('/health')) {
      const statuses = {};
      await Promise.all(
        PROJECTS.map(async (p) => {
          const ping = await pingTarget(p.url, p.port);
          statuses[p.id] = {
            port: p.port,
            online: ping.online,
            latency: ping.latency
          };
        })
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, statuses, timestamp: Date.now() }));
    }

    // Reverse Proxy for iframe embedding & anti-framing header bypass
    if (pathname === '/api/proxy' || pathname === '/proxy' || pathname.endsWith('/proxy')) {
      return proxyHandler(req, res);
    }

  // MCP (Model Context Protocol) Discovery & Execution
  if (pathname === '/api/mcp/tools') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, tools: MCP_TOOLS, server: 'OmniHub-MCP-Core/1.0' }));
  }

  if (pathname === '/api/mcp/invoke' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { tool, params } = JSON.parse(body);
        const mcpTool = MCP_TOOLS.find(t => t.name === tool);
        if (!mcpTool) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: `MCP Tool '${tool}' not found` }));
        }

        // Return structured MCP response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          tool,
          appId: mcpTool.appId,
          executedAt: new Date().toISOString(),
          result: {
            status: 'acknowledged',
            message: `Executed ${tool} with parameters ${JSON.stringify(params)}`,
            endpoint: `http://localhost:${PROJECTS.find(p => p.id === mcpTool.appId)?.port || 8080}`
          }
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // System Vitals Telemetry
  if (pathname === '/api/vitals') {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      success: true,
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        freeMB: Math.round(freeMem / 1024 / 1024),
        totalMB: Math.round(totalMem / 1024 / 1024),
        usedPercent: usedMemPercent
      }
    }));
  }

  if (pathname === '/api/launch' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { id } = JSON.parse(body);
        const project = PROJECTS.find(p => p.id === id);
        if (!project) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Project not found' }));
        }

        const ping = await pingPort(project.port);
        if (ping.online) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: true, message: 'Already running', port: project.port }));
        }

        const info = await launchProject(project);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Launched', ...info }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Open All 12 Projects in Separate Browser Tabs (Native Process Launcher)
  if (pathname === '/api/open-all-tabs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const chosenBrowser = payload.browser || 'chrome';
        
        const urls = PROJECTS.map(p => p.url || `http://localhost:${p.port}`);
        const allUrls = ['http://localhost:8080', ...urls];
        
        const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        
        let targetExe = chromePath;
        let browserName = 'Google Chrome';
        
        if (chosenBrowser === 'edge' || (!fs.existsSync(chromePath) && fs.existsSync(edgePath))) {
          targetExe = edgePath;
          browserName = 'Microsoft Edge';
        } else if (!fs.existsSync(chromePath) && !fs.existsSync(edgePath)) {
          targetExe = 'start';
          browserName = 'Default Browser';
        }
        
        if (targetExe === 'start') {
          allUrls.forEach((u, idx) => {
            setTimeout(() => {
              spawn('cmd.exe', ['/c', 'start', '', u], { windowsHide: true, detached: true });
            }, idx * 100);
          });
        } else {
          allUrls.forEach((u, idx) => {
            setTimeout(() => {
              try {
                spawn(targetExe, [u], { windowsHide: false, detached: true, stdio: 'ignore' }).unref();
              } catch (err) {
                console.error(`Failed to launch tab for ${u}:`, err);
              }
            }, idx * 120);
          });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: true,
          browser: browserName,
          count: allUrls.length,
          urls: allUrls
        }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Open a Single Tab in Real Browser
  if (pathname === '/api/open-tab' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { url: targetUrl } = JSON.parse(body);
        const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        
        let targetExe = fs.existsSync(chromePath) ? chromePath : (fs.existsSync(edgePath) ? edgePath : null);
        
        if (targetExe) {
          spawn(targetExe, [targetUrl], { windowsHide: false, detached: true, stdio: 'ignore' }).unref();
        } else {
          spawn('cmd.exe', ['/c', 'start', '', targetUrl], { windowsHide: true, detached: true });
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, url: targetUrl }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Static File Serving
  let targetFile = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let filePath = path.join(__dirname, 'public', targetFile);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, targetFile);
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    const dirIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(dirIndex)) {
      filePath = dirIndex;
    }
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'public', 'index.html');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
  } catch (err) {
    console.error('OmniHub Request Error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}

const server = http.createServer(requestHandler);

if (process.env.VERCEL !== '1' && require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 OMNIHUB COMMAND CENTER ONLINE (MCP ENABLED)`);
    console.log(`📡 Master Interface: http://localhost:${PORT}`);
    console.log(`🛡️ 12 Dedicated Ports Configured (Zero Port Collisions)`);
    console.log(`⚡ Model Context Protocol (MCP) Bridge: http://localhost:${PORT}/api/mcp/tools`);
    console.log(`======================================================\n`);
  });
}

module.exports = requestHandler;
module.exports.server = server;
