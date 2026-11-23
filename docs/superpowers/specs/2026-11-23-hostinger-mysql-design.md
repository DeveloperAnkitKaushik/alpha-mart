# Move off Firebase: MySQL + own auth on Hostinger

## Why

The owner will run ads. Firestore's free tier (50k reads/day) runs out at a few thousand visitors, and checkout breaks until the daily reset. The owner wants the whole stack on the Hostinger Cloud Startup plan they already pay for, with no Firebase at all.

## Goals

- Every piece of data lives in the MySQL/MariaDB database that comes with Hostinger Cloud Startup.
- Sign-in (email + password, Google, password reset) runs inside the Next.js app.
- Store logic stays the same: pricing, coupons, stock holds, order states, PhonePe flow and their 51 tests.
- Existing Firestore data (site content, images, stock, coupons, orders, leads, requirements, carts, favourites, profiles, admins, users) is copied across, keeping the same IDs, so image URLs, order links and PhonePe merchant order IDs stay valid.
- The `firebase` and `firebase-admin` packages, `firestore.rules`, `firestore.indexes.json` and `firebase.json` are removed.

## Non-goals

- A separate backend service. Next.js server actions and route handlers already are the backend.
- Moving users' Firebase password hashes. Email/password users set a new password through "Forgot password". Google users sign in with Google again and land on the same account (matched by email).
- Realtime pushes. Firestore `onSnapshot` listeners become TanStack Query reads with polling where staff need fresh data.

## Approaches considered

1. **Keep Next.js and swap Firestore for MySQL (picked).** One app, one deploy. The database runs on the same Hostinger server, so queries are fast and have no daily cap.
2. **Separate Express API.** Adds a second app and a network hop between the two. Slower to build and to run, and gains nothing.
3. **Python backend.** Same downsides as Express. Hostinger Cloud Startup has no Python app hosting.

## Decisions

- **Database:** MariaDB (what Hostinger provides), accessed through Drizzle ORM and `mysql2`. Schema lives in `src/lib/server/db/schema.ts`. Migrations are generated with `drizzle-kit` and committed under `drizzle/`.
- **Auth:** Better Auth with its Drizzle adapter. It covers email/password, Google OAuth, password reset, cookie sessions and built-in rate limiting. Minimum password length stays 6 to match the existing form.
- **Sessions:** server actions read the session cookie with `auth.api.getSession({ headers })`. They no longer take an `idToken` argument. `requireUser()` and `requireAdmin()` keep their names and return the user id.
- **Admins:** an `admins` table keyed by user id, as today.
- **Reset emails:** sent with `nodemailer` through a Hostinger mailbox (SMTP). Without SMTP env, the reset button explains that reset isn't available yet.
- **Images:** stored in an `images` table as `MEDIUMBLOB`, served by the existing `/api/img/[id]` route.
- **Site content:** one row in `site_content`, read in a `'use cache'` function tagged `site-content`. Hostinger runs one Node process, so `updateTag` after publish refreshes it immediately.
- **Client reads** (stock, favourites, profile, cart, my orders, my enquiries, staff inbox) become server actions called through TanStack Query.
- **Transactions:** stock, coupon and order changes run in a MySQL transaction with `SELECT ... FOR UPDATE` on the rows they read, replacing Firestore transactions.
- **Order IDs:** 20 random letters and digits, the same shape as Firestore IDs, which the PhonePe webhook already validates.
- **Users:** Better Auth's `user` table. Migrated Firebase users keep their Firebase uid as their user id, so existing orders, carts and favourites still belong to them.
- **Migration:** a one-off script reads Firestore and Firebase Auth with `firebase-admin` and writes MySQL. It runs once against the Hostinger database, then the script and `firebase-admin` are deleted.

## New environment

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (same as `SITE_URL`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. The `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_SERVICE_ACCOUNT` variables go away.

## Owner setup

- Create a MySQL database and user in hPanel → Databases.
- Create a Google OAuth client (Google Cloud Console → Credentials) with redirect URI `https://<site>/api/auth/callback/google`.
- Create a mailbox such as `no-reply@<domain>` for reset emails.

## Left to the builder

- Exact column types and indexes, following the query shapes in `src/lib/server/orders.ts` and the admin actions.
- Poll intervals for the staff inbox and orders.
