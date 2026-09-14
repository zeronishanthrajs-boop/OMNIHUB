import sys
from pathlib import Path

html_code = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Antigravity</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-window: #0c0c0e;
    --bg-sidebar: #121215;
    --bg-main: #0c0c0e;
    --bg-card: #161619;
    --bg-card-hover: #1c1c21;
    --bg-input: #18181b;
    --bg-pill: #1e1e24;
    --bg-pill-hover: #26262e;
    --border-subtle: #1c1c20;
    --border-default: #26262b;
    --border-focus: #3b82f6;
    --text-primary: #f4f4f5;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --accent-blue: #3b82f6;
    --accent-blue-hover: #60a5fa;
    --dot-blue: #38bdf8;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }

  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; padding: 0; }
  body {
    background: var(--bg-window);
    color: var(--text-primary);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    user-select: none;
  }

  /* Custom Clean Scrollbar */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }

  /* TOP WINDOW & APP BAR */
  .top-app-bar {
    height: 38px;
    background: var(--bg-window);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    flex: none;
    font-size: 12px;
  }
  .app-bar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .app-title {
    font-weight: 600;
    color: #ffffff;
    letter-spacing: -0.01em;
  }
  .menu-items {
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--text-secondary);
  }
  .menu-item {
    cursor: pointer;
    transition: color 0.15s;
  }
  .menu-item:hover { color: #ffffff; }

  .app-bar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .btn-ide {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #18181b;
    border: 1px solid var(--border-default);
    color: #e4e4e7;
    padding: 3px 9px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-ide:hover { background: #24242a; border-color: #3f3f46; color: #ffffff; }
  .btn-ide svg { width: 13px; height: 13px; color: var(--accent-blue); }

  .window-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 12px;
    color: var(--text-muted);
  }
  .win-btn {
    cursor: pointer;
    font-size: 11px;
    padding: 2px 4px;
    transition: color 0.15s;
  }
  .win-btn:hover { color: #ffffff; }

  /* SUB-HEADER / NAVIGATION BAR */
  .sub-nav-bar {
    height: 34px;
    background: var(--bg-window);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    flex: none;
  }
  .sub-nav-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .nav-icon-btn {
    width: 26px;
    height: 26px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
  }
  .nav-icon-btn:hover { background: #1c1c20; color: #ffffff; }
  .nav-icon-btn svg { width: 14px; height: 14px; }

  /* MAIN LAYOUT SPLIT */
  .app-container {
    display: flex;
    flex: 1;
    height: calc(100vh - 72px);
    overflow: hidden;
  }

  /* LEFT SIDEBAR */
  .sidebar {
    width: 250px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    flex: none;
    transition: width 0.2s ease;
  }
  .sidebar.collapsed { width: 0; overflow: hidden; border-right: none; }

  .sidebar-top {
    padding: 10px 12px 6px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .btn-new-conv {
    width: 100%;
    background: #19191e;
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #f4f4f5;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-new-conv:hover {
    background: #222228;
    border-color: #3f3f46;
  }
  .btn-new-conv svg { width: 14px; height: 14px; color: var(--text-secondary); }

  .sidebar-nav-links {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-top: 4px;
  }
  .nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .nav-link:hover {
    background: #18181c;
    color: #ffffff;
  }
  .nav-link svg { width: 14px; height: 14px; }

  /* PROJECTS SECTION */
  .sidebar-projects {
    flex: 1;
    overflow-y: auto;
    padding: 12px 8px 12px 12px;
    display: flex;
    flex-direction: column;
  }
  .projects-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 6px;
    color: var(--text-muted);
    font-size: 11.5px;
    font-weight: 500;
  }
  .projects-header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .header-icon-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.15s;
  }
  .header-icon-btn:hover { color: #ffffff; background: #1c1c20; }
  .header-icon-btn svg { width: 13px; height: 13px; }

  /* FOLDER & CONVERSATION TREE */
  .tree-folder {
    margin-bottom: 2px;
  }
  .folder-title-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 6px;
    border-radius: 5px;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .folder-title-row:hover { background: #18181c; color: #ffffff; }
  .folder-chevron {
    width: 12px;
    height: 12px;
    transition: transform 0.15s;
    color: var(--text-muted);
  }
  .tree-folder.open .folder-chevron {
    transform: rotate(90deg);
  }
  .folder-icon { width: 14px; height: 14px; color: var(--text-muted); }
  .folder-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }

  .folder-items {
    display: none;
    flex-direction: column;
    padding-left: 14px;
    margin-top: 2px;
  }
  .tree-folder.open .folder-items {
    display: flex;
  }
  .tree-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    border-radius: 6px;
    color: #94949e;
    font-size: 11.5px;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
  }
  .tree-item:hover {
    background: #19191e;
    color: #ffffff;
  }
  .tree-item.active {
    background: #1c1d24;
    color: #ffffff;
    font-weight: 500;
  }
  .tree-item-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 6px;
  }
  .tree-item-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
  .active-indicator-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--dot-blue);
    box-shadow: 0 0 6px rgba(56, 189, 248, 0.7);
  }

  /* SIDEBAR BOTTOM */
  .sidebar-bottom {
    padding: 10px 12px;
    border-top: 1px solid var(--border-subtle);
  }
  .btn-settings {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 6px 10px;
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-settings:hover {
    background: #18181c;
    color: #ffffff;
  }
  .btn-settings svg { width: 14px; height: 14px; }

  /* MAIN WORKSPACE CANVAS */
  .main-workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg-main);
    overflow: hidden;
    position: relative;
  }

  /* HOME / EMPTY VIEW (EXACT SCREENSHOT MATCH) */
  .home-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
  }
  .home-project-breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #a1a1aa;
    margin-bottom: 20px;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 6px;
    transition: all 0.15s;
  }
  .home-project-breadcrumb:hover {
    background: #18181b;
    color: #ffffff;
  }
  .home-project-breadcrumb svg { width: 14px; height: 14px; }

  /* CENTRAL PROMPT CARD */
  .prompt-card {
    width: 100%;
    max-width: 680px;
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    border-radius: 16px;
    padding: 14px 16px 12px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .prompt-card:focus-within {
    border-color: #3b3b44;
    box-shadow: 0 14px 42px rgba(0, 0, 0, 0.6);
  }
  .prompt-textarea {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #f4f4f5;
    font-family: inherit;
    font-size: 13.5px;
    line-height: 1.5;
    resize: none;
    min-height: 54px;
    max-height: 180px;
  }
  .prompt-textarea::placeholder {
    color: var(--text-muted);
  }

  .prompt-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 4px;
  }
  .prompt-toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .prompt-toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-tool-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-tool-icon:hover {
    background: #24242a;
    color: #ffffff;
  }
  .btn-tool-icon svg { width: 15px; height: 15px; }

  .pill-dropdown {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #1c1c21;
    border: 1px solid var(--border-default);
    border-radius: 7px;
    padding: 4px 9px;
    color: #d4d4d8;
    font-size: 11.5px;
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
  }
  .pill-dropdown:hover {
    background: #25252c;
    border-color: #3f3f46;
    color: #ffffff;
  }
  .pill-dropdown svg { width: 12px; height: 12px; color: var(--text-muted); }

  .btn-send {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #27272e;
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }
  .btn-send.active {
    background: #ffffff;
    color: #0c0c0e;
  }
  .btn-send.active:hover {
    background: #e4e4e7;
  }
  .btn-send svg { width: 13px; height: 13px; }

  /* ACTIVE CONVERSATION WORKSPACE VIEW */
  .conversation-view {
    display: none;
    flex: 1;
    height: 100%;
    overflow: hidden;
  }
  .conversation-view.active {
    display: flex;
  }

  /* CHAT & EXECUTION COLUMN */
  .chat-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    border-right: 1px solid var(--border-subtle);
    background: var(--bg-main);
    overflow: hidden;
  }
  .chat-header {
    height: 44px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: none;
  }
  .chat-header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
  }
  .status-badge {
    font-size: 10.5px;
    font-family: var(--font-mono);
    padding: 2px 7px;
    border-radius: 4px;
    text-transform: uppercase;
    background: #1e1e24;
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }
  .status-badge.running { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3); }
  .status-badge.approved { background: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
  .status-badge.clarifying { background: rgba(234, 179, 8, 0.15); color: #facc15; border-color: rgba(234, 179, 8, 0.3); }

  .chat-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .action-btn-sm {
    background: #18181c;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 4px 9px;
    color: var(--text-secondary);
    font-size: 11.5px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .action-btn-sm:hover {
    background: #24242a;
    color: #ffffff;
    border-color: #3f3f46;
  }
  .action-btn-sm.active-preview {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    color: #93c5fd;
  }

  /* CHAT MESSAGES STREAM */
  .chat-stream {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* User Message */
  .msg-user {
    display: flex;
    gap: 12px;
    max-width: 85%;
    align-self: flex-start;
  }
  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #27272a;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    flex: none;
  }
  .msg-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .msg-author {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
  }
  .msg-bubble {
    background: #19191e;
    border: 1px solid var(--border-default);
    border-radius: 12px;
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
    color: #f4f4f5;
  }

  /* Antigravity Agent Stage Accordion */
  .agent-step-card {
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    overflow: hidden;
    margin: 4px 0;
  }
  .agent-step-header {
    padding: 8px 12px;
    background: #18181c;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    font-size: 12px;
    border-bottom: 1px solid transparent;
  }
  .agent-step-card.open .agent-step-header {
    border-bottom-color: var(--border-subtle);
  }
  .step-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #e4e4e7;
  }
  .step-badge {
    font-size: 10px;
    font-family: var(--font-mono);
    padding: 1px 6px;
    border-radius: 4px;
    background: #27272a;
    color: #a1a1aa;
  }
  .agent-step-body {
    padding: 12px 14px;
    font-size: 12.5px;
    line-height: 1.5;
    color: #d4d4d8;
    display: none;
    background: #141417;
  }
  .agent-step-card.open .agent-step-body {
    display: block;
  }

  /* CLARIFICATION PROMPT BOX */
  .clarification-box {
    background: rgba(234, 179, 8, 0.08);
    border: 1px solid rgba(234, 179, 8, 0.3);
    border-radius: 10px;
    padding: 14px 16px;
    margin: 10px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .clarification-title {
    font-size: 12.5px;
    font-weight: 600;
    color: #facc15;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .clarification-question {
    font-size: 13px;
    color: #fef08a;
  }
  .clarification-input-row {
    display: flex;
    gap: 8px;
  }
  .clarification-input {
    flex: 1;
    background: #18181b;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    padding: 7px 10px;
    color: #ffffff;
    font-size: 12.5px;
  }
  .btn-clarify-submit {
    background: #eab308;
    color: #000000;
    font-weight: 600;
    font-size: 12px;
    padding: 7px 14px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .btn-clarify-submit:hover { opacity: 0.9; }

  /* FOLLOW-UP CHAT INPUT BAR */
  .chat-bottom-input {
    padding: 12px 20px;
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-main);
  }
  .chat-input-wrapper {
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .chat-input-wrapper input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: #ffffff;
    font-size: 13px;
  }
  .chat-input-wrapper input::placeholder { color: var(--text-muted); }

  /* RIGHT SPLIT-PREVIEW DRAWER */
  .split-panel {
    width: 48%;
    min-width: 380px;
    background: #0f0f12;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    border-left: 1px solid var(--border-subtle);
    transition: width 0.2s ease;
  }
  .split-panel.closed { display: none; }

  .split-tabs-header {
    height: 44px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    background: #121216;
  }
  .split-tabs-list {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .split-tab-btn {
    padding: 5px 10px;
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
  }
  .split-tab-btn:hover { color: #ffffff; background: #1a1a20; }
  .split-tab-btn.active { color: #ffffff; background: #22222a; font-weight: 500; }

  .split-tab-content {
    flex: 1;
    display: none;
    overflow: hidden;
    position: relative;
  }
  .split-tab-content.active {
    display: flex;
    flex-direction: column;
  }

  /* Sandbox Iframe */
  .sandbox-iframe-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #000000;
  }
  .sandbox-toolbar {
    height: 32px;
    background: #16161b;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    font-size: 11px;
    color: var(--text-muted);
  }
  .sandbox-iframe {
    flex: 1;
    width: 100%;
    height: 100%;
    border: none;
    background: #000000;
  }

  /* Logical Tree Node Viewer */
  .tree-viewer-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #0d0d10;
  }
  .tree-node-block {
    background: #16161a;
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .tree-node-title {
    font-size: 12px;
    font-weight: 600;
    color: #e4e4e7;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tree-node-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11.5px;
    color: var(--text-secondary);
  }

  /* Terminal Logs Viewer */
  .logs-viewer-container {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.6;
    background: #09090b;
    color: #a1a1aa;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* MODALS / OVERLAYS */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: none;
    align-items: center;
    justify-content: center;
  }
  .modal-overlay.open { display: flex; }
  .modal-card {
    width: 90%;
    max-width: 580px;
    background: #16161a;
    border: 1px solid var(--border-default);
    border-radius: 14px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal-header {
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13.5px;
    font-weight: 600;
  }
  .modal-close {
    cursor: pointer;
    color: var(--text-muted);
    transition: color 0.15s;
  }
  .modal-close:hover { color: #ffffff; }
  .modal-body {
    padding: 18px;
    max-height: 70vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    font-size: 12.5px;
  }

  /* Dropdown Popovers */
  .popover-menu {
    position: absolute;
    background: #19191e;
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    z-index: 500;
    display: none;
    flex-direction: column;
    min-width: 190px;
  }
  .popover-menu.open { display: flex; }
  .popover-item {
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .popover-item:hover {
    background: #24242c;
    color: #ffffff;
  }
  .popover-item.active {
    color: var(--accent-blue);
    font-weight: 500;
  }
</style>
</head>
<body>

<!-- TOP APPLICATION BAR -->
<div class="top-app-bar">
  <div class="app-bar-left">
    <span class="app-title">Antigravity</span>
    <div class="menu-items">
      <span class="menu-item" onclick="openNewConversation()">File</span>
      <span class="menu-item" onclick="toggleSidebar()">View</span>
      <span class="menu-item" onclick="toggleSplitPanel()">Window</span>
    </div>
  </div>
  <div class="app-bar-right">
    <div class="btn-ide" onclick="openIdeLauncher()" title="Launch IDE Environment">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
      <span>Install IDE</span>
    </div>
    <div class="nav-icon-btn" onclick="openSettingsModal()" title="Settings & Governance">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
    </div>
    <div class="window-controls">
      <span class="win-btn" title="Minimize">─</span>
      <span class="win-btn" title="Maximize">▢</span>
      <span class="win-btn" title="Close">✕</span>
    </div>
  </div>
</div>

<!-- SUB-HEADER NAVIGATION BAR -->
<div class="sub-nav-bar">
  <div class="sub-nav-left">
    <div class="nav-icon-btn" onclick="toggleSidebar()" title="Toggle Sidebar [|]">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
    </div>
    <div class="nav-icon-btn" onclick="navigateHistory(-1)" title="Back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </div>
    <div class="nav-icon-btn" onclick="navigateHistory(1)" title="Forward">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  </div>
  <div class="sub-nav-right">
    <span id="topBarModelBadge" style="font-size:11px;color:#71717a;font-family:var(--font-mono);">ULTRON</span>
  </div>
</div>

<!-- MAIN LAYOUT CONTAINER -->
<div class="app-container">

  <!-- LEFT SIDEBAR -->
  <aside class="sidebar" id="appSidebar">
    <div class="sidebar-top">
      <button class="btn-new-conv" onclick="openNewConversation()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>New Conversation</span>
      </button>

      <div class="sidebar-nav-links">
        <div class="nav-link" onclick="openHistoryModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/></svg>
          <span>Conversation History</span>
        </div>
        <div class="nav-link" onclick="openScheduledTasksModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>Scheduled Tasks</span>
        </div>
      </div>
    </div>

    <!-- PROJECTS EXPLORER -->
    <div class="sidebar-projects">
      <div class="projects-header">
        <span>Projects</span>
        <div class="projects-header-actions">
          <div class="header-icon-btn" onclick="toggleProjectsFilter()" title="Filter conversations">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          </div>
          <div class="header-icon-btn" onclick="promptNewFolder()" title="New Folder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          </div>
        </div>
      </div>

      <!-- Filter bar (toggleable) -->
      <div id="projectsFilterBar" style="display:none;padding:2px 4px 8px;">
        <input type="text" id="projectSearchInput" placeholder="Filter conversations..." style="width:100%;background:#18181b;border:1px solid var(--border-default);border-radius:6px;padding:4px 8px;color:#fff;font-size:11px;outline:none;">
      </div>

      <!-- Dynamic Tree list -->
      <div id="projectsTreeRoot"></div>
    </div>

    <!-- BOTTOM SETTINGS -->
    <div class="sidebar-bottom">
      <div class="btn-settings" onclick="openSettingsModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>Settings</span>
      </div>
    </div>
  </aside>

  <!-- MAIN CANVAS -->
  <main class="main-workspace">

    <!-- HOME / NEW CONVERSATION VIEW (SCREENSHOT EXACT MATCH) -->
    <div class="home-view" id="homeView">
      <div class="home-project-breadcrumb" onclick="openFolderSelector(event)" id="homeProjectBreadcrumb">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span id="activeFolderLabel">ULTRON</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;"><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      <!-- PROMPT CARD -->
      <div class="prompt-card" aria-label="Goal Launcher">
        <textarea class="prompt-textarea" id="mainPromptInput" placeholder="Ask anything, @ to mention, / for actions" rows="2"></textarea>
        
        <div class="prompt-toolbar">
          <div class="prompt-toolbar-left">
            <div class="btn-tool-icon" onclick="openAttachmentMenu(event)" title="Add context or files">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>

            <!-- Model Selector Pill -->
            <div class="pill-dropdown" onclick="openModelSelector(event)" id="modelSelectorPill">
              <span id="selectedModelLabel">ULTRON</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            <!-- Context Selector Pill -->
            <div class="pill-dropdown" onclick="openContextSelector(event)" id="contextSelectorPill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#a1a1aa;"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              <span id="selectedContextLabel">Local</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div class="prompt-toolbar-right">
            <!-- Voice Input Button -->
            <div class="btn-tool-icon" id="micBtn" onclick="toggleVoiceInput()" title="Voice input">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </div>

            <!-- Send Button -->
            <button class="btn-send" id="sendPromptBtn" onclick="submitPrompt()" title="Send prompt">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ACTIVE CONVERSATION & WORKSPACE VIEW -->
    <div class="conversation-view" id="conversationView">
      <!-- CHAT COLUMN -->
      <div class="chat-column">
        <div class="chat-header">
          <div class="chat-header-title">
            <span id="convTitle">Active Mission</span>
            <span class="status-badge" id="convStatusBadge">IDLE</span>
          </div>
          <div class="chat-header-actions">
            <button class="action-btn-sm active-preview" id="toggleSplitBtn" onclick="toggleSplitPanel()" title="Toggle Split Preview">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              <span>Split Preview</span>
            </button>
            <button class="action-btn-sm" onclick="saveProjectPermanent()" title="Mark as Permanent (No 30d purge)">
              <span id="permSaveLabel">💾 Save</span>
            </button>
            <button class="action-btn-sm" onclick="exportProjectZip()" title="Download .ZIP Export">
              <span>📦 Export</span>
            </button>
            <button class="action-btn-sm" onclick="resetActiveExecution()" title="Reset State">
              <span>↺</span>
            </button>
          </div>
        </div>

        <!-- Chat messages & agent execution trajectory -->
        <div class="chat-stream" id="chatStream"></div>

        <!-- Clarification Box Container (appears if Boss requests input) -->
        <div id="clarificationAnchor" style="padding:0 24px;"></div>

        <!-- Bottom Follow-up Input -->
        <div class="chat-bottom-input">
          <div class="chat-input-wrapper">
            <input type="text" id="followUpInput" placeholder="Ask ULTRON to update the app, add features, or refine code..." onkeydown="if(event.key==='Enter') submitFollowUp();">
            <button class="btn-send active" onclick="submitFollowUp()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT SPLIT PREVIEW & ARTIFACTS PANEL -->
      <div class="split-panel" id="splitPanel">
        <div class="split-tabs-header">
          <div class="split-tabs-list">
            <div class="split-tab-btn active" data-tab="sandbox" onclick="switchSplitTab('sandbox')">Live App</div>
            <div class="split-tab-btn" data-tab="tree" onclick="switchSplitTab('tree')">Reasoning Tree</div>
            <div class="split-tab-btn" data-tab="logs" onclick="switchSplitTab('logs')">Terminal Logs</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="nav-icon-btn" onclick="reloadSandboxIframe()" title="Reload App">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            </div>
            <div class="nav-icon-btn" onclick="openAppInNewTab()" title="Open in New Tab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </div>
          </div>
        </div>

        <!-- Tab 1: Live App Sandbox -->
        <div class="split-tab-content active" id="tabContentSandbox">
          <div class="sandbox-iframe-container">
            <div class="sandbox-toolbar">
              <span id="sandboxStatusUrl">http://127.0.0.1:8000/web_ui</span>
              <span id="sandboxVerLabel">v1.0</span>
            </div>
            <iframe id="sandboxIframe" class="sandbox-iframe" src="/web_ui/index.html"></iframe>
          </div>
        </div>

        <!-- Tab 2: Logical Reasoning Tree -->
        <div class="split-tab-content" id="tabContentTree">
          <div class="tree-viewer-container" id="treeViewer">
            <div style="color:var(--text-muted);font-size:12px;">No active reasoning tree yet. Run a prompt to generate.</div>
          </div>
        </div>

        <!-- Tab 3: Terminal Logs -->
        <div class="split-tab-content" id="tabContentLogs">
          <div class="logs-viewer-container" id="logsViewer">Connecting to telemetry stream...</div>
        </div>
      </div>
    </div>

  </main>
</div>

<!-- MODEL SELECTOR POPOVER -->
<div class="popover-menu" id="modelMenu">
  <div class="popover-item active" onclick="selectModel('ULTRON')">
    <span>ULTRON (Autonomous Multi-Agent)</span>
  </div>
  <div class="popover-item" onclick="selectModel('ULTRON Core (Local Llama 3.1 8B)')">
    <span>ULTRON Core (Local Ollama)</span>
  </div>
  <div class="popover-item" onclick="selectModel('ULTRON Cloud (NVIDIA Llama 3.1 8B)')">
    <span>ULTRON Cloud (NVIDIA NIM)</span>
  </div>
  <div class="popover-item" onclick="selectModel('ULTRON Gemini 3.8 Flash')">
    <span>ULTRON Gemini 3.8 Flash</span>
  </div>
</div>

<!-- CONTEXT SELECTOR POPOVER -->
<div class="popover-menu" id="contextMenu">
  <div class="popover-item active" onclick="selectContext('Local')">
    <span>🗂 Local Workspace</span>
  </div>
  <div class="popover-item" onclick="selectContext('Mock Mode')">
    <span>⚡ Instant Mock Execution</span>
  </div>
</div>

<!-- FOLDER SELECTOR POPOVER (DYNAMICALLY GENERATED) -->
<div class="popover-menu" id="folderMenu"></div>

<!-- SETTINGS MODAL -->
<div class="modal-overlay" id="settingsModal">
  <div class="modal-card">
    <div class="modal-header">
      <span>Settings & System Governance</span>
      <span class="modal-close" onclick="closeModal('settingsModal')">✕</span>
    </div>
    <div class="modal-body">
      <div>
        <label style="font-weight:600;display:block;margin-bottom:6px;">LLM Engine Configuration</label>
        <div style="background:#121215;padding:12px;border-radius:8px;border:1px solid var(--border-subtle);">
          <div id="settingsEngineStatus" style="color:#a1a1aa;margin-bottom:8px;">Checking local Ollama & Cloud APIs...</div>
          <div style="display:flex;gap:8px;">
            <button class="action-btn-sm" onclick="testEngineConnection()">Refresh Engine Status</button>
          </div>
        </div>
      </div>

      <div>
        <label style="font-weight:600;display:block;margin-bottom:6px;">Custom Guardrail Rules (Boss Governance)</label>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <input type="text" id="newRuleInput" placeholder="Add custom safety or architectural rule..." style="flex:1;background:#121215;border:1px solid var(--border-default);border-radius:6px;padding:7px 10px;color:#fff;font-size:12px;">
          <button class="action-btn-sm" onclick="addNewGuardrailRule()">Submit Rule</button>
        </div>
        <div id="rulesListContainer" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
      </div>

      <div>
        <label style="font-weight:600;display:block;margin-bottom:6px;">30-Day Project Auto-Purge Lifecycle</label>
        <div style="background:#121215;padding:12px;border-radius:8px;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:500;">Bulk Project Retention</div>
            <div style="color:var(--text-muted);font-size:11.5px;">Mark all projects as Permanent or export master backup.</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="action-btn-sm" onclick="saveAllProjectsPermanent()">Save All</button>
            <button class="action-btn-sm" onclick="exportAllProjectsZip()">Export All .ZIP</button>
          </div>
        </div>
      </div>

      <div>
        <label style="font-weight:600;display:block;margin-bottom:6px;">Workspace Data Management</label>
        <div style="background:#121215;padding:12px;border-radius:8px;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-weight:500;">Reset & Clear Previous Project Data</div>
            <div style="color:var(--text-muted);font-size:11.5px;">Wipe all stored project sandboxes and reset history.</div>
          </div>
          <button class="action-btn-sm" style="color:#ef4444;border-color:rgba(239,68,68,0.4);" onclick="clearAllProjectsData()">Clear All Data</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- HISTORY MODAL -->
<div class="modal-overlay" id="historyModal">
  <div class="modal-card">
    <div class="modal-header">
      <span>Conversation History</span>
      <span class="modal-close" onclick="closeModal('historyModal')">✕</span>
    </div>
    <div class="modal-body" id="historyModalBody">
      <div style="color:var(--text-muted);">Loading conversation history...</div>
    </div>
  </div>
</div>

<!-- SCHEDULED TASKS MODAL -->
<div class="modal-overlay" id="scheduledModal">
  <div class="modal-card">
    <div class="modal-header">
      <span>Scheduled Tasks & Daemons</span>
      <span class="modal-close" onclick="closeModal('scheduledModal')">✕</span>
    </div>
    <div class="modal-body">
      <div style="background:#121215;padding:12px;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="font-weight:600;color:#38bdf8;">ULTRON Auto-Purge Daemon</div>
        <div style="color:var(--text-secondary);font-size:11.5px;margin-top:4px;">Status: Active (checks every 2 hours for projects older than 30 days).</div>
      </div>
      <div style="background:#121215;padding:12px;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="font-weight:600;color:#4ade80;">Telemetry & Reasoning Tree Watcher</div>
        <div style="color:var(--text-secondary);font-size:11.5px;margin-top:4px;">Status: Polling LangGraph state every 1.5s during execution.</div>
      </div>
    </div>
  </div>
</div>

<!-- JAVASCRIPT ENGINE -->
<script>
(function() {
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
    isExecuting: false
  };

  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);

  function init() {
    setupPromptInput();
    $("#activeFolderLabel").textContent = state.activeFolder;
    loadProjectsCatalog();
    startStatePolling();
    loadGovernanceRules();
    testEngineConnection();
  }

  function setupPromptInput() {
    const input = $("#mainPromptInput");
    const sendBtn = $("#sendPromptBtn");

    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 180) + "px";
      if (input.value.trim().length > 0) {
        sendBtn.classList.add("active");
      } else {
        sendBtn.classList.remove("active");
      }
    });

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.value.trim().length > 0) {
          submitPrompt();
        }
      }
    });
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
          const aDiv = document.createElement("div");
          aDiv.className = "agent-step-card open";
          aDiv.innerHTML = `
            <div class="agent-step-header" onclick="this.parentElement.classList.toggle('open')">
              <div class="step-label">
                <span>🤖 ULTRON Assistant</span>
                <span class="step-badge">${msg.version_created ? 'v' + msg.version_created : 'UPDATE'}</span>
              </div>
            </div>
            <div class="agent-step-body">${escapeHtml(msg.text)}</div>
          `;
          stream.appendChild(aDiv);
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

  function renderTreeNodes(tree) {
    const container = $("#treeViewer");
    if (!tree) {
      container.innerHTML = `<div style="color:var(--text-muted);font-size:12px;">No logical tree data available.</div>`;
      return;
    }

    let html = "";
    if (tree.intent) {
      html += `
        <div class="tree-node-block">
          <div class="tree-node-title">🎯 Intent & Constraints</div>
          <div class="tree-node-items"><div>${escapeHtml(tree.intent)}</div></div>
        </div>
      `;
    }

    if (tree.screens && tree.screens.length > 0) {
      html += `
        <div class="tree-node-block">
          <div class="tree-node-title">🖥️ Screens & UI Views (${tree.screens.length})</div>
          <div class="tree-node-items">
            ${tree.screens.map(s => `<div><strong>${escapeHtml(s.name || s.id)}:</strong> ${escapeHtml(s.purpose || s.details || '')}</div>`).join('')}
          </div>
        </div>
      `;
    }

    if (tree.features && tree.features.length > 0) {
      html += `
        <div class="tree-node-block">
          <div class="tree-node-title">✨ Key Features (${tree.features.length})</div>
          <div class="tree-node-items">
            ${tree.features.map(f => `<div>• <strong>${escapeHtml(f.name || f.id)}:</strong> ${escapeHtml(f.details || '')}</div>`).join('')}
          </div>
        </div>
      `;
    }

    if (tree.verification && tree.verification.length > 0) {
      html += `
        <div class="tree-node-block">
          <div class="tree-node-title">🛡️ DOM Verification & Checks (${tree.verification.length})</div>
          <div class="tree-node-items">
            ${tree.verification.map(v => `<div>✓ ${escapeHtml(v.check || v.id)}</div>`).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = html || `<div style="color:var(--text-muted);font-size:12px;">Structured tree empty.</div>`;
  }

  // Switch to New Conversation (Home view)
  window.openNewConversation = function() {
    state.activeProjectId = null;
    state.activeProject = null;
    state.activeView = "home";
    $("#homeView").style.display = "flex";
    $("#conversationView").classList.remove("active");
    $("#mainPromptInput").value = "";
    $("#mainPromptInput").style.height = "auto";
    $("#sendPromptBtn").classList.remove("active");
    renderProjectsTree();
    setTimeout(() => $("#mainPromptInput").focus(), 50);
  };

  // Submit Prompt to Launch Autonomous Execution
  window.submitPrompt = async function() {
    const input = $("#mainPromptInput");
    const goal = input.value.trim();
    if (!goal) return;

    state.activeView = "conversation";
    $("#homeView").style.display = "none";
    $("#conversationView").classList.add("active");
    $("#convTitle").textContent = goal;
    $("#convStatusBadge").textContent = "LAUNCHING";
    $("#convStatusBadge").className = "status-badge running";

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
          Initiating multi-agent workflow in <strong>${escapeHtml(state.activeFolder)}</strong>...
        </div>
      </div>
    `;

    const useMock = state.selectedContext === "Mock Mode";

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal: goal, 
          mock: useMock,
          folder: state.activeFolder 
        })
      });
      if (res.ok) {
        state.isExecuting = true;
      } else {
        const err = await res.json();
        alert(err.message || "Failed to launch execution");
      }
    } catch (e) {
      console.error("Execution error:", e);
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

    if (state.activeProjectId) {
      const pendingDiv = document.createElement("div");
      pendingDiv.className = "agent-step-card open";
      pendingDiv.innerHTML = `
        <div class="agent-step-header">
          <div class="step-label"><span>🤖 ULTRON Evolution Engine</span><span class="step-badge">UPDATING</span></div>
        </div>
        <div class="agent-step-body">Applying code revision and updating sandbox...</div>
      `;
      stream.appendChild(pendingDiv);
      stream.scrollTop = stream.scrollHeight;

      try {
        const res = await fetch(`/api/projects/${state.activeProjectId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt, mock: state.selectedContext === "Mock Mode" })
        });
        if (res.ok) {
          const data = await res.json();
          pendingDiv.querySelector(".step-badge").textContent = "v" + data.project.version;
          pendingDiv.querySelector(".agent-step-body").textContent = "Update complete: " + (data.project.chat.slice(-1)[0]?.text || "App evolved successfully.");
          updateSplitViewWithProject(data.project);
        }
      } catch (e) {
        pendingDiv.querySelector(".agent-step-body").textContent = "Update failed: " + e;
      }
    }
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

      if (data.status_code === "clarifying") {
        pollClarification();
      } else {
        $("#clarificationAnchor").innerHTML = "";
      }

      if (data.status_code === "approved" && data.active_project_id && (!state.activeProjectId || state.activeProjectId !== data.active_project_id)) {
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

  async function pollLogs() {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const logs = await res.json();
        const viewer = $("#logsViewer");
        if (logs.length > 0) {
          viewer.textContent = logs.slice(0, 15).map(l => `[${l.timestamp || 'LOG'}] ${l.stage}: ${l.body}`).join("\n\n");
        }
      }
    } catch (e) {}
  }

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
    $("#tabContentTree").classList.toggle("active", tabName === "tree");
    $("#tabContentLogs").classList.toggle("active", tabName === "logs");

    if (tabName === "tree") {
      fetchTreeData();
    }
  };

  async function fetchTreeData() {
    try {
      const res = await fetch("/api/tree");
      if (res.ok) {
        const data = await res.json();
        renderTreeNodes(data.tree);
      }
    } catch (e) {}
  }

  window.reloadSandboxIframe = function() {
    const iframe = $("#sandboxIframe");
    const cur = iframe.src;
    iframe.src = cur.split("?")[0] + "?t=" + Date.now();
  };

  window.openAppInNewTab = function() {
    const iframe = $("#sandboxIframe");
    window.open(iframe.src, "_blank");
  };

  window.saveProjectPermanent = async function() {
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

  window.exportAllProjectsZip = function() {
    window.location.href = "/api/projects/export-all";
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
    const body = $("#historyModalBody");
    body.innerHTML = state.projects.length > 0 ? state.projects.map(p => `
      <div style="background:#121215;padding:10px;border-radius:6px;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;cursor:pointer;" onclick="closeModal('historyModal');openProjectConversation({id:'${p.id}',title:'${escapeHtml(p.title)}',isLiveBackend:true})">
        <div>
          <div style="font-weight:500;">${escapeHtml(p.title || p.goal)}</div>
          <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);">${p.id}</div>
        </div>
        <span style="font-size:11px;color:var(--text-muted);">${p.relative_time_str || ''}</span>
      </div>
    `).join("") : "<div style='color:var(--text-muted);padding:10px;'>No conversation history found.</div>";
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
</script>
</body>
</html>
'''

p = Path("templates/antigravity.html")
p.write_text(html_code, encoding="utf-8")
print(f"Updated templates/antigravity.html cleanly (length: {len(html_code)})")
