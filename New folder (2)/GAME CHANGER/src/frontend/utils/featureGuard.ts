import {
  editableConfigKeys,
  featureKeys,
  sectionKeys,
  storeFeatureMatrix,
  type EditableConfigKey,
  type FeatureKey,
  type SectionKey,
  type StoreFeaturePolicy
} from "@/frontend/config/featureMatrix";
import type { SiteConfig } from "@/frontend/types/site-config";

const DEFAULT_STORE_SLUG = "default";

function normalizeStoreSlug(storeSlug?: string): string {
  if (!storeSlug || storeSlug.trim().length === 0) {
    return DEFAULT_STORE_SLUG;
  }

  return storeSlug;
}

function mergeWithDefaultPolicy(policy: StoreFeaturePolicy): StoreFeaturePolicy {
  const base = storeFeatureMatrix[DEFAULT_STORE_SLUG];
  return {
    ...base,
    ...policy,
    sections: { ...base.sections, ...policy.sections },
    features: { ...base.features, ...policy.features },
    paymentMethods: [...policy.paymentMethods],
    customFields: [...policy.customFields],
    editableConfig: { ...base.editableConfig, ...policy.editableConfig }
  };
}

export function getStoreFeaturePolicy(storeSlug?: string): StoreFeaturePolicy {
  const normalized = normalizeStoreSlug(storeSlug);
  const policy = storeFeatureMatrix[normalized] ?? storeFeatureMatrix[DEFAULT_STORE_SLUG];
  return mergeWithDefaultPolicy(policy);
}

export function getEnabledSections(storeSlug?: string): SectionKey[] {
  const policy = getStoreFeaturePolicy(storeSlug);
  return sectionKeys.filter((key) => policy.sections[key]);
}

export function isSectionEnabled(storeSlug: string | undefined, section: string): boolean {
  const policy = getStoreFeaturePolicy(storeSlug);
  if (!sectionKeys.includes(section as SectionKey)) {
    return false;
  }

  return policy.sections[section as SectionKey];
}

export function getEnabledFeatures(storeSlug?: string): FeatureKey[] {
  const policy = getStoreFeaturePolicy(storeSlug);
  return featureKeys.filter((key) => policy.features[key]);
}

export function isFeatureEnabled(storeSlug: string | undefined, feature: FeatureKey): boolean {
  return getStoreFeaturePolicy(storeSlug).features[feature];
}

export function getAllowedPaymentMethods(storeSlug?: string) {
  return getStoreFeaturePolicy(storeSlug).paymentMethods;
}

export function getAllowedCustomFields(storeSlug?: string) {
  return getStoreFeaturePolicy(storeSlug).customFields;
}

export function getEditableConfigKeys(storeSlug?: string): EditableConfigKey[] {
  const policy = getStoreFeaturePolicy(storeSlug);
  return editableConfigKeys.filter((key) => policy.editableConfig[key]);
}

export function canEditConfigField(storeSlug: string | undefined, key: EditableConfigKey): boolean {
  return getStoreFeaturePolicy(storeSlug).editableConfig[key];
}

export function applyFeaturePolicyToConfig(config: SiteConfig, storeSlug?: string): SiteConfig {
  const policy = getStoreFeaturePolicy(storeSlug);

  const nextSections = config.pages.home.sections.filter((section) =>
    isSectionEnabled(storeSlug, section.type)
  );

  const featureFlags = { ...config.featureFlags };
  for (const key of featureKeys) {
    featureFlags[key] = Boolean(config.featureFlags[key] && policy.features[key]);
  }

  return {
    ...config,
    sections: {
      ...config.sections,
      enableHero: Boolean(config.sections.enableHero && policy.sections.hero),
      enableCategories: Boolean(config.sections.enableCategories && policy.sections.categories),
      enableFeaturedProducts: Boolean(config.sections.enableFeaturedProducts && policy.sections.featuredProducts),
      enablePromoBanner: Boolean(config.sections.enablePromoBanner && policy.sections.promoBanner),
      enableTestimonials: Boolean(config.sections.enableTestimonials && policy.sections.testimonials),
      enableNewsletter: Boolean(config.sections.enableNewsletter && policy.sections.newsletter)
    },
    ecommerce: {
      ...config.ecommerce,
      paymentMethods: config.ecommerce.paymentMethods.filter((method) =>
        policy.paymentMethods.includes(method)
      ),
      customFields: config.ecommerce.customFields.filter((field) => policy.customFields.includes(field))
    },
    pages: {
      ...config.pages,
      home: {
        ...config.pages.home,
        sections: nextSections
      }
    },
    featureFlags
  };
}
