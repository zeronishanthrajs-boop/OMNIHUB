import Link from "next/link";
import { AnimatedSection } from "@/frontend/components/sections/AnimatedSection";
import type { SectionComponentProps } from "@/frontend/components/sections/types";
import { asString } from "@/frontend/utils/configValue";
import { scopedPath } from "@/frontend/utils/storePath";

interface PromoBannerProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
}

export function PromoBannerSection({ config, section, storeSlug }: SectionComponentProps) {
  const props = (section.props ?? {}) as PromoBannerProps;
  const title = asString(props.title, "Limited Offer: New Season Arrivals");
  const description = asString(
    props.description,
    "Use your configured coupon code to instantly test promotional behavior across stores."
  );
  const ctaText = asString(props.ctaText, `Apply ${config.ecommerce.defaultCouponCode}`);
  const ctaHref = scopedPath(storeSlug, asString(props.ctaHref, "/cart"));

  return (
    <AnimatedSection enabled={config.animations.enabled} delay={config.animations.sectionStagger * 3}>
      <div className="rounded-[calc(var(--mc-radius)+6px)] border border-[var(--mc-border)] bg-[linear-gradient(140deg,white,var(--mc-secondary))] p-8 shadow-soft sm:p-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mc-text-muted)]">
              Promo Banner
            </p>
            <h2 className="text-2xl font-semibold text-[var(--mc-text)] sm:text-3xl">{title}</h2>
            <p className="text-sm leading-7 text-[var(--mc-text-muted)]">{description}</p>
          </div>
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "var(--mc-primary)" }}
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </AnimatedSection>
  );
}
