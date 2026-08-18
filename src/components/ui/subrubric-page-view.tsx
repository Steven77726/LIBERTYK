"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { assetPath } from "@/lib/assets";
import { categoryBySlug } from "@/data/categories";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { listPublishedSubrubrics, type SubrubricRecord } from "@/lib/supabase/subrubrics-repository";

type Props = {
  rubricSlug: string;
  subrubricSlug: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackImage?: string;
};

function readableTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveImage(item: EstablishmentRecord, fallbackImage?: string) {
  return item.mainPhoto || fallbackImage || categoryBySlug[item.rubricId]?.image || "/images/food/restaurants-khan.jpg";
}

export function SubrubricPageView({
  rubricSlug,
  subrubricSlug,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
}: Props) {
  const rubric = categoryBySlug[rubricSlug];
  const [subrubric, setSubrubric] = useState<SubrubricRecord | null>(null);
  const [items, setItems] = useState<EstablishmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const title = subrubric?.name || fallbackTitle || readableTitle(subrubricSlug);
  const description = subrubric?.description || fallbackDescription || `Les fiches publiées dans ${title}.`;
  const backLabel = rubric?.label || readableTitle(rubricSlug);
  const Icon = rubric?.icon ?? Sparkles;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [remoteSubrubrics, establishments] = await Promise.all([
          listPublishedSubrubrics(rubricSlug).catch(() => []),
          listPublishedEstablishments({ rubricSlug, subrubricSlug }),
        ]);
        if (!mounted) return;
        setSubrubric((remoteSubrubrics ?? []).find((item) => item.slug === subrubricSlug) ?? null);
        setItems(establishments ?? []);
      } catch (loadError) {
        if (!mounted) return;
        setItems([]);
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger cette sous-rubrique.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    const refresh = () => void load();
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, [rubricSlug, subrubricSlug]);

  const countLabel = useMemo(() => {
    if (loading) return "Chargement…";
    return `${items.length} fiche${items.length > 1 ? "s" : ""}`;
  }, [items.length, loading]);

  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <Link href={`/${rubricSlug}`} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-ink/50 transition hover:text-ink">
          <ArrowLeft size={14} /> Retour à {backLabel}
        </Link>
        <div className="relative overflow-hidden rounded-[2.25rem] px-7 py-16 sm:px-14 sm:py-24 lg:px-20" style={{ background: rubric?.softColor ?? "#f5efe7" }}>
          <div className="absolute -right-24 -top-32 size-[440px] rounded-full opacity-20 blur-[100px]" style={{ background: rubric?.color ?? "#c49555" }} />
          {fallbackImage && <img src={assetPath(fallbackImage)} alt="" className="absolute inset-0 size-full object-cover opacity-15" />}
          <div className="relative max-w-3xl">
            <span className="mb-7 grid size-14 place-items-center rounded-2xl bg-white/70 shadow-sm" style={{ color: rubric?.color ?? "#9b6b2d" }}>
              <Icon size={25} />
            </span>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: rubric?.color ?? "#9b6b2d" }}>
              {backLabel}
            </p>
            <h1 className="text-5xl font-semibold tracking-[-.055em] sm:text-7xl">{title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg">{description}</p>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Sous-rubrique</p>
            <h2 className="section-title">{title}</h2>
          </div>
          <p className="text-xs font-medium text-ink/40">{countLabel}</p>
        </div>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-[2rem] bg-white px-6 py-14 text-center shadow-soft">
            <Sparkles size={24} className="mx-auto text-ink/20" />
            <p className="mt-4 text-sm font-semibold">Aucune fiche publiée pour le moment.</p>
            <p className="mt-1 text-xs text-ink/40">Les futures adresses apparaîtront ici automatiquement.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                id={item.slug}
                className="group overflow-hidden rounded-[1.75rem] border border-black/[.05] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-sage">
                  <img
                    src={assetPath(resolveImage(item, fallbackImage))}
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
    </>
  );
}
