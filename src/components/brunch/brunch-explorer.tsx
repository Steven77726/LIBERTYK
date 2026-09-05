"use client";

import {
  ArrowRight, CalendarDays, Car, ChevronDown, Filter, List,
  Map, MapPin, Package, Phone, Search, ShoppingBag, Store, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Brunch } from "@/types/brunch";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { assetPath } from "@/lib/assets";
import { LikeButton } from "@/components/ui/entity-actions";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { InteractiveMap, type MapEstablishment } from "@/components/map/interactive-map";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";
import { getEstablishmentGoogleBusiness } from "@/lib/google-places";
import { buildLocationFilterOptions, matchesAnyLocationFilter } from "@/lib/geo/location-filters";

const baseGroups = [
  { title: "Type de brunch", values: ["Pancakes", "Avocado Toast", "Œufs Bénédicte", "Bagels", "Gaufres", "Viennoiseries", "Café de spécialité", "Brunch israélien", "Healthy", "Buffet", "Fromages", "Pâtisseries"] },
  { title: "Type cacher", values: ["Viande", "Lait", "Parvé"] },
  { title: "Services", values: ["Sur place", "À emporter", "Livraison", "Click & Collect", "Réservation"] },
  { title: "Disponibilité", values: ["Ouvert maintenant", "Ouvert le matin", "Ouvert le midi", "Ouvert le dimanche"] },
  { title: "Budget", values: ["€", "€€", "€€€"] },
  { title: "Confort", values: ["Adapté aux familles", "Terrasse", "Wifi", "Parking", "Accessible PMR", "Menu enfant"] },
];

const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const parseArrondissement = (value?: string) => Number(String(value ?? "").match(/\d{1,2}/)?.[0] ?? "") || undefined;
const hourLinesToRecord = (value?: string) => {
  const fallback = { lundi: "", mardi: "", mercredi: "", jeudi: "", vendredi: "", samedi: "", dimanche: "" };
  if (!value?.trim()) return fallback;
  return value.split("\n").reduce<Record<string, string>>((acc, line) => {
    const [day, ...rest] = line.split(":");
    if (day?.trim()) acc[day.trim().toLowerCase()] = rest.join(":").trim();
    return acc;
  }, { ...fallback });
};
const mapKosherType = (value?: string): Brunch["kosherType"] => {
  const normalized = fold(value ?? "");
  if (normalized.includes("bassari") || normalized.includes("viande")) return "Viande";
  if (normalized.includes("halavi") || normalized.includes("lait")) return "Lait";
  return "Parvé";
};
const mapPrice = (value?: string): Brunch["price"] | undefined => value === "€" || value === "€€" || value === "€€€" ? value : undefined;

const distanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};

const recordsToBrunches = (records: EstablishmentRecord[]): Brunch[] => records.map((item, index) => {
  const google = getEstablishmentGoogleBusiness(item.name);
  return {
    slug: item.slug ?? item.id,
    name: item.name,
    address: item.address || undefined,
    postalCode: item.postalCode,
    arrondissement: parseArrondissement(item.arrondissement),
    nearestMetroName: item.nearestMetroName,
    nearestMetroLine: item.nearestMetroLine,
    phone: item.phone || undefined,
    instagram: item.instagram || undefined,
    specialty: item.shortDescription || item.description || "Brunch",
    cuisine: item.cuisineTypes?.length ? item.cuisineTypes.join(", ") : "Brunch",
    kosherType: mapKosherType(item.kosherType),
    certification: item.certification || undefined,
    services: {
      dineIn: true,
      takeaway: item.takeaway,
      delivery: item.delivery,
      clickCollect: false,
      reservation: item.reservation,
    },
    hours: hourLinesToRecord(item.hours),
    price: mapPrice(item.averagePrice),
    amenities: {
      family: undefined,
      accessible: undefined,
      parking: undefined,
      terrace: item.terrace,
      wifi: undefined,
      kidsMenu: undefined,
      privateHire: item.privateHire,
    },
    tags: [...new Set([...(item.cuisineTypes ?? []), ...(item.visibleTagIds ?? [])].filter(Boolean))],
    source: item.website || undefined,
    rawData: {},
    images: [item.mainPhoto, ...(item.photos ?? [])].filter(Boolean),
    description: item.description,
    rating: google?.rating ?? 4.8,
    reviewCount: google?.userRatingsTotal ?? 140,
    distanceKm: 0,
    fieldVisibility: item.fieldVisibility,
    latitude: Number(item.latitude) || 48.8566,
    longitude: Number(item.longitude) || 2.3522,
    importedAt: item.updatedAt ?? new Date(Date.now() + index).toISOString(),
  };
});

