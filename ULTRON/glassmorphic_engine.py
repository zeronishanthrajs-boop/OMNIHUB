"""
ULTRON Quantum Glassmorphic Application Engine
Generates self-contained, Diamond-grade glassmorphic web applications and multi-domain microservices.
"""

import html
import re

# Shared Glassmorphic CSS Design System
GLASS_DESIGN_SYSTEM = """
:root {
  --bg-primary: #050814;
  --bg-surface: rgba(15, 23, 42, 0.65);
  --bg-surface-hover: rgba(30, 41, 59, 0.75);
  --border-glass: rgba(255, 255, 255, 0.12);
  --border-glow: rgba(0, 240, 255, 0.35);
  --accent-cyan: #00f0ff;
  --accent-violet: #8a2be2;
  --accent-emerald: #00ff88;
  --accent-amber: #ffaa00;
  --accent-rose: #ff3366;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--bg-primary);
  background-image: 
    radial-gradient(circle at 15% 15%, rgba(0, 240, 255, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(138, 43, 226, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.5) 0%, transparent 100%);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  min-height: 100vh;
  padding: 24px;
  overflow-x: hidden;
  position: relative;
}

.ambient-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.35;
}
.glow-1 { top: -100px; left: -100px; width: 400px; height: 400px; background: var(--accent-cyan); }
.glow-2 { bottom: -100px; right: -100px; width: 450px; height: 450px; background: var(--accent-violet); }

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.glass-panel {
  background: var(--bg-surface);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid var(--border-glass);
  border-radius: 18px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-panel:hover {
  border-color: var(--border-glow);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.55), 0 0 24px rgba(0, 240, 255, 0.12);
}

.glass-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  margin-bottom: 24px;
}

.brand-title {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 0%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-badge {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 9999px;
  background: rgba(0, 240, 255, 0.12);
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  text-transform: uppercase;
}

.glass-input, .glass-select {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 0.95rem;
  backdrop-filter: blur(10px);
  outline: none;
  width: 100%;
  transition: all 0.2s ease;
}

.glass-input:focus, .glass-select:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 16px rgba(0, 240, 255, 0.3);
  background: rgba(255, 255, 255, 0.07);
}

.glass-btn {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(138, 43, 226, 0.2) 100%);
  border: 1px solid rgba(0, 240, 255, 0.4);
  border-radius: 12px;
  padding: 12px 22px;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(0, 240, 255, 0.15);
}

.glass-btn:hover {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, rgba(138, 43, 226, 0.35) 100%);
  border-color: var(--accent-cyan);
  box-shadow: 0 6px 25px rgba(0, 240, 255, 0.35);
  transform: translateY(-2px);
}

.glass-btn:active {
  transform: translateY(0);
}

.glass-btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
}

.glass-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.stat-val {
  font-size: 1.8rem;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
}
"""

WEB_AUDIO_SCRIPT = """
<script>
const SoundEngine = {
  ctx: null,
  enabled: true,
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },
  playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.05) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  click() { this.playTone(800, 'sine', 0.04, 0.04); },
  success() {
    this.playTone(523.25, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.05), 80);
  },
  action() { this.playTone(440, 'triangle', 0.06, 0.05); }
};

document.addEventListener('click', (e) => {
  if (e.target.closest('button, .glass-btn, .clickable')) {
    SoundEngine.click();
  }
});
</script>
"""

def render_calculator_app(goal: str) -> str:
    template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ULTRON Calc // Quantum Glassmorphic Math Engine</title>
<style>
__CSS__

.calc-wrapper {
  max-width: 440px;
  margin: 40px auto;
  padding: 28px;
}

.calc-display-panel {
  background: rgba(5, 10, 25, 0.85);
  border: 1px solid var(--border-glass);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: right;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
}

#expression {
  font-family: var(--font-mono);
  font-size: 0.95rem;
  color: var(--text-secondary);
  min-height: 22px;
  word-break: break-all;
}

#display {
  font-family: var(--font-mono);
  font-size: 2.4rem;
  font-weight: 700;
  color: #ffffff;
  overflow-x: auto;
  white-space: nowrap;
}

.calc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.calc-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  padding: 16px 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.calc-btn:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.calc-btn.op {
  color: var(--accent-cyan);
  background: rgba(0, 240, 255, 0.08);
  border-color: rgba(0, 240, 255, 0.2);
}

.calc-btn.action {
  color: var(--accent-amber);
}

#btn-equals {
  grid-column: span 2;
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, rgba(138, 43, 226, 0.4) 100%);
  border-color: var(--accent-cyan);
  color: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 240, 255, 0.3);
}

#btn-equals:hover {
  box-shadow: 0 6px 28px rgba(0, 240, 255, 0.5);
}

