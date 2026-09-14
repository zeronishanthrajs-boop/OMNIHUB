import type { CSSProperties } from "react";
import type { SiteConfig } from "@/frontend/types/site-config";

export function buildThemeVariables(config: SiteConfig): CSSProperties {
  return {
    "--mc-bg": config.theme.backgroundColor,
    "--mc-card": config.theme.cardColor,
    "--mc-primary": config.theme.primaryColor,
    "--mc-secondary": config.theme.secondaryColor,
    "--mc-text": config.theme.textColor,
    "--mc-text-muted": config.theme.textSecondaryColor,
    "--mc-border": config.theme.borderColor,
    "--mc-hover": config.theme.hoverColor,
    "--mc-shadow": config.theme.shadow,
    "--mc-radius": `${config.theme.buttonRadius}px`,
    "--mc-max-width": config.layout.maxWidth
  } as CSSProperties;
}
