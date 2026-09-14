"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Footer } from "@/frontend/components/layout/Footer";
import { Navbar } from "@/frontend/components/layout/Navbar";
import { buildThemeVariables } from "@/frontend/themes/themeVariables";
import type { SiteConfig } from "@/frontend/types/site-config";
import { isFeatureEnabled } from "@/frontend/utils/featureGuard";
import { readTheme, themeUpdateEvent } from "@/frontend/utils/themeStorage";

interface StoreShellProps {
  config: SiteConfig;
  children: ReactNode;
  storeSlug?: string;
}

export function StoreShell({ config, children, storeSlug }: StoreShellProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const darkModeEnabled = isFeatureEnabled(storeSlug, "darkModeToggle");

  useEffect(() => {
    if (!darkModeEnabled) return;

    const timer = setTimeout(() => {
      setTheme(readTheme());
    }, 0);

    const handleThemeUpdate = () => {
      setTheme(readTheme());
    };

    window.addEventListener(themeUpdateEvent, handleThemeUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(themeUpdateEvent, handleThemeUpdate);
    };
  }, [darkModeEnabled]);

  const baseVariables = buildThemeVariables(config);
  
  // Luxury Slate/Charcoal HSL color scheme variables for premium dark mode
  const themeVariables = darkModeEnabled && theme === "dark"
    ? {
        ...baseVariables,
        "--mc-bg": "#0b0f19",
        "--mc-card": "#111827",
        "--mc-text": "#f9fafb",
        "--mc-text-muted": "#9ca3af",
        "--mc-border": "#1f2937",
        "--mc-hover": "#1e293b",
      }
    : baseVariables;

  return (
    <div
      style={themeVariables}
      className={`min-h-screen bg-[var(--mc-bg)] text-[var(--mc-text)] transition-colors duration-300 ${theme === "dark" ? "dark bg-slate-950 text-slate-50" : ""}`}
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(203,213,225,0.16),transparent_35%)]" />
        <Navbar config={config} storeSlug={storeSlug} />
        <main className="mx-auto w-full max-w-[var(--mc-max-width)] px-4 pb-16 pt-8 sm:px-6">
          {children}
        </main>
      </div>
      <Footer config={config} />
    </div>
  );
}

