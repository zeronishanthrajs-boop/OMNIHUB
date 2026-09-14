import { componentRegistry } from "@/frontend/registry/componentRegistry";
import type { SiteConfig } from "@/frontend/types/site-config";
import type { Product } from "@/frontend/types/store";
import { isSectionEnabled as isSectionAllowedByPolicy } from "@/frontend/utils/featureGuard";
import { isSectionEnabled as isSectionAllowedByConfig } from "@/frontend/utils/sectionGuards";

interface DynamicSectionRendererProps {
  config: SiteConfig;
  products: Product[];
  categories: string[];
  storeSlug?: string;
}

export function DynamicSectionRenderer({
  config,
  products,
  categories,
  storeSlug
}: DynamicSectionRendererProps) {
  const sections = [...config.pages.home.sections]
    .filter((section) => section.enabled ?? true)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-16">
      {sections.map((section, index) => {
        if (!isSectionAllowedByPolicy(storeSlug, section.type)) {
          return null;
        }

        if (!isSectionAllowedByConfig(section.type, config)) {
          return null;
        }

        const Component = componentRegistry[section.type];
        if (!Component) {
          return null;
        }

        return (
          <Component
            key={section.id ?? `${section.type}-${index}`}
            config={config}
            section={section}
            products={products}
            categories={categories}
            storeSlug={storeSlug}
          />
        );
      })}
    </div>
  );
}
