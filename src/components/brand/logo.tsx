"use client";

import Link from "next/link";
import { openAdminAccessModal } from "@/components/admin/admin-access-gate";

export function Logo({ light = true }: { light?: boolean }) {
  const handleBadgeDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openAdminAccessModal();
  };

  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Liberty K, accueil">
      <span
        onDoubleClick={handleBadgeDoubleClick}
        title="Liberty K"
        className="grid size-9 place-items-center rounded-xl text-lg font-bold bg-[#d5bb7d] text-black shadow-sm transition-transform group-hover:-rotate-3"
      >
        ל
      </span>
      <span className="text-xl font-bold tracking-tight text-white">
        liberty <span className="text-[#d5bb7d] font-black">K</span>
      </span>
    </Link>
  );
}
