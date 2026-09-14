import { ProductCard } from "@/frontend/components/store/ProductCard";
import { AnimatedSection } from "@/frontend/components/sections/AnimatedSection";
import type { SectionComponentProps } from "@/frontend/components/sections/types";
import { asNumber } from "@/frontend/utils/configValue";

interface FeaturedProductsProps {
  title?: string;
  limit?: number;
}

export function FeaturedProductsSection({ config, products, section, storeSlug }: SectionComponentProps) {
  const props = (section.props ?? {}) as FeaturedProductsProps;
  const limit = asNumber(props.limit, 6);
  const heading = typeof props.title === "string" ? props.title : "Featured Products";

  return (
    <AnimatedSection enabled={config.animations.enabled} delay={config.animations.sectionStagger * 2}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--mc-text)] sm:text-[32px]">{heading}</h2>
            <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
              Product cards are globally reusable and pull all values from data.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, limit).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={config.ecommerce.currency}
              storeSlug={storeSlug}
            />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
