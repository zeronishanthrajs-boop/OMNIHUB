'use client'

import { useState, useEffect } from 'react'
import { BuilderSidebar } from '@/components/layout/sidebar'
import { BuilderHeader } from '@/components/layout/header'
import { PromptInput } from '@/components/builder/prompt-input'
import { SiteConfigForm } from '@/components/builder/site-config'
import { LayerConfigPanel } from '@/components/builder/layer-config'
import { PreviewPane } from '@/components/preview/preview-pane'
import { FileExplorer } from '@/components/builder/file-explorer'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { CloneForm } from '@/components/clone/clone-form'
import { downloadProjectZip } from '@/lib/download-zip'
import {
  globalProviderRegistry, OllamaProvider, OpenAIProvider, AnthropicProvider,
  GeminiProvider, OpenRouterProvider, GroqProvider, DeepSeekProvider,
  MistralProvider, TogetherProvider, LlamaCppProvider,
  generateSite, starterTemplates, createDefaultLayerConfigs,
  type GenerationResult, type SiteConfig, type LayerConfig, type CloneResult,
} from '@awb/core'

// Register providers once at module load time so they are immediately available to all components
if (globalProviderRegistry.getAll().length === 0) {
  globalProviderRegistry.register(new OllamaProvider())
  globalProviderRegistry.register(new LlamaCppProvider())
  globalProviderRegistry.register(new OpenAIProvider())
  globalProviderRegistry.register(new AnthropicProvider())
  globalProviderRegistry.register(new GeminiProvider())
  globalProviderRegistry.register(new OpenRouterProvider())
  globalProviderRegistry.register(new GroqProvider())
  globalProviderRegistry.register(new DeepSeekProvider())
  globalProviderRegistry.register(new MistralProvider())
  globalProviderRegistry.register(new TogetherProvider())
}

type View = 'prompt' | 'config' | 'layers' | 'preview' | 'templates' | 'clone'

