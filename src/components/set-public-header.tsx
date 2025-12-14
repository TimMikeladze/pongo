"use client";

import { useEffect } from "react";
import { usePublicHeader } from "@/components/public-header-provider";

interface SetPublicHeaderProps {
  name: string;
  description?: string;
  hasIssues: boolean;
}

export function SetPublicHeader({
  name,
  description,
  hasIssues,
}: SetPublicHeaderProps) {
  const { setHeaderInfo } = usePublicHeader();

  useEffect(() => {
    setHeaderInfo({ name, description, hasIssues });
    return () => setHeaderInfo(null);
  }, [name, description, hasIssues, setHeaderInfo]);

  return null;
}
