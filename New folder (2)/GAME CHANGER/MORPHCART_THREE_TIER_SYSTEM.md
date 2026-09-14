# MorphCart Three-Tier Architecture & Feature Governance System
## Complete Technical Reference & Upgrade Prompt

---

## Table of Contents
1. Architecture Overview
2. Three Layers Explained
3. Data Flow & Synchronization
4. Key Files & Responsibilities
5. Feature Availability Control
6. Rule Book Addition: Rule 11
7. Upgrade Prompt (Reusable)
8. Deployment Strategy
9. Debugging Guide
10. Success Metrics

---

## Architecture Overview

### Core Concept
MorphCart Day 2 introduces a three-tier role-based system for multi-tenant storefronts with developer-controlled feature availability.

**Tagline:** "One Engine. Infinite Storefronts. Developer-Controlled Features."

### Visual Architecture

```text
+---------------------------------------------------------+
| LAYER 1: DEVELOPER FEATURE MATRIX (Super-Admin)        |
| src/frontend/config/featureMatrix.ts                    |
| Controls feature availability per store                 |
+------------------+--------------------------------------+
                   |
                   v
+---------------------------------------------------------+
| LAYER 2: OWNER CONFIGURATION DASHBOARD (Store Admin)   |
| src/app/admin/[storeSlug]/config/page.tsx              |
| Owner customizes only enabled features                  |
+------------------+--------------------------------------+
                   |
                   v
+---------------------------------------------------------+
| LAYER 3: CLIENT STOREFRONT (End Customer)              |
| src/app/[storeSlug]/page.tsx                            |
| Read-only rendered storefront                           |
+---------------------------------------------------------+
```

---

## Three Layers Explained

### Layer 1: Developer Feature Matrix
- Location: `src/frontend/config/featureMatrix.ts`
- Role: global source of truth for availability of sections, feature flags, payment methods, custom fields, editable config.
- Update model: code-driven (`git push` -> deploy).

### Layer 2: Owner Configuration Dashboard
- Location: `src/app/admin/[storeSlug]/config/page.tsx`
- Role: owner customizes only what developer enabled.
- Constraint: owner cannot enable disabled features.
- UX: disabled items should be hidden or clearly unavailable.

### Layer 3: Client Storefront
- Location: `src/app/[storeSlug]/page.tsx`
- Role: render final storefront.
- Formula:

```text
Displayed Feature = Dev Enabled AND Owner Enabled/Configured AND Not Hidden
```

---

## Data Flow & Synchronization

### Scenario A: Dev disables testimonials for default store
1. Update `featureMatrix.ts`.
2. Commit and push.
3. Deploy.
4. Owner dashboard no longer exposes testimonials.
5. Client storefront stops rendering testimonials.

### Scenario B: Owner customizes enabled feature
1. Owner updates config in `/admin/[storeSlug]/config`.
2. Save.
3. Client storefront reflects changes immediately for that store.

### Scenario C: Dev adds premium feature
1. Add feature in `premium-store` matrix entry.
2. Ship supporting UI.
3. Premium owner sees feature; default owner does not.

---
## Key Files & Responsibilities

| File | Purpose | Who Touches | Frequency | Read/Write |
|------|---------|-------------|-----------|-----------|
| `featureMatrix.ts` | Feature availability matrix per store | Developer | Weekly/Monthly | Write |
| `defaults.ts` | Base store config | Owner (via admin UI) | Daily | Write |
| `sampleStores.ts` | Preset templates | Developer | Setup | Write |
| `resolveSiteConfig.ts` | Merge logic | Developer | Rare | Read |
| `siteConfig.schema.ts` | Zod validation | Developer | Rare | Read |
| `featureGuard.ts` | Filtering utilities | Developer | Per feature | Read |
| `OwnerDashboard.tsx` | Owner UI | Developer | Per UI change | Read |
| `DynamicSectionRenderer.tsx` | Section render with guards | Developer | Rare | Read |
| `StoreShell.tsx` | Theme/layout shell | Developer | Rare | Read |

---

## Feature Availability Control

### 1. Sections
Examples: `hero`, `categories`, `featuredProducts`, `testimonials`, `newsletter`, `promoBanner`.

### 2. Feature flags
Examples: `mobileCartShortcut`, `userReviews`, `checkoutCoupon`, `shippingCalculator`, `wishlist`, `productVariants`, `advancedSearch`, `socialSharing`.

### 3. Payment methods
Examples: `credit_card`, `upi`, `paypal`, `apple_pay`, `google_pay`, `bank_transfer`.

