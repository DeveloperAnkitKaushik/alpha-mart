import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { serverEnv } from "@/lib/server/env";

export class AuthError extends Error {}

function adminApp(): App {
  return getApps()[0] ?? initializeApp({ credential: cert(serverEnv().FIREBASE_SERVICE_ACCOUNT) });
}

export const adminDb = (): Firestore => getFirestore(adminApp());
export const adminAuth = (): Auth => getAuth(adminApp());

export async function requireUser(idToken: unknown): Promise<string> {
  if (typeof idToken !== "string" || !idToken) throw new AuthError("Missing token");
  try {
    return (await adminAuth().verifyIdToken(idToken)).uid;
  } catch {
    throw new AuthError("Invalid or expired token");
  }
}

export async function requireAdmin(idToken: unknown): Promise<string> {
  const uid = await requireUser(idToken);
  if (!(await adminDb().doc(`admins/${uid}`).get()).exists) throw new AuthError("Not an admin");
  return uid;
}
