# Online Store (cart, favourites, coupons, PhonePe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers favourite products, build a cart, apply a coupon and pay with PhonePe for limited-stock refurbished devices. Staff manage orders, stock and coupons in the dashboard.

**Architecture:** Everything lives in the existing Next.js 16 app.
- **Money logic** (pricing, coupons, order state transitions) is pure TypeScript under `src/lib/store/`, unit-tested with Vitest.
- **Trusted writes** (orders, stock, coupons) happen only in server code under `src/lib/server/`, through `firebase-admin` Firestore transactions.
- **PhonePe**: we talk to Standard Checkout v2 with `fetch`. Payment state changes only in `reconcileOrder()`, which asks PhonePe's status API.
- **Customer-owned data** (cart, favourites, saved address) is written by the browser through the Firebase client SDK, guarded by `firestore.rules`.

**Tech Stack:** Next.js 16.4 (App Router, `cacheComponents`, webpack build), React 19, TypeScript strict, Zod 4, zustand 5, TanStack Query 5, Firebase client SDK 13, `firebase-admin` (new), Vitest (new, dev), Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-11-19-store-checkout-design.md`

## Global Constraints

**Money and security**
- Amounts are whole rupees (`int`) everywhere. Convert to paise (`× 100`) only inside `src/lib/server/phonepe.ts`.
- The server recomputes every price from a fresh `site/content` read through `firebase-admin`, never `getSiteContent()`, which is cached for 60s. Client totals are display-only.
- An order becomes `paid` only inside `reconcileOrder()`, after PhonePe's order-status API returns `COMPLETED`.
- Secrets are read only from server env through `serverEnv()`. Nothing under `src/lib/server/` is imported by a `"use client"` file.

**Stock and coupons**
- Stock hold `reservedUntil = createdAt + 20 min`. PhonePe `expireAfter = 900` seconds.
- A product with no `stock/{productId}` doc has 0 available.
- Coupon `uses` counts pending plus paid orders. It goes up at reservation and down only when an order becomes `failed` or `expired`.
- Cancelling a `paid` or `packed` order restocks its units. `refunded` never restocks. Coupon `uses` is never given back on cancel or refund.

**Store switch**
- `STORE_ENABLED=true` turns on the cart, favourites, checkout and stock badges. Anything else means off, and the site looks exactly as it does today.
- The flag is read in `src/app/layout.tsx`, so changing it needs a redeploy (Hostinger rebuilds on deploy).

**Build and code rules**
- Build stays `next build --webpack`.
- Component files stay under 300 lines.
- Use theme tokens (existing classes like `text-navy`, `ring-border`), not hex values.
- Touch targets are at least 44px (`h-11`). Every icon-only button gets an `aria-label`.
- No `console.log`.
- Import from modules directly, not barrel files.

## Review Focus

These are the inputs most likely to bite a real customer that the happy-path tests miss:

1. **Stale cart line.** The product was deleted, or an option is no longer offered, after it went into the cart. Pricing rejects that line with a message naming the product, and doesn't charge a default config. (Task 1 test `rejects a line whose option is no longer offered`.)
2. **Duplicate payment signal.** The customer lands on `/orders/[id]` after the webhook already marked it paid. Reconcile is a no-op: no second coupon count, no stock change. (Task 2 test `COMPLETED on an already-paid order changes nothing`.)
3. **Slow UPI.** PhonePe still says PENDING after the 20-min hold. The sweep doesn't expire the order while PhonePe says PENDING. (Task 2 test `PENDING past the hold stays pending`.)
4. **Stock moved since the cart was built.** The quantity is now above `available`. The whole order is refused with "Only N left of X", and no line is reserved. (Task 1 test `refuses the whole cart when one line exceeds stock`.)
5. **Another customer's order ID typed into the URL.** `/orders/[id]` renders not-found for anyone but the owner or an admin. (Task 8, step 6 checks this by hand.)

---

### Task 1: Vitest and pure pricing and coupon logic

**Files:**
- Create: `vitest.config.ts`, `src/lib/store/schemas.ts`, `src/lib/store/pricing.ts`, `src/lib/store/pricing.test.ts`
- Modify: `package.json` (devDeps `vitest`; script `"test": "vitest run"`)

**Interfaces:**
- Consumes: `SiteContent`, `Deal`, `findType`, `offeredOptions` from `src/lib/site-content.ts`.
- Produces:
  - `schemas.ts`:
    - `cartLineSchema = z.object({ productId: z.string().max(80), options: z.record(z.string().max(40), z.string().max(40)), qty: z.number().int().min(1).max(10) })`, type `CartLine`
    - `addressSchema` with `name` (2–100), `phone` (`/^[6-9]\d{9}$/`), `line1` (5–200), `line2` (≤200, optional, default ""), `city` (2–60), `state` (2–60), `pincode` (`/^[1-9]\d{5}$/`); type `Address`
    - `couponCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/)`
    - `couponSchema = z.object({ type: z.enum(["flat","percent"]), value: z.number().int().positive(), maxDiscount: z.number().int().positive().nullable(), minOrder: z.number().int().min(0), expiresAt: z.string() /* YYYY-MM-DD, valid through end of that day IST */, active: z.boolean(), maxUses: z.number().int().positive().nullable(), oncePerCustomer: z.boolean(), uses: z.number().int().min(0) })`, type `Coupon`
  - `pricing.ts`:
    - `type PricedLine = CartLine & { name: string; unitPrice: number }`
    - `priceLines(content: SiteContent, lines: CartLine[]): { ok: true; lines: PricedLine[]; subtotal: number } | { ok: false; error: string }`
    - `couponDiscount(coupon: Coupon | null, code: string, subtotal: number, now: Date, customerUsedIt: boolean): { ok: true; discount: number } | { ok: false; error: string }`
    - `checkStock(lines: CartLine[], available: Record<string, number>, names: Record<string, string>): string | null` (sums qty per productId, returns the error message or null)

- [ ] **Step 1: Install and configure.** `npm i -D vitest`. In `vitest.config.ts`, alias `@` → `./src` with `resolve.alias` and set `environment: "node"`.
- [ ] **Step 2: Write the failing tests** in `pricing.test.ts`, building a tiny `SiteContent` fixture from `DEFAULT_CONTENT` (first product with two option groups):
  - `prices a line as base price plus one step per index above cheapest`: expects `unitPrice === deal.price + idx × step` summed over groups, and `subtotal === unitPrice × qty`.
  - `rejects a line whose option is no longer offered`: expects `ok:false` with an error containing the product name.
  - `rejects an unknown product`: `ok:false`.
  - `rejects a line missing an option group the product offers`: `ok:false`.
  - `flat coupon takes value off, never below zero`
  - `percent coupon respects maxDiscount`
  - `coupon below minOrder is refused with "Add ₹X more to use CODE"`
  - `expired / inactive / missing coupon is refused`, each with a distinct message
  - `maxUses reached is refused`: `uses >= maxUses`
  - `oncePerCustomer refuses when customerUsedIt`
  - `refuses the whole cart when one line exceeds stock`: two lines of the same productId (qty 1 + 1) against `available 1` returns "Only 1 left of <name>".
- [ ] **Step 3: Run `npm test`.** Expected: FAIL (modules missing).
- [ ] **Step 4: Implement `schemas.ts` and `pricing.ts`.** `priceLines` must require exactly one value per offered group, and each value must be in `group.values`. Percent discount is `Math.floor(subtotal × value / 100)`, capped by `maxDiscount`.
- [ ] **Step 5: Run `npm test`.** Expected: all pass. Run `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 6: Commit** `feat: add pricing and coupon rules for checkout`

