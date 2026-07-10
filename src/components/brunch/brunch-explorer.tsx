"use client";

import {
  ArrowRight, CalendarDays, Car, ChevronDown, Coffee, Filter, List,
  Map, MapPin, Package, Phone, Search, ShoppingBag, Store, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Brunch } from "@/types/brunch";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { assetPath } from "@/lib/assets";
import { EntityActions, LikeButton } from "@/components/ui/entity-actions";

const groups = [
  { title: "Localisation", values: ["À moins de 2 km", "À moins de 5 km", "À moins de 10 km", "Les plus proches"] },
  { title: "Type de brunch", values: ["Pancakes", "Avocado Toast", "Œufs Bénédicte", "Bagels", "Gaufres", "Viennoiseries", "Café de spécialité", "Brunch israélien", "Healthy", "Buffet", "Fromages", "Pâtisseries"] },
  { title: "Type cacher", values: ["Viande", "Lait", "Parvé"] },
  { title: "Services", values: ["Sur place", "À emporter", "Livraison", "Click & Collect", "Réservation"] },
  { title: "Disponibilité", values: ["Ouvert maintenant", "Ouvert le matin", "Ouvert le midi", "Ouvert le dimanche"] },
  { title: "Budget", values: ["€", "€€", "€€€"] },
  { title: "Confort", values: ["Adapté aux familles", "Terrasse", "Wifi", "Parking", "Accessible PMR", "Menu enfant"] },
];

const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const serviceMap = (brunch: Brunch): Record<string, boolean | undefined> => ({
  "Sur place": brunch.services.dineIn, "À emporter": brunch.services.takeaway, Livraison: brunch.services.delivery,
  "Click & Collect": brunch.services.clickCollect, Réservation: brunch.services.reservation,
  "Adapté aux familles": brunch.amenities.family, Terrasse: brunch.amenities.terrace, Wifi: brunch.amenities.wifi,
  Parking: brunch.amenities.parking, "Accessible PMR": brunch.amenities.accessible, "Menu enfant": brunch.amenities.kidsMenu,
});

function BrunchCard({ brunch, onOpen }: { brunch: Brunch; onOpen: () => void }) {
  const entity = { id: `brunch-${brunch.slug}`, title: brunch.name, url: `/food/brunch/${brunch.slug}`, text: `${brunch.name} · ${brunch.address ?? "Paris"}` };
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
        <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold backdrop-blur">Voir les horaires</span>
      </button>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><button onClick={onOpen} className="text-left"><h2 className="text-xl font-semibold tracking-[-.035em]">{brunch.name}</h2></button><p className="mt-1 text-xs text-ink/40">{brunch.cuisine}</p></div>
          <LikeButton entity={entity} className="grid size-9 place-items-center rounded-full bg-cream transition hover:bg-[#a54b4b] hover:text-white" />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5 text-[10px]"><span className="rounded-full bg-sage px-2.5 py-1.5 font-semibold text-moss">{brunch.kosherType}</span>{brunch.price && <span className="rounded-full bg-cream px-2.5 py-1.5">{brunch.price}</span>}{brunch.certification && <span className="rounded-full bg-cream px-2.5 py-1.5">✡ {brunch.certification}</span>}</div>
        <div className="mt-3"><CustomerRating rating={brunch.rating} reviewCount={brunch.reviewCount} /></div>
        {(brunch.address || brunch.arrondissement) && <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink/50"><MapPin size={13} className="mt-0.5 shrink-0" />{brunch.address}{brunch.arrondissement && ` · Paris ${brunch.arrondissement}e`} · {brunch.distanceKm} km</p>}
        {brunch.phone && <p className="mt-2 flex items-center gap-2 text-xs text-ink/50"><Phone size={13} />{brunch.phone}</p>}
        <div className="mt-4 grid grid-cols-5 gap-1.5 border-t border-black/[.06] pt-4">{services.map(({ label, value, icon: Icon }) => <div key={label} title={label} className={`grid place-items-center gap-1 rounded-xl py-2 text-center text-[8px] ${value ? "bg-sage text-moss" : "bg-cream text-ink/25"}`}><Icon size={13} /><span className="line-clamp-1">{label}</span></div>)}</div>
        <button onClick={onOpen} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-xs font-semibold text-white">Voir la fiche <ArrowRight size={14} /></button>
      </div>
    </article>
  );
}

