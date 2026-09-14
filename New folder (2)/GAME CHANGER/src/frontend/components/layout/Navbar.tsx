"use client";

import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { useState, useEffect } from "react";
import type { SiteConfig } from "@/frontend/types/site-config";
import { isFeatureEnabled } from "@/frontend/utils/featureGuard";
import { useWishlist } from "@/frontend/hooks/useWishlist";
import { mockProducts } from "@/frontend/services/mockProducts";
import { addLineToCart } from "@/frontend/utils/cartStorage";
import { readTheme, toggleTheme, themeUpdateEvent } from "@/frontend/utils/themeStorage";
import {
  readCurrency,
  writeCurrency,
  formatPrice,
  currencyUpdateEvent,
  exchangeRates
} from "@/frontend/services/currencyService";

interface NavbarProps {
  config: SiteConfig;
  storeSlug?: string;
}

export function Navbar({ config, storeSlug }: NavbarProps) {
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Feature Toggles from Governance matrix
  const wishlistEnabled = isFeatureEnabled(storeSlug, "wishlist");
  const darkModeEnabled = isFeatureEnabled(storeSlug, "darkModeToggle");
  const currencyEnabled = isFeatureEnabled(storeSlug, "multiCurrency");

  // Reactive Wishlist State
  const { savedIds, items: wishlistItems, toggleWishlist } = useWishlist(mockProducts);
  const wishlistIdsCount = savedIds.length;

  // Reactive Dark/Light Theme State
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  // Reactive Currency State
  const [activeCurrency, setActiveCurrency] = useState(config.ecommerce.currency);

  useEffect(() => {
    if (!currencyEnabled) return;

    const timer = setTimeout(() => {
      setActiveCurrency(readCurrency(config.ecommerce.currency));
    }, 0);

    const handleCurrencyUpdate = () => {
      setActiveCurrency(readCurrency(config.ecommerce.currency));
    };

    window.addEventListener(currencyUpdateEvent, handleCurrencyUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(currencyUpdateEvent, handleCurrencyUpdate);
    };
  }, [currencyEnabled, config.ecommerce.currency]);

  const displayCurrency = currencyEnabled ? activeCurrency : config.ecommerce.currency;

  const positionClass =
    config.layout.navbarPosition === "sticky"
      ? "sticky top-0"
      : config.layout.navbarPosition === "static"
        ? "static"
        : "sticky top-4";
  const hasScopedRoute = Boolean(storeSlug && storeSlug !== "default");
  const scoped = (path: string) => {
    if (!hasScopedRoute || !storeSlug) {
      return path;
    }

    if (path === "/") {
      return `/${storeSlug}`;
    }

    return `/${storeSlug}${path}`;
  };
  const adminHref = hasScopedRoute && storeSlug ? `/admin/${storeSlug}/config` : "/admin/config";

  const handleAddToCart = (productId: string) => {
    addLineToCart(productId, 1);
    setAddedProductId(productId);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1500);
  };

  return (
    <>
      <header className={clsx("z-40 px-4 sm:px-6", positionClass)}>
        <nav className="mx-auto mt-4 flex h-16 w-full max-w-[var(--mc-max-width)] items-center justify-between rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-card)]/75 px-5 shadow-soft backdrop-blur-md transition-colors duration-300">
          <Link href={scoped("/")} className="text-lg font-semibold tracking-tight text-[var(--mc-text)]">
            {config.branding.siteName}
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-[var(--mc-text-muted)] md:flex">
            <Link href={scoped("/")} className="transition hover:text-[var(--mc-primary)]">
              Home
            </Link>
            <Link href={scoped("/products")} className="transition hover:text-[var(--mc-primary)]">
              Products
            </Link>
            <Link href={scoped("/cart")} className="transition hover:text-[var(--mc-primary)]">
              Cart
            </Link>
            <Link href={scoped("/checkout")} className="transition hover:text-[var(--mc-primary)]">
              Checkout
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Currency Dropdown Switcher */}
            {currencyEnabled && (
              <select
                value={activeCurrency}
                onChange={(e) => writeCurrency(e.target.value)}
                className="h-10 rounded-full border border-[var(--mc-border)] bg-[var(--mc-card)] px-3 text-xs font-semibold text-[var(--mc-text)] outline-none transition hover:border-[var(--mc-primary)] focus:ring-2 focus:ring-[var(--mc-primary)] cursor-pointer"
              >
                {Object.keys(exchangeRates).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur}
                  </option>
                ))}
              </select>
            )}

            {/* Dark Mode Sun/Moon Toggler */}
            {darkModeEnabled && (
              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mc-border)] bg-[var(--mc-card)] text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:text-[var(--mc-primary)]"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  // Moon Icon for turning dark
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  // Sun Icon for turning light
                  <svg
                    className="h-5 w-5 fill-none stroke-current"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>
            )}

            {/* Wishlist Icon and Count Badge */}
            {wishlistEnabled && (
              <button
                type="button"
                onClick={() => setIsWishlistOpen(true)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--mc-border)] bg-[var(--mc-card)] text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:text-[var(--mc-primary)]"
                aria-label="Open wishlist"
              >
                <svg
                  className="h-5 w-5 stroke-current fill-none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                {wishlistIdsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {wishlistIdsCount}
                  </span>
                )}
              </button>
            )}

            <Link
              href={adminHref}
              className="rounded-full border border-[var(--mc-border)] bg-[var(--mc-card)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:text-[var(--mc-primary)]"
            >
              Config
            </Link>
          </div>
        </nav>
      </header>

      {/* Slide-out Wishlist Drawer */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300">
          {/* Backdrop close area */}
          <div className="absolute inset-0" onClick={() => setIsWishlistOpen(false)} />

          {/* Drawer content */}
          <aside className="relative flex h-full w-full max-w-md flex-col bg-[var(--mc-card)] p-6 border-l border-[var(--mc-border)] shadow-2xl transition-transform duration-300 translate-x-0 text-[var(--mc-text)]">
            <div className="flex items-center justify-between border-b border-[var(--mc-border)] pb-4">
              <h2 className="text-xl font-semibold text-[var(--mc-text)] flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-red-500 fill-current"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                Your Wishlist ({wishlistIdsCount})
              </h2>
              <button
                type="button"
                onClick={() => setIsWishlistOpen(false)}
                className="rounded-full p-2 text-[var(--mc-text-muted)] hover:bg-[var(--mc-border)] hover:text-[var(--mc-text)]"
                aria-label="Close wishlist"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto space-y-4 pr-1">
              {wishlistItems.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center text-center space-y-3">
                  <svg
                    className="h-12 w-12 text-[var(--mc-border)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  <p className="text-sm font-medium text-[var(--mc-text-muted)]">Your wishlist is empty.</p>
                  <p className="text-xs text-[var(--mc-text-muted)] px-8">Save items by tapping the heart icon on any product card.</p>
                </div>
              ) : (
                wishlistItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-[var(--mc-border)] p-3 bg-[var(--mc-bg)]/50 hover:bg-[var(--mc-bg)] transition duration-300"
                  >
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--mc-border)] bg-[var(--mc-card)]">
                      <Image src={item.images[0]} alt={item.title} fill className="object-cover" sizes="80px" />
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--mc-text)] truncate">{item.title}</h3>
                        <p className="text-xs text-[var(--mc-text-muted)] mt-0.5">{item.category}</p>
                        <p className="text-sm font-bold text-[var(--mc-text)] mt-1">
                          {formatPrice(item.price, displayCurrency)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--mc-border)]/50">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(item.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item.id)}
                          className={clsx(
                            "rounded-full px-3 py-1 text-xs font-semibold text-white transition duration-300",
                            addedProductId === item.id ? "bg-green-500" : "bg-[var(--mc-primary)] hover:opacity-90"
                          )}
                        >
                          {addedProductId === item.id ? "Added!" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