### Task 2: Pure order state transitions

**Files:**
- Create: `src/lib/store/order-state.ts`, `src/lib/store/order-state.test.ts`

**Interfaces:**
- Produces:
  - `ORDER_STATUSES = ["pending_payment","paid","packed","shipped","delivered","failed","expired","cancelled","refunded","needs_attention"] as const`, type `OrderStatus`
  - `type PgState = "PENDING" | "COMPLETED" | "FAILED"`
  - `type Effect = { status: OrderStatus; stock: "none" | "release" | "reserve"; couponUses: -1 | 0 | 1 }`
  - `paymentEffect(status: OrderStatus, pg: PgState, holdExpired: boolean, stockAvailable: boolean): Effect`. `stockAvailable` only matters for a late payment on an expired order.
  - `STAFF_NEXT: Record<OrderStatus, OrderStatus[]>`, and `staffEffect(from: OrderStatus, to: OrderStatus): { ok: true; restock: boolean } | { ok: false }`

- [ ] **Step 1: Write the failing tests:**
  - `COMPLETED moves pending_payment to paid without touching stock or coupon` → `{paid, none, 0}`
  - `COMPLETED on an already-paid order changes nothing` → `{paid, none, 0}`, and the same for `packed`, `shipped` and `delivered`
  - `PENDING past the hold stays pending` → `paymentEffect("pending_payment","PENDING",true,…)` returns `{pending_payment, none, 0}`
  - `PENDING within the hold stays pending` → same result
  - `unpaid sweep past the hold expires`: `paymentEffect("pending_payment","FAILED",true,…)` returns `{expired, release, -1}`. PhonePe reports an abandoned payment as FAILED once its 900 s `expireAfter` passes, and our 20-min hold is longer, so an abandoned order surfaces here as FAILED with the hold expired.
  - `FAILED within the hold is failed`: `paymentEffect("pending_payment","FAILED",false,…)` returns `{failed, release, -1}`.
  - `FAILED on a paid order changes nothing`: returns `{paid, none, 0}`.
  - `late COMPLETED on expired order re-reserves when stock exists` → `{paid, reserve, 1}`
  - `late COMPLETED on expired order without stock needs attention` → `{needs_attention, none, 0}`
  - `staff: paid→packed→shipped→delivered allowed; cancel from paid or packed restocks; refunded from paid/packed/shipped/delivered/needs_attention never restocks; delivered→packed refused`
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement `order-state.ts`.** `STAFF_NEXT`:
  - `paid` → `[packed, cancelled, refunded]`
  - `packed` → `[shipped, cancelled, refunded]`
  - `shipped` → `[delivered, refunded]`
  - `delivered` → `[refunded]`
  - `needs_attention` → `[refunded]`
  - every other status → `[]`
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat: add order status transitions`

### Task 3: Server env, firebase-admin and the PhonePe client

**Files:**
- Create: `src/lib/server/env.ts`, `src/lib/server/firebase-admin.ts`, `src/lib/server/phonepe.ts`, `src/lib/server/phonepe.test.ts`
- Modify: `package.json` (dep `firebase-admin`), `.env.example` (append the names below, no values)

**Interfaces:**
- Produces:
  - `serverEnv(): { FIREBASE_SERVICE_ACCOUNT: object /* parsed from base64 JSON */, PHONEPE_CLIENT_ID: string, PHONEPE_CLIENT_SECRET: string, PHONEPE_CLIENT_VERSION: string, PHONEPE_ENV: "sandbox" | "production", PHONEPE_WEBHOOK_USERNAME: string, PHONEPE_WEBHOOK_PASSWORD: string, SITE_URL: string /* url, no trailing slash */ }`. It's lazy, memoised and Zod-validated, and throws `Error("Store env not configured: <first missing key>")`.
  - `adminDb(): Firestore` and `adminAuth(): Auth`, from the modular `firebase-admin/app`, `/firestore` and `/auth` imports, initialised once with `cert(serviceAccount)`.
  - `requireUser(idToken: unknown): Promise<string /* uid */>`: throws `AuthError` on a bad token.
  - `requireAdmin(idToken: unknown): Promise<string>`: also requires `admins/{uid}` to exist.
  - `createPayment(p: { merchantOrderId: string; amount: number /* rupees */; redirectUrl: string }): Promise<{ checkoutUrl: string }>`
  - `getPaymentState(merchantOrderId: string): Promise<{ state: PgState; transactionId: string | null }>`
  - `isValidWebhookAuth(header: string | null): boolean`

- [ ] **Step 1: Check PhonePe's current Standard Checkout v2 docs** (developer.phonepe.com) and confirm or correct these assumptions. Record any difference as a comment at the top of `phonepe.ts`.
  - **Base URLs:**
    - sandbox: `https://api-preprod.phonepe.com/apis/pg-sandbox` for both auth and PG
    - production: auth at `https://api.phonepe.com/apis/identity-manager`, PG at `https://api.phonepe.com/apis/pg`
  - **Get a token:** `POST {auth}/v1/oauth/token`, form-encoded: `client_id`, `client_version`, `client_secret`, `grant_type=client_credentials`. It returns `access_token` and `expires_at` (epoch seconds). Send the token as the header `Authorization: O-Bearer <token>`.
  - **Create a payment:** `POST {pg}/checkout/v2/pay` with JSON `{ merchantOrderId, amount /* paise */, expireAfter: 900, paymentFlow: { type: "PG_CHECKOUT", merchantUrls: { redirectUrl } } }`. It returns `{ redirectUrl }`.
  - **Order status:** `GET {pg}/checkout/v2/order/{merchantOrderId}/status`. It returns `{ state, paymentDetails: [{ transactionId }] }`.
  - **Webhook auth:** the `Authorization` header equals the hex `SHA256("<username>:<password>")`.
