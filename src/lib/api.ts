import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getFirebaseAuth, getDb, isFirebaseConfigured } from "./firebase";
import {
  leadSchema,
  productSchema,
  requirementSchema,
  SEED_PRODUCTS,
  type LeadInput,
  type Product,
  type RequirementInput,
} from "./data";

export type SubmitResult = { demo: boolean };

export interface FeedItem {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
}

async function remoteProducts(): Promise<Product[]> {
  if (!isFirebaseConfigured) return [];
  try {
    const snap = await getDocs(query(collection(getDb(), "products"), limit(100)));
    return snap.docs.flatMap((d) => {
      const r = productSchema.safeParse({ ...d.data(), id: d.id });
      return r.success ? [r.data] : [];
    });
  } catch {
    return [];
  }
}

const REMOTE_TIMEOUT_MS = 2000;

export async function getProducts(): Promise<Product[]> {
  // Firestore can hang when offline or before rules/DB exist; never block the catalogue on it.
  const remote = await Promise.race([
    remoteProducts(),
    new Promise<Product[]>((resolve) => setTimeout(() => resolve([]), REMOTE_TIMEOUT_MS)),
  ]);
  return remote.length ? remote : SEED_PRODUCTS;
}

export async function getProduct(id: string): Promise<Product | null> {
  return (await getProducts()).find((p) => p.id === id) ?? null;
}

// Firestore rejects undefined field values.
const defined = (o: object) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

export async function createLead(input: LeadInput): Promise<SubmitResult> {
  const data = leadSchema.parse(input);
  if (!isFirebaseConfigured) return { demo: true };
  await addDoc(collection(getDb(), "leads"), {
    ...defined(data),
    uid: getFirebaseAuth().currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
  });
  return { demo: false };
}

export async function createRequirement(input: RequirementInput): Promise<SubmitResult> {
  const data = requirementSchema.parse(input);
  if (!isFirebaseConfigured) return { demo: true };
  await addDoc(collection(getDb(), "requirements"), {
    ...defined(data),
    uid: getFirebaseAuth().currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
  });
  return { demo: false };
}

export async function getOpenRequirements(): Promise<FeedItem[]> {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(
    query(collection(getDb(), "requirements"), orderBy("createdAt", "desc"), limit(50)),
  );
  return snap.docs.map((d) => {
    const r = d.data();
    return {
      id: d.id,
      title: String(r.title),
      subtitle: `${r.quantity} · ${r.city}`,
      meta: String(r.category),
    };
  });
}

export async function getMyLeads(uid: string): Promise<FeedItem[]> {
  if (!isFirebaseConfigured) return [];
  const snap = await getDocs(
    query(collection(getDb(), "leads"), where("uid", "==", uid), limit(50)),
  );
  return snap.docs.map((d) => {
    const r = d.data();
    const product = SEED_PRODUCTS.find((p) => p.id === r.productId);
    return {
      id: d.id,
      title: product?.name ?? String(r.productId),
      subtitle: `Qty ${r.quantity}`,
      meta: product?.supplier.name ?? String(r.supplierId),
    };
  });
}
