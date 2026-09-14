import Link from "next/link";
import { AnimatedSection } from "@/frontend/components/sections/AnimatedSection";
import type { SectionComponentProps } from "@/frontend/components/sections/types";
import { asString } from "@/frontend/utils/configValue";
import { scopedPath } from "@/frontend/utils/storePath";

interface HeroProps {
  heroTitle?: string;
  heroSubtitle?: string;
  ctaText?: string;
  ctaHref?: string;
}

export function HeroSection({ config, section, storeSlug }: SectionComponentProps) {
  const props = (section.props ?? {}) as HeroProps;
  const title = asString(props.heroTitle, "Premium products crafted for modern life.");
  const subtitle = asString(
    props.heroSubtitle,
    "MorphCart renders entire storefronts from configuration, not hardcoded pages."
  );
  const ctaText = asString(props.ctaText, "Explore Collection");
  const ctaHref = scopedPath(storeSlug, asString(props.ctaHref, "/products"));
  const adminHref = storeSlug && storeSlug !== "default" ? `/admin/${storeSlug}/config` : "/admin/config";

  return (
    <AnimatedSection enabled={config.animations.enabled} delay={0}>
      <div className="grid min-h-[460px] items-center gap-10 rounded-[calc(var(--mc-radius)+8px)] border border-[var(--mc-border)] bg-white p-8 shadow-soft sm:p-12 lg:grid-cols-2">
        <div className={config.layout.heroAlignment === "center" ? "text-center lg:text-left" : ""}>
          <p className="mb-4 inline-flex rounded-full bg-[var(--mc-secondary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mc-text)]">
            {config.branding.siteName}
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-[var(--mc-text)] sm:text-5xl lg:text-[56px]">
            {title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--mc-text-muted)] sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              className="rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--mc-primary)" }}
            >
              {ctaText}
            </Link>
            <Link
              href={adminHref}
              className="rounded-full border border-[var(--mc-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:text-[var(--mc-primary)]"
            >
              Open Config Dashboard
            </Link>
          </div>
        </div>

        <div className="relative rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[linear-gradient(135deg,var(--mc-secondary),white)] p-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mc-text-muted)]">
              Live Engine Status
            </p>
            <h2 className="text-2xl font-semibold text-[var(--mc-text)]">Configuration-first rendering</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[var(--mc-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--mc-text-muted)]">Theme Variant</p>
                <p className="mt-1 text-sm font-semibold text-[var(--mc-text)]">{config.theme.variant}</p>
              </div>
              <div className="rounded-xl border border-[var(--mc-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--mc-text-muted)]">Store Preset</p>
                <p className="mt-1 text-sm font-semibold text-[var(--mc-text)]">{config.branding.siteName}</p>
              </div>
              <div className="rounded-xl border border-[var(--mc-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--mc-text-muted)]">Reviews Enabled</p>
                <p className="mt-1 text-sm font-semibold text-[var(--mc-text)]">
                  {config.featureFlags.userReviews ? "Yes" : "No"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--mc-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--mc-text-muted)]">Primary Color</p>
                <p className="mt-1 text-sm font-semibold text-[var(--mc-text)]">{config.theme.primaryColor}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
