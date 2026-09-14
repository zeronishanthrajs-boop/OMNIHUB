import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { CartPage } from "@/frontend/pages/CartPage";
import { getProducts } from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface CartRouteProps {
  searchParams: Promise<{ store?: string }>;
}

export default async function CartRoute({ searchParams }: CartRouteProps) {
  const params = await searchParams;
  const storeSlug = typeof params.store === "string" ? params.store : undefined;
  const config = getSiteConfig(storeSlug);
  const products = getProducts();

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <CartPage config={config} products={products} storeSlug={storeSlug} />
    </StoreShell>
  );
}
