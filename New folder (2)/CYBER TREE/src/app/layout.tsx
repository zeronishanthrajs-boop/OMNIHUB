import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import { useSupabase } from '@/lib/db';
import Header from '@/components/Header';
import FloatingChatButton from '@/components/FloatingChatButton';

export const metadata: Metadata = {
  title: "CYBER TREE — Autonomous Threat Intelligence Platform",
  description: "Continuous cybersecurity knowledge indexing, relationship mapping, and incident timeline tracker.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full dark antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
        {/* Local DB Banner */}
        {process.env.NODE_ENV === 'development' && !useSupabase && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4 text-center text-xs text-amber-300 relative z-50 flex items-center justify-center space-x-2 font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Running against LOCAL database — production links will 404 here</span>
          </div>
        )}

        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Navigation */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          {children}
        </main>

        {/* Floating Incident Chat Button */}
        <FloatingChatButton />

        {/* Footer */}
        <footer className="border-t border-slate-900/60 bg-slate-950/40 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono">
            <div>© 2026 CYBER TREE System. Run forever on GitHub Actions.</div>
            <div className="mt-2 sm:mt-0 flex items-center space-x-4">
              <span>{useSupabase ? 'DB: Supabase Production' : 'DB: SQLite Local Fallback'}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${useSupabase ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
