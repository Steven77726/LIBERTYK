"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Globe, MapPin, Phone, Search, Sparkles, Star, X } from "lucide-react";
import { searchGooglePlaces, type GooglePlaceDetails } from "@/lib/google-places";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  onApply: (data: GooglePlaceDetails) => void;
};

const SUGGESTIONS = [
  "Khan",
  "Le Marceau 17e",
  "Doron Niel",
  "Bloomy Brunch",
  "Chez Isaac",
  "Kavod",
  "Chlew",
  "Benson Kfé",
  "Flavio",
  "Gabrielli",
  "Azamra",
  "Winess",
];

export function GoogleSyncModal({ isOpen, onClose, initialQuery, onApply }: Props) {
  const [query, setQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GooglePlaceDetails[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceDetails | null>(null);

  const runSearch = async (searchTerm: string) => {
    setLoading(true);
    try {
      const places = await searchGooglePlaces(searchTerm);
      setResults(places);
      if (places.length > 0) {
        setSelectedPlace(places[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const targetQuery = initialQuery || "";
      setQuery(targetQuery);
      runSearch(targetQuery);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleSearch = () => {
    runSearch(query);
  };

  const handleApply = (place: GooglePlaceDetails) => {
    onApply(place);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-cream shadow-2xl">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b border-black/[.06] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#d5bb7d]/30 to-[#8fa98d]/30 text-ink">
              <Sparkles size={20} className="text-moss" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink">
                Synchronisation Google Business & Places
              </h2>
              <p className="text-xs text-ink/50">
                Importez automatiquement photos, avis, notes, horaires et coordonnées réelles.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-cream text-ink/50 transition hover:bg-ink hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Barre de recherche Google & Suggestions rapides */}
        <div className="border-b border-black/[.06] bg-white/70 p-5 space-y-3">
          <div className="flex gap-2">
            <div className="flex flex-1 items-center rounded-2xl border border-black/10 bg-white px-4 py-2.5 shadow-sm">
              <Search size={18} className="text-ink/30" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nom du restaurant ou commerce (ex: Le Marceau 17e, Bloomy Brunch, Doron Niel...)"
                className="ml-2 w-full bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink/35"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-ink px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-moss disabled:opacity-50"
            >
              {loading ? "Recherche…" : "Rechercher sur Google"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink/40 mr-1">Raccourcis :</span>
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuery(item);
                  runSearch(item);
                }}
                className="rounded-full bg-white border border-black/5 px-2.5 py-1 text-[11px] font-medium text-ink/75 shadow-2xs transition hover:bg-moss hover:text-white"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu & Aperçu des données Google */}
        <div className="overflow-y-auto p-6">
          {results.length === 0 ? (
            <div className="grid min-h-60 place-items-center rounded-3xl border border-dashed border-black/10 bg-white/50 p-8 text-center">
              <div>
                <Sparkles size={32} className="mx-auto text-moss/40" />
                <p className="mt-3 font-semibold text-ink">Recherchez un établissement</p>
                <p className="mt-1 max-w-md text-xs text-ink/45">
                  Tapez le nom de l’établissement ci-dessus ou cliquez sur un raccourci pour prévisualiser et importer toutes les informations de sa fiche Google Maps.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              {/* Liste des résultats trouvés */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
                  Établissements trouvés ({results.length})
                </p>
                {results.map((place) => (
                  <button
                    key={place.placeId}
                    type="button"
                    onClick={() => setSelectedPlace(place)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition ${
                      selectedPlace?.placeId === place.placeId
                        ? "border-2 border-moss bg-white shadow-md"
                        : "border border-black/5 bg-white/70 hover:bg-white"
                    }`}
                  >
                    {place.photos && place.photos.length > 0 && (
                      <img
                        src={place.photos[0]}
                        alt=""
                        className="size-12 shrink-0 rounded-xl object-cover shadow-2xs"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-bold text-ink">{place.name}</span>
                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                          <Star size={11} className="fill-amber-500 text-amber-500" /> {place.rating}
                        </span>
                      </div>
                      <p className="truncate text-xs text-ink/50">{place.formattedAddress}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Aperçu détaillé de la fiche Google sélectionnée */}
              {selectedPlace && (
                <div className="space-y-5 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-ink">{selectedPlace.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/50">
                        <MapPin size={13} className="text-moss" /> {selectedPlace.formattedAddress}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 px-3 py-1.5 text-center">
                      <div className="flex items-center gap-1 text-sm font-bold text-amber-800">
                        <Star size={14} className="fill-amber-500 text-amber-500" /> {selectedPlace.rating} / 5
                      </div>
                      <p className="text-[10px] text-amber-700/70">{selectedPlace.userRatingsTotal} avis Google</p>
                    </div>
                  </div>

                  {/* Galerie Photos Google */}
                  {selectedPlace.photos.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">
                        Photos Google Business ({selectedPlace.photos.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedPlace.photos.slice(0, 3).map((photo, i) => (
                          <img
                            key={`${photo}-${i}`}
                            src={photo}
                            alt=""
                            className="aspect-square w-full rounded-xl object-cover shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Avis clients récents Google */}
                  {selectedPlace.reviews.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">
                        Derniers avis clients Google
                      </p>
                      <div className="space-y-2">
                        {selectedPlace.reviews.map((rev, i) => (
                          <div key={i} className="rounded-2xl bg-cream/70 p-3 text-xs">
                            <div className="flex items-center justify-between font-semibold">
                              <span>{rev.author}</span>
                              <span className="flex items-center gap-0.5 text-amber-600">
                                <Star size={11} className="fill-amber-500" /> {rev.rating}★ · {rev.relativeTime}
                              </span>
                            </div>
                            <p className="mt-1 italic text-ink/65">&ldquo;{rev.text}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coordonnées & Horaires */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-cream/50 p-3 text-xs text-ink/70">
                      <p className="font-semibold text-ink">Contact & GPS</p>
                      <p className="mt-1 flex items-center gap-1.5"><Phone size={12} /> {selectedPlace.phone || "Non renseigné"}</p>
                      <p className="mt-1 flex items-center gap-1.5"><Globe size={12} /> {selectedPlace.website || "Non renseigné"}</p>
                      <p className="mt-1">GPS : {selectedPlace.latitude.toFixed(4)}, {selectedPlace.longitude.toFixed(4)}</p>
                    </div>

                    <div className="rounded-2xl bg-cream/50 p-3 text-xs text-ink/70">
                      <p className="font-semibold text-ink flex items-center gap-1"><Clock size={12} /> Horaires Google</p>
                      <p className="mt-1">Dimanche : {selectedPlace.openingHours.dimanche || "Fermé"}</p>
                      <p className="mt-0.5">Semaine : {selectedPlace.openingHours.lundi || "12:00 - 23:00"}</p>
                    </div>
                  </div>

                  {/* Bouton d'application */}
                  <button
                    type="button"
                    onClick={() => handleApply(selectedPlace)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#101a15,#2a4638)] py-3.5 text-xs font-bold text-white shadow-lg transition hover:scale-[1.01]"
                  >
                    <Check size={16} /> Appliquer ces données à la fiche Liberty
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
