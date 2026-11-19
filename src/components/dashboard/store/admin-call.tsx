"use client";

import { RotateCw, ServerCrash } from "lucide-react";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { useAuth } from "@/lib/auth-store";

export async function adminToken(): Promise<string> {
  return (await useAuth.getState().user?.getIdToken()) ?? "";
}

// Turns an action's { ok: false } into a thrown Error so TanStack Query shows the error state.
export function unwrap<T extends { ok: boolean }>(res: T): Extract<T, { ok: true }> {
  if (!res.ok) throw new Error((res as { error?: string }).error ?? "Request failed");
  return res as Extract<T, { ok: true }>;
}

export function AdminError({ what, error, retry }: { what: string; error: unknown; retry: () => void }) {
  return (
    <StateCard icon={ServerCrash} tone="error" title={`We couldn't load ${what}`} body={error instanceof Error ? error.message : undefined}>
      <button type="button" onClick={retry} className={stateBtn.primary}>
        <RotateCw className="size-4" /> Try again
      </button>
    </StateCard>
  );
}