export default function Home() {
  const [view, setView] = useState<View>('templates')
  const [providerId, setProviderId] = useState('ollama')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState('')
  const [cloneResult, setCloneResult] = useState<CloneResult | null>(null)
  const [clonedContext, setClonedContext] = useState('')
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    name: 'My Website', description: '', type: 'landing-page',
    framework: 'nextjs', styling: 'tailwind',
    pages: ['home', 'features', 'pricing', 'faq', 'contact'],
    features: [], colorScheme: 'indigo', typography: 'inter',
    language: 'typescript', locale: 'en',
    seo: true, analytics: false, forms: true, blog: false, darkMode: true, multilingual: false,
  })
  const [layers, setLayers] = useState<LayerConfig[]>(createDefaultLayerConfigs())
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [isZipping, setIsZipping] = useState(false)

  const handleDownloadZip = async () => {
    if (!result?.files || result.files.length === 0 || isZipping) return
    try {
      setIsZipping(true)
      const name = siteConfig.name ? siteConfig.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'ai-website'
      await downloadProjectZip(result.files, name)
    } catch (err) {
      console.error('Failed to create ZIP archive:', err)
    } finally {
      setIsZipping(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true); setError(''); setResult(null)
    try {
      const res = await generateSite({ prompt, providerId, model: model || undefined, siteConfig, layers, temperature: 0.7, clonedContext: clonedContext || undefined })
      setResult(res); setView('preview')
    } catch (err: any) { setError(err.message) }
    finally { setGenerating(false) }
  }

  const handleSelectTemplate = (id: string) => {
    const tpl = starterTemplates.find(t => t.id === id)
    if (!tpl) return
    setSiteConfig(prev => ({ ...prev, name: tpl.name, description: tpl.description, type: tpl.type, pages: tpl.pages, features: tpl.features, colorScheme: tpl.colorScheme, typography: tpl.typography }))
    setView('prompt')
  }

  const handleCloneResult = (result: CloneResult, context: string) => {
    setCloneResult(result)
    setClonedContext(context)
  }

  const handleSwitchToBuild = (clonePrompt: string) => {
    setPrompt(clonePrompt)
    setView('prompt')
  }

  const sidebarNav: { id: View; label: string; icon: string }[] = [
    { id: 'templates', label: 'Templates', icon: 'layout' },
    { id: 'prompt', label: 'Build', icon: 'code' },
    { id: 'config', label: 'Config', icon: 'settings' },
    { id: 'layers', label: 'Layers', icon: 'layers' },
    { id: 'clone', label: 'Clone', icon: 'copy' },
    { id: 'preview', label: 'Preview', icon: 'eye' },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <BuilderSidebar nav={sidebarNav} activeView={view} onViewChange={setView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <BuilderHeader providerId={providerId} onProviderChange={setProviderId} model={model} onModelChange={setModel} onSettingsClick={() => setShowSettings(!showSettings)} />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {view === 'templates' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
              {/* Hero Banner */}
              <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-8 md:p-10 backdrop-blur-2xl shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

                <div className="relative z-10 max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                    <span>⚡ 13-Layer Full-Stack AI Studio</span>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                    Generate Production Websites in Seconds
                  </h1>
                  <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
                    Select a curated architectural blueprint below or start with a custom prompt. Powered by local-first sovereign AI models and 10+ providers.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => setView('prompt')}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-indigo-600/25 border border-indigo-400/30 hover:scale-[1.02]"
                    >
                      Start Blank Project ➔
                    </button>
                    <button
                      onClick={() => setView('clone')}
                      className="px-5 py-2.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-xs transition-all shadow-sm"
                    >
                      Clone Existing Site
                    </button>
                  </div>
                </div>
              </div>

              {/* Template Cards Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">Starter Blueprints</h2>
                    <p className="text-xs text-zinc-400">Pre-wired with optimal architecture layers, styling, and navigation structure.</p>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{starterTemplates.length} blueprints available</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {starterTemplates.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className="text-left p-6 rounded-2xl border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-indigo-500/40 backdrop-blur-xl transition-all group flex flex-col justify-between shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-indigo-300 font-medium capitalize">
                            {tpl.type}
                          </span>
                          <span className="text-xs text-zinc-500 group-hover:text-indigo-400 font-medium transition-colors">
                            Use Blueprint ➔
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-zinc-100 group-hover:text-indigo-300 transition-colors">
                          {tpl.name}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                          {tpl.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-5 pt-3 border-t border-white/5">
                        {tpl.features.slice(0, 3).map(f => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-950 border border-white/5 text-zinc-400">
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'clone' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <CloneForm onCloneResult={handleCloneResult} onSwitchToBuild={handleSwitchToBuild} />
            </div>
          )}

          {view === 'prompt' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold mb-1 text-zinc-100">Build Your Website</h2>
                <p className="text-sm text-zinc-400">
                  Provide a detailed description of your website or use suggestion chips to craft your prompt.
                </p>
              </div>

              <PromptInput
                value={prompt}
                onChange={setPrompt}
                siteConfig={siteConfig}
                loading={generating}
                onSubmit={handleGenerate}
              />

              {error && (
                <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/60 text-red-300 text-xs flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-base text-red-400">⚠️</span>
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={handleGenerate}
                    className="px-3 py-1 rounded-lg bg-red-800/40 hover:bg-red-800/60 text-red-200 text-xs font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {result && (
                <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-300">Website Generated Successfully!</p>
                      <p className="text-xs text-emerald-400/70 mt-0.5">
                        {result.files.length} production files assembled in {(result.duration / 1000).toFixed(1)} seconds.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadZip}
                      disabled={isZipping}
                      className="px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-zinc-100 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isZipping ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" x2="12" y1="15" y2="3" />
                        </svg>
                      )}
                      <span>Download Project ZIP</span>
                    </button>
                    <button
                      onClick={() => setView('preview')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20"
                    >
                      Open in Preview Studio ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'config' && (
            <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1 text-zinc-100">Site Configuration</h2>
                <p className="text-sm text-zinc-400">Configure core metadata, framework, styling system, and feature flags.</p>
              </div>
              <SiteConfigForm config={siteConfig} onChange={setSiteConfig} />
            </div>
          )}

          {view === 'layers' && (
            <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1 text-zinc-100">13 Architecture Layers</h2>
                <p className="text-sm text-zinc-400">Customize each architectural layer included in your generated project.</p>
              </div>
              <LayerConfigPanel layers={layers} onChange={setLayers} />
            </div>
          )}

          {view === 'preview' && (
            result ? (
              <div className="flex h-full gap-4 animate-fade-in">
                <div className="flex-1 min-w-0">
                  <PreviewPane
                    files={result.files}
                    selectedPath={selectedFile?.path}
                    onSelectPath={path => {
                      const f = result.files.find(x => x.path === path)
                      if (f) setSelectedFile(f)
                    }}
                    projectName={siteConfig.name}
                  />
                </div>
                <div className="w-80 shrink-0 hidden lg:block">
                  <FileExplorer
                    files={result.files}
                    selectedFile={selectedFile?.path}
                    onSelect={f => setSelectedFile(f)}
                    projectName={siteConfig.name}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur-xl shadow-2xl max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-2xl mb-4">
                  🎨
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">No Generation Output Yet</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                  You haven&apos;t generated a website in this session yet. Choose a template or enter a prompt in the Builder to view your live site and code.
                </p>
                <button
                  onClick={() => setView('prompt')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-indigo-600/20"
                >
                  Go to Builder ➔
                </button>
              </div>
            )
          )}
        </main>
      </div>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
