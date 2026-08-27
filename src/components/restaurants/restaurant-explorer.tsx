"use client";

import {
  CalendarDays, Car, ChevronDown,
  Copy, Globe2, Instagram, List, Map as MapIcon,
  MapPin, Navigation, Phone, Search, SlidersHorizontal,
  Store, UtensilsCrossed, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "@/types/restaurant";
import type { LocalSponsorshipLevel } from "@/data/establishments";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { ReservationForm } from "@/components/restaurants/reservation-form";
import { assetPath } from "@/lib/assets";
import { LikeButton, ShareButton } from "@/components/ui/entity-actions";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";
import { InteractiveMap, type MapEstablishment } from "@/components/map/interactive-map";
import { DeliveryPlatformButtons } from "@/components/ui/delivery-badges";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";

const cuisineFilters = ["Burgers", "Japonais", "Italien", "Grillades", "Israélien", "Français", "Africain", "Oriental", "Tunisien", "Marocain", "Asiatique", "Indien", "Pizzeria", "Sandwicherie", "Salon de thé", "Brunch", "Pâtisserie", "Bar à vin", "Cocktails"];
const typeFilters = ["Viande", "Lait", "Parvé"];
const serviceFilters = ["Sur place", "À emporter", "Livraison", "Click & Collect", "Réservation en ligne"];
const availabilityFilters = ["Ouvert maintenant", "Ouvert le midi", "Ouvert le soir", "Ouvert le dimanche", "Ouvert tard"];
const comfortFilters = ["Adapté aux familles", "Terrasse", "Wifi", "Menu enfant", "Privatisation"];
const locationFilters = ["À moins de 2 km", "À moins de 5 km", "À moins de 10 km", "Les plus proches"];
const publicDefaultFieldVisibility: Record<string, boolean> = {
  phone: true,
  whatsapp: true,
  instagram: true,
  website: true,
  email: true,
  reservation: true,
  address: true,
  opening_hours: true,
  tags: true,
  gallery: true,
  takeaway: true,
  delivery: true,
  price: true,
  map: true,
  reviews: true,
  certification: true,
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const slugify = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const dayIndex = () => (new Date().getDay() + 6) % 7;
const hasMeaningfulAddress = (restaurant: Restaurant) => restaurant.fullAddress.trim() && restaurant.fullAddress !== "Adresse à compléter";
const hasMeaningfulHours = (restaurant: Restaurant) => Object.values(restaurant.hours).some((value) => {
  const normalized = normalize(value ?? "");
  return normalized && !normalized.includes("a completer") && !normalized.includes("non renseigne");
});
const normalizeExternalUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};
const buildAddressQuery = (restaurant: Restaurant) => {
  if (Number.isFinite(restaurant.latitude) && Number.isFinite(restaurant.longitude) && restaurant.latitude !== 48.8566 && restaurant.longitude !== 2.3522) {
    return `${restaurant.latitude},${restaurant.longitude}`;
  }
  return [restaurant.fullAddress, restaurant.postalCode, restaurant.city ?? "Paris", restaurant.country ?? "France"].filter(Boolean).join(", ");
};
const uniqueList = (values: Array<string | undefined | null>) => [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
const normalizeSponsorshipLevel = (value?: string): LocalSponsorshipLevel => {
  const levels: LocalSponsorshipLevel[] = ["Standard", "Featured", "Premium", "Sponsorisé", "Partenaire officiel", "Coup de cœur Liberty"];
  return levels.includes(value as LocalSponsorshipLevel) ? value as LocalSponsorshipLevel : "Standard";
};
const distanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

function parseArrondissement(value?: string) {
  const match = String(value ?? "").match(/\d{1,2}/);
  return match ? Number(match[0]) : 0;
}

function mapKosherType(value?: string): Restaurant["type"] {
  const normalized = normalize(value ?? "");
  if (normalized.includes("bassari") || normalized.includes("viande")) return "Viande";
  if (normalized.includes("halavi") || normalized.includes("lait")) return "Lait";
  if (normalized.includes("parve") || normalized.includes("parvé")) return "Parvé";
  return "À compléter";
}

function mapPrice(value?: string): Restaurant["price"] {
  if (value === "€" || value === "€€" || value === "€€€") return value;
  return "À compléter";
}

function restaurantToEstablishmentRecord(restaurant: Restaurant): EstablishmentRecord {
  return {
    id: restaurant.id,
    rubricId: "food",
    subrubricId: "restaurants",
    mainPhoto: restaurant.image,
    photos: restaurant.gallery ?? [],
    name: restaurant.name,
    slug: restaurant.id,
    shortDescription: `${restaurant.specialty} · ${restaurant.cuisine}`,
    description: [restaurant.specialty, restaurant.cuisine].filter((value) => value && value !== "À compléter").join(" — "),
    address: restaurant.fullAddress,
    city: restaurant.city ?? "Paris",
    arrondissement: restaurant.arrondissement ? `${restaurant.arrondissement}e` : "",
    postalCode: restaurant.postalCode,
    country: restaurant.country ?? "France",
    email: restaurant.email ?? "",
    phone: restaurant.phone,
    whatsapp: restaurant.whatsapp ?? "",
    instagram: restaurant.instagram ?? "",
    deliverooUrl: restaurant.deliverooUrl ?? "",
    uberEatsUrl: restaurant.uberEatsUrl ?? "",
    website: restaurant.website ?? "",
    hours: Object.entries(restaurant.hours).map(([day, hours]) => `${day}: ${hours}`).join("\n"),
    terrace: restaurant.amenities.terrace === true,
    delivery: restaurant.services.delivery === true,
    takeaway: restaurant.services.takeaway === true,
    reservation: restaurant.services.reservation === true,
    privateHire: restaurant.amenities.privateHire === true,
    certification: restaurant.certification,
    kosherType: restaurant.type === "Viande" ? "Bassari" : restaurant.type === "Lait" ? "Halavi" : restaurant.type,
    averagePrice: restaurant.price,
    latitude: String(restaurant.latitude),
    longitude: String(restaurant.longitude),
    status: "Publié",
    visible: true,
    sponsorshipLevel: normalizeSponsorshipLevel(restaurant.sponsorshipLevel),
    sponsored: restaurant.sponsored ?? false,
    sponsorPriority: 0,
    sponsorDuration: "",
    sponsorStartsAt: "",
    sponsorEndsAt: "",
    sponsorPlacement: "",
    sponsorNotes: "",
    reservationTarget: "",
    cuisineTypes: [restaurant.cuisine, restaurant.specialty].filter(Boolean),
    order: 0,
    customerSearches: [],
    visibleTagIds: restaurant.tags ?? [],
    fieldVisibility: restaurant.fieldVisibility,
  };
}

function hourLinesToRecord(value?: string) {
  const fallback = {
    lundi: "",
    mardi: "",
    mercredi: "",
    jeudi: "",
    vendredi: "",
    samedi: "",
    dimanche: "",
  };
  if (!value?.trim()) return fallback;
  return value.split("\n").reduce<Record<string, string>>((acc, line) => {
    const [day, ...rest] = line.split(":");
    if (day?.trim() && rest.join(":").trim()) {
      const hourText = rest.join(":").trim();
      acc[day.trim().toLowerCase()] = normalize(hourText).includes("a completer") ? "" : hourText;
    }
    return acc;
  }, { ...fallback });
}

function parseTimeToMinutes(timeStr: string): number | null {
  const t = timeStr.trim().toLowerCase().replace("h", ":");
  const isPM = t.includes("pm");
  const isAM = t.includes("am");
  const clean = t.replace(/(am|pm)/g, "").trim();
  const parts = clean.split(":");
  let hour = Number(parts[0]);
  let min = parts.length > 1 ? Number(parts[1]) : 0;
  if (isNaN(hour)) return null;
  if (isNaN(min)) min = 0;
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;
  return hour * 60 + min;
}

function getOpenStatus(restaurant: Restaurant) {
  const today = days[dayIndex()];
  const yesterday = days[(dayIndex() + 6) % 7];
  const text = restaurant.hours[today] ?? "";
  const yesterdayText = restaurant.hours[yesterday] ?? "";
  const normalized = normalize(text);

  if (!hasMeaningfulHours(restaurant)) return { label: "Horaires non renseignés", open: null as boolean | null };

  if (normalized.includes("24h") || normalized.includes("24/24")) {
    return { label: "Ouvert 24h/24", open: true };
  }
  if (normalized === "ferme" || normalized.startsWith("ferme")) {
    return { label: "Fermé aujourd'hui", open: false };
  }

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let closingTime = "";

  const rangeRegex = /(\d{1,2}(?:[:h]\d{2})?\s*(?:am|pm)?)\s*(?:[–—\-–]|à|to)\s*(\d{1,2}(?:[:h]\d{2})?\s*(?:am|pm)?)/gi;

  const isOpenForText = (hoursText: string, previousDay = false) => {
    if (!hoursText || normalize(hoursText).includes("ferme")) return false;
    let isMatch = false;
    let match: RegExpExecArray | null;
    const re = new RegExp(rangeRegex.source, "gi");
    while ((match = re.exec(hoursText)) !== null) {
      const startMin = parseTimeToMinutes(match[1]);
      const endMin = parseTimeToMinutes(match[2]);
      if (startMin !== null && endMin !== null) {
        const adjStart = startMin + (previousDay ? -24 * 60 : 0);
        let adjEnd = endMin + (previousDay ? -24 * 60 : 0);
        if (adjEnd < adjStart) {
          adjEnd += 24 * 60;
        }
        if (nowMinutes >= adjStart && nowMinutes <= adjEnd) {
          isMatch = true;
          const endHour = Math.floor(endMin / 60) % 24;
          const endMinute = endMin % 60;
          closingTime = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
        }
      }
    }
    return isMatch;
  };

  const isOpen = isOpenForText(text) || isOpenForText(yesterdayText, true);
  const hasRanges = rangeRegex.test(text);

  if (!hasRanges && normalized && !normalized.includes("ferme")) {
    return { label: "Horaires disponibles", open: null as boolean | null };
  }

  return {
    label: isOpen ? (closingTime ? `Ouvert · Ferme à ${closingTime}` : "Ouvert maintenant") : "Fermé actuellement",
    open: isOpen,
  };
}

function establishmentRecordsToRestaurants(records: EstablishmentRecord[]): Restaurant[] {
  return records.map((item, index) => {
    const arrondissement = parseArrondissement(item.arrondissement);
    const postalCode = item.postalCode || (arrondissement ? `750${String(arrondissement).padStart(2, "0")}` : "");
    const gallery = uniqueList([item.mainPhoto, ...(item.photos ?? [])]);
    return {
      id: item.slug || item.id || slugify(`${item.name}-${item.address}`),
      name: item.name,
      fullAddress: item.address || "",
      postalCode,
      arrondissement,
      phone: item.phone || "",
      whatsapp: item.whatsapp,
      email: item.email,
      specialty: item.shortDescription || item.description || "Restaurant casher",
      cuisine: item.cuisineTypes?.length ? item.cuisineTypes.join(", ") : item.kosherType || "Restaurant casher",
      type: mapKosherType(item.kosherType),
      certification: item.certification || "",
      services: {
        dineIn: true,
        takeaway: item.takeaway ?? null,
        delivery: item.delivery ?? null,
        clickAndCollect: null,
        reservation: item.reservation ?? null,
      },
      amenities: {
        familyFriendly: null,
        accessible: null,
        parking: null,
        terrace: item.terrace ?? null,
        wifi: null,
        kidsMenu: null,
        privateHire: item.privateHire ?? null,
        metroNearby: null,
      },
      hours: hourLinesToRecord(item.hours),
      price: mapPrice(item.averagePrice),
      rating: null,
      reviewCount: 0,
      distanceKm: 0,
      isOpenNow: null,
      openLunch: null,
      openDinner: null,
      openSunday: null,
      openLate: null,
      image: gallery[0] || "/images/food/restaurants-khan.jpg",
      gallery,
      website: normalizeExternalUrl(item.website),
      instagram: normalizeExternalUrl(item.instagram),
      deliverooUrl: item.deliverooUrl,
      uberEatsUrl: item.uberEatsUrl,
      city: item.city || "Paris",
      country: item.country ?? "France",
      nearestMetroName: item.nearestMetroName,
      nearestMetroLine: item.nearestMetroLine,
      tags: uniqueList([
        ...(item.visibleTagIds ?? []),
        ...(item.cuisineTypes ?? []),
        item.kosherType,
        item.certification,
        item.terrace ? "Terrasse" : "",
        item.delivery ? "Livraison" : "",
        item.takeaway ? "À emporter" : "",
        item.reservation ? "Réservation" : "",
        item.sponsored ? "Sponsorisé" : "",
      ]),
      sponsored: item.sponsored,
      sponsorshipLevel: item.sponsorshipLevel,
      fieldVisibility: item.fieldVisibility,
      latitude: Number(item.latitude) || 48.8566,
      longitude: Number(item.longitude) || 2.3522,
      importedAt: item.updatedAt ?? new Date(Date.now() + index).toISOString(),
    };
  });
}

const cuisineMatch = (restaurant: Restaurant, filter: string) => {
  const corpus = normalize(`${restaurant.cuisine} ${restaurant.specialty} ${(restaurant.tags ?? []).join(" ")}`);
  const aliases: Record<string, string[]> = {
    Japonais: ["japon", "japonaise", "sushi"], Italien: ["italien", "italienne", "pizza"], Israélien: ["israel"],
    Français: ["franc"], Indien: ["indien"], Africain: ["afric", "africa", "afrique", "yassa", "mafe", "thieb", "alloko"], Pizzeria: ["pizza"],
    Bassari: ["bassari", "viande"], Halavi: ["halavi", "lait"], Parvé: ["parve", "parvé"],
  };
  return (aliases[filter] ?? [normalize(filter)]).some((term) => corpus.includes(normalize(term)));
};

function matchesSmartFilter(restaurant: Restaurant, filter: string) {
  const normalized = normalize(filter);
  const corpus = normalize([
    restaurant.name,
    restaurant.fullAddress,
    restaurant.arrondissement,
    restaurant.cuisine,
    restaurant.specialty,
    restaurant.type,
    restaurant.certification,
    ...(restaurant.tags ?? []),
  ].join(" "));
  if (cuisineMatch(restaurant, filter)) return true;
  if (corpus.includes(normalized)) return true;
  const serviceMap: Record<string, boolean | null> = {
    "sur place": restaurant.services.dineIn,
    "a emporter": restaurant.services.takeaway,
    "livraison": restaurant.services.delivery,
    "reservation": restaurant.services.reservation,
    "terrasse": restaurant.amenities.terrace,
  };
  return serviceMap[normalized] === true;
}

function FilterSection({ title, options, active, toggle }: { title: string; options: string[]; active: string[]; toggle: (value: string) => void }) {
  return (
    <div className="border-b border-black/[.06] py-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-ink/40">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button key={option} onClick={() => toggle(option)} className={`rounded-full border px-3 py-2 text-xs transition ${active.includes(option) ? "border-ink bg-ink text-white" : "border-black/10 bg-white text-ink/60 hover:border-black/25"}`}>{option}</button>
        ))}
      </div>
    </div>
  );
}

