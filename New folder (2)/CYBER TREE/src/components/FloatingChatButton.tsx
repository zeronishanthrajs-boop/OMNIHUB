'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FloatingChatButton() {
  const pathname = usePathname();

  // Don't show on the chat page itself
  if (pathname === '/chat') return null;

  return (
    <Link
      href="/chat"
      id="floating-chat-btn"
      aria-label="Open Incident Chatbot"
      title="Report Incident / Ask SENTINEL AI"
      className="fixed bottom-7 right-7 z-50 group flex items-center justify-center w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 shadow-2xl shadow-violet-900/60 border border-violet-400/30 hover:border-violet-400/60 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-violet-500/50"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-violet-500/30 animate-ping pointer-events-none" />
      {/* Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6 text-white relative z-10"
      >
        <path
          fillRule="evenodd"
          d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
          clipRule="evenodd"
        />
      </svg>
      {/* Tooltip */}
      <span className="absolute right-16 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
        Report Incident
      </span>
    </Link>
  );
}
