import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Expected a valid hex color");

const sectionSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().min(1),
    enabled: z.boolean().default(true),
    order: z.number().int().nonnegative().default(0),
    props: z.record(z.unknown()).optional()
  })
  .passthrough();

const paymentMethodSchema = z.enum([
  "credit_card",
  "upi",
  "paypal",
  "apple_pay",
  "google_pay",
  "bank_transfer"
]);

const customFieldSchema = z.enum(["company_name", "gst_number", "warranty_type", "bulk_order_notes"]);

export const siteConfigSchema = z
  .object({
    branding: z.object({
      siteName: z.string().min(1),
      logoUrl: z.string().min(1),
      faviconUrl: z.string().min(1),
      tagline: z.string().min(1)
    }),
    theme: z.object({
      primaryColor: hexColor,
      secondaryColor: hexColor,
      backgroundColor: hexColor,
      cardColor: hexColor,
      textColor: hexColor,
      textSecondaryColor: hexColor,
      borderColor: hexColor,
      hoverColor: hexColor,
      buttonRadius: z.number().min(0).max(48),
      shadow: z.string().min(1),
      darkMode: z.boolean(),
      variant: z.enum(["ice", "cloud", "nordic"])
    }),
    layout: z.object({
      navbarPosition: z.enum(["floating", "sticky", "static"]),
      heroAlignment: z.enum(["left", "center"]),
      sidebarEnabled: z.boolean(),
      footerStyle: z.enum(["minimal", "stacked", "columns"]),
      cardStyle: z.enum(["soft", "flat"]),
      maxWidth: z.string().min(1)
    }),
    sections: z.object({
      enableHero: z.boolean(),
      enableCategories: z.boolean(),
      enableFeaturedProducts: z.boolean(),
      enablePromoBanner: z.boolean(),
      enableTestimonials: z.boolean(),
      enableNewsletter: z.boolean()
    }),
    ecommerce: z.object({
      currency: z.string().min(1),
      taxRate: z.number().min(0).max(100),
      shippingText: z.string().min(1),
      paymentMethods: z.array(paymentMethodSchema),
      defaultCouponCode: z.string(),
      customFields: z.array(customFieldSchema)
    }),
    seo: z.object({
      metaTitle: z.string().min(1),
      metaDescription: z.string().min(1),
      keywords: z.array(z.string().min(1)),
      ogImage: z.string().min(1)
    }),
    socials: z.object({
      instagram: z.string(),
      facebook: z.string(),
      x: z.string(),
      youtube: z.string()
    }),
    pages: z.object({
      home: z.object({
        sections: z.array(sectionSchema)
      }),
      products: z.object({
        productsPerPage: z.number().int().min(1).max(60),
        defaultViewMode: z.enum(["grid", "list"]),
        defaultSort: z.enum(["featured", "price-asc", "price-desc", "rating-desc", "newest"])
      })
    }),
    animations: z.object({
      enabled: z.boolean(),
      sectionDuration: z.number().min(0).max(2),
      sectionStagger: z.number().min(0).max(1),
      hoverScale: z.number().min(1).max(1.2)
    }),
    featureFlags: z.object({
      mobileCartShortcut: z.boolean(),
      userReviews: z.boolean(),
      checkoutCoupon: z.boolean(),
      shippingCalculator: z.boolean(),
      wishlist: z.boolean(),
      productVariants: z.boolean(),
      advancedSearch: z.boolean(),
      socialSharing: z.boolean(),
      advancedAnalytics: z.boolean(),
      multiLanguage: z.boolean(),
      customIntegrations: z.boolean(),
      darkModeToggle: z.boolean(),
      multiCurrency: z.boolean()
    })
  })
  .passthrough();

export type SiteConfigSchema = z.infer<typeof siteConfigSchema>;
