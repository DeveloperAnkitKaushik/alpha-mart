"use client";

import { createContext, useContext, type ReactNode } from "react";

const StoreFlagContext = createContext(false);

export function StoreFlagProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <StoreFlagContext.Provider value={enabled}>{children}</StoreFlagContext.Provider>;
}

export const useStoreEnabled = () => useContext(StoreFlagContext);
