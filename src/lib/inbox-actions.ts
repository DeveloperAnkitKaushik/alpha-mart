"use server";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { currentUser, isAdminId, requireAdmin, requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { leads, requirements } from "@/lib/server/db/schema";
import { STATUSES, type InboxRows } from "./dashboard-api";

const leadCols = {
  id: leads.id,
  name: leads.name,
  phone: leads.phone,
  quantity: leads.quantity,
  status: leads.status,
  notes: leads.notes,
  createdAt: leads.createdAt,
  productId: leads.productId,
  message: leads.message,
};
const requirementCols = {
  id: requirements.id,
  name: requirements.name,
  phone: requirements.phone,
  quantity: requirements.quantity,
  status: requirements.status,
  notes: requirements.notes,
  createdAt: requirements.createdAt,
  title: requirements.title,
  category: requirements.category,
  city: requirements.city,
  budget: requirements.budget,
  details: requirements.details,
};

// shortcut: staff inbox loads the newest 500 of each table; add paging when volume grows past that.
const STAFF_LIMIT = 500;

export async function listInbox(): Promise<InboxRows> {
  await requireAdmin();
  const [l, r] = await Promise.all([
    db().select(leadCols).from(leads).orderBy(desc(leads.createdAt)).limit(STAFF_LIMIT),
    db().select(requirementCols).from(requirements).orderBy(desc(requirements.createdAt)).limit(STAFF_LIMIT),
  ]);
  return { leads: l, requirements: r };
}

export async function listMyInbox(): Promise<InboxRows> {
  const uid = await requireUser();
  const [l, r] = await Promise.all([
    db().select(leadCols).from(leads).where(eq(leads.uid, uid)).orderBy(desc(leads.createdAt)).limit(100),
    db().select(requirementCols).from(requirements).where(eq(requirements.uid, uid)).orderBy(desc(requirements.createdAt)).limit(100),
  ]);
  return { leads: l, requirements: r };
}

export async function amIAdmin(): Promise<boolean> {
  const user = await currentUser();
  return user ? isAdminId(user.id) : false;
}

const updateSchema = z.object({
  coll: z.enum(["leads", "requirements"]),
  id: z.string().regex(/^[A-Za-z0-9]{1,40}$/),
  status: z.enum(STATUSES),
  notes: z.string().max(2000),
});

export async function updateInboxItem(coll: unknown, id: unknown, patch: { status: unknown; notes: unknown }): Promise<void> {
  const uid = await requireAdmin();
  const v = updateSchema.parse({ coll, id, status: patch.status, notes: patch.notes });
  const table = v.coll === "leads" ? leads : requirements;
  await db().update(table).set({ status: v.status, notes: v.notes, updatedAt: new Date(), updatedBy: uid }).where(eq(table.id, v.id));
}
