"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Sparkles, ArrowRight } from "lucide-react";
import {
  parseConciergeIntent,
  generateConciergeResponse,
  executeConciergeSearch,
  type ConciergeCriteria,
} from "@/lib/concierge/intent-parser";
import type { EstablishmentSearchResult } from "@/lib/search/search-service";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { trackEvent } from "@/lib/client-store";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";

const rotatingExamples = [
  "Rechercher un restaurant, traiteur, boutique, service…",
  "Trouve-moi un resto bassari dans le 17e",
  "David Abitbol trompe l'œil",
  "Une coiffeuse à domicile dans le 16e",
  "Un brunch ouvert dimanche",
  "Pâtisserie Korcarz ou Boaz",
  "Barbanegra terrasse festive",
  "Un caviste cacher pour shabbat",
  "Chichi Paris salle de réception",
];

export const quickSuggestions = [
  { label: "📍 Près de moi", query: "Près de moi" },
  { label: "🕒 Ouvert maintenant", query: "Ouvert maintenant" },
  { label: "🥩 Bassari 17e", query: "Restaurant bassari 17e" },
  { label: "🍰 Pâtisseries fines", query: "Pâtisserie" },
  { label: "💇‍♀️ Coiffure & Beauté", query: "Coiffeuse à domicile" },
  { label: "🥐 Brunch dimanche", query: "Brunch ouvert dimanche" },
  { label: "🎉 Sorties & Fêtes", query: "Sorties terrasse festive" },
  { label: "🍷 Cavistes & Vins", query: "Caviste vin casher" },
];