.history-panel {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-glass);
}
.history-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.history-list {
  max-height: 100px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.history-item {
  padding: 4px 0;
  cursor: pointer;
}
.history-item:hover {
  color: var(--accent-cyan);
}
</style>
</head>
<body>
<div class="ambient-glow glow-1"></div>
<div class="ambient-glow glow-2"></div>

<div class="app-container">
  <div class="glass-panel calc-wrapper">
    <div class="brand-title" style="margin-bottom: 16px;">
      ⚡ ULTRON Calc
      <span class="brand-badge">PRO-TIER</span>
    </div>

    <div class="calc-display-panel">
      <div id="expression"></div>
      <div id="display">0</div>
    </div>

    <div class="calc-grid">
      <button class="calc-btn action" onclick="clearAll()">AC</button>
      <button class="calc-btn action" onclick="backspace()">DEL</button>
      <button class="calc-btn op" onclick="appendOp('%')">%</button>
      <button class="calc-btn op" onclick="appendOp('/')">÷</button>

      <button class="calc-btn" onclick="appendNum('7')">7</button>
      <button class="calc-btn" onclick="appendNum('8')">8</button>
      <button class="calc-btn" onclick="appendNum('9')">9</button>
      <button class="calc-btn op" onclick="appendOp('*')">×</button>

      <button class="calc-btn" onclick="appendNum('4')">4</button>
      <button class="calc-btn" onclick="appendNum('5')">5</button>
      <button class="calc-btn" onclick="appendNum('6')">6</button>
      <button class="calc-btn op" onclick="appendOp('-')">−</button>

      <button class="calc-btn" onclick="appendNum('1')">1</button>
      <button class="calc-btn" onclick="appendNum('2')">2</button>
      <button class="calc-btn" onclick="appendNum('3')">3</button>
      <button class="calc-btn op" onclick="appendOp('+')">+</button>

      <button class="calc-btn" onclick="appendNum('0')">0</button>
      <button class="calc-btn" onclick="appendNum('.')">.</button>
      <button id="btn-equals" class="calc-btn" onclick="calculate()">=</button>
    </div>

    <div class="history-panel">
      <div class="history-title">Session History</div>
      <div id="history-list" class="history-list"></div>
    </div>
  </div>
</div>

__AUDIO__

<script>
let current = '0';
let expr = '';
let isEvaluated = false;

function updateDisplay() {
  document.getElementById('display').innerText = current;
  document.getElementById('expression').innerText = expr;
}

function appendNum(num) {
  if (isEvaluated) {
    current = '';
    isEvaluated = false;
  }
  if (num === '.' && current.includes('.')) return;
  if (current === '0' && num !== '.') {
    current = num;
  } else {
    current += num;
  }
  updateDisplay();
}

function appendOp(op) {
  if (isEvaluated) isEvaluated = false;
  expr += current + ' ' + op + ' ';
  current = '0';
  updateDisplay();
}

function clearAll() {
  current = '0';
  expr = '';
  isEvaluated = false;
  updateDisplay();
}

function backspace() {
  if (current.length > 1) {
    current = current.slice(0, -1);
  } else {
    current = '0';
  }
  updateDisplay();
}

function calculate() {
  try {
    const fullExpr = (expr + current).replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-');
    const sanitized = fullExpr.replace(/[^0-9+\\-*\\/().% ]/g, '');
    const result = Function('"use strict";return (' + sanitized + ')')();
    const resultStr = Number.isFinite(result) ? String(Math.round(result * 1000000) / 1000000) : 'Error';
    
    const historyList = document.getElementById('history-list');
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerText = fullExpr + ' = ' + resultStr;
    item.onclick = () => { current = resultStr; isEvaluated = false; updateDisplay(); };
    historyList.prepend(item);
    
    expr = '';
    current = resultStr;
    isEvaluated = true;
    updateDisplay();
    SoundEngine.success();
  } catch (err) {
    current = 'Error';
    isEvaluated = true;
    updateDisplay();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') appendNum(e.key);
  else if (e.key === '.') appendNum('.');
  else if (['+', '-', '*', '/'].includes(e.key)) appendOp(e.key);
  else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculate(); }
  else if (e.key === 'Backspace') backspace();
  else if (e.key === 'Escape') clearAll();
});
</script>
</body>
</html>"""
    return template.replace("__CSS__", GLASS_DESIGN_SYSTEM).replace("__AUDIO__", WEB_AUDIO_SCRIPT)

def render_docx_converter_app(goal: str) -> str:
    template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Image to DOCX Studio // 1-Click Document Engine</title>
<style>
__CSS__

.converter-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
}

@media (max-width: 960px) {
  .converter-grid { grid-template-columns: 1fr; }
}

.upload-zone {
  border: 2px dashed rgba(0, 240, 255, 0.4);
  border-radius: 14px;
  padding: 32px 20px;
  text-align: center;
  background: rgba(0, 240, 255, 0.03);
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  margin-bottom: 20px;
}

.upload-zone:hover, .upload-zone.dragover {
  border-color: var(--accent-cyan);
  background: rgba(0, 240, 255, 0.08);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 2.4rem;
  margin-bottom: 12px;
  display: block;
}

.upload-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.upload-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.queue-container {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 8px 12px;
  transition: all 0.2s;
}

.queue-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(0, 240, 255, 0.3);
}

.queue-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: #000;
}

.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-meta {
  font-size: 0.72rem;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}

.queue-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon-sm {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-icon-sm:hover {
  color: #ff3366;
  border-color: #ff3366;
  background: rgba(255, 51, 102, 0.1);
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
  letter-spacing: 0.05em;
}

.form-control {
  width: 100%;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-control:focus {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 10px rgba(0, 240, 255, 0.25);
}

.btn-convert-action {
  width: 100%;
  background: linear-gradient(135deg, #00f0ff 0%, #00a8ff 100%);
  color: #050814;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0, 240, 255, 0.35);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 18px;
}

.btn-convert-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 240, 255, 0.55);
}

.btn-convert-action:active {
  transform: translateY(0);
}

.preview-container {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 24px;
  min-height: 520px;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-canvas-sheet {
  background: #ffffff;
  color: #1e293b;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  flex: 1;
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
  min-height: 480px;
  display: flex;
  flex-direction: column;
}

.doc-sheet-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  color: #0f172a;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 12px;
}

.doc-sheet-grid {
  display: grid;
  gap: 20px;
  flex: 1;
}

.doc-sheet-img-wrap {
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 10px;
}

.doc-sheet-img {
  max-width: 100%;
  max-height: 240px;
  object-fit: contain;
  border-radius: 4px;
}

.doc-sheet-caption {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 6px;
  font-family: var(--font-mono);
}

.empty-preview-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  gap: 12px;
  padding: 60px 0;
}
</style>
</head>
<body>
<div class="ambient-glow glow-1"></div>
<div class="ambient-glow glow-2"></div>

<div class="app-container">
  <header class="glass-panel glass-header">
    <div class="brand-title">
      <span>⚡</span>
      <span>DOCX Studio // 1-Click Engine</span>
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <span class="brand-badge" id="imageCountBadge">0 Images Loaded</span>
      <button class="btn-icon-sm" onclick="clearAllImages()" title="Clear All Images">✕</button>
    </div>
  </header>

  <div class="converter-grid">
    <!-- Left Configuration & Queue -->
    <div class="glass-panel" style="padding: 24px;">
      <!-- Hidden File Input -->
      <input type="file" id="fileUploadInput" multiple accept="image/*" style="display: none;" onchange="handleFileSelect(event)">

      <!-- Drag & Drop Zone -->
      <div class="upload-zone" id="dropZone" onclick="document.getElementById('fileUploadInput').click()">
        <span class="upload-icon">📁</span>
        <div class="upload-title">Drop images here or click to browse</div>
        <div class="upload-subtitle">Supports PNG, JPG, JPEG, WebP, GIF, SVG</div>
      </div>

      <!-- Queue list -->
      <div class="form-label" style="display: flex; justify-content: space-between;">
        <span>Selected Images</span>
        <span id="queueSizeSummary" style="font-family: var(--font-mono); color: var(--accent-cyan);">0 files</span>
      </div>
      <div class="queue-container" id="imagesQueueList">
        <div style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 24px 0;">
          No images uploaded yet
        </div>
      </div>

      <!-- Settings -->
      <div class="form-group">
        <label class="form-label">Document Title</label>
        <input type="text" class="form-control" id="docTitleInput" value="Converted Image Document" oninput="updatePreviewSheet()">
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label class="form-label">Images Per Page</label>
          <select class="form-control" id="layoutSpacingSelect" onchange="updatePreviewSheet()">
            <option value="1">1 Image / Page</option>
            <option value="2" selected>2 Images / Page</option>
            <option value="flow">Continuous Flow</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Page Orientation</label>
          <select class="form-control" id="pageOrientationSelect" onchange="updatePreviewSheet()">
            <option value="portrait" selected>Portrait (8.5 x 11")</option>
            <option value="landscape">Landscape (11 x 8.5")</option>
          </select>
        </div>
      </div>

      <div class="form-group" style="display:flex;align-items:center;gap:10px;margin-top:8px;">
        <input type="checkbox" id="includeCaptionsCheck" checked onchange="updatePreviewSheet()" style="accent-color: var(--accent-cyan); width: 16px; height: 16px; cursor: pointer;">
        <label for="includeCaptionsCheck" style="font-size: 0.85rem; color: var(--text-primary); cursor: pointer;">Include image filename captions</label>
      </div>

      <!-- 1-Click Action Button -->
      <button class="btn-convert-action" id="btn1ClickConvert" onclick="convertAndDownloadDocx()">
        <span>⚡</span>
        <span>Convert to DOCX (1-Click)</span>
      </button>
    </div>

    <!-- Right Live Virtual Page Preview -->
    <div class="glass-panel preview-container">
      <div class="preview-header">
        <div class="preview-title">
          <span>📄</span>
          <span>Live Document Virtual Preview</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono);" id="previewMetaText">
          A4 Standard // Ready to Export
        </div>
      </div>

      <div class="preview-canvas-sheet" id="previewSheet">
        <div class="doc-sheet-title" id="sheetDocTitle">Converted Image Document</div>
        <div class="doc-sheet-grid" id="sheetImagesGrid">
          <div class="empty-preview-notice">
            <span style="font-size: 2.2rem; opacity: 0.4;">🖼️</span>
            <span>Upload or drag images above to see the live document layout preview.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

__AUDIO__

<script>
let uploadedImages = [];

const dropZone = document.getElementById('dropZone');
['dragenter', 'dragover'].forEach(name => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach(name => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
});
dropZone.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files) {
    processFiles(Array.from(e.dataTransfer.files));
  }
});

function handleFileSelect(e) {
  if (e.target.files) {
    processFiles(Array.from(e.target.files));
  }
}

function processFiles(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (!imageFiles.length) {
    alert('Please select valid image files.');
    return;
  }
  
  if (window.playClickSound) window.playClickSound();

  let loaded = 0;
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImages.push({
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        dataUrl: e.target.result
      });
      loaded++;
      if (loaded === imageFiles.length) {
        renderQueue();
        updatePreviewSheet();
      }
    };
    reader.readAsDataURL(file);
  });
}

function removeImage(id) {
  uploadedImages = uploadedImages.filter(img => img.id !== id);
  renderQueue();
  updatePreviewSheet();
}

function clearAllImages() {
  uploadedImages = [];
  renderQueue();
  updatePreviewSheet();
}

function renderQueue() {
  const list = document.getElementById('imagesQueueList');
  const countBadge = document.getElementById('imageCountBadge');
  const sizeSummary = document.getElementById('queueSizeSummary');

  countBadge.textContent = `${uploadedImages.length} Images Loaded`;
  sizeSummary.textContent = `${uploadedImages.length} files`;

  if (!uploadedImages.length) {
    list.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 24px 0;">No images uploaded yet</div>';
    return;
  }

  list.innerHTML = uploadedImages.map((img, idx) => `
    <div class="queue-item">
      <img src="${img.dataUrl}" class="queue-thumb" alt="thumb">
      <div class="queue-info">
        <div class="queue-name">${idx + 1}. ${escapeHtml(img.name)}</div>
        <div class="queue-meta">${img.size}</div>
      </div>
      <div class="queue-actions">
        <button class="btn-icon-sm" onclick="removeImage('${img.id}')" title="Remove">✕</button>
      </div>
    </div>
  `).join('');
}

function updatePreviewSheet() {
  const title = document.getElementById('docTitleInput').value || 'Converted Image Document';
  document.getElementById('sheetDocTitle').textContent = title;

  const grid = document.getElementById('sheetImagesGrid');
  const spacing = document.getElementById('layoutSpacingSelect').value;
  const includeCaptions = document.getElementById('includeCaptionsCheck').checked;

  if (spacing === '2') {
    grid.style.gridTemplateColumns = '1fr 1fr';
  } else if (spacing === '1') {
    grid.style.gridTemplateColumns = '1fr';
  } else {
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
  }

  if (!uploadedImages.length) {
    grid.innerHTML = `
      <div class="empty-preview-notice">
        <span style="font-size: 2.2rem; opacity: 0.4;">🖼️</span>
        <span>Upload or drag images above to see the live document layout preview.</span>
      </div>
    `;
    return;
  }

  grid.innerHTML = uploadedImages.map((img) => `
    <div class="doc-sheet-img-wrap">
      <img src="${img.dataUrl}" class="doc-sheet-img" alt="${escapeHtml(img.name)}">
      ${includeCaptions ? `<div class="doc-sheet-caption">${escapeHtml(img.name)}</div>` : ''}
    </div>
  `).join('');
}

function convertAndDownloadDocx() {
  if (!uploadedImages.length) {
    alert('Please upload at least 1 image to convert to DOCX.');
    return;
  }

  if (window.playSuccessSound) window.playSuccessSound();

  const title = document.getElementById('docTitleInput').value || 'Converted Image Document';
  const spacing = document.getElementById('layoutSpacingSelect').value;
  const orientation = document.getElementById('pageOrientationSelect').value;
  const includeCaptions = document.getElementById('includeCaptionsCheck').checked;

  const isLandscape = orientation === 'landscape';
  const pageSize = isLandscape ? '11.0in 8.5in' : '8.5in 11.0in';

  let imagesHtml = '';
  uploadedImages.forEach((img, idx) => {
    const pageBreak = (spacing === '1' && idx > 0) ? '<br clear=all style="mso-special-character:line-break;page-break-before:always">' : '';
    const twoPageBreak = (spacing === '2' && idx > 0 && idx % 2 === 0) ? '<br clear=all style="mso-special-character:line-break;page-break-before:always">' : '';
    const captionHtml = includeCaptions ? `<p class="MsoCaption" style="font-size:10pt;color:#555;margin-top:4pt;text-align:center;">${escapeHtml(img.name)}</p>` : '';

    imagesHtml += `
      ${pageBreak}
      ${twoPageBreak}
      <div style="text-align:center;margin:16pt 0;">
        <img src="${img.dataUrl}" style="max-width:100%;max-height:${spacing === '2' ? '320px' : '520px'};display:block;margin:0 auto;border:1px solid #ccc;" alt="${escapeHtml(img.name)}">
        ${captionHtml}
      </div>
    `;
  });

  const docxTemplate = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>${escapeHtml(title)}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
<style>
@page Section1 { size:${pageSize}; margin:1.0in 1.0in 1.0in 1.0in; mso-header-margin:.5in; mso-footer-margin:.5in; mso-paper-source:0; }
div.Section1 { page:Section1; }
p.MsoNormal { margin:0in; margin-bottom:10pt; font-size:12.0pt; font-family:"Calibri",sans-serif; color:#111; }
h1.DocTitle { text-align:center; font-size:24.0pt; font-family:"Calibri",sans-serif; color:#0f172a; border-bottom:2px solid #334155; padding-bottom:12pt; margin-bottom:20pt; }
</style>
<` + `/head>
<body lang=EN-US>
<div class="Section1">
  <h1 class="DocTitle">${escapeHtml(title)}</h1>
  ${imagesHtml}
</div>
<` + `/body>
<` + `/html>
  `;

  const blob = new Blob(['\ufeff', docxTemplate], { type: 'application/msword' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cleanFilename = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '.docx';
  a.href = downloadUrl;
  a.download = cleanFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);

  const btn = document.getElementById('btn1ClickConvert');
  const origText = btn.innerHTML;
  btn.innerHTML = '<span>✓</span> <span>Downloaded ' + cleanFilename + '!</span>';
  btn.style.background = '#00ff88';
  setTimeout(() => {
    btn.innerHTML = origText;
    btn.style.background = '';
  }, 2500);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}
</script>
</body>
</html>"""
    return template.replace("__CSS__", GLASS_DESIGN_SYSTEM).replace("__AUDIO__", WEB_AUDIO_SCRIPT)

