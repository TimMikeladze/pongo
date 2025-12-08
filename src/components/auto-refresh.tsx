"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AutoRefreshProps {
  intervalSeconds: number;
}

export function AutoRefresh({ intervalSeconds }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (intervalSeconds <= 0) return;

    const intervalMs = intervalSeconds * 1000;
    const interval = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalSeconds, router]);

  return null;
}
