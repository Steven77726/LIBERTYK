"use client";

import { useMemo, useRef, useState } from "react";
import type { MouseEvent, TouchEvent } from "react";
import {
  CalendarDays,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe2,
  HomeIcon,
  Instagram,
  MapPin,
  Maximize2,
  MessageCircle,
  Navigation,
  Phone,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { assetPath } from "@/lib/assets";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { LikeButton, ShareButton } from "@/components/ui/entity-actions";
import { DeliveryPlatformButtons } from "@/components/ui/delivery-badges";
import { getEstablishmentGoogleBusiness } from "@/lib/google-places";
import { PhotoLightboxModal } from "@/components/ui/photo-lightbox-modal";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import type { Restaurant } from "@/types/restaurant";
import type { Brunch } from "@/types/brunch";
import type { WineActivity } from "@/data/wine-activities";
import { categoryBySlug } from "@/data/categories";

export type UniversalCardEstablishment =
  | EstablishmentRecord
  | Restaurant
  | Brunch
  | WineActivity;

export type UniversalEstablishmentCardProps = {
  establishment: UniversalCardEstablishment;
  onOpen?: () => void; // Déprécié : conservé pour signature rétrocompatible
  onReserve?: () => void;
  onHours?: () => void;
  onTag?: (tag: string) => void;
  priorityImage?: boolean;
  className?: string;
};

type NormalizedCardData = {
  id: string;
  name: string;
  slug: string;
  rubricId: string;
  subrubricId: string;
  categoryLabel: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  arrondissement: string;
  postalCode: string;
  distanceKm: number;
  nearestMetroName: string;
  nearestMetroLine: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
  deliverooUrl: string;
  uberEatsUrl: string;
  reservationTarget: string;
  reservationEnabled: boolean;
  hours: string;
  certification: string;
  kosherType: string;
  price: string;
  rating: number | null;
  reviewCount: number;
  sponsored: boolean;
  photos: string[];
  tags: string[];
  fieldVisibility: Record<string, boolean>;
  services: {
    dineIn?: boolean | null;
    takeaway?: boolean | null;
    delivery?: boolean | null;
    clickCollect?: boolean | null;
    reservation?: boolean | null;
  };
  amenities: {
    terrace?: boolean | null;
    privateHire?: boolean | null;
  };
  beautyInfo?: {
    firstServiceName?: string;
    firstCategoryName?: string;
    priceFormatted?: string;
    durationMinutes?: number;
    atHome?: boolean;
    onSite?: boolean;
  };
  entityUrl: string;
  entityFavId: string;
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const uniqueList = (values: Array<string | undefined | null>) =>
  [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];

function safeExternalUrl(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function safeInstagramUrl(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.startsWith("https://@")) {
    return `https://instagram.com/${trimmed.slice(9)}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("instagram.com/")) return trimmed;
    try {
      const url = new URL(trimmed);
      if (!url.hostname.includes(".")) {
        return `https://instagram.com/${url.hostname}`;
      }
    } catch {
      // ignore
    }
    return trimmed;
  }
  if (trimmed.startsWith("instagram.com/") || trimmed.startsWith("www.instagram.com/")) {
    return `https://${trimmed}`;
  }
  const cleanHandle = trimmed.replace(/^@/, "").replace(/^\/+/, "");
  return `https://instagram.com/${cleanHandle}`;
}

