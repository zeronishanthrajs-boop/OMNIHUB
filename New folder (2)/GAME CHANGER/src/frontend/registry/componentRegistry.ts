import type { ComponentType } from "react";
import { CategoriesSection } from "@/frontend/components/sections/CategoriesSection";
import { FeaturedProductsSection } from "@/frontend/components/sections/FeaturedProductsSection";
import { HeroSection } from "@/frontend/components/sections/HeroSection";
import { NewsletterSection } from "@/frontend/components/sections/NewsletterSection";
import { PromoBannerSection } from "@/frontend/components/sections/PromoBannerSection";
import { TestimonialsSection } from "@/frontend/components/sections/TestimonialsSection";
import type { SectionComponentProps } from "@/frontend/components/sections/types";

export const componentRegistry: Record<string, ComponentType<SectionComponentProps>> = {
  hero: HeroSection,
  categories: CategoriesSection,
  featuredProducts: FeaturedProductsSection,
  promoBanner: PromoBannerSection,
  testimonials: TestimonialsSection,
  newsletter: NewsletterSection
};