- [ ] **Step 2: Write the failing tests** in `phonepe.test.ts`. Mock `fetch` with `vi.stubGlobal` and set env with `vi.stubEnv`.
  - `sends amount in paise and the redirect url`
  - `reuses the token until it expires`: two `createPayment` calls make one token request.
  - `maps COMPLETED status and returns the transaction id`
  - `throws on non-2xx from create`
  - `accepts only the sha256 of username:password`, which also rejects a `null` header and a wrong hash.
- [ ] **Step 3: Run `npm test`.** Expected: FAIL.
- [ ] **Step 4: Implement the three files.**
  - Cache the token in a module variable and refresh it 60s before `expires_at`.
  - Hash with `crypto.createHash("sha256")` and compare with `crypto.timingSafeEqual`.
  - Install `firebase-admin`.
- [ ] **Step 5: Run `npm test` and `npx tsc --noEmit`.** Expected: PASS.
- [ ] **Step 6: Commit** `feat: add server env, firebase-admin and PhonePe client`

### Task 4: Order server logic, the checkout action and the webhook

**Files:**
- Create: `src/lib/server/catalog.ts`, `src/lib/server/orders.ts`, `src/lib/store/checkout-actions.ts` (`"use server"`), `src/app/api/phonepe/webhook/route.ts`

