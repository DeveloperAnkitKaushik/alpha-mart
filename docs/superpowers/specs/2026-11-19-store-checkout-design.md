# Online store: cart, favourites, coupons, checkout and PhonePe payments

Status: awaiting owner approval · 2026-11-19

## Intent

Alpha Mart is a real refurbished laptop and PC store run by the owner's business. Today a customer can only enquire (WhatsApp or the enquiry form) and payment is arranged by hand. The owner wants real online sales: a customer picks a device and its RAM/SSD, adds it to a cart, applies a coupon, pays through PhonePe, and the order lands in the admin dashboard.

Stock is a few pieces per model, so overselling the last unit is the main business risk. Money is real from day one, so every price, discount and "paid" status is decided on the server.

## Goals

1. **Favourites**: a heart on product cards and the product page. Saved per account, so the customer must be signed in. A Favourites page lists them.
2. **Cart**: works signed out (kept in the browser). On sign-in it merges into the account cart, which follows the customer across devices. A header cart icon shows the item count.
3. **Checkout**: sign-in required. The customer enters a delivery address (name, phone, address lines, city, state, 6-digit PIN), which is saved for next time. They see the order summary, apply a coupon, and pay.
4. **Coupons**: the admin creates them in the dashboard. Each has a code, a flat ₹ or percent discount, an optional cap for percent, a minimum order, an expiry, an on/off switch and an optional total use limit.
5. **PhonePe payment**: PhonePe's hosted checkout (UPI including QR, cards, netbanking, wallets). The customer is redirected out to pay and back to the order page.
6. **Stock per product, not per RAM/SSD combination**: upgrades are fitted to order, so the owner confirmed one count per model is right. The admin sets how many units are available. A unit is reserved when payment starts and released if payment fails or is abandoned. At 0 the product shows "Sold out" and can't be bought. When 3 or fewer are left it shows "Only N left".
7. **Orders**: the customer has a My orders list and an order detail page with status. Staff get an Orders tab in the dashboard to see orders and move them through packed → shipped → delivered, or cancelled / refunded.
8. **Policy pages PhonePe requires**: Privacy Policy, Terms & Conditions, Refund & Cancellation, Shipping & Delivery, plus contact details in the footer.
9. Update the FAQ entry "How do I buy, if there is no cart?" to describe buying online.

## Non-goals (v1)

- Cash on delivery. Prepaid only; COD can be added later.
- Delivery charges. Delivery is free.
- GST invoices or PDF bills.
- Courier integration and live tracking. Staff can add a tracking note by hand.
- Refunds through the PhonePe API. Staff refund in the PhonePe dashboard and mark the order "Refunded" here.
- Email or SMS order notifications. PhonePe sends its own payment confirmation, and the order page shows status.
- Guest checkout, product reviews, multiple saved addresses.

The WhatsApp and enquiry buttons stay as a second way to buy.

## Anti-goals: these count as failure even if the rest works

- The amount charged differs from what the server calculates from the catalogue, chosen options and coupon.
- An order is marked paid without the server confirming it with PhonePe's order status API.
- Two customers pay for the same last unit.
- Any secret (service account, PhonePe client secret) reaches the browser or the repo.
- A customer can read another customer's orders or address.

## Constraints from the existing project

- Next.js 16 App Router with `cacheComponents`, deployed as one Node app on Hostinger Cloud Startup. The build uses `next build --webpack` because Turbopack's loader subprocess fails on Hostinger. Keep it that way.
- The catalogue (products, prices, option steps, sale) lives in one Firestore doc, `site/content`, as a validated JSON string (`src/lib/site-content.ts`). The admin overwrites it whenever they publish. **Stock, orders and coupons therefore live in their own collections**, never inside `site/content`, so a publish can't clobber a stock change.
- Price of a configuration = `product.price` + for each option group, (index of the chosen value in the offered values) × `group.step`. `offeredOptions()` in `src/lib/site-content.ts` already gives the offered groups. Reuse it on both server and client.
- Today the server only *reads* Firestore anonymously over REST. All writes go from the browser with the user's own token, checked by `firestore.rules`. Payments need trusted server writes, so this adds **`firebase-admin`** with a service account. It's the one new runtime dependency on the server; PhonePe's official Node SDK may be the second (see "Left to the builder").
- Auth: Firebase Auth (Google and email), with the client state in the `useAuth` zustand store. Admin = a doc in `admins/{uid}`. Server actions get the user's ID token from the client, as `publishSiteContent` already does, and verify it with `firebase-admin` `verifyIdToken`.
- Team conventions apply (TypeScript strict, Zod at boundaries, component files under 300 lines, theme tokens, mobile-first, 44px touch targets).

