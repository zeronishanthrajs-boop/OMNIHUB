'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

function getTypeColor(type: string) {
  return NODE_TYPE_COLORS[type] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';
}

function SimilarityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 65 ? 'bg-violet-500' :
    pct >= 50 ? 'bg-amber-500' : 'bg-slate-600';
  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-slate-300 w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function SimilarPage() {
  const params = useParams();
  const id = params?.id as string;

  const [sourceNode, setSourceNode] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useState(0.5);
  const [fetchingMore, setFetchingMore] = useState(false);

  const fetchSourceNode = useCallback(async () => {
    try {
      const res = await fetch(`/api/nodes/${id}`);
      if (!res.ok) throw new Error('Node not found');
      const data = await res.json();
      setSourceNode(data.node || data);
    } catch {
      setSourceNode(null);
    }
  }, [id]);

  const fetchSimilar = useCallback(async (thresh: number) => {
    setFetchingMore(true);
    setError('');
    try {
      const res = await fetch(`/api/similar/${id}?threshold=${thresh}&limit=10`);
      if (!res.ok) throw new Error('Failed to fetch similar nodes');
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setResults([]);
    } finally {
      setFetchingMore(false);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSourceNode(), fetchSimilar(threshold)]);
      setLoading(false);
    };
    if (id) init();
  }, [id]);

  const handleThresholdChange = (val: number) => {
    setThreshold(val);
    fetchSimilar(val);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link href="/search" className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors">
              ← Search
            </Link>
            {sourceNode && (
              <>
                <span className="text-slate-700">/</span>
                <Link href={`/explore/${id}`} className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors truncate max-w-xs">
                  {sourceNode.title}
                </Link>
              </>
            )}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Semantic Similarity</h1>
          <p className="mt-1 text-slate-400 text-sm font-mono">
            Top 10 nodes most similar to this entry by vector cosine distance
          </p>
        </div>
      </div>

      {/* Source Node Card */}
      {sourceNode && (
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-violet-500/30 backdrop-blur-md space-y-3">
          <p className="text-[10px] font-mono text-violet-400 uppercase tracking-widest">Source Node</p>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getTypeColor(sourceNode.node_type)}`}>
              {sourceNode.node_type?.replace('_', ' ')}
            </span>
            {sourceNode.external_id && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400">
                {sourceNode.external_id}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">{sourceNode.title}</h2>
          {sourceNode.summary && (
            <p className="text-xs text-slate-400 line-clamp-2">{sourceNode.summary}</p>
          )}
          <div className="flex items-center space-x-3 pt-1">
            <Link href={`/explore/${id}`} className="text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors">
              VIEW IN GRAPH →
            </Link>
          </div>
          {!sourceNode.embedding && (
            <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-400">
              ⚠ This node has not been embedded yet. Run embed_nodes.py to generate vectors, then similar nodes will appear here.
            </div>
          )}
        </div>
      )}

      {/* Threshold Control */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Similarity Threshold</p>
          <span className="text-sm font-black font-mono text-violet-400">{(threshold * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={0.95}
          step={0.05}
          value={threshold}
          onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
          className="w-full accent-violet-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>50% (Broad)</span>
          <span>72% (Balanced)</span>
          <span>95% (Exact)</span>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-slate-400 uppercase tracking-wider">
            Similar Nodes {!loading && !fetchingMore && `(${results.length} found)`}
          </h3>
          {fetchingMore && (
            <div className="flex items-center space-x-2 text-xs font-mono text-violet-400">
              <div className="animate-spin h-3 w-3 border border-t-transparent border-violet-500 rounded-full" />
              <span>Searching...</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-2 border-t-transparent border-violet-500 rounded-full" />
            <p className="mt-4 text-xs font-mono text-slate-500">Computing vector similarity...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 font-mono">
            Error: {error}
          </div>
        ) : results.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl space-y-2">
            <p className="text-sm text-slate-500 font-mono">No similar nodes found above {(threshold * 100).toFixed(0)}% threshold.</p>
            <p className="text-xs text-slate-600 font-mono">
              {sourceNode?.embedding
                ? 'Try lowering the similarity threshold.'
                : 'This node needs to be embedded first. Run embed_nodes.py.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {results.map((node: any, idx: number) => (
              <div
                key={node.id}
                className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900/80 hover:border-slate-700 hover:bg-slate-900/40 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between space-x-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-black font-mono text-slate-600">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getTypeColor(node.node_type)}`}>
                        {node.node_type?.replace('_', ' ')}
                      </span>
                      {node.external_id && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-500">
                          {node.external_id}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/explore/${node.id}`}
                      className="block text-sm font-bold text-slate-200 group-hover:text-white hover:underline transition-all truncate"
                    >
                      {node.title}
                    </Link>
                    {node.summary && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{node.summary}</p>
                    )}
                  </div>
                  <div className="shrink-0 w-32 space-y-1">
                    <SimilarityBar value={node.similarity ?? 0} />
                    <Link
                      href={`/similar/${node.id}`}
                      className="block text-center text-[10px] font-mono text-violet-400/60 hover:text-violet-400 transition-colors pt-1"
                    >
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
