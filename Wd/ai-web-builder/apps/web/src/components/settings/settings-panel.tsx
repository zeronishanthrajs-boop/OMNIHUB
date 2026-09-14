'use client'

import { useState } from 'react'
import { ScrollArea, cn } from '@awb/ui'
import { DEFAULT_SETTINGS, type AppSettings, type SettingCategory } from '@awb/core'

interface SettingsPanelProps {
  onClose: () => void
}

const categories: { id: SettingCategory; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'providers', label: 'AI Providers', icon: '🔌' },
  { id: 'generation', label: 'Generation', icon: '▶️' },
  { id: 'layers', label: 'Layers', icon: '⊞' },
  { id: 'assets', label: 'Assets & Media', icon: '🖼️' },
  { id: 'editor', label: 'Code Editor', icon: '✎' },
  { id: 'export', label: 'Export & Deploy', icon: '📦' },
  { id: 'advanced', label: 'Advanced', icon: '⚡' },
]

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('general')
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  const updateSetting = (category: SettingCategory, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...(prev as any)[category], [key]: value },
    }))
  }

  const renderSetting = (category: SettingCategory, key: string, value: any) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

    if (typeof value === 'boolean') {
      return (
        <label key={key} className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors cursor-pointer">
          <span className="text-xs font-medium text-zinc-300">{label}</span>
          <button
            type="button"
            onClick={() => updateSetting(category, key, !value)}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              value ? 'bg-indigo-600' : 'bg-zinc-700',
            )}
          >
            <span
              className={cn(
                'inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform',
                value ? 'translate-x-4.5' : 'translate-x-1',
              )}
            />
          </button>
        </label>
      )
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return (
        <div key={key} className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-white/5 bg-zinc-900/40 gap-3">
          <span className="text-xs font-medium text-zinc-300 shrink-0">{label}</span>
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={value}
            onChange={e => updateSetting(category, key, typeof value === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-44 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 text-right focus:outline-none focus:border-indigo-500/50 font-mono"
          />
        </div>
      )
    }
    return null
  }

  const activeSettings = (settings as any)[activeCategory] || {}
  const activeCategoryLabel = categories.find(c => c.id === activeCategory)?.label || activeCategory

  return (
    <div className="w-full sm:w-[420px] border-l border-white/10 bg-zinc-950/90 backdrop-blur-2xl flex flex-col z-40 shadow-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
          <h2 className="font-semibold text-sm text-zinc-100">Preferences & Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Category Navigation */}
        <nav className="w-32 border-r border-white/5 p-2 space-y-1 bg-zinc-950/40">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2',
                activeCategory === cat.id
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent',
              )}
            >
              <span className="text-xs">{cat.icon}</span>
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </nav>

        {/* Setting Values */}
        <ScrollArea className="flex-1 p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              {activeCategoryLabel}
            </h3>
            <span className="text-[10px] text-zinc-500">Auto-saved</span>
          </div>
          <div className="space-y-2">
            {Object.entries(activeSettings).map(([key, value]) => renderSetting(activeCategory, key, value))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
