"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchEvent, MouseEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { assetPath } from "@/lib/assets";

export type PhotoLightboxModalProps = {
  photos: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  title?: string;
};

export function PhotoLightboxModal({
  photos,
  initialIndex = 0,
  open,
  onClose,
  title,
}: PhotoLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Synchroniser l'index quand la modal s'ouvre
  useEffect(() => {
    if (open) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, photos.length - 1)));
      setIsZoomed(false);
    }
  }, [open, initialIndex, photos.length]);

  // Bloquer le scroll d'arrière-plan quand la lightbox est ouverte
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Raccourcis clavier (Flèches & Échap)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (photos.length > 1) {
          setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
          setIsZoomed(false);
        }
      } else if (e.key === "ArrowRight") {
        if (photos.length > 1) {
          setCurrentIndex((prev) => (prev + 1) % photos.length);
          setIsZoomed(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, photos.length, onClose]);

  if (!open || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];
  const hasMultiple = photos.length > 1;

  const handlePrev = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsZoomed(false);
  };

  const handleNext = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setIsZoomed(false);
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0]?.clientX ?? 0;
    const touchEndY = e.changedTouches[0]?.clientY ?? 0;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - (touchStartY.current ?? touchEndY);

    touchStartX.current = null;
    touchStartY.current = null;

    // Swipe horizontal
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    // Swipe vertical vers le bas pour fermer
    else if (deltaY > 80 && Math.abs(deltaY) > Math.abs(deltaX)) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Photos de ${title}` : "Zoom photo"}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md transition-opacity duration-200"
    >
      {/* Barre supérieure : Compteur, Zoom & Fermeture */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 to-transparent"
      >
        <div className="flex items-center gap-3">
          {hasMultiple && (
            <span className="rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white backdrop-blur">
              {currentIndex + 1} / {photos.length}
            </span>
          )}
          {title && (
            <span className="hidden sm:inline-block text-xs font-semibold text-white/70 truncate max-w-xs">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Zoom */}
          <button
            type="button"
            onClick={() => setIsZoomed((z) => !z)}
            aria-label={isZoomed ? "Réduire l'image" : "Agrandir l'image"}
            className="grid size-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 cursor-pointer"
          >
            {isZoomed ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* Bouton Fermer */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la vue photo (Échap)"
            className="grid size-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-rose-600 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Zone Centrale : Photo */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex size-full items-center justify-center p-2 sm:p-8 select-none"
      >
        <img
          src={assetPath(currentPhoto)}
          alt={title ? `${title} - Photo ${currentIndex + 1}` : `Photo ${currentIndex + 1}`}
          onClick={() => setIsZoomed((z) => !z)}
          className={`max-h-[85vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl transition-transform duration-300 ${
            isZoomed ? "scale-125 cursor-zoom-out" : "scale-100 cursor-zoom-in"
          }`}
        />

        {/* Flèche Précédent (Desktop) */}
        {hasMultiple && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Photo précédente (Flèche gauche)"
            className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:grid size-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/35 cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Flèche Suivant (Desktop) */}
        {hasMultiple && (
          <button
            type="button"
            onClick={handleNext}
            aria-label="Photo suivante (Flèche droite)"
            className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:grid size-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/35 cursor-pointer"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Barre inférieure discrète : Miniatures si plusieurs photos */}
      {hasMultiple && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 inset-x-0 z-20 flex justify-center px-4"
        >
          <div className="flex gap-2 overflow-x-auto max-w-full rounded-2xl bg-black/60 p-2 backdrop-blur">
            {photos.map((photo, idx) => (
              <button
                key={photo + idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`size-12 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  currentIndex === idx
                    ? "border-white scale-105 opacity-100"
                    : "border-white/20 opacity-50 hover:opacity-80"
                }`}
              >
                <img
                  src={assetPath(photo)}
                  alt={`Miniature ${idx + 1}`}
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