function normalizeCardData(raw: UniversalCardEstablishment): NormalizedCardData {
  const isRestaurant = "fullAddress" in raw && "cuisine" in raw;
  const isBrunch = "images" in raw && "specialty" in raw && !("rubricId" in raw);
  const isWine = "title" in raw && "action" in raw;
  const isRecord = "rubricId" in raw;

  const record = isRecord ? (raw as EstablishmentRecord) : null;
  const restaurant = isRestaurant ? (raw as Restaurant) : null;
  const brunch = isBrunch ? (raw as Brunch) : null;
  const wine = isWine ? (raw as WineActivity) : null;

  const id = record?.id || restaurant?.id || brunch?.slug || wine?.slug || "establishment";
  const name = record?.name || restaurant?.name || brunch?.name || wine?.title || "Établissement";
  const slug = record?.slug || restaurant?.id || brunch?.slug || wine?.slug || id;
  const rubricId = record?.rubricId || (restaurant ? "food" : brunch ? "food" : wine ? "vin-spiritueux" : "food");
  const subrubricId = record?.subrubricId || (restaurant ? "restaurants" : brunch ? "brunch" : wine ? "selections" : "");

  const googleData = getEstablishmentGoogleBusiness(name);

  // Photos
  let photos: string[] = [];
  if (record) {
    photos = uniqueList([record.mainPhoto, ...(record.photos ?? [])]);
  } else if (restaurant) {
    photos = uniqueList([restaurant.image, ...(restaurant.gallery ?? [])]);
  } else if (brunch) {
    photos = uniqueList(brunch.images ?? []);
  } else if (wine) {
    photos = uniqueList([wine.image]);
  }
  if (!photos.length) {
    photos = [categoryBySlug[rubricId]?.image || "/images/food/restaurants-khan.jpg"];
  }

  // Adresse et Localisation
  const address = record?.address || restaurant?.fullAddress || brunch?.address || wine?.address || "";
  const city = record?.city || restaurant?.city || "Paris";
  const arrondissement = String(record?.arrondissement || restaurant?.arrondissement || brunch?.arrondissement || (wine?.address?.includes("75017") ? "17" : ""));
  const postalCode = record?.postalCode || restaurant?.postalCode || brunch?.postalCode || (wine?.address?.match(/750\d{2}/)?.[0] ?? "");
  const distanceKm = restaurant?.distanceKm || brunch?.distanceKm || 0;

  // Métro
  const nearestMetroName = record?.nearestMetroName || restaurant?.nearestMetroName || brunch?.nearestMetroName || googleData?.nearestMetroName || "";
  const nearestMetroLine = record?.nearestMetroLine || restaurant?.nearestMetroLine || brunch?.nearestMetroLine || googleData?.nearestMetroLine || "";

  // Contact
  const phone = record?.phone || restaurant?.phone || brunch?.phone || "";
  const whatsapp = record?.whatsapp || restaurant?.whatsapp || "";
  const rawInstagram = record?.instagram || restaurant?.instagram || brunch?.instagram || "";
  const instagram = safeInstagramUrl(rawInstagram);
  const website = safeExternalUrl(record?.website || restaurant?.website || brunch?.source || wine?.website || "");

  // Horaires
  let hours = record?.hours || "";
  if (!hours && restaurant?.hours) {
    const lines = Object.entries(restaurant.hours)
      .map(([day, time]) => (time && !normalize(time).includes("a completer") && !normalize(time).includes("non renseigne") ? `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}` : ""))
      .filter(Boolean);
    hours = lines.join("\n");
  } else if (!hours && brunch?.hours) {
    const lines = Object.entries(brunch.hours)
      .map(([day, time]) => (time && !normalize(time).includes("a completer") && !normalize(time).includes("non renseigne") ? `${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}` : ""))
      .filter(Boolean);
    hours = lines.join("\n");
  }

  // URLs livraison
  const deliverooUrl = record?.deliverooUrl || restaurant?.deliverooUrl || "";
  const uberEatsUrl = record?.uberEatsUrl || restaurant?.uberEatsUrl || "";

  // Cacherout & Spécialités
  const certification = record?.certification || restaurant?.certification || brunch?.certification || "";
  const kosherType = record?.kosherType || restaurant?.type || brunch?.kosherType || (wine ? "Parvé" : "");
  const price = record?.averagePrice || restaurant?.price || brunch?.price || (wine ? "€€€" : "");

  // Note & Avis
  const rating = (restaurant?.rating ?? brunch?.rating ?? wine?.rating ?? (record as { rating?: number | null } | null)?.rating) ?? googleData?.rating ?? 4.8;
  const reviewCount = (restaurant?.reviewCount ?? brunch?.reviewCount ?? wine?.reviewCount ?? (record as { reviewCount?: number } | null)?.reviewCount) || googleData?.userRatingsTotal || 140;

  // Description / Spécialité
  const shortDescription = record?.shortDescription || restaurant?.specialty || brunch?.specialty || (wine ? `${wine.type} · Vin & Spiritueux` : "");
  const description = record?.description || restaurant?.cuisine || brunch?.description || wine?.description || "";

  // Rubric label
  const categoryLabel = categoryBySlug[rubricId]?.label || "Liberty K";

  // Tags
  const tags = uniqueList([
    ...(record?.visibleTagIds ?? []),
    ...(record?.cuisineTypes ?? []),
    ...(restaurant?.tags ?? []),
    ...(brunch?.tags ?? []),
    ...(wine?.tags ?? []),
  ]);

  // Visibilité des champs
  const fieldVisibility = {
    phone: true,
    whatsapp: true,
    instagram: true,
    website: true,
    reservation: true,
    address: true,
    opening_hours: true,
    tags: true,
    gallery: true,
    price: true,
    reviews: true,
    certification: true,
    delivery: true,
    takeaway: true,
    terrace: true,
    ...(record?.fieldVisibility ?? restaurant?.fieldVisibility ?? brunch?.fieldVisibility ?? {}),
  };

  // Beauté spécifique
  let beautyInfo: NormalizedCardData["beautyInfo"] = undefined;
  if (record?.beautyServices && record.beautyServices.length > 0) {
    const first = record.beautyServices[0];
    const priceVal = first.price;
    const priceFormatted =
      priceVal !== null && priceVal !== undefined && Number.isFinite(Number(priceVal))
        ? `${first.priceFrom ? "Dès " : ""}${Number(priceVal).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`
        : "";
    beautyInfo = {
      firstServiceName: first.serviceName,
      firstCategoryName: first.categoryName,
      priceFormatted,
      durationMinutes: first.durationMinutes ?? undefined,
      atHome: first.atHome,
      onSite: first.onSite,
    };
  }

  // URL et Fav ID
  const cleanSub = subrubricId.startsWith(`${rubricId}-`) ? subrubricId.slice(rubricId.length + 1) : subrubricId;
  const entityUrl =
    rubricId === "food" && cleanSub === "restaurants"
      ? `/food/restaurants#${slug}`
      : rubricId === "food" && cleanSub === "brunch"
      ? `/food/brunch/${slug}`
      : rubricId === "shopping" && slug === "azamra"
      ? `/shopping/vetements/azamra`
      : `/${rubricId}/${cleanSub || "decouverte"}#${slug}`;

  const entityFavId = `establishment-${id}`;

  return {
    id,
    name,
    slug,
    rubricId,
    subrubricId,
    categoryLabel,
    shortDescription,
    description,
    address,
    city,
    arrondissement,
    postalCode,
    distanceKm,
    nearestMetroName,
    nearestMetroLine,
    phone,
    whatsapp,
    instagram,
    website,
    deliverooUrl,
    uberEatsUrl,
    reservationTarget: record?.reservationTarget || "",
    reservationEnabled: Boolean(record?.reservation || restaurant?.services.reservation === true || brunch?.services.reservation === true),
    hours,
    certification,
    kosherType,
    price,
    rating,
    reviewCount,
    sponsored: Boolean(record?.sponsored || restaurant?.sponsored),
    photos,
    tags,
    fieldVisibility,
    services: {
      dineIn: restaurant?.services?.dineIn ?? brunch?.services?.dineIn ?? null,
      takeaway: record?.takeaway ?? restaurant?.services?.takeaway ?? brunch?.services?.takeaway ?? null,
      delivery: record?.delivery ?? restaurant?.services?.delivery ?? brunch?.services?.delivery ?? null,
      clickCollect: restaurant?.services?.clickAndCollect ?? brunch?.services?.clickCollect ?? null,
      reservation: record?.reservation ?? restaurant?.services?.reservation ?? brunch?.services?.reservation ?? null,
    },
    amenities: {
      terrace: record?.terrace ?? restaurant?.amenities?.terrace ?? null,
      privateHire: record?.privateHire ?? restaurant?.amenities?.privateHire ?? null,
    },
    beautyInfo,
    entityUrl,
    entityFavId,
  };
}

