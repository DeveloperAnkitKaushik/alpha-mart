import { create } from "zustand";
import { createAuthClient } from "better-auth/client";

export interface AuthUser {
  uid: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
}

const authClient = createAuthClient();

export const useAuth = create<AuthState>(() => ({ user: null, ready: false }));

let started = false;
export function startAuthListener() {
  if (started) return;
  started = true;
  authClient.useSession.subscribe(({ data, isPending }) => {
    if (isPending) return;
    useAuth.setState({ user: data ? { uid: data.user.id, email: data.user.email } : null, ready: true });
  });
}

// Better Auth returns { error } instead of throwing; throw so callers keep one error path.
async function call<T extends { error: { code?: string; message?: string; status: number } | null }>(p: Promise<T>): Promise<T> {
  const res = await p;
  if (res.error) throw new AuthClientError(res.error.code ?? (res.error.status === 429 ? "TOO_MANY_REQUESTS" : ""), res.error.message);
  return res;
}

export class AuthClientError extends Error {
  constructor(
    readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

// Redirects to Google and back to the page the user started on.
export const signInWithGoogle = () => call(authClient.signIn.social({ provider: "google", callbackURL: window.location.href }));
export const signOutUser = () => call(authClient.signOut());

export const signInWithEmail = (email: string, password: string) => call(authClient.signIn.email({ email, password }));
export const signUpWithEmail = (email: string, password: string) =>
  call(authClient.signUp.email({ email, password, name: email.split("@")[0] ?? email }));

export const resetPassword = (email: string) =>
  call(authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` }));
export const setNewPassword = (token: string, newPassword: string) => call(authClient.resetPassword({ token, newPassword }));

const AUTH_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email or password is incorrect.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Sign in instead.",
  PASSWORD_TOO_SHORT: "Use at least 6 characters for your password.",
  INVALID_EMAIL: "Enter a valid email address.",
  INVALID_TOKEN: "This reset link has expired. Ask for a new one.",
  PROVIDER_NOT_FOUND: "Google sign-in isn't set up yet. Use email and password.",
  TOO_MANY_REQUESTS: "Too many attempts. Try again in a few minutes.",
};

export function authErrorMessage(e: unknown): string {
  if (e instanceof AuthClientError) return AUTH_ERRORS[e.code] ?? "Something went wrong. Please try again.";
  return "You seem to be offline. Check your connection.";
}
