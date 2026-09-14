'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResults {
  nodes: Array<{ id: string; title: string; node_type: string }>;
  predictions: Array<{ id: string; title: string; hypothesis: string; status: string }>;
  trends: Array<{ id: string; description: string; pattern_type: string }>;
  sources: Array<{ id: string; name: string; url: string; is_active: boolean }>;
}

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'critical' | 'loading'>('loading');
  const [healthInfo, setHealthInfo] = useState<string>('Checking system health...');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch pipeline health
  useEffect(() => {
    fetch('/api/system-health')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.overall_status) {
          setHealthStatus(data.overall_status);
          setHealthInfo(`System status: ${data.overall_status.toUpperCase()} (${data.critical_count} critical, ${data.degraded_count} degraded workflows)`);
        } else {
          setHealthStatus('degraded');
          setHealthInfo('System status check returned invalid format.');
        }
      })
      .catch((err) => {
        console.error('Failed to load system health indicator:', err);
        setHealthStatus('critical');
        setHealthInfo('System health check offline.');
      });
  }, []);

  // Search logic
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/global-search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Global search fetch failed:', err);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current !== e.target
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (href: string) => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    router.push(href);
  };

  const hasResults = results && (
    results.nodes.length > 0 ||
    results.predictions.length > 0 ||
    results.trends.length > 0 ||
    results.sources.length > 0
  );

  const healthColor =
    healthStatus === 'healthy'  ? 'bg-emerald-500' :
    healthStatus === 'degraded' ? 'bg-amber-500'   :
    healthStatus === 'critical' ? 'bg-red-500'      :
    'bg-slate-600 animate-pulse';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo and Nav Links */}
        <div className="flex items-center space-x-6 shrink-0">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 group-hover:from-emerald-400 group-hover:to-violet-400 transition-all duration-500 animate-gradient">
              CYBER TREE
            </span>
            <span className="flex h-2 w-2 relative" title={healthInfo}>
              {healthStatus !== 'loading' && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthColor}`}></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${healthColor}`}></span>
            </span>
          </Link>
          <nav className="hidden lg:flex space-x-4">
            <Link href="/" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Dashboard
            </Link>
            <Link href="/search" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Search
            </Link>
            <Link href="/explore" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Explore
            </Link>
            <Link href="/timeline" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Timeline
            </Link>
            <Link href="/threats" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Threats
            </Link>
            <Link href="/patterns" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Patterns
            </Link>
            <Link href="/predictions" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Predictions
            </Link>
            <Link href="/intelligence" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Model
            </Link>
            <Link href="/sources" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200">
              Sources
            </Link>
            <Link href="/research" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors duration-200 flex items-center space-x-1">
              <span>Research</span>
              <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-violet-500/20 text-violet-400 border border-violet-500/20">AI</span>
            </Link>
            <Link href="/chat" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-200 flex items-center space-x-1">
              <span>Chat</span>
              <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 animate-pulse">LIVE</span>
            </Link>
          </nav>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search platform... (Ctrl+K)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:bg-slate-900 transition-all font-mono"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-mono bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded pointer-events-none">
              Ctrl+K
            </span>
          </div>

          {/* Results Dropdown */}
          {isOpen && query.trim() && (
            <div
              ref={dropdownRef}
              className="absolute top-full right-0 left-0 mt-2 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto z-50 divide-y divide-slate-900"
            >
              {!results ? (
                <div className="p-4 text-center text-xs font-mono text-slate-500 animate-pulse">
                  Searching...
                </div>
              ) : !hasResults ? (
                <div className="p-4 text-center text-xs font-mono text-slate-400">
                  No matching results found for "{query}"
                </div>
              ) : (
                <>
                  {/* Knowledge Nodes */}
                  {results.nodes.length > 0 && (
                    <div className="p-3">
                      <p className="text-[10px] font-bold tracking-wider text-violet-400 font-mono uppercase mb-2">Knowledge Entities</p>
                      <div className="space-y-1">
                        {results.nodes.map((node) => (
                          <div
                            key={node.id}
                            onClick={() => handleResultClick(`/explore/${node.id}`)}
                            className="p-2 rounded-lg hover:bg-slate-900/60 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <span className="text-xs text-slate-300 group-hover:text-white truncate pr-2">{node.title}</span>
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 border border-slate-800 text-slate-400 rounded uppercase shrink-0">
                              {(node.node_type || '').replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Predictions */}
                  {results.predictions.length > 0 && (
                    <div className="p-3">
                      <p className="text-[10px] font-bold tracking-wider text-amber-400 font-mono uppercase mb-2">Predictions & Hypotheses</p>
                      <div className="space-y-1">
                        {results.predictions.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleResultClick(`/predictions`)}
                            className="p-2 rounded-lg hover:bg-slate-900/60 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <span className="text-xs text-slate-300 group-hover:text-white truncate pr-2">{p.title || p.hypothesis}</span>
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded uppercase shrink-0 border ${
                              p.status === 'confirmed' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                              p.status === 'disproven' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                              'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trends */}
                  {results.trends.length > 0 && (
                    <div className="p-3">
                      <p className="text-[10px] font-bold tracking-wider text-cyan-400 font-mono uppercase mb-2">Emerging Trends</p>
                      <div className="space-y-1">
                        {results.trends.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleResultClick(`/patterns`)}
                            className="p-2 rounded-lg hover:bg-slate-900/60 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <span className="text-xs text-slate-300 group-hover:text-white truncate pr-2">{t.description}</span>
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 border border-slate-800 text-slate-400 rounded uppercase shrink-0">
                              {t.pattern_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {results.sources.length > 0 && (
                    <div className="p-3">
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 font-mono uppercase mb-2">Sources</p>
                      <div className="space-y-1">
                        {results.sources.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleResultClick(`/sources`)}
                            className="p-2 rounded-lg hover:bg-slate-900/60 cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <span className="text-xs text-slate-300 group-hover:text-white truncate pr-2">{s.name}</span>
                            <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded uppercase shrink-0 border ${
                              s.is_active ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-500 bg-slate-800/20 border-slate-800/40'
                            }`}>
                              {s.is_active ? 'active' : 'inactive'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Phase Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400 shrink-0">
          <span className="font-mono text-violet-400">OPERATIONAL: PHASE 10</span>
        </div>

        {/* Hamburger Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shrink-0"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-900 bg-slate-950/95 backdrop-blur-md px-4 py-3 divide-y divide-slate-900 font-mono">
          <div className="py-2 space-y-1">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Dashboard
            </Link>
            <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Search
            </Link>
            <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Explore
            </Link>
            <Link href="/timeline" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Timeline
            </Link>
            <Link href="/threats" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Threats
            </Link>
            <Link href="/patterns" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Patterns
            </Link>
            <Link href="/predictions" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Predictions
            </Link>
            <Link href="/intelligence" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Model
            </Link>
            <Link href="/sources" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors">
              Sources
            </Link>
            <Link href="/research" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors flex items-center space-x-1">
              <span>Research</span>
              <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-violet-500/20 text-violet-400 border border-violet-500/20">AI</span>
            </Link>
            <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 transition-colors flex items-center space-x-1">
              <span>💬 Chat</span>
              <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 animate-pulse">LIVE</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
