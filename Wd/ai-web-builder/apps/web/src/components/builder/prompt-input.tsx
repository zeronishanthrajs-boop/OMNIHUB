'use client'

import { useState, useEffect } from 'react'
import type { SiteConfig } from '@awb/core'

interface PromptInputProps {
  value: string
  onChange: (val: string) => void
  siteConfig: SiteConfig
  loading: boolean
  onSubmit: () => void
}

const suggestions = [
  { label: 'AI SaaS Landing', prompt: 'A high-converting SaaS landing page for an AI productivity app with feature cards, interactive pricing tiers, customer testimonials, and an FAQ accordion.' },
  { label: 'Design Portfolio', prompt: 'A minimalist creative portfolio for a UI/UX designer showcasing selected case studies, interactive project gallery, about bio, and a sleek contact form.' },
  { label: 'E-Commerce Store', prompt: 'A modern e-commerce storefront for artisanal goods with product grid, category filters, cart modal, customer reviews, and responsive checkout layout.' },
  { label: 'API Documentation', prompt: 'Developer documentation site with sticky sidebar navigation, syntax-highlighted code blocks, endpoint tables, and dark mode toggle.' },
  { label: 'Agency Platform', prompt: 'A bold digital agency website featuring hero headline, service offerings, client logo marquee, case studies, and meeting scheduler.' },
]

const generationSteps = [
  { title: 'Deconstructing Prompt', desc: 'Analyzing layout, tone, and structural requirements' },
  { title: 'Configuring 13 Layers', desc: 'Wiring API routes, schema definitions, and security policies' },
  { title: 'Synthesizing Components', desc: 'Generating responsive Tailwind UI and interactive views' },
  { title: 'Assembling Files', desc: 'Packaging project hierarchy and dependency manifests' },
]

export function PromptInput({ value, onChange, siteConfig, loading, onSubmit }: PromptInputProps) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (!loading) {
      setCurrentStep(0)
      return
    }
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < generationSteps.length - 1 ? prev + 1 : prev))
    }, 15000)
    return () => clearInterval(interval)
  }, [loading])

  return (
    <div className="space-y-5">
      {/* Suggestion Chips */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 mr-1 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
              <path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" /><path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 7.76 2.83-2.83" />
            </svg>
            Inspiration:
          </span>
          {suggestions.map(s => (
            <button
              key={s.label}
              onClick={() => onChange(s.prompt)}
              className="text-xs px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white hover:border-indigo-500/40 transition-all shadow-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-white/5 text-[11px] text-zinc-400">
          <span>Target:</span>
          <span className="font-semibold text-indigo-300">{siteConfig.name}</span>
          <span className="text-zinc-600">•</span>
          <span className="capitalize text-zinc-400">{siteConfig.type}</span>
        </div>
      </div>

      {/* Main Glass Textarea Container */}
      <div className="relative rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-2xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all p-4">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Describe your website in detail... (e.g., 'A clean landing page for a modern fintech app with animated metrics, credit card comparison table, and customer reviews.')"
          rows={6}
          disabled={loading}
          className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed font-sans"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              if (!loading && value.trim()) onSubmit()
            }
          }}
        />

        {/* Action Bottom Bar */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <kbd className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
              ⌘ / Ctrl + ↵
            </kbd>
            <span className="hidden sm:inline">to generate</span>
          </div>

          <button
            onClick={onSubmit}
            disabled={!value.trim() || loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-lg ${
              loading
                ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed border border-indigo-500/30'
                : !value.trim()
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
                <span>Generating Website...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Generate Website</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Pipeline Steps During Generation */}
      {loading && (
        <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 backdrop-blur-xl animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
              </span>
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                Multi-Layer Generation in Progress
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Running local inference...</span>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {generationSteps.map((step, idx) => {
              const isPast = idx < currentStep
              const isCurrent = idx === currentStep
              return (
                <div
                  key={step.title}
                  className={`p-3 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-600/15 text-indigo-200 ring-1 ring-indigo-500/30'
                      : isPast
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                      : 'border-white/5 bg-zinc-900/40 text-zinc-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-medium mb-1">
                    {isPast ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                    )}
                    <span>{step.title}</span>
                  </div>
                  <p className="text-[10px] opacity-75 line-clamp-2">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