const brunchToEstablishmentRecord = (brunch: Brunch): EstablishmentRecord => ({
  id: brunch.slug,
  rubricId: "food",
  subrubricId: "brunch",
  mainPhoto: brunch.images[0] ?? "",
  photos: brunch.images.slice(1),
  name: brunch.name,
  slug: brunch.slug,
  shortDescription: `${brunch.specialty} · ${brunch.cuisine}`,
  description: brunch.description,
  address: brunch.address ?? "",
  city: "Paris",
  arrondissement: brunch.arrondissement ? `${brunch.arrondissement}e` : "",
  postalCode: brunch.postalCode ?? "",
  country: "France",
  email: "",
  phone: brunch.phone ?? "",
  whatsapp: "",
  instagram: brunch.instagram ?? "",
  website: brunch.source ?? "",
  hours: Object.entries(brunch.hours).map(([day, hours]) => `${day}: ${hours ?? ""}`).join("\n"),
  terrace: brunch.amenities.terrace === true,
  delivery: brunch.services.delivery === true,
  takeaway: brunch.services.takeaway === true,
  reservation: brunch.services.reservation === true,
  privateHire: brunch.amenities.privateHire === true,
  certification: brunch.certification ?? "",
  kosherType: brunch.kosherType === "Lait" ? "Halavi" : brunch.kosherType === "Viande" ? "Bassari" : "Parvé",
  averagePrice: brunch.price ?? "",
  latitude: String(brunch.latitude),
  longitude: String(brunch.longitude),
  status: "Publié",
  visible: true,
  sponsorshipLevel: "Standard",
  sponsored: false,
  sponsorPriority: 0,
  sponsorDuration: "",
  sponsorStartsAt: "",
  sponsorEndsAt: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: "",
  cuisineTypes: (brunch.cuisine ? [brunch.cuisine.split("/")[0].trim()] : ["Brunch"]).filter(Boolean),
  order: 0,
  customerSearches: [],
  visibleTagIds: brunch.tags,
  fieldVisibility: brunch.fieldVisibility,
});
const serviceMap = (brunch: Brunch): Record<string, boolean | undefined> => ({
  "Sur place": brunch.services.dineIn, "À emporter": brunch.services.takeaway, Livraison: brunch.services.delivery,
  "Click & Collect": brunch.services.clickCollect, Réservation: brunch.services.reservation,
  "Adapté aux familles": brunch.amenities.family, Terrasse: brunch.amenities.terrace, Wifi: brunch.amenities.wifi,
  Parking: brunch.amenities.parking, "Accessible PMR": brunch.amenities.accessible, "Menu enfant": brunch.amenities.kidsMenu,
});

