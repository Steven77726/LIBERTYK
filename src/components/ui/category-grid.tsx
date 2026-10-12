"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Store } from "lucide-react";
import { categories } from "@/data/categories";
import { assetPath } from "@/lib/assets";

type AdminRubricPreview = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image: string;
  imageAlt?: string;
  showOnHome?: boolean;
  isDormant?: boolean;
  searchKeywords?: string[];
  format?: "Petit carré" | "Carré" | "Carré standard" | "Grand carré" | "Rectangle horizontal" | "Bannière" | "Bannière pleine largeur";
  order: number;
  status: "Publié" | "En sommeil" | "Brouillon" | "Masqué";
  subrubricCount?: number;
};

const staticRubricRoutes = new Set(categories.map((category) => category.slug));

function rubricHref(slug: string) {
  if (staticRubricRoutes.has(slug)) return `/${slug}`;
  return `/rubrique?slug=${encodeURIComponent(slug)}`;
}

const initialCards = categories
  .filter((category) => category.status !== "Masqué")
  .map((category) => ({
    slug: category.slug,
    label: category.label,
    description: category.description,
    image: category.image,
    imageAlt: category.imageAlt ?? category.label,
    format: category.format ?? ("Carré standard" as const),
    icon: category.icon,
    softColor: category.softColor,
    subrubricCount: category.subrubricCount ?? 0,
    isDormant: category.isDormant === true || category.status === "En sommeil",
  }));

