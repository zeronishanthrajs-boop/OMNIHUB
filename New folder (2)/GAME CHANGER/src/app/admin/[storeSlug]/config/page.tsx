import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { AdminConfigPage } from "@/frontend/pages/AdminConfigPage";
import { getSiteConfig } from "@/frontend/services/storefront.service";

interface AdminStoreConfigRouteProps {
  params: Promise<{ storeSlug: string }>;
}

export default async function AdminStoreConfigRoute({ params }: AdminStoreConfigRouteProps) {
  const routeParams = await params;
  const storeSlug = routeParams.storeSlug;
  const config = getSiteConfig(storeSlug);

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <AdminConfigPage initialStoreSlug={storeSlug} />
    </StoreShell>
  );
}
