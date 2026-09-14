import { defaultSiteConfig } from "@/frontend/config/defaults";
import { siteConfigSchema } from "@/frontend/config/siteConfig.schema";
import { storeConfigOverrides } from "@/frontend/config/sampleStores";
import type { DeepPartial } from "@/frontend/types/common";
import type { SiteConfig } from "@/frontend/types/site-config";
import { deepMerge } from "@/frontend/utils/deepMerge";
import { applyFeaturePolicyToConfig } from "@/frontend/utils/featureGuard";

function safeParseSiteConfig(config: SiteConfig): SiteConfig {
  const parsed = siteConfigSchema.safeParse(config);
  if (!parsed.success) {
    return defaultSiteConfig;
  }

  return parsed.data;
}

export function resolveSiteConfig(storeSlug = "default", userConfig?: DeepPartial<SiteConfig>): SiteConfig {
  const storePreset =
    storeSlug === "default" || !storeSlug ? {} : (storeConfigOverrides[storeSlug] ?? {});
  const mergedPreset = deepMerge(defaultSiteConfig, storePreset);
  const mergedUserConfig = deepMerge(mergedPreset, userConfig ?? {});
  return applyFeaturePolicyToConfig(safeParseSiteConfig(mergedUserConfig), storeSlug);
}

export function resolveSiteConfigFromJson(
  storeSlug: string,
  jsonText: string
): { config: SiteConfig; error: string | null } {
  if (!jsonText.trim()) {
    return { config: resolveSiteConfig(storeSlug), error: null };
  }

  try {
    const userConfig = JSON.parse(jsonText) as DeepPartial<SiteConfig>;
    const config = resolveSiteConfig(storeSlug, userConfig);
    return { config, error: null };
  } catch {
    return {
      config: resolveSiteConfig(storeSlug),
      error: "Invalid JSON. Showing fallback-safe storefront config."
    };
  }
}
