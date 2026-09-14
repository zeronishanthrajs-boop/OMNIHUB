import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { ProductListingPage } from "@/frontend/pages/ProductListingPage";
import { getProducts } from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface StorefrontProductsRouteProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function StorefrontProductsRoute({ params }: StorefrontProductsRouteProps) {
  const routeParams = await params;
  const storeSlug = routeParams.storeSlug;
  const config = getSiteConfig(storeSlug);
  const products = getProducts();

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <div className="space-y-5">
        <header>
          <h1 className="text-3xl font-semibold text-[var(--mc-text)]">Product Listing</h1>
          <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
            Filters, sorting, search, view mode toggle, and pagination are handled by the universal
            store engine.
          </p>
        </header>
        <ProductListingPage config={config} products={products} storeSlug={storeSlug} />
      </div>
    </StoreShell>
  );
}
