'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Stats {
  nodeCount: number;
  relationshipCount: number;
  newNodesCount: number;
  recentNodes: any[];
  recentJobs: any[];
  topNodes: any[];
  typeDistribution: any[];
}

interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'critical';
  critical_count: number;
  degraded_count: number;
  node_growth: { total: number; last_24h: number };
  workflows: Record<string, { status: string; last_run: string | null; schedule: string; ok: boolean; hours_since_run?: number }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NODE_TYPE_COLORS: Record<string, string> = {
  threat_actor:  'text-rose-400   bg-rose-500/10   border-rose-500/20',
  vulnerability: 'text-amber-400  bg-amber-500/10  border-amber-500/20',
  malware:       'text-red-400    bg-red-500/10    border-red-500/20',
  technique:     'text-violet-400 bg-violet-500/10 border-violet-500/20',
  incident:      'text-cyan-400   bg-cyan-500/10   border-cyan-500/20',
  weakness:      'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
  technology:    'text-slate-400  bg-slate-500/10  border-slate-500/20',
  research:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  news:          'text-blue-400    bg-blue-500/10    border-blue-500/20',
};

const BAR_COLORS = ['#8b5cf6','#f59e0b','#ef4444','#06b6d4','#a78bfa','#e879f9','#94a3b8'];

