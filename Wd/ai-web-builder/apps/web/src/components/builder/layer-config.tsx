'use client'

import { Switch, Badge, cn } from '@awb/ui'
import { getLayerDefinitionsByCategory } from '@awb/core'
import type { LayerConfig } from '@awb/core'

interface LayerConfigPanelProps {
  layers: LayerConfig[]
  onChange: (layers: LayerConfig[]) => void
}

const categoryLabels: Record<string, { label: string; icon: string }> = {
  presentation: { label: 'Presentation & UI', icon: '🎨' },
  backend: { label: 'Backend & APIs', icon: '⚙️' },
  data: { label: 'Data & Storage', icon: '💾' },
  security: { label: 'Security & Auth', icon: '🛡️' },
  ops: { label: 'Operations & Deployment', icon: '🚀' },
  performance: { label: 'Performance & Scaling', icon: '⚡' },
  observability: { label: 'Observability & Monitoring', icon: '📊' },
}

export function LayerConfigPanel({ layers, onChange }: LayerConfigPanelProps) {
  const byCategory = getLayerDefinitionsByCategory()

  const toggleLayer = (id: string) => {
    onChange(layers.map(l => l.id === id ? { ...l, enabled: !l.enabled, status: !l.enabled ? 'configured' as const : 'skipped' as const } : l))
  }

  const updateOption = (layerId: string, key: string, value: any) => {
    onChange(layers.map(l => l.id === layerId ? { ...l, options: { ...l.options, [key]: value } } : l))
  }

  // Presets
  const applyPreset = (mode: 'all' | 'minimal' | 'api' | 'fullstack') => {
    if (mode === 'all' || mode === 'fullstack') {
      onChange(layers.map(l => ({ ...l, enabled: true, status: 'configured' as const })))
    } else if (mode === 'minimal') {
      const allowed = ['frontend', 'deployment', 'security']
      onChange(layers.map(l => ({
        ...l,
        enabled: allowed.includes(l.id) || l.id === 'frontend',
        status: (allowed.includes(l.id) || l.id === 'frontend') ? 'configured' as const : 'skipped' as const,
      })))
    } else if (mode === 'api') {
      const allowed = ['frontend', 'api', 'database', 'auth', 'ratelimit', 'security']
      onChange(layers.map(l => ({
        ...l,
        enabled: allowed.includes(l.id),
        status: allowed.includes(l.id) ? 'configured' as const : 'skipped' as const,
      })))
    }
  }

  const enabledCount = layers.filter(l => l.enabled).length

  return (
    <div className="space-y-6">
      {/* Top Architecture Summary & Presets */}
      <div className="p-5 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur-xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">Production Architecture Stack</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 font-mono font-medium border border-indigo-500/30">
              {enabledCount} of {layers.length} Layers Active
            </span>
          </div>
          <p className="text-xs text-zinc-400">Toggle individual modules or load an optimized blueprint below.</p>
        </div>

        {/* Preset quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 mr-1">Presets:</span>
          <button
            onClick={() => applyPreset('fullstack')}
            className="text-xs px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            Full-Stack (All 13)
          </button>
          <button
            onClick={() => applyPreset('api')}
            className="text-xs px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            SaaS + DB + Auth
          </button>
          <button
            onClick={() => applyPreset('minimal')}
            className="text-xs px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all shadow-sm"
          >
            Lightweight Static
          </button>
        </div>
      </div>

      {/* Layer Groups by Category */}
      {Object.entries(byCategory).map(([category, defs]) => {
        const catMeta = categoryLabels[category] || { label: category, icon: '📦' }
        const catLayers = defs.map(def => layers.find(l => l.id === def.id)).filter(Boolean)
        const catEnabled = catLayers.filter(l => l?.enabled).length

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <span>{catMeta.icon}</span>
                <span>{catMeta.label}</span>
              </h3>
              <span className="text-[11px] text-zinc-500 font-mono">
                {catEnabled} / {defs.length} active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {defs.map(def => {
                const layer = layers.find(l => l.id === def.id)
                if (!layer) return null
                return (
                  <div
                    key={def.id}
                    className={cn(
                      'rounded-2xl border p-4 transition-all duration-200 backdrop-blur-xl',
                      layer.enabled
                        ? 'border-indigo-500/30 bg-zinc-900/70 shadow-lg shadow-indigo-500/5'
                        : 'border-white/5 bg-zinc-950/40 opacity-60 hover:opacity-80',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center text-base border shrink-0',
                          layer.enabled
                            ? 'border-indigo-500/30 bg-indigo-600/15 text-indigo-300'
                            : 'border-white/5 bg-zinc-900 text-zinc-600',
                        )}>
                          {def.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm text-zinc-100">{def.name}</h4>
                            {def.required && (
                              <Badge variant="info" className="text-[10px] px-2 py-0.5">Required</Badge>
                            )}
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              layer.enabled
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-500',
                            )}>
                              {layer.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{def.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={layer.enabled}
                        onCheckedChange={() => toggleLayer(def.id)}
                        disabled={def.required}
                      />
                    </div>

                    {/* Options Grid */}
                    {layer.enabled && Object.keys(def.defaultOptions).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 ml-12">
                        {Object.entries(def.defaultOptions).map(([key, defaultValue]) => {
                          const value = layer.options[key] ?? defaultValue
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

                          if (typeof value === 'boolean') {
                            return (
                              <label key={key} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={value}
                                  onChange={e => updateOption(def.id, key, e.target.checked)}
                                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{label}</span>
                              </label>
                            )
                          }
                          if (typeof value === 'number') {
                            return (
                              <label key={key} className="flex items-center gap-2 text-xs text-zinc-300">
                                <span className="text-zinc-400 shrink-0">{label}:</span>
                                <input
                                  type="number"
                                  value={value}
                                  onChange={e => updateOption(def.id, key, Number(e.target.value))}
                                  className="w-20 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 text-right focus:outline-none focus:border-indigo-500/50"
                                />
                              </label>
                            )
                          }
                          if (typeof value === 'string') {
                            return (
                              <label key={key} className="flex items-center gap-2 text-xs text-zinc-300">
                                <span className="text-zinc-400 shrink-0">{label}:</span>
                                <input
                                  type="text"
                                  value={value}
                                  onChange={e => updateOption(def.id, key, e.target.value)}
                                  className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                                />
                              </label>
                            )
                          }
                          return null
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
