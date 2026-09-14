import type { SiteConfig } from "@/frontend/types/site-config";

export const defaultSiteConfig: SiteConfig = {
  branding: {
    siteName: "Flipy",
    logoUrl: "/logo.svg",
    faviconUrl: "/favicon.ico",
    tagline: "One Engine. Infinite Storefronts."
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
    buttonRadius: 16,
    shadow: "0 4px 20px rgba(0,0,0,0.04)",
    darkMode: false,
    variant: "ice"
  },
  layout: {
    navbarPosition: "floating",
    heroAlignment: "left",
    sidebarEnabled: false,
    footerStyle: "minimal",
    cardStyle: "soft",
    maxWidth: "1240px"
  },
  sections: {
    enableHero: true,
    enableCategories: true,
    enableFeaturedProducts: true,
    enablePromoBanner: true,
    enableTestimonials: true,
    enableNewsletter: true
  },
  ecommerce: {
    currency: "USD",
    taxRate: 8,
    shippingText: "Free shipping above $99",
    paymentMethods: ["credit_card", "upi"],
    defaultCouponCode: "WELCOME10",
    customFields: ["company_name"]
  },
  seo: {
    metaTitle: "MorphCart",
    metaDescription: "Config-driven ecommerce storefront engine",
    keywords: ["ecommerce", "storefront", "config", "white-label"],
    ogImage: "/og-default.png"
  },
  socials: {
    instagram: "#",
    facebook: "#",
    x: "#",
    youtube: "#"
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
    },
    products: {
      productsPerPage: 9,
      defaultViewMode: "grid",
      defaultSort: "featured"
    }
  },
  animations: {
    enabled: true,
    sectionDuration: 0.45,
    sectionStagger: 0.08,
    hoverScale: 1.02
  },
  featureFlags: {
    mobileCartShortcut: false,
    userReviews: false,
    checkoutCoupon: true,
    shippingCalculator: false,
    wishlist: false,
    productVariants: true,
    advancedSearch: false,
    socialSharing: true,
    advancedAnalytics: false,
    multiLanguage: false,
    customIntegrations: false,
    darkModeToggle: false,
    multiCurrency: false
  }
};


