import type { DynamicSection, SiteConfig } from "@/frontend/types/site-config";
import type { Product } from "@/frontend/types/store";

export interface SectionComponentProps {
  config: SiteConfig;
  section: DynamicSection;
  products: Product[];
  categories: string[];
  storeSlug?: string;
}
