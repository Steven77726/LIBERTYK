"use client";

import {
  ArrowUpRight, CalendarDays, Car, ChevronDown, Filter, Globe2, Heart, Instagram,
  List, Map, MapPin, Navigation, Phone, Search, Send, Share2, SlidersHorizontal,
  Store, UtensilsCrossed, X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Restaurant } from "@/types/restaurant";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { ReservationForm } from "@/components/restaurants/reservation-form";

const cuisineFilters = ["Burgers", "Japonais", "Italien", "Grillades", "Israélien", "Français", "Oriental", "Tunisien", "Marocain", "Asiatique", "Indien", "Pizzeria", "Sandwicherie", "Salon de thé", "Brunch", "Pâtisserie", "Bar à vin", "Cocktails"];
const typeFilters = ["Viande", "Lait", "Parvé"];
const serviceFilters = ["Sur place", "À emporter", "Livraison", "Click & Collect", "Réservation en ligne"];
const availabilityFilters = ["Ouvert maintenant", "Ouvert le midi", "Ouvert le soir", "Ouvert le dimanche", "Ouvert tard"];
const budgetFilters = ["Moins de 20 €", "20 € à 40 €", "40 € à 70 €", "Plus de 70 €"];
const comfortFilters = ["Adapté aux familles", "Terrasse", "Wifi", "Menu enfant", "Privatisation"];
const accessibilityFilters = ["Accessible PMR", "Parking", "Métro à moins de 500 mètres"];
const locationFilters = ["À moins de 2 km", "À moins de 5 km", "À moins de 10 km", "Les plus proches"];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const distanceBetween = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const cuisineMatch = (restaurant: Restaurant, filter: string) => {
  const corpus = normalize(`${restaurant.cuisine} ${restaurant.specialty}`);
  const aliases: Record<string, string[]> = {
    Japonais: ["japon", "sushi"], Italien: ["italien", "pizza"], Israélien: ["israel"],
    Français: ["franc"], Indien: ["indien"], Pizzeria: ["pizza"],
  };
  return (aliases[filter] ?? [normalize(filter)]).some((term) => corpus.includes(normalize(term)));
};

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

