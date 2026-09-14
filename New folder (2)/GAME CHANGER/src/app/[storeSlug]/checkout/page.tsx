import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { CheckoutPage } from "@/frontend/pages/CheckoutPage";
import { getProducts } from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface StorefrontCheckoutRouteProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function StorefrontCheckoutRoute({ params }: StorefrontCheckoutRouteProps) {
  const routeParams = await params;
  const storeSlug = routeParams.storeSlug;
  const config = getSiteConfig(storeSlug);
  const products = getProducts();

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <CheckoutPage config={config} products={products} />
    </StoreShell>
  );
}
