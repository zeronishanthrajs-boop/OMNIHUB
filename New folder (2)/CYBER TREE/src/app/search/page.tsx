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

export default function SearchPage() {
  const [search, setSearch] = useState('');
  const [nodeType, setNodeType] = useState('all');
  const [semantic, setSemantic] = useState(false);
  const [threshold, setThreshold] = useState(0.5);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = async (
    q: string,
    type: string,
    sem: boolean,
    thresh: number
  ) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q) params.append('search', q);
      if (type && type !== 'all') params.append('type', type);
      if (sem) {
        params.append('semantic', 'true');
        params.append('threshold', thresh.toString());
      }

      const response = await fetch(`/api/nodes?${params.toString()}`);
      if (!response.ok) throw new Error('Search request failed');
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch search results');
    } finally {
      setLoading(false);
    }
  };

  // Debounced trigger on any param change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(search, nodeType, semantic, threshold);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, nodeType, semantic, threshold]);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Intelligence Search</h1>
        <p className="mt-2 text-slate-400 text-sm">
          Query indexed security nodes using keywords, type filters, or semantic vector similarity.
        </p>
      </div>

      {/* Control Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/80 space-y-5">

        {/* Search + Type row */}
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search threat actors, vulnerabilities, malware, CVEs..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 transition-all font-mono"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors text-lg"
              >
                ×
              </button>
            )}
          </div>
          <div className="w-full md:w-48">
            <select
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 transition-all font-mono"
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="threat_actor">Threat Actor</option>
              <option value="vulnerability">Vulnerability</option>
              <option value="malware">Malware</option>
              <option value="technique">Technique</option>
              <option value="incident">Incident</option>
              <option value="weakness">Weakness</option>
              <option value="technology">Technology</option>
              <option value="research">Research</option>
              <option value="news">News</option>
            </select>
          </div>
        </div>

        {/* Semantic toggle */}
        <div className="flex items-center space-x-3 pt-1">
          <label className="flex items-center space-x-2.5 cursor-pointer group">
            <div
              onClick={() => setSemantic(!semantic)}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                semantic ? 'bg-violet-600' : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                semantic ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
            <span className="text-xs font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
              Semantic Search <span className="text-slate-600">(Cosine Similarity · all-MiniLM-L6-v2)</span>
            </span>
          </label>
        </div>

        {/* Threshold slider — shown only when semantic is ON */}
        {semantic && (
          <div className="space-y-2 pt-1 border-t border-slate-800/80 mt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Similarity Threshold
              </label>
              <span className="text-sm font-black font-mono text-violet-400">
                {(threshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={0.95}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-600">
              <span>50% — Broad matches</span>
              <span>72% — Balanced</span>
              <span>95% — Near-identical</span>
            </div>
            <p className="text-[10px] font-mono text-slate-600 pt-1">
              ↑ Higher = only very similar nodes · Lower = more results, less precise
            </p>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && results.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-mono text-slate-500">
            {results.length} {results.length === 1 ? 'result' : 'results'}{' '}
            {semantic ? `above ${(threshold * 100).toFixed(0)}% similarity` : 'found'}
          </p>
          {semantic && (
            <p className="text-[10px] font-mono text-slate-600">
              Sorted by vector cosine distance
            </p>
          )}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin h-6 w-6 border-2 border-t-transparent border-violet-500 rounded-full" />
            <p className="mt-4 text-xs font-mono text-slate-500">
              {semantic ? 'Computing vector similarity across 13,000+ nodes...' : 'Searching knowledge map...'}
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 font-mono">
            Error: {error}
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-900 rounded-2xl space-y-2">
            <p className="text-sm text-slate-500 font-mono">No matching records found.</p>
            {semantic && (
              <p className="text-xs text-slate-600 font-mono">
                Try lowering the similarity threshold or running embed_nodes.py to generate vectors.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {results.map((node: any) => (
              <div
                key={node.id}
                className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/30 transition-all duration-200 flex flex-col md:flex-row md:items-start justify-between space-y-4 md:space-y-0"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getNodeTypeColor(node.node_type)}`}>
                      {node.node_type?.replace('_', ' ')}
                    </span>
                    {node.external_id && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-400">
                        {node.external_id}
                      </span>
                    )}
                    {node.similarity != null && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {(node.similarity * 100).toFixed(1)}% match
                      </span>
                    )}
                    {node.metadata?.degraded_relevance && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>Degraded Relevance</span>
                      </span>
                    )}
                  </div>
                  <Link href={`/explore/${node.id}`} className="text-base font-bold text-slate-200 hover:text-white hover:underline transition-all block">
                    {node.title}
                  </Link>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{node.summary}</p>

                  {node.tags && node.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {node.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] font-mono text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-left md:text-right flex flex-col justify-between shrink-0 font-mono text-[10px] text-slate-500 space-y-1.5">
                  <div>Source: <span className="text-slate-400">{node.source_name || 'MITRE'}</span></div>
                  <div>Confidence: <span className="text-violet-400 font-bold">{(node.confidence * 100).toFixed(0)}%</span></div>
                  <div className="flex flex-col space-y-1 pt-1">
                    <Link href={`/explore/${node.id}`} className="text-violet-400 hover:text-violet-300 font-bold">
                      EXPLORE LINKS →
                    </Link>
                    <Link href={`/similar/${node.id}`} className="text-emerald-400/70 hover:text-emerald-400 font-bold">
                      FIND SIMILAR →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
