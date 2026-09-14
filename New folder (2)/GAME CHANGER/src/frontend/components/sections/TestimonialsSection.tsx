import { AnimatedSection } from "@/frontend/components/sections/AnimatedSection";
import type { SectionComponentProps } from "@/frontend/components/sections/types";
import { asStringArray } from "@/frontend/utils/configValue";

const defaultTestimonials = [
  "The same frontend was reused for three different brands in two days.",
  "Theme switching feels instant and polished without touching component code.",
  "Our marketing team edits config values and launches new storefront moodboards safely."
];

export function TestimonialsSection({ config, section }: SectionComponentProps) {
  const props = section.props ?? {};
  const testimonials = asStringArray(props.testimonials, defaultTestimonials);

  return (
    <AnimatedSection enabled={config.animations.enabled} delay={config.animations.sectionStagger * 4}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--mc-text)] sm:text-[32px]">Testimonials</h2>
          <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
            Configurable quote cards for social proof modules.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item}
              className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-5 shadow-soft"
            >
              <p className="text-sm leading-7 text-[var(--mc-text-muted)]">“{item}”</p>
            </article>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
