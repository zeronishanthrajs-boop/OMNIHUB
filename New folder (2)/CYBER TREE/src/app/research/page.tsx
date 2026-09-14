'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const NODE_TYPE_COLORS: Record<string, string> = {
  threat_actor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  vulnerability: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  malware: 'text-red-400 bg-red-500/10 border-red-500/20',
  technique: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  incident: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  weakness: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
  technology: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  research: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  news: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

function getNodeTypeColor(type: string) {
  return NODE_TYPE_COLORS[type] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
}

const PRESET_EXAMPLES = [
  "What techniques does Lazarus Group use?",
  "Describe recent CVE vulnerability trends in NVD.",
  "How does the ThreatNeedle malware operate?"
];

export default function ResearchPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [queryTime, setQueryTime] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const sourcesSectionRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check auth and load history from localStorage on mount
  useEffect(() => {
    fetch('/api/auth/status')
      .then(res => {
        if (res.status === 401) {
          setIsAuthed(false);
        } else {
          setIsAuthed(true);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setIsAuthed(false);
        setAuthChecked(true);
      });

    const saved = localStorage.getItem('cyber_tree_recent_research');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch {
        // Clear corrupt data
        localStorage.removeItem('cyber_tree_recent_research');
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = (q: string) => {
    const updated = [q, ...history.filter((h) => h !== q)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('cyber_tree_recent_research', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cyber_tree_recent_research');
  };

  const handleSearch = async (q: string) => {
    if (!q.trim() || loading) return;
    setQuestion(q);
    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);
    setQueryTime(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Request failed');
      }

      const data = await res.json();
      setAnswer(data.answer || '');
      setSources(data.sources || []);
      setQueryTime(data.query_time_ms || null);
      if (data.error) {
        setError(data.error);
      }
      saveHistory(q);
    } catch (err: any) {
      setError(err.message || 'An error occurred during synthesis.');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceCitationClick = (citationVal: string) => {
    // If it's a number (1-indexed index into the sources array)
    const index = parseInt(citationVal, 10);
    let targetId = '';

    if (!isNaN(index) && sources[index - 1]) {
      targetId = sources[index - 1].id;
    } else {
      // Treat as UUID
      targetId = citationVal;
    }

    if (!targetId) return;

    // Scroll to the card
    const element = document.getElementById(`source-card-${targetId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the card temporarily
      setHighlightedSourceId(targetId);
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedSourceId(null);
      }, 2500);
    }
  };

  // Safe Inline Markdown Parser
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const blocks = text.split(/\n\n+/);

    return blocks.map((block, blockIdx) => {
      block = block.trim();
      if (!block) return null;

      // Headings
      if (block.startsWith('# ')) {
        return <h1 key={blockIdx} className="text-xl font-extrabold text-slate-100 mt-4 mb-2 font-mono">{renderInline(block.slice(2))}</h1>;
      }
      if (block.startsWith('## ')) {
        return <h2 key={blockIdx} className="text-lg font-bold text-slate-200 mt-4 mb-2 font-mono">{renderInline(block.slice(3))}</h2>;
      }
      if (block.startsWith('### ')) {
        return <h3 key={blockIdx} className="text-md font-semibold text-slate-300 mt-3 mb-1 font-mono">{renderInline(block.slice(4))}</h3>;
      }

      // Bullet List items
      if (block.startsWith('- ') || block.startsWith('* ')) {
        const items = block.split(/\n[-*]\s+/);
        return (
          <ul key={blockIdx} className="list-disc pl-5 space-y-1.5 my-2">
            {items.map((item, itemIdx) => {
              const cleanItem = item.replace(/^[-*]\s+/, '');
              return (
                <li key={itemIdx} className="text-slate-300 text-sm leading-relaxed">
                  {renderInline(cleanItem)}
                </li>
              );
            })}
          </ul>
        );
      }

      // Code blocks
      if (block.startsWith('```')) {
        const lines = block.split('\n');
        const code = lines.slice(1, lines.length - (lines[lines.length - 1] === '```' ? 1 : 0)).join('\n');
        return (
          <pre key={blockIdx} className="p-4 rounded-xl bg-slate-950 border border-slate-900/60 font-mono text-xs text-violet-300 overflow-x-auto my-3">
            <code>{code}</code>
          </pre>
        );
      }

      // Paragraphs
      const lines = block.split('\n');
      return (
        <p key={blockIdx} className="text-slate-300 text-sm leading-relaxed mb-3">
          {lines.map((line, lineIdx) => (
            <span key={lineIdx} className="block">
              {renderInline(line)}
            </span>
          ))}
        </p>
      );
    });
  };

  const renderInline = (text: string) => {
    const citationRegex = /\[(\d+|[0-9a-fA-F-]{36})\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(renderBoldItalic(text.substring(lastIndex, matchIndex)));
      }
      
      const citationVal = match[1];
      parts.push(
        <button
          key={`cite-${matchIndex}`}
          onClick={() => handleSourceCitationClick(citationVal)}
          className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-bold font-mono bg-violet-600/25 hover:bg-violet-600/40 text-violet-400 border border-violet-500/20 hover:border-violet-500/40 transition-colors cursor-pointer align-baseline"
        >
          {citationVal.length > 3 ? `[Ref: ${citationVal.slice(0, 4)}]` : `[${citationVal}]`}
        </button>
      );
      
      lastIndex = citationRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(renderBoldItalic(text.substring(lastIndex)));
    }

    return parts;
  };

  const renderBoldItalic = (text: string) => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(<span key={lastIndex}>{text.substring(lastIndex, matchIndex)}</span>);
      }
      parts.push(<strong key={`bold-${matchIndex}`} className="font-semibold text-slate-100">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
    }

    return parts;
  };

  if (!authChecked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4 min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
        <p className="text-xs font-mono text-slate-400">Verifying analyst identity...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400">
            AI Threat Research Assistant
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Query the CYBER TREE knowledge graph using natural language. The system retrieves related vulnerabilities, actors, and malware, then generates a synthesized answer with interactive citations.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] border border-slate-900 rounded-2xl bg-slate-950/40 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
          <span className="text-4xl mb-4">🔒</span>
          <h3 className="text-lg font-bold font-mono text-slate-200">System Locked</h3>
          <p className="text-xs text-slate-400 font-mono mt-2 max-w-sm leading-relaxed">
            Establishing analyst connection is required to utilize the AI Threat Research Assistant.
          </p>
          <Link
            href="/login"
            className="mt-6 px-4 py-2 border border-violet-500/40 text-xs font-mono tracking-widest uppercase rounded-lg text-white bg-violet-600/20 hover:bg-violet-600/30 transition-all duration-200"
          >
            Establish Connection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400">
          AI Threat Research Assistant
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Query the CYBER TREE knowledge graph using natural language. The system retrieves related vulnerabilities, actors, and malware, then generates a synthesized answer with interactive citations.
        </p>
      </div>

      {/* Control panel / Search bar */}
      <div className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/80 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(question); }} className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 transition-all font-mono"
            placeholder="e.g., What techniques does Lazarus Group use?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-mono text-sm font-semibold shadow-lg hover:shadow-violet-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {loading ? 'Analyzing...' : 'Ask Assistant'}
          </button>
        </form>

        {/* Clickable Examples */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
          <span>Preset Questions:</span>
          {PRESET_EXAMPLES.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { setQuestion(example); handleSearch(example); }}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 hover:bg-slate-950 text-slate-400 hover:text-slate-200 transition-all cursor-pointer text-left"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 rounded-2xl border border-slate-800/80 bg-slate-900/20 flex flex-col items-center justify-center space-y-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest animate-pulse">
            Retrieving Security Context & Synthesizing Sourced Answer...
          </span>
        </div>
      )}

      {/* Error / Key warning banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs leading-relaxed">
          <span className="font-bold uppercase">System Warning:</span> {error}
        </div>
      )}

      {/* Results block */}
      {!loading && (answer || sources.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Answer Panel */}
          <div className="lg:col-span-2 space-y-6">
            {answer && (
              <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-violet-400 font-bold">
                    AI Response Synthesis
                  </h3>
                  {queryTime && (
                    <span className="font-mono text-[10px] text-slate-500">
                      Query executed in {queryTime}ms
                    </span>
                  )}
                </div>
                <div className="prose prose-invert max-w-none border-b border-slate-900/60 pb-6 mb-6">
                  {renderMarkdown(answer)}
                </div>

                {/* Inline RAG Citation Cards */}
                {sources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider">Citations & Reference Entities</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sources.map((src, idx) => (
                        <Link
                          key={src.id}
                          href={`/explore/${src.id}`}
                          className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-slate-800 hover:bg-slate-900/20 transition-all flex items-center justify-between gap-4 block"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                              <span className="text-[9px] font-mono font-bold text-slate-500">[{idx + 1}]</span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border uppercase ${getNodeTypeColor(src.node_type)}`}>
                                {src.node_type.replace('_', ' ')}
                              </span>
                              {src.metadata?.degraded_relevance && (
                                <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/5 px-1 py-0.2 rounded border border-amber-500/20 uppercase">⚠️ Degraded</span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-slate-300 truncate mt-2">{src.title}</h4>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                            {Math.round(src.score * 100)}% Match
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Warning if low count of sources */}
            {sources.length > 0 && sources.length < 5 && (
              <div className="flex items-start p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 space-x-3 text-xs leading-relaxed font-mono">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <span className="font-bold">LOW SOURCE COUNT WARNING:</span> Synthesized answer is based on fewer than 5 sources ({sources.length} found). The analysis may lack comprehensive cross-references.
                </div>
              </div>
            )}
          </div>

          {/* Sources Side Panel */}
          <div ref={sourcesSectionRef} className="space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-900 pb-2">
              Cited Context Sources ({sources.length})
            </h3>
            {sources.length === 0 ? (
              <p className="text-xs font-mono text-slate-500">No sources retrieved.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {sources.map((source, idx) => {
                  const isHighlighted = highlightedSourceId === source.id;
                  return (
                    <div
                      id={`source-card-${source.id}`}
                      key={source.id}
                      className={`p-4 rounded-xl border bg-slate-900/30 transition-all duration-300 ${
                        isHighlighted
                          ? 'border-violet-500 shadow-lg shadow-violet-500/10 scale-[1.02] bg-slate-900/60'
                          : 'border-slate-850 hover:border-slate-700 bg-slate-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between space-x-2 flex-wrap gap-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded font-bold">
                            Ref [{idx + 1}]
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getNodeTypeColor(source.node_type)}`}>
                            {source.node_type.replace('_', ' ')}
                          </span>
                        </div>
                        {source.metadata?.degraded_relevance && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center space-x-1 uppercase shrink-0">
                            <span>⚠️</span>
                            <span>Degraded</span>
                          </span>
                        )}
                      </div>
                      
                      <Link
                        href={`/explore/${source.id}`}
                        className="block mt-2 font-semibold text-sm text-slate-200 hover:text-violet-400 transition-colors hover:underline"
                      >
                        {source.title}
                      </Link>

                      {/* Meters */}
                      <div className="mt-3 space-y-2 border-t border-slate-900 pt-2 font-mono text-[10px] text-slate-400">
                        {/* Relevance Score Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Relevance Score</span>
                            <span className="font-bold text-violet-400">{(source.score).toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1">
                            <div
                              className="bg-violet-500 h-1 rounded-full"
                              style={{ width: `${Math.min(Math.max(source.score * 100, 0), 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Node Confidence Meter */}
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Node Confidence</span>
                            <span className="font-bold text-emerald-400">{(source.confidence * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1">
                            <div
                              className="bg-emerald-500 h-1 rounded-full"
                              style={{ width: `${source.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Local Storage History Section */}
      {history.length > 0 && (
        <div className="pt-6 border-t border-slate-900/60">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500 font-bold">
              Recent Inquiries
            </h3>
            <button
              onClick={clearHistory}
              className="text-[10px] font-mono text-slate-600 hover:text-red-400 transition-colors uppercase cursor-pointer"
            >
              Clear History
            </button>
          </div>
          <div className="flex flex-col space-y-1">
            {history.map((q, idx) => (
              <button
                key={idx}
                onClick={() => { setQuestion(q); handleSearch(q); }}
                disabled={loading}
                className="text-left py-1.5 px-3 rounded hover:bg-slate-900/50 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors border border-transparent hover:border-slate-900 cursor-pointer"
              >
                💾 {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