**Interfaces:**
- Consumes:
  - Task 1: `priceLines`, `couponDiscount`, `checkStock`, `cartLineSchema`, `addressSchema`, `couponCodeSchema`, `couponSchema`
  - Task 2: `paymentEffect`
  - Task 3: everything
- Produces:
  - `loadCatalog(): Promise<SiteContent>`: a fresh read of `site/content` through `adminDb()`, parsed with `siteContentSchema`, falling back to `DEFAULT_CONTENT` only when the doc doesn't exist.
  - `type OrderDoc = { uid; items: PricedLine[]; subtotal; discount; couponCode: string | null; total; address: Address; status: OrderStatus; phonepe: { state: PgState | null; transactionId: string | null }; reservedUntil: Timestamp; createdAt; updatedAt; trackingNote: string }`, exported from `orders.ts`.
  - `reconcileOrder(orderId: string): Promise<OrderStatus>`
  - `sweepExpired(): Promise<void>`: queries `orders where status == "pending_payment" and reservedUntil < now`, limit 20, and reconciles each.
  - Server actions:
    - `previewTotals(idToken: string | null, lines: unknown, code: unknown): Promise<{ ok: true; subtotal: number; discount: number; total: number; lines: PricedLine[] } | { ok: false; error: string }>`. With no token, `oncePerCustomer` is treated as not used.
    - `createOrder(idToken: string, lines: unknown, code: unknown, address: unknown): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }>`

- [ ] **Step 1: Implement `catalog.ts` and `orders.ts`.**
  - **Reserve.** One `adminDb().runTransaction`:
    - read every `stock/{id}` in the cart, plus `coupons/{code}` if a code was given
    - run `checkStock`
    - decrement `available`
    - increment the coupon's `uses`
    - create `orders/{autoId}` as `pending_payment` with `reservedUntil = now + 20 min`
  - **Once per customer.** For `oncePerCustomer`, query outside the transaction: `orders where uid == uid and couponCode == code and status in [pending_payment, paid, packed, shipped, delivered]`, limit 1.
  - **Reconcile.** `reconcileOrder` reads the order, calls `getPaymentState`, then in a transaction re-reads the order, applies `paymentEffect`, and writes the status, stock change, coupon change and `phonepe` fields. Nothing is written when the status is unchanged.
