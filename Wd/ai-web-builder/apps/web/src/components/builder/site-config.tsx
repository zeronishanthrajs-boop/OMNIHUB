'use client'

import { Input, Select, Switch } from '@awb/ui'
import type { SiteConfig, SiteType } from '@awb/core'
import { SITE_TYPES } from '@awb/core'

interface SiteConfigFormProps {
  config: SiteConfig
  onChange: (config: SiteConfig) => void
}

const frameworks = [
  { label: 'Next.js 15 (App Router)', value: 'nextjs' },
  { label: 'React 19 (Vite SPA)', value: 'react' },
  { label: 'Astro 5 (Content & Islands)', value: 'astro' },
  { label: 'Static HTML + Tailwind', value: 'static' },
]

const stylings = [
  { label: 'Tailwind CSS v4', value: 'tailwind' },
  { label: 'CSS Modules', value: 'css-modules' },
  { label: 'Styled Components', value: 'styled' },
  { label: 'Vanilla CSS', value: 'vanilla' },
]

const colorSchemes = [
  { label: 'Indigo', value: 'indigo' }, { label: 'Blue', value: 'blue' },
  { label: 'Emerald', value: 'emerald' }, { label: 'Amber', value: 'amber' },
  { label: 'Rose', value: 'rose' }, { label: 'Violet', value: 'violet' },
  { label: 'Slate', value: 'slate' }, { label: 'Cyan', value: 'cyan' },
]

const typographyOptions = [
  { label: 'Inter (Modern Sans)', value: 'inter' },
  { label: 'Plus Jakarta Sans (Geometric)', value: 'plus-jakarta-sans' },
  { label: 'Literata (Editorial Serif)', value: 'literata' },
  { label: 'Satoshi (Neo-Grotesque)', value: 'satoshi' },
]

const siteTypes = SITE_TYPES.map(t => ({
  label: t.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  value: t,
}))

export function SiteConfigForm({ config, onChange }: SiteConfigFormProps) {
  const update = (partial: Partial<SiteConfig>) => onChange({ ...config, ...partial })

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Identity Card */}
      <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Identity & Project Basics</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Project / Site Name"
            value={config.name}
            onChange={e => update({ name: e.target.value })}
            className="bg-zinc-950 border-white/10 text-xs"
          />
          <Select
            label="Website Type"
            options={siteTypes}
            value={config.type}
            onChange={e => update({ type: e.target.value as SiteType })}
            className="bg-zinc-950 border-white/10 text-xs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-300 block mb-1.5">Description & Purpose</label>
          <textarea
            value={config.description}
            onChange={e => update({ description: e.target.value })}
            rows={2}
            placeholder="A brief summary of what this website aims to accomplish..."
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none font-sans"
          />
        </div>
      </div>

      {/* Tech Stack & Design System Card */}
      <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Tech Stack & Visual Identity</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Frontend Framework"
            options={frameworks}
            value={config.framework}
            onChange={e => update({ framework: e.target.value })}
            className="bg-zinc-950 border-white/10 text-xs"
          />
          <Select
            label="Styling Solution"
            options={stylings}
            value={config.styling}
            onChange={e => update({ styling: e.target.value })}
            className="bg-zinc-950 border-white/10 text-xs"
          />
          <Select
            label="Color Palette Accent"
            options={colorSchemes}
            value={config.colorScheme}
            onChange={e => update({ colorScheme: e.target.value })}
            className="bg-zinc-950 border-white/10 text-xs"
          />
          <Select
            label="Typography Pair"
            options={typographyOptions}
            value={config.typography}
            onChange={e => update({ typography: e.target.value })}
            className="bg-zinc-950 border-white/10 text-xs"
          />
        </div>
      </div>

      {/* Pages & Navigation Architecture */}
      <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Site Pages & Routes (one per line)</span>
        </h3>
        <textarea
          value={config.pages.join('\n')}
          onChange={e => update({ pages: e.target.value.split('\n').filter(Boolean) })}
          rows={3}
          placeholder="home&#10;features&#10;pricing&#10;contact"
          className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500/50 resize-none"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          {config.pages.map(page => (
            <span key={page} className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
              /{page}
            </span>
          ))}
        </div>
      </div>

      {/* Features & Capabilities Toggles */}
      <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/70 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>Built-In Features & Capabilities</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/60 flex items-center justify-between">
            <Switch label="SEO Meta Tags" checked={config.seo} onCheckedChange={v => update({ seo: v })} />
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/60 flex items-center justify-between">
            <Switch label="Analytics Pipeline" checked={config.analytics} onCheckedChange={v => update({ analytics: v })} />
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/60 flex items-center justify-between">
            <Switch label="Contact Forms" checked={config.forms} onCheckedChange={v => update({ forms: v })} />
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/60 flex items-center justify-between">
            <Switch label="Markdown Blog" checked={config.blog} onCheckedChange={v => update({ blog: v })} />
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/60 flex items-center justify-between">
            <Switch label="Dark Mode Support" checked={config.darkMode} onCheckedChange={v => update({ darkMode: v })} />
          </div>
          <div className="p-3 rounded-xl border border-white/5 bg-zinc-950/60 flex items-center justify-between">
            <Switch label="Multilingual (i18n)" checked={config.multilingual} onCheckedChange={v => update({ multilingual: v })} />
          </div>
        </div>
      </div>
    </div>
  )
}
