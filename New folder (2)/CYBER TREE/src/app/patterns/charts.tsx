'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ChartProps {
  typeData: { name: string; current: number; previous: number; growth: number }[];
  tagData: { name: string; current: number; previous: number; growth: number }[];
}

export default function PatternsCharts({ typeData, tagData }: ChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Node Type WoW Growth */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-slate-200 mb-4">Node Type WoW Growth (&gt;50%)</h3>
        {typeData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-mono">
            No active node type trends this week.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="current" name="Current Week" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Previous Week" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tag WoW Growth */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 backdrop-blur-sm">
        <h3 className="text-lg font-bold text-slate-200 mb-4">Tag WoW Growth (&gt;50%)</h3>
        {tagData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-mono">
            No active tag trends this week.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tagData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="current" name="Current Week" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Previous Week" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