/* ===================================================================================
   SOUS-COMPOSANT : CARROUSEL PHOTO LOCAL AVEC CLIC POUR LIGHTBOX
=================================================================================== */
function EstablishmentCardGallery({
  data,
  onPhotoClick,
  priorityImage = false,
}: {
  data: NormalizedCardData;
  onPhotoClick: (photoIndex: number) => void;
  priorityImage?: boolean;
}) {
  const images = data.photos;
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const hasMultiplePhotos = images.length > 1;
  const currentPhoto = images[photoIndex] || images[0];

  const handlePrev = (e: MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || !hasMultiplePhotos) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        setPhotoIndex((prev) => (prev + 1) % images.length);
      } else {
        setPhotoIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden bg-sage select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo cliquable pour ZOOM LIGHTBOX uniquement */}
      <img
        src={assetPath(currentPhoto)}
        alt={data.name}
        loading={priorityImage ? "eager" : "lazy"}
        decoding="async"
        onClick={() => onPhotoClick(photoIndex)}
        title="Cliquer pour agrandir la photo"
        className="size-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
      />

      {/* Dégradé supérieur pour lisibilité des badges */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30" />

      {/* Badges en haut de la photo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3.5 sm:p-4">
        <div className="flex flex-col items-start gap-1.5">
          {data.beautyInfo?.firstCategoryName ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-xs backdrop-blur">
              {data.beautyInfo.firstCategoryName}
            </span>
          ) : data.shortDescription ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-xs backdrop-blur line-clamp-1 max-w-[200px]">
              {data.shortDescription.split("·")[0]?.trim()}
            </span>
          ) : null}

          {data.sponsored && (
            <span className="rounded-full bg-[#f6ecd9] px-2.5 py-1 text-[10px] font-bold text-[#8f6424] shadow-xs">
              Sponsorisé
            </span>
          )}

          {data.fieldVisibility.reviews !== false && (
            <RecommendationBadge rating={data.rating} reviewCount={data.reviewCount} />
          )}
        </div>

        {/* Bouton Favoris */}
        <div className="pointer-events-auto">
          <LikeButton
            entity={{
              id: data.entityFavId,
              title: data.name,
              url: data.entityUrl,
              text: `${data.name} · ${data.address || data.city}`,
            }}
          />
        </div>
      </div>

      {/* Contrôles du carrousel de photos (si > 1 photo) */}
      {hasMultiplePhotos && (
        <>
          {/* Flèche Précédent */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Photo précédente"
            className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-black/45 text-white opacity-85 transition hover:bg-black/70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Flèche Suivant */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Photo suivante"
            className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-black/45 text-white opacity-85 transition hover:bg-black/70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>

          {/* Indicateur discret du nombre de photos (1/5) */}
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {photoIndex + 1} / {images.length}
          </div>
        </>
      )}

      {/* Icône discrète d'agrandissement photo */}
      <button
        type="button"
        onClick={() => onPhotoClick(photoIndex)}
        aria-label="Agrandir la photo"
        className="pointer-events-auto absolute bottom-3 left-3 grid size-7 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75 cursor-pointer"
      >
        <Maximize2 size={13} />
      </button>
    </div>
  );
}

