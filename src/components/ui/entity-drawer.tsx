"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const drawerStack: string[] = [];

export function EntityDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const idRef = useRef(`drawer-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!open) return;
    const id = idRef.current;
    drawerStack.push(id);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && drawerStack.at(-1) === id) {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
      const index = drawerStack.indexOf(id);
      if (index >= 0) drawerStack.splice(index, 1);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[80] transition ${open ? "visible" : "invisible"}`}
      aria-hidden={!open}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onTouchStart={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        className={`absolute inset-0 bg-ink/35 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        aria-hidden
        onMouseDown={(event) => { event.stopPropagation(); onClose(); }}
        onTouchStart={(event) => { event.stopPropagation(); onClose(); }}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full overflow-y-auto bg-cream shadow-2xl transition-transform duration-300 sm:max-w-xl ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[.06] bg-cream/90 px-5 py-4 backdrop-blur-xl">
          <p className="truncate pr-4 text-sm font-semibold">{title}</p>
          <button onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-sm" aria-label="Fermer"><X size={18} /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}
