import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { CheckoutPage } from "@/frontend/pages/CheckoutPage";
import { getProducts } from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface CheckoutRouteProps {
  searchParams: Promise<{ store?: string }>;
}

export default async function CheckoutRoute({ searchParams }: CheckoutRouteProps) {
  const params = await searchParams;
  const storeSlug = typeof params.store === "string" ? params.store : undefined;
  const config = getSiteConfig(storeSlug);
  const products = getProducts();

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <CheckoutPage config={config} products={products} />
    </StoreShell>
  );
}
