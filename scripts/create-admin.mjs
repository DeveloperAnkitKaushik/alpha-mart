// Creates (or reuses) an email/password user the same way Better Auth stores one, then makes it an admin.
// Usage: DATABASE_URL=mysql://... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/create-admin.mjs
import { randomBytes } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { createConnection } from "mysql2/promise";

const email = process.env.ADMIN_EMAIL.toLowerCase();
const sql = await createConnection({ uri: process.env.DATABASE_URL, timezone: "Z" });
const now = new Date();
const [rows] = await sql.query("SELECT id FROM user WHERE email = ?", [email]);
const id = rows[0]?.id ?? randomBytes(16).toString("hex");
if (!rows[0]) {
  await sql.query("INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?,?,?,?,?,?)", [id, "Alpha Admin", email, 1, now, now]);
}
const hash = await hashPassword(process.env.ADMIN_PASSWORD);
const [acc] = await sql.query("SELECT id FROM account WHERE user_id = ? AND provider_id = 'credential'", [id]);
if (acc[0]) await sql.query("UPDATE account SET password = ?, updated_at = ? WHERE id = ?", [hash, now, acc[0].id]);
else await sql.query("INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (?,?,?,?,?,?,?)", [randomBytes(16).toString("hex"), id, "credential", id, hash, now, now]);
await sql.query("INSERT IGNORE INTO admins (user_id) VALUES (?)", [id]);
await sql.end();
process.stdout.write(`admin ready: ${email}\n`);
