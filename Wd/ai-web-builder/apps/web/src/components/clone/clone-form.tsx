'use client'

import { useState, useCallback } from 'react'
import { Card } from '@awb/ui'
import {
  cloneSite, buildPromptContext,
  type CloneRequest, type CloneResult, type CloneProgress,
} from '@awb/core'

interface CloneFormProps {
  onCloneResult: (result: CloneResult, context: string) => void
  onSwitchToBuild: (prompt: string) => void
}

export function CloneForm({ onCloneResult, onSwitchToBuild }: CloneFormProps) {
  const [url, setUrl] = useState('')
  const [depth, setDepth] = useState(0)
  const [maxPages, setMaxPages] = useState(5)
  const [includeAssets, setIncludeAssets] = useState(false)
  const [sameDomain, setSameDomain] = useState(true)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<CloneProgress[]>([])
  const [result, setResult] = useState<CloneResult | null>(null)
  const [error, setError] = useState('')

  const handleClone = useCallback(async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    setProgress([])
    setResult(null)

    const request: CloneRequest = {
      url: url.trim(),
      mode: 'ai',
      depth,
      includeAssets,
      sameDomain,
      maxPages,
    }

    try {
      const res = await cloneSite(request, (p) => {
        setProgress(prev => [...prev, p])
      })
      setResult(res)
      const context = buildPromptContext(res)
      onCloneResult(res, context)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [url, depth, maxPages, includeAssets, sameDomain, onCloneResult])

  const handleGenerateFromClone = () => {
    if (!result) return
    const context = buildPromptContext(result)
    const promptText = `Create a website inspired by ${result.title || result.url}.\n\nReplicate its visual style, layout, and page structure, but with original content for my project.\n\nOriginal site: ${result.url}`
    onSwitchToBuild(promptText)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1 text-zinc-100 flex items-center gap-2">
          <span>Website Cloner & Architecture Synthesizer</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Enter any live URL. Our BFS crawler analyzes page structure, navigation, and typography patterns to feed as reference context into the AI.
        </p>
      </div>

      <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-2xl space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-zinc-300">
            Target URL to Inspect
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-zinc-500 text-sm">🌐</span>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-white/10 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono"
              onKeyDown={e => e.key === 'Enter' && handleClone()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Crawl Depth</label>
            <select
              value={depth}
              onChange={e => setDepth(Number(e.target.value))}
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value={0}>Single Page (Fastest)</option>
              <option value={1}>1 Level Deep (Internal Links)</option>
              <option value={2}>2 Levels Deep (Comprehensive)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Max Pages Cap</label>
            <input
              type="number"
              min={1}
              max={50}
              value={maxPages}
              onChange={e => setMaxPages(Number(e.target.value))}
              disabled={loading}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameDomain}
                onChange={e => setSameDomain(e.target.checked)}
                disabled={loading}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-zinc-300">Same domain only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAssets}
                onChange={e => setIncludeAssets(e.target.checked)}
                disabled={loading}
                className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-zinc-300">Extract image references</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/5">
          <span className="text-xs text-zinc-500">Non-invasive extraction • Pure structural reference</span>
          <button
            onClick={handleClone}
            disabled={loading || !url.trim()}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-lg ${
              loading
                ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed border border-indigo-500/30'
                : !url.trim()
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25 border border-indigo-400/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Crawling Website...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>Analyze & Clone</span>
              </>
            )}
          </button>
        </div>
      </div>

      {progress.length > 0 && (
        <div className="p-4 rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold uppercase tracking-wider pb-1 border-b border-white/5">
            <span>Crawler Activity Log</span>
            <span className="font-mono text-indigo-400">{progress.length} events</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-xs">
            {progress.map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                {p.type === 'fetching' && (
                  <span className="text-amber-400">⟳ Fetching {p.url}</span>
                )}
                {p.type === 'parsed' && (
                  <span className="text-emerald-400">✓ Parsed {p.url}</span>
                )}
                {p.message && (
                  <span className="text-red-400">✗ {p.message}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 shadow-lg">
          <span className="text-red-400 text-base">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="p-6 rounded-2xl border border-indigo-500/30 bg-zinc-900/70 backdrop-blur-xl shadow-2xl space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-zinc-100 flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>Extraction Complete: {result.title || result.url}</span>
            </h3>
            <span className="text-xs text-zinc-500 font-mono">{(result.duration / 1000).toFixed(1)}s elapsed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/80">
              <div className="text-2xl font-black text-indigo-400 font-mono">{result.pages.length}</div>
              <div className="text-xs text-zinc-400 mt-0.5">Pages Discovered</div>
            </div>
            <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/80">
              <div className="text-2xl font-black text-violet-400 font-mono">{result.pages[0]?.images.length || 0}</div>
              <div className="text-xs text-zinc-400 mt-0.5">Images Cataloged</div>
            </div>
            <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/80">
              <div className="text-2xl font-black text-cyan-400 font-mono">{result.pages[0]?.cssFiles.length || 0}</div>
              <div className="text-xs text-zinc-400 mt-0.5">Stylesheets</div>
            </div>
            <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/80">
              <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-zinc-400 mt-0.5">Context Ready</div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pages Structure</h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {result.pages.slice(0, 10).map((page, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs py-1 px-2.5 rounded-lg bg-zinc-950 border border-white/5">
                  <span className="text-indigo-400 font-mono text-[10px] w-4">L{page.depth}</span>
                  <span className="text-zinc-200 font-medium truncate">{page.title || page.url}</span>
                  <span className="text-zinc-500 font-mono text-[11px] truncate ml-auto hidden sm:inline">{page.url}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={handleGenerateFromClone}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/20"
            >
              <span>Switch to Builder with this Context</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
