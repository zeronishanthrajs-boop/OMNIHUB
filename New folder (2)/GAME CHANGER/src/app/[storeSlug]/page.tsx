import { DynamicSectionRenderer } from "@/frontend/components/engine/DynamicSectionRenderer";
import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { getCategories, getFeaturedProducts } from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface StorefrontHomeRouteProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function StorefrontHomeRoute({ params }: StorefrontHomeRouteProps) {
  const routeParams = await params;
  const storeSlug = routeParams.storeSlug;
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