function ntc(t: string) { return NODE_TYPE_COLORS[t] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'; }

function fmtDate(d: string) {
  if (!d) return 'N/A';
  try { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch { return d; }
}

const QUICK_LINKS = [
  { href: '/search',       label: 'Intelligence Search',  icon: '🔍', color: 'border-violet-500/30 hover:border-violet-500/60' },
  { href: '/explore',      label: 'Knowledge Graph',       icon: '🕸️', color: 'border-blue-500/30 hover:border-blue-500/60' },
  { href: '/research',     label: 'AI Research Q&A',       icon: '🤖', color: 'border-fuchsia-500/30 hover:border-fuchsia-500/60' },
  { href: '/threats',      label: 'Threat Actors',         icon: '🎭', color: 'border-rose-500/30 hover:border-rose-500/60' },
  { href: '/predictions',  label: 'Hypothesis Explorer',   icon: '🔮', color: 'border-amber-500/30 hover:border-amber-500/60' },
  { href: '/patterns',     label: 'Pattern Intelligence',  icon: '📊', color: 'border-emerald-500/30 hover:border-emerald-500/60' },
  { href: '/intelligence', label: 'Model Intelligence',    icon: '🧠', color: 'border-cyan-500/30 hover:border-cyan-500/60' },
  { href: '/sources',      label: 'Source Registry',       icon: '📡', color: 'border-slate-500/30 hover:border-slate-500/60' },
  { href: '/timeline',     label: 'Incident Timeline',     icon: '📅', color: 'border-indigo-500/30 hover:border-indigo-500/60' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats]   = useState<any | null>(null);
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => {
        if (r.status === 401) return { error: 'AUTH_REQUIRED' };
        return r.json();
      }).catch(() => null),
      fetch('/api/system-health').then(r => {
        if (r.status === 401) return { error: 'AUTH_REQUIRED' };
        return r.json();
      }).catch(() => null),
    ]).then(([s, h]) => {
      if (s?.error === 'AUTH_REQUIRED' || h?.error === 'AUTH_REQUIRED') {
        router.push('/login');
        return;
      }
      setStats(s);
      setHealth(h);
      setLoading(false);
    });
  }, [router]);

  const healthColor =
    health?.overall_status === 'healthy'  ? 'text-emerald-400' :
    health?.overall_status === 'degraded' ? 'text-amber-400'   :
    health?.overall_status === 'critical' ? 'text-red-400'      :
    'text-slate-400';

  const healthDot =
    health?.overall_status === 'healthy'  ? 'bg-emerald-500' :
    health?.overall_status === 'degraded' ? 'bg-amber-500'   :
    health?.overall_status === 'critical' ? 'bg-red-500'      :
    'bg-slate-500';

  // Build type distribution chart data
  const typeData = (stats?.typeDistribution || [])
    .map((t: any) => ({ name: (t.type || t.node_type || '').replace('_',' '), count: t.count || 0 }))
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 7);

  // Synthesize dummy growth sparkline from nodeCount (since we don't have per-day history here)
  const growthData = stats ? [
    { day: '-7d', nodes: Math.max(0, stats.nodeCount - stats.newNodesCount * 7) },
    { day: '-6d', nodes: Math.max(0, stats.nodeCount - stats.newNodesCount * 6) },
    { day: '-5d', nodes: Math.max(0, stats.nodeCount - stats.newNodesCount * 5) },
    { day: '-4d', nodes: Math.max(0, stats.nodeCount - stats.newNodesCount * 4) },
    { day: '-3d', nodes: Math.max(0, stats.nodeCount - stats.newNodesCount * 3) },
    { day: '-2d', nodes: Math.max(0, stats.nodeCount - stats.newNodesCount * 2) },
    { day: '-1d', nodes: Math.max(0, stats.nodeCount - stats.newNodesCount) },
    { day: 'Now', nodes: stats.nodeCount },
  ] : [];

  // Workflow health summary
  const workflowList = (health && health.workflows && typeof health.workflows === 'object')
    ? Object.entries(health.workflows).map(([name, w]: [string, any]) => ({ name, ...w }))
    : [];
  const okCount   = workflowList.filter(w => w.ok).length;
  const failCount = workflowList.filter(w => !w.ok).length;

  return (
    <div className="space-y-8">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400">
            Intelligence Command Center
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-xl">
            CYBER TREE — autonomous threat intelligence platform. Continuously collecting, processing, connecting, and analysing cybersecurity knowledge.
          </p>
        </div>
        {/* System health pill */}
        <a href="/api/system-health" target="_blank" rel="noopener noreferrer"
           className="flex items-center space-x-2 px-4 py-2 rounded-full bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all text-xs font-mono shrink-0">
          <span className={`h-2 w-2 rounded-full animate-pulse ${healthDot}`} />
          <span className={`font-bold uppercase ${healthColor}`}>
            {loading ? 'CHECKING...' : (health?.overall_status || 'UNKNOWN')}
          </span>
          <span className="text-slate-500">
            {!loading && health && `${okCount}/${workflowList.length} OK`}
          </span>
        </a>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: 'Knowledge Entities',   
            value: (stats && !stats.error) ? stats.nodeCount?.toLocaleString() : loading ? '…' : 'N/A', 
            accent: 'violet',  
            sub: (stats && !stats.error) ? 'indexed nodes' : loading ? 'retrieving counts...' : 'Service Offline' 
          },
          { 
            label: 'Relationships',         
            value: (stats && !stats.error) ? stats.relationshipCount?.toLocaleString() : loading ? '…' : 'N/A', 
            accent: 'blue',    
            sub: (stats && !stats.error) ? 'established links' : loading ? 'retrieving relations...' : 'Service Offline' 
          },
          { 
            label: 'Velocity (24h)',        
            value: (stats && !stats.error) ? `+${stats.newNodesCount?.toLocaleString()}` : loading ? '…' : 'N/A', 
            accent: 'emerald', 
            sub: (stats && !stats.error) ? 'nodes today' : loading ? 'calculating activity...' : 'Service Offline' 
          },
          { 
            label: 'Workflows',             
            value: loading ? '…' : (health && !health.error) ? `${okCount}/${workflowList.length}` : 'N/A', 
            accent: health?.overall_status === 'healthy' ? 'emerald' : health?.overall_status === 'degraded' ? 'amber' : 'red', 
            sub: (health && !health.error) ? 'pipelines active' : loading ? 'probing systems...' : 'Health Monitor Offline' 
          },
        ].map(({ label, value, accent, sub }) => (
          <div key={label}
               className={`p-5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/80 hover:border-${accent}-500/30 transition-all duration-300 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${accent}-500/5 rounded-full blur-2xl group-hover:bg-${accent}-500/10 transition-all`} />
            <p className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">{label}</p>
            <p className={`mt-3 text-3xl font-black tracking-tight text-${accent}-400`}>{value}</p>
            <p className="mt-1 text-[10px] text-slate-500 font-mono">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Knowledge growth sparkline */}
        <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-3">
          <h2 className="text-sm font-bold tracking-tight text-slate-200">Knowledge Growth (7 days)</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-500 text-xs font-mono animate-pulse">Loading chart…</div>
          ) : (!stats || stats.error) ? (
            <div className="h-40 flex items-center justify-center text-rose-400 text-xs font-mono border border-dashed border-rose-500/20 rounded-xl bg-rose-500/5">Failed to load growth trend chart</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={growthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#a78bfa' }}
                />
                <Line type="monotone" dataKey="nodes" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Node type distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-3">
          <h2 className="text-sm font-bold tracking-tight text-slate-200">Knowledge Breakdown by Type</h2>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-slate-500 text-xs font-mono animate-pulse">Loading chart…</div>
          ) : (!stats || stats.error) ? (
            <div className="h-40 flex items-center justify-center text-rose-400 text-xs font-mono border border-dashed border-rose-500/20 rounded-xl bg-rose-500/5">Failed to load type distribution chart</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={typeData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {typeData.map((_: any, i: number) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Main content grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent ingestions */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">Recent Ingestions</h2>
              <Link href="/search" className="text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors">VIEW ALL →</Link>
            </div>
            <div className="divide-y divide-slate-900/60">
              {loading ? (
                <p className="text-xs text-slate-500 py-4 font-mono animate-pulse">Loading…</p>
              ) : (stats?.recentNodes || []).length === 0 ? (
                <p className="text-sm text-slate-500 py-4 font-mono">No nodes indexed yet.</p>
              ) : (stats?.recentNodes || []).map((node: any) => (
                <div key={node.id} className="py-3 flex items-center justify-between group">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${ntc(node.node_type)}`}>
                      {(node.node_type || '').replace('_',' ')}
                    </span>
                    <Link href={`/explore/${node.id}`} className="text-sm font-medium text-slate-200 truncate group-hover:text-white group-hover:underline transition-all">
                      {node.title}
                    </Link>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">{fmtDate(node.created_at)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* High density nodes */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-4">
            <h2 className="text-base font-bold tracking-tight">High-Density Intelligence Nodes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loading ? (
                <p className="text-xs text-slate-500 font-mono animate-pulse">Loading…</p>
              ) : (stats?.topNodes || []).map((node: any) => (
                <Link key={node.id} href={`/explore/${node.id}`}
                      className="p-4 rounded-xl bg-slate-950/40 border border-slate-900/80 hover:border-slate-700 hover:bg-slate-900/20 flex items-center justify-between transition-all group">
                  <div className="min-w-0 pr-2">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">{(node.node_type || '').replace('_',' ')}</p>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-white truncate mt-0.5">{node.title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-mono text-slate-500">LINKS</p>
                    <p className="text-base font-black text-violet-400 font-mono mt-0.5">{node.connections || '—'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-6">
          {/* System / workflow health */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">Pipeline Health</h2>
              <a href="/api/system-health" target="_blank" rel="noopener noreferrer"
                 className="text-[10px] font-mono text-slate-500 hover:text-violet-400 transition-colors">RAW JSON ↗</a>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {loading ? (
                <p className="text-xs text-slate-500 font-mono animate-pulse">Checking pipelines…</p>
              ) : workflowList.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono">No job logs found.</p>
              ) : workflowList.map((w) => (
                <div key={w.name} className="flex items-center justify-between py-1.5 border-b border-slate-900/60 last:border-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${w.ok ? 'bg-emerald-500' : w.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="text-[11px] font-mono text-slate-300 truncate">{w.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={`text-[10px] font-mono font-bold ${w.ok ? 'text-emerald-400' : w.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>
                      {(w.status || 'unknown').toUpperCase()}
                    </span>
                    {w.last_run && (
                      <p className="text-[9px] text-slate-600 font-mono">{fmtDate(w.last_run)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline cron log */}
          <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-4">
            <h2 className="text-base font-bold tracking-tight">Recent Job Runs</h2>
            <div className="space-y-2">
              {loading ? (
                <p className="text-xs text-slate-500 font-mono animate-pulse">Loading…</p>
              ) : (stats?.recentJobs || []).slice(0, 5).map((job: any) => (
                <div key={job.id} className="p-3 rounded-lg bg-slate-950/50 border border-slate-900/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold font-mono text-slate-300 uppercase">{job.job_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      job.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      job.status === 'failed'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>{(job.status || '').toUpperCase()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-mono">{fmtDate(job.started_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Access grid ──────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-slate-900/20 border border-slate-900/80 space-y-4">
        <h2 className="text-base font-bold tracking-tight">Quick Access</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3">
          {QUICK_LINKS.map(({ href, label, icon, color }) => (
            <Link key={href} href={href}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/40 border ${color} transition-all hover:bg-slate-900/30 group text-center`}>
              <span className="text-2xl">{icon}</span>
              <span className="mt-2 text-[10px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
