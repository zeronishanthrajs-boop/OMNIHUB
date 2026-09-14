'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Successful login, refresh page and redirect to dashboard
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative min-h-[70vh]">
      {/* Decorative Blur Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-2xl shadow-2xl relative z-10">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-emerald-400 font-sans">
            System Authentication
          </h2>
          <p className="mt-2 text-center text-xs text-slate-400 font-mono">
            CYBER TREE Threat Intelligence Command Center
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                Analyst ID (Email)
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-slate-950 transition-all font-mono"
                placeholder="analyst@cybertree.system"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold font-mono text-slate-400 uppercase tracking-wider mb-2">
                Secret Access Key
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500/60 focus:bg-slate-950 transition-all font-mono"
                placeholder="••••••••••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-violet-500/40 text-sm font-semibold rounded-lg text-white bg-violet-600/20 hover:bg-violet-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-violet-500/80"
            >
              {loading ? (
                <span className="flex items-center space-x-2 font-mono text-xs">
                  <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Key...</span>
                </span>
              ) : (
                <span className="font-mono text-xs tracking-widest uppercase">Establish Connection</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
