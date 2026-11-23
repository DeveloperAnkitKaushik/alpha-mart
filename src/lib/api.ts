"use server";

import { db } from "@/lib/server/db";
import { leads, requirements } from "@/lib/server/db/schema";
import { currentUser } from "@/lib/server/auth";
import { randomId } from "@/lib/server/random-id";
import { leadSchema, requirementSchema } from "./data";

// Public: anyone can enquire; a signed-in buyer's uid ties it to their dashboard.
export async function createLead(input: unknown): Promise<void> {
  const data = leadSchema.parse(input);
  const uid = (await currentUser())?.id ?? null;
  await db().insert(leads).values({ ...data, id: randomId(), uid, status: "new", notes: "", createdAt: new Date() });
}

export async function createRequirement(input: unknown): Promise<void> {
  const data = requirementSchema.parse(input);
  const uid = (await currentUser())?.id ?? null;
  await db().insert(requirements).values({ ...data, id: randomId(), uid, status: "new", notes: "", createdAt: new Date() });
}
