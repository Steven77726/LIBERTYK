"use client";

import React from "react";

export function getDeliverooUrl(name: string, city?: string, customUrl?: string): string {
  if (customUrl && customUrl.trim()) return customUrl.trim();
  const cleanName = name.replace(/restaurant/gi, "").trim();
  return `https://deliveroo.fr/fr/restaurants/${encodeURIComponent((city || "paris").toLowerCase())}?q=${encodeURIComponent(cleanName)}`;
}

export function getUberEatsUrl(name: string, city?: string, customUrl?: string): string {
  if (customUrl && customUrl.trim()) return customUrl.trim();
  const cleanName = name.replace(/restaurant/gi, "").trim();
  return `https://www.ubereats.com/fr/search?q=${encodeURIComponent(cleanName + " " + (city || "Paris"))}`;
}

export function DeliverooIcon({ className = "size-4", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.47 2L15.39 9.39L12.5 7.62L8.27 10.22L7.33 6.94L3.89 8.01L6.16 15.93C6.73 17.92 8.56 19.3 10.63 19.3H14.16C16.59 19.3 18.66 17.58 19.08 15.19L20.89 4.88L17.47 2Z"
        fill="#00CDBC"
      />
      <circle cx="10.8" cy="13.2" r="1.2" fill="#FFFFFF" />
      <circle cx="15.2" cy="13.2" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

export function UberEatsIcon({ className = "size-4", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="5" fill="#142328" />
      <path
        d="M5.5 12.5C5.5 9.74 7.74 7.5 10.5 7.5C13.26 7.5 15.5 9.74 15.5 12.5C15.5 15.26 13.26 17.5 10.5 17.5C7.74 17.5 5.5 15.26 5.5 12.5Z"
        fill="#06C167"
      />
      <path
        d="M10.5 10.2C9.23 10.2 8.2 11.23 8.2 12.5C8.2 13.77 9.23 14.8 10.5 14.8C11.77 14.8 12.8 13.77 12.8 12.5C12.8 11.23 11.77 10.2 10.5 10.2Z"
        fill="#FFFFFF"
      />
      <path
        d="M17.5 9.5H19V15.5H17.5V9.5Z"
        fill="#06C167"
      />
    </svg>
  );
}

type DeliveryLinksProps = {
  name: string;
  city?: string;
  deliverooUrl?: string;
  uberEatsUrl?: string;
  showDeliveroo?: boolean;
  showUberEats?: boolean;
  compact?: boolean;
};

export function DeliveryPlatformButtons({
  name,
  city,
  deliverooUrl,
  uberEatsUrl,
  showDeliveroo = true,
  showUberEats = true,
  compact = false,
}: DeliveryLinksProps) {
  const finalDeliveroo = getDeliverooUrl(name, city, deliverooUrl);
  const finalUberEats = getUberEatsUrl(name, city, uberEatsUrl);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {showDeliveroo && (
          <a
            href={finalDeliveroo}
            target="_blank"
            rel="noopener noreferrer"
            title={`Commander ${name} sur Deliveroo`}
            className="grid size-8 place-items-center rounded-full bg-[#00CDBC]/10 text-[#00CDBC] transition hover:bg-[#00CDBC] hover:text-white"
            aria-label="Deliveroo"
          >
            <DeliverooIcon size={16} />
          </a>
        )}
        {showUberEats && (
          <a
            href={finalUberEats}
            target="_blank"
            rel="noopener noreferrer"
            title={`Commander ${name} sur Uber Eats`}
            className="grid size-8 place-items-center rounded-full bg-[#06C167]/10 text-[#06C167] transition hover:bg-[#06C167] hover:text-white"
            aria-label="Uber Eats"
          >
            <UberEatsIcon size={16} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Commander en livraison</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {showDeliveroo && (
          <a
            href={finalDeliveroo}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[#00CDBC]/20 bg-[#00CDBC]/5 px-4 py-3 text-sm font-semibold text-ink transition hover:border-[#00CDBC] hover:bg-[#00CDBC] hover:text-white shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-[#00CDBC] text-white shadow-xs group-hover:bg-white group-hover:text-[#00CDBC]">
                <DeliverooIcon size={18} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">Deliveroo</p>
                <p className="text-[10px] font-medium opacity-65 group-hover:opacity-90">Commander en ligne</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#00CDBC] group-hover:text-white">→</span>
          </a>
        )}
        {showUberEats && (
          <a
            href={finalUberEats}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-[#06C167]/20 bg-[#06C167]/5 px-4 py-3 text-sm font-semibold text-ink transition hover:border-[#06C167] hover:bg-[#06C167] hover:text-white shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xl bg-[#142328] text-[#06C167] shadow-xs group-hover:bg-white">
                <UberEatsIcon size={18} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">Uber Eats</p>
                <p className="text-[10px] font-medium opacity-65 group-hover:opacity-90">Livraison rapide</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#06C167] group-hover:text-white">→</span>
          </a>
        )}
      </div>
    </div>
  );
}