- [ ] **Step 2: Implement `checkout-actions.ts`.** `createOrder` does these in order:
  1. `requireUser`
  2. validate input with Zod
  3. `sweepExpired()`
  4. `loadCatalog()` → `priceLines` → coupon → reserve
  5. `createPayment({ merchantOrderId: orderId, amount: total, redirectUrl: SITE_URL + "/orders/" + orderId })`

  If `createPayment` throws, mark the order failed through the same transaction path as `paymentEffect(…,"FAILED",…)` and return `{ ok:false, error:"PhonePe is not responding. Nothing was charged, try again." }`.

  Catch `AuthError` and return "Your session expired. Sign in again."
- [ ] **Step 3: Implement the webhook route** `POST`:
  - If `isValidWebhookAuth(req.headers.get("authorization"))` fails, return 401.
  - Parse `payload.merchantOrderId` with Zod. Anything else returns 400.
  - Call `await reconcileOrder(id)` and return 200.
  - Never read the state from the body.
- [ ] **Step 4: Verify.** Run `npx tsc --noEmit` and `npm test`. Expected: pass. Run `npm run build`. Expected: pass, with `/api/phonepe/webhook` listed as ƒ.
- [ ] **Step 5: Commit** `feat: create orders, reserve stock and reconcile PhonePe payments`

### Task 5: Store flag, client data hooks and Firestore rules

**Files:**
- Create: `src/components/store/store-flag.tsx`, `src/lib/store/cart-store.ts`, `src/lib/store/client-data.ts`
- Modify: `src/app/layout.tsx`, `firestore.rules`

**Interfaces:**
- Produces:
  - `StoreFlagProvider({ enabled, children })` and `useStoreEnabled(): boolean`. The context value is a primitive boolean.
  - `useCart` is a zustand store wrapped in `persist` (key `alpha-cart`):
    - state: `lines: CartLine[]`
    - actions: `add(line)` merges identical productId and options by summing qty, capped at 10; `setQty(i, qty)`; `remove(i)`; `clear()`
    - selector `useCartCount()` returns a number
  - `startCartSync()` is called once from the existing `Providers`. On sign-in it merges `carts/{uid}` with the local cart by summing qty per identical line, capped at 10, then writes it back. After that it pushes changes to `carts/{uid}`, debounced 800 ms, through `useCart.subscribe`.
  - `useStock(): Record<string, number> | undefined` is a TanStack Query over the `stock` collection with `staleTime` 30 s.
  - `useFavorites(): string[]` and `toggleFavorite(uid: string, productId: string): Promise<void>`, which read and write `favorites/{uid}` with `arrayUnion`/`arrayRemove`.
  - `useIsFavorite(productId): boolean`
  - `loadProfile(uid)` and `saveProfile(uid, address)` for `profiles/{uid}`
- [ ] **Step 1: Wire the flag into the layout.** In `layout.tsx`, wrap the existing children in `<StoreFlagProvider enabled={process.env.STORE_ENABLED === "true"}>`.
- [ ] **Step 2: Implement the cart store, the client data hooks and `startCartSync()`.** Call `startCartSync()` next to `useEffect(startAuthListener, [])` in `src/components/site/providers.tsx`.
- [ ] **Step 3: Update the rules** in `firestore.rules`:
  - `stock`: read true, write false.
  - `coupons`: read false, write false.
  - `orders`: read if `isAdmin() || resource.data.uid == request.auth.uid`, write false.
  - `carts/{uid}`: read and write when `request.auth.uid == uid`. Keys only `items`, a list of at most 30 entries.
  - `favorites/{uid}`: read and write when `request.auth.uid == uid`. Keys only `productIds`, a list of at most 200 entries.
  - `profiles/{uid}`: read and write when `request.auth.uid == uid`. Keys only `address`, a map.
- [ ] **Step 4: Verify.** Run `npx tsc --noEmit` and `npm run lint`. Expected: clean. With `STORE_ENABLED` unset, run `npm run dev` and load `/` in the browser. It looks unchanged.
- [ ] **Step 5: Commit** `feat: add cart, favourites and stock data with store flag`