## Approaches considered

1. **Everything inside this Next.js app, using `firebase-admin` (chosen).** Server actions create and reserve orders, a route handler receives PhonePe's webhook, and Firestore transactions guard stock. It's one codebase and one deploy, the same as today.
2. Firebase Cloud Functions for payments, with Hostinger only serving the site. This needs the paid Blaze plan, and every change means two deploys. Rejected.
3. Raw Firestore REST with a hand-made service-account token. This avoids a dependency but re-implements what `firebase-admin` does safely. Rejected.

The owner picked approach 1.

## Data (Firestore)

All of these are written only by the server through `firebase-admin`, unless marked otherwise.

- `stock/{productId}`: `{ available: int ≥ 0, updatedAt }`. Public read. If no doc exists, the product counts as 0 available (sold out). The admin sets the number from the dashboard.
- `coupons/{CODE}`: `{ type: "flat" | "percent", value, maxDiscount?, minOrder, expiresAt, active, maxUses?, usedCount }`. No client read (the server validates), so the full code list isn't exposed.
- `orders/{orderId}`: `{ uid, items: [{ productId, name, options: Record<group, value>, unitPrice, qty }], subtotal, discount, couponCode?, total, address, status, phonepe: { merchantOrderId, state?, transactionId? }, reservedUntil, createdAt, updatedAt, trackingNote? }`. Readable by its owner and admins. Amounts are whole rupees, converted to paise only for PhonePe.
- `carts/{uid}`: `{ items: [{ productId, options, qty }] }`. **Client-writable by the owner**, with rules checking the shape. Prices are never stored here.
- `favorites/{uid}`: `{ productIds: string[] }`. Client-writable by the owner, with rules checking the shape (bounded size).
- `profiles/{uid}`: `{ address }`. Client-writable by the owner. This is the saved checkout address.

Order statuses: `pending_payment` → `paid` → `packed` → `shipped` → `delivered`. Also `failed`, `expired`, `cancelled`, `refunded`, and `needs_attention` (paid after the reservation lapsed and stock is gone; staff must fulfil or refund).

## Payment flow

1. **Start checkout** (server action `createOrder(idToken, cart, couponCode, address)`):
   - Verify the token.
   - Validate the input with Zod.
   - Load the catalogue **fresh** from `site/content` with `firebase-admin`, not the 60s cache.
   - Recompute each line price, the subtotal, the coupon discount and the total.
   - In one Firestore transaction: check `stock.available ≥ qty` for every line, decrement it, and create the order as `pending_payment` with `reservedUntil = now + 20 min`.
   - Then create the PhonePe payment: merchant order ID = our order ID, amount in paise, PhonePe expiry 15 min (shorter than our hold), redirect back to `/orders/{id}`. Return the PhonePe checkout URL to the browser.
   - If PhonePe rejects the request, release the stock and mark the order `failed`.
2. **Customer returns** to `/orders/{id}`. The server calls PhonePe's order status API and runs **`reconcileOrder(id)`**.
3. **PhonePe webhook**: `POST /api/phonepe/webhook`. Verify PhonePe's authorization header against the configured webhook credentials, take only the order ID from the body, then run `reconcileOrder(id)`. The status always comes from PhonePe's status API, never from the webhook body.
4. **`reconcileOrder`** is the single place an order's payment state changes. It is idempotent and runs in a transaction:
   - COMPLETED while `pending_payment` → `paid`, and the coupon's `usedCount` goes up by 1.
   - FAILED → `failed`, stock released.
   - PENDING → no change.
   - COMPLETED but the order already `expired` → re-reserve stock if available and mark `paid`; otherwise `needs_attention`.
5. **Abandoned payments**: there is no cron. Expired `pending_payment` orders are swept lazily. Before any new reservation, and when the staff Orders tab loads, the server reconciles pending orders past `reservedUntil` with PhonePe. Ones still unpaid become `expired` and their stock is released.

The coupon is applied per order, and its use limit is checked at reservation time and counted on payment. The same coupon can't be stacked twice in one order.

## Screens