export function AiSearch({ showChips = true }: { showChips?: boolean }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [conciergeMessage, setConciergeMessage] = useState<string>("");
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [sessionCriteria, setSessionCriteria] = useState<Partial<ConciergeCriteria>>({});

  const [results, setResults] = useState<EstablishmentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Le menu reste ancré tant que le champ est focus ou qu'il y a du texte saisi ou des résultats
  const open = (focused || query.trim().length >= 1) && (query.trim().length >= 1 || results.length > 0 || loading);

  const updateDropdownPosition = useCallback(() => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportPadding = 16;
    setDropdownRect({
      left: Math.max(viewportPadding, rect.left),
      top: rect.bottom + 10,
      width: Math.min(rect.width, window.innerWidth - viewportPadding * 2),
    });
  }, []);

  // Exécution de la recherche avec annulation automatique des requêtes en vol (AbortController)
  const runConciergeQuery = useCallback(
    async (rawQuery: string, overrideCoords?: { latitude: number; longitude: number }) => {
      const trimmed = rawQuery.trim();
      if (!trimmed || trimmed.length < 2) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        setResults([]);
        setLoading(false);
        setError("");
        setConciergeMessage("");
        return;
      }

      // Annuler la requête précédente si elle est encore en vol
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      setLoading(true);
      setError("");

      try {
        // 1. Analyse d'intention sémantique
        const parsedCriteria = parseConciergeIntent(trimmed, sessionCriteria);
        setSessionCriteria((prev) => ({ ...prev, ...parsedCriteria }));

        // 2. Traitement géolocalisation si demandée
        let coordsToUse = overrideCoords || userCoords;
        if (parsedCriteria.nearMe && !coordsToUse && typeof navigator !== "undefined" && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            coordsToUse = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setUserCoords(coordsToUse);
          } catch {
            // Refus de géolocalisation ou timeout
          }
        }

        if (controller.signal.aborted) return;

        // 3. Exécution de la recherche avec signal d'annulation
        const nextResults = await executeConciergeSearch(parsedCriteria, coordsToUse, {
          signal: controller.signal,
          limit: 50,
        });

        if (requestRef.current === requestId && !controller.signal.aborted) {
          setResults(nextResults);

          // 4. Formulation de la réponse
          const responseText = generateConciergeResponse(parsedCriteria, nextResults.length);
          setConciergeMessage(responseText);

          trackEvent("liberty_search_query", trimmed, `${nextResults.length}_results`);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return; // Requête annulée normalement par une frappe plus récente
        }
        if (requestRef.current === requestId) {
          setResults([]);
          setError("Recherche momentanément indisponible.");
          setConciergeMessage("Une erreur est survenue lors de la recherche.");
        }
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [sessionCriteria, userCoords]
  );

  // Déclencheur chips / suggestions
  const handleChipClick = (chipQuery: string) => {
    setQuery(chipQuery);
    setFocused(true);
    inputRef.current?.focus();

    if (chipQuery === "Près de moi" && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setUserCoords(coords);
          void runConciergeQuery(chipQuery, coords);
        },
        () => {
          void runConciergeQuery("restaurant paris");
        }
      );
      return;
    }

    void runConciergeQuery(chipQuery);
  };

  // Déclencheur saisie clavier
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setQuery(value);
    setFocused(true);
    if (value.trim().length < 2) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setResults([]);
      setLoading(false);
      setError("");
      setConciergeMessage("");
    }
  };

  const clearSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setQuery("");
    setResults([]);
    setLoading(false);
    setError("");
    setConciergeMessage("");
    setSessionCriteria({});
    inputRef.current?.focus();
  };

  // Validation manuelle (Entrée ou clic sur la loupe)
  const submit = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    void runConciergeQuery(trimmed);
  };

  useEffect(() => {
    const timer = window.setInterval(() => setExampleIndex((idx) => (idx + 1) % rotatingExamples.length), 4000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Exécution instantanée (0ms) sur la frappe textuelle sans aucun délai artificiel
  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const timer = window.setTimeout(() => {
      void runConciergeQuery(query);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [query, runConciergeQuery]);

  // Ancrage d'état : Détection de clic à l'extérieur sans fermer inopportunément
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setFocused(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  // Repositionnement dynamique fluide
  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  return (
    <div ref={rootRef} className="relative z-30 mx-auto mt-4 w-full max-w-3xl">
      {/* Barre de recherche optimisée & fluide (zéro vocal) */}
      <div
        className={`group relative flex items-center gap-2 rounded-[2rem] border bg-white/[0.98] p-2 sm:p-2.5 shadow-[0_24px_80px_rgba(0,0,0,.40)] backdrop-blur-2xl transition-all duration-300 ${
          focused
            ? "border-[#d5bb7d] shadow-[0_32px_110px_rgba(0,0,0,.50),0_0_0_6px_rgba(213,187,125,.14)]"
            : "border-white/30 hover:border-white/60"
        }`}
      >
        {/* Icône de recherche décorative intégrée */}
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cream/80 text-ink/70 sm:size-11">
          <Search size={18} strokeWidth={2.3} />
        </div>

        {/* Champ de saisie fluide */}
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onFocus={() => {
              setFocused(true);
              updateDropdownPosition();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") {
                setFocused(false);
              }
            }}
            aria-label="Rechercher sur Liberty K"
            placeholder={rotatingExamples[exampleIndex]}
            type="search"
            inputMode="search"
            autoComplete="off"
            className="w-full bg-transparent px-1 text-[15px] font-semibold text-ink outline-hidden placeholder:font-normal placeholder:text-ink/40 sm:px-2 sm:text-base"
          />
        </div>

        {/* Boutons d'action : Effacer / Lancer */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="grid size-8 place-items-center rounded-full text-ink/40 hover:bg-black/5 hover:text-ink transition cursor-pointer"
              aria-label="Effacer la recherche"
            >
              <X size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={submit}
            aria-label="Lancer la recherche"
            className="grid size-10 place-items-center rounded-2xl bg-ink text-white transition hover:bg-moss hover:scale-105 shadow-sm cursor-pointer sm:size-11"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Raccourcis rapides sous la barre */}
      {showChips && (
        <div className="no-scrollbar mt-3.5 flex items-center justify-center gap-1.5 overflow-x-auto px-1 py-1 sm:gap-2">
          {quickSuggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleChipClick(item.query);
              }}
              onClick={() => handleChipClick(item.query)}
              className="group shrink-0 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-[#d5bb7d]/60 hover:bg-white/20 hover:text-white cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown ancré & persistant des résultats de recherche */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && dropdownRect && (
              <motion.div
                ref={dropdownRef}
                style={{ left: dropdownRect.left, top: dropdownRect.top, width: dropdownRect.width }}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.99 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="fixed z-[130] max-h-[80vh] overflow-y-auto rounded-3xl border border-black/10 bg-white/98 p-3.5 text-left text-ink shadow-[0_28px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl"
              >
                {/* En-tête de réponse / Synthèse de recherche */}
                <div className="flex items-center gap-2.5 rounded-2xl bg-cream/80 p-3 border border-black/[.04] mb-3">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-moss text-white shadow-2xs">
                    <Sparkles size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-ink/50 uppercase tracking-wider">Recherche Liberty</p>
                    <p className="mt-0.5 text-xs font-semibold text-ink/90 truncate leading-snug">
                      {loading
                        ? "Recherche en cours…"
                        : conciergeMessage || `${results.length} résultat${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                {/* État de chargement discret */}
                {loading && results.length === 0 ? (
                  <div className="flex items-center justify-center gap-3 py-10" role="status" aria-live="polite">
                    <div className="size-5 rounded-full border-2 border-moss border-t-transparent animate-spin" />
                    <p className="text-xs font-semibold text-ink/60">Recherche des établissements…</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-3">
                    {/* Grille exhaustive et fluide des cartes d'établissements */}
                    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                      {results.slice(0, 6).map((result) => {
                        const establishmentData: EstablishmentRecord = result.establishment || {
                          id: result.id,
                          name: result.title,
                          slug: result.id,
                          rubricId: "food",
                          subrubricId: result.subcategory?.toLowerCase() || "restaurants",
                          address: result.subtitle || "",
                          city: result.location?.city || "Paris",
                          arrondissement: result.location?.arrondissement || "",
                          postalCode: result.location?.postalCode || "",
                          mainPhoto: result.image || "/images/food/restaurants-khan.jpg",
                          photos: [result.image || "/images/food/restaurants-khan.jpg"],
                          description: result.subtitle || "",
                          shortDescription: result.subtitle || "",
                          phone: "",
                          whatsapp: "",
                          instagram: "",
                          website: "",
                          status: "Publié",
                          visible: true,
                          sponsored: result.ranking?.sponsored ?? false,
                          sponsorshipLevel: result.ranking?.sponsored ? "Sponsorisé" : "Standard",
                          sponsorPriority: 0,
                          sponsorDuration: "",
                          reservationTarget: "",
                          cuisineTypes: [],
                          order: 0,
                          visibleTagIds: result.keywords || [],
                          customerSearches: result.customerSearches || [],
                          terrace: false,
                          delivery: false,
                          takeaway: false,
                          reservation: false,
                          privateHire: false,
                          certification: result.filters?.certification || "",
                          kosherType: (result.filters?.kosherType || "Bassari") as "Bassari" | "Halavi" | "Parvé" | "À compléter",
                          averagePrice: result.filters?.price || "",
                          hours: "",
                          latitude: result.location?.latitude ? String(result.location.latitude) : "",
                          longitude: result.location?.longitude ? String(result.location.longitude) : "",
                        };

                        return (
                          <div key={result.id} className="relative">
                            <UniversalEstablishmentCard
                              establishment={establishmentData}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Si plus de 6 résultats, bouton d'accès rapide vers la page recherche */}
                    {results.length > 6 && (
                      <div className="pt-2 border-t border-black/5">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
                          }}
                          onClick={() => {
                            router.push(`/recherche?q=${encodeURIComponent(query.trim())}`);
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-xs font-bold text-white transition hover:bg-moss cursor-pointer"
                        >
                          <Search size={14} /> Voir tous les {results.length} résultats complets →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 0 résultat */
                  <div className="p-5 text-center" role="status" aria-live="polite">
                    <p className="text-sm font-bold text-ink">Aucun résultat trouvé pour « {query} »</p>
                    <p className="mt-1 text-xs text-ink/50">
                      Essayez un autre mot-clé ou découvrez l&apos;une de nos suggestions :
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                      {quickSuggestions.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleChipClick(item.query);
                          }}
                          onClick={() => handleChipClick(item.query)}
                          className="rounded-full bg-cream px-3.5 py-1.5 text-xs font-semibold text-ink/75 transition hover:bg-moss hover:text-white cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
