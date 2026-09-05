"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, Store } from "lucide-react";
import { localEstablishments } from "@/data/establishments";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";
import { subrubricSlugAliases } from "@/data/subrubrics";

const filterTabs = [
  { id: "all", label: "Toutes les boutiques" },
  { id: "vetement-feminin", label: "Vêtement féminin" },
  { id: "vetement-masculin", label: "Vêtement masculin" },
  { id: "objet-utile", label: "Objet utile" },
];

function normalizeSubId(subId?: string): string {
  if (!subId) return "";
  const clean = subId.toLowerCase().trim();
  const withoutPrefix = clean.replace(/^shopping-/, "");
  return subrubricSlugAliases[clean] || subrubricSlugAliases[withoutPrefix] || withoutPrefix;
}

function matchesCategoryFilter(est: EstablishmentRecord, filterId: string): boolean {
  if (filterId === "all") return true;
  const name = (est.name || "").toLowerCase();
  const isAzamra = est.id === "azamra" || est.slug === "azamra" || name.includes("azamra");
  const isNaor = est.id === "naor" || est.slug === "naor" || name.includes("naor");

  if (filterId === "vetement-masculin") {
    if (isNaor) return false;
    if (isAzamra) return true;
    const sub = normalizeSubId(est.subrubricId);
    return (
      sub === "vetement-masculin" ||
      sub === "vetements-masculin" ||
      sub.includes("masculin") ||
      (est.visibleTagIds || []).some((t) => t.toLowerCase().includes("homme") || t.toLowerCase().includes("masculin"))
    );
  }

  if (filterId === "vetement-feminin") {
    if (isAzamra) return false;
    if (isNaor) return true;
    const sub = normalizeSubId(est.subrubricId);
    return (
      sub === "vetement-feminin" ||
      sub === "vetements-feminin" ||
      sub.includes("feminin") ||
      (est.visibleTagIds || []).some((t) => t.toLowerCase().includes("femme") || t.toLowerCase().includes("féminin"))
    );
  }

  if (filterId === "objet-utile") {
    if (isAzamra || isNaor) return false;
    const sub = normalizeSubId(est.subrubricId);
    return (
      sub === "objet-utile" ||
      sub === "objets" ||
      sub === "objets-utiles" ||
      sub === "maison" ||
      sub.includes("objet") ||
      sub.includes("utile")
    );
  }

  const sub = normalizeSubId(est.subrubricId);
  return sub === filterId;
}

export function ShoppingExplorer() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [items, setItems] = useState<EstablishmentRecord[]>(() => {
    return (localEstablishments as EstablishmentRecord[]).filter(
      (est) => (est.rubricId === "shopping" || est.rubricId === "rubric-shopping") && est.status !== "Masqué"
    );
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      // 1. Initialiser avec les données locales de secours
      const itemMap = new Map<string, EstablishmentRecord>();
      (localEstablishments as EstablishmentRecord[])
        .filter((est) => (est.rubricId === "shopping" || est.rubricId === "rubric-shopping") && est.status !== "Masqué")
        .forEach((item) => itemMap.set(item.id, item));

      // 2. Fusionner avec le cache local de l'admin (localStorage)
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            const rawEsts = (parsed?.establishments as EstablishmentRecord[]) ?? [];
            rawEsts
              .filter(
                (est) =>
                  (est.rubricId === "shopping" || est.rubricId === "rubric-shopping") &&
                  est.status === "Publié" &&
                  est.visible !== false
              )
              .forEach((est) => {
                let subrubricId = est.subrubricId;
                const name = (est.name || "").toLowerCase();
                if (est.id === "azamra" || est.slug === "azamra" || name.includes("azamra")) {
                  subrubricId = "vetement-masculin";
                } else if (est.id === "naor" || est.slug === "naor" || name.includes("naor")) {
                  subrubricId = "vetement-feminin";
                }
                const matchKey = Array.from(itemMap.keys()).find((k) => {
                  const existing = itemMap.get(k);
                  return (
                    k === est.id ||
                    existing?.slug === est.slug ||
                    (existing?.name && est.name && existing.name.toLowerCase() === est.name.toLowerCase())
                  );
                });
                if (matchKey) {
                  itemMap.set(matchKey, { ...itemMap.get(matchKey)!, ...est, subrubricId });
                } else {
                  itemMap.set(est.id, { ...est, subrubricId });
                }
              });
          }
        } catch {
          // ignore
        }
      }

      // 3. Fusionner avec Supabase en direct
      try {
        const remoteEsts = await listPublishedEstablishments({ rubricSlug: "shopping" });
        if (mounted && remoteEsts && remoteEsts.length > 0) {
          remoteEsts.forEach((est) => {
            let subrubricId = est.subrubricId;
            const name = (est.name || "").toLowerCase();
            if (est.id === "azamra" || est.slug === "azamra" || name.includes("azamra")) {
              subrubricId = "vetement-masculin";
            } else if (est.id === "naor" || est.slug === "naor" || name.includes("naor")) {
              subrubricId = "vetement-feminin";
            }
            const matchKey = Array.from(itemMap.keys()).find((k) => {
              const existing = itemMap.get(k);
              return (
                k === est.id ||
                existing?.slug === est.slug ||
                (existing?.name && est.name && existing.name.toLowerCase() === est.name.toLowerCase())
              );
            });
            if (matchKey) {
              itemMap.set(matchKey, { ...itemMap.get(matchKey)!, ...est, subrubricId });
            } else {
              itemMap.set(est.id, { ...est, subrubricId });
            }
          });
        }
      } catch {
        // Fallback local intact
      }

      if (mounted) {
        setItems(Array.from(itemMap.values()));
      }
    }

    void load();

    const refresh = () => void load();
    window.addEventListener("liberty-admin-published", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      mounted = false;
      window.removeEventListener("liberty-admin-published", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => matchesCategoryFilter(item, activeFilter));
  }, [items, activeFilter]);

  return (
    <section className="page-shell pb-16 pt-2">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Les adresses</p>
          <h2 className="section-title">Boutiques & Marques</h2>
        </div>
        <p className="text-xs font-medium text-ink/40">
          {filteredItems.length} boutique{filteredItems.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filtres par sous-univers */}
      <div className="mb-8 flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          const count = items.filter((item) => matchesCategoryFilter(item, tab.id)).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? "bg-moss text-white shadow-sm"
                  : "border border-black/[.08] bg-white text-ink/70 hover:border-black/20 hover:text-ink"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-cream text-ink/50"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste des boutiques */}
      {filteredItems.length === 0 ? (
        <div className="rounded-[2rem] bg-white px-6 py-14 text-center shadow-soft">
          <Store size={26} className="mx-auto text-ink/20" />
          <p className="mt-4 text-sm font-semibold">Aucune boutique trouvée dans cette catégorie.</p>
          <p className="mt-1 text-xs text-ink/40">Les nouvelles fiches créées dans le dashboard apparaîtront ici automatiquement.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item, index) => (
            <UniversalEstablishmentCard
              key={item.id}
              establishment={item}
              priorityImage={index < 3}
            />
          ))}
        </div>
      )}
    </section>
  );
}
