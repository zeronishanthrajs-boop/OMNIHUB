"use client";

import { useState, useEffect, useRef } from "react";
import {
  sectionKeys,
  featureKeys,
  storeFeatureMatrix,
  type FeatureKey,
  type SectionKey
} from "@/frontend/config/featureMatrix";
import { resolveSiteConfig } from "@/frontend/config/resolveSiteConfig";
import type { DeepPartial } from "@/frontend/types/common";
import type { DynamicSection, PaymentMethod, SiteConfig } from "@/frontend/types/site-config";
import { getStoreFeaturePolicy } from "@/frontend/utils/featureGuard";
import { getPaymentLabel } from "@/frontend/utils/payment";

type TabKey =
  | "ai-generator"
  | "branding"
  | "theme"
  | "layout"
  | "sections"
  | "features"
  | "content"
  | "seo"
  | "ecommerce";

const tabOrder: { key: TabKey; label: string }[] = [
  { key: "ai-generator", label: "✨ AI Vibe Gen" },
  { key: "branding", label: "Branding" },
  { key: "theme", label: "Theme" },
  { key: "layout", label: "Layout" },
  { key: "sections", label: "Sections" },
  { key: "features", label: "Features" },
  { key: "content", label: "Content" },
  { key: "seo", label: "SEO" },
  { key: "ecommerce", label: "Ecommerce" }
];

const sectionConfigMap: Record<SectionKey, keyof SiteConfig["sections"]> = {
  hero: "enableHero",
  categories: "enableCategories",
  featuredProducts: "enableFeaturedProducts",
  testimonials: "enableTestimonials",
  newsletter: "enableNewsletter",
  promoBanner: "enablePromoBanner"
};

const sectionLabelMap: Record<SectionKey, string> = {
  hero: "Hero",
  categories: "Categories",
  featuredProducts: "Featured Products",
  testimonials: "Testimonials",
  newsletter: "Newsletter",
  promoBanner: "Promo Banner"
};

const featureLabelMap: Record<FeatureKey, string> = {
  mobileCartShortcut: "Mobile Cart Shortcut",
  userReviews: "User Reviews",
  checkoutCoupon: "Checkout Coupon",
  shippingCalculator: "Shipping Calculator",
  wishlist: "Wishlist",
  productVariants: "Product Variants",
  advancedSearch: "Advanced Search",
  socialSharing: "Social Sharing",
  advancedAnalytics: "Advanced Analytics",
  multiLanguage: "Multi Language",
  customIntegrations: "Custom Integrations",
  darkModeToggle: "Dark Mode Toggle",
  multiCurrency: "Multi-Currency Switcher"
};

function setDeepValue<T extends Record<string, unknown>>(
  target: T,
  path: string[],
  value: unknown
): T {
  if (path.length === 0) {
    return target;
  }

  const [head, ...rest] = path;

  if (rest.length === 0) {
    return { ...target, [head]: value } as T;
  }

  const currentChild = (target[head] as Record<string, unknown> | undefined) ?? {};
  return {
    ...target,
    [head]: setDeepValue(currentChild, rest, value)
  } as T;
}

function findSection(config: SiteConfig, type: string): DynamicSection | undefined {
  return config.pages.home.sections.find((section) => section.type === type);
}

interface AdminConfigPageProps {
  initialStoreSlug?: string;
  allowStoreSwitch?: boolean;
}

function upsertSectionEnabled(
  sections: DynamicSection[],
  sectionType: SectionKey,
  enabled: boolean
): DynamicSection[] {
  const existing = sections.find((section) => section.type === sectionType);
  if (!existing) {
    return [...sections, { type: sectionType, enabled, order: sections.length + 1 }];
  }

  return sections.map((section) =>
    section.type === sectionType ? { ...section, enabled } : section
  );
}

function toggleArrayValue<T extends string>(values: T[], value: T, checked: boolean): T[] {
  if (checked) {
    return values.includes(value) ? values : [...values, value];
  }

  return values.filter((item) => item !== value);
}