def render_pdf_builder_app(goal: str) -> str:
    template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Automatic PDF Studio // ULTRON Document Engine</title>
<style>
__CSS__

.studio-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .studio-grid { grid-template-columns: 1fr; }
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

#pdf-preview-box {
  background: #ffffff;
  color: #1e293b;
  border-radius: 12px;
  padding: 40px;
  min-height: 600px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.doc-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 20px;
  margin-bottom: 24px;
}

.doc-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0;
}

.doc-table th {
  background: #f8fafc;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 2px solid #cbd5e1;
  font-size: 0.85rem;
}

.doc-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.doc-total-card {
  text-align: right;
  margin-top: 24px;
}

@media print {
  body { background: #fff; padding: 0; }
  .ambient-glow, .glass-header, .editor-panel, #btn-generate-pdf { display: none !important; }
  .studio-grid { display: block; }
  #pdf-preview-box { box-shadow: none; border: none; padding: 0; }
}
</style>
</head>
<body>
<div class="ambient-glow glow-1"></div>
<div class="ambient-glow glow-2"></div>

<div class="app-container">
  <div class="glass-panel glass-header">
    <div class="brand-title">
      📄 Automatic PDF Studio
      <span class="brand-badge">DIAMOND SPEC</span>
    </div>
    <button id="btn-generate-pdf" class="glass-btn" onclick="triggerPrint()">
      ⬇ Generate & Print PDF
    </button>
  </div>

  <div class="studio-grid">
    <div class="glass-panel editor-panel" style="padding: 24px;">
      <h3 style="margin-bottom: 18px; font-size: 1.1rem; color: var(--accent-cyan);">Document Controls</h3>
      
      <div class="form-group">
        <label class="form-label" for="pdf-title">Document Title</label>
        <input type="text" id="pdf-title" class="glass-input" value="Executive Enterprise Proposal" oninput="updatePreview()">
      </div>

      <div class="form-group">
        <label class="form-label">Client / Recipient</label>
        <input type="text" id="client-name" class="glass-input" value="Acme Quantum Dynamics Inc." oninput="updatePreview()">
      </div>

      <div class="form-group">
        <label class="form-label">Add Line Item</label>
        <div style="display:flex; gap:8px; margin-bottom:8px;">
          <input type="text" id="item-desc" class="glass-input" placeholder="Service description" value="Cloud AI Multi-Agent Architecture">
          <input type="number" id="item-price" class="glass-input" style="max-width:110px;" placeholder="Price ($)" value="4500">
        </div>
        <button class="glass-btn glass-btn-secondary" style="width:100%;" onclick="addItem()">+ Add Item</button>
      </div>

      <div class="form-group">
        <label class="form-label">Tax Rate (%)</label>
        <input type="number" id="tax-rate" class="glass-input" value="10" oninput="updatePreview()">
      </div>
    </div>

    <div id="pdf-preview-box">
      <div class="doc-header">
        <div>
          <h1 id="preview-title" class="doc-title">Executive Enterprise Proposal</h1>
          <p id="preview-client" style="color: #64748b; margin-top: 4px;">Prepared for Acme Quantum Dynamics Inc.</p>
        </div>
        <div style="text-align: right;">
          <p style="font-weight: 700; color: #0284c7;">ULTRON CORP</p>
          <p id="preview-date" style="color: #94a3b8; font-size: 0.85rem;"></p>
        </div>
      </div>

      <table class="doc-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="width: 120px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody id="preview-items"></tbody>
      </table>

      <div class="doc-total-card">
        <p style="color: #64748b; margin-bottom: 4px;">Subtotal: <span id="preview-subtotal" style="font-weight: 600; color: #1e293b;">$0.00</span></p>
        <p style="color: #64748b; margin-bottom: 6px;">Tax: <span id="preview-tax" style="font-weight: 600; color: #1e293b;">$0.00</span></p>
        <h2 style="font-size: 1.6rem; color: #0f172a;">Total: <span id="preview-total" style="color: #0284c7;">$0.00</span></h2>
      </div>
    </div>
  </div>
</div>

__AUDIO__

<script>
let items = [
  { desc: 'Multi-Agent LangGraph Core Architecture', amount: 4500 },
  { desc: 'Glassmorphic HUD Interface Design System', amount: 2800 },
  { desc: 'End-to-End Automated Testing & Security Verification', amount: 1700 }
];

document.getElementById('preview-date').innerText = new Date().toLocaleDateString('en-US', { dateStyle: 'medium' });

function addItem() {
  const desc = document.getElementById('item-desc').value.trim();
  const price = parseFloat(document.getElementById('item-price').value);
  if (!desc || isNaN(price)) return;
  items.push({ desc, amount: price });
  document.getElementById('item-desc').value = '';
  document.getElementById('item-price').value = '';
  updatePreview();
  SoundEngine.action();
}

function updatePreview() {
  const title = document.getElementById('pdf-title').value || 'Untitled Document';
  const client = document.getElementById('client-name').value || 'Valued Client';
  const taxRate = parseFloat(document.getElementById('tax-rate').value) || 0;

  document.getElementById('preview-title').innerText = title;
  document.getElementById('preview-client').innerText = 'Prepared for ' + client;

  const tbody = document.getElementById('preview-items');
  tbody.innerHTML = '';
  let subtotal = 0;

  items.forEach((item) => {
    subtotal += item.amount;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.desc}</td>
      <td style="text-align: right; font-weight: 600;">$${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
    `;
    tbody.appendChild(tr);
  });

  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  document.getElementById('preview-subtotal').innerText = '$' + subtotal.toLocaleString(undefined, {minimumFractionDigits: 2});
  document.getElementById('preview-tax').innerText = '$' + tax.toLocaleString(undefined, {minimumFractionDigits: 2});
  document.getElementById('preview-total').innerText = '$' + total.toLocaleString(undefined, {minimumFractionDigits: 2});
}

function triggerPrint() {
  SoundEngine.success();
  window.print();
}

updatePreview();
</script>
</body>
</html>"""
    return template.replace("__CSS__", GLASS_DESIGN_SYSTEM).replace("__AUDIO__", WEB_AUDIO_SCRIPT)

def render_task_manager_app(goal: str) -> str:
    template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ULTRON Task Manager // Quantum Workflow Deck</title>
<style>
__CSS__

.task-form-panel {
  padding: 24px;
  margin-bottom: 24px;
}

.task-input-row {
  display: flex;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-chip {
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.filter-chip.active {
  background: rgba(0, 240, 255, 0.15);
  border-color: var(--accent-cyan);
  color: var(--accent-cyan);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid var(--accent-cyan);
}

.task-item.completed {
  opacity: 0.55;
  border-left-color: var(--accent-emerald);
}

.task-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  cursor: pointer;
  accent-color: var(--accent-cyan);
}

.task-text {
  font-size: 1rem;
  font-weight: 500;
}

.task-item.completed .task-text {
  text-decoration: line-through;
}

.task-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(138, 43, 226, 0.15);
  border: 1px solid rgba(138, 43, 226, 0.3);
  color: #d8b4fe;
}
</style>
</head>
<body>
<div class="ambient-glow glow-1"></div>
<div class="ambient-glow glow-2"></div>

<div class="app-container">
  <div class="glass-panel glass-header">
    <div class="brand-title">
      ⚡ ULTRON Task Manager
      <span class="brand-badge">KANBAN ACTIVE</span>
    </div>
    <div style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-cyan);">
      <span id="stat-completed">0</span> / <span id="stat-total">0</span> COMPLETED
    </div>
  </div>

  <div class="stats-grid">
    <div class="glass-panel stat-card">
      <div class="stat-label">Total Missions</div>
      <div id="metric-total" class="stat-val">0</div>
    </div>
    <div class="glass-panel stat-card">
      <div class="stat-label">In Flight</div>
      <div id="metric-active" class="stat-val" style="color: var(--accent-amber);">0</div>
    </div>
    <div class="glass-panel stat-card">
      <div class="stat-label">Verified Done</div>
      <div id="metric-done" class="stat-val" style="color: var(--accent-emerald);">0</div>
    </div>
  </div>

  <div class="glass-panel task-form-panel">
    <div class="task-input-row">
      <input type="text" id="task-input" class="glass-input" placeholder="Define new engineering task..." onkeydown="if(event.key==='Enter') addTask()">
      <select id="task-priority" class="glass-select" style="max-width: 160px;">
        <option value="CRITICAL">Critical</option>
        <option value="HIGH">High Priority</option>
        <option value="NORMAL" selected>Normal</option>
      </select>
      <button id="btn-add-task" class="glass-btn" onclick="addTask()">
        + Add Task
      </button>
    </div>
  </div>

  <div class="filter-bar">
    <span class="filter-chip active" onclick="setFilter('all', this)">All Tasks</span>
    <span class="filter-chip" onclick="setFilter('active', this)">Active</span>
    <span class="filter-chip" onclick="setFilter('completed', this)">Completed</span>
  </div>

  <div id="task-container" class="task-list"></div>
</div>

__AUDIO__

<script>
let currentFilter = 'all';
let tasks = JSON.parse(localStorage.getItem('ultron_tasks') || '[]');

if (tasks.length === 0) {
  tasks = [
    { id: 1, text: 'Calibrate LangGraph Multi-Agent Nodes', priority: 'CRITICAL', completed: true },
    { id: 2, text: 'Deploy Glassmorphic 3.0 Telemetry Stream', priority: 'HIGH', completed: false },
    { id: 3, text: 'Execute Continuous Verification Loop & DOM Assertions', priority: 'NORMAL', completed: false }
  ];
}

function saveTasks() {
  localStorage.setItem('ultron_tasks', JSON.stringify(tasks));
  renderTasks();
}

function addTask() {
  const input = document.getElementById('task-input');
  const text = input.value.trim();
  if (!text) return;
  const priority = document.getElementById('task-priority').value;
  tasks.unshift({
    id: Date.now(),
    text,
    priority,
    completed: false
  });
  input.value = '';
  saveTasks();
  SoundEngine.action();
}

function toggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (t) {
    t.completed = !t.completed;
    saveTasks();
    if (t.completed) SoundEngine.success();
  }
}

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveTasks();
}

function setFilter(filter, el) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById('task-container');
  container.innerHTML = '';

  const filtered = tasks.filter(t => {
    if (currentFilter === 'active') return !t.completed;
    if (currentFilter === 'completed') return t.completed;
    return true;
  });

  filtered.forEach(task => {
    const div = document.createElement('div');
    div.className = 'glass-panel task-item' + (task.completed ? ' completed' : '');
    div.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})">
        <span class="task-text">${task.text}</span>
        <span class="task-tag">${task.priority}</span>
      </div>
      <button class="glass-btn glass-btn-secondary" style="padding: 6px 12px; font-size: 0.75rem;" onclick="deleteTask(${task.id})">✕</button>
    `;
    container.appendChild(div);
  });

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;

  document.getElementById('metric-total').innerText = total;
  document.getElementById('metric-active').innerText = active;
  document.getElementById('metric-done').innerText = completed;
  document.getElementById('stat-completed').innerText = completed;
  document.getElementById('stat-total').innerText = total;
}

renderTasks();
</script>
</body>
</html>"""
    return template.replace("__CSS__", GLASS_DESIGN_SYSTEM).replace("__AUDIO__", WEB_AUDIO_SCRIPT)

def render_flight_predictor_app(goal: str) -> str:
    template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flight Delay Predictor // ULTRON Aviation Matrix</title>
<style>
__CSS__

.aviation-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .aviation-grid { grid-template-columns: 1fr; }
}

.radar-canvas {
  width: 100%;
  height: 260px;
  background: rgba(5, 10, 25, 0.7);
  border-radius: 12px;
  border: 1px solid var(--border-glass);
}
</style>
</head>
<body>
<div class="ambient-glow glow-1"></div>
<div class="ambient-glow glow-2"></div>

<div class="app-container">
  <div class="glass-panel glass-header">
    <div class="brand-title">
      ✈ ULTRON Flight Delay Predictor
      <span class="brand-badge">AERODYNAMIC TELEMETRY</span>
    </div>
    <div style="color: var(--accent-cyan); font-family: var(--font-mono); font-size: 0.85rem;">
      RADAR ACTIVE
    </div>
  </div>

  <div class="stats-grid">
    <div class="glass-panel stat-card">
      <div class="stat-label">Calculated Delay Risk</div>
      <div id="risk-display" class="stat-val" style="color: var(--accent-amber);">15%</div>
    </div>
    <div class="glass-panel stat-card">
      <div class="stat-label">Operational Status</div>
      <div id="risk-status" class="stat-val" style="font-size: 1.25rem; color: var(--accent-emerald);">LOW DELAY RISK</div>
    </div>
    <div class="glass-panel stat-card">
      <div class="stat-label">Atmospheric Density</div>
      <div class="stat-val">1.225 <span style="font-size:0.9rem; color:var(--text-secondary);">kg/m³</span></div>
    </div>
  </div>

  <div class="aviation-grid">
    <div class="glass-panel" style="padding: 24px;">
      <h3 style="margin-bottom: 20px; color: var(--accent-cyan);">Wind & Shear Controls</h3>

      <div style="margin-bottom: 20px;">
        <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px;">
          WIND VELOCITY (KNOTS): <span id="wind-val" style="color:#fff; font-weight:700;">25</span> KT
        </label>
        <input type="range" id="wind-slider" class="glass-input" min="0" max="100" value="25" oninput="onWindChange(this.value)">
      </div>

      <div style="margin-bottom: 24px;">
        <label style="display:block; font-size:0.8rem; color:var(--text-secondary); margin-bottom:8px;">
          WIND SHEAR SEVERITY
        </label>
        <select id="shear-select" class="glass-select">
          <option value="none">None / Calm</option>
          <option value="moderate">Moderate Shear</option>
          <option value="severe">Severe Wind Shear</option>
        </select>
      </div>

      <button id="recalc-btn" class="glass-btn" style="width: 100%;" onclick="recalculateRisk()">
        ⚡ Recalculate Risk Matrix
      </button>
    </div>

    <div class="glass-panel" style="padding: 24px;">
      <h3 style="margin-bottom: 16px; color: var(--accent-cyan);">Atmospheric Turbulence Radar</h3>
      <canvas id="radar" class="radar-canvas" width="600" height="260"></canvas>
    </div>
  </div>
</div>

__AUDIO__

<script>
function onWindChange(val) {
  document.getElementById('wind-val').innerText = val;
}

function recalculateRisk() {
  const wind = parseFloat(document.getElementById('wind-slider').value);
  const shear = document.getElementById('shear-select').value;

  let risk = wind * 0.75;
  if (shear === 'moderate') risk += 25;
  if (shear === 'severe') risk += 55;

  risk = Math.min(Math.round(risk), 99);

  let status = 'LOW DELAY RISK';
  let color = 'var(--accent-emerald)';

  if (risk >= 70 || (shear === 'severe' && wind >= 50)) {
    status = 'HIGH DELAY RISK';
    color = 'var(--accent-rose)';
  } else if (risk >= 40) {
    status = 'MODERATE DELAY RISK';
    color = 'var(--accent-amber)';
  }

  const disp = document.getElementById('risk-display');
  const stat = document.getElementById('risk-status');

  disp.innerText = risk + '%';
  disp.style.color = color;
  stat.innerText = status;
  stat.style.color = color;

  SoundEngine.success();
}

const canvas = document.getElementById('radar');
const ctx = canvas.getContext('2d');
let angle = 0;

function drawRadar() {
  ctx.fillStyle = 'rgba(5, 10, 25, 0.2)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 110;

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
  ctx.lineWidth = 1;
  [0.33, 0.66, 1].forEach(pct => {
    ctx.beginPath();
    ctx.arc(cx, cy, r * pct, 0, Math.PI * 2);
    ctx.stroke();
  });

  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x, y);
  ctx.stroke();

  angle += 0.04;
  requestAnimationFrame(drawRadar);
}
drawRadar();
</script>
</body>
</html>"""
    return template.replace("__CSS__", GLASS_DESIGN_SYSTEM).replace("__AUDIO__", WEB_AUDIO_SCRIPT)

def render_general_glassmorphic_app(goal: str) -> str:
    clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', goal).strip() or "Quantum Mission Studio"
    template = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__TITLE__ // ULTRON OS</title>
<style>
__CSS__

.main-deck-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 960px) {
  .main-deck-grid { grid-template-columns: 1fr; }
}

