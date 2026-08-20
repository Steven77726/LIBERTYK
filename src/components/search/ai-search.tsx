"use client";

import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, X } from "lucide-react";
import { searchEstablishments, type EstablishmentSearchResult } from "@/lib/search/search-service";
import { assetPath } from "@/lib/assets";
import { trackEvent } from "@/lib/client-store";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";

const rotatingExamples = [
  "Où trouver un avocado toast dans le 17e ouvert dimanche ?",
  "Restaurant entrecôte Paris 17",
  "Brunch avocado toast 17e",
  "Tequila casher",
  "DJ mariage Paris",
  "Mikvé homme proche de moi",
];

const SEARCH_DEBOUNCE_MS = 150;
const SEARCH_CACHE_TTL_MS = 45_000;
const MAX_RESULTS = 10;

export function AiSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [results, setResults] = useState<EstablishmentSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedResult, setSelectedResult] = useState<EstablishmentSearchResult | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string | null>(null);
  const cacheRef = useRef(new Map<string, { expiresAt: number; results: EstablishmentSearchResult[] }>());
  const open = focused && (query.trim().length >= 2 || results.length > 0 || loading);

  const runSearch = useCallback(async (rawQuery: string, force = false) => {
    const searchQuery = rawQuery.trim();
    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return [];
    }

    const cacheKey = searchQuery.toLocaleLowerCase("fr-FR");
    const cached = cacheRef.current.get(cacheKey);
    if (!force && cached && cached.expiresAt > Date.now()) {
      setResults(cached.results);
      setActiveIndex(0);
      setLoading(false);
      setError("");
      lastQueryRef.current = searchQuery;
      return cached.results;
    }

    if (!force && lastQueryRef.current === searchQuery) return results;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    lastQueryRef.current = searchQuery;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setFocused(true);
    setLoading(true);
    setError("");

    try {
      const nextResults = await searchEstablishments(searchQuery, { signal: controller.signal, limit: MAX_RESULTS });
      if (requestRef.current === requestId) {
        setResults(nextResults);
        setActiveIndex(0);
        cacheRef.current.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, results: nextResults });
      }
      return nextResults;
    } catch (searchError) {
      if (controller.signal.aborted) return [];
      if (requestRef.current === requestId) {
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : "Recherche indisponible.");
      }
      return [];
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [results]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setFocused(true);
    if (value.trim().length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError("");
      lastQueryRef.current = null;
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setExampleIndex((index) => (index + 1) % rotatingExamples.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("q")?.trim();
    if (initialQuery) {
      setQuery(initialQuery);
      setFocused(true);
    }
  }, []);

  useEffect(() => {
    if (!focused && query.trim().length < 2) return;

    const searchQuery = query.trim();
    if (searchQuery.length < 2) return;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      await runSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [focused, query, runSearch]);

  const openResult = (result: EstablishmentSearchResult | undefined) => {
    if (!result) return;
    if (query.trim().length >= 2) trackEvent("ai_search", query.trim(), result.id);
    setFocused(false);
    setSelectedResult(result);
  };

  const submit = async () => {
    const searchQuery = query.trim();
    if (searchQuery.length < 2) return;
    const currentResults = results.length ? results : await runSearch(searchQuery, true);
    openResult(currentResults[activeIndex] ?? currentResults[0]);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    updateQuery(event.currentTarget.value);
  };

  return (
    <div ref={rootRef} className="relative z-30 mx-auto mt-3.5 w-full max-w-4xl">
      <div className="liberty-search-glow pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_50%_50%,rgba(213,187,125,.28),rgba(143,169,141,.16)_38%,transparent_70%)] blur-xl" />
      <div className={`relative h-[4.25rem] overflow-hidden rounded-[1.65rem] border bg-white/[.96] p-2 shadow-[0_26px_90px_rgba(0,0,0,.42),0_0_0_1px_rgba(255,255,255,.45)_inset] backdrop-blur-2xl transition-all duration-500 sm:h-[4.5rem] ${focused ? "border-[#d5bb7d]/65 shadow-[0_34px_120px_rgba(0,0,0,.48),0_0_0_7px_rgba(213,187,125,.10)]" : "border-white/25"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.7),transparent_30%,transparent_70%,rgba(213,187,125,.16))]" />
        <div className="relative flex h-full min-w-0 items-center gap-2">
          <Search size={18} className="ml-2 hidden shrink-0 text-ink/25 sm:block" />
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onFocus={() => setFocused(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                void submit();
              }
              if (event.key === "Escape") setFocused(false);
            }}
            aria-label="Recherche Liberty"
            placeholder={rotatingExamples[exampleIndex]}
            type="search"
            inputMode="search"
            autoComplete="off"
            className="h-full min-w-0 flex-1 truncate bg-transparent px-1 text-[15px] font-semibold leading-none text-ink outline-none placeholder:truncate placeholder:font-medium placeholder:text-ink/32 sm:px-3 sm:text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                abortRef.current?.abort();
                setQuery("");
                setResults([]);
                setLoading(false);
                setError("");
                lastQueryRef.current = null;
                inputRef.current?.focus();
              }}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-ink/35 hover:bg-cream"
              aria-label="Effacer"
            >
              <X size={14} />
            </button>
          )}
          <button type="button" onClick={() => void submit()} className="group grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#101a15,#284636)] text-white shadow-[0_12px_28px_rgba(16,26,21,.28)] transition duration-300 hover:scale-[1.035] hover:shadow-[0_18px_44px_rgba(16,26,21,.36)] sm:size-12" aria-label="Rechercher">
            <Search size={18} className="transition group-hover:rotate-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.985, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 10, scale: 0.99, filter: "blur(6px)" }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-[calc(100%+.55rem)] overflow-hidden rounded-[1.45rem] border border-white/70 bg-white/96 p-1.5 text-left text-ink shadow-[0_24px_70px_rgba(0,0,0,.22)] backdrop-blur-2xl"
          >
            {loading ? (
              <div className="flex items-center gap-3 px-4 py-4" role="status" aria-live="polite">
                <Search size={18} className="animate-pulse text-ink/20" />
                <p className="text-sm font-medium text-ink/55">Recherche…</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid max-h-[380px] gap-1 overflow-y-auto">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openResult(result)}
                    className={`group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-cream hover:shadow-sm ${activeIndex === index ? "bg-cream" : ""}`}
                  >
                    <img src={assetPath(result.image)} alt="" className="liberty-image-grade size-12 shrink-0 rounded-2xl object-cover transition duration-500 group-hover:scale-105" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold [&_mark]:rounded [&_mark]:bg-[#f6ecd9] [&_mark]:px-0.5 [&_mark]:text-ink" dangerouslySetInnerHTML={{ __html: result.highlight }} />
                        {result.ranking?.sponsored && <span className="rounded-full bg-[#f6ecd9] px-2 py-0.5 text-[9px] font-semibold text-[#9b6b2d]">Sponsorisé pertinent</span>}
                        {result.filters?.openNow === false && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-semibold text-zinc-500">Fermé</span>}
                        {result.filters?.openNow === true && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">Ouvert</span>}
                      </div>
                      <p className={`mt-0.5 truncate text-[11px] ${result.filters?.openNow === false ? "text-ink/25" : "text-ink/42"}`}>{[result.subcategory ?? result.category, result.location?.city].filter(Boolean).join(" · ")}</p>
                      {result.matches.length > 0 && (
                        <p className="mt-1 truncate text-[10px] font-medium text-moss/75">
                          Correspond : {result.matches.slice(0, 3).map((match) => match.label).join(" · ")}
                        </p>
                      )}
                    </div>
                    <ArrowUpRight size={15} className="shrink-0 text-ink/25 transition group-hover:text-ink" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-4" role="status" aria-live="polite">
                <Search size={18} className="text-ink/15" />
                <div>
                  <p className="text-sm font-medium">{error || "Aucun résultat"}</p>
                  <p className="mt-0.5 text-xs text-ink/35">Essayez une envie, un lieu ou une catégorie.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <EstablishmentDetailDrawer
        establishment={selectedResult?.establishment ?? null}
        open={Boolean(selectedResult?.establishment)}
        onClose={() => setSelectedResult(null)}
      />
    </div>
  );
}
