"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/client-store";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `liberty-page-view:${pathname}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    trackEvent("page_view", pathname, pathname);
  }, [pathname]);

  return null;
}
