"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useCart } from "@/frontend/hooks/useCart";
import type { SiteConfig } from "@/frontend/types/site-config";
import type { Product } from "@/frontend/types/store";
import { scopedPath } from "@/frontend/utils/storePath";
import { isFeatureEnabled } from "@/frontend/utils/featureGuard";
import {
  readCurrency,
  formatPrice,
  currencyUpdateEvent
} from "@/frontend/services/currencyService";

interface CartPageProps {
  config: SiteConfig;
  products: Product[];
  storeSlug?: string;
}

export function CartPage({ config, products, storeSlug }: CartPageProps) {
  const { lineItems, subtotal, updateQuantity, removeFromCart } = useCart(products);
  const [coupon, setCoupon] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const normalizedCoupon = coupon.trim().toUpperCase();

  // Multi-Currency State
  const currencyEnabled = isFeatureEnabled(storeSlug, "multiCurrency");
  const [activeCurrency, setActiveCurrency] = useState(config.ecommerce.currency);

  useEffect(() => {
    if (!currencyEnabled) return;

    // Defer initial localStorage reading to avoid synchronous setState inside render context
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

  const discount = useMemo(
    () =>
      config.featureFlags.checkoutCoupon &&
      normalizedCoupon === config.ecommerce.defaultCouponCode.toUpperCase()
        ? subtotal * 0.1
        : 0,
    [config.featureFlags.checkoutCoupon, normalizedCoupon, config.ecommerce.defaultCouponCode, subtotal]
  );
  
  const shipping = subtotal > 99 ? 0 : 7.99;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = (taxableAmount * config.ecommerce.taxRate) / 100;
  const total = taxableAmount + shipping + tax;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] text-[var(--mc-text)]">
      <section className="space-y-4 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-card)] p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-[var(--mc-text)]">Shopping Cart</h1>

        {lineItems.length === 0 ? (
          <p className="rounded-[var(--mc-radius)] border border-dashed border-[var(--mc-border)] p-6 text-sm text-[var(--mc-text-muted)]">
            Your cart is empty. Add products from the catalog to continue.
          </p>
        ) : (
          lineItems.map((line) =>
            line.product ? (
              <article
                key={line.productId}
                className="grid gap-4 rounded-[var(--mc-radius)] border border-[var(--mc-border)] p-4 sm:grid-cols-[1fr_auto] bg-[var(--mc-bg)]/30"
              >
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--mc-text-muted)]">
                    {line.product.category}
                  </p>
                  <h2 className="text-base font-semibold text-[var(--mc-text)]">{line.product.title}</h2>
                  <p className="text-sm text-[var(--mc-text-muted)]">
                    {formatPrice(line.product.price, displayCurrency)} each
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <div className="inline-flex items-center rounded-full border border-[var(--mc-border)] bg-[var(--mc-card)]">
                    <button
                      type="button"
                      className="h-9 w-9 text-[var(--mc-text)] hover:text-[var(--mc-primary)] transition"
                      onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-[var(--mc-text)]">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-9 w-9 text-[var(--mc-text)] hover:text-[var(--mc-primary)] transition"
                      onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-[var(--mc-text)]">
                    {formatPrice(line.lineTotal, displayCurrency)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.productId)}
                    className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)] underline-offset-4 hover:text-red-500 hover:underline transition"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ) : null
          )
        )}
      </section>

      <aside className="space-y-4 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-card)] p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-[var(--mc-text)]">Order Summary</h2>
        {config.featureFlags.checkoutCoupon ? (
          <label className="space-y-2 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
              Coupon
            </span>
            <input
              value={coupon}
              onChange={(event) => setCoupon(event.target.value)}
              placeholder={config.ecommerce.defaultCouponCode}
              className="h-11 w-full rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
            />
          </label>
        ) : (
          <p className="text-xs text-[var(--mc-text-muted)]">
            Coupon feature is disabled for this store plan.
          </p>
        )}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-[var(--mc-text-muted)]">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-[var(--mc-text-muted)]">
            <span>Discount</span>
            <span>-{formatPrice(discount, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-[var(--mc-text-muted)]">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-[var(--mc-text-muted)]">
            <span>Tax ({config.ecommerce.taxRate}%)</span>
            <span>{formatPrice(tax, displayCurrency)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-[var(--mc-border)] pt-3 text-base font-semibold text-[var(--mc-text)]">
            <span>Total</span>
            <span>{formatPrice(total, displayCurrency)}</span>
          </div>
        </div>

        {config.featureFlags.shippingCalculator ? (
          <label className="space-y-2 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
              Shipping Estimator
            </span>
            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="Enter postal code"
              className="h-10 w-full rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
            />
          </label>
        ) : null}

        <p className="text-xs text-[var(--mc-text-muted)]">{config.ecommerce.shippingText}</p>
        <Link
          href={scopedPath(storeSlug, "/checkout")}
          className="inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "var(--mc-primary)" }}
        >
          Continue to Checkout
        </Link>
      </aside>
    </div>
  );
}
