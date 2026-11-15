import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getDb, isFirebaseConfigured } from "./firebase";
import { leadSchema, requirementSchema, type LeadInput, type RequirementInput } from "./data";

export type SubmitResult = { demo: boolean };

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
