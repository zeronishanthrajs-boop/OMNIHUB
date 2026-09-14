import type { SiteConfig } from "@/frontend/types/site-config";

const sectionKeyMap: Record<string, keyof SiteConfig["sections"]> = {
  hero: "enableHero",
  categories: "enableCategories",
  featuredProducts: "enableFeaturedProducts",
  promoBanner: "enablePromoBanner",
  testimonials: "enableTestimonials",
  newsletter: "enableNewsletter"
};

export function isSectionEnabled(type: string, config: SiteConfig): boolean {
  const key = sectionKeyMap[type];
  if (!key) {
    return true;
  }

  return config.sections[key];
}
