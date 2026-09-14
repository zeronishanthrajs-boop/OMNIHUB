'use client'

import { cn } from '@awb/ui'

interface SidebarProps {
  nav: { id: string; label: string; icon: string }[]
  activeView: string
  onViewChange: (id: any) => void
}

function NavIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'layout':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      )
    case 'code':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'layers':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      )
    case 'copy':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    case 'eye':
      return (
        <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    default:
      return <div className="w-2 h-2 rounded-full bg-current" />
  }
}

export function BuilderSidebar({ nav, activeView, onViewChange }: SidebarProps) {
  return (
    <nav className="w-16 bg-zinc-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col items-center py-4 gap-1 z-30 justify-between select-none">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Brand Icon */}
        <div className="relative group cursor-pointer" onClick={() => onViewChange('templates')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            A
          </div>
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-400 opacity-20 blur group-hover:opacity-40 transition-opacity -z-10" />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-1.5 w-full px-2">
          {nav.map(item => {
            const isActive = activeView === item.id
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  'relative w-11 h-11 flex flex-col items-center justify-center rounded-xl transition-all group',
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent',
                )}
                title={item.label}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500" />
                )}
                <NavIcon name={item.icon} className={cn('transition-transform group-hover:scale-110', isActive && 'stroke-[2.2]')} />
                <span className="text-[9px] font-medium tracking-tight mt-0.5 opacity-80">{item.label.slice(0, 5)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom status badge */}
      <div className="flex flex-col items-center gap-2">
        <div className="group relative flex items-center justify-center cursor-pointer" title="Local AI Engine Connected">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-500" />
          </span>
        </div>
      </div>
    </nav>
  )
}
