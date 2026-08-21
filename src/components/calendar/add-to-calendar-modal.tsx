"use client";

import { Check, Download, ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { downloadIcsFile, generateGoogleCalendarUrl } from "@/lib/hebcal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  event: {
    title: string;
    description: string;
    location?: string;
    startDateIso: string;
    endDateIso?: string;
    alarmMinutesBefore?: number;
  } | null;
};

export function AddToCalendarModal({ isOpen, onClose, event }: Props) {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !event) return null;

  const handleGoogleClick = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  const handleAppleClick = () => {
    downloadIcsFile(event);
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
      onClose();
    }, 1200);
  };

  const formattedDate = new Date(event.startDateIso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl transition-all sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-cream text-ink/50 transition hover:bg-ink hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f6ecd9] text-xl">
            📅
          </span>
          <h3 className="mt-3 text-lg font-bold text-ink sm:text-xl">{event.title}</h3>
          <p className="mt-1 text-xs font-semibold capitalize text-moss">{formattedDate}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink/60">{event.description}</p>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
            Choisir votre application d&apos;agenda :
          </p>

          {/* Google Agenda */}
          <button
            type="button"
            onClick={handleGoogleClick}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 text-left shadow-2xs transition hover:border-[#4285F4] hover:bg-[#4285F4]/5"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-blue-50 text-[#4285F4]">
                <ExternalLink size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Google Agenda</p>
                <p className="text-[11px] text-ink/50">Ajout direct en 1 clic dans votre calendrier</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#4285F4]">
              Ajouter
            </span>
          </button>

          {/* Apple Calendar (iPhone / Mac) */}
          <button
            type="button"
            onClick={handleAppleClick}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-4 text-left shadow-2xs transition hover:border-ink hover:bg-black/5"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-neutral-100 text-ink">
                {downloaded ? <Check size={18} className="text-moss" /> : <Download size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-ink">Apple Calendar / iPhone & Mac</p>
                <p className="text-[11px] text-ink/50">
                  Fichier .ics avec rappel automatique (15 min avant)
                </p>
              </div>
            </div>
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-bold text-ink">
              {downloaded ? "Téléchargé !" : "Télécharger"}
            </span>
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-cream/70 p-3 text-center text-[11px] text-ink/50">
          💡 Sur iPhone, touchez simplement le fichier téléchargé pour l&apos;ajouter instantanément à votre calendrier Apple.
        </div>
      </div>
    </div>
  );
}
