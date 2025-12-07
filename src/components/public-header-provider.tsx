"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

interface PublicHeaderInfo {
  name: string;
  description?: string;
  hasIssues: boolean;
}

interface PublicHeaderContextValue {
  headerInfo: PublicHeaderInfo | null;
  setHeaderInfo: (info: PublicHeaderInfo | null) => void;
}

const PublicHeaderContext = createContext<PublicHeaderContextValue | null>(
  null,
);

export function PublicHeaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerInfo, setHeaderInfo] = useState<PublicHeaderInfo | null>(null);

  return (
    <PublicHeaderContext.Provider value={{ headerInfo, setHeaderInfo }}>
      {children}
    </PublicHeaderContext.Provider>
  );
}

export function usePublicHeader() {
  const context = useContext(PublicHeaderContext);
  if (!context) {
    throw new Error(
      "usePublicHeader must be used within a PublicHeaderProvider",
    );
  }
  return context;
}
