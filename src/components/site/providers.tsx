"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { startAuthListener } from "@/lib/auth-store";
import { startCartSync } from "@/lib/store/cart-store";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );
  useEffect(startAuthListener, []);
  useEffect(startCartSync, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
