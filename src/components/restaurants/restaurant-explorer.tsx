"use client";

import {
  CalendarDays,
  ChevronDown,
  List, Map as MapIcon,
  MapPin, Search, SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "@/types/restaurant";
import type { LocalSponsorshipLevel } from "@/data/establishments";
import { CustomerRating } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { ReservationForm } from "@/components/restaurants/reservation-form";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { InteractiveMap, type MapEstablishment } from "@/components/map/interactive-map";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";
import { getEstablishmentGoogleBusiness } from "@/lib/google-places";
import { buildLocationFilterOptions, matchesAnyLocationFilter } from "@/lib/geo/location-filters";

const cuisineFilters = [
  "Français",
  "Israélien",
  "Japonais",
  "Chinois",
  "Thaïlandais",
  "Africain",
  "Italien",
  "Libanais",
  "Américain",
  "Marocain",
  "Tunisien",
  "Ashkénaze",
];
const typeFilters = ["Viande", "Lait", "Parvé"];
const serviceFilters = ["Sur place", "À emporter", "Livraison", "Click & Collect", "Réservation en ligne"];
const availabilityFilters = ["Ouvert maintenant", "Ouvert le midi", "Ouvert le soir", "Ouvert le dimanche", "Ouvert tard"];
const comfortFilters = ["Adapté aux familles", "Terrasse", "Wifi", "Menu enfant", "Privatisation"];

const excludedCuisineKeywords = new Set([
  "food", "restaurants", "brunch", "salons-de-the", "patisseries", "traiteurs",
  "traiteur-chabbat", "fast-food", "street-food", "boulangeries", "glaciers",
  "boucherie", "boucheries", "boulangerie", "patisserie", "salon de the", "traiteur",
  "sorties", "evenements", "concerts", "soirees-celibataires", "terrasse-festive",
  "shopping", "vetement-masculin", "vetement-feminin", "objet-utile", "soins-feminin",
  "mariage", "location-de-salle", "vin-spiritueux", "mikve", "voyages", "calendrier",
  "bar", "club", "terrasse festive", "soirees", "celibataires", "peniche", "rencontres",
  "coiffure", "maquillage", "lissage", "decoration", "scenographie", "fleurs", "houppa",
  "salle de reception", "evenementiel"
]);

export function isNonCuisineRubric(val: string): boolean {
  const norm = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const slug = norm.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return excludedCuisineKeywords.has(norm) || excludedCuisineKeywords.has(slug);
}

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const slugify = (value: string) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const CANONICAL_CUISINES: Record<string, string> = {
  francais: "Français",
  francaise: "Français",
  francaises: "Français",
  french: "Français",
  israelien: "Israélien",
  israeliens: "Israélien",
  israelienne: "Israélien",
  israeliennes: "Israélien",
  israeli: "Israélien",
  japonais: "Japonais",
  japonaise: "Japonais",
  japonaises: "Japonais",
  japanese: "Japonais",
  chinois: "Chinois",
  chinoise: "Chinois",
  chinoises: "Chinois",
  chinese: "Chinois",
  thailandais: "Thaïlandais",
  thailandaise: "Thaïlandais",
  thailandaises: "Thaïlandais",
  thai: "Thaïlandais",
  africain: "Africain",
  africains: "Africain",
  africaine: "Africain",
  africaines: "Africain",
  african: "Africain",
  italien: "Italien",
  italiens: "Italien",
  italienne: "Italien",
  italiennes: "Italien",
  italian: "Italien",
  libanais: "Libanais",
  libanaise: "Libanais",
  libanaises: "Libanais",
  lebanese: "Libanais",
  americain: "Américain",
  americains: "Américain",
  americaine: "Américain",
  americaines: "Américain",
  american: "Américain",
  marocain: "Marocain",
  marocains: "Marocain",
  marocaine: "Marocain",
  marocaines: "Marocain",
  moroccan: "Marocain",
  tunisien: "Tunisien",
  tunisiens: "Tunisien",
  tunisienne: "Tunisien",
  tunisiennes: "Tunisien",
  tunisian: "Tunisien",
  ashkenaze: "Ashkénaze",
  ashkenazes: "Ashkénaze",
  ashkenazi: "Ashkénaze",
  ashkenazic: "Ashkénaze",
  yemenite: "Yéménite",
  yemenites: "Yéménite",
  indien: "Indien",
  indiens: "Indien",
  indienne: "Indien",
  indiennes: "Indien",
  indian: "Indien",
  oriental: "Oriental",
  orientale: "Oriental",
  orientales: "Oriental",
  orientaux: "Oriental",
  mediterraneen: "Méditerranéen",
  mediterraneenne: "Méditerranéen",
  mediterraneennes: "Méditerranéen",
  mediterraneens: "Méditerranéen",
  mediterranean: "Méditerranéen",
  algerien: "Algérien",
  algerienne: "Algérien",
  algeriennes: "Algérien",
  algeriens: "Algérien",
  mexicain: "Mexicain",
  mexicaine: "Mexicain",
  mexicaines: "Mexicain",
  mexicains: "Mexicain",
};

export function toCanonicalCuisineName(raw: string): string {
  const norm = normalize(raw);
  if (CANONICAL_CUISINES[norm]) {
    return CANONICAL_CUISINES[norm];
  }
  const clean = raw.trim();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
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
const normalizeInstagramUrl = (value?: string) => {
  const trimmed = value?.trim();
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
  const clean = trimmed.replace(/^@/, "").replace(/^\/+/, "");
  return `https://instagram.com/${clean}`;
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
    const google = getEstablishmentGoogleBusiness(item.name);
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
      cuisineTypes: Array.isArray(item.cuisineTypes)
        ? item.cuisineTypes.flatMap((c) => (typeof c === "string" ? c.split(",") : [])).map((s) => s.trim()).filter(Boolean)
        : [],
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
      rating: google?.rating ?? 4.8,
      reviewCount: google?.userRatingsTotal ?? 140,
      distanceKm: 0,
      isOpenNow: null,
      openLunch: null,
      openDinner: null,
      openSunday: null,
      openLate: null,
      image: gallery[0] || "/images/food/restaurants-khan.jpg",
      gallery,
      website: normalizeExternalUrl(item.website),
      instagram: normalizeInstagramUrl(item.instagram),
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

/**
 * Extrait exclusivement les types de cuisine définis dans le champ du dashboard
 * (cuisineTypes ou cuisine) sans chercher dans les descriptions, tags ou métadonnées.
 */
export function getEstablishmentCuisineTypes(item: { cuisineTypes?: string[]; cuisine?: string }): string[] {
  const result = new Set<string>();

  if (Array.isArray(item.cuisineTypes) && item.cuisineTypes.length > 0) {
    item.cuisineTypes
      .flatMap((c) => (typeof c === "string" ? c.split(",") : []))
      .map((c) => c.trim())
      .filter((c) => Boolean(c) && c !== "À compléter" && c !== "Restaurant casher" && !isNonCuisineRubric(c))
      .forEach((c) => {
        const canon = toCanonicalCuisineName(c);
        if (canon && !isNonCuisineRubric(canon)) result.add(canon);
      });
  }

  if (result.size === 0 && typeof item.cuisine === "string" && item.cuisine.trim()) {
    item.cuisine
      .split(",")
      .map((c) => c.trim())
      .filter((c) => Boolean(c) && c !== "À compléter" && c !== "Restaurant casher" && !isNonCuisineRubric(c))
      .forEach((c) => {
        const canon = toCanonicalCuisineName(c);
        if (canon && !isNonCuisineRubric(canon)) result.add(canon);
      });
  }

  return Array.from(result);
}

/**
 * Génère la liste des options uniques pour le filtre Cuisine
 * alimentée EXCLUSIVEMENT par les entrées du champ Types de cuisine.
 */
export function generateCuisineFilterOptions(restaurants: Restaurant[]): string[] {
  const uniqueMap = new Map<string, string>();
  restaurants.forEach((restaurant) => {
    const types = getEstablishmentCuisineTypes(restaurant);
    types.forEach((type) => {
      const canon = toCanonicalCuisineName(type);
      if (canon && !isNonCuisineRubric(canon)) {
        const norm = normalize(canon);
        if (!uniqueMap.has(norm)) {
          uniqueMap.set(norm, canon);
        }
      }
    });
  });
  return Array.from(uniqueMap.values()).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );
}

/**
 * Condition de filtrage STRICTE par type de cuisine :
 * Vérifie UNIQUEMENT les valeurs du champ Types de cuisine (cuisineTypes / cuisine)
 * SANS AUCUN repli (fallback) dans description, specialty, tags ou keywords.
 */
export function matchesStrictCuisineFilter(
  restaurant: Restaurant,
  selectedCuisineFilter: string
): boolean {
  const canonFilter = toCanonicalCuisineName(selectedCuisineFilter);
  const normFilter = normalize(canonFilter);
  if (!normFilter) return true;

  const rawCuisines = getEstablishmentCuisineTypes(restaurant);
  const normalizedCuisines = rawCuisines.map((c) => normalize(toCanonicalCuisineName(c))).filter(Boolean);

  if (!normalizedCuisines.length) return false;

  return normalizedCuisines.some((c) => {
    return (
      c === normFilter ||
      c.startsWith(normFilter) ||
      normFilter.startsWith(c) ||
      c.replace(/e?s?$/, "") === normFilter.replace(/e?s?$/, "")
    );
  });
}

function matchesSmartFilter(restaurant: Restaurant, filter: string) {
  const normalized = normalize(filter);
  const serviceMap: Record<string, boolean | null> = {
    "sur place": restaurant.services.dineIn,
    "a emporter": restaurant.services.takeaway,
    "livraison": restaurant.services.delivery,
    "reservation": restaurant.services.reservation,
    "terrasse": restaurant.amenities.terrace,
  };
  if (serviceMap[normalized] !== undefined) {
    return serviceMap[normalized] === true;
  }
  const corpus = normalize([
    restaurant.name,
    restaurant.fullAddress,
    restaurant.arrondissement,
    restaurant.type,
    restaurant.certification,
    ...(restaurant.tags ?? []),
  ].join(" "));
  return corpus.includes(normalized);
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



import { localEstablishments } from "@/data/establishments";

export function RestaurantExplorer({ initialRestaurants }: { initialRestaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState("Les plus proches");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [reservationRestaurant, setReservationRestaurant] = useState<Restaurant | null>(null);

  const initialMerged = useMemo(() => {
    const mergedMap = new Map<string, Restaurant>();
    initialRestaurants.forEach((r) => mergedMap.set(r.id, r));
    const localFood = (localEstablishments as EstablishmentRecord[]).filter((est) => {
      const rubric = (est.rubricId || "").toLowerCase();
      return (
        rubric === "food" ||
        rubric === "restaurant" ||
        rubric === "restaurants" ||
        (est.subrubricId || "").toLowerCase().includes("restaurant") ||
        (est.subrubricId || "").toLowerCase().includes("patisserie") ||
        (est.subrubricId || "").toLowerCase().includes("traiteur")
      );
    });
    if (localFood.length > 0) {
      const converted = establishmentRecordsToRestaurants(localFood);
      converted.forEach((c) => {
        const candidateNorm = normalize(c.name);
        let matchKey: string | null = null;
        for (const [key, existing] of mergedMap.entries()) {
          if (key === c.id || normalize(existing.name) === candidateNorm) {
            matchKey = key;
            break;
          }
        }
        if (matchKey) {
          mergedMap.set(matchKey, { ...mergedMap.get(matchKey)!, ...c });
        } else {
          mergedMap.set(c.id, c);
        }
      });
    }
    return Array.from(mergedMap.values());
  }, [initialRestaurants]);

  const [restaurantData, setRestaurantData] = useState(initialMerged);

  useEffect(() => {
    let mounted = true;
    const loadAdminRestaurants = async () => {
      const mergedMap = new Map<string, Restaurant>();
      initialMerged.forEach((r) => mergedMap.set(r.id, r));

      const findMatchingKey = (candidate: Restaurant) => {
        const candidateNorm = normalize(candidate.name);
        const candidateIdNorm = normalize(candidate.id);
        for (const [key, existing] of mergedMap.entries()) {
          if (
            key === candidate.id ||
            normalize(existing.id) === candidateIdNorm ||
            normalize(existing.name) === candidateNorm ||
            (candidate.fullAddress && normalize(existing.fullAddress) === normalize(candidate.fullAddress))
          ) {
            return key;
          }
        }
        return null;
      };

      // 2. Vérifier le cache local admin (localStorage)
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            const rawEsts = (parsed?.establishments as EstablishmentRecord[]) ?? [];
            const localFood = rawEsts.filter((est) => {
              const rubric = (est.rubricId || "").toLowerCase();
              return (
                rubric === "food" ||
                rubric === "restaurant" ||
                rubric === "restaurants" ||
                (est.subrubricId || "").toLowerCase().includes("restaurant") ||
                (est.subrubricId || "").toLowerCase().includes("traiteur")
              );
            });
            if (localFood.length > 0) {
              const converted = establishmentRecordsToRestaurants(localFood);
              converted.forEach((c) => {
                const matchKey = findMatchingKey(c);
                if (matchKey) {
                  mergedMap.set(matchKey, { ...mergedMap.get(matchKey)!, ...c });
                } else {
                  mergedMap.set(c.id, c);
                }
              });
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Charger depuis Supabase (source de vérité vivante)
      try {
        const supabaseRecords = await listPublishedEstablishments({ rubricSlug: "food" }).catch(() => null);
        if (supabaseRecords && supabaseRecords.length > 0) {
          const converted = establishmentRecordsToRestaurants(supabaseRecords);
          converted.forEach((c) => {
            const matchKey = findMatchingKey(c);
            if (matchKey) {
              mergedMap.set(matchKey, { ...mergedMap.get(matchKey)!, ...c });
            } else {
              mergedMap.set(c.id, c);
            }
          });
        }
      } catch {
        // ignore
      }

      if (mounted) {
        setRestaurantData(Array.from(mergedMap.values()));
      }
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
      const canonParam = toCanonicalCuisineName(cuisineParam.replace(/-/g, " "));
      const normParam = normalize(canonParam);
      const allOpts = generateCuisineFilterOptions(restaurantData);
      const matched =
        allOpts.find((opt) => normalize(opt) === normParam || slugify(opt) === slugify(cuisineParam) || slugify(opt) === slugify(canonParam)) ||
        allOpts.find((opt) => normalize(opt).startsWith(normParam) || normParam.startsWith(normalize(opt))) ||
        canonParam;
      setFilters((prev) => (prev.includes(matched) ? prev : [...prev, matched]));
    }
    const qParam = params.get("q") || params.get("search");
    if (qParam) {
      setQuery(qParam);
    }
  }, [restaurantData]);

  const toggleFilter = (filter: string) => setFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  const applyTagFilter = (tag: string) => {
    setView("list");
    setFilters([tag]);
    setQuery("");
    window.requestAnimationFrame(() => document.getElementById("restaurant-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const dynamicCuisineFilters = useMemo(() => {
    const options = generateCuisineFilterOptions(restaurantData);
    return options.length > 0 ? options : cuisineFilters;
  }, [restaurantData]);

  const dynamicLocationFilters = useMemo(() => {
    return buildLocationFilterOptions(restaurantData);
  }, [restaurantData]);

  const results = useMemo(() => {
    const search = normalize(query);
    const filtered = restaurantData.filter((restaurant) => {
      const corpus = normalize(`${restaurant.name} ${restaurant.fullAddress} ${restaurant.arrondissement} ${restaurant.cuisine} ${restaurant.specialty} ${(restaurant.tags ?? []).join(" ")}`);
      if (search && !corpus.includes(search)) return false;

      if (!matchesAnyLocationFilter(restaurant, filters, dynamicLocationFilters)) return false;

      const cuisineSelected = filters.filter((filter) => {
        const norm = normalize(filter);
        const canonNorm = normalize(toCanonicalCuisineName(filter));
        return dynamicCuisineFilters.some((cf) => {
          const cfNorm = normalize(cf);
          return cfNorm === norm || cfNorm === canonNorm;
        });
      });
      if (cuisineSelected.length && !cuisineSelected.some((filter) => matchesStrictCuisineFilter(restaurant, filter))) return false;

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

      const knownFilterNorms = new Set([
        ...dynamicCuisineFilters.map(normalize),
        ...dynamicCuisineFilters.map((c) => normalize(toCanonicalCuisineName(c))),
        ...typeFilters.map(normalize),
        ...serviceFilters.map(normalize),
        ...availabilityFilters.map(normalize),
        ...comfortFilters.map(normalize),
        ...dynamicLocationFilters.map(normalize),
      ]);
      const smartFilters = filters.filter((filter) => {
        const norm = normalize(filter);
        const canonNorm = normalize(toCanonicalCuisineName(filter));
        return !knownFilterNorms.has(norm) && !knownFilterNorms.has(canonNorm);
      });
      if (smartFilters.length && !smartFilters.every((filter) => matchesSmartFilter(restaurant, filter))) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === "Ordre alphabétique") return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      if (sort === "Les mieux notés") {
        const diff = (b.rating ?? 0) - (a.rating ?? 0);
        return diff !== 0 ? diff : b.reviewCount - a.reviewCount;
      }
      if (sort === "Les plus populaires") {
        const diff = b.reviewCount - a.reviewCount;
        return diff !== 0 ? diff : (b.rating ?? 0) - (a.rating ?? 0);
      }
      if (sort === "Les nouveautés") {
        const diff = (b.importedAt || "").localeCompare(a.importedAt || "");
        return diff !== 0 ? diff : (b.rating ?? 0) - (a.rating ?? 0);
      }
      const distDiff = (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
      return distDiff !== 0 ? distDiff : (b.rating ?? 0) - (a.rating ?? 0);
    });
  }, [restaurantData, query, filters, sort, dynamicCuisineFilters, dynamicLocationFilters]);

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
            <FilterSection title="Localisation" options={dynamicLocationFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Cuisine" options={dynamicCuisineFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Type" options={typeFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Services" options={serviceFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Disponibilité" options={availabilityFilters} active={filters} toggle={toggleFilter} />
            <FilterSection title="Confort" options={comfortFilters} active={filters} toggle={toggleFilter} />
            <button onClick={() => setShowFilters(false)} className="sticky bottom-3 mt-5 w-full rounded-xl bg-ink py-3 text-xs font-semibold text-white lg:hidden">Voir {results.length} résultats</button>
          </aside>

          <div id="restaurant-results" className={view === "map" ? "hidden xl:block" : ""}>
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">{results.length} restaurant{results.length > 1 ? "s" : ""}</p>{filters.length > 0 && <span className="text-xs text-ink/40">{filters.length} filtre{filters.length > 1 ? "s" : ""} actif{filters.length > 1 ? "s" : ""}</span>}</div>
            {results.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{results.map((restaurant, index) => (
              <UniversalEstablishmentCard
                key={restaurant.id}
                establishment={restaurant}
                onReserve={() => setReservationRestaurant(restaurant)}
                onTag={applyTagFilter}
                priorityImage={index < 4}
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
                  if (found) setSelected(found);
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
      <EntityDrawer open={!!reservationRestaurant} onClose={() => setReservationRestaurant(null)} title="Demande de réservation">
        {reservationRestaurant && <ReservationForm restaurant={reservationRestaurant} onDone={() => setReservationRestaurant(null)} />}
      </EntityDrawer>
    </>
  );
}
