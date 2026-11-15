import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";

interface AuthState {
  user: User | null;
  ready: boolean;
}

export const useAuth = create<AuthState>(() => ({ user: null, ready: !isFirebaseConfigured }));

let started = false;
export function startAuthListener() {
  if (started || !isFirebaseConfigured) return;
  started = true;
  onAuthStateChanged(getFirebaseAuth(), (user) => useAuth.setState({ user, ready: true }));
}

export const signInWithGoogle = () =>
  signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
export const signOutUser = () => signOut(getFirebaseAuth());

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(getFirebaseAuth(), email, password);
export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(getFirebaseAuth(), email, password);

export const resetPassword = (email: string) => sendPasswordResetEmail(getFirebaseAuth(), email);

const AUTH_ERRORS: Record<string, string> = {
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "No account with this email. Create one instead.",
  "auth/email-already-in-use": "An account with this email already exists. Sign in instead.",
  "auth/weak-password": "Use at least 6 characters for your password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/too-many-requests": "Too many attempts. Try again in a few minutes.",
  "auth/network-request-failed": "You seem to be offline. Check your connection.",
  "auth/unauthorized-domain": "Google sign-in isn't enabled for this site address yet.",
  "auth/operation-not-allowed": "This sign-in method is turned off in Firebase. Enable it under Authentication → Sign-in method.",
  "auth/configuration-not-found": "Sign-in isn't set up in Firebase yet. Enable a provider under Authentication → Sign-in method.",
};

// Returns null when the user simply closed the Google popup, so no error is shown.
export function authErrorMessage(e: unknown): string | null {
  const code = e instanceof FirebaseError ? e.code : "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return null;
  return AUTH_ERRORS[code] ?? `Something went wrong${code ? ` (${code})` : ""}. Please try again.`;
}