export function CategoryGrid() {
  const [adminRubrics, setAdminRubrics] = useState<AdminRubricPreview[] | null>(null);

  useEffect(() => {
    // Écoute uniquement les événements de publication de l'administrateur en direct
    const handleUpdate = () => {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.rubrics?.length) {
              setAdminRubrics(
                (parsed.rubrics as Array<{
                  id: string;
                  slug?: string;
                  name: string;
                  description?: string;
                  image?: string;
                  imageAlt?: string;
                  showOnHome?: boolean;
                  isDormant?: boolean;
                  searchKeywords?: string[];
                  format?: AdminRubricPreview["format"];
                  order?: number;
                  status?: AdminRubricPreview["status"];
                }>).map((rubric) => ({
                  id: rubric.id,
                  slug: rubric.slug || rubric.id,
                  name: rubric.name,
                  description: rubric.description || "",
                  image: rubric.image || "",
                  imageAlt: rubric.imageAlt || rubric.name,
                  showOnHome: rubric.showOnHome ?? true,
                  isDormant: rubric.isDormant,
                  searchKeywords: rubric.searchKeywords,
                  format: rubric.format ?? "Carré standard",
                  order: rubric.order ?? 1,
                  status: rubric.status ?? "Publié",
                }))
              );
            }
          } catch {
            // Conserve initialCards
          }
        }
      }
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("liberty-admin-published", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("liberty-admin-published", handleUpdate);
    };
  }, []);

  const cards = useMemo(() => {
    if (!adminRubrics?.length) {
      return initialCards;
    }
    return adminRubrics
      .filter((rubric) => rubric.status !== "Masqué" && rubric.showOnHome !== false)
      .sort((a, b) => a.order - b.order)
      .map((rubric) => {
        const fallback = categories.find((category) => category.slug === (rubric.slug ?? rubric.id));
        const isDormant = rubric.status === "En sommeil" || rubric.isDormant || rubric.searchKeywords?.includes("__dormant__") || fallback?.isDormant || fallback?.status === "En sommeil";
        return {
          slug: rubric.slug ?? rubric.id,
          label: rubric.name || fallback?.label || "Rubrique",
          description: rubric.description || fallback?.description || "",
          image: rubric.image || fallback?.image || "/images/food/restaurants-khan.jpg",
          imageAlt: rubric.imageAlt ?? rubric.name ?? fallback?.label,
          format: rubric.format ?? fallback?.format ?? "Carré standard",
          icon: fallback?.icon ?? Store,
          softColor: fallback?.softColor ?? "#e2eae4",
          subrubricCount: rubric.subrubricCount ?? fallback?.subrubricCount ?? 0,
          isDormant: Boolean(isDormant),
        };
      });
  }, [adminRubrics]);

  const formatClass = (format?: AdminRubricPreview["format"]) => {
    if (format === "Petit carré") return "min-h-[155px]";
    if (format === "Grand carré") return "min-h-[275px] sm:col-span-2 lg:col-span-1";
    if (format === "Rectangle horizontal") return "min-h-[205px] sm:col-span-2";
    if (format === "Bannière" || format === "Bannière pleine largeur") return "min-h-[235px] sm:col-span-2 lg:col-span-3 xl:col-span-4";
    return "min-h-[205px]";
  };

  return (
    <section className="page-shell py-8 sm:py-10">
      <div className="mb-5 max-w-3xl"><p className="eyebrow">Tous vos univers</p><h2 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Tout ce qui compte. <span className="text-ink/28">Au même endroit.</span></h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ slug, label, description, image, imageAlt, icon: Icon, softColor, format, subrubricCount, isDormant }) => {
          const cardContent = (
            <>
              <img
                src={assetPath(image)}
                alt={imageAlt ?? label}
                loading="lazy"
                decoding="async"
                className={`liberty-image-grade absolute inset-0 size-full object-cover transition duration-700 ease-out ${
                  isDormant ? "grayscale-[35%] opacity-75" : "group-hover:scale-[1.055]"
                }`}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,.20),transparent_28%),linear-gradient(to_top,rgba(0,0,0,.91),rgba(0,0,0,.38)_48%,rgba(0,0,0,.05))]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-70" />

              {/* Badge Disponible bientôt si en sommeil */}
              {isDormant ? (
                <span className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/60 px-3 py-1 text-[11px] font-semibold text-amber-200/90 shadow-md backdrop-blur-md">
                  <span className="inline-block size-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Disponible bientôt
                </span>
              ) : (
                subrubricCount > 0 && (
                  <span
                    className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-full border border-white/20 bg-white/15 text-xs font-semibold text-white/75 shadow-[0_10px_28px_rgba(0,0,0,.16)] backdrop-blur-xl"
                    aria-label={`${subrubricCount} sous-rubriques disponibles`}
                  >
                    {subrubricCount}
                  </span>
                )
              )}

              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span
                    className="grid size-8 place-items-center rounded-xl border border-white/20 bg-white/15 shadow-[0_10px_28px_rgba(0,0,0,.18)] backdrop-blur-xl transition duration-300 group-hover:scale-105"
                    style={{ color: softColor }}
                  >
                    <Icon size={15} strokeWidth={2.2} />
                  </span>
                  {!isDormant && (
                    <span className="grid size-8 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 shadow-[0_12px_28px_rgba(0,0,0,.22)] transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight size={14} />
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold tracking-[-.045em] drop-shadow-[0_8px_24px_rgba(0,0,0,.28)]">{label}</h3>
                <p className="mt-1 max-w-md text-[11px] leading-4 text-white/68 transition duration-300 group-hover:text-white/78">{description}</p>
              </div>
            </>
          );

          if (isDormant) {
            return (
              <div
                key={slug}
                aria-disabled="true"
                className={`liberty-premium-card relative overflow-hidden rounded-[1.35rem] bg-ink text-white ring-1 ring-white/10 opacity-80 cursor-not-allowed select-none ${formatClass(format)}`}
              >
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={slug}
              href={rubricHref(slug)}
              className={`liberty-premium-card group relative overflow-hidden rounded-[1.35rem] bg-ink text-white shadow-[0_14px_38px_rgba(27,35,30,.10)] ring-1 ring-white/10 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(27,35,30,.22)] ${formatClass(format)}`}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
