import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type FirestoreError,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { z } from "zod";
import { getDb } from "./firebase";
import { DEALS } from "./shop-data";

export const STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const;
export type Status = (typeof STATUSES)[number];
export type Kind = "lead" | "requirement" | "callback";
type Coll = "leads" | "requirements";

export const CALLBACK_TITLE = "Callback request from footer";

export interface InboxItem {
  key: string;
  id: string;
  coll: Coll;
  kind: Kind;
  name: string;
  phone: string;
  title: string;
  status: Status;
  notes: string;
  createdAt: number;
  fields: [string, string][];
}

const base = {
  name: z.string(),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  quantity: z.coerce.string(),
  createdAt: z.instanceof(Timestamp).optional(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().optional(),
};
const leadDoc = z.object({ ...base, productId: z.string(), message: z.string().optional() });
const requirementDoc = z.object({
  ...base,
  title: z.string(),
  category: z.string(),
  city: z.string(),
  budget: z.string().optional(),
  details: z.string().optional(),
});

const present = (pairs: [string, string | undefined][]) =>
  pairs.filter((p): p is [string, string] => Boolean(p[1]));

function toItem(coll: Coll, d: QueryDocumentSnapshot): InboxItem | null {
  // "estimate" fills a pending serverTimestamp so a just-created doc still has a time.
  const raw = d.data({ serverTimestamps: "estimate" });
  const common = { key: `${coll}/${d.id}`, id: d.id, coll };
  if (coll === "leads") {
    const r = leadDoc.safeParse(raw);
    if (!r.success) return null;
    const v = r.data;
    const product = DEALS.find((p) => p.id === v.productId)?.name ?? v.productId;
    return {
      ...common,
      kind: "lead",
      name: v.name,
      phone: v.phone,
      title: product,
      status: v.status ?? "new",
      notes: v.notes ?? "",
      createdAt: v.createdAt?.toMillis() ?? 0,
      fields: present([["Product", product], ["Quantity", v.quantity], ["Message", v.message]]),
    };
  }
  const r = requirementDoc.safeParse(raw);
  if (!r.success) return null;
  const v = r.data;
  return {
    ...common,
    kind: v.title === CALLBACK_TITLE ? "callback" : "requirement",
    name: v.name,
    phone: v.phone,
    title: v.title,
    status: v.status ?? "new",
    notes: v.notes ?? "",
    createdAt: v.createdAt?.toMillis() ?? 0,
    fields: present([
      ["Title", v.title],
      ["Category", v.category],
      ["Quantity", v.quantity],
      ["City", v.city],
      ["Budget", v.budget],
      ["Details", v.details],
    ]),
  };
}

function subscribeBoth(
  queries: Record<Coll, Query>,
  onData: (items: InboxItem[]) => void,
  onError: (e: FirestoreError) => void,
): () => void {
  const latest: Record<Coll, InboxItem[] | null> = { leads: null, requirements: null };
  const emit = () => {
    if (!latest.leads || !latest.requirements) return;
    onData([...latest.leads, ...latest.requirements].sort((a, b) => b.createdAt - a.createdAt));
  };
  const unsubs = (Object.keys(queries) as Coll[]).map((coll) =>
    onSnapshot(
      queries[coll],
      (snap) => {
        latest[coll] = snap.docs.flatMap((d) => toItem(coll, d) ?? []);
        emit();
      },
      onError,
    ),
  );
  return () => unsubs.forEach((u) => u());
}

// shortcut: staff inbox loads the newest 500 of each collection; add paging when volume grows past that.
const STAFF_LIMIT = 500;

export function subscribeInbox(onData: (items: InboxItem[]) => void, onError: (e: FirestoreError) => void) {
  const db = getDb();
  const q = (c: Coll) => query(collection(db, c), orderBy("createdAt", "desc"), limit(STAFF_LIMIT));
  return subscribeBoth({ leads: q("leads"), requirements: q("requirements") }, onData, onError);
}

export function subscribeMine(uid: string, onData: (items: InboxItem[]) => void, onError: (e: FirestoreError) => void) {
  const db = getDb();
  const q = (c: Coll) => query(collection(db, c), where("uid", "==", uid), limit(100));
  return subscribeBoth({ leads: q("leads"), requirements: q("requirements") }, onData, onError);
}

export async function isAdmin(uid: string): Promise<boolean> {
  try {
    return (await getDoc(doc(getDb(), "admins", uid))).exists();
  } catch (e) {
    // Before the new rules are deployed the admins read is denied; that means "not staff".
    if ((e as FirestoreError).code === "permission-denied") return false;
    throw e;
  }
}

export const updateItem = (item: Pick<InboxItem, "coll" | "id">, patch: { status: Status; notes: string }, uid: string) =>
  updateDoc(doc(getDb(), item.coll, item.id), {
    status: patch.status,
    notes: patch.notes,
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
