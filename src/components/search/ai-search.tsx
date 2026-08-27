"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, Volume2, VolumeX, X, Sparkles } from "lucide-react";
import {
  parseConciergeIntent,
  generateConciergeResponse,
  executeConciergeSearch,
  type ConciergeCriteria,
} from "@/lib/concierge/intent-parser";
import { VoiceMicrophoneButton, type MicState } from "@/components/concierge/voice-microphone-button";
import type { EstablishmentSearchResult } from "@/lib/search/search-service";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { trackEvent } from "@/lib/client-store";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";

const rotatingExamples = [
  "Parlez à Liberty ou écrivez ici…",
  "Trouve-moi un resto bassari dans le 17e",
  "Une coiffeuse à domicile dans le 16e",
  "Un brunch ouvert dimanche",
  "Qu’est-ce qu’on peut faire avec les enfants ?",
  "Un caviste cacher pour shabbat",
  "Un restaurant japonais cacher ouvert ce soir",
];

export const quickSuggestions = [
  { label: "📍 Près de moi", query: "Près de moi" },
  { label: "🕒 Ouvert maintenant", query: "Ouvert maintenant" },
  { label: "🥩 Bassari 17e", query: "Restaurant bassari 17e" },
  { label: "💇‍♀️ Coiffure à domicile", query: "Coiffeuse à domicile" },
  { label: "🥐 Brunch dimanche", query: "Brunch ouvert dimanche" },
  { label: "🍷 Cavistes & Vins", query: "Caviste vin casher" },
  { label: "👶 Enfants & Famille", query: "Activités enfants famille" },
];

