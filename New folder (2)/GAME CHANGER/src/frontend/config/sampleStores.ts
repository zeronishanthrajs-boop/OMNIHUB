import type { DeepPartial } from "@/frontend/types/common";
import type { SiteConfig } from "@/frontend/types/site-config";

export const storeConfigOverrides: Record<string, DeepPartial<SiteConfig>> = {
  neocart: {
    branding: {
      siteName: "NeoCart",
      tagline: "Premium Electronics"
    },
    theme: {
      primaryColor: "#60A5FA",
      secondaryColor: "#CBD5E1",
      backgroundColor: "#F8FAFC",
      cardColor: "#FFFFFF",
      textColor: "#0F172A",
      textSecondaryColor: "#64748B",
      borderColor: "#E2E8F0",
      hoverColor: "#3B82F6",
      variant: "ice"
    },
    pages: {
      home: {
        sections: [
          { type: "hero", enabled: true, order: 1 },
          { type: "categories", enabled: true, order: 2 },
          { type: "featuredProducts", enabled: true, order: 3 },
          { type: "promoBanner", enabled: true, order: 4 },
          { type: "testimonials", enabled: true, order: 5 },
          { type: "newsletter", enabled: true, order: 6 }
        ]
      }
    }
  },
  voguewear: {
    branding: {
      siteName: "VogueWear",
      tagline: "Timeless fashion in motion"
    },
    theme: {
      primaryColor: "#1E293B",
      secondaryColor: "#D6D3D1",
      backgroundColor: "#FAF9F7",
      cardColor: "#FFFFFF",
      textColor: "#1C1917",
      textSecondaryColor: "#57534E",
      borderColor: "#E7E5E4",
      hoverColor: "#0F172A",
      variant: "nordic"
    }
  },
  pixelforge: {
    branding: {
      siteName: "PixelForge",
      tagline: "Gear built for gamers"
    },
    theme: {
      primaryColor: "#2563EB",
      secondaryColor: "#94A3B8",
      backgroundColor: "#F1F5F9",
      cardColor: "#FFFFFF",
      textColor: "#0F172A",
      textSecondaryColor: "#475569",
      borderColor: "#CBD5E1",
      hoverColor: "#1D4ED8",
      variant: "cloud"
    },
    featureFlags: {
      mobileCartShortcut: true,
      wishlist: true,
      darkModeToggle: true
    }
  },
  nordichome: {
    branding: {
      siteName: "NordicHome",
      tagline: "Calm furniture for modern living"
    },
    theme: {
      primaryColor: "#6B8FA3",
      secondaryColor: "#CDD7D6",
      backgroundColor: "#F7F6F2",
      cardColor: "#FFFFFF",
      textColor: "#27313A",
      textSecondaryColor: "#66727A",
      borderColor: "#DEE3E1",
      hoverColor: "#557789",
      variant: "nordic"
    },
    featureFlags: {
      wishlist: true
    }
  },
  "premium-store": {
    branding: {
      siteName: "Premium Store",
      tagline: "Advanced storefront capabilities enabled"
    },
    theme: {
      primaryColor: "#1E40AF",
      secondaryColor: "#BFDBFE",
      backgroundColor: "#F8FAFC",
      cardColor: "#FFFFFF",
      textColor: "#0F172A",
      textSecondaryColor: "#475569",
      borderColor: "#DBEAFE",
      hoverColor: "#1D4ED8",
      variant: "cloud"
    },
    featureFlags: {
      wishlist: true,
      darkModeToggle: true,
      multiCurrency: true
    }
  },
  "enterprise-store": {
    branding: {
      siteName: "Enterprise Store",
      tagline: "Full-suite commerce orchestration"
    },
    theme: {
      primaryColor: "#0F766E",
      secondaryColor: "#CCFBF1",
      backgroundColor: "#F0FDFA",
      cardColor: "#FFFFFF",
      textColor: "#134E4A",
      textSecondaryColor: "#0F766E",
      borderColor: "#99F6E4",
      hoverColor: "#0D9488",
      variant: "nordic"
    },
    featureFlags: {
      wishlist: true,
      darkModeToggle: true,
      multiCurrency: true
    }
  }
};
