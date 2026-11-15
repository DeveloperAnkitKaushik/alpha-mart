"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeInbox, subscribeMine, type InboxItem } from "@/lib/dashboard-api";

type InboxState = { items: InboxItem[] | null; error: boolean; retry: () => void };

// Live Firestore listener: staff get every item, a buyer gets only their own.
export function useInbox(mode: "staff" | { uid: string }): InboxState {
  const uid = mode === "staff" ? null : mode.uid;
  const [state, setState] = useState<{ items: InboxItem[] | null; error: boolean }>({ items: null, error: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const onData = (items: InboxItem[]) => setState({ items, error: false });
    const onError = () => setState((s) => ({ ...s, error: true }));
    return uid ? subscribeMine(uid, onData, onError) : subscribeInbox(onData, onError);
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