function ItineraryMenu({ restaurant, compact = false, label = "Itinéraire", addressTrigger = false }: { restaurant: Restaurant; compact?: boolean; label?: string; addressTrigger?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  if (!hasMeaningfulAddress(restaurant)) return null;

  const query = buildAddressQuery(restaurant);
  const encoded = encodeURIComponent(query);
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  const wazeUrl = Number.isFinite(restaurant.latitude) && Number.isFinite(restaurant.longitude) && restaurant.latitude !== 48.8566
    ? `https://waze.com/ul?ll=${restaurant.latitude},${restaurant.longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encoded}&navigate=yes`;

  const copyAddress = async () => {
    await navigator.clipboard?.writeText(query);
    setCopied(true);
  };

  return (
    <div className="relative">
      <button
        onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }}
        className={addressTrigger ? "flex items-start gap-2 text-left text-sm leading-6 text-ink/70" : compact ? "flex items-center justify-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-xs font-semibold" : "inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold"}
      >
        {addressTrigger ? <MapPin size={16} className="mt-0.5 shrink-0 text-ink/35" /> : <Navigation size={compact ? 14 : 16} />} {label}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 text-sm shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-cream"><MapPin size={16} /> Ouvrir dans Google Maps</a>
          <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-cream"><Navigation size={16} /> Ouvrir dans Waze</a>
          <button onClick={copyAddress} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-cream"><Copy size={16} /> {copied ? "Adresse copiée" : "Copier l’adresse"}</button>
        </div>
      )}
    </div>
  );
}