.chart-box {
  height: 280px;
  width: 100%;
  background: rgba(5, 10, 25, 0.7);
  border-radius: 14px;
  border: 1px solid var(--border-glass);
  padding: 16px;
}
</style>
</head>
<body>
<div class="ambient-glow glow-1"></div>
<div class="ambient-glow glow-2"></div>

<div class="app-container">
  <div class="glass-panel glass-header">
    <div class="brand-title">
      ⚡ __TITLE__
      <span class="brand-badge">LIVE OS</span>
    </div>
    <div style="display:flex; gap:10px;">
      <button class="glass-btn glass-btn-secondary" onclick="exportData()">Export Data</button>
      <button class="glass-btn" onclick="executeWorkflow()">+ Run Action</button>
    </div>
  </div>

  <div class="stats-grid">
    <div class="glass-panel stat-card">
      <div class="stat-label">Efficiency Index</div>
      <div id="stat-eff" class="stat-val" style="color: var(--accent-cyan);">98.4%</div>
    </div>
    <div class="glass-panel stat-card">
      <div class="stat-label">Active Signals</div>
      <div id="stat-signals" class="stat-val" style="color: var(--accent-emerald);">24</div>
    </div>
    <div class="glass-panel stat-card">
      <div class="stat-label">System Latency</div>
      <div class="stat-val" style="font-family: var(--font-mono);">12ms</div>
    </div>
  </div>

  <div class="main-deck-grid">
    <div class="glass-panel" style="padding: 24px;">
      <h3 style="margin-bottom: 16px; color: var(--accent-cyan);">Real-Time Waveform & Data Telemetry</h3>
      <canvas id="telemetry-chart" class="chart-box" width="700" height="280"></canvas>
    </div>

    <div class="glass-panel" style="padding: 24px;">
      <h3 style="margin-bottom: 16px; color: var(--accent-cyan);">Interactive Controls</h3>
      <div style="margin-bottom: 16px;">
        <label class="stat-label">Input Variable</label>
        <input type="text" id="primary-input" class="glass-input" placeholder="Configure parameter..." value="Alpha Protocol">
      </div>
      <div style="margin-bottom: 20px;">
        <label class="stat-label">Operating Bandwidth</label>
        <input type="range" class="glass-input" min="10" max="100" value="85" oninput="document.getElementById('stat-eff').innerText = this.value + '%' ">
      </div>
      <button class="glass-btn" style="width: 100%;" onclick="executeWorkflow()">
        ⚡ Commit Parameter Shift
      </button>
    </div>
  </div>
