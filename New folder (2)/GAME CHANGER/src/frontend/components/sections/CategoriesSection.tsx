import { AnimatedSection } from "@/frontend/components/sections/AnimatedSection";
import type { SectionComponentProps } from "@/frontend/components/sections/types";

export function CategoriesSection({ config, categories }: SectionComponentProps) {
  return (
    <AnimatedSection enabled={config.animations.enabled} delay={config.animations.sectionStagger}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--mc-text)] sm:text-[32px]">Categories</h2>
          <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
            Category labels are dynamic and can be replaced via product data or config payloads.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <div
              key={category}
              className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-4 text-center shadow-soft transition hover:-translate-y-1"
            >
              <p className="text-sm font-semibold text-[var(--mc-text)]">{category}</p>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
