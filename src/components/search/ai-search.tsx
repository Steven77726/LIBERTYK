"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, BookOpenText, HandPlatter, Mic, Plane, Search, Sparkles, Utensils, X } from "lucide-react";
import { searchIndex } from "@/data/search-index";
import { searchItems } from "@/lib/search-engine";
import { assetPath } from "@/lib/assets";

const ideas = [
  { label: "Restaurant viande Paris", icon: Utensils },
  { label: "Voyage Marrakech Mai", icon: Plane },
  { label: "Traiteur mariage", icon: HandPlatter },
  { label: "Cours de Torah", icon: BookOpenText },
];

export function AiSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => searchItems(searchIndex, query), [query]);
  const open = focused && query.trim().length >= 2;

  const submit = () => {
    if (results[0]) router.push(results[0].href);
  };

  return (
    <>
      <div className="relative z-30 mx-auto mt-3.5 max-w-4xl">
        <div className="rounded-2xl border border-white/15 bg-white p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.35)]">
          <div className="flex items-center gap-2">
            <span className="ml-1 grid size-8 shrink-0 place-items-center rounded-lg bg-[#eef2ed] text-moss"><Sparkles size={14} /></span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
                if (event.key === "Escape") setFocused(false);
              }}
              aria-label="Recherche assistée par intelligence artificielle"
              placeholder="Que recherchez-vous aujourd'hui ?"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink/35 sm:px-3"
            />
            {query && <button onClick={() => setQuery("")} className="grid size-8 place-items-center rounded-lg text-ink/35 hover:bg-cream" aria-label="Effacer"><X size={14} /></button>}
            <button className="hidden size-8 shrink-0 place-items-center rounded-lg text-ink/40 transition hover:bg-cream sm:grid" aria-label="Recherche vocale"><Mic size={15} /></button>
            <button onClick={submit} className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-white transition hover:scale-[1.03]" aria-label="Rechercher"><Search size={16} /></button>
          </div>
        </div>

        {open && (
          <div className="absolute inset-x-0 top-[calc(100%+.5rem)] overflow-hidden rounded-2xl border border-black/[.07] bg-white p-2 text-left text-ink shadow-[0_24px_70px_rgba(0,0,0,.22)]">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-ink/35">Résultats intelligents</p>
              <p className="text-[10px] text-ink/30">{results.length} résultat{results.length > 1 ? "s" : ""}</p>
            </div>
            {results.length > 0 ? (
              <div className="grid max-h-[420px] gap-1 overflow-y-auto">
                {results.map((result) => (
                  <button key={result.id} onClick={() => router.push(result.href)} className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition hover:bg-cream">
                    <img src={assetPath(result.image)} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{result.title}</p><p className="mt-0.5 truncate text-[11px] text-ink/42">{result.category} · {result.subtitle}</p></div>
                    <ArrowUpRight size={15} className="shrink-0 text-ink/25 transition group-hover:text-ink" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center"><Search size={22} className="mx-auto text-ink/15" /><p className="mt-3 text-sm font-medium">Aucun résultat pour le moment</p><p className="mt-1 text-xs text-ink/35">Essayez une envie, un lieu ou une catégorie.</p></div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto mt-2 flex max-w-4xl flex-wrap justify-center gap-1.5">
        {ideas.map(({ label, icon: Icon }) => (
          <button key={label} onClick={() => { setQuery(label); setFocused(true); }} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1 text-[10px] text-white/50 backdrop-blur transition hover:border-white/25 hover:bg-white/10 hover:text-white">
            <Icon size={11} /> {label}
          </button>
        ))}
      </div>
    </>
  );
}
