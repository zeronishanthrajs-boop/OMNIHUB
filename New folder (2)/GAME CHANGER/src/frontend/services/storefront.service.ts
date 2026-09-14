import { resolveSiteConfig } from "@/frontend/config/resolveSiteConfig";
import type { DeepPartial } from "@/frontend/types/common";
import type { SiteConfig } from "@/frontend/types/site-config";

export function getSiteConfig(
  storeSlug = process.env.NEXT_PUBLIC_DEFAULT_STORE ?? "default",
  userConfig?: DeepPartial<SiteConfig>
): SiteConfig {
  return resolveSiteConfig(storeSlug, userConfig);
}
