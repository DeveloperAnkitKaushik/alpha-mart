"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { startAuthListener } from "@/lib/auth-store";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );
  useEffect(startAuthListener, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
