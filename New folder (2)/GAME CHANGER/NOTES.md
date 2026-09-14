# MorphCart Notes

This document is a full technical reference for the folder:

`C:\Users\nisha\Music\GAME CHANGER`

It explains architecture, file responsibilities, behavior, and how to work safely with the config-driven frontend engine.

---

## 1. Project Identity

- Project: `MorphCart`
- Tagline: `One Engine. Infinite Storefronts.`
- Current runtime mode:
  - Home/default storefront reads from `src/frontend/config/defaults.ts`.
  - Optional presets are applied only when `?store=<preset>` is provided.

---

## 2. Tech Stack

- Framework: Next.js `16.1.6` (App Router)
- React: `19.2.4`
- Styling: Tailwind CSS `3.4.17`
- Animation: Framer Motion `11.13.1`
- Validation: Zod `3.24.1`
- Utility: `clsx`
- Language: TypeScript `5.9.3`
- Lint: ESLint `9` with `eslint-config-next`

Main config files:

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`

---

## 3. Scripts

From `package.json`:

- `npm run dev` -> starts Next.js dev server.
- `npm run build` -> production build.
- `npm run start` -> starts built production server.
- `npm run lint` -> ESLint checks.

Important behavior:

- In `dev`, source edits (like `defaults.ts`) are picked up quickly and visible on refresh.
- In `start` mode, code/config source changes need a new `build`.

---

## 4. Folder Structure (Purpose)

## `src/app/` (route layer)

- Thin route wrappers.
- Each route resolves site config and passes it into shared page/shell components.

## `src/frontend/config/` (engine inputs)

- Base defaults, presets, resolver logic, schema validation.

## `src/frontend/components/`

- Reusable UI blocks (layout, sections, store components).

## `src/frontend/registry/`

- Dynamic section type -> React component mapping.

## `src/frontend/pages/`

- Feature-heavy page implementations (listing/cart/checkout/admin).

## `src/frontend/hooks/`

- Cart + config hooks for client-side reactive state.

## `src/frontend/services/`

- Store config access + mock ecommerce dataset helpers.

## `src/frontend/utils/`

- Deep merge, cart storage, type-safe coercion helpers, formatting, section guards.

## `src/frontend/types/`

- Source of truth for config/data TypeScript contracts.

---

## 5. Runtime Architecture

Core flow:

1. Route loads config using `getSiteConfig(...)`.
2. `getSiteConfig` delegates to `resolveSiteConfig(...)`.
3. Resolver merges:
   - `defaultSiteConfig`
   - optional preset override (`?store=...`)
   - optional user override object
4. Resolver validates merged config using Zod schema.
5. `StoreShell` converts config values to CSS variables.
6. Home route uses `DynamicSectionRenderer`:
   - sorts section order,
   - skips disabled sections,
   - maps section type via registry,
   - safely ignores unknown section types.

This keeps frontend reusable and config-first.

---

## 6. Config System (Most Important)

### Primary base file

- `src/frontend/config/defaults.ts`

This is the foundational control plane:

- branding
- theme colors/shape/shadow
- layout behavior
- section toggles
- ecommerce settings
- SEO fields
- animation settings
- feature flags
- homepage section sequence

### Presets file

- `src/frontend/config/sampleStores.ts`

Contains store presets:

- `neocart`
- `voguewear`
- `pixelforge`
- `nordichome`

These only apply when explicitly selected with query param.

### Resolver file

- `src/frontend/config/resolveSiteConfig.ts`

Behavior:

- default slug is `"default"` (base defaults only)
- merges base + preset + user overrides
- validates final object via Zod
- falls back to `defaultSiteConfig` if validation fails
- supports JSON-override parsing with graceful error text

### Schema file

- `src/frontend/config/siteConfig.schema.ts`

Guards:

- hex color validation
- enum restrictions (layout modes, view modes, variants)
- bounds for numbers (tax, radius, animation duration, etc.)
- section object shape validation

---

## 7. Route Functionalities

## `/` Home (`src/app/page.tsx`)

- Uses `StoreShell`
- Renders config-defined homepage sections dynamically
- Uses featured products + derived categories

## `/products` (`src/app/products/page.tsx`)

- Search
- Category filter
- Sorting (featured, price asc/desc, rating, newest)
- Grid/list view toggle
- Pagination
- Optional sticky mobile cart shortcut (feature flag)

## `/products/[slug]` (`src/app/products/[slug]/page.tsx`)

- Product gallery
- Product details and price
- Add to cart
- Optional reviews
- Optional related recommendations
- Not-found handling for invalid slug

## `/cart` (`src/app/cart/page.tsx`)

- Quantity increase/decrease
- Remove line item
- Coupon logic (`defaultCouponCode` gives 10% discount)
- Shipping rule (`free above 99`, else 7.99)
- Tax calculation from config tax rate
- Final total calculation

## `/checkout` (`src/app/checkout/page.tsx`)

- Address form fields
- Payment method selector from config
- Live order summary
- Demo submission clears cart and shows success message

## `/admin/config` (`src/app/admin/config/page.tsx`)

- Client-side config control panel
- Tabs: Branding, Theme, Layout, Sections, Content, SEO, Ecommerce
- Store preset selector includes `Base Defaults (defaults.ts)`
- JSON override editor
- Live resolved snapshot preview
- Reset override button

Note: this admin currently updates only in-memory client state; no backend persistence yet.

---

## 8. Dynamic Section Engine

Registry:

- `src/frontend/registry/componentRegistry.ts`

Mapped section types:

- `hero`
- `categories`
- `featuredProducts`
- `promoBanner`
- `testimonials`
- `newsletter`

Renderer:

- `src/frontend/components/engine/DynamicSectionRenderer.tsx`

Safety rules:

- disabled section -> skipped
- unknown type -> skipped (no crash)
- sorting by `order`
- additional section-level guard via `sectionGuards.ts`

---

## 9. Layout & Theming

Layout shell:

- `src/frontend/components/layout/StoreShell.tsx`
- Applies CSS variables from config through `buildThemeVariables`.

Theme variable mapper:

- `src/frontend/themes/themeVariables.ts`

Variables include:

- `--mc-bg`
- `--mc-card`
- `--mc-primary`
- `--mc-secondary`
- `--mc-text`
- `--mc-text-muted`
- `--mc-border`
- `--mc-shadow`
- `--mc-radius`
- `--mc-max-width`

Navbar:

- Config-driven brand text.
- Position behavior from `layout.navbarPosition` (`floating/sticky/static`).

Footer:

- Shows configured branding, shipping text, tax rate, payment methods.

---

## 10. Cart System

Storage util:

- `src/frontend/utils/cartStorage.ts`

Details:

- localStorage key: `morphcart:cart`
- custom window event: `morphcart:cart-updated`
- sanitizes malformed storage data
- enforces min quantity `>= 1`

Hook:

- `src/frontend/hooks/useCart.ts`

Provides:

- `lineItems` with resolved product + per-line totals
- `subtotal`, `itemCount`
- actions: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`

