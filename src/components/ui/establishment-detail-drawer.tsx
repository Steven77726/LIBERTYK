"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, ExternalLink, Globe2, Instagram,
  Mail, MessageCircle, Navigation, Phone, Star, X,
} from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { localSubrubrics } from "@/data/subrubrics";
import { assetPath } from "@/lib/assets";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { LikeButton, ShareButton } from "@/components/ui/entity-actions";
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

function isUsableExternalUrl(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return /^https?:\/\/[^\s]+$/i.test(trimmed);
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

function todayHours(hours?: string) {
  const lines = parseHours(hours);
  const today = days[(new Date().getDay() + 6) % 7];
  return lines.find((line) => line.day === today)?.value ?? "";
}

function Gallery({ establishment }: { establishment: EstablishmentRecord }) {
  const images = uniqueList([establishment.mainPhoto, ...(establishment.photos ?? [])]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const current = images[index] ?? images[0];

  useEffect(() => {
    setIndex(0);
    setOpen(false);
    setPausedUntil(0);
  }, [establishment.id]);

  useEffect(() => {
    if (images.length <= 1 || open) return undefined;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [images.length, open, pausedUntil]);

  useEffect(() => {
    if (images.length <= 1 || typeof window === "undefined") return;
    const next = images[(index + 1) % images.length];
    if (!next) return;
    const img = new window.Image();
    img.src = assetPath(next);
  }, [images, index]);

  if (!images.length) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-linear-to-br from-moss via-ink to-[#d7b46a] shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.22),transparent_36%),radial-gradient(circle_at_80%_70%,rgba(215,180,106,.28),transparent_40%)]" />
        <div className="absolute inset-x-6 bottom-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">Liberty K</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-.04em]">{establishment.name}</p>
        </div>
      </div>
    );
  }

  const pause = () => setPausedUntil(Date.now() + 8000);
  const move = (delta: number) => {
    pause();
    setIndex((currentIndex) => (currentIndex + delta + images.length) % images.length);
  };
  const onTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const delta = clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 36 || images.length <= 1) return;
    move(delta < 0 ? 1 : -1);
  };

  return (
    <>
      <div className="grid gap-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOpen(true);
            }
          }}
          onMouseEnter={pause}
          onFocus={pause}
          onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; pause(); }}
          onTouchEnd={(event) => onTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          className="group relative aspect-[16/10] cursor-pointer overflow-hidden rounded-3xl bg-sage text-left shadow-sm outline-none focus:ring-2 focus:ring-moss/30"
        >
          <img src={assetPath(current)} alt={establishment.name} className="size-full object-cover transition duration-500 group-hover:scale-[1.015]" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/55 to-transparent p-4 text-white">
            <span className="rounded-full bg-white/18 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              {index + 1} / {images.length}
            </span>
            {images.length > 1 && (
              <div className="flex items-center gap-1.5">
                {images.map((image, imageIndex) => (
                  <span key={image} className={`h-1.5 rounded-full transition-all ${imageIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/45"}`} />
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); move(-1); }}
                className="absolute left-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition group-hover:opacity-100 sm:grid"
                aria-label="Photo précédente"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={(event) => { event.preventDefault(); event.stopPropagation(); move(1); }}
                className="absolute right-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-sm transition group-hover:opacity-100 sm:grid"
                aria-label="Photo suivante"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
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

function formatBeautyPrice(price?: number | null, priceFrom?: boolean) {
  if (price === null || price === undefined || !Number.isFinite(Number(price))) return "";
  return `${priceFrom ? "Dès " : ""}${Number(price).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

function ActionLink({
  href,
  label,
  detail,
  icon,
  dark = false,
}: {
  href: string;
  label: string;
  detail?: string;
  icon: ReactNode;
  dark?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      className={`flex min-h-14 items-center gap-2 rounded-2xl px-3 py-2 text-left transition ${
        dark ? "bg-ink text-white shadow-sm hover:bg-ink/90" : "bg-cream text-ink hover:bg-black/[.04]"
      }`}
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-xl ${dark ? "bg-white/12 text-white" : "bg-white text-moss shadow-xs"}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold">{label}</span>
        {detail && <span className={`mt-0.5 block truncate text-[10px] font-semibold ${dark ? "text-white/60" : "text-ink/40"}`}>{detail}</span>}
      </span>
    </a>
  );
}

export function EstablishmentDetailDrawer({ establishment, open, onClose, onReserve, onTag }: Props) {
  const [showHours, setShowHours] = useState(false);
  const visibility = { ...defaultVisibility, ...(establishment?.fieldVisibility ?? {}) };
  const hours = useMemo(() => parseHours(establishment?.hours), [establishment?.hours]);
  const googleData = useMemo(() => getEstablishmentGoogleBusiness(establishment?.name), [establishment?.name]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!establishment) return null;

  const category = categoryBySlug[establishment.rubricId]?.label || establishment.rubricId;
  const subcategory = subrubricLabel(establishment);
  const href = establishmentHref(establishment);
  const address = [establishment.address, establishment.postalCode, establishment.city, establishment.country].filter(isMeaningful).join(", ");
  const wazeUrl = [establishment.latitude, establishment.longitude].every((value) => isMeaningful(value))
    ? `https://waze.com/ul?ll=${establishment.latitude},${establishment.longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(address || establishment.name)}`;
  const mapsUrl = isMeaningful(address)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : googleData.googleMapsUrl;
  const canReserve = visibility.reservation !== false && establishment.reservation && (isMeaningful(establishment.reservationTarget) || Boolean(onReserve));
  const beautyServices = (establishment.beautyServices ?? []).filter((service) => service.active);
  const hasGoogleProof = googleData.userRatingsTotal > 145 && isUsableExternalUrl(googleData.googleMapsUrl);
  const googleReview = googleData.reviews.find((review) => !/avis verifie|avis vérifié|client verifie|client vérifié/i.test(review.author));
  const status = openStatus(establishment.hours);
  const today = todayHours(establishment.hours);
  const deliverooUrl = isUsableExternalUrl(establishment.deliverooUrl) ? establishment.deliverooUrl : "";
  const uberEatsUrl = isUsableExternalUrl(establishment.uberEatsUrl) ? establishment.uberEatsUrl : "";
  const infoGroups = [
    uniqueList([...(establishment.cuisineTypes ?? []), ...((establishment.visibleTagIds ?? []).filter((tag) => !["bassari", "halavi", "parve", "sponsorise"].includes(normalize(tag).replace(/\s+/g, "-"))))]).filter(isMeaningful),
    uniqueList([establishment.certification, establishment.kosherType, establishment.averagePrice]).filter(isMeaningful),
  ].filter((group) => group.length > 0);

  return (
    <EntityDrawer open={open} onClose={onClose} title={establishment.name}>
      <div className="space-y-5 p-6">
        {visibility.gallery !== false && <Gallery establishment={establishment} />}
        <div>
          <div className="flex items-center justify-between gap-2">
            {isMeaningful(subcategory) && <p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{subcategory}</p>}
            {status && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${normalize(status).includes("ferme") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"}`}>
                <span className={`size-1.5 rounded-full ${normalize(status).includes("ferme") ? "bg-rose-500" : "animate-pulse bg-emerald-500"}`} />
                {status}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{establishment.name}</h2>
          {isMeaningful(category) && <p className="mt-1 text-xs text-ink/40">{category}{status ? ` · ${status}` : ""}</p>}
        </div>

        <div className="rounded-3xl border border-black/[.04] bg-white/95 p-3 shadow-sm backdrop-blur">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {hasGoogleProof && (
              <ActionLink href={googleData.googleMapsUrl} label="Google" detail={`${googleData.rating.toLocaleString("fr-FR")} ★ · ${googleData.userRatingsTotal} avis`} icon={<Star size={15} className="text-amber-500" fill="currentColor" />} />
            )}
            {visibility.website !== false && isMeaningful(establishment.website) && (
              <ActionLink href={normalizeExternalUrl(establishment.website)} label="Site" detail="Site web" icon={<Globe2 size={15} />} />
            )}
            {visibility.map !== false && isMeaningful(mapsUrl) && (
              <ActionLink href={mapsUrl} label="Maps" detail="Itinéraire" icon={<Navigation size={15} />} />
            )}
            {visibility.map !== false && isMeaningful(wazeUrl) && (
              <ActionLink href={wazeUrl} label="Waze" detail="Navigation" icon={<span className="text-xs font-black text-[#33B5E5]">W</span>} />
            )}
            {visibility.phone !== false && isMeaningful(establishment.phone) && (
              <ActionLink href={`tel:${establishment.phone.replace(/\s/g, "")}`} label="Téléphone" detail={establishment.phone} icon={<Phone size={15} />} dark />
            )}
            {visibility.instagram !== false && isMeaningful(establishment.instagram) && (
              <ActionLink href={normalizeExternalUrl(establishment.instagram)} label="Instagram" detail="Profil" icon={<Instagram size={15} />} />
            )}
          </div>
        </div>

        {hasGoogleProof && (
          <div className="rounded-3xl border border-black/[.04] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="text-amber-500">★★★★★</span>
              <span>{googleData.rating.toLocaleString("fr-FR")} · {googleData.userRatingsTotal} avis Google</span>
            </div>
            {googleReview?.text && <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/55">&ldquo;{googleReview.text}&rdquo;</p>}
            <a href={googleData.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-moss">
              Voir tous les avis Google <ExternalLink size={12} />
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <LikeButton entity={{ id: favoriteEntityId(establishment), title: establishment.name, url: href, text: `${establishment.name} · ${address || category}` }} showLabel className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cream px-4 py-3 text-xs font-bold text-ink transition hover:bg-sage" />
          <ShareButton entity={{ id: favoriteEntityId(establishment), title: establishment.name, url: href, text: `${establishment.name} · ${address || category}` }} />
        </div>

        {(visibility.tags !== false || visibility.certification !== false) && infoGroups.length > 0 && (
          <div className="space-y-2 rounded-3xl bg-white p-4 shadow-sm">
            {infoGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-wrap gap-2 text-xs">
                {group.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTag?.(tag)}
                    className="rounded-full bg-cream px-3 py-2 font-semibold text-ink/65 transition hover:bg-sage hover:text-moss"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {establishment.sponsored && (
          <div className="rounded-3xl bg-[#f6ecd9] p-4 text-sm font-semibold text-[#8f6424]">
            Mise en avant sponsorisée
          </div>
        )}

        {isMeaningful(establishment.description) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Description</p>
            <p className="mt-2 text-sm leading-7 text-ink/60">{establishment.description}</p>
          </div>
        )}

        {visibility.address !== false && isMeaningful(address) && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Adresse</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">{address}</p>
          </div>
        )}

        {visibility.opening_hours !== false && hours.length > 0 && (
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Horaires</p>
                {today && <p className="mt-1 text-sm font-semibold text-ink">Aujourd’hui · {today}</p>}
              </div>
              <button
                type="button"
                onClick={() => setShowHours((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-2 text-[11px] font-bold text-ink/65"
              >
                <Clock size={13} /> {showHours ? "Réduire" : "Voir la semaine"}
              </button>
            </div>
            {showHours && (
              <div className="mt-3 space-y-1 rounded-2xl bg-cream/70 p-3 text-xs">
                {hours.map((line) => {
                  const isToday = days[(new Date().getDay() + 6) % 7] === line.day;
                  return (
                    <div key={line.day} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${isToday ? "bg-white font-bold text-moss shadow-xs" : "text-ink/65"}`}>
                      <span className="capitalize">{line.day}{isToday ? " · aujourd’hui" : ""}</span>
                      <span className="text-right">{line.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {(deliverooUrl || uberEatsUrl) && (
          <DeliveryPlatformButtons
            name={establishment.name}
            city={establishment.city}
            deliverooUrl={deliverooUrl}
            uberEatsUrl={uberEatsUrl}
            showDeliveroo={visibility.deliveroo !== false && Boolean(deliverooUrl)}
            showUberEats={visibility.ubereats !== false && Boolean(uberEatsUrl)}
          />
        )}

        {visibility.services !== false && beautyServices.length > 0 && (
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Prestations</p>
            <div className="mt-3 space-y-2">
              {beautyServices.map((service) => {
                const price = formatBeautyPrice(service.price, service.priceFrom);
                return (
                  <div key={service.id} className="rounded-2xl bg-cream px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{service.serviceName ?? "Prestation"}</p>
                        {service.categoryName && <p className="mt-0.5 text-[11px] font-medium text-ink/40">{service.categoryName}</p>}
                      </div>
                      {price && <p className="shrink-0 text-sm font-semibold text-moss">{price}</p>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold text-ink/45">
                      {service.durationMinutes ? <span className="rounded-full bg-white px-2.5 py-1">{service.durationMinutes} min</span> : null}
                      {service.atHome ? <span className="rounded-full bg-white px-2.5 py-1">À domicile</span> : null}
                      {service.onSite ? <span className="rounded-full bg-white px-2.5 py-1">Sur place</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          {visibility.whatsapp !== false && isMeaningful(establishment.whatsapp) && <a href={`https://wa.me/${establishment.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><MessageCircle size={15} /> WhatsApp</a>}
          {visibility.email !== false && isMeaningful(establishment.email) && <a href={`mailto:${establishment.email}`} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><Mail size={15} /> Email</a>}
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
