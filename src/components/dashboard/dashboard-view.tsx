"use client";

import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyLeads, getOpenRequirements, type FeedItem } from "@/lib/api";
import { AuthDialog } from "@/components/site/auth-dialog";
import { useAuth } from "@/lib/auth-store";
import { isFirebaseConfigured } from "@/lib/firebase";

function Feed({ items, loading, empty }: { items?: FeedItem[]; loading: boolean; empty: string }) {
  if (loading) return <Skeleton className="h-40 rounded-2xl" />;
  if (!items?.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-muted-foreground">
        <Inbox className="size-8" />
        <p>{empty}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="font-medium">{i.title}</p>
            <p className="text-sm text-muted-foreground">{i.subtitle}</p>
          </div>
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand">{i.meta}</span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardView() {
  const uid = useAuth((s) => s.user?.uid ?? null);
  const ready = useAuth((s) => s.ready);

  const requirements = useQuery({
    queryKey: ["requirements", uid],
    queryFn: getOpenRequirements,
    enabled: uid !== null,
  });
  const leads = useQuery({
    queryKey: ["leads", uid],
    queryFn: () => getMyLeads(uid as string),
    enabled: uid !== null,
  });

  if (!isFirebaseConfigured) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
        Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code> and fill in your project keys.
      </p>
    );
  }
  if (!ready) return <Skeleton className="h-40 rounded-2xl" />;
  if (!uid) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-16 text-center">
        <p className="text-muted-foreground">Sign in to see your enquiries and open buyer requirements.</p>
        <AuthDialog trigger={<Button />} />
      </div>
    );
  }

  return (
    <Tabs defaultValue="requirements">
      <TabsList>
        <TabsTrigger value="requirements">Buyer requirements</TabsTrigger>
        <TabsTrigger value="leads">My enquiries</TabsTrigger>
      </TabsList>
      <TabsContent value="requirements" className="mt-6">
        <Feed items={requirements.data} loading={requirements.isPending} empty="No open requirements yet." />
      </TabsContent>
      <TabsContent value="leads" className="mt-6">
        <Feed items={leads.data} loading={leads.isPending} empty="You haven't sent any enquiries yet." />
      </TabsContent>
    </Tabs>
  );
}
