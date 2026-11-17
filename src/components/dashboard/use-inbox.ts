"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSiteContent } from "@/components/site/site-content";
import { subscribeInbox, subscribeMine, type InboxItem } from "@/lib/dashboard-api";

type InboxState = { items: InboxItem[] | null; error: boolean; retry: () => void };

// Live Firestore listener: staff get every item, a buyer gets only their own.
export function useInbox(mode: "staff" | { uid: string }): InboxState {
  const uid = mode === "staff" ? null : mode.uid;
  const [state, setState] = useState<{ items: InboxItem[] | null; error: boolean }>({ items: null, error: false });
  const [attempt, setAttempt] = useState(0);
  // Read at call time so a catalogue change doesn't tear down the live listener.
  const products = useSiteContent().products;
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);
  useEffect(() => {
    const nameOf = (id: string) => productsRef.current.find((p) => p.id === id)?.name ?? id;
    const onData = (items: InboxItem[]) => setState({ items, error: false });
    const onError = () => setState((s) => ({ ...s, error: true }));
    return uid ? subscribeMine(uid, nameOf, onData, onError) : subscribeInbox(nameOf, onData, onError);
  }, [uid, attempt]);
  const retry = useCallback(() => {
    setState({ items: null, error: false });
    setAttempt((a) => a + 1);
  }, []);
  return { ...state, retry };
}

export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}