- **Header**: a favourites heart and a cart icon with a count badge, next to the existing sign-in icon. Each has an ARIA label.
- **Product card and product page**: a heart toggle, "Add to cart" with the chosen RAM/SSD, a quantity picker capped at available stock, and stock badges (Only N left / Sold out). The existing "Get best price" and WhatsApp buttons stay.
- **`/cart`**: the lines with options, quantity, remove, the coupon box (validated by the server via a `previewTotals` server action), totals, and a Checkout button.
- **`/checkout`**: sign-in gate, address form (pre-filled from the profile), summary, and "Pay ₹X with PhonePe".
- **`/orders`** and **`/orders/[id]`**: the customer's orders and one order with status, items, address and tracking note. `/orders/[id]` is also the PhonePe return page and shows "Confirming your payment…" while PENDING.
- **`/favorites`**: the saved products as cards.
- **Dashboard (staff)**, three new tabs next to the existing ones:
  - **Orders**: list by status, a detail drawer with address, status change and tracking note.
  - **Stock**: one number per product.
  - **Coupons**: create, edit and toggle.
- **Dashboard (customer)**: link to My orders from the existing buyer view.
- **`/privacy`, `/terms`, `/refunds`, `/shipping`**: static pages, linked from the footer, with the footer showing business contact details.

## Environment (Hostinger env vars; names go in `.env.example`, values never committed)

`FIREBASE_SERVICE_ACCOUNT` (the service-account JSON, base64), `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`, `PHONEPE_ENV` (`sandbox` | `production`), `PHONEPE_WEBHOOK_USERNAME`, `PHONEPE_WEBHOOK_PASSWORD`, `SITE_URL`. Validate them with Zod on first server use, and fail with a clear message.

## Firestore rules changes

- `stock`: read true, write false.
- `coupons`: read false, write false.
- `orders`: read if owner or admin, write false.
- `carts/{uid}`, `favorites/{uid}` and `profiles/{uid}`: read and write only by that uid, with key and shape checks and size limits.
- Admin edits to stock and coupons go through server actions that verify the token and check `admins/{uid}` with `firebase-admin`.

## Verification

- Unit tests (Vitest, new dev dependency) for the money logic: line price from options, coupon rules (expiry, minimum, cap, inactive, use limit), totals. Plus `reconcileOrder` state transitions with PhonePe and Firestore mocked at the boundary.
- An end-to-end run in the browser against **PhonePe sandbox**:
  - a successful payment
  - a failed payment
  - an abandoned payment that expires and frees stock
  - a coupon
  - a sold-out product
- `npm run build` (webpack), lint and typecheck pass.

## Calls made during review (builder's call, owner can override)

- **Go-live switch.** A server-read env var `STORE_ENABLED` (default off).
  - When off: no cart, favourites, checkout or stock badges show, and the site behaves as today (enquiry and WhatsApp).
  - The policy pages ship regardless, so PhonePe can review the live site first.
  - The owner turns the store on after production credentials exist and stock counts are entered.
  - `PHONEPE_ENV=sandbox` is only for testing before that.
- **Sale banner code vs coupons.** The banner's code stays free text in the Sale editor. The editor shows a warning when that code has no active coupon. This doesn't block publishing; it just flags the mismatch.
- **Cancelled and refunded orders.**
  - Cancelling an order that has been paid but not yet shipped puts its units back in stock.
  - Marking an order "Refunded" doesn't change stock, because a returned refurbished unit may not be resellable. Staff adjust the stock number by hand if it is.
  - Coupon use counts are never given back.
- **Coupon limits.**
  - Open `pending_payment` orders count against `maxUses`: reserved with the stock, released when the order fails or expires. So a limit can't be overshot by several checkouts at once.
  - Optional per-coupon `oncePerCustomer` flag, checked against that customer's paid and pending orders.
- `onSale` is display-only (sale banner rail). It doesn't change price.

## Left to the builder

- Exact PhonePe API shape (Standard Checkout v2: auth token, create payment, order status, webhook auth). Check PhonePe's current docs before coding, and decide between their official Node SDK and plain `fetch` (prefer `fetch` if it's small).
- File layout, component split, and visual details. Match the existing shop and dashboard styling.
- Copy for the policy pages: draft sensible text for a refurbished electronics seller, matching the FAQ (6-month warranty, 15-day replacement), with placeholders only where business facts are missing. The business legal name, address, support email and phone aren't known yet (owner's decision). Keep them in one constant used by the policy pages and the footer, with obvious placeholder values like `[BUSINESS NAME]`, so the owner can fill them in one place before applying to PhonePe.
- Whether the cart merge on sign-in sums quantities or takes the larger (either is fine, capped at stock).
