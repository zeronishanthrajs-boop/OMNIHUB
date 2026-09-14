import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { AdminConfigPage } from "@/frontend/pages/AdminConfigPage";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface AdminConfigRouteProps {
  searchParams: Promise<{ store?: string }>;
}

export default async function AdminConfigRoute({ searchParams }: AdminConfigRouteProps) {
  const params = await searchParams;
  const storeSlug = typeof params.store === "string" ? params.store : undefined;
  const config = getSiteConfig(storeSlug);

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <AdminConfigPage initialStoreSlug={storeSlug ?? "default"} allowStoreSwitch />
    </StoreShell>
  );
}
