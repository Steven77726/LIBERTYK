"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, Globe2, Instagram,
  Mail, MessageCircle, Navigation, Phone, X,
} from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { localSubrubrics } from "@/data/subrubrics";
import { assetPath } from "@/lib/assets";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { EntityActions } from "@/components/ui/entity-actions";
import { getEstablishmentGoogleBusiness } from "@/lib/google-places";
import { DeliveryPlatformButtons } from "@/components/ui/delivery-badges";

type Props = {
  establishment: EstablishmentRecord | null;
  open: boolean;
  onClose: () => void;
  onReserve?: (establishment: EstablishmentRecord) => void;
  onTag?: (tag: string) => void;
};

const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

const defaultVisibility: Record<string, boolean> = {
  phone: true,
  whatsapp: true,
  email: true,
  website: true,
  reservation: true,
  instagram: true,
  address: true,
  opening_hours: true,
  tags: true,
  gallery: true,
  price: true,
  map: true,
  certification: true,
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isMeaningful(value?: string | null) {
  const normalized = normalize(String(value ?? "").trim());
  return Boolean(normalized)
    && normalized !== "a completer"
    && normalized !== "non renseigne"
    && normalized !== "non renseignee"
    && normalized !== "adresse a completer"
    && normalized !== "non concerne";
}

function uniqueList(values: Array<string | undefined | null>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

function normalizeExternalUrl(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  return `https://${trimmed}`;
}

function cleanSubrubricSlug(establishment: EstablishmentRecord) {
  const value = establishment.subrubricId || "";
  if (value.startsWith(`${establishment.rubricId}-`)) return value.slice(establishment.rubricId.length + 1);
  return value;
}

function subrubricLabel(establishment: EstablishmentRecord) {
  const slug = cleanSubrubricSlug(establishment);
  const item = localSubrubrics.find((subrubric) =>
    subrubric.id === establishment.subrubricId
    || subrubric.slug === establishment.subrubricId
    || subrubric.slug === slug
    || subrubric.id === `${establishment.rubricId}-${slug}`,
  );
  return item?.name || slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function establishmentHref(establishment: EstablishmentRecord) {
  const rubricSlug = establishment.rubricId || "food";
  const subrubricSlug = cleanSubrubricSlug(establishment);
  const base = rubricSlug === "food" && subrubricSlug === "restaurants"
    ? "/food/restaurants"
    : rubricSlug === "food" && subrubricSlug === "brunch"
      ? "/food/brunch"
      : `/${[rubricSlug, subrubricSlug].filter(Boolean).join("/")}`;
  return `${base}#${establishment.slug ?? establishment.id}`;
}

function favoriteEntityId(establishment: EstablishmentRecord) {
  const subrubricSlug = cleanSubrubricSlug(establishment);
  if (establishment.rubricId === "food" && subrubricSlug === "restaurants") return `restaurant-${establishment.id}`;
  if (establishment.rubricId === "food" && subrubricSlug === "brunch") return `brunch-${establishment.slug ?? establishment.id}`;
  if (establishment.rubricId === "shopping" && (establishment.slug ?? establishment.id) === "azamra") return "shop-azamra";
  return `establishment-${establishment.id}`;
}

function parseHours(hours?: string) {
  const raw = hours?.trim() ?? "";
  if (!raw || normalize(raw).includes("a completer")) return [];
  const map = new Map<string, string>();
  raw.split("\n").forEach((line) => {
    const [day, ...rest] = line.split(":");
    const key = normalize(day ?? "").trim();
    const value = rest.join(":").trim();
    if (key && isMeaningful(value)) map.set(key, value);
  });
  return days.map((day) => ({ day, value: map.get(day) ?? "" })).filter((item) => item.value);
}

function openStatus(hours?: string) {
  const lines = parseHours(hours);
  if (!lines.length) return "";
  const today = days[(new Date().getDay() + 6) % 7];
  const value = lines.find((line) => line.day === today)?.value;
  if (!value) return "Fermé aujourd’hui";
  if (normalize(value).includes("ferme")) return "Fermé";
  return `Ouvert aujourd’hui · ${value}`;
}

function Gallery({ establishment }: { establishment: EstablishmentRecord }) {
  const images = uniqueList([establishment.mainPhoto, ...(establishment.photos ?? [])]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const current = images[index] ?? images[0];
  if (!images.length) return null;

  const move = (delta: number) => setIndex((currentIndex) => (currentIndex + delta + images.length) % images.length);

  return (
    <>
      <div className="grid gap-2">
        <button onClick={() => setOpen(true)} className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-sage text-left">
          <img src={assetPath(images[0])} alt={establishment.name} className="size-full object-cover" />
          <span className="absolute bottom-4 right-4 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            {images.length} photo{images.length > 1 ? "s" : ""}
          </span>
        </button>
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(0, 4).map((image, imageIndex) => (
              <button key={image} onClick={() => { setIndex(imageIndex); setOpen(true); }} className="aspect-square overflow-hidden rounded-2xl bg-sage">
                <img src={assetPath(image)} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[120] bg-black/85 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
          onTouchStart={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <button onClick={() => setOpen(false)} className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white text-ink"><X size={20} /></button>
          <div className="flex h-full items-center justify-center" onMouseDown={(event) => event.stopPropagation()}>
            {images.length > 1 && <button onClick={() => move(-1)} className="absolute left-4 hidden size-11 place-items-center rounded-full bg-white/90 text-ink sm:grid"><ChevronLeft /></button>}
            <div className="max-h-full max-w-5xl">
              <img src={assetPath(current)} alt="" className="max-h-[82vh] max-w-full rounded-3xl object-contain shadow-2xl" />
              <p className="mt-4 text-center text-sm font-semibold text-white">{index + 1} / {images.length}</p>
            </div>
            {images.length > 1 && <button onClick={() => move(1)} className="absolute right-4 hidden size-11 place-items-center rounded-full bg-white/90 text-ink sm:grid"><ChevronRight /></button>}
          </div>
        </div>
      )}
    </>
  );
}

export function EstablishmentDetailDrawer({ establishment, open, onClose, onReserve, onTag }: Props) {
  const [showHours, setShowHours] = useState(false);
  const visibility = { ...defaultVisibility, ...(establishment?.fieldVisibility ?? {}) };
  const hours = useMemo(() => parseHours(establishment?.hours), [establishment?.hours]);
  const googleData = useMemo(() => getEstablishmentGoogleBusiness(establishment?.name), [establishment?.name]);

  if (!establishment) return null;

  const category = categoryBySlug[establishment.rubricId]?.label || establishment.rubricId;
  const subcategory = subrubricLabel(establishment);
  const href = establishmentHref(establishment);
  const tags = uniqueList([
    establishment.kosherType,
    establishment.certification,
    establishment.averagePrice,
    ...(establishment.visibleTagIds ?? []),
    ...(establishment.cuisineTypes ?? []),
  ]).filter(isMeaningful);
  const address = [establishment.address, establishment.postalCode, establishment.city, establishment.country].filter(isMeaningful).join(", ");
  const wazeUrl = [establishment.latitude, establishment.longitude].every((value) => isMeaningful(value))
    ? `https://waze.com/ul?ll=${establishment.latitude},${establishment.longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(address || establishment.name)}`;
  const canReserve = visibility.reservation !== false && establishment.reservation && (isMeaningful(establishment.reservationTarget) || Boolean(onReserve));

  return (
    <EntityDrawer open={open} onClose={onClose} title={establishment.name}>
      <div className="space-y-5 p-6">
        {visibility.gallery !== false && <Gallery establishment={establishment} />}
        <div>
          <div className="flex items-center justify-between gap-2">
            {isMeaningful(subcategory) && <p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{subcategory}</p>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              {googleData.openNow ? "Ouvert en direct" : "Fermé"}
            </span>
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{establishment.name}</h2>
          {isMeaningful(category) && <p className="mt-1 text-xs text-ink/40">{category}</p>}
        </div>

        {/* Barre Google Business élégante avec Maps, Waze et Horaires */}
        <div className="rounded-2xl border border-black/5 bg-white/95 p-3.5 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-black/5 bg-white shadow-xs">
                <svg className="size-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <span>{googleData.rating}</span>
                  <span className="text-amber-500">★★★★★</span>
                  <span className="font-normal text-ink/40">({googleData.userRatingsTotal} avis)</span>
                </div>
                <p className="text-[10px] font-medium text-emerald-700">Fiche vérifiée Google</p>
              </div>
            </div>

            {/* Boutons d'actions groupés : Maps, Waze, Horaires */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <a
                href={googleData.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-xl bg-cream px-3 py-2 text-[11px] font-semibold text-ink/80 transition hover:bg-black/5"
                title="Ouvrir dans Google Maps"
              >
                <Navigation size={12} className="text-[#4285F4]" /> Maps
              </a>

              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-xl bg-cream px-3 py-2 text-[11px] font-semibold text-ink/80 transition hover:bg-black/5"
                title="Ouvrir dans Waze"
              >
                <span className="text-xs font-bold text-[#33CCFF]">W</span> Waze
              </a>

              <button
                type="button"
                onClick={() => setShowHours((prev) => !prev)}
                className={`flex items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold transition ${
                  showHours ? "bg-moss text-white shadow-xs" : "bg-cream text-ink/80 hover:bg-black/5"
                }`}
                title="Voir les horaires d'ouverture"
              >
                <Clock size={12} /> Horaires {showHours ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {/* Panneau déroulant des Horaires Google */}
          {showHours && (
            <div className="mt-3.5 border-t border-black/5 pt-3.5">
              <div className="flex items-center justify-between pb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">Horaires d&apos;ouverture Google</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                  {googleData.openNow ? "Ouvert actuellement" : "Fermé actuellement"}
                </span>
              </div>
              <div className="space-y-1 rounded-xl bg-cream/70 p-3 text-xs">
                {days.map((day) => {
                  const isToday = days[(new Date().getDay() + 6) % 7] === day;
                  const lineVal = googleData.openingHours[day] || (hours.find((h) => h.day === day)?.value) || "12:00–15:00, 19:30–23:00";
                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition ${
                        isToday ? "bg-white font-bold text-moss shadow-xs" : "text-ink/70"
                      }`}
                    >
                      <span className="capitalize">{day} {isToday && "(Aujourd’hui)"}</span>
                      <span>{lineVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <EntityActions entity={{ id: favoriteEntityId(establishment), title: establishment.name, url: href, text: `${establishment.name} · ${address || category}` }} />

        {isMeaningful(establishment.description) && (
          <p className="text-sm leading-7 text-ink/55">{establishment.description}</p>
        )}

        {visibility.tags !== false && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTag?.(tag)}
                className="rounded-full bg-white px-3 py-2 transition hover:bg-sage hover:text-moss"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {establishment.sponsored && (
          <div className="rounded-3xl bg-[#f6ecd9] p-4 text-sm font-semibold text-[#8f6424]">
            Mise en avant sponsorisée
          </div>
        )}

        {visibility.address !== false && isMeaningful(address) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Adresse</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">{address}</p>
          </div>
        )}

        {/* Avis Google vérifiés */}
        {googleData.reviews.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Avis Google vérifiés</p>
            <div className="mt-3 space-y-2">
              {googleData.reviews.map((rev, i) => (
                <div key={i} className="rounded-2xl border border-black/5 bg-white p-3.5 text-xs shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{rev.author}</span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                      {"★".repeat(rev.rating)} <span className="text-ink/35 font-normal">{rev.relativeTime}</span>
                    </span>
                  </div>
                  <p className="mt-1.5 leading-relaxed text-ink/70">&ldquo;{rev.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <DeliveryPlatformButtons
          name={establishment.name}
          city={establishment.city}
          deliverooUrl={establishment.deliverooUrl}
          uberEatsUrl={establishment.uberEatsUrl}
          showDeliveroo={visibility.deliveroo !== false}
          showUberEats={visibility.ubereats !== false}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          {visibility.phone !== false && isMeaningful(establishment.phone) && <a href={`tel:${establishment.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white"><Phone size={15} /> Téléphone</a>}
          {visibility.whatsapp !== false && isMeaningful(establishment.whatsapp) && <a href={`https://wa.me/${establishment.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><MessageCircle size={15} /> WhatsApp</a>}
          {visibility.email !== false && isMeaningful(establishment.email) && <a href={`mailto:${establishment.email}`} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><Mail size={15} /> Email</a>}
          {visibility.website !== false && isMeaningful(establishment.website) && <a href={normalizeExternalUrl(establishment.website)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><Globe2 size={15} /> Site web</a>}
          {visibility.instagram !== false && isMeaningful(establishment.instagram) && <a href={normalizeExternalUrl(establishment.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><Instagram size={15} /> Instagram</a>}
          {canReserve && (
            isMeaningful(establishment.reservationTarget)
              ? <a href={normalizeExternalUrl(establishment.reservationTarget)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white"><CalendarDays size={16} /> Réservation</a>
              : <button onClick={() => onReserve?.(establishment)} className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white"><CalendarDays size={16} /> Réservation</button>
          )}
        </div>
      </div>
    </EntityDrawer>
  );
}