`useCart` syncs on:

- custom cart event
- browser `storage` event

---

## 11. Data Layer (Current)

Mock catalog:

- `src/frontend/services/mockProducts.ts`

Contains:

- 12 mock products
- optional review map for select products
- helpers:
  - `getProducts`
  - `getFeaturedProducts`
  - `getProductBySlug`
  - `getRelatedProducts`
  - `getProductReviews`
  - `getCategories`

Config service:

- `src/frontend/services/storefront.service.ts`

Entry point:

- `getSiteConfig(storeSlug?, userConfig?)`

---

## 12. Types & Contracts

Config types:

- `src/frontend/types/site-config.ts`

Includes:

- `SiteConfig` root object
- nested blocks for branding/theme/layout/sections/ecommerce/seo/socials/pages/animations/featureFlags
- dynamic section shape

Store types:

- `src/frontend/types/store.ts`

Includes:

- `Product`
- `ProductReview`
- `CartLine`

Utility type:

- `src/frontend/types/common.ts` -> `DeepPartial<T>`

---

## 13. Utility Functions

- `deepMerge.ts`:
  - deep merges objects,
  - replaces arrays fully,
  - ignores `undefined` overrides.

- `configValue.ts`:
  - fallback-safe coercion helpers (`asString`, `asStringArray`, `asNumber`).

- `format.ts`:
  - currency formatting with safe fallback.

- `sectionGuards.ts`:
  - maps section type to global section toggle keys.

---

## 14. Styling Notes

- Tailwind custom extensions:
  - shadow `soft`
  - spacing tokens (`xs/sm/md/lg/xl`)
  - premium radius
  - content width token

- Global styles:
  - `src/app/globals.css`
  - defines base typography and resets
  - uses Inter + DM Sans from `src/app/layout.tsx`

---

## 15. SEO & Metadata

- Root metadata currently comes from:
  - `defaultSiteConfig.seo.metaTitle`
  - `defaultSiteConfig.seo.metaDescription`

File:

- `src/app/layout.tsx`

---

## 16. Current State Snapshot (as of now)

From `src/frontend/config/defaults.ts`:

- `branding.siteName` is currently `Flipy` (customized)
- `seo.metaTitle` is currently `MorphCart`

If you want them aligned, set both to the same value in `defaults.ts`.

---

## 17. Known Gaps / Future Work

Not yet implemented:

- backend/API persistence for config
- auth-protected admin API routes
- database-backed products/orders
- real payment gateway integration
- coupon catalog/rules engine
- robust server-side security (rate limit/input validation at API layer)

Current admin is a frontend-only prototype controller.

---

## 18. Useful Commands

Development:

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

---

## 19. Editing Guidance

If you want global frontend-wide changes first:

1. Edit `src/frontend/config/defaults.ts`.
2. Refresh browser in dev mode.

If you want store variants:

1. Edit `src/frontend/config/sampleStores.ts`.
2. Open with `?store=<preset>`.

If you want section behavior:

1. Adjust `pages.home.sections` in config.
2. Add/modify section components.
3. Update `componentRegistry.ts`.

---

## 20. Quick Functional Checklist

- Home section ordering is config-driven.
- Unknown section types do not crash rendering.
- Section toggles in config can disable blocks globally.
- Product listing supports search/filter/sort/view/pagination.
- Cart persists across refresh via localStorage.
- Checkout clears cart (demo flow).
- Admin panel can override config in real time client-side.
- Base route `/` follows `defaults.ts` values.

