"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronRight, Heart, LayoutGrid, Map, MapPin,
  Navigation, Phone, Search,
} from "lucide-react";
import { searchEstablishments, type EstablishmentSearchResult } from "@/lib/search/search-service";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";
import { InteractiveMap, type MapEstablishment } from "@/components/map/interactive-map";
import { assetPath } from "@/lib/assets";
import { quickSuggestions } from "@/components/search/ai-search";
import { getLocalFavorites, toggleFavorite, favoritesChangedEvent } from "@/lib/favorites/favorites-service";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { getEstablishmentGoogleBusiness } from "@/lib/google-places";

export function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [results, setResults] = useState<EstablishmentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [selectedEstablishment, setSelectedEstablishment] = useState<EstablishmentRecord | null>(null);
  const [selectedMapItem, setSelectedMapItem] = useState<MapEstablishment | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [kosherFilter, setKosherFilter] = useState("Tous");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(getLocalFavorites());
    const onFavChange = () => setFavorites(getLocalFavorites());
    window.addEventListener(favoritesChangedEvent, onFavChange);
    return () => window.removeEventListener(favoritesChangedEvent, onFavChange);
  }, []);

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

  const handleToggleFav = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(id);
    setFavorites(getLocalFavorites());
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
    <div className="min-h-screen bg-[#f8f9f6] pb-24 pt-8">
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
                className="w-full rounded-2xl border border-black/10 bg-cream/70 py-4 pl-12 pr-4 text-base font-semibold text-ink outline-none transition focus:border-moss/50 focus:bg-white focus:ring-4 focus:ring-moss/10"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-8 py-4 text-sm font-semibold text-white shadow-md transition hover:bg-moss"
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
                if (found?.establishment) {
                  setSelectedEstablishment(found.establishment);
                } else if (found?.href) {
                  router.push(found.href);
                }
              }}
              className="h-[650px] w-full"
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((result) => {
              const googleData = getEstablishmentGoogleBusiness(result.title);
              const isFav = favorites.includes(result.id);

              return (
                <article
                  key={result.id}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-black/[.06] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
                >
                  {/* Image & Badges */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-sage">
                    <img
                      src={assetPath(result.image || "/images/food/restaurants-khan.jpg")}
                      alt={result.title}
                      className="size-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink shadow-xs backdrop-blur">
                          {result.subcategory || result.category}
                        </span>
                        {result.filters?.kosherType && (
                          <span className="rounded-full bg-moss px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                            {result.filters.kosherType}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFav(result.id, e)}
                        className="grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110"
                        aria-label="Favoris"
                      >
                        <Heart size={16} className={isFav ? "fill-rose-500 text-rose-500" : "text-ink/60"} />
                      </button>
                    </div>

                    {/* Statut d'ouverture live */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur">
                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                        {googleData.openNow ? "Ouvert en direct" : "Fermé"}
                      </span>
                      {result.ranking?.sponsored && (
                        <span className="rounded-full bg-[#f6ecd9] px-2.5 py-1 text-[10px] font-bold text-[#8f6424] shadow-xs">
                          Sponsorisé
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (result.establishment) {
                            setSelectedEstablishment(result.establishment);
                          } else if (result.href) {
                            router.push(result.href);
                          }
                        }}
                        className="text-left"
                      >
                        <h2 className="text-xl font-bold tracking-tight text-ink transition group-hover:text-moss">
                          {result.title}
                        </h2>
                      </button>
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
                      <MapPin size={13} className="shrink-0 text-ink/35" />
                      <span className="truncate">{result.subtitle}</span>
                    </p>

                    {/* Google Business Rating */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded-lg border border-black/5 bg-cream/80 px-2 py-1 text-xs font-bold text-ink">
                        <svg className="size-3 shrink-0" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        <span>{googleData.rating}</span>
                        <span className="text-amber-500">★</span>
                      </div>
                      <span className="text-xs text-ink/40 font-medium">({googleData.userRatingsTotal} avis Google)</span>
                    </div>

                    {/* Extrait d'avis client */}
                    {googleData.reviews[0] && (
                      <p className="mt-3 line-clamp-2 text-xs italic leading-relaxed text-ink/65">
                        &ldquo;{googleData.reviews[0].text}&rdquo;
                      </p>
                    )}

                    {/* Boutons d'action */}
                    <div className="mt-6 flex items-center gap-2 border-t border-black/5 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (result.establishment) {
                            setSelectedEstablishment(result.establishment);
                          } else if (result.href) {
                            router.push(result.href);
                          }
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-xs font-semibold text-white transition hover:bg-moss"
                      >
                        Voir la fiche <ChevronRight size={14} />
                      </button>
                      <a
                        href={googleData.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid size-9 place-items-center rounded-xl bg-cream text-ink/75 transition hover:bg-moss/10 hover:text-moss"
                        title="Google Maps"
                      >
                        <Navigation size={14} className="text-[#4285F4]" />
                      </a>
                      <a
                        href={result.location?.latitude && result.location?.longitude
                          ? `https://waze.com/ul?ll=${result.location.latitude},${result.location.longitude}&navigate=yes`
                          : `https://waze.com/ul?q=${encodeURIComponent(result.subtitle || result.title)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid size-9 place-items-center rounded-xl bg-cream text-ink/75 transition hover:bg-moss/10 hover:text-moss"
                        title="Waze"
                      >
                        <span className="text-xs font-bold text-[#33CCFF]">W</span>
                      </a>
                      {result.establishment?.phone && (
                        <a
                          href={`tel:${result.establishment.phone.replace(/\s/g, "")}`}
                          className="grid size-9 place-items-center rounded-xl bg-cream text-ink/75 transition hover:bg-moss/10 hover:text-moss"
                          title="Appeler"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Tiroir d'établissement complet */}
      <EstablishmentDetailDrawer
        establishment={selectedEstablishment}
        open={Boolean(selectedEstablishment)}
        onClose={() => setSelectedEstablishment(null)}
      />
    </div>
  );
}
