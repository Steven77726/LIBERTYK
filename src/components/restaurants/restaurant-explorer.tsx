"use client";

import {
  ArrowUpRight, CalendarDays, Car, ChevronDown, ChevronLeft, ChevronRight, Clock,
  Copy, ExternalLink, Filter, Globe2, Instagram, List, Mail, Map as MapIcon,
  MapPin, MessageCircle, Navigation, Phone, Search, SlidersHorizontal,
  Store, UtensilsCrossed, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "@/types/restaurant";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { ReservationForm } from "@/components/restaurants/reservation-form";
import { assetPath } from "@/lib/assets";
import { EntityActions, LikeButton, ReviewButton, ShareButton } from "@/components/ui/entity-actions";
import { loadAdminStateFromSupabase } from "@/lib/supabase/admin-state";

const cuisineFilters = ["Burgers", "Japonais", "Italien", "Grillades", "Israélien", "Français", "Oriental", "Tunisien", "Marocain", "Asiatique", "Indien", "Pizzeria", "Sandwicherie", "Salon de thé", "Brunch", "Pâtisserie", "Bar à vin", "Cocktails"];
const typeFilters = ["Viande", "Lait", "Parvé"];
const serviceFilters = ["Sur place", "À emporter", "Livraison", "Click & Collect", "Réservation en ligne"];
const availabilityFilters = ["Ouvert maintenant", "Ouvert le midi", "Ouvert le soir", "Ouvert le dimanche", "Ouvert tard"];
const budgetFilters = ["Moins de 20 €", "20 € à 40 €", "40 € à 70 €", "Plus de 70 €"];
const comfortFilters = ["Adapté aux familles", "Terrasse", "Wifi", "Menu enfant", "Privatisation"];
const accessibilityFilters = ["Accessible PMR", "Parking", "Métro à moins de 500 mètres"];
const locationFilters = ["À moins de 2 km", "À moins de 5 km", "À moins de 10 km", "Les plus proches"];
const publicDefaultFieldVisibility: Record<string, boolean> = {
  phone: true,
  whatsapp: true,
  instagram: true,
  website: true,
  email: true,
  reservation: true,
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
const distanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

type AdminStateRestaurantsPreview = {
  rubrics?: Array<{ id: string; slug?: string; name: string }>;
  subrubrics?: Array<{ id: string; rubricId: string; slug?: string; name: string }>;
  tags?: Array<{ id: string; label: string; status?: string }>;
  establishments?: Array<{
    id: string;
    rubricId: string;
    subrubricId: string;
    mainPhoto?: string;
    photos?: string[];
    name: string;
    description?: string;
    address?: string;
    city?: string;
    arrondissement?: string;
    postalCode?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    website?: string;
    instagram?: string;
    hours?: string;
    terrace?: boolean;
    delivery?: boolean;
    takeaway?: boolean;
    reservation?: boolean;
    privateHire?: boolean;
    certification?: string;
    kosherType?: string;
    averagePrice?: string;
    latitude?: string;
    longitude?: string;
    status: string;
    visible?: boolean;
    cuisineTypes?: string[];
    customerSearches?: string[];
    visibleTagIds?: string[];
    sponsored?: boolean;
    sponsorshipLevel?: string;
    fieldVisibility?: Record<string, boolean>;
    order?: number;
  }>;
};

const ADMIN_STORAGE_KEY = "liberty-admin-dashboard-v1";

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

function getOpenStatus(restaurant: Restaurant) {
  const today = days[dayIndex()];
  const yesterday = days[(dayIndex() + 6) % 7];
  const text = restaurant.hours[today] ?? "";
  const normalized = normalize(text);
  if (!hasMeaningfulHours(restaurant)) return { label: "Horaires non renseignés", open: null as boolean | null };

  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpenForText = (hoursText: string, previousDay = false) => {
    if (!hoursText || normalize(hoursText).includes("ferme")) return false;
    const ranges = hoursText.match(/\d{1,2}[:h]\d{2}\s*[–-]\s*\d{1,2}[:h]\d{2}/g) ?? [];
    return ranges.some((range) => {
    const [start, end] = range.split(/[–-]/).map((part) => part.trim().replace("h", ":"));
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute + (previousDay ? -24 * 60 : 0);
    let endMinutes = endHour * 60 + endMinute + (previousDay ? -24 * 60 : 0);
    let current = nowMinutes;
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }
    return current >= startMinutes && current <= endMinutes;
  });
  };
  const todayRanges = text.match(/\d{1,2}[:h]\d{2}\s*[–-]\s*\d{1,2}[:h]\d{2}/g) ?? [];
  const isOpen = isOpenForText(text) || isOpenForText(restaurant.hours[yesterday] ?? "", true);
  if (!todayRanges.length && normalized && !normalized.includes("ferme")) return { label: "Horaires disponibles", open: null as boolean | null };
  return { label: isOpen ? "Ouvert maintenant" : "Fermé actuellement", open: isOpen };
}

function adminStateToRestaurants(state: AdminStateRestaurantsPreview | null | undefined): Restaurant[] {
  if (!state?.establishments?.length) return [];
  const rubrics = new Map((state.rubrics ?? []).map((rubric) => [rubric.id, rubric]));
  const subrubrics = new Map((state.subrubrics ?? []).map((subrubric) => [subrubric.id, subrubric]));
  const tags = new Map((state.tags ?? []).filter((tag) => tag.status !== "Masqué").map((tag) => [tag.id, tag.label]));

  return state.establishments
    .filter((item) => {
      if (item.status !== "Publié" || item.visible === false) return false;
      const rubric = rubrics.get(item.rubricId);
      const subrubric = subrubrics.get(item.subrubricId);
      const rubricKey = normalize(`${item.rubricId} ${rubric?.slug ?? ""} ${rubric?.name ?? ""}`);
      const subrubricKey = normalize(`${item.subrubricId} ${subrubric?.slug ?? ""} ${subrubric?.name ?? ""}`);
      return rubricKey.includes("food") && (subrubricKey.includes("restaurant") || item.subrubricId === "food-restaurants");
    })
    .map((item, index) => {
      const arrondissement = parseArrondissement(item.arrondissement);
      const postalCode = item.postalCode || (arrondissement ? `750${String(arrondissement).padStart(2, "0")}` : "");
      const cuisine = item.cuisineTypes?.length ? item.cuisineTypes.join(", ") : item.kosherType || "Restaurant casher";
      const specialty = item.customerSearches?.length ? item.customerSearches.slice(0, 4).join(", ") : item.description || "Restaurant casher";
      const gallery = uniqueList([item.mainPhoto, ...(item.photos ?? [])]);
      const visibleTags = (item.visibleTagIds ?? []).map((id) => tags.get(id)).filter(Boolean) as string[];
      const smartTags = uniqueList([
        ...visibleTags,
        ...(item.cuisineTypes ?? []),
        item.kosherType,
        item.certification,
        item.terrace ? "Terrasse" : "",
        item.delivery ? "Livraison" : "",
        item.takeaway ? "À emporter" : "",
        item.reservation ? "Réservation" : "",
        item.sponsored ? "Sponsorisé" : "",
      ]);
      return {
        id: item.id || slugify(`${item.name}-${item.address ?? ""}`),
        name: item.name,
        fullAddress: item.address || "",
        postalCode,
        arrondissement,
        phone: item.phone || "",
        whatsapp: item.whatsapp,
        email: item.email,
        specialty,
        cuisine,
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
        city: item.city || "Paris",
        country: "France",
        tags: smartTags,
        sponsored: item.sponsored,
        sponsorshipLevel: item.sponsorshipLevel,
        fieldVisibility: { ...publicDefaultFieldVisibility, ...(item.fieldVisibility ?? {}) },
        latitude: Number(item.latitude) || 48.8566,
        longitude: Number(item.longitude) || 2.3522,
        importedAt: new Date(Date.now() + index).toISOString(),
      };
    });
}

function mergeRestaurants(base: Restaurant[], adminRestaurants: Restaurant[]) {
  const merged = new Map<string, Restaurant>();
  [...base.map((restaurant) => ({
    ...restaurant,
    gallery: restaurant.gallery?.length ? restaurant.gallery : [restaurant.image].filter(Boolean),
    website: normalizeExternalUrl(restaurant.website),
    instagram: normalizeExternalUrl(restaurant.instagram),
    city: restaurant.city ?? "Paris",
    country: restaurant.country ?? "France",
    tags: uniqueList([
      ...(restaurant.tags ?? []),
      restaurant.cuisine,
      restaurant.type,
      restaurant.certification,
      restaurant.services.delivery ? "Livraison" : "",
      restaurant.services.takeaway ? "À emporter" : "",
      restaurant.amenities.terrace ? "Terrasse" : "",
      restaurant.services.reservation ? "Réservation" : "",
    ]),
  })), ...adminRestaurants].forEach((restaurant) => {
    const key = normalize(`${restaurant.name}-${restaurant.fullAddress}`);
    const existing = merged.get(key);
    if (!existing || restaurant.importedAt >= existing.importedAt) merged.set(key, restaurant);
  });
  return [...merged.values()];
}
const cuisineMatch = (restaurant: Restaurant, filter: string) => {
  const corpus = normalize(`${restaurant.cuisine} ${restaurant.specialty} ${(restaurant.tags ?? []).join(" ")}`);
  const aliases: Record<string, string[]> = {
    Japonais: ["japon", "japonaise", "sushi"], Italien: ["italien", "italienne", "pizza"], Israélien: ["israel"],
    Français: ["franc"], Indien: ["indien"], Pizzeria: ["pizza"],
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

function PhotoGallery({ restaurant }: { restaurant: Restaurant }) {
  const images = uniqueList(restaurant.gallery?.length ? restaurant.gallery : [restaurant.image]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  if (!images.length) return null;

  const move = (delta: number) => setIndex((current) => (current + delta + images.length) % images.length);
  const current = images[index] ?? images[0];

  return (
    <>
      <div className="grid gap-2">
        <button onClick={() => setOpen(true)} className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-sage text-left">
          <img src={assetPath(images[0])} alt="" className="size-full object-cover" />
          <span className="absolute bottom-4 right-4 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{images.length} photo{images.length > 1 ? "s" : ""}</span>
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
            <div
              className="max-h-full max-w-5xl"
              onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
              onTouchEnd={(event) => {
                if (touchStart === null) return;
                const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
                if (Math.abs(delta) > 40) move(delta > 0 ? -1 : 1);
                setTouchStart(null);
              }}
            >
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
  return (
    <article id={restaurant.id} className="group overflow-hidden rounded-[1.75rem] border border-black/[.055] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative aspect-[16/10] overflow-hidden bg-sage">
        <button onClick={onOpen} className="absolute inset-0 size-full text-left" aria-label={`Ouvrir la fiche ${restaurant.name}`}><img src={assetPath(restaurant.image)} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" /></button>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex flex-col items-start gap-2"><span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.08em] text-ink backdrop-blur">{restaurant.cuisine}</span><RecommendationBadge rating={restaurant.rating} reviewCount={restaurant.reviewCount} /></div>
          <LikeButton entity={entity} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
          <button onClick={hasMeaningfulHours(restaurant) ? onHours : undefined} className="rounded-full bg-ink/85 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">{hasMeaningfulHours(restaurant) ? (status.open === null ? "Horaires disponibles" : status.label) : "Horaires non renseignés"}</button>
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
          {(restaurant.tags ?? []).slice(0, 4).map((tag) => (
            <button key={tag} onClick={() => onTag(tag)} className="rounded-full bg-sage px-2.5 py-1.5 text-moss">{tag}</button>
          ))}
        </div>
        {hasMeaningfulAddress(restaurant) && <button onClick={onOpen} className="mt-4 flex items-start gap-2 text-left text-xs leading-5 text-ink/52"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{restaurant.fullAddress}, {restaurant.postalCode}<br />{restaurant.city ?? "Paris"} {restaurant.arrondissement ? <><sup>{restaurant.arrondissement}e</sup> · </> : null}{restaurant.distanceKm} km</span></button>}
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
          <ShareButton entity={entity} compact />
          <ReviewButton entity={entity} compact />
        </div>
      </div>
    </article>
  );
}

function RestaurantMap({ restaurants, selected, onSelect }: { restaurants: Restaurant[]; selected: Restaurant | null; onSelect: (restaurant: Restaurant) => void }) {
  return (
    <div className="sticky top-24 h-[calc(100vh-7rem)] min-h-[560px] overflow-hidden rounded-[2rem] bg-[#dfe6df]">
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(32deg,transparent 46%,#fff 47%,#fff 51%,transparent 52%),linear-gradient(104deg,transparent 46%,#fff 47%,#fff 50%,transparent 51%)", backgroundSize: "110px 90px" }} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,transparent_0,transparent_20%,rgba(31,77,59,.08)_70%)]" />
      <div className="absolute left-5 top-5 rounded-2xl bg-white/90 px-4 py-3 shadow-soft backdrop-blur"><p className="text-xs font-semibold">Paris</p><p className="mt-0.5 text-[10px] text-ink/40">{restaurants.length} adresses visibles</p></div>
      {restaurants.map((restaurant, index) => {
        const left = 10 + ((restaurant.longitude - 2.31) / 0.13) * 80;
        const top = 12 + ((48.9 - restaurant.latitude) / 0.09) * 72;
        return <button key={restaurant.id} onClick={() => onSelect(restaurant)} style={{ left: `${Math.max(7, Math.min(91, left))}%`, top: `${Math.max(10, Math.min(88, top))}%` }} className={`absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-lg transition hover:z-10 hover:scale-125 ${selected?.id === restaurant.id ? "z-10 scale-125 bg-gold" : "bg-moss"}`} aria-label={`Voir ${restaurant.name}`}>{index + 1}</button>;
      })}
      {selected && <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white p-4 shadow-2xl"><button onClick={() => onSelect(selected)} className="absolute right-3 top-3 text-ink/30"><X size={15} /></button><p className="pr-8 font-semibold">{selected.name}</p><p className="mt-1 text-xs text-ink/45">{selected.fullAddress} · {selected.distanceKm} km</p><a href={`#${selected.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-moss">Voir la fiche <ArrowUpRight size={13} /></a></div>}
    </div>
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
      let localState: AdminStateRestaurantsPreview | null = null;
      try {
        const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
        localState = raw ? JSON.parse(raw) as AdminStateRestaurantsPreview : null;
      } catch {
        localState = null;
      }

      const remoteState = await loadAdminStateFromSupabase<AdminStateRestaurantsPreview>();
      if (!mounted) return;
      const adminRestaurants = adminStateToRestaurants(remoteState ?? localState);
      setRestaurantData(mergeRestaurants(initialRestaurants, adminRestaurants));
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
    let filtered = restaurantData.filter((restaurant) => {
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
      const availability: Record<string, boolean | null> = {
        "Ouvert maintenant": restaurant.isOpenNow, "Ouvert le midi": restaurant.openLunch,
        "Ouvert le soir": restaurant.openDinner, "Ouvert le dimanche": restaurant.openSunday, "Ouvert tard": restaurant.openLate,
      };
      if (filters.filter((filter) => availabilityFilters.includes(filter)).some((filter) => availability[filter] !== true)) return false;
      if (filters.includes("Ouvert le dimanche") && !restaurant.hours.dimanche?.trim()) return false;
      const comfort: Record<string, boolean | null> = {
        "Adapté aux familles": restaurant.amenities.familyFriendly, "Terrasse": restaurant.amenities.terrace,
        "Wifi": restaurant.amenities.wifi, "Menu enfant": restaurant.amenities.kidsMenu, "Privatisation": restaurant.amenities.privateHire,
      };
      if (filters.filter((filter) => comfortFilters.includes(filter)).some((filter) => comfort[filter] !== true)) return false;
      const accessibility: Record<string, boolean | null> = {
        "Accessible PMR": restaurant.amenities.accessible, "Parking": restaurant.amenities.parking,
        "Métro à moins de 500 mètres": restaurant.amenities.metroNearby,
      };
      if (filters.filter((filter) => accessibilityFilters.includes(filter)).some((filter) => accessibility[filter] !== true)) return false;
      const budgetSelected = filters.filter((filter) => budgetFilters.includes(filter));
      if (budgetSelected.length) {
        const priceBucket: Record<string, string> = { "€": "Moins de 20 €", "€€": "20 € à 40 €", "€€€": "40 € à 70 €" };
        if (!budgetSelected.includes(priceBucket[restaurant.price] ?? "")) return false;
      }
      if (filters.includes("À moins de 2 km") && restaurant.distanceKm >= 2) return false;
      if (filters.includes("À moins de 5 km") && restaurant.distanceKm >= 5) return false;
      if (filters.includes("À moins de 10 km") && restaurant.distanceKm >= 10) return false;
      const knownFilters = new Set([...cuisineFilters, ...typeFilters, ...serviceFilters, ...availabilityFilters, ...budgetFilters, ...comfortFilters, ...accessibilityFilters, ...locationFilters]);
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

  return (
    <>
      <section className="page-shell pt-6">
        <div className="rounded-[2rem] bg-ink px-6 py-10 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Food · Paris</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Restaurants casher</h1>
          <p className="mt-3 text-sm text-white/45">{restaurantData.length} adresse{restaurantData.length > 1 ? "s" : ""} disponible{restaurantData.length > 1 ? "s" : ""} · Données Admin incluses</p>
          <div className="mt-7 flex max-w-3xl items-center rounded-2xl bg-white p-2 text-ink shadow-2xl">
            <Search size={19} className="ml-3 shrink-0 text-ink/30" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, adresse, arrondissement, cuisine…" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
            {query && <button onClick={() => setQuery("")} className="grid size-9 place-items-center rounded-full hover:bg-cream"><X size={15} /></button>}
          </div>
        </div>
      </section>

      <section className="page-shell py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-xs font-semibold lg:hidden"><Filter size={15} /> Filtres {filters.length > 0 && `(${filters.length})`}</button>
            <div className="flex rounded-xl bg-white p-1">
              <button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${view === "list" ? "bg-ink text-white" : "text-ink/45"}`}><List size={14} /> Liste</button>
              <button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${view === "map" ? "bg-ink text-white" : "text-ink/45"}`}><MapIcon size={14} /> Carte</button>
            </div>
          </div>
          <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs"><SlidersHorizontal size={14} className="text-ink/40" /><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent font-medium outline-none">{["Les plus proches", "Les mieux notés", "Les plus populaires", "Les nouveautés", "Ordre alphabétique"].map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={13} /></label>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="grid items-start gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[270px_1fr_460px]">
          <aside className={`${showFilters ? "fixed inset-0 z-[70] overflow-y-auto bg-cream p-6" : "hidden"} lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-[1.75rem] lg:bg-white lg:p-5`}>
            <div className="flex items-center justify-between"><p className="font-semibold">Filtres</p><div className="flex items-center gap-3">{filters.length > 0 && <button onClick={() => setFilters([])} className="text-[11px] font-semibold text-moss">Tout effacer</button>}<button onClick={() => setShowFilters(false)} className="lg:hidden"><X size={19} /></button></div></div>
            <FilterSection title="Localisation" options={locationFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Cuisine" options={cuisineFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Type" options={typeFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Services" options={serviceFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Disponibilité" options={availabilityFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Budget" options={budgetFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Confort" options={comfortFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Accessibilité" options={accessibilityFilters} active={filters} toggle={toggleFilter} />
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

          <div className={`${view === "map" ? "block lg:col-span-1 xl:col-span-1" : "hidden xl:block"}`}><RestaurantMap restaurants={results} selected={selected} onSelect={(restaurant) => setSelected(selected?.id === restaurant.id ? null : restaurant)} /></div>
        </div>
      </section>
      <EntityDrawer open={!!detailRestaurant} onClose={() => setDetailRestaurant(null)} title={detailRestaurant?.name ?? "Restaurant"}>
        {detailRestaurant && (() => {
          const visibility = { ...publicDefaultFieldVisibility, ...(detailRestaurant.fieldVisibility ?? {}) };
          const entity = { id: `restaurant-${detailRestaurant.id}`, title: detailRestaurant.name, url: `/food/restaurants#${detailRestaurant.id}`, text: `${detailRestaurant.name} · ${detailRestaurant.fullAddress}` };
          return (
            <div>
              <div className="space-y-5 p-6">
                <PhotoGallery restaurant={detailRestaurant} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{detailRestaurant.cuisine}</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">{detailRestaurant.name}</h2>
                </div>
                {visibility.reviews !== false && <CustomerRating rating={detailRestaurant.rating} reviewCount={detailRestaurant.reviewCount} />}
                <EntityActions entity={entity} />
                <div className="flex flex-wrap gap-2 text-xs">
                  {detailRestaurant.type !== "À compléter" && <button onClick={() => applyTagFilter(detailRestaurant.type)} className="rounded-full bg-sage px-3 py-2 text-moss">{detailRestaurant.type}</button>}
                  {visibility.certification !== false && detailRestaurant.certification && normalize(detailRestaurant.certification) !== "a completer" && <button onClick={() => applyTagFilter(detailRestaurant.certification)} className="rounded-full bg-white px-3 py-2">✡ {detailRestaurant.certification}</button>}
                  {visibility.price !== false && <span className="rounded-full bg-white px-3 py-2">{detailRestaurant.price}</span>}
                  {(detailRestaurant.tags ?? []).map((tag) => (
                    <button key={tag} onClick={() => applyTagFilter(tag)} className="rounded-full bg-white px-3 py-2 transition hover:bg-sage hover:text-moss">{tag}</button>
                  ))}
                </div>
                {hasMeaningfulAddress(detailRestaurant) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Adresse</p>
                    <div className="mt-2">
                      <ItineraryMenu restaurant={detailRestaurant} addressTrigger label={`${detailRestaurant.fullAddress}, ${detailRestaurant.postalCode} ${detailRestaurant.city ?? "Paris"}`} />
                    </div>
                    <div className="mt-3"><ItineraryMenu restaurant={detailRestaurant} /></div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Horaires</p>
                  {hasMeaningfulHours(detailRestaurant) ? (
                    <button onClick={() => setHoursRestaurant(detailRestaurant)} className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold"><Clock size={16} /> Horaires disponibles</button>
                  ) : (
                    <p className="mt-2 text-sm text-ink/45">Horaires non renseignés</p>
                  )}
                </div>
                <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Spécialité</p><p className="mt-2 text-sm leading-6 text-ink/60">{detailRestaurant.specialty}</p></div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {visibility.phone !== false && detailRestaurant.phone && <a href={`tel:${detailRestaurant.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white"><Phone size={15} /> Téléphone</a>}
                  {visibility.whatsapp !== false && detailRestaurant.whatsapp && <a href={`https://wa.me/${detailRestaurant.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><MessageCircle size={15} /> WhatsApp</a>}
                  {visibility.email !== false && detailRestaurant.email && <a href={`mailto:${detailRestaurant.email}`} className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><Mail size={15} /> Email</a>}
                  {visibility.website !== false && detailRestaurant.website && <a href={normalizeExternalUrl(detailRestaurant.website)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><ExternalLink size={15} /> Site web</a>}
                  {visibility.instagram !== false && detailRestaurant.instagram && <a href={normalizeExternalUrl(detailRestaurant.instagram)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-semibold"><Instagram size={15} /> Instagram</a>}
                  {visibility.reservation !== false && <button onClick={() => setReservationRestaurant(detailRestaurant)} className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-sm font-semibold text-white"><CalendarDays size={16} /> Réservation</button>}
                </div>
              </div>
            </div>
          );
        })()}
      </EntityDrawer>
      <HoursPanel restaurant={hoursRestaurant} open={!!hoursRestaurant} onClose={() => setHoursRestaurant(null)} />
      <EntityDrawer open={!!reservationRestaurant} onClose={() => setReservationRestaurant(null)} title="Demande de réservation">
        {reservationRestaurant && <ReservationForm restaurant={reservationRestaurant} onDone={() => setReservationRestaurant(null)} />}
      </EntityDrawer>
    </>
  );
}