export function AdminConfigPage({
  initialStoreSlug = "default",
  allowStoreSwitch = false
}: AdminConfigPageProps) {
  const [storeSlug, setStoreSlug] = useState(initialStoreSlug);
  const [overrides, setOverrides] = useState<DeepPartial<SiteConfig>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("ai-generator");
  const [jsonDraft, setJsonDraft] = useState("{}");
  const [jsonError, setJsonError] = useState("");

  // AI Vibe Gen states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiLogs, setAiLogs] = useState<{ text: string; type: "info" | "success" | "warn" | "system" }[]>([]);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logic for agent log console
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiLogs]);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleAiGenerate = async (presetPrompt?: string) => {
    const activePrompt = presetPrompt || aiPrompt;
    if (!activePrompt.trim() || isGenerating) return;

    if (presetPrompt) {
      setAiPrompt(presetPrompt);
    }

    setIsGenerating(true);
    setAiLogs([]);

    const prompt = activePrompt.toLowerCase();
    const tempLogs: { text: string; type: "info" | "success" | "warn" | "system" }[] = [];

    const addLog = (text: string, type: "info" | "success" | "warn" | "system" = "info") => {
      const timestamp = new Date().toLocaleTimeString();
      tempLogs.push({ text: `[${timestamp}] ${text}`, type });
      setAiLogs([...tempLogs]);
    };

    addLog("🤖 MorphCart Core Design Agent v2.0 activated.", "system");
    await delay(300);

    addLog(`🔍 Analyzing concept prompt: "${activePrompt.substring(0, 70)}${activePrompt.length > 70 ? "..." : ""}"`, "info");
    await delay(400);

    // Style vibe matching
    let detectedVibe = "Custom Theme (AI Generated)";
    let primary = "#8B5CF6"; // Cosmic purple
    let secondary = "#C084FC";
    let background = "#F5F3FF";
    let text = "#1E1B4B";
    let tagline = "AI Architected Storefront Preset";
    let siteName = config.branding.siteName || "MorphCart Store";
    let heroAlignment: "left" | "center" = "center";
    let navbarPosition: "floating" | "sticky" | "static" = "floating";

    if (
      prompt.includes("cyberpunk") ||
      prompt.includes("synthwave") ||
      prompt.includes("neon") ||
      prompt.includes("futuristic") ||
      prompt.includes("scifi")
    ) {
      detectedVibe = "Cyberpunk Neon Grid";
      primary = "#FF007F"; // Hot neon pink
      secondary = "#00F0FF"; // Cyber cyan
      background = "#08090F"; // Dark outer space
      text = "#FFFFFF";
      tagline = "Welcome to the neon-drenched shopping experience.";
      heroAlignment = "center";
      navbarPosition = "floating";
    } else if (
      prompt.includes("nordic") ||
      prompt.includes("minimalist") ||
      prompt.includes("scandinavian") ||
      prompt.includes("clean") ||
      prompt.includes("serene")
    ) {
      detectedVibe = "Nordic Clean Slate";
      primary = "#2D3748"; // Minimalist charcoal
      secondary = "#E2E8F0"; // Pale grey border
      background = "#FFFFFF"; // Snow white
      text = "#1A202C"; // Slate black
      tagline = "Simplistic designs. Timeless utility.";
      heroAlignment = "left";
      navbarPosition = "sticky";
    } else if (
      prompt.includes("streetwear") ||
      prompt.includes("urban") ||
      prompt.includes("hypebeast") ||
      prompt.includes("dark") ||
      prompt.includes("grunge") ||
      prompt.includes("industrial")
    ) {
      detectedVibe = "Streetwear High-Contrast";
      primary = "#FF4500"; // Safety Orange
      secondary = "#1A1A1A"; // Heavy gray-black
      background = "#121212"; // Jet Black
      text = "#F5F5F5";
      tagline = "Limited curated drops. Authentic streetwear.";
      heroAlignment = "center";
      navbarPosition = "sticky";
    } else {
      // Color-name heuristics
      if (prompt.includes("blue") || prompt.includes("ocean") || prompt.includes("marine")) {
        detectedVibe = "Oceanic Clean Blue";
        primary = "#2563EB";
        secondary = "#BFDBFE";
        background = "#F8FAFC";
        text = "#1E293B";
      } else if (prompt.includes("green") || prompt.includes("emerald") || prompt.includes("nature")) {
        detectedVibe = "Emerald Forest Eco";
        primary = "#059669";
        secondary = "#A7F3D0";
        background = "#F0FDF4";
        text = "#064E3B";
      } else if (prompt.includes("amber") || prompt.includes("gold") || prompt.includes("luxury")) {
        detectedVibe = "Luxury Amber Gold";
        primary = "#D97706";
        secondary = "#FDE68A";
        background = "#FFFBEB";
        text = "#78350F";
      }
    }

    addLog(`✨ Concept Extracted: Vibe matched is "${detectedVibe}".`, "success");
    await delay(300);

    // custom site name match (e.g. call the store "Alpha Ware")
    const storeNameMatch = activePrompt.match(/(?:call|name)\s+(?:the\s+)?(?:store|site)\s+"([^"]+)"/i) ||
                           activePrompt.match(/(?:call|name)\s+(?:the\s+)?(?:store|site)\s+([a-zA-Z0-9\s]+?)(?=\s+with|\s+and|\s+enable|$)/i);
    if (storeNameMatch && storeNameMatch[1]) {
      siteName = storeNameMatch[1].trim();
      addLog(`✍️ Detected custom Store Name parameter: "${siteName}"`, "success");
    }

    addLog("🛡️ Accessing tenant license policy. Analyzing Super-Admin feature matrix...", "info");
    await delay(400);

    const newFeatureFlags: Record<string, boolean> = {};
    const newSectionsFlags: Record<string, boolean> = {};

    const checkFeature = (key: string, label: string, synonyms: string[]) => {
      const requested = synonyms.some(syn => prompt.includes(syn));
      if (requested) {
        if (policy.features[key as FeatureKey]) {
          newFeatureFlags[key] = true;
          addLog(`✅ Capability: [Feature] "${label}" matches input. Matrix authorized.`, "success");
        } else {
          addLog(`❌ Capability: [Feature] "${label}" requested but BLOCKED by Super-Admin Matrix policies for tier "${storeSlug}". Upgrade required.`, "warn");
        }
      }
    };

    const checkSection = (key: string, configKey: string, label: string, synonyms: string[]) => {
      const requested = synonyms.some(syn => prompt.includes(syn));
      if (requested) {
        if (policy.sections[key as SectionKey]) {
          newSectionsFlags[configKey] = true;
          addLog(`✅ Capability: [Layout Section] "${label}" matches input. Matrix authorized.`, "success");
        } else {
          addLog(`❌ Capability: [Layout Section] "${label}" requested but BLOCKED by Super-Admin Matrix policies for tier "${storeSlug}".`, "warn");
        }
      }
    };

    // Evaluate features
    checkFeature("wishlist", "Wishlist System", ["wishlist", "favorite", "heart", "save"]);
    checkFeature("checkoutCoupon", "Checkout Coupon Panel", ["coupon", "promo", "discount", "code", "voucher"]);
    checkFeature("userReviews", "User Reviews", ["reviews", "feedback", "rating", "comments", "stars"]);
    checkFeature("shippingCalculator", "Shipping Rate Calculator", ["shipping", "calculator", "postcode", "delivery"]);
    checkFeature("multiCurrency", "Dynamic Multi-Currency Switcher", ["currency", "multi-currency", "convert", "global", "prices"]);
    checkFeature("darkModeToggle", "Dark/Light Mode Toggle Switcher", ["dark mode", "light mode", "theme toggle"]);

    // Evaluate sections
    checkSection("testimonials", "enableTestimonials", "Customer Testimonials Accordion", ["testimonials", "quotes", "reviews block"]);
    checkSection("promoBanner", "enablePromoBanner", "Ticking Promo Announcement Bar", ["promo banner", "announcement", "banner row"]);
    checkSection("newsletter", "enableNewsletter", "Newsletter Subscription Block", ["newsletter", "subscribe", "email sign"]);
    checkSection("categories", "enableCategories", "Collections Category grid", ["categories", "collections"]);

    await delay(400);

    addLog("🎨 Interpolating theme presets & compiling custom design system parameters...", "info");
    await delay(300);

    // Assemble overrides
    const newOverrides: DeepPartial<SiteConfig> = {
      branding: {
        siteName,
        tagline
      },
      theme: {
        primaryColor: primary,
        secondaryColor: secondary,
        backgroundColor: background,
        textColor: text,
        variant: detectedVibe.includes("Nordic") ? "nordic" : "ice"
      },
      layout: {
        heroAlignment,
        navbarPosition
      }
    };

    if (Object.keys(newFeatureFlags).length > 0) {
      newOverrides.featureFlags = newFeatureFlags;
    }
    if (Object.keys(newSectionsFlags).length > 0) {
      newOverrides.sections = newSectionsFlags;
    }

    // Adapt home page section objects
    const homeSections = [...config.pages.home.sections];
    let sectionsModified = false;

    if (newSectionsFlags.enableTestimonials !== undefined) {
      const idx = homeSections.findIndex((s) => s.type === "testimonials");
      if (idx !== -1) {
        homeSections[idx] = { ...homeSections[idx], enabled: newSectionsFlags.enableTestimonials };
        sectionsModified = true;
      }
    }
    if (newSectionsFlags.enablePromoBanner !== undefined) {
      const idx = homeSections.findIndex((s) => s.type === "promoBanner");
      if (idx !== -1) {
        homeSections[idx] = { ...homeSections[idx], enabled: newSectionsFlags.enablePromoBanner };
        sectionsModified = true;
      }
    }
    if (newSectionsFlags.enableNewsletter !== undefined) {
      const idx = homeSections.findIndex((s) => s.type === "newsletter");
      if (idx !== -1) {
        homeSections[idx] = { ...homeSections[idx], enabled: newSectionsFlags.enableNewsletter };
        sectionsModified = true;
      }
    }

    if (sectionsModified) {
      newOverrides.pages = {
        home: {
          sections: homeSections
        }
      };
    }

    addLog("💾 Writing dynamic JSON configuration patch...", "info");
    await delay(400);

    setOverrides(newOverrides);
    setJsonDraft(JSON.stringify(newOverrides, null, 2));
    
    addLog("✨ Agent successfully compiled storefront overrides. View the canvas updates live!", "system");
    setIsGenerating(false);
  };

  const policy = getStoreFeaturePolicy(storeSlug);
  const config = resolveSiteConfig(storeSlug, overrides);
  const availableStores = Object.keys(storeFeatureMatrix);
  const enabledSections = sectionKeys.filter((sectionKey) => policy.sections[sectionKey]);
  const enabledFeatures = featureKeys.filter((featureKey) => policy.features[featureKey]);

  const onFieldChange = (path: string[], value: unknown) => {
    setOverrides((current) => setDeepValue(current as Record<string, unknown>, path, value));
  };

  const onSectionToggle = (sectionType: SectionKey, enabled: boolean) => {
    const sectionField = sectionConfigMap[sectionType];
    onFieldChange(["sections", sectionField], enabled);

    setOverrides((current) => {
      const baseSections =
        (current.pages?.home?.sections as DynamicSection[] | undefined) ?? config.pages.home.sections;
      const nextSections = upsertSectionEnabled(baseSections, sectionType, enabled);
      return setDeepValue(
        current as Record<string, unknown>,
        ["pages", "home", "sections"],
        nextSections
      ) as DeepPartial<SiteConfig>;
    });
  };

  const onFeatureToggle = (featureKey: FeatureKey, enabled: boolean) => {
    onFieldChange(["featureFlags", featureKey], enabled);
  };

  const onPaymentMethodToggle = (paymentMethod: PaymentMethod, checked: boolean) => {
    const nextValues = toggleArrayValue(config.ecommerce.paymentMethods, paymentMethod, checked);
    onFieldChange(["ecommerce", "paymentMethods"], nextValues.length > 0 ? nextValues : [paymentMethod]);
  };

  const onCustomFieldToggle = (
    customField: SiteConfig["ecommerce"]["customFields"][number],
    checked: boolean
  ) => {
    const nextValues = toggleArrayValue(config.ecommerce.customFields, customField, checked);
    onFieldChange(["ecommerce", "customFields"], nextValues);
  };

  const onSectionPropChange = (sectionType: string, propName: string, value: unknown) => {
    setOverrides((current) => {
      const baseSections = (current.pages?.home?.sections as DynamicSection[] | undefined) ??
        config.pages.home.sections;
      const sectionExists = baseSections.some((section) => section.type === sectionType);
      const nextSections = sectionExists
        ? baseSections.map((section) =>
            section.type === sectionType
              ? {
                  ...section,
                  props: {
                    ...(section.props ?? {}),
                    [propName]: value
                  }
                }
              : section
          )
        : [
            ...baseSections,
            {
              type: sectionType,
              enabled: true,
              order: baseSections.length + 1,
              props: { [propName]: value }
            }
          ];

      return setDeepValue(
        current as Record<string, unknown>,
        ["pages", "home", "sections"],
        nextSections
      ) as DeepPartial<SiteConfig>;
    });
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft) as DeepPartial<SiteConfig>;
      setOverrides(parsed);
      setJsonError("");
    } catch {
      setJsonError("Invalid JSON payload");
    }
  };

  const resetOverrides = () => {
    setOverrides({});
    setJsonDraft("{}");
    setJsonError("");
  };

  const heroSection = findSection(config, "hero");
  const newsletterSection = findSection(config, "newsletter");
  const promoSection = findSection(config, "promoBanner");

  return (
    <div className="space-y-6">
      <header className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-5 shadow-soft">
        <h1 className="text-2xl font-semibold text-[var(--mc-text)]">Admin Config Panel</h1>
        <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
          This page acts as your frontend control plane. All storefront variants render from config.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-4 shadow-soft sm:p-5">
          <div className="grid gap-3 sm:grid-cols-[0.5fr_0.5fr]">
            {allowStoreSwitch ? (
              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Store Preset
                </span>
                <select
                  value={storeSlug}
                  onChange={(event) => setStoreSlug(event.target.value)}
                  className="h-11 w-full rounded-full border border-[var(--mc-border)] px-4 text-sm outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
                >
                  {availableStores.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Store Slug
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--mc-text)]">{storeSlug}</p>
              </div>
            )}

            <button
              type="button"
              onClick={resetOverrides}
              className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm font-semibold text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:text-[var(--mc-primary)] sm:mt-6"
            >
              Reset Overrides
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabOrder.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-wide transition duration-200 ${
                  activeTab === tab.key
                    ? "border-[var(--mc-primary)] bg-[var(--mc-secondary)] text-[var(--mc-text)]"
                    : "border-[var(--mc-border)] text-[var(--mc-text-muted)] hover:border-[var(--mc-primary)]/40 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "ai-generator" ? (
            <div className="space-y-5">
              <div className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-slate-50/50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="text-sm font-semibold text-[var(--mc-text)]">AI Agent Core Design System</h3>
                </div>
                <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                  Provide high-level merchant directives. The AI Agent will dynamically parse instructions, check authorization restrictions, and inject theme overrides instantly into the store config context.
                </p>
              </div>

              {/* Vibe Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Quick-Start Vibe Prompts
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleAiGenerate(
                        'Create a high-contrast Cyberpunk watch store named "NeonHour" with neon, wishlist, dark mode, reviews, and a promo banner enabled'
                      )
                    }
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--mc-border)] bg-white px-3 py-1.5 text-xs text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:bg-[var(--mc-secondary)]/10 disabled:opacity-50"
                  >
                    <span>🌃</span> Cyberpunk Vibe
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAiGenerate(
                        'Generate a minimalist Nordic furniture store named "HyggeCove" with clean, wishlist, and newsletter block enabled'
                      )
                    }
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--mc-border)] bg-white px-3 py-1.5 text-xs text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:bg-[var(--mc-secondary)]/10 disabled:opacity-50"
                  >
                    <span>🏔️</span> Nordic Vibe
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAiGenerate(
                        'Set up a bold streetwear apparel store named "DropBox" with streetwear, multi-currency, wishlist, and reviews enabled'
                      )
                    }
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--mc-border)] bg-white px-3 py-1.5 text-xs text-[var(--mc-text)] transition hover:border-[var(--mc-primary)] hover:bg-[var(--mc-secondary)]/10 disabled:opacity-50"
                  >
                    <span>⚡</span> Streetwear Vibe
                  </button>
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Merchant Directives / Natural Language Prompt
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., Build a cyberpunk store with neon colors, name the store CyberTech, and enable wishlist, dark mode, and a multi-currency switcher..."
                  disabled={isGenerating}
                  className="min-h-[100px] w-full rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-3 text-sm text-[var(--mc-text)] focus:border-[var(--mc-primary)] focus:outline-none"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleAiGenerate()}
                disabled={isGenerating || !aiPrompt.trim()}
                className={`relative flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-soft transition duration-300 ${
                  isGenerating || !aiPrompt.trim()
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-[1.01] hover:shadow-lg active:scale-95"
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Synthesizing Storefront...
                  </>
                ) : (
                  <>
                    <span>✨</span> Synthesize Vibe & Features
                  </>
                )}
              </button>

              {/* Monospace terminal console logging the execution state */}
              {aiLogs.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                    Agent Logic Terminal Logs
                  </span>
                  <div className="relative rounded-[var(--mc-radius)] border border-slate-800 bg-slate-950 p-4 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        agent-execution-stream
                      </span>
                    </div>
                    <div className="max-h-56 min-h-[140px] overflow-y-auto space-y-1 font-mono text-xs text-slate-300">
                      {aiLogs.map((log, index) => {
                        let colorClass = "text-slate-300";
                        if (log.type === "success") colorClass = "text-emerald-400";
                        if (log.type === "warn") colorClass = "text-amber-400";
                        if (log.type === "system") colorClass = "text-cyan-400 font-semibold";
                        return (
                          <div key={index} className={`whitespace-pre-wrap ${colorClass}`}>
                            {log.text}
                          </div>
                        );
                      })}
                      <div ref={consoleEndRef} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "branding" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={config.branding.siteName}
                onChange={(event) => onFieldChange(["branding", "siteName"], event.target.value)}
                placeholder="Site Name"
                className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
              />
              <input
                value={config.branding.tagline}
                onChange={(event) => onFieldChange(["branding", "tagline"], event.target.value)}
                placeholder="Tagline"
                className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
              />
              <input
                value={config.branding.logoUrl}
                onChange={(event) => onFieldChange(["branding", "logoUrl"], event.target.value)}
                placeholder="Logo URL"
                className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm disabled:bg-slate-50"
                disabled={!policy.editableConfig.canEditLogo}
              />
              <input
                value={config.branding.faviconUrl}
                onChange={(event) => onFieldChange(["branding", "faviconUrl"], event.target.value)}
                placeholder="Favicon URL"
                className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm disabled:bg-slate-50"
                disabled={!policy.editableConfig.canEditLogo}
              />
            </div>
          ) : null}

          {activeTab === "theme" ? (
            policy.editableConfig.canEditColors ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Primary
                  <input
                    type="color"
                    value={config.theme.primaryColor}
                    onChange={(event) => onFieldChange(["theme", "primaryColor"], event.target.value)}
                    className="h-11 w-full rounded-full border border-[var(--mc-border)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Secondary
                  <input
                    type="color"
                    value={config.theme.secondaryColor}
                    onChange={(event) => onFieldChange(["theme", "secondaryColor"], event.target.value)}
                    className="h-11 w-full rounded-full border border-[var(--mc-border)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Background
                  <input
                    type="color"
                    value={config.theme.backgroundColor}
                    onChange={(event) => onFieldChange(["theme", "backgroundColor"], event.target.value)}
                    className="h-11 w-full rounded-full border border-[var(--mc-border)]"
                  />
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Text
                  <input
                    type="color"
                    value={config.theme.textColor}
                    onChange={(event) => onFieldChange(["theme", "textColor"], event.target.value)}
                    className="h-11 w-full rounded-full border border-[var(--mc-border)]"
                  />
                </label>
              </div>
            ) : (
              <p className="text-sm text-[var(--mc-text-muted)]">
                Theme editing is not available for your current plan.
              </p>
            )
          ) : null}

          {activeTab === "layout" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={config.layout.navbarPosition}
                onChange={(event) => onFieldChange(["layout", "navbarPosition"], event.target.value)}
                className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                disabled={!policy.editableConfig.canEditNavItems}
              >
                <option value="floating">Floating Navbar</option>
                <option value="sticky">Sticky Navbar</option>
                <option value="static">Static Navbar</option>
              </select>
              <select
                value={config.layout.heroAlignment}
                onChange={(event) => onFieldChange(["layout", "heroAlignment"], event.target.value)}
                className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                disabled={!policy.editableConfig.canEditNavItems}
              >
                <option value="left">Hero Left</option>
                <option value="center">Hero Center</option>
              </select>
            </div>
          ) : null}

          {activeTab === "sections" ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {enabledSections.map((sectionKey) => (
                  <label
                    key={sectionKey}
                    className="flex items-center justify-between rounded-full border border-[var(--mc-border)] px-4 py-2 text-sm"
                  >
                    <span>{sectionLabelMap[sectionKey]}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(config.sections[sectionConfigMap[sectionKey]])}
                      onChange={(event) => onSectionToggle(sectionKey, event.target.checked)}
                    />
                  </label>
                ))}
              </div>
              <p className="text-xs text-[var(--mc-text-muted)]">
                Hidden from this plan:{" "}
                {sectionKeys
                  .filter((sectionKey) => !policy.sections[sectionKey])
                  .map((sectionKey) => sectionLabelMap[sectionKey])
                  .join(", ") || "None"}
              </p>
            </div>
          ) : null}

          {activeTab === "features" ? (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {enabledFeatures.map((featureKey) => (
                  <label
                    key={featureKey}
                    className="flex items-center justify-between rounded-full border border-[var(--mc-border)] px-4 py-2 text-sm"
                  >
                    <span>{featureLabelMap[featureKey]}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(config.featureFlags[featureKey])}
                      onChange={(event) => onFeatureToggle(featureKey, event.target.checked)}
                    />
                  </label>
                ))}
              </div>
              <p className="text-xs text-[var(--mc-text-muted)]">
                Disabled by developer matrix:{" "}
                {featureKeys
                  .filter((featureKey) => !policy.features[featureKey])
                  .map((featureKey) => featureLabelMap[featureKey])
                  .join(", ") || "None"}
              </p>
            </div>
          ) : null}

          {activeTab === "content" ? (
            <div className="grid gap-3">
              {policy.sections.hero ? (
                <>
                  <input
                    value={(heroSection?.props?.heroTitle as string) ?? ""}
                    onChange={(event) => onSectionPropChange("hero", "heroTitle", event.target.value)}
                    placeholder="Hero Title"
                    className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                  />
                  <input
                    value={(heroSection?.props?.heroSubtitle as string) ?? ""}
                    onChange={(event) => onSectionPropChange("hero", "heroSubtitle", event.target.value)}
                    placeholder="Hero Subtitle"
                    className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                  />
                </>
              ) : null}
              {policy.sections.promoBanner ? (
                <input
                  value={(promoSection?.props?.title as string) ?? ""}
                  onChange={(event) => onSectionPropChange("promoBanner", "title", event.target.value)}
                  placeholder="Promo Title"
                  className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                />
              ) : null}
              {policy.sections.newsletter ? (
                <input
                  value={(newsletterSection?.props?.title as string) ?? ""}
                  onChange={(event) => onSectionPropChange("newsletter", "title", event.target.value)}
                  placeholder="Newsletter Title"
                  className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                />
              ) : null}
            </div>
          ) : null}

          {activeTab === "seo" ? (
            policy.editableConfig.canEditSeo ? (
              <div className="grid gap-3">
                <input
                  value={config.seo.metaTitle}
                  onChange={(event) => onFieldChange(["seo", "metaTitle"], event.target.value)}
                  placeholder="Meta Title"
                  className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                />
                <input
                  value={config.seo.metaDescription}
                  onChange={(event) => onFieldChange(["seo", "metaDescription"], event.target.value)}
                  placeholder="Meta Description"
                  className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                />
              </div>
            ) : (
              <p className="text-sm text-[var(--mc-text-muted)]">
                SEO editing is not available for your current plan.
              </p>
            )
          ) : null}

          {activeTab === "ecommerce" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={config.ecommerce.currency}
                  onChange={(event) => onFieldChange(["ecommerce", "currency"], event.target.value)}
                  placeholder="Currency"
                  className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                />
                <input
                  value={String(config.ecommerce.taxRate)}
                  onChange={(event) =>
                    onFieldChange(["ecommerce", "taxRate"], Number(event.target.value) || 0)
                  }
                  placeholder="Tax Rate"
                  className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm"
                />
                <input
                  value={config.ecommerce.shippingText}
                  onChange={(event) => onFieldChange(["ecommerce", "shippingText"], event.target.value)}
                  placeholder="Shipping Text"
                  className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm sm:col-span-2"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Payment Methods
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {policy.paymentMethods.map((method) => (
                    <label
                      key={method}
                      className="flex items-center justify-between rounded-full border border-[var(--mc-border)] px-4 py-2 text-sm"
                    >
                      <span>{getPaymentLabel(method)}</span>
                      <input
                        type="checkbox"
                        checked={config.ecommerce.paymentMethods.includes(method)}
                        onChange={(event) => onPaymentMethodToggle(method, event.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
                  Custom Fields
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {policy.customFields.map((field) => (
                    <label
                      key={field}
                      className="flex items-center justify-between rounded-full border border-[var(--mc-border)] px-4 py-2 text-sm"
                    >
                      <span>{field}</span>
                      <input
                        type="checkbox"
                        checked={config.ecommerce.customFields.includes(field)}
                        onChange={(event) => onCustomFieldToggle(field, event.target.checked)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-4 shadow-soft sm:p-5">
          <h2 className="text-lg font-semibold text-[var(--mc-text)]">Live Config JSON</h2>
          <textarea
            value={jsonDraft}
            onChange={(event) => setJsonDraft(event.target.value)}
            className="h-52 w-full rounded-[var(--mc-radius)] border border-[var(--mc-border)] p-3 font-mono text-xs text-[var(--mc-text)]"
          />
          <button
            type="button"
            onClick={applyJson}
            className="h-10 w-full rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--mc-primary)" }}
          >
            Apply JSON Overrides
          </button>
          {jsonError ? <p className="text-xs text-red-500">{jsonError}</p> : null}

          <div className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-[var(--mc-secondary)]/15 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
              Resolved Snapshot
            </p>
            <pre className="mt-2 max-h-64 overflow-auto text-[11px] text-[var(--mc-text-muted)]">
              {JSON.stringify(
                {
                  branding: config.branding,
                  theme: config.theme,
                  layout: config.layout,
                  sections: config.sections,
                  ecommerce: config.ecommerce
                },
                null,
                2
              )}
            </pre>
          </div>
        </aside>
      </section>
    </div>
  );
}
