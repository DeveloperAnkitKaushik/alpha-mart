"use client";

import { useQuery } from "@tanstack/react-query";
import { LogOut, PlugZap, RotateCw, ShieldAlert, ShieldCheck } from "lucide-react";
import { StateCard } from "@/components/site/state-card";
import { stateBtn } from "@/components/site/state-styles";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { SignInView } from "@/components/site/signin-view";
import { signOutUser, useAuth } from "@/lib/auth-store";
import { isAdmin } from "@/lib/dashboard-api";
import { isFirebaseConfigured } from "@/lib/firebase";
import { BuyerView } from "./buyer-view";
import { StaffView } from "./staff-view";

function Header({ staff }: { staff: boolean }) {
  const email = useAuth((s) => s.user?.email ?? "");
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {staff && (
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1 text-xs font-bold text-white">
            <ShieldCheck className="size-3.5" aria-hidden /> Staff
          </p>
        )}
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-deep sm:text-4xl">{staff ? "Leads dashboard" : "My enquiries"}</h1>
        {email && <p className="mt-1 text-sm text-muted-foreground">Signed in as {email}</p>}
      </div>
      <button
        type="button"
        onClick={() => void signOutUser()}
        className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-navy ring-1 ring-border transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
      >
        <LogOut className="size-4" aria-hidden /> Sign out
      </button>
    </header>
  );
}

function SignedIn({ uid }: { uid: string }) {
  const role = useQuery({ queryKey: ["isAdmin", uid], queryFn: () => isAdmin(uid), staleTime: Infinity });
  if (role.isPending) return <DashboardSkeleton />;
  if (role.isError) {
    return (
      <StateCard icon={ShieldAlert} tone="error" title="We couldn't check your access" body="Something went wrong talking to our servers. Please try again.">
        <button type="button" onClick={() => void role.refetch()} className={stateBtn.primary}>
          <RotateCw className="size-4" /> Try again
        </button>
      </StateCard>
    );
  }
  return (
    <>
      <Header staff={role.data} />
      {role.data ? <StaffView /> : <BuyerView uid={uid} />}
    </>
  );
}

export function DashboardView() {
  const uid = useAuth((s) => s.user?.uid ?? null);
  const ready = useAuth((s) => s.ready);

  if (!isFirebaseConfigured) {
    return (
      <StateCard
        icon={PlugZap}
        tone="info"
        title="Dashboard unavailable in demo mode"
        body={<>Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your project keys to see enquiries here.</>}
      />
    );
  }
  if (!ready) return <DashboardSkeleton />;
  if (!uid) return <SignInView embedded />;
  return <SignedIn key={uid} uid={uid} />;
}
