"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe2,
  Instagram,
  MapPin,
  Maximize2,
  MessageCircle,
  Navigation,
  Phone,
  X,
} from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { localSubrubrics } from "@/data/subrubrics";
import { assetPath } from "@/lib/assets";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { LikeButton, ShareButton } from "@/components/ui/entity-actions";
import { getEstablishmentGoogleBusiness } from "@/lib/google-places";
import { PhotoLightboxModal } from "@/components/ui/photo-lightbox-modal";
import { DeliveryPlatformButtons } from "@/components/ui/delivery-badges";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";
import { formatDistanceLabel } from "@/lib/geo/distance";

export type EstablishmentDetailModalProps = {
  establishment: EstablishmentRecord | null;
  open: boolean;
  onClose: () => void;
  onReserve?: (establishment: EstablishmentRecord) => void;
  onTag?: (tag: string) => void;
  distanceKm?: number;
};

const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function isMeaningful(value?: string | null) {
  const normalized = normalize(String(value ?? "").trim());
  return (
    Boolean(normalized) &&
    normalized !== "a completer" &&
    normalized !== "non renseigne" &&
    normalized !== "non renseignee" &&
    normalized !== "adresse a completer" &&
    normalized !== "non concerne"
  );
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
  const item = localSubrubrics.find(
    (subrubric) =>
      subrubric.id === establishment.subrubricId ||
      subrubric.slug === establishment.subrubricId ||
      subrubric.slug === slug ||
      subrubric.id === `${establishment.rubricId}-${slug}`,
  );
  return item?.name || slug.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function establishmentHref(establishment: EstablishmentRecord) {
  const rubricSlug = establishment.rubricId || "food";
  const subrubricSlug = cleanSubrubricSlug(establishment);
  const base =
    rubricSlug === "food" && subrubricSlug === "restaurants"
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

function todayHours(hours?: string) {
  const lines = parseHours(hours);
  const today = days[(new Date().getDay() + 6) % 7];
  return lines.find((line) => line.day === today)?.value ?? "";
}

function Gallery({
  establishment,
  onClose,
}: {
  establishment: EstablishmentRecord;
  onClose?: () => void;
}) {
  const images = uniqueList([establishment.mainPhoto, ...(establishment.photos ?? [])]);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(0);
  const current = images[index] ?? images[0];
  const photoAlts = establishment.photoAlts ?? [];
  const currentAlt = photoAlts[index] || "";

  useEffect(() => {
    setIndex(0);
    setLightboxOpen(false);
    setPausedUntil(0);
  }, [establishment.id]);

  useEffect(() => {
    if (images.length <= 1 || lightboxOpen) return undefined;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil) return;
      setIndex((currentIndex) => (currentIndex + 1) % images.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [images.length, lightboxOpen, pausedUntil]);

  if (!images.length) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-br from-moss via-ink to-[#d7b46a] shadow-sm">
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

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Cadre photo principale */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl sm:rounded-3xl bg-sage shadow-xs group">
          <img
            src={assetPath(current)}
            alt={currentAlt || establishment.name}
            className="size-full object-cover transition duration-500 hover:scale-[1.015] cursor-pointer"
            onClick={() => setLightboxOpen(true)}
            title="Cliquer pour agrandir en plein écran"
          />

          {/* Bouton croix ✕ bien visible par-dessus la photo en haut à droite (zone 44px min, z-50) */}
          {onClose && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute right-3 top-3 z-50 grid min-h-[44px] min-w-[44px] place-items-center rounded-full bg-black/60 text-white backdrop-blur-md shadow-md transition hover:bg-black/80 hover:scale-105 cursor-pointer"
              aria-label="Fermer la fiche"
            >
              <X size={20} />
            </button>
          )}

          {/* Badge titre / légende de la photo si disponible */}
          {currentAlt && (
            <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[calc(100%-4rem)]">
              <span className="inline-block truncate rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-sm">
                {currentAlt}
              </span>
            </div>
          )}

          {/* Dégradé inférieur, compteur et bouton plein écran */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 via-black/20 to-transparent p-4 text-white">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              {index + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-xs font-semibold backdrop-blur-md transition hover:bg-white/40 cursor-pointer"
            >
              <Maximize2 size={13} />
              Plein écran
            </button>
          </div>

          {/* Flèches de navigation */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  move(-1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white hover:scale-105 cursor-pointer"
                aria-label="Photo précédente"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  move(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow-md transition hover:bg-white hover:scale-105 cursor-pointer"
                aria-label="Photo suivante"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Menu galerie photos / Miniatures interactives */}
        {images.length > 1 && (
          <div className="rounded-2xl border border-black/[.06] bg-cream/70 p-3 backdrop-blur-sm shadow-xs">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink/50">
                <Camera size={13} className="text-moss" /> Galerie photos ({images.length})
              </span>
              <span className="text-[11px] text-moss font-semibold truncate max-w-[200px]">
                {currentAlt || `Photo ${index + 1}`}
              </span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {images.map((image, imageIndex) => {
                const alt = photoAlts[imageIndex] || `Photo ${imageIndex + 1}`;
                const isActive = imageIndex === index;
                return (
                  <button
                    key={image + imageIndex}
                    type="button"
                    onClick={() => {
                      pause();
                      setIndex(imageIndex);
                    }}
                    title={alt}
                    className={`group relative shrink-0 overflow-hidden rounded-xl transition duration-200 cursor-pointer ${
                      isActive
                        ? "ring-2 ring-moss ring-offset-2 scale-[1.03] shadow-md"
                        : "opacity-65 hover:opacity-100 hover:scale-[1.02]"
                    }`}
                  >
                    <div className="h-16 w-24 overflow-hidden rounded-xl bg-sage">
                      <img
                        src={assetPath(image)}
                        alt={alt}
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    {isActive && (
                      <span className="absolute inset-x-0 bottom-0 bg-moss/90 text-center text-[9px] font-bold text-white py-0.5 truncate px-1">
                        {alt.split("&")[0]?.split("-")[0]?.trim() || `Photo ${imageIndex + 1}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PhotoLightboxModal
        photos={images}
        initialIndex={index}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={establishment.name}
      />
    </>
  );
}

function ActionLink({
  href,
  label,
  detail,
  icon,
  dark = false,
  highlight = false,
}: {
  href: string;
  label: string;
  detail?: string;
  icon: ReactNode;
  dark?: boolean;
  highlight?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") || href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      className={`flex min-h-[50px] items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left transition border border-white/10 ${
        highlight
          ? "bg-[#d5bb7d] text-black shadow-sm hover:bg-[#e7d39a]"
          : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-xl ${
          highlight
            ? "bg-black/10 text-black"
            : "bg-white/15 text-white shadow-2xs"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold leading-tight">{label}</span>
        {detail && (
          <span
            className={`block truncate text-[11px] ${
              highlight ? "text-black/70" : "text-white/70"
            }`}
          >
            {detail}
          </span>
        )}
      </span>
    </a>
  );
}

export function EstablishmentDetailModal({
  establishment,
  open,
  onClose,
  onReserve,
  onTag,
  distanceKm,
}: EstablishmentDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showHours, setShowHours] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !establishment) return null;

  const category =
    categoryBySlug[establishment.rubricId]?.label ||
    establishment.rubricId.charAt(0).toUpperCase() + establishment.rubricId.slice(1);
  const subrubric = subrubricLabel(establishment);
  const address = [establishment.address, establishment.postalCode, establishment.city]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = isMeaningful(address)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        address || establishment.name,
      )}`
    : "";
  const wazeUrl = isMeaningful(address)
    ? `https://waze.com/ul?q=${encodeURIComponent(
        address || establishment.name,
      )}&navigate=yes`
    : "";
  const href = establishmentHref(establishment);
  const googleData = getEstablishmentGoogleBusiness(establishment.name);
  const hasGoogleProof = Boolean(googleData && googleData.rating > 0);
  const metroStyle = establishment.nearestMetroLine
    ? getMetroLineStyle(establishment.nearestMetroLine)
    : googleData?.nearestMetroLine
    ? getMetroLineStyle(googleData.nearestMetroLine)
    : null;
  const hours = parseHours(establishment.hours);
  const today = todayHours(establishment.hours);

  const canReserve =
    establishment.reservation ||
    isMeaningful(establishment.reservationTarget) ||
    Boolean(onReserve);
  const isEvent =
    establishment.rubricId === "sorties" ||
    (establishment.subrubricId || "").includes("evenement") ||
    (establishment.subrubricId || "").includes("concert");
  const reserveLabel = isEvent ? "Accéder à la billetterie" : "Réserver une table";

  const deliverooUrl = isMeaningful(establishment.deliverooUrl)
    ? normalizeExternalUrl(establishment.deliverooUrl)
    : "";
  const uberEatsUrl = isMeaningful(establishment.uberEatsUrl)
    ? normalizeExternalUrl(establishment.uberEatsUrl)
    : "";

  return createPortal(
    <div
      className={`fixed inset-0 z-[150] transition ${
        open ? "visible" : "invisible pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      {/* 1. Arrière-plan flou universel (Voile sombre semi-transparent avec tap iOS fiable) */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 cursor-pointer ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
        onClick={onClose}
      />

      {/* 2. Conteneur de positionnement Responsive (Centré sur PC, coulissant en bas sur Mobile) */}
      <div
        className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6 cursor-pointer"
        onClick={onClose}
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={establishment.name}
          onClick={(e) => e.stopPropagation()}
          className={`relative flex flex-col w-full bg-[#52030a] text-white border border-white/15 shadow-2xl transition-all duration-300 ease-out cursor-default
            max-h-[90dvh] rounded-t-[32px] sm:max-h-[88vh] sm:max-w-2xl sm:rounded-3xl
            ${
              open
                ? "translate-y-0 opacity-100 sm:scale-100"
                : "translate-y-full opacity-0 sm:translate-y-4 sm:scale-95"
            }`}
        >
          {/* Poignée de tirage tactile visible sur mobile */}
          <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>

          {/* En-tête avec bouton de fermeture ✕ ergonomique (44px) */}
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#52030a]/95 px-5 py-3 backdrop-blur-xl sm:rounded-t-3xl">
            <div className="min-w-0 pr-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#d5bb7d]">
                {category} · {subrubric}
              </span>
              <h2 className="truncate text-base sm:text-lg font-bold text-white">
                {establishment.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid min-h-[44px] min-w-[44px] place-items-center rounded-full bg-white/15 text-white border border-white/20 shadow-xs transition hover:bg-white/25 cursor-pointer"
              aria-label="Fermer la fiche"
            >
              <X size={20} />
            </button>
          </div>

          {/* Corps défilable interne */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
            {/* Galerie Photo */}
            <Gallery establishment={establishment} onClose={onClose} />

            {/* Titre, Badges & Note */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {establishment.kosherType && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      establishment.kosherType === "Bassari"
                        ? "bg-rose-950/80 text-rose-200 border border-rose-400/30"
                        : establishment.kosherType === "Halavi"
                        ? "bg-sky-950/80 text-sky-200 border border-sky-400/30"
                        : "bg-emerald-950/80 text-emerald-200 border border-emerald-400/30"
                    }`}
                  >
                    {establishment.kosherType}
                  </span>
                )}

                {establishment.certification && (
                  <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-semibold text-white/90">
                    ✡ {establishment.certification}
                  </span>
                )}

                {establishment.averagePrice && (
                  <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold text-white/80">
                    {establishment.averagePrice}
                  </span>
                )}

                {distanceKm !== undefined && distanceKm > 0 && (
                  <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-bold text-[#d5bb7d]">
                    📍 {formatDistanceLabel(distanceKm)}
                  </span>
                )}
              </div>

              {/* Note Google Vérifiée */}
              {hasGoogleProof && googleData && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#420207] border border-white/10 p-3 text-xs font-semibold text-white">
                  <span className="text-amber-400">★★★★★</span>
                  <span>
                    {googleData.rating.toLocaleString("fr-FR")} · {googleData.userRatingsTotal} avis Google
                  </span>
                  <a
                    href={googleData.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-[#d5bb7d] hover:text-white"
                  >
                    Voir les avis <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>

            {/* Boutons d'Action Rapide Principaux */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {isMeaningful(establishment.phone) && (
                <ActionLink
                  href={`tel:${establishment.phone.replace(/\s/g, "")}`}
                  label="Appeler"
                  detail={establishment.phone}
                  icon={<Phone size={15} />}
                  dark
                />
              )}

              {isMeaningful(wazeUrl) && (
                <ActionLink
                  href={wazeUrl}
                  label="Waze"
                  detail="GPS Navigation"
                  icon={<span className="text-xs font-black text-[#33B5E5]">W</span>}
                />
              )}

              {isMeaningful(mapsUrl) && (
                <ActionLink
                  href={mapsUrl}
                  label="Maps"
                  detail="Itinéraire"
                  icon={<Navigation size={15} />}
                />
              )}

              {isMeaningful(establishment.whatsapp) && (
                <ActionLink
                  href={`https://wa.me/${establishment.whatsapp.replace(/\D/g, "")}`}
                  label="WhatsApp"
                  detail="Message direct"
                  icon={<MessageCircle size={15} className="text-[#25D366]" />}
                />
              )}

              {isMeaningful(establishment.instagram) && (
                <ActionLink
                  href={normalizeExternalUrl(establishment.instagram)}
                  label="Instagram"
                  detail="Profil"
                  icon={<Instagram size={15} className="text-[#E1306C]" />}
                />
              )}

              {isMeaningful(establishment.website) && (
                <ActionLink
                  href={normalizeExternalUrl(establishment.website)}
                  label="Site Web"
                  detail="Officiel"
                  icon={<Globe2 size={15} />}
                />
              )}
            </div>

            {/* Bouton Billetterie / Réservation si actif */}
            {canReserve && (
              <div className="pt-1">
                {isMeaningful(establishment.reservationTarget) ? (
                  <a
                    href={normalizeExternalUrl(establishment.reservationTarget)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#d5bb7d] px-6 py-3 text-sm font-bold text-black shadow-md transition hover:bg-[#e7d39a]"
                  >
                    <CalendarDays size={18} />
                    <span>{reserveLabel}</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReserve?.(establishment)}
                    className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#d5bb7d] px-6 py-3 text-sm font-bold text-black shadow-md transition hover:bg-[#e7d39a] cursor-pointer"
                  >
                    <CalendarDays size={18} />
                    <span>{reserveLabel}</span>
                  </button>
                )}
              </div>
            )}

            {/* Description complète */}
            {isMeaningful(establishment.description) && (
              <div className="rounded-2xl bg-[#420207] p-4 sm:p-5 border border-white/10 shadow-2xs space-y-1.5 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-[#d5bb7d]">
                  Présentation
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-white/80 whitespace-pre-line">
                  {establishment.description}
                </p>
              </div>
            )}

            {/* Adresse, Métro et Horaires */}
            <div className="rounded-2xl bg-[#420207] p-4 sm:p-5 border border-white/10 shadow-2xs space-y-3 text-white">
              {isMeaningful(address) && (
                <div className="flex items-start gap-2.5 text-xs sm:text-sm text-white/80">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[#d5bb7d]" />
                  <div>
                    <p className="font-semibold text-white">{address}</p>
                    {isMeaningful(establishment.nearestMetroName) && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                        <span>Métro {establishment.nearestMetroName}</span>
                        {metroStyle && (
                          <span
                            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-black"
                            style={{
                              backgroundColor: metroStyle.background,
                              color: metroStyle.foreground,
                              borderColor: metroStyle.border,
                            }}
                          >
                            {metroStyle.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Horaires d'ouverture */}
              {hours.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Clock size={14} className="text-[#d5bb7d]" />
                      <span>{today ? `Aujourd’hui · ${today}` : "Horaires d’ouverture"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHours((prev) => !prev)}
                      className="rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white/80 hover:bg-white/20 cursor-pointer"
                    >
                      {showHours ? "Masquer" : "Toute la semaine"}
                    </button>
                  </div>
                  {showHours && (
                    <div className="mt-3 space-y-1.5 rounded-xl bg-[#350106] border border-white/5 p-3 text-xs text-white/80">
                      {hours.map((line) => {
                        const isToday = days[(new Date().getDay() + 6) % 7] === line.day;
                        return (
                          <div
                            key={line.day}
                            className={`flex items-center justify-between px-2 py-1 rounded-lg ${
                              isToday ? "bg-white font-bold text-moss shadow-2xs" : "text-ink/65"
                            }`}
                          >
                            <span className="capitalize">{line.day}</span>
                            <span>{line.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Boutons de livraison Deliveroo / UberEats si configurés */}
            {(deliverooUrl || uberEatsUrl) && (
              <DeliveryPlatformButtons
                name={establishment.name}
                city={establishment.city}
                deliverooUrl={deliverooUrl}
                uberEatsUrl={uberEatsUrl}
                showDeliveroo={Boolean(deliverooUrl)}
                showUberEats={Boolean(uberEatsUrl)}
              />
            )}

            {/* Actions Partager et Favoris */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[.05]">
              <LikeButton
                entity={{
                  id: favoriteEntityId(establishment),
                  title: establishment.name,
                  url: href,
                  text: `${establishment.name} · ${address || category}`,
                }}
                showLabel
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-cream px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-sage"
              />
              <ShareButton
                entity={{
                  id: favoriteEntityId(establishment),
                  title: establishment.name,
                  url: href,
                  text: `${establishment.name} · ${address || category}`,
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
