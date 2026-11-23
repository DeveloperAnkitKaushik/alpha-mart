"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSiteContent } from "@/components/site/site-content";
import { toItems, type InboxItem } from "@/lib/dashboard-api";
import { listInbox, listMyInbox } from "@/lib/inbox-actions";

type InboxState = { items: InboxItem[] | null; error: boolean; retry: () => void };

export const INBOX_KEY = ["inbox"] as const;

// Staff get every item and poll for new ones; a buyer gets only their own.
export function useInbox(mode: "staff" | { uid: string }): InboxState {
  const staff = mode === "staff";
  const query = useQuery({
    queryKey: [...INBOX_KEY, staff ? "staff" : mode.uid],
    queryFn: staff ? () => listInbox() : () => listMyInbox(),
    refetchInterval: staff ? 30_000 : false,
  });
  const products = useSiteContent().products;
  const items = useMemo(
    () => (query.data ? toItems(query.data, (id) => products.find((p) => p.id === id)?.name ?? id) : null),
    [query.data, products],
  );
  const { refetch } = query;
  return { items, error: query.isError, retry: () => void refetch() };
}

export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}