### Task 6: Product-side UI (hearts, add to cart, stock badges, header icons)

**Files:**
- Create: `src/components/store/favorite-button.tsx`, `src/components/store/stock-badge.tsx`, `src/components/store/add-to-cart.tsx`, `src/components/store/header-store-icons.tsx`
- Modify: `src/components/shop/deals.tsx` (`DealCard`), `src/components/shop/product/product-buy-box.tsx`, `src/components/site/site-header.tsx`

**Interfaces:**
- Consumes: Task 5 hooks, and `configPrice` from `src/lib/shop-data.ts`.
- Produces:
  - `FavoriteButton({ productId })`: an icon-only button, `aria-label` "Save to favourites" / "Remove from favourites". When signed out it routes to `/signin`.
  - `StockBadge({ productId })`: "Sold out" at 0, "Only N left" at 3 or fewer, nothing otherwise.
  - `AddToCart({ deal, options: Record<string,string> })`: quantity stepper capped at `min(stock, 10)`, then "Add to cart", then a toast with a "View cart" action. Disabled with "Sold out" at 0.
  - `HeaderStoreIcons()`: links to `/favorites` (heart) and `/cart` (bag with a count badge).

  Each renders `null` when `useStoreEnabled()` is false.
- [ ] **Step 1: Build the four components** and insert them:
  - `DealCard`: the heart in the image corner, and a `StockBadge`.
  - `ProductBuyBox`: `AddToCart` above the existing enquiry buttons, building `options` from `groups` and `picks`. A `FavoriteButton` beside the title.
  - `SiteHeader`: `HeaderStoreIcons` before the account icon.
- [ ] **Step 2: Verify in the browser** with `STORE_ENABLED=true npm run dev`:
  - The heart redirects to sign-in when signed out.
  - Add to cart updates the header count.
  - A product with no stock doc shows "Sold out".
  - Take a screenshot at mobile width (375) and desktop width.

  Then restart without the flag and confirm none of it shows.
- [ ] **Step 3: Commit** `feat: add favourite, add-to-cart and stock badges to products`

### Task 7: Cart and checkout pages

**Files:**
- Create: `src/app/cart/page.tsx`, `src/components/store/cart-view.tsx`, `src/app/checkout/page.tsx`, `src/components/store/checkout-view.tsx`, `src/components/store/address-form.tsx`

**Interfaces:**
- Consumes: `useCart`, `previewTotals`, `createOrder`, `addressSchema`, `loadProfile`/`saveProfile`, `useAuth`, and the existing `Field` and `Input` UI.
- Produces: the pages `/cart` and `/checkout`. When the store is off, both call `notFound()`, which needs the server page to read `process.env.STORE_ENABLED`.

- [ ] **Step 1: Build `/cart`.**
  - Each line shows its name and options, a quantity stepper (capped at stock), and Remove.
  - A coupon input with Apply calls `previewTotals`. Show its error inline under the input.
  - Totals card: Subtotal, Discount, Total, "Free delivery". Totals come from the `previewTotals` result. Re-run it when the lines change, through a TanStack Query keyed on lines and code.
  - Lines that `previewTotals` rejects are shown with the server's message and a Remove button. Checkout is disabled while any line is invalid.
  - Empty state links to `/collections/all`.
- [ ] **Step 2: Build `/checkout`.**
  - Not signed in: show the existing `SignInView`.
  - Signed in: address form pre-filled from `loadProfile`, then the summary, then a "Pay ₹{total} with PhonePe" button.
  - On click:
    1. `saveProfile`
    2. `createOrder(await user.getIdToken(), lines, code, address)`
    3. on `ok`, `clear()` the cart and set `window.location.href = checkoutUrl`
    4. on error, show a toast and keep the cart

    Disable the button while the request is in flight.
- [ ] **Step 3: Verify in the browser** with sandbox env and `STORE_ENABLED=true`:
  - An invalid PIN is refused.
  - A coupon below its minimum shows "Add ₹X more…".
  - A valid checkout redirects to the PhonePe sandbox page.
- [ ] **Step 4: Commit** `feat: add cart and checkout pages`

### Task 8: Order pages, favourites page and buyer link

