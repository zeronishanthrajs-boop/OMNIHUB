'use client'

import { useState } from 'react'
import { ScrollArea, cn } from '@awb/ui'
import { downloadProjectZip } from '@/lib/download-zip'

interface FileExplorerProps {
  files: { path: string; content: string }[]
  selectedFile?: string
  onSelect: (file: { path: string; content: string }) => void
  projectName?: string
}

function FileTypeIcon({ path }: { path: string }) {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'tsx' || ext === 'jsx') {
    return <span className="text-cyan-400 font-bold text-[10px]">⚛</span>
  }
  if (ext === 'ts' || ext === 'js') {
    return <span className="text-amber-400 font-bold text-[10px]">JS</span>
  }
  if (ext === 'css') {
    return <span className="text-sky-400 font-bold text-[10px]">#</span>
  }
  if (ext === 'json') {
    return <span className="text-yellow-400 font-bold text-[10px]">{}</span>
  }
  if (ext === 'md') {
    return <span className="text-zinc-400 font-bold text-[10px]">M↓</span>
  }
  if (path.includes('docker') || path.includes('Dockerfile')) {
    return <span className="text-blue-400 font-bold text-[10px]">🐋</span>
  }
  return <span className="text-zinc-500 font-bold text-[10px]">📄</span>
}

export function FileExplorer({ files, selectedFile, onSelect, projectName }: FileExplorerProps) {
  const [filter, setFilter] = useState('')
  const [isZipping, setIsZipping] = useState(false)

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

  const filteredFiles = files.filter(f => f.path.toLowerCase().includes(filter.toLowerCase()))

  const grouped = filteredFiles.reduce<Record<string, { path: string; content: string }[]>>((acc, f) => {
    const dir = f.path.includes('/') ? f.path.split('/').slice(0, -1).join('/') : '/'
    if (!acc[dir]) acc[dir] = []
    acc[dir].push(f)
    return acc
  }, {})

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur-xl overflow-hidden h-full flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-zinc-900/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Explorer</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-medium">
              {files.length} files
            </span>
            <button
              onClick={handleDownloadZip}
              disabled={isZipping || files.length === 0}
              title="Download entire project folder as ZIP"
              className="px-2 py-0.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition-all disabled:opacity-50 active:scale-95"
            >
              {isZipping ? (
                <div className="w-2.5 h-2.5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
              )}
              <span>ZIP</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search files..."
            className="w-full h-7 rounded-lg border border-white/10 bg-zinc-950 px-2.5 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1 p-2">
        {Object.keys(grouped).length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">No files found matching filter</div>
        ) : (
          Object.entries(grouped).map(([dir, dirFiles]) => (
            <div key={dir} className="mb-2">
              <div className="flex items-center gap-1 text-[11px] text-zinc-500 px-2 py-0.5 font-mono">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
                </svg>
                <span className="truncate">{dir || '/'}</span>
              </div>
              <div className="space-y-0.5 mt-0.5">
                {dirFiles.map(f => {
                  const isSelected = selectedFile === f.path
                  const fileName = f.path.split('/').pop()
                  return (
                    <button
                      key={f.path}
                      onClick={() => onSelect(f)}
                      className={cn(
                        'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center justify-between group',
                        isSelected
                          ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent',
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileTypeIcon path={f.path} />
                        <span className="truncate">{fileName}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400">
                        {Math.ceil(f.content.length / 1024)}k
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  )
}
