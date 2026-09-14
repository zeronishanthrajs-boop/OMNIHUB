"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { useState, useEffect } from "react";
import type { Product } from "@/frontend/types/store";

import { scopedPath } from "@/frontend/utils/storePath";
import { isFeatureEnabled } from "@/frontend/utils/featureGuard";
import { useWishlist } from "@/frontend/hooks/useWishlist";
import { readCurrency, formatPrice, currencyUpdateEvent } from "@/frontend/services/currencyService";

interface ProductCardProps {
  product: Product;
  currency: string;
  viewMode?: "grid" | "list";
  storeSlug?: string;
}

export function ProductCard({ product, currency, viewMode = "grid", storeSlug }: ProductCardProps) {
  const listMode = viewMode === "list";
  const productHref = scopedPath(storeSlug, `/products/${product.slug}`);
  
  const wishlistEnabled = isFeatureEnabled(storeSlug, "wishlist");
  const { isSaved, toggleWishlist } = useWishlist();
  const saved = isSaved(product.id);

  // Multi-Currency integration
  const currencyEnabled = isFeatureEnabled(storeSlug, "multiCurrency");
  const [activeCurrency, setActiveCurrency] = useState(currency);

  useEffect(() => {
    if (!currencyEnabled) return;

    const timer = setTimeout(() => {
      setActiveCurrency(readCurrency(currency));
    }, 0);

    const handleCurrencyUpdate = () => {
      setActiveCurrency(readCurrency(currency));
    };

    window.addEventListener(currencyUpdateEvent, handleCurrencyUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(currencyUpdateEvent, handleCurrencyUpdate);
    };
  }, [currencyEnabled, currency]);

  const displayCurrency = currencyEnabled ? activeCurrency : currency;

  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-card)] shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg",
        listMode && "grid grid-cols-1 sm:grid-cols-[220px_1fr]"
      )}
    >
      {wishlistEnabled && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mc-border)] bg-[var(--mc-card)]/80 shadow-soft backdrop-blur-sm transition duration-300 hover:scale-110 hover:bg-[var(--mc-card)]"
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            className={clsx(
              "h-5 w-5 transition-all duration-300",
              saved ? "fill-red-500 stroke-red-500 scale-110" : "stroke-slate-600 fill-none hover:stroke-red-500"
            )}
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      )}

      <Link href={productHref} className="relative block h-56 bg-white sm:h-full">
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes={listMode ? "220px" : "(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"}
        />
      </Link>

      <div className="space-y-3 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--mc-text-muted)]">
          {product.category}
        </p>
        <Link href={productHref} className="block">
          <h3 className="text-lg font-semibold text-[var(--mc-text)] transition group-hover:text-[var(--mc-primary)]">
            {product.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-[var(--mc-text-muted)]">{product.description}</p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-base font-semibold text-[var(--mc-text)]">
            {formatPrice(product.price, displayCurrency)}
          </span>
          <span className="rounded-full bg-[var(--mc-secondary)] px-2 py-1 text-xs text-[var(--mc-text)]">
            {product.rating.toFixed(1)} / 5
          </span>
        </div>
      </div>
    </article>
  );
}


