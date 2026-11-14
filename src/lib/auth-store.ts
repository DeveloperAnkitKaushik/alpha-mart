import { create } from "zustand";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
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
