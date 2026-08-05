"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeType(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SubrubricEstablishmentResults({
  rubricSlug,
  excludedTypes = [],
}: {
  rubricSlug: string;
  excludedTypes?: string[];
}) {
  const searchParams = useSearchParams();
  const rawType = searchParams.get("type")?.trim() ?? "";
  const type = useMemo(() => slugify(rawType), [rawType]);
  const [items, setItems] = useState<EstablishmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const excludedKey = excludedTypes.map(slugify).join("|");
  const isExcluded = useMemo(() => excludedKey.split("|").filter(Boolean).includes(type), [excludedKey, type]);
  const title = useMemo(() => {
    if (!type) return "";
    const labels: Record<string, string> = {
      "salons-de-the": "Salons de thé",
      patisseries: "Pâtisseries",
      traiteurs: "Traiteurs",
      "traiteur-chabbat": "Traiteur Chabbat",
      "fast-food": "Fast-food",
      "street-food": "Street Food",
      boulangeries: "Boulangeries",
      glaciers: "Glaciers",
      "mikve-femme": "Mikvé femme",
      "mikve-vaisselle": "Mikvé vaisselle",
    };
    return labels[type] ?? humanizeType(type);
  }, [type]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!type || isExcluded) {
        setItems([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const results = await listPublishedEstablishments({ rubricSlug, subrubricSlug: type });
        if (mounted) setItems(results ?? []);
      } catch (loadError) {
        if (mounted) {
          setItems([]);
          setError(loadError instanceof Error ? loadError.message : "Impossible de charger cette sous-rubrique.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [excludedKey, isExcluded, rubricSlug, type]);

  if (!type || isExcluded) return null;

  return (
    <section className="mt-14 rounded-[2rem] border border-black/[.06] bg-white/80 p-5 shadow-soft backdrop-blur sm:p-7">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Sous-rubrique</p>
          <h2 className="text-2xl font-semibold tracking-[-.045em] sm:text-3xl">{title}</h2>
        </div>
        <p className="text-xs font-medium text-ink/40">
          {loading ? "Chargement…" : `${items.length} fiche${items.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-3xl bg-cream px-5 py-8 text-center">
          <Sparkles size={22} className="mx-auto text-ink/20" />
          <p className="mt-3 text-sm font-semibold">Aucune fiche publiée pour le moment.</p>
          <p className="mt-1 text-xs text-ink/40">Les futures adresses apparaîtront ici automatiquement.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.id}
              id={item.slug}
              className="group overflow-hidden rounded-[1.75rem] border border-black/[.05] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sage">
                <img
                  src={assetPath(item.mainPhoto || "/images/food/patisserie.webp")}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover transition duration-700 group-hover:scale-105"
                />
                {item.sponsored && (
                  <span className="absolute left-4 top-4 rounded-full bg-[#f6ecd9] px-3 py-1.5 text-[10px] font-semibold text-[#9b6b2d] shadow-sm">
                    Sponsorisé
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{item.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-ink/45">
                      <MapPin size={13} /> {[item.address, item.city].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-ink/35 transition group-hover:bg-ink group-hover:text-white">
                    <ArrowUpRight size={15} />
                  </span>
                </div>
                {item.shortDescription && <p className="mt-3 text-sm leading-6 text-ink/55">{item.shortDescription}</p>}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[item.kosherType, item.certification, item.averagePrice, ...item.visibleTagIds].filter(Boolean).slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full bg-cream px-3 py-1 text-[10px] font-semibold text-ink/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