function HoursPanel({ restaurant, open, onClose }: { restaurant: Restaurant | null; open: boolean; onClose: () => void }) {
  if (!restaurant) return null;
  const status = getOpenStatus(restaurant);
  return (
    <EntityDrawer open={open} onClose={onClose} title="Horaires">
      <div className="space-y-5 p-6">
        <div className="rounded-3xl bg-white p-5">
          <p className={`text-sm font-semibold ${status.open ? "text-moss" : "text-rose-600"}`}>{status.label}</p>
          <p className="mt-1 text-xs text-ink/45">{restaurant.name}</p>
        </div>
        <div className="overflow-hidden rounded-3xl bg-white">
          {days.map((day, index) => {
            const value = restaurant.hours[day]?.trim();
            const today = index === dayIndex();
            return (
              <div key={day} className={`flex items-center justify-between gap-4 border-b border-black/[.05] px-5 py-4 text-sm last:border-0 ${today ? "bg-sage/70 font-semibold text-moss" : ""}`}>
                <span className="capitalize">{day}</span>
                <span className="text-right text-ink/65">{value || "Horaires non renseignés"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </EntityDrawer>
  );
}

function RestaurantCard({ restaurant, onOpen, onReserve, onHours, onTag }: { restaurant: Restaurant; onOpen: () => void; onReserve: () => void; onHours: () => void; onTag: (tag: string) => void }) {
  const unknown = "À compléter";
  const visibility = { ...publicDefaultFieldVisibility, ...(restaurant.fieldVisibility ?? {}) };
  const entity = { id: `restaurant-${restaurant.id}`, title: restaurant.name, url: `/food/restaurants#${restaurant.id}`, text: `${restaurant.name} · ${restaurant.fullAddress}` };
  const status = getOpenStatus(restaurant);
  const hasType = restaurant.type && restaurant.type !== "À compléter";
  const hasCertification = restaurant.certification && normalize(restaurant.certification) !== "a completer";
  const metroStyle = getMetroLineStyle(restaurant.nearestMetroLine);
  return (
    <article id={restaurant.id} className="group overflow-hidden rounded-[1.75rem] border border-black/[.055] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative aspect-[16/10] overflow-hidden bg-sage">
        <button onClick={onOpen} className="absolute inset-0 size-full text-left" aria-label={`Ouvrir la fiche ${restaurant.name}`}><img src={assetPath(restaurant.image)} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" /></button>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex flex-col items-start gap-2"><span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.08em] text-ink backdrop-blur">{restaurant.cuisine}</span><RecommendationBadge rating={restaurant.rating} reviewCount={restaurant.reviewCount} /></div>
          <LikeButton entity={entity} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
        {visibility.opening_hours !== false && <button onClick={hasMeaningfulHours(restaurant) ? onHours : undefined} className="rounded-full bg-ink/85 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">{hasMeaningfulHours(restaurant) ? (status.open === null ? "Horaires disponibles" : status.label) : "Horaires masqués"}</button>}
          {visibility.reservation !== false && <button onClick={onReserve} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-ink shadow-sm"><CalendarDays size={12} /> Réservation</button>}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><button onClick={onOpen} className="text-left"><h2 className="text-xl font-semibold tracking-[-.035em]">{restaurant.name}</h2></button><p className="mt-1 text-xs text-ink/43">{restaurant.specialty}</p></div>
        </div>
        {visibility.reviews !== false && <div className="mt-3"><CustomerRating rating={restaurant.rating} reviewCount={restaurant.reviewCount} /></div>}
        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px]">
          {hasType && <button onClick={() => onTag(restaurant.type)} className="rounded-full bg-cream px-2.5 py-1.5">{restaurant.type}</button>}
          {visibility.certification !== false && hasCertification && <button onClick={() => onTag(restaurant.certification)} className="rounded-full bg-cream px-2.5 py-1.5">✡ {restaurant.certification}</button>}
          {visibility.price !== false && <span className="rounded-full bg-cream px-2.5 py-1.5">{restaurant.price}</span>}
          {visibility.tags !== false && (restaurant.tags ?? []).slice(0, 4).map((tag) => (
            <button key={tag} onClick={() => onTag(tag)} className="rounded-full bg-sage px-2.5 py-1.5 text-moss">{tag}</button>
          ))}
        </div>
        {visibility.address !== false && hasMeaningfulAddress(restaurant) && <button onClick={onOpen} className="mt-4 flex items-start gap-2 text-left text-xs leading-5 text-ink/52"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{restaurant.fullAddress}, {restaurant.postalCode}<br />{restaurant.city ?? "Paris"} {restaurant.arrondissement ? <><sup>{restaurant.arrondissement}e</sup> · </> : null}{restaurant.distanceKm} km</span></button>}
        {restaurant.nearestMetroName && (
          <button onClick={onOpen} className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink/50">
            <span className="truncate">Métro {restaurant.nearestMetroName}</span>
            {metroStyle && (
              <span
                className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border px-1 text-[10px] font-black"
                style={{ backgroundColor: metroStyle.background, color: metroStyle.foreground, borderColor: metroStyle.border }}
              >
                {metroStyle.label}
              </span>
            )}
          </button>
        )}
        <div className="mt-4 flex gap-2 border-t border-black/[.06] pt-4">
          {[
            { value: restaurant.services.dineIn, label: "Sur place", icon: Store },
            { value: visibility.takeaway === false ? false : restaurant.services.takeaway, label: "À emporter", icon: UtensilsCrossed },
            { value: visibility.delivery === false ? false : restaurant.services.delivery, label: "Livraison", icon: Car },
          ].map(({ value, label, icon: Icon }) => <span key={label} title={value === null ? unknown : label} className={`flex items-center gap-1 text-[10px] ${value ? "text-moss" : "text-ink/25"}`}><Icon size={13} />{label}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {visibility.phone !== false && restaurant.phone && <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-white"><Phone size={14} /> Appeler</a>}
          {visibility.map !== false && <ItineraryMenu restaurant={restaurant} compact />}
        </div>
        <div className="mt-2 flex items-center justify-center gap-1">
          {visibility.website !== false && restaurant.website && <a href={restaurant.website} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full text-ink/35 transition hover:bg-cream hover:text-ink" aria-label="Site internet"><Globe2 size={14} /></a>}
          {visibility.instagram !== false && restaurant.instagram && <a href={restaurant.instagram} target="_blank" rel="noreferrer" className="grid size-8 place-items-center rounded-full text-ink/35 transition hover:bg-cream hover:text-ink" aria-label="Instagram"><Instagram size={14} /></a>}
          <DeliveryPlatformButtons
            name={restaurant.name}
            city={restaurant.city}
            deliverooUrl={restaurant.deliverooUrl}
            uberEatsUrl={restaurant.uberEatsUrl}
            showDeliveroo={visibility.deliveroo !== false}
            showUberEats={visibility.ubereats !== false}
            compact
          />
          <ShareButton entity={entity} compact />
        </div>
      </div>
    </article>
  );
}

export function RestaurantExplorer({ initialRestaurants }: { initialRestaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState("Les plus proches");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [detailRestaurant, setDetailRestaurant] = useState<Restaurant | null>(null);
  const [reservationRestaurant, setReservationRestaurant] = useState<Restaurant | null>(null);
  const [hoursRestaurant, setHoursRestaurant] = useState<Restaurant | null>(null);
  const [restaurantData, setRestaurantData] = useState(initialRestaurants);

  useEffect(() => {
    let mounted = true;
    const loadAdminRestaurants = async () => {
      const supabaseRestaurants = await listPublishedEstablishments({ rubricSlug: "food", subrubricSlug: "restaurants" }).catch(() => null);
      if (!mounted) return;
      if (supabaseRestaurants?.length) {
        setRestaurantData(establishmentRecordsToRestaurants(supabaseRestaurants));
        return;
      }
      setRestaurantData(initialRestaurants);
    };

    void loadAdminRestaurants();
    const refresh = () => void loadAdminRestaurants();
    window.addEventListener("storage", refresh);
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, [initialRestaurants]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setRestaurantData((current) => current.map((restaurant) => ({
        ...restaurant,
        distanceKm: Number(distanceBetween(coords.latitude, coords.longitude, restaurant.latitude, restaurant.longitude).toFixed(1)),
      })));
    }, () => undefined, { maximumAge: 300000, timeout: 5000 });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cuisineParam = params.get("cuisine");
    if (cuisineParam) {
      const formatted = cuisineParam.charAt(0).toUpperCase() + cuisineParam.slice(1);
      setFilters((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
    }
    const qParam = params.get("q") || params.get("search");
    if (qParam) {
      setQuery(qParam);
    }
  }, []);

  const toggleFilter = (filter: string) => setFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  const applyTagFilter = (tag: string) => {
    setDetailRestaurant(null);
    setView("list");
    setFilters([tag]);
    setQuery("");
    window.requestAnimationFrame(() => document.getElementById("restaurant-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const results = useMemo(() => {
    const search = normalize(query);
    const filtered = restaurantData.filter((restaurant) => {
      const corpus = normalize(`${restaurant.name} ${restaurant.fullAddress} ${restaurant.arrondissement} ${restaurant.cuisine} ${restaurant.specialty} ${(restaurant.tags ?? []).join(" ")}`);
      if (search && !corpus.includes(search)) return false;
      const cuisineSelected = filters.filter((filter) => cuisineFilters.includes(filter));
      if (cuisineSelected.length && !cuisineSelected.some((filter) => cuisineMatch(restaurant, filter))) return false;
      const typesSelected = filters.filter((filter) => typeFilters.includes(filter));
      if (typesSelected.length && !typesSelected.includes(restaurant.type)) return false;
      const services: Record<string, boolean | null> = {
        "Sur place": restaurant.services.dineIn, "À emporter": restaurant.services.takeaway,
        "Livraison": restaurant.services.delivery, "Click & Collect": restaurant.services.clickAndCollect,
        "Réservation en ligne": restaurant.services.reservation,
      };
      if (filters.filter((filter) => serviceFilters.includes(filter)).some((filter) => services[filter] !== true)) return false;

      // Calcul dynamique basé sur les horaires Google Business
      const openStatus = getOpenStatus(restaurant);
      const isCurrentlyOpen = openStatus.open === true;

      const hasLunch = restaurant.openLunch === true || Object.values(restaurant.hours).some((h) => {
        const norm = normalize(h);
        return !norm.includes("ferme") && !norm.includes("a completer") && /1[1-4][:h]/i.test(h);
      });

      const hasDinner = restaurant.openDinner === true || Object.values(restaurant.hours).some((h) => {
        const norm = normalize(h);
        return !norm.includes("ferme") && !norm.includes("a completer") && (/1[89][:h]/i.test(h) || /2[0-3][:h]/i.test(h));
      });

      const hasSunday = Boolean(restaurant.hours.dimanche?.trim()) && !normalize(restaurant.hours.dimanche).includes("ferme") && !normalize(restaurant.hours.dimanche).includes("a completer");

      const hasLate = restaurant.openLate === true || Object.values(restaurant.hours).some((h) => {
        const norm = normalize(h);
        return !norm.includes("ferme") && !norm.includes("a completer") && (/2[3-4][:h]/i.test(h) || /0[0-2][:h]/i.test(h));
      });

      const availability: Record<string, boolean | null> = {
        "Ouvert maintenant": isCurrentlyOpen,
        "Ouvert le midi": hasLunch,
        "Ouvert le soir": hasDinner,
        "Ouvert le dimanche": hasSunday,
        "Ouvert tard": hasLate,
      };
      if (filters.filter((filter) => availabilityFilters.includes(filter)).some((filter) => availability[filter] !== true)) return false;

      const comfort: Record<string, boolean | null> = {
        "Adapté aux familles": restaurant.amenities.familyFriendly, "Terrasse": restaurant.amenities.terrace,
        "Wifi": restaurant.amenities.wifi, "Menu enfant": restaurant.amenities.kidsMenu, "Privatisation": restaurant.amenities.privateHire,
      };
      if (filters.filter((filter) => comfortFilters.includes(filter)).some((filter) => comfort[filter] !== true)) return false;

      if (filters.includes("À moins de 2 km") && restaurant.distanceKm >= 2) return false;
      if (filters.includes("À moins de 5 km") && restaurant.distanceKm >= 5) return false;
      if (filters.includes("À moins de 10 km") && restaurant.distanceKm >= 10) return false;

      const knownFilters = new Set([...cuisineFilters, ...typeFilters, ...serviceFilters, ...availabilityFilters, ...comfortFilters, ...locationFilters]);
      const smartFilters = filters.filter((filter) => !knownFilters.has(filter));
      if (smartFilters.length && !smartFilters.every((filter) => matchesSmartFilter(restaurant, filter))) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "Ordre alphabétique") return a.name.localeCompare(b.name, "fr");
      if (sort === "Les mieux notés") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "Les plus populaires") return b.reviewCount - a.reviewCount;
      if (sort === "Les nouveautés") return b.importedAt.localeCompare(a.importedAt);
      return a.distanceKm - b.distanceKm;
    });
  }, [restaurantData, query, filters, sort]);

  const mapItems = useMemo<MapEstablishment[]>(() => results.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.fullAddress,
    arrondissement: r.arrondissement,
    latitude: r.latitude,
    longitude: r.longitude,
    image: r.image,
    cuisine: r.cuisine,
    specialty: r.specialty,
    price: r.price,
    kosherType: r.type,
    phone: r.phone,
    distanceKm: r.distanceKm,
    href: `/food/restaurants#${r.id}`,
  })), [results]);

  return (
    <>
      <section className="page-shell pt-6">
        <div className="rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">Food · Sous-rubrique</p>
          <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Restaurants casher</h1>
              <p className="mt-1 text-sm text-ink/45">{results.length} adresses sélectionnées à Paris</p>
            </div>
            <div className="flex w-full max-w-2xl items-center rounded-2xl bg-cream p-2">
              <Search size={18} className="ml-3 shrink-0 text-ink/30" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, adresse, spécialité, arrondissement…" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
              {query && <button onClick={() => setQuery("")} className="grid size-9 place-items-center rounded-full hover:bg-white"><X size={15} /></button>}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold lg:hidden">
              <SlidersHorizontal size={14} /> Filtres {filters.length ? `(${filters.length})` : ""}
            </button>
            <div className="flex rounded-xl bg-white p-1 shadow-sm">
              <button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${view === "list" ? "bg-ink text-white" : "text-ink/45"}`}>
                <List size={14} /> Liste
              </button>
              <button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${view === "map" ? "bg-ink text-white" : "text-ink/45"}`}>
                <MapIcon size={14} /> Carte
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs shadow-sm">
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent font-medium outline-none">
              {["Les plus proches", "Les mieux notés", "Les plus populaires", "Les nouveautés", "Ordre alphabétique"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={13} className="text-ink/40" />
          </label>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="grid items-start gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_450px]">
          <aside className={`${showFilters ? "fixed inset-0 z-[70] overflow-y-auto bg-cream p-6" : "hidden"} lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-[1.75rem] lg:bg-white lg:p-5`}>
            <div className="flex items-center justify-between"><p className="font-semibold">Filtres</p><div className="flex items-center gap-3">{filters.length > 0 && <button onClick={() => setFilters([])} className="text-[11px] font-semibold text-moss">Tout effacer</button>}<button onClick={() => setShowFilters(false)} className="lg:hidden"><X size={19} /></button></div></div>
            <FilterSection title="Localisation" options={locationFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Cuisine" options={cuisineFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Type" options={typeFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Services" options={serviceFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Disponibilité" options={availabilityFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Confort" options={comfortFilters} active={filters} toggle={toggleFilter} />
            <button onClick={() => setShowFilters(false)} className="sticky bottom-3 mt-5 w-full rounded-xl bg-ink py-3 text-xs font-semibold text-white lg:hidden">Voir {results.length} résultats</button>
          </aside>

          <div id="restaurant-results" className={view === "map" ? "hidden xl:block" : ""}>
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">{results.length} restaurant{results.length > 1 ? "s" : ""}</p>{filters.length > 0 && <span className="text-xs text-ink/40">{filters.length} filtre{filters.length > 1 ? "s" : ""} actif{filters.length > 1 ? "s" : ""}</span>}</div>
            {results.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{results.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onOpen={() => setDetailRestaurant(restaurant)}
                onReserve={() => setReservationRestaurant(restaurant)}
                onHours={() => setHoursRestaurant(restaurant)}
                onTag={applyTagFilter}
              />
            ))}</div> : <div className="grid min-h-80 place-items-center rounded-[2rem] bg-white text-center"><div><Search className="mx-auto text-ink/20" size={30} /><p className="mt-4 font-semibold">Aucun résultat</p><button onClick={() => { setFilters([]); setQuery(""); }} className="mt-3 text-xs font-semibold text-moss">Réinitialiser la recherche</button></div></div>}
          </div>

          <div className={`${view === "map" ? "block lg:col-span-1 xl:col-span-1" : "hidden xl:block"}`}>
            <div className="sticky top-24">
              <InteractiveMap
                items={mapItems}
                selectedItem={selected ? mapItems.find((m) => m.id === selected.id) ?? null : null}
                onSelect={(item) => setSelected(item ? restaurantData.find((r) => r.id === item.id) ?? null : null)}
                onOpenDetail={(item) => {
                  const found = restaurantData.find((r) => r.id === item.id);
                  if (found) setDetailRestaurant(found);
                }}
                onUserLocationChange={({ latitude, longitude }) => {
                  setRestaurantData((current) => current.map((r) => ({
                    ...r,
                    distanceKm: Number(distanceBetween(latitude, longitude, r.latitude, r.longitude).toFixed(1)),
                  })));
                }}
                className="h-[calc(100vh-7rem)] min-h-[560px]"
              />
            </div>
          </div>
        </div>
      </section>
      <EstablishmentDetailDrawer
        establishment={detailRestaurant ? restaurantToEstablishmentRecord(detailRestaurant) : null}
        open={!!detailRestaurant}
        onClose={() => setDetailRestaurant(null)}
        onReserve={() => detailRestaurant && setReservationRestaurant(detailRestaurant)}
        onTag={applyTagFilter}
      />
      <HoursPanel restaurant={hoursRestaurant} open={!!hoursRestaurant} onClose={() => setHoursRestaurant(null)} />
      <EntityDrawer open={!!reservationRestaurant} onClose={() => setReservationRestaurant(null)} title="Demande de réservation">
        {reservationRestaurant && <ReservationForm restaurant={reservationRestaurant} onDone={() => setReservationRestaurant(null)} />}
      </EntityDrawer>
    </>
  );
}
