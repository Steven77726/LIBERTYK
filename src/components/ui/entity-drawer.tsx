"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export function EntityDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-[80] transition ${open ? "visible" : "invisible"}`} aria-hidden={!open}>
      <button onClick={onClose} className={`absolute inset-0 bg-ink/35 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`} aria-label="Fermer la fiche" />
      <aside className={`absolute right-0 top-0 h-full w-full overflow-y-auto bg-cream shadow-2xl transition-transform duration-300 sm:max-w-xl ${open ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[.06] bg-cream/90 px-5 py-4 backdrop-blur-xl">
          <p className="truncate pr-4 text-sm font-semibold">{title}</p>
          <button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-sm" aria-label="Fermer"><X size={18} /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}
