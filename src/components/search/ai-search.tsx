"use client";

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Search, Sparkles, WandSparkles, X } from "lucide-react";
import { searchEstablishments, type EstablishmentSearchResult } from "@/lib/search/search-service";
import { assetPath } from "@/lib/assets";
import { trackEvent } from "@/lib/client-store";

const rotatingExamples = [
  "Où trouver un avocado toast dans le 17e ouvert dimanche ?",
  "Restaurant entrecôte Paris 17",
  "Brunch avocado toast 17e",
  "Tequila casher",
  "DJ mariage Paris",
  "Mikvé homme proche de moi",
];

export function AiSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [results, setResults] = useState<EstablishmentSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);
  const lastQueryRef = useRef<string | null>(null);
  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    return [...new Set(results.flatMap((result) => [
      ...result.matches.map((match) => match.label),
      result.subcategory,
      result.category,
      result.location?.city,
    ].filter(Boolean) as string[]))].slice(0, 6);
  }, [query, results]);
  const open = focused && (query.trim().length >= 2 || results.length > 0 || loading);

  const runSearch = useCallback(async (rawQuery: string, force = false) => {
    const searchQuery = rawQuery.trim();
    if (searchQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return [];
    }

    if (!force && lastQueryRef.current === searchQuery) return results;

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    lastQueryRef.current = searchQuery;
    setFocused(true);
    setLoading(true);

    try {
      const nextResults = await searchEstablishments(searchQuery);
      if (requestRef.current === requestId) {
        setResults(nextResults);
        setActiveIndex(0);
      }
      return nextResults;
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [results]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setFocused(true);
    if (value.trim().length < 2) {
      setResults([]);
      setLoading(false);
      lastQueryRef.current = null;
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => setExampleIndex((index) => (index + 1) % rotatingExamples.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

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
    const timer = window.setTimeout(async () => {
      await runSearch(searchQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [focused, query, runSearch]);

  const openResult = (result: EstablishmentSearchResult | undefined) => {
    if (!result) return;
    if (query.trim().length >= 2) trackEvent("ai_search", query.trim(), result.id);
    setFocused(false);
    router.push(result.href);
  };

  const submit = async () => {
    const searchQuery = query.trim();
    if (searchQuery.length < 2) return;
    const currentResults = results.length ? results : await runSearch(searchQuery, true);
    openResult(currentResults[activeIndex] ?? currentResults[0]);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement> | FormEvent<HTMLInputElement>) => {
    updateQuery(event.currentTarget.value);
  };

  return (
    <div className="relative z-30 mx-auto mt-3.5 max-w-4xl">
      <div className="liberty-search-glow pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_50%_50%,rgba(213,187,125,.28),rgba(143,169,141,.16)_38%,transparent_70%)] blur-xl" />
      <div className={`relative overflow-hidden rounded-[1.65rem] border bg-white/[.96] p-2 shadow-[0_26px_90px_rgba(0,0,0,.42),0_0_0_1px_rgba(255,255,255,.45)_inset] backdrop-blur-2xl transition-all duration-500 ${focused ? "border-[#d5bb7d]/65 shadow-[0_34px_120px_rgba(0,0,0,.48),0_0_0_7px_rgba(213,187,125,.10)]" : "border-white/25"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.7),transparent_30%,transparent_70%,rgba(213,187,125,.16))]" />
        <div className="relative flex items-center gap-2">
          <input
            value={query}
            onChange={handleInput}
            onInput={handleInput}
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
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink/32 sm:px-4 sm:text-base"
          />
          {query && (
            <button onClick={() => { setQuery(""); lastQueryRef.current = null; }} className="grid size-8 place-items-center rounded-lg text-ink/35 hover:bg-cream" aria-label="Effacer">
              <X size={14} />
            </button>
          )}
          <button onClick={() => void submit()} className="group grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#101a15,#284636)] text-white shadow-[0_12px_28px_rgba(16,26,21,.28)] transition duration-300 hover:scale-[1.035] hover:shadow-[0_18px_44px_rgba(16,26,21,.36)]" aria-label="Rechercher">
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
            className="absolute inset-x-0 top-[calc(100%+.7rem)] overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/95 p-2 text-left text-ink shadow-[0_30px_90px_rgba(0,0,0,.28)] backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-ink/35">Suggestions automatiques</p>
              <p className="text-[10px] text-ink/30">{loading ? "Recherche…" : `${results.length} résultat${results.length > 1 ? "s" : ""}`}</p>
            </div>

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-black/[.06] px-3 pb-3">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => { setQuery(suggestion); setFocused(true); }} className="inline-flex items-center gap-1.5 rounded-full bg-sage px-3 py-1.5 text-[10px] font-semibold text-moss transition hover:-translate-y-0.5 hover:bg-[#dfe9e2]">
                    <WandSparkles size={11} /> {suggestion}
                  </button>
                ))}
              </div>
            )}

            {results.length > 0 ? (
              <div className="grid max-h-[420px] gap-1 overflow-y-auto pt-2">
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
                      <p className={`mt-0.5 truncate text-[11px] ${result.filters?.openNow === false ? "text-ink/25" : "text-ink/42"}`}>{result.category} · {result.subtitle}</p>
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
              <div className="px-4 py-8 text-center">
                <Search size={22} className="mx-auto text-ink/15" />
                <p className="mt-3 text-sm font-medium">Aucun résultat pour le moment</p>
                <p className="mt-1 text-xs text-ink/35">Essayez une envie, un lieu ou une catégorie.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto mt-2 flex max-w-4xl justify-center">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[.07] px-3 py-1.5 text-[10px] text-white/58 shadow-[0_10px_30px_rgba(0,0,0,.12)] backdrop-blur">
          <Sparkles size={11} /> Exemple : Où trouver un avocado toast dans le 17e ouvert dimanche ?
        </p>
      </div>
    </div>
  );
}