**Files:**
- Create: `src/app/orders/page.tsx`, `src/app/orders/[id]/page.tsx`, `src/components/store/orders-list.tsx`, `src/components/store/order-detail.tsx`, `src/app/favorites/page.tsx`, `src/components/store/favorites-view.tsx`
- Modify: `src/components/dashboard/buyer-view.tsx` (add a "My orders" link), `src/lib/store/checkout-actions.ts` (add `getMyOrder`)

**Interfaces:**
- Produces:
  - `getMyOrder(idToken: string, orderId: string): Promise<{ ok: true; order: OrderView } | { ok: false; error: "not_found" | "auth" }>`. It calls `requireUser`, reads the order, returns `not_found` unless the user is the owner or an admin, and calls `reconcileOrder` first while the status is `pending_payment`.
  - `OrderView` is `OrderDoc` with timestamps turned into ISO strings, `uid` dropped, and `id` added.
  - `/orders` lists orders through the client SDK: `orders where uid == me`, ordered by `createdAt desc`, limit 50. This needs the composite index `uid asc, createdAt desc`, so add it to `firestore.indexes.json` and reference that file from `firebase.json`.
- [ ] **Step 1: Build `/orders/[id]`.**
  - A client component calls `getMyOrder` with TanStack Query.
  - While the status is `pending_payment`, show "Confirming your payment…" and refetch every 3 s for up to 2 min.
  - Then show the status, the items, the address, the tracking note, and the PhonePe transaction ID.
  - Failed or expired: "Payment didn't go through. Nothing was charged." plus a link back to `/cart`.
- [ ] **Step 2: Build `/orders`.** Each row shows the date, a total, a status badge (reuse the `badges.tsx` styling), and links to the detail page.
- [ ] **Step 3: Build `/favorites`.** A grid of `DealCard` for the saved IDs that still exist in the catalogue. Signed out: `SignInView`.
- [ ] **Step 4: Add the link** to `/orders` in `BuyerView`.
- [ ] **Step 5: Verify against the PhonePe sandbox:**
  - A success payment lands on `/orders/[id]` and shows Paid. Stock dropped by the quantity, and the coupon `uses` went up by 1.
  - A failure payment shows Failed. Stock and `uses` are restored.
- [ ] **Step 6: Verify order privacy.** While signed in as a second account, open the first account's `/orders/[id]`. It shows not-found.
- [ ] **Step 7: Commit** `feat: add order pages and favourites page`

### Task 9: Staff dashboard (Orders, Stock, Coupons)

**Files:**
- Create: `src/lib/store/admin-actions.ts` (`"use server"`), `src/components/dashboard/store/orders-tab.tsx`, `src/components/dashboard/store/order-drawer.tsx`, `src/components/dashboard/store/stock-tab.tsx`, `src/components/dashboard/store/coupons-tab.tsx`
- Modify: `src/components/dashboard/staff-view.tsx` (add `TOP_TABS` entries `orders`, `stock`, `coupons`, shown only when the store is enabled), `src/components/dashboard/items/sale-editor.tsx` (the sale-code warning)

**Interfaces:**
- Consumes: `requireAdmin`, `adminDb`, `staffEffect`, `sweepExpired`, `couponSchema`
- Produces these server actions. Each verifies `requireAdmin(idToken)` and returns `{ ok: true } | { ok: false; error: string }` unless noted.
  - `listOrders(idToken, status: OrderStatus | "all"): Promise<{ ok: true; orders: (OrderView & { email: string | null })[] } | { ok: false; error: string }>`. It calls `sweepExpired()` first and returns the newest 100.
  - `setOrderStatus(idToken, orderId, to: OrderStatus, trackingNote: string /* ≤300 */)`. This runs in a transaction: `staffEffect` decides, and when `restock` is true, `available` goes up by each line's qty.
  - `setStock(idToken, productId, available: number /* int 0–999 */)`
  - `listCoupons(idToken): Promise<{ ok: true; coupons: (Coupon & { code: string })[] } | …>`
  - `saveCoupon(idToken, code, coupon: Omit<Coupon,"uses">)`. It keeps the existing `uses`.
  - `couponExists(code: string): Promise<boolean>`. This needs no token: it reveals only whether an active coupon has that exact code, and the Sale editor uses it.
