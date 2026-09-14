'use client'

import { useState, useMemo } from 'react'
import { ScrollArea } from '@awb/ui'
import { downloadProjectZip } from '@/lib/download-zip'

interface PreviewPaneProps {
  files: { path: string; content: string }[]
  selectedPath?: string
  onSelectPath?: (path: string) => void
  projectName?: string
}

type ViewMode = 'rendered' | 'code'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'

export function PreviewPane({ files, selectedPath, onSelectPath, projectName }: PreviewPaneProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('rendered')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isZipping, setIsZipping] = useState(false)

  const activeFilePath = selectedPath || selectedFilePath || files[0]?.path
  const currentFile = files.find(f => f.path === activeFilePath) || files[0]

  // Construct a renderable HTML document from the generated files
  const renderedHtml = useMemo(() => {
    // 1. Direct HTML file if present
    const explicitHtml = files.find(f => f.path.endsWith('.html'))
    if (explicitHtml) {
      let html = explicitHtml.content

      // Inline any generated css files so iframe styles render without external network requests
      const cssFiles = files.filter(f => f.path.endsWith('.css'))
      for (const css of cssFiles) {
        const filename = css.path.split('/').pop() || ''
        if (filename && html.includes(filename)) {
          html = html.replace(new RegExp(`<link[^>]*href=["'][^"']*${filename}["'][^>]*>`, 'gi'), `<style>\n${css.content}\n</style>`)
        } else if (html.includes('</head>')) {
          html = html.replace('</head>', `<style>\n${css.content}\n</style>\n</head>`)
        } else {
          html += `\n<style>\n${css.content}\n</style>`
        }
      }

      // Inline any generated js files
      const jsFiles = files.filter(f => f.path.endsWith('.js') && !f.path.includes('config'))
      for (const js of jsFiles) {
        const filename = js.path.split('/').pop() || ''
        if (filename && html.includes(filename)) {
          html = html.replace(new RegExp(`<script[^>]*src=["'][^"']*${filename}["'][^>]*>\\s*</script>`, 'gi'), `<script>\n${js.content}\n</script>`)
        } else if (html.includes('</body>')) {
          html = html.replace('</body>', `<script>\n${js.content}\n</script>\n</body>`)
        } else {
          html += `\n<script>\n${js.content}\n</script>`
        }
      }

      return html
    }

    // 2. React / TSX components synthesis into a styled preview
    const tsxFiles = files.filter(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'))
    const cssFiles = files.filter(f => f.path.endsWith('.css'))

    const combinedCss = cssFiles.map(f => f.content).join('\n')

    // Find main page/app or first component
    const mainComponent = tsxFiles.find(f => f.path.includes('page.') || f.path.includes('App.') || f.path.includes('index.')) || tsxFiles[0]

    if (mainComponent) {
      // Clean JSX content for an HTML shell preview
      let bodyContent = mainComponent.content
        .replace(/import[\s\S]*?from\s+['"].*?['"];?/g, '')
        .replace(/export\s+default\s+function.*?\((.*?)\)\s*\{([\s\S]*)\}/, '$2')
        .replace(/return\s*\(([\s\S]*)\);?\s*$/, '$1')
        .replace(/className=/g, 'class=')

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    ${combinedCss}
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 min-h-screen">
  ${bodyContent}
</body>
</html>`
    }

    return `<!DOCTYPE html>
<html>
<body style="background:#09090b;color:#a1a1aa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <h3 style="color:#f4f4f5;margin-bottom:8px;">Ready to Preview</h3>
    <p style="font-size:14px;">Select the Code tab above to inspect your ${files.length} generated files.</p>
  </div>
</body>
</html>`
  }, [files])

  const handleCopyCode = () => {
    if (!currentFile) return
    navigator.clipboard.writeText(currentFile.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadFile = () => {
    if (!currentFile) return
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = currentFile.path.split('/').pop() || 'file.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadZip = async () => {
    if (files.length === 0 || isZipping) return
    try {
      setIsZipping(true)
      const name = projectName ? projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'ai-website'
      await downloadProjectZip(files, name)
    } catch (err) {
      console.error('Failed to create ZIP archive:', err)
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <div className="h-full flex flex-col rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-white/10 bg-zinc-900/60 px-4 flex items-center justify-between gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('rendered')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'rendered'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>Live UI</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'code'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Source Code</span>
          </button>
        </div>

        {/* Middle: Device Switcher (for Rendered Mode) */}
        {viewMode === 'rendered' && (
          <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setDeviceMode('desktop')}
              title="Desktop (100%)"
              className={`p-1.5 rounded-lg transition-colors ${deviceMode === 'desktop' ? 'bg-white/10 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="3" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              title="Tablet (768px)"
              className={`p-1.5 rounded-lg transition-colors ${deviceMode === 'tablet' ? 'bg-white/10 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2" />
                <line x1="12" x2="12.01" y1="18" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              title="Mobile (375px)"
              className={`p-1.5 rounded-lg transition-colors ${deviceMode === 'mobile' ? 'bg-white/10 text-indigo-300' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="20" x="5" y="2" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </button>
          </div>
        )}

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {viewMode === 'code' && (
            <>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <span className="text-emerald-400">✓</span>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm"
                title={`Download only ${currentFile?.path || 'this file'}`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Single File</span>
              </button>
            </>
          )}

          {/* Primary Download Project Button: Downloads entire folder with all files in a single click */}
          <button
            onClick={handleDownloadZip}
            disabled={isZipping || files.length === 0}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs tracking-wide transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 active:scale-95 cursor-pointer"
            title="Download entire project folder with all files as a ZIP archive"
          >
            {isZipping ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Packaging ZIP...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                <span>Download ZIP ({files.length} files)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'rendered' ? (
          <div className="w-full h-full bg-zinc-950 flex items-center justify-center p-4 overflow-auto">
            <div
              className="h-full bg-zinc-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300 flex flex-col"
              style={{
                width: deviceMode === 'desktop' ? '100%' : deviceMode === 'tablet' ? '768px' : '375px',
                maxWidth: '100%',
              }}
            >
              {/* Fake browser bar */}
              <div className="h-7 bg-zinc-900 border-b border-white/5 px-3 flex items-center gap-2 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 mx-4 bg-zinc-950 rounded px-2 py-0.5 text-[10px] text-zinc-500 font-mono text-center truncate border border-white/5">
                  preview://localhost:3000
                </div>
              </div>
              <iframe
                srcDoc={renderedHtml}
                title="Website Rendered Preview"
                sandbox="allow-scripts allow-same-origin"
                className="w-full flex-1 bg-white border-none"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* File Tabs */}
            <div className="flex items-center border-b border-white/10 bg-zinc-950/80 px-2 overflow-x-auto select-none">
              {files.slice(0, 15).map(f => {
                const isActive = f.path === (currentFile?.path || '')
                return (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFilePath(f.path)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-mono border-b-2 transition-all shrink-0 ${
                      isActive
                        ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{f.path.split('/').pop()}</span>
                  </button>
                )
              })}
            </div>

            {/* Code Content */}
            <ScrollArea className="flex-1 p-0 bg-zinc-950">
              {currentFile && (
                <div className="p-4 font-mono text-xs text-zinc-300 leading-relaxed">
                  <pre className="overflow-x-auto whitespace-pre">
                    <code>{currentFile.content}</code>
                  </pre>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}
