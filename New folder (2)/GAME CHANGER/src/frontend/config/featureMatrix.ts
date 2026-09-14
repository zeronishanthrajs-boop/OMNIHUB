import type { CustomField, PaymentMethod } from "@/frontend/types/site-config";

export const sectionKeys = [
  "hero",
  "categories",
  "featuredProducts",
  "testimonials",
  "newsletter",
  "promoBanner"
] as const;

export const featureKeys = [
  "mobileCartShortcut",
  "userReviews",
  "checkoutCoupon",
  "shippingCalculator",
  "wishlist",
  "productVariants",
  "advancedSearch",
  "socialSharing",
  "advancedAnalytics",
  "multiLanguage",
  "customIntegrations",
  "darkModeToggle",
  "multiCurrency"
] as const;


export const editableConfigKeys = [
  "canEditLogo",
  "canEditColors",
  "canEditNavItems",
  "canEditFooter",
  "canEditSeo",
  "canEditCustomCss"
] as const;

export type SectionKey = (typeof sectionKeys)[number];
export type FeatureKey = (typeof featureKeys)[number];
export type EditableConfigKey = (typeof editableConfigKeys)[number];

export interface StoreFeaturePolicy {
  sections: Record<SectionKey, boolean>;
  features: Record<FeatureKey, boolean>;
  paymentMethods: PaymentMethod[];
  customFields: CustomField[];
  editableConfig: Record<EditableConfigKey, boolean>;
}

const defaultPolicy: StoreFeaturePolicy = {
  sections: {
    hero: true,
    categories: true,
    featuredProducts: true,
    testimonials: false,
    newsletter: false,
    promoBanner: true
  },
  features: {
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
  },
  paymentMethods: ["credit_card", "upi"],
  customFields: ["company_name"],
  editableConfig: {
    canEditLogo: true,
    canEditColors: true,
    canEditNavItems: false,
    canEditFooter: false,
    canEditSeo: true,
    canEditCustomCss: false
  }
};

export const storeFeatureMatrix: Record<string, StoreFeaturePolicy> = {
  default: defaultPolicy,
  neocart: defaultPolicy,
  voguewear: {
    ...defaultPolicy,
    sections: {
      ...defaultPolicy.sections,
      newsletter: true
    },
    features: {
      ...defaultPolicy.features,
      shippingCalculator: true
    },
    editableConfig: {
      ...defaultPolicy.editableConfig,
      canEditFooter: true
    }
  },
  pixelforge: {
    ...defaultPolicy,
    sections: {
      ...defaultPolicy.sections,
      testimonials: true,
      newsletter: true
    },
    features: {
      ...defaultPolicy.features,
      mobileCartShortcut: true,
      userReviews: true,
      shippingCalculator: true,
      advancedSearch: true,
      wishlist: true,
      darkModeToggle: true
    },
    paymentMethods: ["credit_card", "upi", "paypal"],
    customFields: ["company_name", "warranty_type"],
    editableConfig: {
      ...defaultPolicy.editableConfig,
      canEditNavItems: true,
      canEditFooter: true
    }
  },
  nordichome: {
    ...defaultPolicy,
    sections: {
      ...defaultPolicy.sections,
      testimonials: true,
      newsletter: true
    },
    features: {
      ...defaultPolicy.features,
      userReviews: true,
      shippingCalculator: true,
      wishlist: true
    },
    editableConfig: {
      ...defaultPolicy.editableConfig,
      canEditFooter: true
    }
  },
  "premium-store": {
    sections: {
      hero: true,
      categories: true,
      featuredProducts: true,
      testimonials: true,
      newsletter: true,
      promoBanner: true
    },
    features: {
      mobileCartShortcut: true,
      userReviews: true,
      checkoutCoupon: true,
      shippingCalculator: true,
      wishlist: true,
      productVariants: true,
      advancedSearch: true,
      socialSharing: true,
      advancedAnalytics: false,
      multiLanguage: false,
      customIntegrations: false,
      darkModeToggle: true,
      multiCurrency: true
    },
    paymentMethods: ["credit_card", "upi", "paypal"],
    customFields: ["company_name", "gst_number"],
    editableConfig: {
      canEditLogo: true,
      canEditColors: true,
      canEditNavItems: true,
      canEditFooter: true,
      canEditSeo: true,
      canEditCustomCss: false
    }
  },
  "enterprise-store": {
    sections: {
      hero: true,
      categories: true,
      featuredProducts: true,
      testimonials: true,
      newsletter: true,
      promoBanner: true
    },
    features: {
      mobileCartShortcut: true,
      userReviews: true,
      checkoutCoupon: true,
      shippingCalculator: true,
      wishlist: true,
      productVariants: true,
      advancedSearch: true,
      socialSharing: true,
      advancedAnalytics: true,
      multiLanguage: true,
      customIntegrations: true,
      darkModeToggle: true,
      multiCurrency: true
    },
    paymentMethods: ["credit_card", "upi", "paypal", "apple_pay", "google_pay", "bank_transfer"],
    customFields: ["company_name", "gst_number", "warranty_type", "bulk_order_notes"],
    editableConfig: {
      canEditLogo: true,
      canEditColors: true,
      canEditNavItems: true,
      canEditFooter: true,
      canEditSeo: true,
      canEditCustomCss: true
    }
  }
};
