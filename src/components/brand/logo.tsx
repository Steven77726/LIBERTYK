"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { openAdminAccessModal } from "@/components/admin/admin-access-gate";

export function Logo({ light = false }: { light?: boolean }) {
  const router = useRouter();
  const clickTimer = useRef<number | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (clickTimer.current) {
      window.clearTimeout(clickTimer.current);
      clickTimer.current = null;
      openAdminAccessModal();
      return;
    }

    clickTimer.current = window.setTimeout(() => {
      clickTimer.current = null;
      router.push("/");
    }, 240);
  };

  return (
    <Link href="/" onClick={handleClick} className="group flex items-center gap-2.5" aria-label="Liberty, accueil">
      <span className={`grid size-9 place-items-center rounded-xl text-lg font-semibold transition-transform group-hover:-rotate-3 ${light ? "bg-white text-moss" : "bg-moss text-white"}`}>ל</span>
      <span className={`text-xl font-semibold tracking-[-0.04em] ${light ? "text-white" : "text-ink"}`}>liberty<span className="text-gold">.</span></span>
    </Link>
  );
}
