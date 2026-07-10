"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, Search, Sparkles, WandSparkles, X } from "lucide-react";
import { searchIndex } from "@/data/search-index";
import { getSearchSuggestions, searchItems } from "@/lib/search-engine";
import { assetPath } from "@/lib/assets";
import { trackEvent } from "@/lib/client-store";
import { fetchSupabaseSearchItems } from "@/lib/supabase/content";

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
  const [dynamicIndex, setDynamicIndex] = useState(searchIndex);
  const results = useMemo(() => searchItems(dynamicIndex, query), [dynamicIndex, query]);
  const suggestions = useMemo(() => getSearchSuggestions(query), [query]);
  const open = focused && query.trim().length >= 2;

  useEffect(() => {
    const timer = window.setInterval(() => setExampleIndex((index) => (index + 1) % rotatingExamples.length), 3200);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchSupabaseSearchItems().then((items) => {
      if (mounted && items?.length) setDynamicIndex([...items, ...searchIndex]);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const submit = () => {
    if (query.trim().length >= 2) trackEvent("ai_search", query.trim(), results[0]?.id);
    if (results[0]) router.push(results[0].href);
  };

  return (
    <div className="relative z-30 mx-auto mt-3.5 max-w-4xl">
      <div className="liberty-search-glow pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_50%_50%,rgba(213,187,125,.28),rgba(143,169,141,.16)_38%,transparent_70%)] blur-xl" />
      <div className={`relative overflow-hidden rounded-[1.65rem] border bg-white/[.96] p-2 shadow-[0_26px_90px_rgba(0,0,0,.42),0_0_0_1px_rgba(255,255,255,.45)_inset] backdrop-blur-2xl transition-all duration-500 ${focused ? "border-[#d5bb7d]/65 shadow-[0_34px_120px_rgba(0,0,0,.48),0_0_0_7px_rgba(213,187,125,.10)]" : "border-white/25"}`}>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,.7),transparent_30%,transparent_70%,rgba(213,187,125,.16))]" />
        <div className="relative flex items-center gap-2">
          <span className="ml-1 grid size-11 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#0d1712,#284636)] text-white shadow-[0_14px_35px_rgba(31,77,59,.28)]">
            <BrainCircuit size={18} />
          </span>
          <div className="hidden min-w-0 border-r border-black/[.07] pr-3 text-left sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-moss/60">Liberty IA</p>
            <p className="text-[10px] text-ink/35">Recherche naturelle</p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
              if (event.key === "Escape") setFocused(false);
            }}
            aria-label="Recherche Liberty IA en langage naturel"
            placeholder={rotatingExamples[exampleIndex]}
            className="min-w-0 flex-1 bg-transparent px-2 py-3 text-[15px] font-semibold text-ink outline-none placeholder:font-medium placeholder:text-ink/32 sm:px-4 sm:text-base"
          />
          {query && (
            <button onClick={() => setQuery("")} className="grid size-8 place-items-center rounded-lg text-ink/35 hover:bg-cream" aria-label="Effacer">
              <X size={14} />
            </button>
          )}
          <button onClick={submit} className="group grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#101a15,#284636)] text-white shadow-[0_12px_28px_rgba(16,26,21,.28)] transition duration-300 hover:scale-[1.035] hover:shadow-[0_18px_44px_rgba(16,26,21,.36)]" aria-label="Rechercher">
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
              <p className="text-[10px] text-ink/30">{results.length} résultat{results.length > 1 ? "s" : ""}</p>
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
                {results.map((result) => (
                  <button key={result.id} onClick={() => { trackEvent("ai_search", query.trim(), result.id); router.push(result.href); }} className="group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-cream hover:shadow-sm">
                    <img src={assetPath(result.image)} alt="" className="liberty-image-grade size-12 shrink-0 rounded-2xl object-cover transition duration-500 group-hover:scale-105" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{result.title}</p>
                        {result.ranking?.sponsored && <span className="rounded-full bg-[#f6ecd9] px-2 py-0.5 text-[9px] font-semibold text-[#9b6b2d]">Sponsorisé pertinent</span>}
                        {result.filters?.openNow === false && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[9px] font-semibold text-zinc-500">Fermé</span>}
                        {result.filters?.openNow === true && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">Ouvert</span>}
                      </div>
                      <p className={`mt-0.5 truncate text-[11px] ${result.filters?.openNow === false ? "text-ink/25" : "text-ink/42"}`}>{result.category} · {result.subtitle}</p>
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
          <Sparkles size={11} /> Exemples : restaurant entrecôte Paris 17 · brunch avocado toast · tequila casher
        </p>
      </div>
    </div>
  );
}