function RestaurantCard({ restaurant, favorite, onFavorite, onOpen, onReserve }: { restaurant: Restaurant; favorite: boolean; onFavorite: () => void; onOpen: () => void; onReserve: () => void }) {
  const unknown = "À compléter";
  return (
    <article id={restaurant.id} className="group overflow-hidden rounded-[1.75rem] border border-black/[.055] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="relative aspect-[16/10] overflow-hidden bg-sage">
        <button onClick={onOpen} className="absolute inset-0 size-full text-left" aria-label={`Ouvrir la fiche ${restaurant.name}`}><img src={restaurant.image} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" /></button>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex flex-col items-start gap-2"><span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.08em] text-ink backdrop-blur">{restaurant.cuisine}</span><RecommendationBadge rating={restaurant.rating} reviewCount={restaurant.reviewCount} /></div>
          <button onClick={onFavorite} className={`grid size-10 place-items-center rounded-full backdrop-blur transition ${favorite ? "bg-[#a54b4b] text-white" : "bg-white/90 text-ink"}`} aria-label="Ajouter aux favoris"><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2"><span className="rounded-full bg-ink/85 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">{restaurant.isOpenNow === null ? "Horaires à compléter" : restaurant.isOpenNow ? "Ouvert" : "Fermé"}</span><button onClick={onReserve} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-ink shadow-sm"><CalendarDays size={12} /> Réservation</button></div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><button onClick={onOpen} className="text-left"><h2 className="text-xl font-semibold tracking-[-.035em]">{restaurant.name}</h2></button><p className="mt-1 text-xs text-ink/43">{restaurant.specialty}</p></div>
        </div>
        <div className="mt-3"><CustomerRating rating={restaurant.rating} reviewCount={restaurant.reviewCount} /></div>
        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded-full bg-cream px-2.5 py-1.5">{restaurant.type}</span>
          <span className="rounded-full bg-cream px-2.5 py-1.5">✡ {restaurant.certification}</span>
          <span className="rounded-full bg-cream px-2.5 py-1.5">{restaurant.price}</span>
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink/52"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{restaurant.fullAddress}, {restaurant.postalCode}<br />Paris {restaurant.arrondissement}<sup>e</sup> · {restaurant.distanceKm} km</span></div>
        <div className="mt-4 flex gap-2 border-t border-black/[.06] pt-4">
          {[
            { value: restaurant.services.dineIn, label: "Sur place", icon: Store },
            { value: restaurant.services.takeaway, label: "À emporter", icon: UtensilsCrossed },
            { value: restaurant.services.delivery, label: "Livraison", icon: Car },
          ].map(({ value, label, icon: Icon }) => <span key={label} title={value === null ? unknown : label} className={`flex items-center gap-1 text-[10px] ${value ? "text-moss" : "text-ink/25"}`}><Icon size={13} />{label}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2.5 text-xs font-semibold text-white"><Phone size={14} /> Appeler</a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.fullAddress)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-cream px-3 py-2.5 text-xs font-semibold"><Navigation size={14} /> Itinéraire</a>
        </div>
        <div className="mt-2 flex items-center justify-center gap-1">
          {[Globe2, Instagram, Share2, Send].map((Icon, index) => <button key={index} className="grid size-8 place-items-center rounded-full text-ink/35 transition hover:bg-cream hover:text-ink" aria-label={["Site internet", "Instagram", "Partager", "Donner un avis"][index]}><Icon size={14} /></button>)}
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [detailRestaurant, setDetailRestaurant] = useState<Restaurant | null>(null);
  const [reservationRestaurant, setReservationRestaurant] = useState<Restaurant | null>(null);
  const [restaurantData, setRestaurantData] = useState(initialRestaurants);

  useEffect(() => {
    const saved = localStorage.getItem("liberty-restaurant-favorites");
    if (saved) setFavorites(JSON.parse(saved));
    navigator.geolocation?.getCurrentPosition(({ coords }) => {
      setRestaurantData((current) => current.map((restaurant) => ({
        ...restaurant,
        distanceKm: Number(distanceBetween(coords.latitude, coords.longitude, restaurant.latitude, restaurant.longitude).toFixed(1)),
      })));
    }, () => undefined, { maximumAge: 300000, timeout: 5000 });
  }, []);

  const toggleFilter = (filter: string) => setFilters((current) => current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter]);
  const toggleFavorite = (id: string) => setFavorites((current) => {
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    localStorage.setItem("liberty-restaurant-favorites", JSON.stringify(next));
    return next;
  });

  const results = useMemo(() => {
    const search = normalize(query);
    let filtered = restaurantData.filter((restaurant) => {
      const corpus = normalize(`${restaurant.name} ${restaurant.fullAddress} ${restaurant.arrondissement} ${restaurant.cuisine} ${restaurant.specialty}`);
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
          <p className="mt-3 text-sm text-white/45">{initialRestaurants.length} adresses · Catalogue Liberty</p>
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
              <button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${view === "map" ? "bg-ink text-white" : "text-ink/45"}`}><Map size={14} /> Carte</button>
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

          <div className={view === "map" ? "hidden xl:block" : ""}>
            <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">{results.length} restaurant{results.length > 1 ? "s" : ""}</p>{filters.length > 0 && <span className="text-xs text-ink/40">{filters.length} filtre{filters.length > 1 ? "s" : ""} actif{filters.length > 1 ? "s" : ""}</span>}</div>
            {results.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{results.map((restaurant) => <RestaurantCard key={restaurant.id} restaurant={restaurant} favorite={favorites.includes(restaurant.id)} onFavorite={() => toggleFavorite(restaurant.id)} onOpen={() => setDetailRestaurant(restaurant)} onReserve={() => setReservationRestaurant(restaurant)} />)}</div> : <div className="grid min-h-80 place-items-center rounded-[2rem] bg-white text-center"><div><Search className="mx-auto text-ink/20" size={30} /><p className="mt-4 font-semibold">Aucun résultat</p><button onClick={() => { setFilters([]); setQuery(""); }} className="mt-3 text-xs font-semibold text-moss">Réinitialiser la recherche</button></div></div>}
          </div>

          <div className={`${view === "map" ? "block lg:col-span-1 xl:col-span-1" : "hidden xl:block"}`}><RestaurantMap restaurants={results} selected={selected} onSelect={(restaurant) => setSelected(selected?.id === restaurant.id ? null : restaurant)} /></div>
        </div>
      </section>
      <EntityDrawer open={!!detailRestaurant} onClose={() => setDetailRestaurant(null)} title={detailRestaurant?.name ?? "Restaurant"}>
        {detailRestaurant && <div><div className="relative aspect-[16/10]"><img src={detailRestaurant.image} alt="" className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><div className="absolute bottom-5 left-5 text-white"><p className="text-xs text-white/55">{detailRestaurant.cuisine}</p><h2 className="mt-1 text-3xl font-semibold">{detailRestaurant.name}</h2></div></div><div className="space-y-6 p-6"><CustomerRating rating={detailRestaurant.rating} reviewCount={detailRestaurant.reviewCount} /><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-sage px-3 py-2 text-moss">{detailRestaurant.type}</span><span className="rounded-full bg-white px-3 py-2">✡ {detailRestaurant.certification}</span><span className="rounded-full bg-white px-3 py-2">{detailRestaurant.price}</span></div><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Adresse</p><p className="mt-2 text-sm">{detailRestaurant.fullAddress}, {detailRestaurant.postalCode} Paris</p></div><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Spécialité</p><p className="mt-2 text-sm leading-6 text-ink/60">{detailRestaurant.specialty}</p></div><button onClick={() => { setDetailRestaurant(null); setReservationRestaurant(detailRestaurant); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-4 text-sm font-semibold text-white"><CalendarDays size={16} /> Demander une réservation</button></div></div>}
      </EntityDrawer>
      <EntityDrawer open={!!reservationRestaurant} onClose={() => setReservationRestaurant(null)} title="Demande de réservation">
        {reservationRestaurant && <ReservationForm restaurant={reservationRestaurant} onDone={() => setReservationRestaurant(null)} />}
      </EntityDrawer>
    </>
  );
}
