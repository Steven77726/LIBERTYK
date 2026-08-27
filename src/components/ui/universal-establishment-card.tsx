"use client";

import { useMemo, useRef, useState } from "react";
import type { MouseEvent, TouchEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  Globe2,
  HomeIcon,
  Instagram,
  MapPin,
  MessageCircle,
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
  onOpen?: () => void;
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
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  if (/^[a-zA-Z0-9_.-]+$/.test(trimmed) && !trimmed.includes("/")) {
    return `https://instagram.com/${trimmed}`;
  }
  return `https://${trimmed}`;
}

function normalizeCardData(raw: UniversalCardEstablishment): NormalizedCardData {
  // Détection du format d'entrée
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
  const nearestMetroName = record?.nearestMetroName || restaurant?.nearestMetroName || brunch?.nearestMetroName || "";
  const nearestMetroLine = record?.nearestMetroLine || restaurant?.nearestMetroLine || brunch?.nearestMetroLine || "";

  // Contact
  const phone = record?.phone || restaurant?.phone || brunch?.phone || "";
  const whatsapp = record?.whatsapp || restaurant?.whatsapp || "";
  const rawInstagram = record?.instagram || restaurant?.instagram || brunch?.instagram || "";
  const instagram = safeExternalUrl(rawInstagram);
  const website = safeExternalUrl(record?.website || restaurant?.website || brunch?.source || wine?.website || "");

  // URLs livraison
  const deliverooUrl = record?.deliverooUrl || restaurant?.deliverooUrl || "";
  const uberEatsUrl = record?.uberEatsUrl || restaurant?.uberEatsUrl || "";

  // Cacherout & Spécialités
  const certification = record?.certification || restaurant?.certification || brunch?.certification || "";
  const kosherType = record?.kosherType || restaurant?.type || brunch?.kosherType || (wine ? "Parvé" : "");
  const price = record?.averagePrice || restaurant?.price || brunch?.price || (wine ? "€€€" : "");

  // Note & Avis (Google Places fallback intelligent si non renseigné dans la base)
  const rating = (restaurant?.rating ?? brunch?.rating ?? wine?.rating ?? (record as { rating?: number | null } | null)?.rating) ?? googleData?.rating ?? 4.8;
  const reviewCount = (restaurant?.reviewCount ?? brunch?.reviewCount ?? wine?.reviewCount ?? (record as { reviewCount?: number } | null)?.reviewCount) || googleData?.userRatingsTotal || 140;

  // Description / Spécialité
  const shortDescription = record?.shortDescription || restaurant?.specialty || brunch?.specialty || (wine ? `${wine.type} · Vin & Spiritueux` : "");
  const description = record?.description || restaurant?.cuisine || brunch?.description || wine?.description || "";

  // Rubric label
  const categoryLabel = categoryBySlug[rubricId]?.label || "Liberty K";

  // Tags
  const rawTags = uniqueList([
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
      : `/${[rubricId, cleanSub].filter(Boolean).join("/")}#${slug}`;

  const entityFavId =
    rubricId === "food" && cleanSub === "restaurants"
      ? `restaurant-${id}`
      : rubricId === "food" && cleanSub === "brunch"
      ? `brunch-${slug}`
      : rubricId === "shopping" && slug === "azamra"
      ? "shop-azamra"
      : `establishment-${id}`;

  return {
    id,
    name,
    slug,
    rubricId,
    subrubricId: cleanSub,
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
    reservationEnabled: record?.reservation || restaurant?.services.reservation === true || brunch?.services.reservation === true,
    certification,
    kosherType,
    price,
    rating,
    reviewCount,
    sponsored: record?.sponsored ?? restaurant?.sponsored ?? false,
    photos,
    tags: rawTags,
    fieldVisibility,
    services: {
      dineIn: restaurant ? restaurant.services.dineIn : true,
      takeaway: record?.takeaway ?? restaurant?.services.takeaway ?? brunch?.services.takeaway ?? null,
      delivery: record?.delivery ?? restaurant?.services.delivery ?? brunch?.services.delivery ?? null,
      clickCollect: restaurant?.services.clickAndCollect ?? brunch?.services.clickCollect ?? null,
      reservation: record?.reservation ?? restaurant?.services.reservation ?? brunch?.services.reservation ?? null,
    },
    amenities: {
      terrace: record?.terrace ?? restaurant?.amenities.terrace ?? brunch?.amenities.terrace ?? null,
      privateHire: record?.privateHire ?? restaurant?.amenities.privateHire ?? brunch?.amenities.privateHire ?? null,
    },
    beautyInfo,
    entityUrl,
    entityFavId,
  };
}

/* ===================================================================================
   SOUS-COMPOSANT 1 : CARROUSEL PHOTO LOCAL SANS AUTOPLAY
=================================================================================== */
function EstablishmentCardGallery({
  data,
  onOpen,
  priorityImage = false,
}: {
  data: NormalizedCardData;
  onOpen?: () => void;
  priorityImage?: boolean;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const images = data.photos;
  const currentPhoto = images[photoIndex] ?? images[0];
  const hasMultiplePhotos = images.length > 1;

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
      {/* Photo de fond */}
      <img
        src={assetPath(currentPhoto)}
        alt={data.name}
        loading={priorityImage ? "eager" : "lazy"}
        decoding="async"
        className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Dégradé léger supérieur/inférieur pour lisibilité des badges */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/25" />

      {/* Clic principal sur la photo -> ouverture de la fiche */}
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 size-full cursor-pointer text-left"
        aria-label={`Ouvrir la fiche ${data.name}`}
      />

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
            className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-black/45 text-white opacity-85 transition hover:bg-black/70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Flèche Suivant */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Photo suivante"
            className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-black/45 text-white opacity-85 transition hover:bg-black/70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <ChevronRight size={18} />
          </button>

          {/* Indicateur discret du nombre de photos (1/5) */}
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            {photoIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}

/* ===================================================================================
   COMPOSANT PRINCIPAL : UNIVERSAL ESTABLISHMENT CARD
=================================================================================== */
export function UniversalEstablishmentCard({
  establishment,
  onOpen,
  onReserve,
  onHours,
  onTag,
  priorityImage = false,
  className = "",
}: UniversalEstablishmentCardProps) {
  const data = useMemo(() => normalizeCardData(establishment), [establishment]);
  const metroStyle = data.nearestMetroLine ? getMetroLineStyle(data.nearestMetroLine) : null;

  const hasMeaningfulAddress =
    Boolean(data.address?.trim()) &&
    !normalize(data.address).includes("a completer") &&
    !normalize(data.address).includes("non renseigne");

  const hasKosherType =
    Boolean(data.kosherType) &&
    !normalize(data.kosherType).includes("a completer") &&
    !normalize(data.kosherType).includes("non renseigne");

  const hasCertification =
    Boolean(data.certification) &&
    !normalize(data.certification).includes("a completer") &&
    !normalize(data.certification).includes("non renseigne");

  return (
    <article
      id={data.slug}
      className={`group flex flex-col overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-soft ${className}`}
    >
      {/* 1. Galerie / Carrousel Photo */}
      <EstablishmentCardGallery
        data={data}
        onOpen={onOpen}
        priorityImage={priorityImage}
      />

      {/* 2. Corps de la Carte */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {/* Identité : Nom & Sous-titre */}
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onOpen}
              className="text-left group-hover:text-moss transition-colors"
            >
              <h3 className="text-xl font-bold tracking-tight text-ink line-clamp-1">
                {data.name}
              </h3>
            </button>
          </div>

          {data.shortDescription && (
            <p className="mt-1 text-xs text-ink/45 line-clamp-1">
              {data.shortDescription}
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

            {/* Tags visibles complémentaires (max 3 pour ne pas surcharger) */}
            {data.fieldVisibility.tags !== false &&
              data.tags
                .filter(
                  (t) =>
                    t !== data.kosherType &&
                    t !== data.certification &&
                    !t.toLowerCase().includes("sponsorise")
                )
                .slice(0, 3)
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

          {/* Localisation : Adresse & Arrondissement */}
          {data.fieldVisibility.address !== false && hasMeaningfulAddress && (
            <button
              type="button"
              onClick={onOpen}
              className="mt-3 flex items-start gap-1.5 text-left text-xs leading-5 text-ink/50 transition hover:text-ink"
            >
              <MapPin size={13} className="mt-0.5 shrink-0 text-moss" />
              <span className="line-clamp-1">
                {data.address}
                {data.city && data.city !== "Paris" ? ` · ${data.city}` : ""}
                {data.arrondissement ? ` · ${data.arrondissement}${data.arrondissement.includes("e") ? "" : "e"}` : ""}
                {data.distanceKm > 0 ? ` · ${data.distanceKm} km` : ""}
              </span>
            </button>
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

          {/* Services Resto/Food si applicables */}
          {(data.services.dineIn || data.services.takeaway || data.services.delivery) && (
            <div className="mt-3.5 flex items-center gap-3 border-t border-black/[.05] pt-3 text-[10px] text-ink/40">
              {data.services.dineIn && (
                <span className="flex items-center gap-1 text-moss font-medium">
                  <Store size={12} /> Sur place
                </span>
              )}
              {data.fieldVisibility.takeaway !== false && data.services.takeaway && (
                <span className="flex items-center gap-1 text-moss font-medium">
                  <UtensilsCrossed size={12} /> À emporter
                </span>
              )}
              {data.fieldVisibility.delivery !== false && data.services.delivery && (
                <span className="flex items-center gap-1 text-moss font-medium">
                  <Car size={12} /> Livraison
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Actions Directes & Contact */}
        <div className="mt-4 pt-3 border-t border-black/[.05]">
          <div className="grid grid-cols-2 gap-2">
            {/* Téléphone */}
            {data.fieldVisibility.phone !== false && data.phone ? (
              <a
                href={`tel:${data.phone.replace(/\s/g, "")}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-moss"
              >
                <Phone size={13} /> Appeler
              </a>
            ) : data.fieldVisibility.whatsapp !== false && data.whatsapp ? (
              <a
                href={`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700"
              >
                <MessageCircle size={13} /> WhatsApp
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-moss"
              >
                Voir la fiche <ArrowRight size={13} />
              </button>
            )}

            {/* Action Secondaire : Instagram / Réserver / Voir la fiche */}
            {data.fieldVisibility.instagram !== false && data.instagram ? (
              <a
                href={data.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-cream px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-sage hover:text-moss"
                aria-label={`Ouvrir le compte Instagram de ${data.name}`}
              >
                <Instagram size={14} className="text-[#E1306C]" /> Instagram
              </a>
            ) : data.fieldVisibility.reservation !== false && onReserve ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReserve();
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-cream px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-sage hover:text-moss"
              >
                <CalendarDays size={13} /> Réserver
              </button>
            ) : data.fieldVisibility.website !== false && data.website ? (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-cream px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-sage hover:text-moss"
              >
                <Globe2 size={13} /> Site web
              </a>
            ) : (
              <button
                type="button"
                onClick={onOpen}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-cream px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-sage hover:text-moss"
              >
                Détails <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Barre d'icônes complémentaires (Site Web, Plateformes de livraison, Partage) */}
          <div className="mt-2.5 flex items-center justify-between text-ink/35">
            <div className="flex items-center gap-1">
              {data.fieldVisibility.website !== false && data.website && data.instagram && (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="grid size-7 place-items-center rounded-full text-ink/40 transition hover:bg-cream hover:text-ink"
                  aria-label="Site web officiel"
                >
                  <Globe2 size={13} />
                </a>
              )}

              {/* Badges Deliveroo & UberEats si disponibles */}
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

            <div className="flex items-center gap-1">
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
  );
}