### 4. Custom fields
Examples: `company_name`, `gst_number`, `warranty_type`, `bulk_order_notes`.

### 5. Editable config permissions
Examples: `can_edit_logo`, `can_edit_colors`, `can_edit_nav_items`, `can_edit_footer`, `can_edit_seo`.

---

## Rule Book Addition: Rule 11

### Rule 11.1: Single source of truth
All feature toggles must live in `src/frontend/config/featureMatrix.ts`.

### Rule 11.2: Owner cannot override developer matrix
Owner can only customize within enabled features.

### Rule 11.3: Matrix changes cascade automatically
Changes should propagate to owner dashboard and storefront after deploy.

### Rule 11.4: New store setup checklist
- Add store entry to `storeFeatureMatrix`.
- Add base/preset config.
- Define sections/features/payments/custom fields/editable config.
- Test owner visibility and storefront rendering.

### Rule 11.5: Naming consistency
Use camelCase for feature keys across matrix, guards, and UI.

### Rule 11.6: Validation checklist
- Section types exist in registry.
- Payment methods exist in checkout.
- Store slugs consistent.
- Boolean values explicit.

### Rule 11.7: Comments and rationale
Comment why a feature is disabled/enabled for a tier when needed.

---

## Upgrade Prompt (Reusable)

Use this context in future AI planning chats:
- Project: MorphCart v0.2
- 3-tier model: Developer -> Owner -> Client
- Matrix file: `src/frontend/config/featureMatrix.ts`
- Guard file: `src/frontend/utils/featureGuard.ts`
- Renderer file: `src/frontend/components/engine/DynamicSectionRenderer.tsx`
- Rule 11 constraints apply.

Template task format:

```text
I am working on MorphCart three-tier architecture.
Specific task: [YOUR TASK]
Constraints:
- Feature toggles only in featureMatrix.ts
- Owner cannot override disabled features
- No hardcoded store-tier logic in components
- Keep naming consistent in camelCase
Expected output:
- Files to change
- Sequence of implementation
- Validation and rollout checklist
```

---
## Deployment Strategy

### Code deployment (developer feature changes)
1. Modify `src/frontend/config/featureMatrix.ts`.
2. Commit and push.
3. Auto-deploy.
4. Verify owner dashboard and storefront behavior.

### Config deployment (owner customization)
1. Owner edits `/admin/[storeSlug]/config`.
2. Save config.
3. Storefront updates for that store.

---

## Debugging Guide

### Common issue patterns
1. Owner sees disabled toggle:
- Check matrix entry.
- Check guard usage in owner UI.
- Check slug consistency.

2. Storefront renders disabled section:
- Check renderer guard path.
- Check section type name mismatch.

3. Owner toggle has no effect:
- Check merge chain (defaults -> preset -> override).
- Check persistence layer/local state.

4. Changes not reflecting:
- Verify deployment status.
- Hard refresh / cache clear.

5. Slug not found:
- Check matrix key exists.
- Confirm route param.
- Fallback to `default` if needed.

6. Payment method missing:
- Check matrix payment list.
- Check checkout mapping support.

### Quick debug checklist
- Matrix key exists for store.
- Feature values are explicit booleans.
- No hardcoded tier checks in components.
- Console has no runtime errors.
- Correct storeSlug in URL.

---

## Success Metrics

### MVP metrics
- Feature changes propagate across all 3 layers quickly after deploy.
- Owner cannot enable developer-disabled features.
- Storefront strictly respects matrix + owner config.
- New store onboarding is fast and repeatable.
- No hardcoded tier logic in UI components.

### Scale metrics
- Fast config resolution.
- Fast deployment feedback loop.
- Low support issues on feature availability.

---

## Appendix

### Target file map
```text
src/
|- app/[storeSlug]/page.tsx
|- app/admin/[storeSlug]/config/page.tsx
`- frontend/
   |- config/featureMatrix.ts
   |- config/defaults.ts
   |- config/sampleStores.ts
   |- config/resolveSiteConfig.ts
   |- config/siteConfig.schema.ts
   |- utils/featureGuard.ts
   `- components/engine/DynamicSectionRenderer.tsx
```

### Command reference
```bash
npm install
npm run dev
npm run lint
npm run build
npm run start
```

### Glossary
- Developer: controls matrix.
- Owner: customizes enabled scope.
- Client: sees rendered storefront.
- Feature matrix: availability control plane.
- Feature guard: runtime filter utility.
- Cascading update: change flowing from developer layer to owner/client outcomes.

---

**Document Version:** 1.0
**Status:** Architecture reference + rollout checklist
