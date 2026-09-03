"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LayoutGrid, Map, Search } from "lucide-react";
import { searchEstablishments, type EstablishmentSearchResult } from "@/lib/search/search-service";
import { InteractiveMap, type MapEstablishment } from "@/components/map/interactive-map";
import { quickSuggestions } from "@/components/search/ai-search";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";

export function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [results, setResults] = useState<EstablishmentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedMapItem, setSelectedMapItem] = useState<MapEstablishment | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [kosherFilter, setKosherFilter] = useState("Tous");

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setActiveQuery(q);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const run = async () => {
      if (!activeQuery.trim()) {
        const defaultResults = await searchEstablishments("restaurant", { limit: 50 });
        if (active) {
          setResults(defaultResults);
          setLoading(false);
        }
        return;
      }

      const found = await searchEstablishments(activeQuery, { limit: 100 });
      if (active) {
        setResults(found);
        setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [activeQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveQuery(query.trim());
    router.replace(`/recherche?q=${encodeURIComponent(query.trim())}`);
  };

  // Extraire les catégories disponibles dans les résultats
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    results.forEach((r) => {
      if (r.category) cats.add(r.category);
    });
    return ["Tous", ...Array.from(cats)];
  }, [results]);

  // Filtrage
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      if (categoryFilter !== "Tous" && item.category !== categoryFilter) return false;
      if (kosherFilter !== "Tous") {
        const itemKosher = item.filters?.kosherType || item.establishment?.kosherType || "";
        if (!itemKosher.toLowerCase().includes(kosherFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [results, categoryFilter, kosherFilter]);

  // Transformation pour la carte interactive Leaflet
  const mapItems = useMemo<MapEstablishment[]>(() => {
    return filteredResults
      .filter((r) => r.location?.latitude && r.location?.longitude)
      .map((r) => ({
        id: r.id,
        name: r.title,
        address: r.subtitle,
        arrondissement: r.location?.arrondissement,
        latitude: r.location!.latitude!,
        longitude: r.location!.longitude!,
        image: r.image,
        cuisine: r.subcategory || r.category,
        kosherType: r.filters?.kosherType,
        href: r.href,
        phone: r.establishment?.phone,
      }));
  }, [filteredResults]);

  return (
    <div className="min-h-[100dvh] bg-[#f8f9f6] pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Barre de recherche supérieure */}
        <div className="rounded-[2.2rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSearchSubmit} className="relative flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/35" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un restaurant, un brunch, un tag (ex: bassari, halavi, paris 17)..."
                className="w-full rounded-2xl border border-black/10 bg-cream/70 py-4 pl-12 pr-4 text-[16px] sm:text-base font-semibold text-ink outline-none transition focus:border-moss/50 focus:bg-white focus:ring-4 focus:ring-moss/10"
              />
            </div>
            <button
              type="submit"
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-ink px-8 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-moss"
            >
              <Search size={17} />
              Rechercher
            </button>
          </form>

          {/* Suggestions rapides */}
          <div className="mt-4 flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-ink/40">Suggestions :</span>
            {quickSuggestions.map((sug) => (
              <button
                key={sug.label}
                type="button"
                onClick={() => {
                  setQuery(sug.query);
                  setActiveQuery(sug.query);
                  router.replace(`/recherche?q=${encodeURIComponent(sug.query)}`);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeQuery.toLowerCase() === sug.query.toLowerCase()
                    ? "bg-moss text-white shadow-xs"
                    : "bg-cream text-ink/75 hover:bg-moss/10 hover:text-moss"
                }`}
              >
                {sug.label}
              </button>
            ))}
          </div>
        </div>

        {/* Titre et contrôles de vue */}
        <div className="mt-8 flex flex-col justify-between gap-4 border-b border-black/5 pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {loading ? (
                "Recherche en cours…"
              ) : (
                <>
                  Résultats pour <span className="text-moss">« {activeQuery || "Toutes les adresses"} »</span>
                  <span className="ml-3 text-lg font-normal text-ink/40">
                    ({filteredResults.length} {filteredResults.length > 1 ? "adresses trouvées" : "adresse trouvée"})
                  </span>
                </>
              )}
            </h1>
            <p className="mt-1 text-xs text-ink/50">
              Toutes les fiches et adresses correspondant à votre mot-clé ou tag de recherche.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                view === "list"
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-ink/70 hover:bg-cream"
              }`}
            >
              <LayoutGrid size={15} />
              Grille ({filteredResults.length})
            </button>
            <button
              type="button"
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                view === "map"
                  ? "bg-ink text-white shadow-sm"
                  : "bg-white text-ink/70 hover:bg-cream"
              }`}
            >
              <Map size={15} />
              Carte interactive
            </button>
          </div>
        </div>

        {/* Filtres de catégorie & type cacher */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/35">Catégorie :</span>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  categoryFilter === cat
                    ? "bg-ink text-white shadow-xs"
                    : "bg-white text-ink/70 hover:bg-cream"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/35">Cacher :</span>
            {["Tous", "Bassari", "Halavi", "Parvé", "No Teouda / Friendly"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setKosherFilter(type)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  kosherFilter === type
                    ? "bg-moss text-white shadow-xs"
                    : "bg-white text-ink/70 hover:bg-cream"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu : Liste ou Carte */}
        {loading ? (
          <div className="mt-12 flex flex-col items-center justify-center py-20 text-center">
            <div className="size-10 animate-spin rounded-full border-4 border-moss/20 border-t-moss" />
            <p className="mt-4 text-sm font-semibold text-ink/60">Recherche des adresses correspondantes…</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-black/5 bg-white p-12 text-center shadow-xs">
            <Search className="mx-auto size-12 text-ink/20" />
            <h3 className="mt-4 text-xl font-bold text-ink">Aucun résultat trouvé pour « {activeQuery} »</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/50">
              Essayez une autre recherche comme <strong>bassari</strong>, <strong>halavi</strong>, <strong>17e</strong>, <strong>brunch</strong> ou parcourez nos catégories.
            </p>
          </div>
        ) : view === "map" ? (
          <div className="mt-8 overflow-hidden rounded-3xl border border-black/5 shadow-soft">
            <InteractiveMap
              items={mapItems}
              selectedItem={selectedMapItem}
              onSelect={setSelectedMapItem}
              onOpenDetail={(item) => {
                const found = filteredResults.find((r) => r.id === item.id);
                if (found?.href) {
                  router.push(found.href);
                } else if (found?.establishment) {
                  const est = found.establishment;
                  const rubric = est.rubricId || "food";
                  const sub = est.subrubricId || "";
                  const cleanSub = sub.startsWith(`${rubric}-`) ? sub.slice(rubric.length + 1) : sub;
                  router.push(`/${rubric}/${cleanSub || "decouverte"}#${est.slug || est.id}`);
                }
              }}
              className="h-[650px] w-full"
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((result, index) => {
              const establishment =
                result.establishment ?? {
                  id: result.id,
                  rubricId: result.category ? result.category.toLowerCase() : "food",
                  subrubricId: result.subcategory ? result.subcategory.toLowerCase() : "",
                  mainPhoto: result.image || "/images/food/restaurants-khan.jpg",
                  photos: [],
                  name: result.title,
                  slug: result.id,
                  shortDescription: result.subtitle || "",
                  description: result.subtitle || "",
                  address: result.subtitle || "",
                  city: result.location?.city || "Paris",
                  arrondissement: result.location?.arrondissement ? `${result.location.arrondissement}e` : "",
                  postalCode: result.location?.postalCode || "",
                  country: "France",
                  email: "",
                  phone: "",
                  whatsapp: "",
                  instagram: "",
                  website: "",
                  hours: "",
                  terrace: result.filters?.terrace ?? false,
                  delivery: result.filters?.delivery ?? false,
                  takeaway: result.filters?.takeaway ?? false,
                  reservation: result.filters?.reservation ?? false,
                  privateHire: false,
                  certification: result.filters?.certification || "",
                  kosherType: (result.filters?.kosherType || "À compléter") as EstablishmentRecord["kosherType"],
                  averagePrice: result.filters?.price || "",
                  latitude: result.location?.latitude ? String(result.location.latitude) : "",
                  longitude: result.location?.longitude ? String(result.location.longitude) : "",
                  status: "Publié",
                  visible: true,
                  sponsorshipLevel: result.ranking?.sponsored ? "Featured" : "Standard",
                  sponsored: result.ranking?.sponsored ?? false,
                  sponsorPriority: 0,
                  sponsorDuration: "",
                  reservationTarget: "",
                  cuisineTypes: result.keywords ?? [],
                  order: 0,
                  customerSearches: result.customerSearches ?? [],
                  visibleTagIds: result.keywords ?? [],
                  fieldVisibility: {},
                };

              return (
                <UniversalEstablishmentCard
                  key={result.id}
                  establishment={establishment}
                  priorityImage={index < 3}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