function BrunchCard({ brunch, onOpen }: { brunch: Brunch; onOpen: () => void }) {
  const visibility = { address: true, phone: true, tags: true, opening_hours: true, gallery: true, reviews: true, certification: true, price: true, ...(brunch.fieldVisibility ?? {}) };
  const entity = { id: `brunch-${brunch.slug}`, title: brunch.name, url: `/food/brunch/${brunch.slug}`, text: `${brunch.name} · ${brunch.address ?? "Paris"}` };
  const metroStyle = getMetroLineStyle(brunch.nearestMetroLine);
  const services = [
    { label: "Sur place", value: brunch.services.dineIn, icon: Store },
    { label: "À emporter", value: brunch.services.takeaway, icon: Package },
    { label: "Livraison", value: brunch.services.delivery, icon: Car },
    { label: "Click & Collect", value: brunch.services.clickCollect, icon: ShoppingBag },
    { label: "Réservation", value: brunch.services.reservation, icon: CalendarDays },
  ];
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <button onClick={onOpen} className="group relative block aspect-[16/10] w-full overflow-hidden text-left" aria-label={`Ouvrir la fiche ${brunch.name}`}>
        <img src={assetPath(brunch.images[0])} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-4 top-4"><RecommendationBadge rating={brunch.rating} reviewCount={brunch.reviewCount} /></div>
        {visibility.opening_hours !== false && <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold backdrop-blur">Voir les horaires</span>}
      </button>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><button onClick={onOpen} className="text-left"><h2 className="text-xl font-semibold tracking-[-.035em]">{brunch.name}</h2></button><p className="mt-1 text-xs text-ink/40">{brunch.cuisine}</p></div>
          <LikeButton entity={entity} className="grid size-9 place-items-center rounded-full bg-cream transition hover:bg-[#a54b4b] hover:text-white" />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px]"><span className="rounded-full bg-sage px-2.5 py-1.5 font-semibold text-moss">{brunch.kosherType}</span>{visibility.price !== false && brunch.price && <span className="rounded-full bg-cream px-2.5 py-1.5">{brunch.price}</span>}{visibility.certification !== false && brunch.certification && <span className="rounded-full bg-cream px-2.5 py-1.5">✡ {brunch.certification}</span>}</div>
        {visibility.reviews !== false && <div className="mt-3"><CustomerRating rating={brunch.rating} reviewCount={brunch.reviewCount} /></div>}
        {visibility.address !== false && (brunch.address || brunch.arrondissement) && <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink/50"><MapPin size={13} className="mt-0.5 shrink-0" />{brunch.address}{brunch.arrondissement && ` · Paris ${brunch.arrondissement}e`}{brunch.distanceKm ? ` · ${brunch.distanceKm} km` : ""}</p>}
        {brunch.nearestMetroName && (
          <button onClick={onOpen} className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink/50">
            <span className="truncate">Métro {brunch.nearestMetroName}</span>
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
        {visibility.phone !== false && brunch.phone && <p className="mt-2 flex items-center gap-2 text-xs text-ink/50"><Phone size={13} />{brunch.phone}</p>}
        <div className="mt-4 grid grid-cols-5 gap-1.5 border-t border-black/[.06] pt-4">{services.map(({ label, value, icon: Icon }) => <div key={label} title={label} className={`grid place-items-center gap-1 rounded-xl py-2 text-center text-[8px] ${value ? "bg-sage text-moss" : "bg-cream text-ink/25"}`}><Icon size={13} /><span className="line-clamp-1">{label}</span></div>)}</div>
        <button onClick={onOpen} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-xs font-semibold text-white">Voir la fiche <ArrowRight size={14} /></button>
      </div>
    </article>
  );
}

export function BrunchExplorer({ initialBrunches }: { initialBrunches: Brunch[] }) {
  const [brunchData, setBrunchData] = useState(initialBrunches);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState("Les plus proches");
  const [view, setView] = useState<"list" | "map">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Brunch | null>(null);
  const toggleFilter = (value: string) => setFilters((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const handleUserLocation = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    setBrunchData((current) => current.map((item) => ({
      ...item,
      distanceKm: Number(distanceBetween(latitude, longitude, item.latitude, item.longitude).toFixed(1)),
    })));
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const supabaseBrunches = await listPublishedEstablishments({ rubricSlug: "food", subrubricSlug: "brunch" }).catch(() => null);
      if (!mounted) return;
      setBrunchData(supabaseBrunches?.length ? recordsToBrunches(supabaseBrunches) : initialBrunches);
    };
    void load();
    const refresh = () => void load();
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, [initialBrunches]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      handleUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
    }, () => undefined, { maximumAge: 300000, timeout: 6000 });
  }, []);

  const dynamicLocationFilters = useMemo(() => {
    return buildLocationFilterOptions(brunchData);
  }, [brunchData]);

  const groups = useMemo(() => {
    return [
      { title: "Localisation", values: dynamicLocationFilters },
      ...baseGroups,
    ];
  }, [dynamicLocationFilters]);

  const results = useMemo(() => {
    const q = fold(query);
    const typeTags = baseGroups[0].values;
    const kosher = baseGroups[1].values;
    const services = [...baseGroups[2].values, ...baseGroups[5].values];
    const list = brunchData.filter((brunch) => {
      if (q && !fold(`${brunch.name} ${brunch.address ?? ""} ${brunch.arrondissement ?? ""} ${brunch.cuisine} ${brunch.specialty}`).includes(q)) return false;

      if (!matchesAnyLocationFilter(brunch, filters, dynamicLocationFilters)) return false;

      const chosenTypes = filters.filter((item) => typeTags.includes(item));
      if (chosenTypes.length && !chosenTypes.some((item) => fold(`${brunch.specialty} ${brunch.tags.join(" ")}`).includes(fold(item)))) return false;
      const chosenKosher = filters.filter((item) => kosher.includes(item));
      if (chosenKosher.length && !chosenKosher.includes(brunch.kosherType)) return false;
      if (filters.filter((item) => services.includes(item)).some((item) => serviceMap(brunch)[item] !== true)) return false;
      if (filters.some((item) => ["€", "€€", "€€€"].includes(item)) && !filters.includes(brunch.price ?? "")) return false;
      if (filters.includes("Ouvert le dimanche") && !brunch.hours.dimanche) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "Ordre alphabétique") return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
      if (sort === "Prix croissant") return (a.price?.length ?? 9) - (b.price?.length ?? 9);
      if (sort === "Prix décroissant") return (b.price?.length ?? 0) - (a.price?.length ?? 0);
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
  }, [brunchData, query, filters, sort, dynamicLocationFilters]);

  const mapItems = useMemo<MapEstablishment[]>(() => results.map((item) => ({
    id: item.slug,
    name: item.name,
    address: item.address,
    arrondissement: item.arrondissement,
    latitude: item.latitude,
    longitude: item.longitude,
    image: item.images[0],
    cuisine: item.cuisine,
    specialty: item.specialty,
    price: item.price,
    kosherType: item.kosherType,
    phone: item.phone,
    distanceKm: item.distanceKm,
    href: `/food/brunch/${item.slug}`,
  })), [results]);

  return (
    <>
      <section className="page-shell pt-6">
        <div className="rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">Food · Sous-rubrique</p>
          <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Brunch casher</h1>
              <p className="mt-1 text-sm text-ink/45">{results.length} adresses d’exception à Paris</p>
            </div>
            <div className="flex w-full max-w-2xl items-center rounded-2xl bg-cream p-2">
              <Search size={18} className="ml-3 shrink-0 text-ink/30" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, adresse, arrondissement, cuisine…" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
              {query && <button onClick={() => setQuery("")} className="grid size-9 place-items-center rounded-full hover:bg-white"><X size={15} /></button>}
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold lg:hidden">
              <Filter size={14} /> Filtres {filters.length ? `(${filters.length})` : ""}
            </button>
            <div className="flex rounded-xl bg-white p-1 shadow-sm">
              <button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${view === "list" ? "bg-ink text-white" : "text-ink/60"}`}>
                <List size={14} /> Liste
              </button>
              <button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${view === "map" ? "bg-ink text-white" : "text-ink/60"}`}>
                <Map size={14} /> Carte
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold shadow-sm">
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent font-semibold text-ink outline-none">
              {["Les plus proches", "Les mieux notés", "Les plus populaires", "Les nouveautés", "Prix croissant", "Prix décroissant", "Ordre alphabétique"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={13} className="text-ink/40" />
          </label>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="grid items-start gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_450px]">
          {/* Barre latérale des filtres */}
          <aside className={`${filterOpen ? "fixed inset-0 z-[70] overflow-y-auto bg-cream p-6" : "hidden"} lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-[1.75rem] lg:bg-white lg:p-5`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink">Filtres</p>
              <div className="flex gap-3">
                {filters.length > 0 && <button onClick={() => setFilters([])} className="text-[10px] font-semibold text-moss">Tout effacer</button>}
                <button onClick={() => setFilterOpen(false)} className="lg:hidden"><X size={18} /></button>
              </div>
            </div>
            {groups.map((group) => (
              <div key={group.title} className="border-b border-black/[.06] py-5">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-ink/40">{group.title}</p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => (
                    <button key={value} onClick={() => toggleFilter(value)} className={`rounded-full border px-3 py-2 text-[11px] transition ${filters.includes(value) ? "border-ink bg-ink text-white" : "border-black/10 hover:border-black/25"}`}>
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setFilterOpen(false)} className="sticky bottom-2 mt-4 w-full rounded-xl bg-ink py-3 text-xs font-semibold text-white lg:hidden">
              Voir {results.length} résultats
            </button>
          </aside>

          {/* Liste des cartes */}
          <div className={view === "map" ? "hidden xl:block" : ""}>
            <p className="mb-4 text-sm font-semibold text-ink">{results.length} brunch{results.length > 1 ? "s" : ""}</p>
            {results.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {results.map((brunch, index) => (
                  <UniversalEstablishmentCard
                    key={brunch.slug}
                    establishment={brunch}
                    priorityImage={index < 4}
                  />
                ))}
              </div>
            ) : (
              <div className="grid min-h-80 place-items-center rounded-[2rem] bg-white">
                <div className="text-center">
                  <Search className="mx-auto text-ink/20" />
                  <p className="mt-3 font-semibold">Aucun brunch trouvé</p>
                  <button onClick={() => { setFilters([]); setQuery(""); }} className="mt-2 text-xs font-semibold text-moss">Réinitialiser</button>
                </div>
              </div>
            )}
          </div>

          {/* Vraie Carte Interactive Leaflet / OpenStreetMap */}
          <div className={`${view === "map" ? "block" : "hidden xl:block"}`}>
            <div className="sticky top-24">
              <InteractiveMap
                items={mapItems}
                selectedItem={selected ? mapItems.find((m) => m.id === selected.slug) ?? null : null}
                onSelect={(item) => setSelected(item ? brunchData.find((b) => b.slug === item.id) ?? null : null)}
                onOpenDetail={(item) => {
                  const found = brunchData.find((b) => b.slug === item.id);
                  if (found) setSelected(found);
                }}
                onUserLocationChange={handleUserLocation}
                className="h-[calc(100vh-7rem)] min-h-[560px]"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
