'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [selectedSourceDetails, setSelectedSourceDetails] = useState<any | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSources = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sources');
      if (res.status === 401) {
        setError('AUTH_REQUIRED');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch sources');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSources(list);
      
      // Auto-select first source if available
      if (list.length > 0) {
        setSelectedSource(list[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  const fetchSourceDetails = async (sourceId: string) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/sources/${sourceId}`);
      if (!res.ok) throw new Error('Failed to fetch source details');
      const data = await res.json();
      setSelectedSourceDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    if (selectedSource?.id) {
      fetchSourceDetails(selectedSource.id);
    } else {
      setSelectedSourceDetails(null);
    }
  }, [selectedSource]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Never';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  const isRecentlyDiscovered = (notesStr: string) => {
    try {
      const notes = JSON.parse(notesStr);
      if (notes.discovered_at) {
        const discovered = new Date(notes.discovered_at);
        const diffTime = Math.abs(Date.now() - discovered.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
    } catch {}
    return false;
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 0.8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (reliability >= 0.5) return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  // Filter sources
  const filteredSources = sources.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'active') return s.is_active;
    if (filter === 'dead') return !s.is_active;
    if (filter === 'recent') return isRecentlyDiscovered(s.notes);
    return true;
  });

  // Stats calculation
  const totalSourcesCount = sources.length;
  const activeSourcesCount = sources.filter(s => s.is_active).length;
  const deadSourcesCount = totalSourcesCount - activeSourcesCount;
  const avgReliability = totalSourcesCount > 0 
    ? (sources.reduce((acc, s) => acc + (s.reliability || 0.5), 0) / totalSourcesCount).toFixed(2)
    : '0.00';

  if (error === 'AUTH_REQUIRED') {
    return (
      <div className="space-y-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold tracking-tight">Intelligence Sources</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PHASE 8</span>
          </div>
          <p className="mt-2 text-slate-400 text-sm max-w-2xl">
            Automated feed discovery, status monitoring, and validation logs. The system continuously registers external intelligence domains, probes for active RSS feeds, and prunes unreachable channels.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] border border-slate-900 rounded-2xl bg-slate-950/40 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
          <span className="text-4xl mb-4">🔒</span>
          <h3 className="text-lg font-bold font-mono text-slate-200">System Locked</h3>
          <p className="text-xs text-slate-400 font-mono mt-2 max-w-sm leading-relaxed">
            Establishing analyst connection is required to view intelligence source catalog and activity feeds.
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
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Intelligence Sources</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PHASE 8</span>
        </div>
        <p className="mt-2 text-slate-400 text-sm max-w-2xl">
          Automated feed discovery, status monitoring, and validation logs. The system continuously registers external intelligence domains, probes for active RSS feeds, and prunes unreachable channels.
        </p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sources */}
        <div className="relative group p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-colors duration-500" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Total Sources</p>
          <p className="mt-2 text-3xl font-extrabold text-white">{totalSourcesCount}</p>
          <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span>Configured feeds</span>
          </div>
        </div>

        {/* Active Sources */}
        <div className="relative group p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors duration-500" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Active Sources</p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-400">{activeSourcesCount}</p>
          <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Operational & online</span>
          </div>
        </div>

        {/* Dead Sources */}
        <div className="relative group p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-colors duration-500" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Dead/Deactivated</p>
          <p className="mt-2 text-3xl font-extrabold text-rose-400">{deadSourcesCount}</p>
          <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Unreachable or failed validation</span>
          </div>
        </div>

        {/* Avg Reliability */}
        <div className="relative group p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-colors duration-500" />
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Avg Reliability</p>
          <p className="mt-2 text-3xl font-extrabold text-violet-400">{avgReliability}</p>
          <div className="mt-2 flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <span>Confidence weighted score</span>
          </div>
        </div>
      </div>

      {/* Filter and Loading block */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: List of Sources */}
        <div className="w-full lg:w-5/12 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight">Source Catalog</h2>
            <div className="flex bg-slate-900/85 p-0.5 rounded-lg border border-slate-800/80 text-[11px] font-mono">
              <button 
                onClick={() => setFilter('all')}
                className={`px-2 py-1 rounded-md transition-colors ${filter === 'all' ? 'bg-violet-500 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('active')}
                className={`px-2 py-1 rounded-md transition-colors ${filter === 'active' ? 'bg-emerald-500 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('dead')}
                className={`px-2 py-1 rounded-md transition-colors ${filter === 'dead' ? 'bg-rose-500 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                Dead
              </button>
              <button 
                onClick={() => setFilter('recent')}
                className={`px-2 py-1 rounded-md transition-colors ${filter === 'recent' ? 'bg-violet-500 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
              >
                New
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-slate-900/60 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-violet-500 border-r-violet-500 border-b-slate-900 border-l-slate-900 animate-spin" />
              <p className="text-xs font-mono text-slate-400">Loading sources...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-mono">
              Error: {error}
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="py-20 text-center bg-slate-900/20 border border-slate-900/60 rounded-xl">
              <p className="text-xs font-mono text-slate-500">No sources found matching this filter.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredSources.map((source) => {
                const recent = isRecentlyDiscovered(source.notes);
                let notesObj: any = {};
                try { notesObj = JSON.parse(source.notes || '{}'); } catch {}
                const consecutiveFailures = notesObj.consecutive_failures || 0;

                return (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSource(source)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedSource?.id === source.id
                        ? 'bg-violet-950/20 border-violet-500/50 shadow-lg shadow-violet-500/5'
                        : 'bg-slate-900/40 border-slate-900 hover:bg-slate-900/60 hover:border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`h-2 w-2 rounded-full ${source.is_active ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                          <span className="font-bold text-sm text-slate-200">{source.name}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono truncate max-w-[240px]">{source.url}</p>
                      </div>

                      <div className="flex flex-col items-end space-y-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getReliabilityColor(source.reliability)}`}>
                          R: {source.reliability?.toFixed(2)}
                        </span>
                        {recent && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                            NEW
                          </span>
                        )}
                        {!source.is_active && consecutiveFailures > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                            Dead ({consecutiveFailures}/3)
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detailed View */}
        <div className="w-full lg:w-7/12">
          {selectedSource ? (
            <div className="space-y-6 p-6 rounded-xl bg-slate-900/40 border border-slate-900 backdrop-blur-sm">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedSource.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      selectedSource.is_active 
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    }`}>
                      {selectedSource.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </div>
                  <a 
                    href={selectedSource.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors flex items-center space-x-1"
                  >
                    <span>{selectedSource.url}</span>
                    <svg className="h-3 w-3 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="text-right">
                  <p className="text-xs font-mono text-slate-500">Reliability Score</p>
                  <p className={`text-xl font-black mt-1 ${
                    selectedSource.reliability >= 0.8 ? 'text-emerald-400' :
                    selectedSource.reliability >= 0.5 ? 'text-violet-400' : 'text-amber-400'
                  }`}>
                    {(selectedSource.reliability * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-800/60 pb-6">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Category</p>
                  <p className="text-sm font-semibold mt-1 text-slate-200 capitalize">{selectedSource.category || 'Feed'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Articles Harvested</p>
                  <p className="text-sm font-semibold mt-1 text-slate-200">{selectedSource.total_articles ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Last Checked</p>
                  <p className="text-sm font-semibold mt-1 text-slate-200">{formatDate(selectedSource.last_checked)}</p>
                </div>
              </div>

              {/* Maintenance Notes & Failure Logs */}
              {(() => {
                let notesObj: any = {};
                try { notesObj = JSON.parse(selectedSource.notes || '{}'); } catch {}
                const consecutiveFailures = notesObj.consecutive_failures || 0;
                
                return (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white tracking-wider uppercase">Discovery & Diagnostics</h3>
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 text-xs space-y-3 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Discovered Via:</span>
                        <span className="text-slate-300">{notesObj.discovered_by || 'system_seed'}</span>
                      </div>
                      
                      {notesObj.discovered_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Discovery Date:</span>
                          <span className="text-slate-300">{formatDate(notesObj.discovered_at)}</span>
                        </div>
                      )}

                      {/* URL Redirection/Replacement tracking */}
                      {notesObj.url_replaced_from && (
                        <div className="p-2.5 rounded bg-violet-950/15 border border-violet-500/10 space-y-1">
                          <p className="text-violet-400 font-bold">Alternative URL Discovered</p>
                          <p className="text-[11px] text-slate-400 break-all">Replaced from: {notesObj.url_replaced_from}</p>
                          <p className="text-[11px] text-slate-500">Replaced at: {formatDate(notesObj.url_replaced_at)}</p>
                        </div>
                      )}

                      {/* Failure log */}
                      {consecutiveFailures > 0 ? (
                        <div className="p-3 rounded bg-rose-950/10 border border-rose-500/10 space-y-2">
                          <div className="flex items-center justify-between text-rose-400 font-bold">
                            <span>Diagnostic Failures:</span>
                            <span>{consecutiveFailures} / 3 checks</span>
                          </div>
                          {notesObj.last_failure_reason && (
                            <p className="text-[11px] text-slate-400">
                              Reason: <span className="text-rose-300">{notesObj.last_failure_reason}</span>
                            </p>
                          )}
                          {notesObj.last_failure_at && (
                            <p className="text-[10px] text-slate-500">
                              Failed at: {formatDate(notesObj.last_failure_at)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-between text-emerald-500">
                          <span>Health Status:</span>
                          <span className="font-semibold">Healthy (No consecutive failures)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 10 Most Recent Nodes from this source */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white tracking-wider uppercase">Recent Indexings ({selectedSourceDetails?.recentNodes?.length || 0})</h3>
                {detailsLoading ? (
                  <div className="flex items-center space-x-2 py-6">
                    <div className="w-4 h-4 rounded-full border border-t-violet-500 border-r-violet-500 border-b-slate-900 border-l-slate-900 animate-spin" />
                    <span className="text-xs font-mono text-slate-400">Loading nodes...</span>
                  </div>
                ) : selectedSourceDetails?.recentNodes && selectedSourceDetails.recentNodes.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSourceDetails.recentNodes.map((node: any) => (
                      <Link 
                        key={node.id} 
                        href={`/explore#${node.id}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950/30 border border-slate-900/80 hover:bg-slate-950/50 hover:border-slate-800/50 transition-all text-xs"
                      >
                        <div className="space-y-1 pr-4 max-w-[80%]">
                          <p className="font-semibold text-slate-200 truncate">{node.title}</p>
                          <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-500">
                            <span className="uppercase text-violet-400">{node.node_type}</span>
                            <span>•</span>
                            <span>{formatDate(node.created_at)}</span>
                          </div>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                          node.confidence >= 0.85 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                          node.confidence >= 0.7 ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' :
                          'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {(node.confidence * 100).toFixed(0)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/20 border border-slate-950/60 rounded-xl font-mono text-xs text-slate-500">
                    No nodes have been cataloged from this source yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900/10 border border-slate-900/50 rounded-xl">
              <svg className="h-10 w-10 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs font-mono text-slate-500">Select an intelligence source from the list to view its status and cataloged items.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
