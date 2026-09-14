"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useCart } from "@/frontend/hooks/useCart";
import type { SiteConfig } from "@/frontend/types/site-config";
import type { Product } from "@/frontend/types/store";
import { getPaymentLabel } from "@/frontend/utils/payment";
import {
  readCurrency,
  formatPrice,
  currencyUpdateEvent
} from "@/frontend/services/currencyService";

interface CheckoutPageProps {
  config: SiteConfig;
  products: Product[];
}

const customFieldLabelMap: Record<SiteConfig["ecommerce"]["customFields"][number], string> = {
  company_name: "Company Name",
  gst_number: "GST Number",
  warranty_type: "Preferred Warranty",
  bulk_order_notes: "Bulk Order Notes"
};

export function CheckoutPage({ config, products }: CheckoutPageProps) {
  const { lineItems, subtotal, clearCart } = useCart(products);
  const [selectedPayment, setSelectedPayment] = useState(
    config.ecommerce.paymentMethods[0] ?? "credit_card"
  );
  const [successMessage, setSuccessMessage] = useState("");

  // Multi-Currency State
  const currencyEnabled = config.featureFlags.multiCurrency;
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

  const shipping = subtotal > 99 ? 0 : 7.99;
  const tax = (subtotal * config.ecommerce.taxRate) / 100;
  const total = subtotal + shipping + tax;
  const isEmpty = lineItems.length === 0;

  const summaryLines = useMemo(
    () =>
      lineItems
        .filter((line) => line.product)
        .map((line) => ({
          title: line.product?.title ?? "",
          quantity: line.quantity,
          total: line.lineTotal
        })),
    [lineItems]
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmpty) {
      setSuccessMessage("Cart is empty. Add items before placing an order.");
      return;
    }

    clearCart();
    setSuccessMessage("Order placed successfully. This is a demo checkout flow.");
  };

  return (
    <form className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] text-[var(--mc-text)]" onSubmit={onSubmit}>
      <section className="space-y-5 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-card)] p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-[var(--mc-text)]">Checkout</h1>

        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="First Name"
            className="h-11 rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
          />
          <input
            required
            placeholder="Last Name"
            className="h-11 rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="h-11 rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)] sm:col-span-2"
          />
          <input
            required
            placeholder="Address"
            className="h-11 rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)] sm:col-span-2"
          />
          <input
            required
            placeholder="City"
            className="h-11 rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
          />
          <input
            required
            placeholder="Postal Code"
            className="h-11 rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
          />
          {config.ecommerce.customFields.map((field) => (
            <input
              key={field}
              placeholder={customFieldLabelMap[field]}
              className="h-11 rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)] sm:col-span-2"
            />
          ))}
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
            Payment Method
          </legend>
          {config.ecommerce.paymentMethods.map((method) => (
            <label
              key={method}
              className="flex cursor-pointer items-center justify-between rounded-full border border-[var(--mc-border)] bg-[var(--mc-bg)]/40 px-4 py-3 text-sm hover:border-[var(--mc-primary)] transition"
            >
              <span>{getPaymentLabel(method)}</span>
              <input
                type="radio"
                name="payment"
                value={method}
                checked={selectedPayment === method}
                onChange={() => setSelectedPayment(method)}
              />
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="h-11 w-full rounded-full text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "var(--mc-primary)" }}
        >
          Place Order
        </button>
        {successMessage ? (
          <p className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-secondary)]/20 p-3 text-sm text-[var(--mc-text-muted)]">
            {successMessage}
          </p>
        ) : null}
      </section>

      <aside className="space-y-4 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-card)] p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-[var(--mc-text)]">Order Summary</h2>
        {summaryLines.length === 0 ? (
          <p className="text-sm text-[var(--mc-text-muted)]">No items in cart.</p>
        ) : (
          summaryLines.map((item) => (
            <div key={item.title} className="flex items-center justify-between text-sm text-[var(--mc-text-muted)]">
              <span>
                {item.title} x{item.quantity}
              </span>
              <span>{formatPrice(item.total, displayCurrency)}</span>
            </div>
          ))
        )}

        <div className="space-y-2 border-t border-[var(--mc-border)] pt-3 text-sm">
          <div className="flex items-center justify-between text-[var(--mc-text-muted)]">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-[var(--mc-text-muted)]">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-[var(--mc-text-muted)]">
            <span>Tax</span>
            <span>{formatPrice(tax, displayCurrency)}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-[var(--mc-text)] border-t border-[var(--mc-border)] pt-2 mt-2">
            <span>Total</span>
            <span>{formatPrice(total, displayCurrency)}</span>
          </div>
        </div>
      </aside>
    </form>
  );
}
