# MorphCart

One Engine. Infinite Storefronts.

MorphCart is a config-driven ecommerce frontend engine built with Next.js App Router.  
The same reusable renderer powers multiple storefront identities without changing component code.

## What Is Implemented

- Config-first architecture with:
  - strict `SiteConfig` types
  - Zod validation
  - deep fallback merge
  - store presets (`neocart`, `voguewear`, `pixelforge`, `nordichome`)
- Dynamic section engine:
  - section registry map
  - optional sections
  - unknown sections safely ignored
  - section ordering from config
- Core pages:
  - `/` home (dynamic section rendering)
  - `/products` listing (filters, sorting, search, grid/list, pagination)
  - `/products/[slug]` detail (gallery, reviews, add to cart, recommendations)
  - `/cart` (quantity controls, coupon, shipping, tax)
  - `/checkout` (address form, payment methods, order summary)
  - `/admin/config` (tabbed config editor + JSON overrides)
- Anti-break safeguards:
  - safe defaults for all config fields
  - schema validation fallback to defaults
  - section-level feature toggles
  - resilient cart storage parsing
- UI system aligned to PRD:
  - soft premium spacing
  - configurable colors via CSS variables
  - 12-column responsive layout patterns
  - subtle motion with Framer Motion

## Project Structure

```text
src/
├── app/
├── frontend/
│   ├── config/
│   ├── themes/
│   ├── layouts/
│   ├── components/
│   ├── registry/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── styles/
│   └── utils/
```

## Run Locally

```bash
npm install
npm run dev
```

Build and lint:

```bash
npm run lint
npm run build
```

## Store Presets

Default behavior:

- `/` uses `src/frontend/config/defaults.ts` directly.

Use query param `store` for presets:

- `/?store=neocart`
- `/?store=voguewear`
- `/?store=pixelforge`
- `/?store=nordichome`

All pages support the same query param (`/products?store=...`, `/cart?store=...`, etc).

## Next Steps (Phase 2+)

1. Persist config in PostgreSQL (store-level `config_json`).
2. Add authenticated admin APIs (JWT/Clerk/Firebase).
3. Move products/orders from mock service to backend.
4. Add media upload support (Cloudinary/S3).
5. Add multi-tenant store routing + custom domains.
