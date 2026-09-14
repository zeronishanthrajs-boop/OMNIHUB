"use client";

import { useMemo, useState } from "react";
import { resolveSiteConfigFromJson } from "@/frontend/config/resolveSiteConfig";
import type { SiteConfig } from "@/frontend/types/site-config";

export function useSiteConfig(initialStore = "default", initialJson = ""): {
  storeSlug: string;
  setStoreSlug: (value: string) => void;
  configJson: string;
  setConfigJson: (value: string) => void;
  config: SiteConfig;
  error: string | null;
} {
  const [storeSlug, setStoreSlug] = useState(initialStore);
  const [configJson, setConfigJson] = useState(initialJson);

  const resolved = useMemo(
    () => resolveSiteConfigFromJson(storeSlug, configJson),
    [storeSlug, configJson]
  );

  return {
    storeSlug,
    setStoreSlug,
    configJson,
    setConfigJson,
    config: resolved.config,
    error: resolved.error
  };
}
