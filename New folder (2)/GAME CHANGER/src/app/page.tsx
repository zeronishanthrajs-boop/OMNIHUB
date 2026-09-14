import { DynamicSectionRenderer } from "@/frontend/components/engine/DynamicSectionRenderer";
import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { getCategories, getFeaturedProducts } from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface HomePageProps {
  searchParams: Promise<{ store?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const storeSlug = typeof params.store === "string" ? params.store : undefined;
  const config = getSiteConfig(storeSlug);
  const featuredProducts = getFeaturedProducts(8);
  const categories = getCategories();

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <DynamicSectionRenderer
        config={config}
        products={featuredProducts}
        categories={categories}
        storeSlug={storeSlug}
      />
    </StoreShell>
  );
}
