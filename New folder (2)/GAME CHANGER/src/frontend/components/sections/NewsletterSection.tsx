import { AnimatedSection } from "@/frontend/components/sections/AnimatedSection";
import type { SectionComponentProps } from "@/frontend/components/sections/types";
import { asString } from "@/frontend/utils/configValue";

interface NewsletterProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
}

export function NewsletterSection({ config, section }: SectionComponentProps) {
  const props = (section.props ?? {}) as NewsletterProps;
  const title = asString(props.title, "Join our newsletter");
  const subtitle = asString(
    props.subtitle,
    "Get product drops, offers, and curated picks. Content is fully configuration-driven."
  );
  const ctaText = asString(props.ctaText, "Subscribe");

  return (
    <AnimatedSection enabled={config.animations.enabled} delay={config.animations.sectionStagger * 5}>
      <div className="rounded-[calc(var(--mc-radius)+6px)] border border-[var(--mc-border)] bg-white p-8 shadow-soft sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-[var(--mc-text)] sm:text-[32px]">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--mc-text-muted)]">{subtitle}</p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@example.com"
              className="h-12 flex-1 rounded-full border border-[var(--mc-border)] bg-white px-5 text-sm text-[var(--mc-text)] outline-none ring-offset-2 transition focus:ring-2 focus:ring-[var(--mc-primary)]"
            />
            <button
              type="button"
              className="h-12 rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: "var(--mc-primary)" }}
            >
              {ctaText}
            </button>
          </form>
        </div>
      </div>
    </AnimatedSection>
  );
}
