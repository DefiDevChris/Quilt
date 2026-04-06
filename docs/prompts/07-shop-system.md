# Workstream 7: Shop System (Build Hidden, Admin Toggle to Enable)

## Goal

Build the fabric shop system end-to-end but keep it hidden from users until an admin explicitly enables it via a toggle in the admin dashboard.

## Context

The project is a Next.js 16 quilt design app at `/home/chrishoran/Desktop/Quilt`. Read `CLAUDE.md` for architecture. The shop page at `src/app/(public)/shop/page.tsx` already exists but references schema columns that don't exist yet.

## Current State

- `src/app/(public)/shop/page.tsx` — exists but has TS errors (references `pricePerYard`, `inStock`, `shopifyProductId`, `shopifyVariantId`, `isPurchasable` which don't exist on the fabrics table)
- `src/db/schema/fabrics.ts` — fabrics table exists with color/manufacturer/collection columns but no shop columns
- Fabric library is functional in the studio (2,764 solids from 16 manufacturers)
- No shopping cart or checkout system exists yet

## Tasks

### 1. Add Shop Columns to Fabrics Schema

Update `src/db/schema/fabrics.ts` to add:

```typescript
pricePerYard: decimal('price_per_yard', { precision: 10, scale: 2 }),
inStock: boolean('in_stock').default(false),
isPurchasable: boolean('is_purchasable').default(false),
shopifyProductId: varchar('shopify_product_id', { length: 255 }),
shopifyVariantId: varchar('shopify_variant_id', { length: 255 }),
```

All nullable/optional — existing fabrics won't have shop data until configured.

Generate a migration: `npm run db:generate`

### 2. Create Shop Feature Toggle

**Admin settings table** — Add a `siteSettings` table (or use an existing config mechanism):

```typescript
// src/db/schema/siteSettings.ts
export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value'),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});
```

**Admin toggle endpoint** — `POST /api/admin/settings`:
- Body: `{ key: 'shop_enabled', value: true/false }`
- Requires admin role
- Type-to-confirm guard: request must include `confirm: 'ENABLE SHOP'` string

**Admin dashboard UI** — Add a "Shop" section to the admin panel:
- Toggle switch for "Enable Shop"
- When clicking enable, shows a confirmation modal: "Type ENABLE SHOP to confirm"
- Shows current status (enabled/disabled)

### 3. Conditional Shop Tab in Header

Update the main navigation header to conditionally show a "Shop" tab:

- Create a server component or API call that checks `siteSettings` for `shop_enabled`
- If enabled: show "Shop" link in the public navigation header
- If disabled: no shop link anywhere in the UI
- The `/shop` route itself should also check the setting and show a 404 or "Coming Soon" if disabled

### 4. Build the Shop Page

Update `src/app/(public)/shop/page.tsx`:

**Layout:**
- Public route (no auth required to browse)
- Grid of fabric cards with filtering sidebar
- Filters: manufacturer, color family, value (light/medium/dark), price range, in-stock only
- Search bar
- Sort: name, price, newest

**Fabric cards show:**
- Fabric swatch (colored square from hex value)
- Name and manufacturer
- Price per yard
- "In Stock" / "Out of Stock" badge
- "Add to Cart" button (if in stock and purchasable)

### 5. Shopping Cart / Shopping List

**`src/stores/cartStore.ts`** — Zustand store for the cart:

```typescript
interface CartItem {
  fabricId: string;
  fabricName: string;
  hex: string;
  manufacturer: string;
  pricePerYard: number;
  quantity: number;           // in yards (0.25 increments)
}

interface CartStoreState {
  items: CartItem[];
  addItem: (fabric: CartItem) => void;
  removeItem: (fabricId: string) => void;
  updateQuantity: (fabricId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}
```

**Cart UI:**
- Slide-out cart panel (triggered by cart icon in header)
- Shows items with quantity adjusters (¼ yard increments)
- Subtotal
- "Checkout" button (future Shopify integration) or "Copy List" button
- Cart persists in localStorage

### 6. Studio Integration

When the shop is enabled, integrate fabrics into the design studio:

**QuiltCorgi Fabrics in Studio:**
- In the fabric library panel, add a "QuiltCorgi Shop" section showing purchasable fabrics
- These are the same fabrics from the shop, filtered to `isPurchasable: true`
- When selecting a QuiltCorgi fabric for a piece, show a small "Shop" badge

**Add to Cart from Studio:**
- When a QuiltCorgi fabric is assigned to a piece, show an "Add to Shopping List" action
- Opens a mini-modal: "Add [Fabric Name] to your shopping list?" with quantity selector
- Can also calculate needed yardage from the piece dimensions and add that amount

**Preview Modal:**
- When hovering/clicking a QuiltCorgi fabric in the studio, show a preview modal with:
  - Large swatch
  - Fabric name, manufacturer, collection
  - Price per yard
  - "Open in Shop" button (opens `/shop` in new tab, scrolled to that fabric)
  - "Add to Cart" button

### 7. Admin Fabric Management

Add shop-specific fields to the admin fabric management:

- In the admin panel, allow setting `pricePerYard`, `inStock`, `isPurchasable` for any fabric
- Bulk toggle: "Mark all [manufacturer] as purchasable"
- Import from Shopify (future): endpoint to sync product data from Shopify API

### 8. API Endpoints

**`GET /api/shop/fabrics`** — Public endpoint for shop browsing:
- Only returns fabrics where `isPurchasable = true`
- Supports filters: manufacturer, colorFamily, value, minPrice, maxPrice, inStock
- Includes shop-specific fields (price, stock status)

**`GET /api/shop/settings`** — Public endpoint to check if shop is enabled:
- Returns `{ enabled: boolean }`
- Used by the header component to conditionally show the shop tab

## Architecture Notes

- The shop is a public route — no auth required to browse
- Cart is client-side only (localStorage + Zustand) — no cart table in DB
- The shop toggle is a simple boolean in `siteSettings` — no complex feature flag system
- Shopify integration is a future concern — for now, just store product/variant IDs and have a "Copy List" or manual checkout flow
- Don't break the existing fabric library — shop columns are all nullable
- Follow the glassmorphic design system for all shop UI

## Verification

```bash
npm run type-check    # 0 errors
npm run build         # succeeds
npm run db:generate   # migration generates cleanly
```

Test manually:
- Admin disables shop → no "Shop" tab visible, `/shop` shows 404/coming-soon
- Admin enables shop (with type-to-confirm) → "Shop" tab appears in header
- Browse shop → fabric grid loads with filters
- Add fabric to cart → cart panel shows item
- In studio, QuiltCorgi fabrics appear in fabric library
- Click "Open in Shop" → opens shop page in new tab
