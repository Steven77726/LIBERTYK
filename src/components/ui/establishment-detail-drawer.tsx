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
  const visibility = { ...defaultVisibility, ...(establishment?.fieldVisibility ?? {}) };
  const hours = useMemo(() => parseHours(establishment?.hours), [establishment?.hours]);
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
  const mapsQuery = [establishment.latitude, establishment.longitude].every((value) => isMeaningful(value))
    ? `${establishment.latitude},${establishment.longitude}`
    : address || establishment.name;
  const status = openStatus(establishment.hours);
  const canReserve = visibility.reservation !== false && establishment.reservation && (isMeaningful(establishment.reservationTarget) || Boolean(onReserve));

  return (
    <EntityDrawer open={open} onClose={onClose} title={establishment.name}>
      <div className="space-y-5 p-6">
        {visibility.gallery !== false && <Gallery establishment={establishment} />}
        <div>
          {isMeaningful(subcategory) && <p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{subcategory}</p>}
          <h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{establishment.name}</h2>
          {isMeaningful(category) && <p className="mt-2 text-xs text-ink/40">{category}</p>}
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
            {visibility.map !== false && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold"
              >
                <Navigation size={16} /> Itinéraire
              </a>
            )}
          </div>
        )}

        {visibility.opening_hours !== false && hours.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Horaires</p>
            {status && <p className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold"><Clock size={16} /> {status}</p>}
            <div className="mt-3 overflow-hidden rounded-2xl bg-white">
              {hours.map(({ day, value }) => (
                <div key={day} className="flex items-center justify-between gap-4 border-b border-black/[.05] px-4 py-3 text-xs last:border-0">
                  <span className="capitalize text-ink/50">{day}</span>
                  <span className="text-right text-ink/70">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
