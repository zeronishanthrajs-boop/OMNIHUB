'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Legend,
} from 'recharts';

const PATTERN_COLORS: Record<string, string> = {
  exploit:      '#f43f5e',
  zero_day:     '#fb923c',
  ransomware:   '#facc15',
  phishing:     '#a78bfa',
  apt:          '#38bdf8',
  cloud:        '#34d399',
  auth:         '#60a5fa',
  supply_chain: '#f472b6',
  firmware:     '#e879f9',
  ai_model:     '#4ade80',
  general:      '#94a3b8',
};

const STATUS_COLOR: Record<string, string> = {
  confirmed:  '#4ade80',
  partial:    '#facc15',
  pending:    '#94a3b8',
  disproven:  '#f43f5e',
};

function StatCard({ label, value, sub, color = '#a78bfa' }: {
  label: string; value: string | number | null; sub?: string; color?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 12, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1.1 }}>
        {value === null || value === undefined ? '—' : value}
      </span>
      {sub && <span style={{ fontSize: 12, color: '#64748b' }}>{sub}</span>}
    </div>
  );
}

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{typeof p.value === 'number' ? (p.value * 100).toFixed(1) + '%' : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function IntelligencePage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/intelligence')
      .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pct = (v: number | null) =>
    v === null || v === undefined ? '—' : `${(v * 100).toFixed(1)}%`;

  const fmtDate = (s: string | null) => {
    if (!s) return '—';
    try { return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return s; }
  };

  const topPatterns = (data?.pattern_rates || []).slice(0, 5);
  const predStatus  = data?.prediction_status || {};
  const statusPie   = Object.entries(predStatus).map(([k, v]) => ({ name: k, value: v as number }));

  return (
    <div style={{ minHeight: '100vh', background: '#030712', color: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .section-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; }
        .glow-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px;
          border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; }
        .pattern-bar { transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(3,7,18,0.95)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 16, height: 60 }}>
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>← Home</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ fontWeight: 700, fontSize: 15, background: 'linear-gradient(90deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            System Intelligence
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>Phase 7 — Self-Improving AI</span>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Page title */}
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg,#a78bfa 0%,#38bdf8 60%,#4ade80 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>
            Intelligence Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            Model accuracy, pattern confirmation rates, confidence distribution, and learning loop metrics.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 80, color: '#475569' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #1e293b', borderTopColor: '#a78bfa', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Fetching intelligence data…
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 12, padding: 20, color: '#fb7185' }}>
            ⚠ {error}. Run <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>python scripts/learning_engine.py</code> to generate metrics.
          </div>
        )}

        {!loading && data && (
          <>
            {/* Stat cards row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 16 }}>
              <StatCard label="System Accuracy" value={pct(data.overall_accuracy)} color="#a78bfa"
                sub={data.accuracy_history.length ? `${data.accuracy_history.length} run(s) tracked` : 'No runs yet'} />
              <StatCard label="Model Version"   value={data.model_version ?? 'Baseline'} color="#38bdf8"
                sub={`Retrained: ${fmtDate(data.last_retrain)}`} />
              <StatCard label="Last Retrain Acc" value={pct(data.last_retrain_accuracy)} color="#4ade80"
                sub={data.retrain_history.length ? `${data.retrain_history.length} retrain(s)` : 'Not yet run'} />
              <StatCard label="Total Predictions" value={Object.values(predStatus).reduce((a: any, b: any) => a + b, 0) as number} color="#fb923c"
                sub={`${predStatus.confirmed ?? 0} confirmed`} />
              <StatCard label="Patterns Tracked" value={data.pattern_rates.length} color="#f472b6"
                sub="across all predictions" />
            </div>

            {/* Accuracy over time */}
            <div className="section-card">
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
                📈 System Accuracy Over Time
              </h2>
              {data.accuracy_history.length === 0 ? (
                <div style={{ color: '#475569', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
                  No accuracy history yet — run <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>learning_engine.py</code> on Friday to start tracking.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.accuracy_history} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => fmtDate(v)} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 1]} tickFormatter={v => `${(v*100).toFixed(0)}%`} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Line dataKey="accuracy" name="Accuracy" stroke="#a78bfa" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#a78bfa' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pattern confirmation rates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="section-card">
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
                  🎯 Pattern Confirmation Rates
                </h2>
                {data.pattern_rates.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>No pattern data yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.pattern_rates.map((p: any) => (
                      <div key={p.pattern}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: PATTERN_COLORS[p.pattern] || '#94a3b8', textTransform: 'capitalize' }}>
                            {p.pattern}
                          </span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            {pct(p.rate)} · {p.sample_size} pred
                          </span>
                        </div>
                        <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div className="pattern-bar" style={{
                            height: '100%', width: `${(p.rate || 0) * 100}%`,
                            background: PATTERN_COLORS[p.pattern] || '#a78bfa',
                            borderRadius: 4,
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prediction status pie */}
              <div className="section-card">
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
                  🔮 Prediction Status Breakdown
                </h2>
                {statusPie.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>No predictions yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}>
                        {statusPie.map((entry: any) => (
                          <Cell key={entry.name} fill={STATUS_COLOR[entry.name] || '#475569'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [v, 'Predictions']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Confidence distribution */}
            <div className="section-card">
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>
                📊 Node Confidence Distribution
              </h2>
              {data.confidence_distribution.every((b: any) => b.count === 0) ? (
                <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
                  No confidence data available yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.confidence_distribution} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="bucket" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" name="Nodes" radius={[6, 6, 0, 0]}>
                      {data.confidence_distribution.map((_: any, i: number) => (
                        <Cell key={i} fill={['#f43f5e','#fb923c','#facc15','#4ade80','#38bdf8'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top 5 patterns + model retrain history */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Top 5 accurate patterns */}
              <div className="section-card">
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>
                  🏆 Top 5 Most Accurate Patterns
                </h2>
                {topPatterns.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: 13 }}>No data yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {topPatterns.map((p: any, i: number) => (
                      <div key={p.pattern} style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px',
                      }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#334155', minWidth: 28 }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize', color: PATTERN_COLORS[p.pattern] || '#94a3b8' }}>
                            {p.pattern}
                          </div>
                          <div style={{ fontSize: 11, color: '#475569' }}>{p.sample_size} prediction(s)</div>
                        </div>
                        <span style={{
                          fontSize: 15, fontWeight: 700,
                          color: p.rate >= 0.7 ? '#4ade80' : p.rate >= 0.4 ? '#facc15' : '#f43f5e',
                        }}>
                          {pct(p.rate)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Model retrain history */}
              <div className="section-card">
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>
                  🔄 Model Retrain History
                </h2>
                {data.retrain_history.length === 0 ? (
                  <div style={{ color: '#475569', fontSize: 13 }}>
                    No retrains yet — runs every 1st of the month via <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>learn.yml</code>.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.retrain_history.map((r: any, i: number) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                        borderLeft: `3px solid ${r.result === 'accepted' ? '#4ade80' : '#f43f5e'}`,
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{r.version || 'unknown'}</div>
                          <div style={{ fontSize: 11, color: '#475569' }}>{fmtDate(r.date)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: r.result === 'accepted' ? '#4ade80' : '#f43f5e' }}>
                            {pct(r.accuracy)}
                          </div>
                          <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {r.result}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline schedule */}
            <div className="section-card" style={{ borderColor: 'rgba(167,139,250,0.2)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#e2e8f0' }}>
                ⚙️ Autonomous Learning Schedule
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
                {[
                  { job: 'learning_engine.py', schedule: 'Every Friday 05:00 UTC', desc: 'Accuracy scoring, pattern tracking, confidence updates', color: '#a78bfa' },
                  { job: 'model_updater.py',   schedule: '1st of every month 05:30 UTC', desc: 'Classifier retraining with confirmed predictions', color: '#38bdf8' },
                  { job: 'hypothesis_engine.py', schedule: 'Every Wednesday 06:00 UTC', desc: 'Generates new risk predictions from tech nodes', color: '#4ade80' },
                  { job: 'evidence_linker.py', schedule: 'Daily 07:00 UTC', desc: 'Validates predictions against incoming CVEs/incidents', color: '#fb923c' },
                ].map(j => (
                  <div key={j.job} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px',
                    borderLeft: `3px solid ${j.color}`,
                  }}>
                    <code style={{ fontSize: 12, color: j.color, display: 'block', marginBottom: 4 }}>{j.job}</code>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{j.schedule}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{j.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