- [ ] **Step 1: Implement `admin-actions.ts`.**
- [ ] **Step 2: Build the three tabs.**
  - **Orders:** a status filter, a table (date, customer, total, status), and a drawer that shows the address and lets staff pick a status from `STAFF_NEXT[current]` and add a tracking note.
  - **Stock:** one row per catalogue product (name plus a number input) with Save per row.
  - **Coupons:** a list plus a create/edit dialog covering every `couponSchema` field except `uses`, which is shown read-only.
- [ ] **Step 3: Add the sale-code warning.** In the Sale editor, when the sale is enabled and `couponExists(code)` is false, show: "No active coupon named CODE. Customers will be told it's invalid at checkout. Create it under Coupons."
- [ ] **Step 4: Verify in the browser** as an admin:
  - Set stock to 2 and see "Only 2 left" on the product.
  - Create the coupon `ALPHA500` (flat 500, minimum order 5000); the Sale warning goes away.
  - Move a paid order through packed → cancelled and see stock go back up.
  - Refunded doesn't change stock.
- [ ] **Step 5: Commit** `feat: add orders, stock and coupons to the admin dashboard`

### Task 10: Policy pages, business details and FAQ

**Files:**
- Create: `src/lib/business.ts`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/refunds/page.tsx`, `src/app/shipping/page.tsx`, `src/components/site/policy-page.tsx`
- Modify: `src/components/site/footer.tsx`, `src/components/shop/faq.tsx`

**Interfaces:**
- Produces `BUSINESS = { legalName: "[BUSINESS NAME]", address: "[REGISTERED ADDRESS]", email: "[SUPPORT EMAIL]", phone: "[SUPPORT PHONE]", gstin: "[GSTIN, if any]" } as const`. The footer and every policy page read it.

The policy pages **ship even when `STORE_ENABLED` is off.**

- [ ] **Step 1: Write the four pages** as static Server Components using a shared `PolicyPage({ title, updated, children })` layout. The copy has to match the business facts:
  - 6-month warranty
  - replacement within 15 days of delivery
  - prepaid only through PhonePe
  - free delivery, shipped within 1–3 business days
  - refunds to the original payment method within 5–7 business days after an approved return
  - cancellation is free until the order ships
- [ ] **Step 2: Update the footer.** Add a "Policies" column with links to the four pages, and show the `BUSINESS` contact block. Replace the `hello@alphamart.example` email with `BUSINESS.email`.
- [ ] **Step 3: Update the FAQ.** Retitle "How do I buy, if there is no cart?" to "How do I buy?". The answer: add to cart, check out and pay with PhonePe (UPI, cards or netbanking), or enquire on WhatsApp for a custom quote.
- [ ] **Step 4: Verify in the browser.** All four pages render on mobile and desktop and the footer links work.
- [ ] **Step 5: Commit** `feat: add policy pages and business details`

### Task 11: Full verification and handover

**Files:**
- Modify: `docs/superpowers/specs/2026-11-19-store-checkout-design.md` (status line → "Built")

- [ ] **Step 1: Run the checks.** `npm test`, `npx tsc --noEmit`, `npm run lint` and `npm run build`. Expected: all pass.
- [ ] **Step 2: Run the end-to-end checks** in the browser against the PhonePe sandbox, with `STORE_ENABLED=true`:
  - success payment
  - failed payment
  - abandoned payment: start payment, close the tab, set that order's `reservedUntil` into the past from the Firebase console, open the dashboard Orders tab, and see the order become expired with stock restored
  - coupon applied
  - sold-out product can't be added
  - webhook with a wrong auth header returns 401: `curl -X POST localhost:3000/api/phonepe/webhook -H 'authorization: x' -d '{}'`
- [ ] **Step 3: Review.** Run the `reviewer` agent on `git diff main...HEAD`, and fix the real findings.
- [ ] **Step 4: Write the handover in the PR body:**
  - the env vars to add on Hostinger
  - deploying `firestore.rules` and the index, which the user runs because the Firebase CLI isn't installed here
  - the PhonePe webhook URL `https://<domain>/api/phonepe/webhook` with its username and password
  - filling `src/lib/business.ts`
  - entering stock counts
  - then setting `STORE_ENABLED=true` and redeploying
- [ ] **Step 5: Commit** `docs: mark store design as built`
