import type { SiteConfig } from "@/frontend/types/site-config";
import { getPaymentLabel } from "@/frontend/utils/payment";

interface FooterProps {
  config: SiteConfig;
}

export function Footer({ config }: FooterProps) {
  return (
    <footer className="border-t border-[var(--mc-border)] bg-[var(--mc-secondary)]/35 px-4 py-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-[var(--mc-max-width)] gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--mc-text)]">{config.branding.siteName}</h2>
          <p className="text-sm text-[var(--mc-text-muted)]">{config.branding.tagline}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mc-text)]">Shipping</h3>
          <p className="text-sm text-[var(--mc-text-muted)]">{config.ecommerce.shippingText}</p>
          <p className="text-sm text-[var(--mc-text-muted)]">Tax: {config.ecommerce.taxRate}%</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mc-text)]">Payments</h3>
          <p className="text-sm text-[var(--mc-text-muted)]">
            {config.ecommerce.paymentMethods.map((method) => getPaymentLabel(method)).join(" • ")}
          </p>
        </div>
      </div>
    </footer>
  );
}
