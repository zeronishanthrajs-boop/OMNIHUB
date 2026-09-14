import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { storeFeatureMatrix } from "@/frontend/config/featureMatrix";
import { getSiteConfig } from "@/frontend/services/storefront.service";

export default function DeveloperFeatureMatrixPage() {
  const config = getSiteConfig("default");

  return (
    <StoreShell config={config}>
      <div className="space-y-5">
        <header>
          <h1 className="text-3xl font-semibold text-[var(--mc-text)]">Developer Feature Matrix</h1>
          <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
            Super-admin control plane for store-level feature governance.
          </p>
        </header>
        <pre className="overflow-auto rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-4 text-xs text-[var(--mc-text-muted)] shadow-soft">
          {JSON.stringify(storeFeatureMatrix, null, 2)}
        </pre>
      </div>
    </StoreShell>
  );
}