export function BrunchExplorer({ initialBrunches }: { initialBrunches: Brunch[] }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState("Les plus proches");
  const [view, setView] = useState<"list" | "map">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Brunch | null>(null);
  const [detailBrunch, setDetailBrunch] = useState<Brunch | null>(null);
  const toggleFilter = (value: string) => setFilters((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const results = useMemo(() => {
    const q = fold(query);
    const typeTags = groups[1].values;
    const kosher = groups[2].values;
    const services = [...groups[3].values, ...groups[6].values];
    let list = initialBrunches.filter((brunch) => {
      if (q && !fold(`${brunch.name} ${brunch.address ?? ""} ${brunch.arrondissement ?? ""} ${brunch.cuisine} ${brunch.specialty}`).includes(q)) return false;
      const chosenTypes = filters.filter((item) => typeTags.includes(item));
      if (chosenTypes.length && !chosenTypes.some((item) => fold(`${brunch.specialty} ${brunch.tags.join(" ")}`).includes(fold(item)))) return false;
      const chosenKosher = filters.filter((item) => kosher.includes(item));
      if (chosenKosher.length && !chosenKosher.includes(brunch.kosherType)) return false;
      if (filters.filter((item) => services.includes(item)).some((item) => serviceMap(brunch)[item] !== true)) return false;
      if (filters.includes("À moins de 2 km") && brunch.distanceKm >= 2) return false;
      if (filters.includes("À moins de 5 km") && brunch.distanceKm >= 5) return false;
      if (filters.includes("À moins de 10 km") && brunch.distanceKm >= 10) return false;
      if (filters.some((item) => ["€", "€€", "€€€"].includes(item)) && !filters.includes(brunch.price ?? "")) return false;
      if (filters.includes("Ouvert le dimanche") && !brunch.hours.dimanche) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "Ordre alphabétique") return a.name.localeCompare(b.name, "fr");
      if (sort === "Prix croissant") return (a.price?.length ?? 9) - (b.price?.length ?? 9);
      if (sort === "Prix décroissant") return (b.price?.length ?? 0) - (a.price?.length ?? 0);
      if (sort === "Les mieux notés") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === "Les plus populaires") return b.reviewCount - a.reviewCount;
      if (sort === "Les nouveautés") return b.importedAt.localeCompare(a.importedAt);
      return a.distanceKm - b.distanceKm;
    });
  }, [initialBrunches, query, filters, sort]);

  return (
    <>
      <section className="page-shell pt-6"><div className="relative overflow-hidden rounded-[2rem] bg-[#dfe9e2] px-6 py-10 sm:px-10"><Coffee className="text-moss" size={26} /><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-moss/55">Food · Paris</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Brunch casher</h1><p className="mt-3 text-sm text-ink/45">8 adresses importées depuis votre catalogue</p><div className="mt-7 flex max-w-3xl items-center rounded-2xl bg-white p-2 shadow-soft"><Search size={18} className="ml-3 text-ink/30" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, adresse, arrondissement, cuisine…" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />{query && <button onClick={() => setQuery("")} className="p-2"><X size={15} /></button>}</div></div></section>
      <section className="page-shell py-6"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex gap-2"><button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-semibold lg:hidden"><Filter size={14} /> Filtres {filters.length ? `(${filters.length})` : ""}</button><div className="flex rounded-xl bg-white p-1"><button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${view === "list" ? "bg-ink text-white" : ""}`}><List size={14} /> Liste</button><button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${view === "map" ? "bg-ink text-white" : ""}`}><Map size={14} /> Carte</button></div></div><label className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs"><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent outline-none">{["Les plus proches", "Les mieux notés", "Les plus populaires", "Les nouveautés", "Prix croissant", "Prix décroissant", "Ordre alphabétique"].map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label></div></section>
      <section className="page-shell pb-20"><div className="grid items-start gap-5 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_430px]">
        <aside className={`${filterOpen ? "fixed inset-0 z-[70] overflow-y-auto bg-cream p-6" : "hidden"} lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:rounded-[1.75rem] lg:bg-white lg:p-5`}><div className="flex items-center justify-between"><p className="font-semibold">Filtres</p><div className="flex gap-3">{filters.length > 0 && <button onClick={() => setFilters([])} className="text-[10px] font-semibold text-moss">Tout effacer</button>}<button onClick={() => setFilterOpen(false)} className="lg:hidden"><X size={18} /></button></div></div>{groups.map((group) => <div key={group.title} className="border-b border-black/[.06] py-5"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-ink/40">{group.title}</p><div className="flex flex-wrap gap-2">{group.values.map((value) => <button key={value} onClick={() => toggleFilter(value)} className={`rounded-full border px-3 py-2 text-[11px] transition ${filters.includes(value) ? "border-ink bg-ink text-white" : "border-black/10"}`}>{value}</button>)}</div></div>)}<button onClick={() => setFilterOpen(false)} className="sticky bottom-2 mt-4 w-full rounded-xl bg-ink py-3 text-xs font-semibold text-white lg:hidden">Voir {results.length} résultats</button></aside>
        <div className={view === "map" ? "hidden xl:block" : ""}><p className="mb-4 text-sm font-semibold">{results.length} brunch{results.length > 1 ? "s" : ""}</p>{results.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{results.map((brunch) => <BrunchCard key={brunch.slug} brunch={brunch} onOpen={() => setDetailBrunch(brunch)} />)}</div> : <div className="grid min-h-80 place-items-center rounded-[2rem] bg-white"><div className="text-center"><Search className="mx-auto text-ink/20" /><p className="mt-3 font-semibold">Aucun brunch trouvé</p><button onClick={() => { setFilters([]); setQuery(""); }} className="mt-2 text-xs font-semibold text-moss">Réinitialiser</button></div></div>}</div>
        <div className={`${view === "map" ? "block" : "hidden xl:block"}`}><div className="sticky top-24 h-[calc(100vh-7rem)] min-h-[560px] overflow-hidden rounded-[2rem] bg-[#dfe6df]"><div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(35deg,transparent 46%,#fff 47%,#fff 51%,transparent 52%),linear-gradient(108deg,transparent 47%,#fff 48%,#fff 51%,transparent 52%)", backgroundSize: "110px 90px" }} /><span className="absolute left-5 top-5 rounded-xl bg-white/90 px-4 py-2 text-xs font-semibold shadow-sm">Paris · {results.length} brunchs</span>{results.map((brunch, index) => <button key={brunch.slug} onClick={() => setSelected(brunch)} style={{ left: `${16 + (index * 19) % 70}%`, top: `${22 + (index * 23) % 62}%` }} className="absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-moss text-[10px] font-bold text-white shadow-lg transition hover:scale-125">{index + 1}</button>)}{selected && <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white p-4 shadow-2xl"><button onClick={() => setSelected(null)} className="absolute right-3 top-3"><X size={14} /></button><p className="font-semibold">{selected.name}</p><p className="mt-1 text-xs text-ink/45">{selected.address || "Adresse non renseignée"} · {selected.distanceKm} km</p><button onClick={() => setDetailBrunch(selected)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-moss">Ouvrir la fiche <ArrowRight size={13} /></button></div>}</div></div>
      </div></section>
      <EntityDrawer open={!!detailBrunch} onClose={() => setDetailBrunch(null)} title={detailBrunch?.name ?? "Brunch"}>
        {detailBrunch && <div><div className="relative aspect-[16/10]"><img src={assetPath(detailBrunch.images[0])} alt="" className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" /><div className="absolute bottom-5 left-5 text-white"><p className="text-xs text-white/55">{detailBrunch.cuisine}</p><h2 className="mt-1 text-3xl font-semibold">{detailBrunch.name}</h2></div></div><div className="space-y-6 p-6"><CustomerRating rating={detailBrunch.rating} reviewCount={detailBrunch.reviewCount} /><EntityActions entity={{ id: `brunch-${detailBrunch.slug}`, title: detailBrunch.name, url: `/food/brunch/${detailBrunch.slug}`, text: `${detailBrunch.name} · ${detailBrunch.address ?? "Paris"}` }} /><p className="text-sm leading-7 text-ink/55">{detailBrunch.description}</p><div className="flex flex-wrap gap-2">{detailBrunch.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-2 text-xs">{tag}</span>)}</div><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Adresse</p><p className="mt-2 text-sm">{detailBrunch.address || "Adresse en cours de vérification"}</p></div><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Horaires</p><div className="mt-2 rounded-2xl bg-white">{Object.entries(detailBrunch.hours).map(([day, value]) => <div key={day} className="flex justify-between border-b border-black/[.05] px-4 py-3 text-xs last:border-0"><span className="capitalize text-ink/50">{day}</span><span>{value || "Non renseigné"}</span></div>)}</div></div></div></div>}
      </EntityDrawer>
    </>
  );
}