</div>

__AUDIO__

<script>
function executeWorkflow() {
  SoundEngine.success();
  const sig = document.getElementById('stat-signals');
  sig.innerText = parseInt(sig.innerText) + 1;
}

function exportData() {
  SoundEngine.action();
  const payload = {
    title: "__TITLE__",
    timestamp: new Date().toISOString(),
    status: "OPTIMAL"
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'telemetry_export.json';
  a.click();
}

const c = document.getElementById('telemetry-chart');
const ctx = c.getContext('2d');
let step = 0;

function drawTelemetry() {
  ctx.fillStyle = 'rgba(5, 10, 25, 0.15)';
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();

  const h = c.height / 2;
  for (let x = 0; x < c.width; x += 4) {
    const y = h + Math.sin((x + step) * 0.03) * 40 + Math.sin((x + step * 1.5) * 0.08) * 15;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  step += 2;
  requestAnimationFrame(drawTelemetry);
}
drawTelemetry();
</script>
</body>
</html>"""
    return template.replace("__TITLE__", html.escape(clean_title)).replace("__CSS__", GLASS_DESIGN_SYSTEM).replace("__AUDIO__", WEB_AUDIO_SCRIPT)

def render_backend_api(goal: str) -> str:
    return '''from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime

app = FastAPI(
    title="ULTRON Microservice API Engine",
    description="High-performance domain service synthesized autonomously by ULTRON.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DataItem(BaseModel):
    id: Optional[int] = None
    title: str
    status: str = "active"
    created_at: Optional[str] = None

db_store: List[dict] = [
    {"id": 1, "title": "Quantum Core Online", "status": "active", "created_at": "2026-09-10T12:00:00Z"},
    {"id": 2, "title": "Glassmorphism Synthesis Engine", "status": "active", "created_at": "2026-09-10T12:01:00Z"}
]

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "backend_api",
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/api/items", response_model=List[DataItem])
def get_items():
    return db_store

@app.post("/api/items", response_model=DataItem)
def create_item(item: DataItem):
    new_id = len(db_store) + 1
    record = {
        "id": new_id,
        "title": item.title,
        "status": item.status,
        "created_at": datetime.datetime.now().isoformat()
    }
    db_store.append(record)
    return record
'''

def render_database_schema(goal: str) -> str:
    return '''-- ULTRON Database Schema Definition
-- Auto-synthesized domain specification for PostgreSQL / CockroachDB

CREATE TABLE IF NOT EXISTS system_metadata (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS records (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);

-- Seed Initial Verification Fixtures
INSERT INTO system_metadata (key, value) 
VALUES ('engine_version', '3.0.0-QUANTUM')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
'''

def render_premium_ecommerce_app(goal: str) -> str:
    from astra_engine import get_astra_ecommerce_html
    return get_astra_ecommerce_html(goal)

def synthesize_glassmorphic_app(goal: str, domain: str = "web_ui") -> str:
    """Entry point for intelligent glassmorphic synthesis."""
    if domain == "backend_api":
        return render_backend_api(goal)
    elif domain == "database_schema":
        return render_database_schema(goal)

    lower_goal = goal.lower()
    if "docx" in lower_goal or "doc " in lower_goal or ("convert" in lower_goal and ("image" in lower_goal or "img" in lower_goal)):
        return render_docx_converter_app(goal)
    elif "calc" in lower_goal or "calculator" in lower_goal:
        return render_calculator_app(goal)
    elif "pdf" in lower_goal or "invoice" in lower_goal:
        return render_pdf_builder_app(goal)
    elif "task" in lower_goal or "todo" in lower_goal or "kanban" in lower_goal:
        return render_task_manager_app(goal)
    elif "flight" in lower_goal or "delay" in lower_goal or "shear" in lower_goal:
        return render_flight_predictor_app(goal)

    ecommerce_keywords = [
        "sell", "store", "shop", "ecommerce", "e-commerce", "product", "fan",
        "market", "cart", "buy", "purchase", "astra", "merchandise", "retail",
        "catalog", "checkout", "discount", "stock", "pricing"
    ]
    if any(k in lower_goal for k in ecommerce_keywords):
        try:
            from astra_engine import get_astra_ecommerce_html
            return get_astra_ecommerce_html(goal)
        except Exception:
            return render_general_glassmorphic_app(goal)

    return render_general_glassmorphic_app(goal)
