import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { z } from "zod";

const envSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  appId: z.string().min(1),
});

// Next.js inlines NEXT_PUBLIC_* only when referenced statically.
const parsed = envSchema.safeParse({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

export const isFirebaseConfigured = parsed.success;

function app(): FirebaseApp {
  if (!parsed.success) throw new Error("Firebase env is not configured");
  return getApps().length ? getApp() : initializeApp(parsed.data);
}

export const getDb = (): Firestore => getFirestore(app());
export const getFirebaseAuth = (): Auth => getAuth(app());
