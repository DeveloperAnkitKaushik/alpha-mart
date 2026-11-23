import { boolean, customType, datetime, index, int, longtext, mysqlTable, primaryKey, text, varchar } from "drizzle-orm/mysql-core";
import type { PgState, OrderStatus } from "@/lib/store/order-state";
import type { PricedLine } from "@/lib/store/pricing";
import type { Address, CartLine } from "@/lib/store/schemas";

// MariaDB's JSON type is LONGTEXT and comes back as a string, so (de)serialise here.
const jsonText = <T>() =>
  customType<{ data: T; driverData: string }>({
    dataType: () => "longtext",
    toDriver: (v) => JSON.stringify(v),
    fromDriver: (v) => (typeof v === "string" ? JSON.parse(v) : v) as T,
  });

const mediumBlob = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "mediumblob" });

const id = (name = "id") => varchar(name, { length: 64 });
const ms = (name: string) => datetime(name, { mode: "date", fsp: 3 });

// --- Better Auth tables (field names are Better Auth's defaults) ---

export const user = mysqlTable("user", {
  id: id().primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: ms("created_at").notNull(),
  updatedAt: ms("updated_at").notNull(),
});

export const session = mysqlTable(
  "session",
  {
    id: id().primaryKey(),
    expiresAt: ms("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: ms("created_at").notNull(),
    updatedAt: ms("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: id("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = mysqlTable(
  "account",
  {
    id: id().primaryKey(),
    accountId: varchar("account_id", { length: 255 }).notNull(),
    providerId: varchar("provider_id", { length: 64 }).notNull(),
    userId: id("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ms("access_token_expires_at"),
    refreshTokenExpiresAt: ms("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: ms("created_at").notNull(),
    updatedAt: ms("updated_at").notNull(),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = mysqlTable(
  "verification",
  {
    id: id().primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: ms("expires_at").notNull(),
    createdAt: ms("created_at").notNull(),
    updatedAt: ms("updated_at").notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// --- App tables ---

export const admins = mysqlTable("admins", {
  userId: id("user_id").primaryKey(),
});

export const siteContent = mysqlTable("site_content", {
  id: int("id").primaryKey(),
  json: longtext("json").notNull(),
  updatedAt: ms("updated_at").notNull(),
});

export const images = mysqlTable("images", {
  id: varchar("id", { length: 40 }).primaryKey(),
  data: mediumBlob("data").notNull(),
  type: varchar("type", { length: 20 }).$type<"image/webp" | "image/jpeg">().notNull(),
  by: id("by").notNull(),
  createdAt: ms("created_at").notNull(),
});

export const stock = mysqlTable("stock", {
  productId: varchar("product_id", { length: 80 }).primaryKey(),
  available: int("available").notNull(),
  updatedAt: ms("updated_at").notNull(),
});

export const coupons = mysqlTable("coupons", {
  code: varchar("code", { length: 20 }).primaryKey(),
  type: varchar("type", { length: 10 }).$type<"flat" | "percent">().notNull(),
  value: int("value").notNull(),
  maxDiscount: int("max_discount"),
  minOrder: int("min_order").notNull(),
  expiresAt: varchar("expires_at", { length: 10 }).notNull(),
  active: boolean("active").notNull(),
  maxUses: int("max_uses"),
  oncePerCustomer: boolean("once_per_customer").notNull(),
  uses: int("uses").notNull().default(0),
});

export const orders = mysqlTable(
  "orders",
  {
    id: varchar("id", { length: 20 }).primaryKey(),
    uid: id("uid").notNull(),
    items: jsonText<PricedLine[]>()("items").notNull(),
    subtotal: int("subtotal").notNull(),
    discount: int("discount").notNull(),
    couponCode: varchar("coupon_code", { length: 20 }),
    total: int("total").notNull(),
    address: jsonText<Address>()("address").notNull(),
    status: varchar("status", { length: 20 }).$type<OrderStatus>().notNull(),
    pgState: varchar("pg_state", { length: 12 }).$type<PgState>(),
    pgTransactionId: varchar("pg_transaction_id", { length: 100 }),
    reservedUntil: ms("reserved_until").notNull(),
    createdAt: ms("created_at").notNull(),
    updatedAt: ms("updated_at").notNull(),
    trackingNote: varchar("tracking_note", { length: 300 }).notNull().default(""),
    checkoutUrl: text("checkout_url"),
  },
  (t) => [
    index("orders_uid_created_idx").on(t.uid, t.createdAt),
    index("orders_status_created_idx").on(t.status, t.createdAt),
    index("orders_uid_coupon_idx").on(t.uid, t.couponCode),
  ],
);

export const carts = mysqlTable("carts", {
  uid: id("uid").primaryKey(),
  items: jsonText<CartLine[]>()("items").notNull(),
});

export const favorites = mysqlTable(
  "favorites",
  {
    uid: id("uid").notNull(),
    productId: varchar("product_id", { length: 80 }).notNull(),
    createdAt: ms("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.uid, t.productId] })],
);

export const profiles = mysqlTable("profiles", {
  uid: id("uid").primaryKey(),
  address: jsonText<Address>()("address").notNull(),
});

const inboxColumns = {
  id: varchar("id", { length: 40 }).primaryKey(),
  uid: id("uid"),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 10 }).notNull(),
  quantity: varchar("quantity", { length: 40 }).notNull(),
  status: varchar("status", { length: 12 }).$type<"new" | "contacted" | "quoted" | "won" | "lost">().notNull().default("new"),
  notes: text("notes").notNull(),
  createdAt: ms("created_at").notNull(),
  updatedAt: ms("updated_at"),
  updatedBy: id("updated_by"),
};

export const leads = mysqlTable(
  "leads",
  {
    ...inboxColumns,
    productId: varchar("product_id", { length: 80 }).notNull(),
    supplierId: varchar("supplier_id", { length: 80 }).notNull(),
    message: text("message"),
  },
  (t) => [index("leads_created_idx").on(t.createdAt), index("leads_uid_idx").on(t.uid)],
);

export const requirements = mysqlTable(
  "requirements",
  {
    ...inboxColumns,
    title: varchar("title", { length: 200 }).notNull(),
    category: varchar("category", { length: 80 }).notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    budget: varchar("budget", { length: 80 }),
    details: text("details"),
  },
  (t) => [index("requirements_created_idx").on(t.createdAt), index("requirements_uid_idx").on(t.uid)],
);