/* ===================================================================================
   COMPOSANT PRINCIPAL : UNIVERSAL ESTABLISHMENT CARD (100% AUTONOME SANS DRAWER)
=================================================================================== */
export function UniversalEstablishmentCard({
  establishment,
  onTag,
  priorityImage = false,
  className = "",
}: UniversalEstablishmentCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);

  const data = useMemo(() => normalizeCardData(establishment), [establishment]);
  const metroStyle = data.nearestMetroLine ? getMetroLineStyle(data.nearestMetroLine) : null;

  const hasMeaningfulAddress =
    Boolean(data.address?.trim()) &&
    !normalize(data.address).includes("a completer") &&
    !normalize(data.address).includes("non renseigne");

  const hasKosherType =
    Boolean(data.kosherType) &&
    !normalize(data.kosherType).includes("a completer") &&
    !normalize(data.kosherType).includes("non renseigne") &&
    !normalize(data.kosherType).includes("non concerne");

  const hasCertification =
    Boolean(data.certification) &&
    !normalize(data.certification).includes("a completer") &&
    !normalize(data.certification).includes("non renseigne") &&
    !normalize(data.certification).includes("non concerne");

  const fullAddress = [data.address, data.postalCode, data.city].filter(Boolean).join(", ");
  const mapsUrl = hasMeaningfulAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || data.name)}`
    : "";
  const wazeUrl = hasMeaningfulAddress
    ? `https://waze.com/ul?q=${encodeURIComponent(fullAddress || data.name)}&navigate=yes`
    : "";

  const isEvent =
    data.rubricId === "sorties" ||
    data.subrubricId.includes("evenement") ||
    data.subrubricId.includes("concert");

  const bookingLabel = isEvent ? "Billetterie" : "Réserver";

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <article
        id={data.slug}
        className={`group flex flex-col overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-white shadow-xs transition-all duration-300 hover:shadow-soft ${className}`}
      >
        {/* 1. Galerie Photo avec clic vers Lightbox */}
        <EstablishmentCardGallery
          data={data}
          onPhotoClick={handleOpenLightbox}
          priorityImage={priorityImage}
        />

        {/* 2. Corps de la Fiche Publique Autonome */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            {/* Identité : Nom (Texte neutre) */}
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-xl font-bold tracking-tight text-ink">
                {data.name}
              </h3>
            </div>

            {/* Accroche / Description courte */}
            {data.shortDescription && (
              <p className="mt-1 text-xs font-semibold text-moss">
                {data.shortDescription}
              </p>
            )}

            {/* Description détaillée / longue */}
            {data.description && data.description !== data.shortDescription && (
              <p className="mt-2 text-xs leading-relaxed text-ink/70 whitespace-pre-line">
                {data.description}
              </p>
            )}

            {/* Avis & Note Google Vérifiée */}
            {data.fieldVisibility.reviews !== false && (
              <div className="mt-2.5">
                <CustomerRating rating={data.rating} reviewCount={data.reviewCount} compact />
              </div>
            )}

            {/* Badges de Cacherout, Type & Prix */}
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[10px]">
              {hasKosherType && (
                <span
                  onClick={onTag ? () => onTag(data.kosherType) : undefined}
                  className={`rounded-full px-2.5 py-1 font-semibold ${
                    onTag ? "cursor-pointer" : ""
                  } ${
                    data.kosherType === "Bassari"
                      ? "bg-rose-50 text-rose-700"
                      : data.kosherType === "Halavi"
                      ? "bg-sky-50 text-sky-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {data.kosherType}
                </span>
              )}

              {data.fieldVisibility.certification !== false && hasCertification && (
                <span
                  onClick={onTag ? () => onTag(data.certification) : undefined}
                  className={`rounded-full bg-cream px-2.5 py-1 font-semibold text-ink/65 ${
                    onTag ? "cursor-pointer hover:bg-sage hover:text-moss" : ""
                  }`}
                >
                  ✡ {data.certification}
                </span>
              )}

              {data.fieldVisibility.price !== false && data.price && (
                <span className="rounded-full bg-cream px-2.5 py-1 font-bold text-ink/50">
                  {data.price}
                </span>
              )}

              {/* Badges Beauté Spécifiques si présents */}
              {data.beautyInfo && (
                <>
                  {data.beautyInfo.priceFormatted && (
                    <span className="rounded-full bg-cream px-2.5 py-1 font-bold text-moss">
                      {data.beautyInfo.priceFormatted}
                    </span>
                  )}
                  {data.beautyInfo.durationMinutes && (
                    <span className="rounded-full bg-cream px-2.5 py-1 font-medium text-ink/50">
                      {data.beautyInfo.durationMinutes} min
                    </span>
                  )}
                  {data.beautyInfo.atHome && (
                    <span className="rounded-full bg-cream px-2.5 py-1 font-medium text-ink/50 inline-flex items-center gap-1">
                      <HomeIcon size={10} /> À domicile
                    </span>
                  )}
                  {data.beautyInfo.onSite && (
                    <span className="rounded-full bg-cream px-2.5 py-1 font-medium text-ink/50">
                      Sur place
                    </span>
                  )}
                </>
              )}

              {/* Tags visibles complémentaires */}
              {data.fieldVisibility.tags !== false &&
                data.tags
                  .filter(
                    (t) =>
                      t !== data.kosherType &&
                      t !== data.certification &&
                      !t.toLowerCase().includes("sponsorise")
                  )
                  .slice(0, 8)
                  .map((tag) => (
                    <span
                      key={tag}
                      onClick={onTag ? () => onTag(tag) : undefined}
                      className={`rounded-full bg-sage/60 px-2.5 py-1 text-[10px] font-medium text-moss ${
                        onTag ? "cursor-pointer hover:bg-moss hover:text-white" : ""
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
            </div>

            {/* Localisation : Adresse & Arrondissement (Texte explicite) */}
            {data.fieldVisibility.address !== false && hasMeaningfulAddress && (
              <div className="mt-3 flex items-start gap-1.5 text-left text-xs leading-5 text-ink/60">
                <MapPin size={13} className="mt-0.5 shrink-0 text-moss" />
                <span className="line-clamp-2">
                  {data.address}
                  {data.city && data.city !== "Paris" ? ` · ${data.city}` : ""}
                  {data.arrondissement ? ` · ${data.arrondissement}${data.arrondissement.includes("e") ? "" : "e"}` : ""}
                  {data.distanceKm > 0 ? ` · ${data.distanceKm} km` : ""}
                </span>
              </div>
            )}

            {/* Métro le plus proche avec Badge de Ligne Stylé */}
            {data.nearestMetroName && (
              <div className="mt-2 flex items-center">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold text-ink/55">
                  <span className="truncate">Métro {data.nearestMetroName}</span>
                  {metroStyle && (
                    <span
                      className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full border px-1 text-[9px] font-black leading-none"
                      style={{
                        backgroundColor: metroStyle.background,
                        color: metroStyle.foreground,
                        borderColor: metroStyle.border,
                      }}
                    >
                      {metroStyle.label}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Horaires d'ouverture : Volet dépliable / repliable à volonté */}
            {data.fieldVisibility.opening_hours !== false && data.hours && (
              <div className="mt-2.5 overflow-hidden rounded-2xl bg-cream/70 border border-black/[.04] transition-all">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHoursOpen((prev) => !prev);
                  }}
                  className="flex w-full items-center justify-between p-2.5 text-left text-[11px] font-semibold text-ink/75 transition hover:bg-sage/40 cursor-pointer"
                  aria-expanded={hoursOpen}
                >
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-moss shrink-0" />
                    <span>Horaires d&apos;ouverture</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-ink/45">
                    <span>{hoursOpen ? "Masquer" : "Voir"}</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${hoursOpen ? "rotate-180 text-moss" : ""}`}
                    />
                  </div>
                </button>

                {hoursOpen && (
                  <div className="border-t border-black/[.05] p-3 space-y-1 text-ink/65 text-[11px] leading-snug">
                    {data.hours.split("\n").filter(Boolean).map((line, idx) => {
                      const parts = line.split(":");
                      const day = parts[0]?.trim();
                      const time = parts.slice(1).join(":").trim();
                      return (
                        <div key={idx} className="flex items-center justify-between border-b border-black/[.03] pb-1 last:border-0 last:pb-0">
                          <span className="font-medium text-ink/70">{day}</span>
                          <span className="font-semibold text-ink/90">{time || "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Services & Équipements si applicables */}
            {(data.services.dineIn || data.services.takeaway || data.services.delivery || data.amenities.terrace || data.amenities.privateHire) && (
              <div className="mt-3.5 flex flex-wrap items-center gap-3 border-t border-black/[.05] pt-3 text-[10px] text-ink/50">
                {data.services.dineIn && (
                  <span className="flex items-center gap-1 text-moss font-semibold">
                    <Store size={12} /> Sur place
                  </span>
                )}
                {data.fieldVisibility.takeaway !== false && data.services.takeaway && (
                  <span className="flex items-center gap-1 text-moss font-semibold">
                    <UtensilsCrossed size={12} /> À emporter
                  </span>
                )}
                {data.fieldVisibility.delivery !== false && data.services.delivery && (
                  <span className="flex items-center gap-1 text-moss font-semibold">
                    <Car size={12} /> Livraison
                  </span>
                )}
                {data.fieldVisibility.terrace !== false && data.amenities.terrace && (
                  <span className="flex items-center gap-1 text-moss font-semibold">
                    Terrasse
                  </span>
                )}
                {data.amenities.privateHire && (
                  <span className="flex items-center gap-1 text-moss font-semibold">
                    Privatisable
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 3. Actions Directes & Liens Externes : Tous sur la même ligne avec la même forme */}
          <div className="mt-4 pt-3 border-t border-black/[.05] space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Bouton Téléphone */}
              {data.fieldVisibility.phone !== false && data.phone && (
                <a
                  href={`tel:${data.phone.replace(/\s/g, "")}`}
                  className="flex flex-1 min-w-[85px] items-center justify-center gap-1.5 rounded-xl bg-ink px-2.5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-moss"
                >
                  <Phone size={13} />
                  <span>Appeler</span>
                </a>
              )}

              {/* Bouton WhatsApp */}
              {data.fieldVisibility.whatsapp !== false && data.whatsapp && (
                <a
                  href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 min-w-[85px] items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-2.5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#1faa53]"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* Bouton Waze */}
              {wazeUrl && (
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 min-w-[75px] items-center justify-center gap-1.5 rounded-xl bg-[#33B5E5] px-2.5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#209ecf]"
                  title="Ouvrir dans Waze"
                >
                  <Navigation size={13} />
                  <span>Waze</span>
                </a>
              )}

              {/* Bouton Google Maps */}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 min-w-[75px] items-center justify-center gap-1.5 rounded-xl bg-cream border border-black/[.05] px-2.5 py-2.5 text-xs font-semibold text-ink transition hover:bg-sage hover:text-moss"
                  title="Ouvrir dans Google Maps"
                >
                  <MapPin size={13} className="text-moss" />
                  <span>Maps</span>
                </a>
              )}

              {/* Bouton Instagram */}
              {data.fieldVisibility.instagram !== false && data.instagram && (
                <a
                  href={data.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 min-w-[85px] items-center justify-center gap-1.5 rounded-xl bg-cream border border-black/[.05] px-2.5 py-2.5 text-xs font-semibold text-ink transition hover:bg-sage hover:text-moss"
                  aria-label={`Compte Instagram de ${data.name}`}
                >
                  <Instagram size={13} className="text-[#E1306C]" />
                  <span>Insta</span>
                </a>
              )}

              {/* Bouton Site Web */}
              {data.fieldVisibility.website !== false && data.website && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 min-w-[80px] items-center justify-center gap-1.5 rounded-xl bg-cream border border-black/[.05] px-2.5 py-2.5 text-xs font-semibold text-ink transition hover:bg-sage hover:text-moss"
                  title="Site web officiel"
                >
                  <Globe2 size={13} className="text-ink/60" />
                  <span>Web</span>
                </a>
              )}

              {/* Bouton Billetterie / Réservation si configuré */}
              {data.reservationTarget && (
                <a
                  href={safeExternalUrl(data.reservationTarget)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 min-w-[95px] items-center justify-center gap-1.5 rounded-xl bg-moss px-2.5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-moss/90"
                >
                  <CalendarDays size={13} />
                  <span>{bookingLabel}</span>
                </a>
              )}
            </div>

            {/* Barre d'actions tierces (Deliveroo, UberEats & Partage) */}
            <div className="flex items-center justify-between pt-1 text-ink/40">
              <div className="flex items-center gap-1.5">
                <DeliveryPlatformButtons
                  name={data.name}
                  city={data.city}
                  deliverooUrl={data.deliverooUrl}
                  uberEatsUrl={data.uberEatsUrl}
                  showDeliveroo={Boolean(data.deliverooUrl)}
                  showUberEats={Boolean(data.uberEatsUrl)}
                  compact
                />
              </div>

              <div className="ml-auto flex items-center gap-1">
                <ShareButton
                  entity={{
                    id: data.entityFavId,
                    title: data.name,
                    url: data.entityUrl,
                    text: `${data.name} · ${data.address || data.city}`,
                  }}
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Lightbox Photo Plein Écran (PHOTO ONLY) */}
      <PhotoLightboxModal
        photos={data.photos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={data.name}
      />
    </>
  );
}
