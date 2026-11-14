"use client";

import React, { createContext, useContext } from "react";
import type { StoreSettings } from "@/lib/types";

const StoreContext = createContext<StoreSettings | null>(null);

export function StoreProvider({
  store,
  children,
}: {
  store: StoreSettings;
  children: React.ReactNode;
}) {
  return (
    <StoreContext.Provider value={store}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreSettings(): StoreSettings | null {
  return useContext(StoreContext);
}
