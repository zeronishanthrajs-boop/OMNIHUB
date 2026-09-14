'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPredictions = async (filter: string) => {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'all' ? '/api/predictions' : `/api/predictions?status=${filter}`;
      const res = await fetch(url);
      if (res.status === 401) {
        setError('AUTH_REQUIRED');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch predictions');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPredictions(list);
      
      // Auto-select first prediction if none selected or if selected one is not in the list anymore
      if (list.length > 0) {
        setSelectedPrediction(list[0]);
      } else {
        setSelectedPrediction(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions(statusFilter);
  }, [statusFilter]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'disproven':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'partial':
        return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'pending':
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  };

  // Helper to generate chart data for confidence timeline
  const generateTimelineData = (pred: any) => {
    if (!pred) return [];
    
    const evidenceFor = pred.evidence_for || [];
    const evidenceAgainst = pred.evidence_against || [];
    
    // Sort all evidence events chronologically or pseudo-chronologically
    const events: { type: 'for' | 'against'; label: string; date: string }[] = [];
    
    evidenceFor.forEach((ev: string) => {
      // Extract date if present, e.g. "(Created: 2026-06-16...)"
      const match = ev.match(/Created:\s*([^\)]+)/);
      events.push({
        type: 'for',
        label: ev.split(') ')[1] || ev.slice(0, 30),
        date: match ? match[1] : pred.created_at
      });
    });
    
    evidenceAgainst.forEach((ev: string) => {
      const match = ev.match(/Created:\s*([^\)]+)/);
      events.push({
        type: 'against',
        label: ev.split(') ')[1] || ev.slice(0, 30),
        date: match ? match[1] : pred.created_at
      });
    });
    
    // Sort events by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Construct timeline starting with base confidence
    const data = [];
    let currentConf = pred.confidence;
    
    // Calculate initial base confidence
    const totalForChange = evidenceFor.length * 0.15;
    const totalAgainstChange = evidenceAgainst.length * 0.20;
    let baseConf = currentConf - totalForChange + totalAgainstChange;
    baseConf = Math.min(0.95, Math.max(0.10, baseConf));
    
    data.push({
      event: 'Generation',
      confidence: parseFloat(baseConf.toFixed(2)),
      timestamp: formatDate(pred.created_at)
    });
    
    let tempConf = baseConf;
    events.forEach((ev, idx) => {
      if (ev.type === 'for') {
        tempConf = Math.min(0.95, tempConf + 0.15);
      } else {
        tempConf = Math.max(0.05, tempConf - 0.20);
      }
      
      data.push({
        event: ev.type === 'for' ? `Evidence: ${ev.label.slice(0, 15)}...` : `Patch: ${ev.label.slice(0, 15)}...`,
        confidence: parseFloat(tempConf.toFixed(2)),
        timestamp: formatDate(ev.date)
      });
    });
    
    // Ensure final point is the exact current confidence
    if (data.length > 1) {
      data[data.length - 1].confidence = pred.confidence;
    }
    
    return data;
  };

  const timelineData = generateTimelineData(selectedPrediction);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Hypothesis Engine</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">PHASE 6</span>
        </div>
        <p className="mt-2 text-slate-400 text-sm max-w-2xl">
          Automated risk predictions derived from semantic similarity mapping and historical technology failure patterns. Validated continuously against real-world vulnerability reports.
        </p>
      </div>

      {/* Main Layout Grid */}
      {error === 'AUTH_REQUIRED' ? (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] border border-slate-900 rounded-2xl bg-slate-950/40 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
          <span className="text-4xl mb-4">🔒</span>
          <h3 className="text-lg font-bold font-mono text-slate-200">System Locked</h3>
          <p className="text-xs text-slate-400 font-mono mt-2 max-w-sm leading-relaxed">
            Establishing analyst connection is required to view operational hypotheses and validation tracking.
          </p>
          <Link
            href="/login"
            className="mt-6 px-4 py-2 border border-violet-500/40 text-xs font-mono tracking-widest uppercase rounded-lg text-white bg-violet-600/20 hover:bg-violet-600/30 transition-all duration-200"
          >
            Establish Connection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left column: List & Filters */}
          <div className="lg:col-span-5 space-y-4">
            {/* Status Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 overflow-x-auto">
              {['all', 'pending', 'partial', 'confirmed', 'disproven'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold capitalize whitespace-nowrap transition-all duration-150 shrink-0 ${
                    statusFilter === filter
                      ? 'bg-slate-900 text-slate-200 border border-slate-800'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Predictions List */}
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {loading ? (
                <div className="p-12 text-center border border-slate-900 rounded-2xl bg-slate-900/10">
                  <div className="inline-block w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-xs text-slate-500 font-mono">Analyzing intelligence reports...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center border border-rose-950/20 rounded-2xl bg-rose-950/5 text-rose-400 text-xs font-mono">
                  Error: {error}
                </div>
              ) : predictions.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-900 rounded-2xl">
                  <p className="text-xs text-slate-500 font-mono">No predictions matching filter found.</p>
                </div>
              ) : (
                predictions.map((pred) => (
                  <button
                    key={pred.id}
                    onClick={() => setSelectedPrediction(pred)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 block ${
                      selectedPrediction?.id === pred.id
                        ? 'bg-slate-900/40 border-violet-500/40 shadow-md shadow-violet-500/5'
                        : 'bg-slate-900/10 border-slate-900/80 hover:border-slate-800 hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase ${getStatusBadgeClass(pred.status)}`}>
                        {pred.status}
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-400">
                        {Math.round(pred.confidence * 100)}% Conf.
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 line-clamp-1">{pred.title}</h3>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[180px] font-mono text-slate-400">Context: {pred.technology_context || 'None'}</span>
                      <span className="shrink-0">{new Date(pred.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right column: Detail Panel */}
          <div className="lg:col-span-7">
            {selectedPrediction ? (
              <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 backdrop-blur-sm space-y-6">
                {/* Detail Header */}
                <div className="border-b border-slate-900/60 pb-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${getStatusBadgeClass(selectedPrediction.status)}`}>
                      {selectedPrediction.status}
                    </span>
                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-500">Prediction Confidence</span>
                      <div className="text-2xl font-black font-mono text-slate-200">{Math.round(selectedPrediction.confidence * 100)}%</div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-200 tracking-tight">{selectedPrediction.title}</h2>
                    <p className="text-xs font-mono text-slate-400 mt-1">Context Target: {selectedPrediction.technology_context || 'N/A'}</p>
                  </div>
                </div>

                {/* Hypothesis Block */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">Hypothesis Text</h3>
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-900/60 text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-line italic">
                    "{selectedPrediction.hypothesis}"
                  </div>
                </div>

                {/* Confidence Timeline Chart */}
                {timelineData.length > 1 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">Confidence Timeline</h3>
                    <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-900/60 h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="timestamp" stroke="#64748b" fontSize={9} tickLine={false} />
                          <YAxis domain={[0, 1]} stroke="#64748b" fontSize={9} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                            labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                            itemStyle={{ fontSize: 10 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="confidence"
                            name="Confidence"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: '#8b5cf6', strokeWidth: 1 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Evidence For / Against Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Evidence For */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Evidence For ({selectedPrediction.evidence_for?.length || 0})</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedPrediction.evidence_for?.length > 0 ? (
                        selectedPrediction.evidence_for.map((ev: string, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-slate-300">
                            {ev}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-600 font-mono italic">No evidence for recorded yet.</div>
                      )}
                    </div>
                  </div>

                  {/* Evidence Against */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                      <svg className="h-3.5 w-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Evidence Against ({selectedPrediction.evidence_against?.length || 0})</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedPrediction.evidence_against?.length > 0 ? (
                        selectedPrediction.evidence_against.map((ev: string, idx: number) => (
                          <div key={idx} className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 text-xs text-slate-300">
                            {ev}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-600 font-mono italic">No evidence against recorded yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Related Nodes */}
                {selectedPrediction.related_nodes?.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-900/60">
                    <h3 className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">Related Knowledge Entities</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPrediction.related_nodes.slice(0, 8).map((nodeId: string, idx: number) => (
                        <Link
                          key={nodeId}
                          href={`/explore/${nodeId}`}
                          className="px-2.5 py-1 rounded-full text-xs font-mono border border-slate-800 bg-slate-950 text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-all duration-150"
                        >
                          Entity #{nodeId.slice(0, 8)}
                        </Link>
                      ))}
                      {selectedPrediction.related_nodes.length > 8 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono text-slate-500">
                          + {selectedPrediction.related_nodes.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates Footer */}
                <div className="pt-4 mt-4 border-t border-slate-900/40 flex flex-wrap justify-between text-[10px] text-slate-500 font-mono gap-2">
                  <span>Created: {formatDate(selectedPrediction.created_at)}</span>
                  {selectedPrediction.resolved_at && (
                    <span>Resolved: {formatDate(selectedPrediction.resolved_at)}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center border border-dashed border-slate-900 rounded-2xl bg-slate-900/5 text-slate-500 text-xs font-mono">
                Select a prediction on the left to explore details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
