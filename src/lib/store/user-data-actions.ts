"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { carts, favorites, profiles, stock } from "@/lib/server/db/schema";
import { addressSchema, cartLineSchema, type Address, type CartLine } from "./schemas";

const productIdSchema = z.string().min(1).max(80);
const linesSchema = z.array(cartLineSchema).max(30);

export async function getStock(): Promise<Record<string, number>> {
  const rows = await db().select({ productId: stock.productId, available: stock.available }).from(stock);
  return Object.fromEntries(rows.map((r) => [r.productId, Math.max(0, r.available)]));
}

export async function getFavorites(): Promise<string[]> {
  const uid = await requireUser();
  const rows = await db().select({ productId: favorites.productId }).from(favorites).where(eq(favorites.uid, uid));
  return rows.map((r) => r.productId);
}

// Returns whether the product is a favourite after the toggle.
export async function toggleFavorite(productId: string): Promise<boolean> {
  const uid = await requireUser();
  const id = productIdSchema.parse(productId);
  const match = and(eq(favorites.uid, uid), eq(favorites.productId, id));
  const existing = await db().select({ productId: favorites.productId }).from(favorites).where(match).limit(1);
  if (existing.length > 0) {
    await db().delete(favorites).where(match);
    return false;
  }
  await db().insert(favorites).ignore().values({ uid, productId: id, createdAt: new Date() });
  return true;
}

export async function getCart(): Promise<CartLine[]> {
  const uid = await requireUser();
  const rows = await db().select({ items: carts.items }).from(carts).where(eq(carts.uid, uid)).limit(1);
  const items: unknown = rows[0]?.items;
  return Array.isArray(items)
    ? items.flatMap((l) => {
        const r = cartLineSchema.safeParse(l);
        return r.success ? [r.data] : [];
      })
    : [];
}

export async function saveCart(lines: CartLine[]): Promise<void> {
  const uid = await requireUser();
  const items = linesSchema.parse(lines);
  await db().insert(carts).values({ uid, items }).onDuplicateKeyUpdate({ set: { items } });
}

export async function getProfile(): Promise<Address | null> {
  const uid = await requireUser();
  const rows = await db().select({ address: profiles.address }).from(profiles).where(eq(profiles.uid, uid)).limit(1);
  const r = addressSchema.safeParse(rows[0]?.address);
  return r.success ? r.data : null;
}

export async function saveProfile(address: Address): Promise<void> {
  const uid = await requireUser();
  const parsed = addressSchema.parse(address);
  await db()
    .insert(profiles)
    .values({ uid, address: parsed })
    .onDuplicateKeyUpdate({ set: { address: parsed } });
}
