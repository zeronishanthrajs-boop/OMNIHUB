'use client'

import { APP_VERSION } from '@awb/config'
import { globalProviderRegistry } from '@awb/core'
import { useEffect, useState } from 'react'

interface HeaderProps {
  providerId: string
  onProviderChange: (id: string) => void
  model: string
  onModelChange: (model: string) => void
  onSettingsClick: () => void
}

export function BuilderHeader({ providerId, onProviderChange, model, onModelChange, onSettingsClick }: HeaderProps) {
  const [providers, setProviders] = useState(() => globalProviderRegistry.getAll())
  const [models, setModels] = useState<string[]>([])

  useEffect(() => {
    setProviders(globalProviderRegistry.getAll())
  }, [])

  useEffect(() => {
    const p = globalProviderRegistry.get(providerId)
    if (p) {
      p.listModels().then(availableModels => {
        setModels(availableModels)
        if (availableModels.length > 0 && !model) {
          onModelChange(availableModels[0])
        }
      }).catch(() => {
        setModels(p.config.models)
        if (p.config.models.length > 0 && !model) {
          onModelChange(p.config.models[0])
        }
      })
    }
  }, [providerId])

  const currentProvider = providers.find(p => p.config.id === providerId)

  return (
    <header className="h-14 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl flex items-center justify-between px-6 z-20 select-none">
      {/* Left: Engine & Model Pickers */}
      <div className="flex items-center gap-3">
        {/* Provider Selector */}
        <div className="flex items-center bg-zinc-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 gap-2 shadow-inner focus-within:border-indigo-500/50 transition-colors">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Engine</span>
          </div>
          <select
            value={providerId}
            onChange={e => onProviderChange(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-100 outline-none cursor-pointer pr-1"
          >
            {providers.map(p => (
              <option key={p.config.id} value={p.config.id} className="bg-zinc-900 text-zinc-200">
                {p.config.name} {p.config.local ? '⚡ (Local)' : '☁'}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selector */}
        <div className="flex items-center bg-zinc-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 gap-2 shadow-inner focus-within:border-indigo-500/50 transition-colors">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Model</span>
          </div>
          <select
            value={model}
            onChange={e => onModelChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-zinc-200 outline-none cursor-pointer max-w-[200px] truncate pr-1"
          >
            <option value="" className="bg-zinc-900 text-zinc-400">Auto Default</option>
            {models.map(m => (
              <option key={m} value={m} className="bg-zinc-900 text-zinc-200">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Engine Status Tag */}
        {currentProvider?.config.local && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Local Offline Inference</span>
          </div>
        )}
      </div>

      {/* Right: Actions & Settings */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] font-mono text-zinc-400">
          <span>AWB</span>
          <span className="text-zinc-600">•</span>
          <span className="text-indigo-400 font-semibold">v{APP_VERSION}</span>
        </div>

        <button
          onClick={onSettingsClick}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800/90 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </header>
  )
}
