'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sources?: Array<{ id: string; title: string; node_type: string; summary?: string }>;
  query_time_ms?: number;
  timestamp: Date;
}

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500', label: '🔴 CRITICAL' },
  HIGH:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', dot: 'bg-orange-500', label: '🟠 HIGH' },
  MEDIUM:   { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400', label: '🟡 MEDIUM' },
  LOW:      { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500', label: '🟢 LOW' },
};

const NODE_TYPE_COLORS: Record<string, string> = {
  threat_actor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  vulnerability: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  malware: 'text-red-400 bg-red-500/10 border-red-500/20',
  technique: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  incident: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  weakness: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
  research: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  news: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const SUGGESTED_PROMPTS = [
  'We detected unusual outbound traffic to an unknown IP — how do we begin triage?',
  'A user received a suspicious phishing email with an attachment — what are the next steps?',
  'Our monitoring system flagged a possible lateral movement event. Help me document this.',
  'We found unexpected processes running on a critical server — possible malware infection.',
];

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-slate-200 mt-4 mb-1">{line.slice(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.slice(3)}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold text-white mt-6 mb-2">{line.slice(2)}</h1>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 text-slate-300 text-sm leading-relaxed list-disc">{line.slice(2)}</li>;
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-slate-200 text-sm">{line.slice(2, -2)}</p>;
    if (line.trim() === '') return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} className="text-slate-300 text-sm leading-relaxed">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="text-slate-200 font-bold">{part.slice(2, -2)}</strong>;
          if (part.startsWith('`') && part.endsWith('`')) return <code key={j} className="bg-slate-950 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
          return part;
        })}
      </p>
    );
  });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `## SENTINEL Online

I am SENTINEL, the CYBER TREE Incident Response AI.

I am here to help you **report, triage, and communicate security incidents** effectively. You can:

- **Report an active incident** and I will help you document and scope it
- **Ask about threat actors, malware, or vulnerabilities** in the knowledge base
- **Get structured IR playbook guidance** based on NIST and MITRE ATT&CK frameworks
- **Classify incident severity** with my built-in threat assessment engine

How can I assist with your security operations today?`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSeverity, setCurrentSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('LOW');
  const [copied, setCopied] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = updatedMessages
        .filter(m => m.role !== undefined)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Chat API failed');
      }

      if (data.severity) setCurrentSeverity(data.severity);

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply || 'No response.',
        severity: data.severity,
        sources: data.sources,
        query_time_ms: data.query_time_ms,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Error:** ${err.message || 'Failed to reach SENTINEL. Check NVIDIA_API_KEY configuration.'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportConversation = () => {
    const text = messages.map(m =>
      `[${m.timestamp.toISOString()}] ${m.role.toUpperCase()}:\n${m.content}`
    ).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyber-tree-incident-${Date.now()}.txt`;
    a.click();
  };

  const severityCfg = SEVERITY_CONFIG[currentSeverity];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-h-[calc(100vh-80px)]">

      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-900/60 bg-slate-950/30 backdrop-blur-md shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative w-2.5 h-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0 opacity-50" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
            </div>
            <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-widest">SENTINEL — Incident Response AI</span>
          </div>
          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${severityCfg.bg} ${severityCfg.border} ${severityCfg.color}`}>
            {severityCfg.label}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
            {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
              <span key={key} className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span>{key}</span>
              </span>
            ))}
          </div>
          <button
            onClick={exportConversation}
            className="px-3 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-900 text-[10px] font-mono font-bold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/60 cursor-pointer"
          >
            Export Log
          </button>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const msgSeverity = msg.severity ? SEVERITY_CONFIG[msg.severity] : null;
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl w-full ${isUser ? 'ml-12' : 'mr-12'}`}>

                {/* Role Label */}
                <div className={`flex items-center space-x-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-[10px] font-bold text-violet-400">
                      AI
                    </div>
                  )}
                  <span className="text-[10px] font-mono text-slate-500">
                    {isUser ? 'ANALYST' : 'SENTINEL'} · {msg.timestamp.toLocaleTimeString()}
                  </span>
                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300">
                      A
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={`rounded-2xl p-4 border ${
                  isUser
                    ? 'bg-violet-600/10 border-violet-500/20 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-300'
                }`}>
                  {isUser ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="space-y-1">
                      {renderMarkdown(msg.content)}
                    </div>
                  )}
                </div>

                {/* AI Metadata Row */}
                {!isUser && (
                  <div className="mt-2 flex items-center space-x-3 flex-wrap gap-y-2">
                    {msgSeverity && (
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${msgSeverity.bg} ${msgSeverity.border} ${msgSeverity.color}`}>
                        {msgSeverity.label}
                      </span>
                    )}
                    {msg.query_time_ms && (
                      <span className="text-[9px] font-mono text-slate-600">{msg.query_time_ms}ms</span>
                    )}
                    <button
                      onClick={() => handleCopy(msg.content, `msg-${idx}`)}
                      className="text-[9px] font-mono text-slate-600 hover:text-slate-400 transition-colors cursor-pointer focus:outline-none"
                    >
                      {copied === `msg-${idx}` ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                {/* KB Citation Cards */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[9px] font-mono text-slate-600 uppercase tracking-wider">Knowledge Base References</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.sources.map((src, si) => (
                        <Link
                          key={src.id}
                          href={`/explore/${src.id}`}
                          className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-900/60 hover:border-slate-700 hover:bg-slate-900/30 transition-all flex items-center space-x-3 group"
                        >
                          <span className="text-[9px] font-mono font-bold text-slate-600">[KB-{si + 1}]</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`text-[8px] font-mono font-bold px-1.5 rounded border uppercase ${NODE_TYPE_COLORS[src.node_type] || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                                {src.node_type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate transition-colors">{src.title}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="mr-12">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-[10px] font-bold text-violet-400">AI</div>
                <span className="text-[10px] font-mono text-slate-500">SENTINEL · Analyzing...</span>
              </div>
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl px-5 py-4 flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-mono text-slate-500">Processing threat context...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Prompts — Only when just 1 message (welcome) */}
        {messages.length === 1 && !loading && (
          <div className="space-y-3 mt-4">
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider text-center">Common Incident Scenarios</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="p-3.5 rounded-xl bg-slate-900/30 border border-slate-800/60 hover:border-violet-500/30 hover:bg-slate-900/50 text-left text-xs text-slate-400 hover:text-slate-200 transition-all leading-relaxed cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-slate-900/60 bg-slate-950/30 backdrop-blur-md px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-end space-x-3 p-3 rounded-2xl border transition-all duration-200 ${
            loading
              ? 'border-slate-800 bg-slate-900/20'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 focus-within:border-violet-500/50 focus-within:bg-slate-900/60'
          }`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the incident or ask SENTINEL a question… (Enter to send, Shift+Enter for new line)"
              disabled={loading}
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none font-mono leading-relaxed disabled:opacity-50 max-h-40 overflow-y-auto"
              style={{ minHeight: '24px' }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 160) + 'px';
              }}
            />
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[9px] font-mono text-slate-700 hidden sm:block">Enter ↵ to send</span>
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold font-mono transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/60 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
          <p className="mt-2 text-[9px] font-mono text-slate-700 text-center">
            SENTINEL is powered by NVIDIA NIM · Llama 3.1 70B · Responses enriched with CYBER TREE Knowledge Base
          </p>
        </div>
      </div>
    </div>
  );
}
