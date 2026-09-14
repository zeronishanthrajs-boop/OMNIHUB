export type ThemeVariant = "ice" | "cloud" | "nordic";
export type NavbarPosition = "floating" | "sticky" | "static";
export type HeroAlignment = "left" | "center";
export type FooterStyle = "minimal" | "stacked" | "columns";
export type CardStyle = "soft" | "flat";
export type PaymentMethod =
  | "credit_card"
  | "upi"
  | "paypal"
  | "apple_pay"
  | "google_pay"
  | "bank_transfer";
export type CustomField = "company_name" | "gst_number" | "warranty_type" | "bulk_order_notes";

export interface DynamicSection {
  id?: string;
  type: string;
  enabled?: boolean;
  order?: number;
  props?: Record<string, unknown>;
}

export interface BrandingConfig {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  tagline: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  textSecondaryColor: string;
  borderColor: string;
  hoverColor: string;
  buttonRadius: number;
  shadow: string;
  darkMode: boolean;
  variant: ThemeVariant;
}

export interface LayoutConfig {
  navbarPosition: NavbarPosition;
  heroAlignment: HeroAlignment;
  sidebarEnabled: boolean;
  footerStyle: FooterStyle;
  cardStyle: CardStyle;
  maxWidth: string;
}

export interface SectionsConfig {
  enableHero: boolean;
  enableCategories: boolean;
  enableFeaturedProducts: boolean;
  enablePromoBanner: boolean;
  enableTestimonials: boolean;
  enableNewsletter: boolean;
}

export interface EcommerceConfig {
  currency: string;
  taxRate: number;
  shippingText: string;
  paymentMethods: PaymentMethod[];
  defaultCouponCode: string;
  customFields: CustomField[];
}

export interface SeoConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string;
}

export interface SocialConfig {
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
}

export interface HomePageConfig {
  sections: DynamicSection[];
}

export interface ProductPageConfig {
  productsPerPage: number;
  defaultViewMode: "grid" | "list";
  defaultSort: "featured" | "price-asc" | "price-desc" | "rating-desc" | "newest";
}

export interface PagesConfig {
  home: HomePageConfig;
  products: ProductPageConfig;
}

export interface AnimationsConfig {
  enabled: boolean;
  sectionDuration: number;
  sectionStagger: number;
  hoverScale: number;
}

export interface FeatureFlagsConfig {
  mobileCartShortcut: boolean;
  userReviews: boolean;
  checkoutCoupon: boolean;
  shippingCalculator: boolean;
  wishlist: boolean;
  productVariants: boolean;
  advancedSearch: boolean;
  socialSharing: boolean;
  advancedAnalytics: boolean;
  multiLanguage: boolean;
  customIntegrations: boolean;
  darkModeToggle: boolean;
  multiCurrency: boolean;
}

export interface SiteConfig {
  branding: BrandingConfig;
  theme: ThemeConfig;
  layout: LayoutConfig;
  sections: SectionsConfig;
  ecommerce: EcommerceConfig;
  seo: SeoConfig;
  socials: SocialConfig;
  pages: PagesConfig;
  animations: AnimationsConfig;
  featureFlags: FeatureFlagsConfig;
}