export function AiSearch({ showChips = true }: { showChips?: boolean }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [micState, setMicState] = useState<MicState>("idle");
  const [conciergeMessage, setConciergeMessage] = useState<string>("");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  const [sessionCriteria, setSessionCriteria] = useState<Partial<ConciergeCriteria>>({});

  const [results, setResults] = useState<EstablishmentSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{ left: number; top: number; width: number } | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef(0);
  const lastQueryRef = useRef<string | null>(null);

  const open = focused && (query.trim().length >= 2 || results.length > 0 || loading || micState === "listening");

  // Synthèse vocale française sécurisée (optionnelle)
  const speakResponse = useCallback((text: string) => {
    if (!voiceOutputEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  }, [voiceOutputEnabled]);

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

  // Exécution centrale et unifiée de la recherche conversationnelle
  const runConciergeQuery = useCallback(
    async (rawQuery: string, overrideCoords?: { latitude: number; longitude: number }) => {
      const trimmed = rawQuery.trim();
      if (!trimmed || trimmed.length < 2) {
        setResults([]);
        setLoading(false);
        setError("");
        setConciergeMessage("");
        return;
      }

      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      lastQueryRef.current = trimmed;
      setFocused(true);
      setLoading(true);
      setError("");

      try {
        // 1. Analyse de l'intention avec normalisation phonétique & vocale
        const parsedCriteria = parseConciergeIntent(trimmed, sessionCriteria);
        setSessionCriteria((prev) => ({ ...prev, ...parsedCriteria }));

        // 2. Traitement géolocalisation si demandée
        let coordsToUse = overrideCoords || userCoords;
        if (parsedCriteria.nearMe && !coordsToUse && typeof navigator !== "undefined" && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
            });
            coordsToUse = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setUserCoords(coordsToUse);
          } catch {
            // Refus de géolocalisation ou timeout
          }
        }

        // 3. Exécution déterministe Supabase
        const nextResults = await executeConciergeSearch(parsedCriteria, coordsToUse);

        if (requestRef.current === requestId) {
          setResults(nextResults);
          setActiveIndex(0);

          // 4. Formulation de la réponse naturelle
          const responseText = generateConciergeResponse(parsedCriteria, nextResults.length);
          setConciergeMessage(responseText);
          speakResponse(responseText);

          trackEvent("liberty_concierge_query", trimmed, `${nextResults.length}_results`);
        }
      } catch {
        if (requestRef.current === requestId) {
          setResults([]);
          setError("Recherche momentanément indisponible.");
          setConciergeMessage("Une erreur est survenue lors de la recherche.");
        }
      } finally {
        if (requestRef.current === requestId) {
          setLoading(false);
          setMicState("idle");
        }
      }
    },
    [sessionCriteria, speakResponse, userCoords]
  );

  // 1. Déclencheur vocal : Exécute immédiatement la recherche dès la fin de dictée
  const handleVoiceTranscript = useCallback((transcript: string) => {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return;

    // Mise à jour visuelle du champ pour que l'utilisateur puisse le modifier s'il le souhaite
    setQuery(cleanTranscript);
    setFocused(true);
    setMicState("searching");

    // Lancement direct et garanti de la recherche avec le texte transcrit
    void runConciergeQuery(cleanTranscript);
  }, [runConciergeQuery]);

  // 2. Déclencheur chips / raccourcis
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

  // 3. Déclencheur saisie manuelle
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setQuery(value);
    setFocused(true);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      setConciergeMessage("");
      lastQueryRef.current = null;
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setLoading(false);
    setError("");
    setConciergeMessage("");
    setSessionCriteria({});
    lastQueryRef.current = null;
    inputRef.current?.focus();
  };

  // 4. Déclencheur validation clavier / bouton de recherche
  const submit = () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    void runConciergeQuery(trimmed);
  };

  const openResult = (result: EstablishmentSearchResult | undefined) => {
    if (!result) return;
    if (query.trim().length >= 2) trackEvent("concierge_result_click", query.trim(), result.id);
    setFocused(false);

    if (result.href) {
      router.push(result.href);
    } else if (result.establishment) {
      const est = result.establishment;
      const rubric = est.rubricId || "food";
      const sub = est.subrubricId || "";
      const cleanSub = sub.startsWith(`${rubric}-`) ? sub.slice(rubric.length + 1) : sub;
      const targetPath =
        rubric === "food" && (cleanSub === "restaurants" || !cleanSub)
          ? `/food/restaurants#${est.slug || est.id}`
          : rubric === "food" && cleanSub === "brunch"
          ? `/food/brunch/${est.slug || est.id}`
          : rubric === "shopping" && est.slug === "azamra"
          ? `/shopping/vetements/azamra`
          : `/${rubric}/${cleanSub || "decouverte"}#${est.slug || est.id}`;
      router.push(targetPath);
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setExampleIndex((idx) => (idx + 1) % rotatingExamples.length), 3800);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Débounce sur frappe manuelle
  useEffect(() => {
    if (!focused || query.trim().length < 2 || micState === "listening") return;
    const timer = window.setTimeout(() => {
      void runConciergeQuery(query);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [focused, query, micState, runConciergeQuery]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setFocused(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

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
      {/* Barre conversationnelle unifiée : MICROPHONE + CHAMP TEXTE */}
      <div
        className={`group relative flex items-center gap-2 rounded-[2rem] border bg-white/[0.97] p-2 sm:p-2.5 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-2xl transition-all duration-300 ${
          focused || micState === "listening"
            ? "border-[#d5bb7d] shadow-[0_32px_110px_rgba(0,0,0,.55),0_0_0_6px_rgba(213,187,125,.14)]"
            : "border-white/30 hover:border-white/60"
        }`}
      >
        {/* Bouton Microphone CTA principal avec Halo Liberty K */}
        <VoiceMicrophoneButton
          state={micState}
          onStateChange={setMicState}
          onTranscript={handleVoiceTranscript}
          onError={(msg) => setError(msg)}
          size="md"
        />

        {/* Zone de texte ou état vocal */}
        <div className="relative flex-1 min-w-0">
          {micState === "listening" ? (
            <div className="flex items-center gap-2 px-2 text-sm font-semibold text-moss animate-pulse">
              <span className="inline-block size-2 rounded-full bg-rose-500 animate-ping" />
              <span>Je vous écoute… Parlez librement à Liberty</span>
            </div>
          ) : (
            <input
              ref={inputRef}
              value={query}
              onChange={handleInput}
              onFocus={() => setFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
                if (e.key === "Escape") {
                  setFocused(false);
                }
              }}
              aria-label="Demandez à Liberty"
              placeholder={rotatingExamples[exampleIndex]}
              type="search"
              inputMode="search"
              autoComplete="off"
              className="w-full bg-transparent px-1 text-[15px] font-semibold text-ink outline-hidden placeholder:font-medium placeholder:text-ink/35 sm:px-2 sm:text-base"
            />
          )}
        </div>

        {/* Boutons d'action auxiliaires : Effacer / Soumettre */}
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="grid size-8 place-items-center rounded-full text-ink/40 hover:bg-black/5 transition cursor-pointer"
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
            <Search size={16} />
          </button>
        </div>
      </div>

      {/* Raccourcis utiles sous la barre */}
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

      {/* Dropdown / Modal des résultats du Concierge */}
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
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="fixed z-[130] max-h-[80vh] overflow-y-auto rounded-3xl border border-black/10 bg-white/98 p-3 text-left text-ink shadow-[0_28px_90px_rgba(0,0,0,.35)] backdrop-blur-2xl"
              >
                {/* Réponse conversationnelle de Liberty */}
                <div className="flex items-start justify-between gap-3 rounded-2xl bg-cream/70 p-3.5 border border-black/[.04] mb-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-moss text-white shadow-2xs">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink/50 uppercase tracking-wider">Liberty Concierge</p>
                      <p className="mt-0.5 text-xs font-semibold text-ink/90 leading-snug">
                        {loading
                          ? "Recherche des meilleures adresses en cours…"
                          : conciergeMessage || "Voici les adresses sélectionnées pour vous :"}
                      </p>
                    </div>
                  </div>

                  {/* Contrôle Voix Haut-Parleur ON / OFF */}
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceOutputEnabled((prev) => {
                        const next = !prev;
                        if (next && conciergeMessage) speakResponse(conciergeMessage);
                        else if (typeof window !== "undefined" && "speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                        return next;
                      });
                    }}
                    className={`grid size-8 shrink-0 place-items-center rounded-xl transition cursor-pointer ${
                      voiceOutputEnabled
                        ? "bg-moss text-white"
                        : "bg-black/5 text-ink/45 hover:bg-black/10 hover:text-ink"
                    }`}
                    title={voiceOutputEnabled ? "Désactiver la voix" : "Activer la réponse vocale"}
                    aria-label="Bascule voix haut-parleur"
                  >
                    {voiceOutputEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </button>
                </div>

                {/* État de chargement */}
                {loading ? (
                  <div className="flex items-center justify-center gap-3 py-10" role="status" aria-live="polite">
                    <div className="size-5 rounded-full border-2 border-moss border-t-transparent animate-spin" />
                    <p className="text-xs font-semibold text-ink/60">Sélection des établissements certifiés…</p>
                  </div>
                ) : results.length > 0 ? (
                  <div className="space-y-3">
                    {/* Liste des résultats avec cartes autonomes universelles */}
                    <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                      {results.slice(0, 4).map((result) => {
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

                    {/* Bouton pour voir tous les résultats si > 4 */}
                    {results.length > 4 && (
                      <div className="pt-2 border-t border-black/5">
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            submit();
                          }}
                          onClick={submit}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-xs font-bold text-white transition hover:bg-moss cursor-pointer"
                        >
                          <Search size={14} /> Voir tous les {results.length} résultats sur la page complète →
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 0 résultat : Réponse honnête et suggestions intelligentes */
                  <div className="p-5 text-center" role="status" aria-live="polite">
                    <p className="text-sm font-bold text-ink">Aucun résultat trouvé pour cette recherche précise</p>
                    <p className="mt-1 text-xs text-ink/50">
                      Vous pouvez reformuler votre demande ou explorer une de nos suggestions populaires :
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
