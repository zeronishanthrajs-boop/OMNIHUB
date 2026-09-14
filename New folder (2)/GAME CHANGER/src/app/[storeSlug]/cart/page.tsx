import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { CartPage } from "@/frontend/pages/CartPage";
import { getProducts } from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface StorefrontCartRouteProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function StorefrontCartRoute({ params }: StorefrontCartRouteProps) {
  const routeParams = await params;
  const storeSlug = routeParams.storeSlug;
  const config = getSiteConfig(storeSlug);
  const products = getProducts();

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <CartPage config={config} products={products} storeSlug={storeSlug} />
    </StoreShell>
  );
}
