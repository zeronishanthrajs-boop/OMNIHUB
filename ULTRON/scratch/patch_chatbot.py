import sys

def patch():
    with open("templates/antigravity.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add CSS for msg-assistant and typing-indicator
    css_to_add = """  /* Assistant Chat Message (Chatbot Style) */
  .msg-assistant {
    display: flex;
    gap: 12px;
    max-width: 90%;
    align-self: flex-start;
    margin: 4px 0;
  }
  .msg-avatar.ultron-avatar {
    background: #0ea5e9;
    color: #ffffff;
    font-size: 13px;
    box-shadow: 0 0 12px rgba(14, 165, 233, 0.3);
  }
  .msg-assistant .msg-bubble {
    background: #141418;
    border: 1px solid #27272f;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    line-height: 1.6;
    color: #e4e4e7;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg-assistant .msg-bubble code {
    background: #1f1f26;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: #38bdf8;
  }
  .msg-assistant .msg-bubble pre {
    background: #0d0d10;
    border: 1px solid #27272a;
    border-radius: 8px;
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;
  }
  .msg-assistant .msg-bubble pre code {
    background: none;
    padding: 0;
    color: #f1f5f9;
  }
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 0;
  }
  .typing-dot {
    width: 6px;
    height: 6px;
    background: var(--accent-blue);
    border-radius: 50%;
    animation: typingPulse 1.2s infinite ease-in-out;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes typingPulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.1); }
  }

  /* Antigravity Agent Stage Accordion */"""

    if ".msg-assistant" not in content:
        content = content.replace("  /* Antigravity Agent Stage Accordion */", css_to_add, 1)

    # 2. Add renderMarkdown function
    markdown_fn = """  function renderMarkdown(text) {
    if (!text) return "";
    let html = escapeHtml(text);
    // Code blocks ```code```
    html = html.replace(/```([a-zA-Z0-9_-]*)\\n([\\s\\S]*?)```/g, (m, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold **text**
    html = html.replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>");
    // Italic *text*
    html = html.replace(/\\*([^*]+)\\*/g, "<em>$1</em>");
    // Bullet points
    html = html.replace(/^\\s*[-•]\\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\\/li>)/s, "<ul>$1</ul>");
    // Line breaks
    html = html.replace(/\\n\\n+/g, "<br><br>").replace(/\\n/g, "<br>");
    return html;
  }
"""
    if "function renderMarkdown" not in content:
        content = content.replace("  function escapeHtml(str) {", markdown_fn + "\n  function escapeHtml(str) {", 1)

    # 3. Update renderProjectChatStream in chat history
    old_history_render = """    // 3. Iterative chat history
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
    }"""

    new_history_render = """    // 3. Iterative chat history
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
    }"""

    content = content.replace(old_history_render, new_history_render, 1)

    # 4. Update submitFollowUp
    old_submit = """  // Submit Iterative Follow-up Request
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
  };"""

    new_submit = """  // Submit Iterative Follow-up Request
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
  };"""

    content = content.replace(old_submit, new_submit, 1)

    with open("templates/antigravity.html", "w", encoding="utf-8") as f:
        f.write(content)

    print("[OK] Successfully patched chatbot support into templates/antigravity.html")

if __name__ == "__main__":
    patch()
