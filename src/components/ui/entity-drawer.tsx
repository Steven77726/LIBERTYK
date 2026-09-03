"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const drawerStack: string[] = [];

export function EntityDrawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const idRef = useRef(`drawer-${Math.random().toString(36).slice(2)}`);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[140] transition ${open ? "visible" : "invisible pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Fond sombre semi-transparent avec flou complet du reste du site */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
        onClick={onClose}
      />

      {/* Panneau Mobile (Bottom Sheet iOS) & Modal / Drawer Desktop */}
      <aside
        className={`absolute inset-x-0 bottom-0 z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[32px] bg-[#f9f9f6] shadow-2xl transition-transform duration-300 ease-out sm:inset-x-auto sm:right-0 sm:top-0 sm:h-full sm:max-h-full sm:max-w-xl sm:rounded-none sm:rounded-l-[32px] ${
          open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée de glissement visuelle style iOS sur mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-black/20" />
        </div>

        {/* En-tête avec titre et bouton Fermer ✕ ergonomique (44px) */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/[.06] bg-[#f9f9f6]/95 px-5 py-3.5 backdrop-blur-xl">
          <p className="truncate pr-4 text-base font-bold text-ink">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full bg-white text-ink shadow-xs transition hover:bg-ink hover:text-white cursor-pointer"
            aria-label="Fermer le panneau"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps défilable interne */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

