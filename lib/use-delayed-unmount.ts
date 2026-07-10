"use client";

import { useEffect, useState } from "react";

export function useDelayedUnmount(active: boolean, duration: number) {
  const [mounted, setMounted] = useState(active);

  if (active && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (active || !mounted) return;
    const timer = window.setTimeout(() => setMounted(false), duration);
    return () => window.clearTimeout(timer);
  }, [active, mounted, duration]);

  return mounted;
}
