// One-off copy of Firestore + Firebase Auth into MySQL. Safe to re-run: INSERT IGNORE only adds missing rows.
// Usage: FIREBASE_SERVICE_ACCOUNT=<base64 json> DATABASE_URL=mysql://... node scripts/migrate-from-firestore.mjs
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { createConnection } from "mysql2/promise";

const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT ?? "", "base64").toString("utf8"));
const app = initializeApp({ credential: cert(sa) });
const fs = getFirestore(app);
const sql = await createConnection({ uri: process.env.DATABASE_URL, timezone: "Z" });

const date = (v) => (v instanceof Timestamp ? v.toDate() : v ? new Date(v) : new Date());
const json = (v) => JSON.stringify(v);
const counts = {};

async function insert(table, row) {
  const cols = Object.keys(row);
  const [res] = await sql.query(`INSERT IGNORE INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(",")}) VALUES (?)`, [cols.map((c) => row[c])]);
  counts[table] = (counts[table] ?? 0) + res.affectedRows;
}

const docs = async (name) => (await fs.collection(name).get()).docs;

// Users first so everything else that points at a uid still resolves.
// SKIP_USERS=1 leaves accounts behind: without reset emails, copied users could neither sign in nor re-register.
const copyUsers = process.env.SKIP_USERS !== "1";
let page;
while (copyUsers) {
  page = await getAuth(app).listUsers(1000, page?.pageToken);
  for (const u of page.users) {
    if (!u.email) continue;
    await insert("user", {
      id: u.uid,
      name: u.displayName ?? u.email.split("@")[0],
      email: u.email.toLowerCase(),
      email_verified: u.emailVerified ? 1 : 0,
      image: u.photoURL ?? null,
      created_at: new Date(u.metadata.creationTime),
      updated_at: new Date(),
    });
  }
  if (!page.pageToken) break;
}

if (copyUsers) for (const d of await docs("admins")) await insert("admins", { user_id: d.id });

const content = await fs.doc("site/content").get();
if (content.exists) await insert("site_content", { id: 1, json: content.get("json"), updated_at: new Date() });

for (const d of await docs("images")) {
  const v = d.data();
  await insert("images", { id: d.id, data: Buffer.from(v.data, "base64"), type: v.type, by: v.by ?? "", created_at: date(v.createdAt) });
}

for (const d of await docs("stock")) await insert("stock", { product_id: d.id, available: Math.max(0, d.get("available") ?? 0), updated_at: date(d.get("updatedAt")) });

for (const d of await docs("coupons")) {
  const v = d.data();
  await insert("coupons", {
    code: d.id,
    type: v.type,
    value: v.value,
    max_discount: v.maxDiscount ?? null,
    min_order: v.minOrder,
    expires_at: v.expiresAt,
    active: v.active ? 1 : 0,
    max_uses: v.maxUses ?? null,
    once_per_customer: v.oncePerCustomer ? 1 : 0,
    uses: v.uses ?? 0,
  });
}

for (const d of await docs("orders")) {
  const v = d.data();
  await insert("orders", {
    id: d.id,
    uid: v.uid,
    items: json(v.items),
    subtotal: v.subtotal,
    discount: v.discount,
    coupon_code: v.couponCode ?? null,
    total: v.total,
    address: json(v.address),
    status: v.status,
    pg_state: v.phonepe?.state ?? null,
    pg_transaction_id: v.phonepe?.transactionId ?? null,
    reserved_until: date(v.reservedUntil),
    created_at: date(v.createdAt),
    updated_at: date(v.updatedAt),
    tracking_note: v.trackingNote ?? "",
    checkout_url: v.checkoutUrl ?? null,
  });
}

for (const d of await docs("carts")) await insert("carts", { uid: d.id, items: json(d.get("items") ?? []) });
for (const d of await docs("profiles")) if (d.get("address")) await insert("profiles", { uid: d.id, address: json(d.get("address")) });
for (const d of await docs("favorites")) {
  for (const productId of d.get("productIds") ?? []) await insert("favorites", { uid: d.id, product_id: productId, created_at: new Date() });
}

const inbox = (d) => {
  const v = d.data();
  return {
    id: d.id,
    uid: v.uid ?? null,
    name: v.name,
    phone: v.phone,
    quantity: String(v.quantity ?? ""),
    status: v.status ?? "new",
    notes: v.notes ?? "",
    created_at: date(v.createdAt),
    updated_at: v.updatedAt ? date(v.updatedAt) : null,
    updated_by: v.updatedBy ?? null,
  };
};
for (const d of await docs("leads")) {
  const v = d.data();
  await insert("leads", { ...inbox(d), product_id: v.productId, supplier_id: v.supplierId ?? "", message: v.message ?? null });
}
for (const d of await docs("requirements")) {
  const v = d.data();
  await insert("requirements", { ...inbox(d), title: v.title, category: v.category, city: v.city, budget: v.budget ?? null, details: v.details ?? null });
}

await sql.end();
process.stdout.write(`Copied rows: ${JSON.stringify(counts)}\n`);
