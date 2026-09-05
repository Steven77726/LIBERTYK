"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CakeSlice,
  ChefHat,
  Coffee,
  Croissant,
  IceCreamBowl,
  Sandwich,
  Soup,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { categories } from "@/data/categories";
import { localSubrubrics, subrubricSlugAliases } from "@/data/subrubrics";
import { localEstablishments } from "@/data/establishments";
import { assetPath } from "@/lib/assets";
import { listPublishedSubrubrics, type SubrubricRecord } from "@/lib/supabase/subrubrics-repository";
import { listPublishedEstablishmentCountsBySubrubric } from "@/lib/supabase/establishments-repository";

type SubrubricPreview = {
  id: string;
  rubricId: string;
  slug?: string;
  name: string;
  description?: string;
  icon?: string;
  photo?: string;
  imageAlt?: string;
  visible?: boolean;
  showPublicly?: boolean;
  isDormant?: boolean;
  order: number;
  status: "Publié" | "En sommeil" | "Brouillon" | "Masqué";
};

type StaticSubrubricCard = {
  label: string;
  description: string;
  href: string;
  image: string;
};

const foodIconBySlug: Record<string, LucideIcon> = {
  restaurants: UtensilsCrossed,
  brunch: Coffee,
  "salons-de-the": Coffee,
  patisseries: CakeSlice,
  traiteurs: ChefHat,
  "traiteur-chabbat": ChefHat,
  "fast-food": Sandwich,
  "street-food": Soup,
  boulangeries: Croissant,
  glaciers: IceCreamBowl,
};

const genericIconBySlug: Record<string, LucideIcon> = {
  restaurants: UtensilsCrossed,
  brunch: Coffee,
  patisseries: CakeSlice,
  traiteurs: ChefHat,
  "vetement-masculin": Store,
  "vetement-feminin": Store,
  "objet-utile": Store,
  "mikve-femme": Store,
  "mikve-vaisselle": Store,
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeSubrubric(item: SubrubricRecord | SubrubricPreview): SubrubricPreview {
  return {
    id: item.id,
    rubricId: item.rubricId,
    slug: item.slug,
    name: item.name,
    description: item.description,
    icon: item.icon,
    photo: "photo" in item ? item.photo : undefined,
    imageAlt: item.imageAlt,
    visible: item.visible,
    showPublicly: item.showPublicly,
    isDormant: item.isDormant,
    order: item.order,
    status: item.status,
  };
}

const SHOPPING_WHITELIST_SLUGS = new Set([
  "vetement-masculin",
  "vetement-feminin",
  "objet-utile",
]);

const SORTIES_WHITELIST_SLUGS = new Set([
  "evenements",
  "concerts",
  "concert",
  "soirees-celibataires",
  "soirees-celibataire",
  "celibataire",
]);

function applyWhitelists(items: SubrubricPreview[], rubricSlug: string): SubrubricPreview[] {
  if (rubricSlug === "shopping" || rubricSlug === "rubric-shopping") {
    return items.filter((item) => {
      const slug = (item.slug || slugify(item.name)).toLowerCase();
      return SHOPPING_WHITELIST_SLUGS.has(slug);
    });
  }
  if (rubricSlug === "sorties" || rubricSlug === "rubric-sorties") {
    return items.filter((item) => {
      const slug = (item.slug || slugify(item.name)).toLowerCase();
      return SORTIES_WHITELIST_SLUGS.has(slug);
    });
  }
  return items;
}

function localSubrubricsFor(rubricSlug: string): SubrubricPreview[] {
  const list = localSubrubrics
    .filter((item) => item.rubricId === rubricSlug)
    .map((item) => ({
      id: item.id,
      rubricId: item.rubricId,
      slug: item.slug,
      name: item.name,
      description: item.description,
      icon: item.icon,
      photo: item.image,
      imageAlt: item.imageAlt,
      visible: item.showPublicly,
      showPublicly: item.showPublicly,
      isDormant: item.isDormant,
      status: item.status ?? (item.isDormant ? ("En sommeil" as const) : ("Publié" as const)),
      order: item.order,
    }));
  return applyWhitelists(list, rubricSlug);
}

function dedupe(items: SubrubricPreview[]) {
  const map = new Map<string, SubrubricPreview>();
  items.forEach((item) => {
    const key = `${item.rubricId}-${item.slug ?? slugify(item.name)}`;
    if (!map.has(key)) map.set(key, item);
  });
  return [...map.values()].sort((a, b) => a.order - b.order);
}

function subrubricHref(rubricSlug: string, subrubricSlug: string) {
  if (rubricSlug === "food" && subrubricSlug === "restaurants") return "/food/restaurants";
  if (rubricSlug === "food" && subrubricSlug === "brunch") return "/food/brunch";
  const isKnownCategory = categories.some((category) => category.slug === rubricSlug);
  const hasStaticSubrubricPage = localSubrubrics.some((item) => item.rubricId === rubricSlug && item.slug === subrubricSlug);
  if (!isKnownCategory || !hasStaticSubrubricPage) {
    return `/rubrique?slug=${encodeURIComponent(rubricSlug)}&subrubric=${encodeURIComponent(subrubricSlug)}`;
  }
  return `/${rubricSlug}/${subrubricSlug}`;
}

function usePublishedSubrubrics(rubricSlug: string, fallback: SubrubricPreview[]) {
  const [items, setItems] = useState<SubrubricPreview[]>(() => applyWhitelists(fallback, rubricSlug));

  useEffect(() => {
    let mounted = true;

    async function load() {
      // 1. Initialiser depuis les données locales de secours
      const subMap = new Map<string, SubrubricPreview>();
      applyWhitelists(fallback, rubricSlug).forEach((item) => {
        const key = item.slug ?? slugify(item.name);
        subMap.set(item.id, item);
        subMap.set(key, item);
        subMap.set(`${rubricSlug}-${key}`, item);
      });

      // 2. Fusionner immédiatement avec le cache local de l'admin (localStorage)
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            type StoredSubrubric = {
              id: string;
              rubricId: string;
              slug?: string;
              name: string;
              description?: string;
              icon?: string;
              photo?: string;
              image?: string;
              imageAlt?: string;
              isDormant?: boolean;
              searchKeywords?: string[];
              status?: string;
              showPublicly?: boolean;
              order?: number;
            };
            const rawSubs = (parsed?.subrubrics as StoredSubrubric[]) ?? [];
            rawSubs
              .filter(
                (s) =>
                  (s.rubricId === rubricSlug || s.rubricId === `rubric-${rubricSlug}`) &&
                  s.status === "Publié" &&
                  s.showPublicly !== false &&
                  !s.isDormant &&
                  !s.searchKeywords?.includes("__dormant__")
              )
              .forEach((s) => {
                const key = s.slug || slugify(s.name);
                const existing = subMap.get(s.id) || subMap.get(key) || subMap.get(`${rubricSlug}-${key}`);
                const photo = s.photo || s.image || existing?.photo;
                const updated: SubrubricPreview = {
                  id: s.id,
                  rubricId: s.rubricId,
                  slug: key,
                  name: s.name,
                  description: s.description ?? existing?.description ?? "",
                  icon: s.icon ?? existing?.icon,
                  photo,
                  imageAlt: s.imageAlt ?? existing?.imageAlt ?? s.name,
                  visible: true,
                  showPublicly: true,
                  order: s.order ?? existing?.order ?? 1,
                  status: "Publié" as const,
                };
                subMap.set(s.id, updated);
                subMap.set(key, updated);
                subMap.set(`${rubricSlug}-${key}`, updated);
              });
          }
        } catch {
          // ignore
        }
      }

      // 3. Fusionner avec Supabase en direct
      try {
        const remote = await listPublishedSubrubrics(rubricSlug);
        if (mounted && remote && remote.length > 0) {
          remote.forEach((item) => {
            const norm = normalizeSubrubric(item);
            const key = norm.slug ?? slugify(norm.name);
            const existing = subMap.get(norm.id) || subMap.get(key) || subMap.get(`${rubricSlug}-${key}`);
            const photo = norm.photo || existing?.photo;
            const updated: SubrubricPreview = {
              ...existing,
              ...norm,
              photo,
            };
            subMap.set(norm.id, updated);
            subMap.set(key, updated);
            subMap.set(`${rubricSlug}-${key}`, updated);
          });
        }
      } catch {
        // Fallback local intact
      }

      if (mounted) {
        const unique = Array.from(subMap.values());
        setItems(applyWhitelists(dedupe(unique), rubricSlug));
      }
    }

    void load();

    const refresh = () => void load();
    window.addEventListener("storage", refresh);
    window.addEventListener("liberty-admin-published", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("liberty-admin-published", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [fallback, rubricSlug]);

  return items ?? fallback;
}

function computeLocalEstablishmentCounts(rubricSlug: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const estMap = new Map<string, { id: string; rubricId: string; subrubricId?: string; status?: string; visible?: boolean }>();

  // 1. Initial from localEstablishments
  (localEstablishments ?? []).forEach((est) => {
    if (est.rubricId === rubricSlug || est.rubricId === `rubric-${rubricSlug}`) {
      if (est.status !== "Masqué") {
        estMap.set(est.id, est);
      }
    }
  });

  // 2. Merge from localStorage
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        const adminEsts = (parsed?.establishments ?? []) as Array<{ id: string; rubricId: string; subrubricId?: string; status?: string; visible?: boolean }>;
        adminEsts.forEach((est) => {
          if (est.rubricId === rubricSlug || est.rubricId === `rubric-${rubricSlug}`) {
            if (est.status === "Publié" && est.visible !== false) {
              let subrubricId = est.subrubricId;
              const name = ((est as { name?: string }).name || "").toLowerCase();
              if (est.id === "azamra" || name.includes("azamra")) {
                subrubricId = "vetement-masculin";
              } else if (est.id === "naor" || name.includes("naor")) {
                subrubricId = "vetement-feminin";
              }
              estMap.set(est.id, { ...est, subrubricId });
            } else if (est.status === "Masqué" || est.visible === false) {
              estMap.delete(est.id);
            }
          }
        });
      }
    } catch {
      // ignore
    }
  }

  // Count per subrubricId
  estMap.forEach((est) => {
    const rawSub = (est.subrubricId || "").trim();
    if (!rawSub) return;
    const cleanSub = rawSub.toLowerCase();
    const withoutPrefix = cleanSub.replace(new RegExp(`^${rubricSlug}-`), "");
    const aliased = subrubricSlugAliases[cleanSub] || subrubricSlugAliases[withoutPrefix] || withoutPrefix;

    [rawSub, cleanSub, withoutPrefix, aliased, `${rubricSlug}-${aliased}`].forEach((key) => {
      counts[key] = (counts[key] ?? 0) + 1;
    });
  });

  return counts;
}

function usePublishedEstablishmentCounts(rubricSlug: string) {
  const [counts, setCounts] = useState<Record<string, number>>(() => computeLocalEstablishmentCounts(rubricSlug));

  useEffect(() => {
    let mounted = true;
    async function load() {
      const localCounts = computeLocalEstablishmentCounts(rubricSlug);
      try {
        const remoteCounts = await listPublishedEstablishmentCountsBySubrubric(rubricSlug);
        if (mounted) {
          const merged = { ...localCounts };
          if (remoteCounts) {
            Object.entries(remoteCounts).forEach(([k, v]) => {
              merged[k] = Math.max(merged[k] ?? 0, v);
            });
          }
          setCounts(merged);
        }
      } catch {
        if (mounted) setCounts(localCounts);
      }
    }
    void load();

    const refresh = () => void load();
    window.addEventListener("storage", refresh);
    window.addEventListener("liberty-admin-published", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("liberty-admin-published", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [rubricSlug]);

  return counts;
}

function countForSubrubric(counts: Record<string, number>, item: SubrubricPreview) {
  const rawId = item.id;
  const slug = item.slug ?? slugify(item.name);
  const alias = subrubricSlugAliases[rawId] || subrubricSlugAliases[slug] || subrubricSlugAliases[`${item.rubricId}-${slug}`];
  
  return (
    counts[rawId] ??
    counts[slug] ??
    counts[`${item.rubricId}-${slug}`] ??
    (alias ? counts[alias] ?? counts[`${item.rubricId}-${alias}`] : undefined) ??
    0
  );
}

function countLabel(count: number) {
  return `${count} fiche${count > 1 ? "s" : ""}`;
}

function imageForSubrubric(rubricSlug: string, item: SubrubricPreview, fallbackCards?: StaticSubrubricCard[]) {
  const slug = item.slug ?? slugify(item.name);
  const fallbackCard = fallbackCards?.find((card) => {
    const cardSlug = slugify(card.label);
    return cardSlug === slug || (slug.startsWith("patisserie") && cardSlug.startsWith("patisserie")) || (slug.startsWith("traiteur") && cardSlug.startsWith("traiteur")) || (slug.startsWith("fast") && cardSlug.startsWith("fast")) || (slug.startsWith("restauration-rapide") && cardSlug.startsWith("fast")) || (slug.startsWith("boulangerie") && cardSlug.startsWith("boulangerie")) || (slug.startsWith("glacier") && cardSlug.startsWith("glacier"));
  });
  return item.photo || fallbackCard?.image || categories.find((category) => category.slug === rubricSlug)?.image || "/images/food/restaurants-khan.jpg";
}

function descriptionForSubrubric(item: SubrubricPreview, fallbackCards?: StaticSubrubricCard[]) {
  const slug = item.slug ?? slugify(item.name);
  const fallbackCard = fallbackCards?.find((card) => slugify(card.label) === slug);
  return item.description || fallbackCard?.description || "";
}

function iconForSubrubric(rubricSlug: string, item: SubrubricPreview) {
  const slug = item.slug ?? slugify(item.name);
  if (rubricSlug === "food") return foodIconBySlug[slug] || Store;
  return genericIconBySlug[slug] || Store;
}

function SubrubricCard({
  rubricSlug,
  item,
  fallbackCards,
  establishmentCount,
  featured = false,
}: {
  rubricSlug: string;
  item: SubrubricPreview;
  fallbackCards?: StaticSubrubricCard[];
  establishmentCount: number;
  featured?: boolean;
}) {
  const slug = item.slug ?? slugify(item.name);
  const Icon = iconForSubrubric(rubricSlug, item);
  const image = imageForSubrubric(rubricSlug, item, fallbackCards);
  const description = descriptionForSubrubric(item, fallbackCards);
  const isDormant = item.status === "En sommeil" || item.isDormant;

  const content = (
    <>
      <img
        src={assetPath(image)}
        alt={item.imageAlt || item.name}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 size-full object-cover transition duration-700 ${
          isDormant ? "grayscale-[35%] opacity-75" : "group-hover:scale-105"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
      {isDormant && (
        <span className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-black/60 px-3 py-1 text-[11px] font-semibold text-amber-200/90 shadow-md backdrop-blur-md">
          <span className="inline-block size-1.5 rounded-full bg-amber-400 animate-pulse" />
          Disponible bientôt
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
        <div className="min-w-0">
          <span className="mb-4 grid size-10 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur">
            <Icon size={18} />
          </span>
          <h3 className="truncate text-xl font-semibold tracking-tight">{item.name}</h3>
          {description && <p className="mt-1 line-clamp-2 text-xs text-white/60">{description}</p>}
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[.14em] text-white/45">
            {isDormant ? "Bientôt disponible" : countLabel(establishmentCount)}
          </p>
        </div>
        {!isDormant && (
          <span className="grid size-10 shrink-0 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowRight size={17} />
          </span>
        )}
      </div>
    </>
  );

  if (isDormant) {
    return (
      <div
        aria-disabled="true"
        className={`relative overflow-hidden rounded-[1.75rem] bg-ink text-white ring-1 ring-white/10 opacity-85 cursor-not-allowed select-none ${
          featured ? "min-h-[350px] sm:col-span-2" : "min-h-[255px]"
        }`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={subrubricHref(rubricSlug, slug)}
      className={`group relative overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-2xl ${
        featured ? "min-h-[350px] sm:col-span-2" : "min-h-[255px]"
      }`}
    >
      {content}
    </Link>
  );
}

export function GenericSubrubricGrid({ rubricSlug }: { rubricSlug: string }) {
  const fallback = useMemo(() => localSubrubricsFor(rubricSlug), [rubricSlug]);
  const rawItems = usePublishedSubrubrics(rubricSlug, fallback);
  const items = useMemo(() => applyWhitelists(rawItems, rubricSlug), [rawItems, rubricSlug]);
  const counts = usePublishedEstablishmentCounts(rubricSlug);

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const establishmentCount = countForSubrubric(counts, item);
        return (
          <SubrubricCard key={item.id} rubricSlug={rubricSlug} item={item} establishmentCount={establishmentCount} />
        );
      })}
    </div>
  );
}

export function FoodSubrubricGrid({ fallbackCards }: { fallbackCards: StaticSubrubricCard[] }) {
  const fallback = useMemo(() => localSubrubricsFor("food"), []);
  const items = usePublishedSubrubrics("food", fallback);
  const counts = usePublishedEstablishmentCounts("food");

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <SubrubricCard key={item.id} rubricSlug="food" item={item} fallbackCards={fallbackCards} establishmentCount={countForSubrubric(counts, item)} featured={index === 0} />
      ))}
    </div>
  );
}

export function CardSubrubricGrid({
  rubricSlug,
  fallbackCards,
  columns = "md:grid-cols-3",
}: {
  rubricSlug: string;
  fallbackCards?: StaticSubrubricCard[];
  columns?: string;
}) {
  const fallback = useMemo(() => localSubrubricsFor(rubricSlug), [rubricSlug]);
  const rawItems = usePublishedSubrubrics(rubricSlug, fallback);
  const items = useMemo(() => applyWhitelists(rawItems, rubricSlug), [rawItems, rubricSlug]);
  const counts = usePublishedEstablishmentCounts(rubricSlug);

  return (
    <div className={`mt-9 grid gap-5 ${columns}`}>
      {items.map((item) => (
        <SubrubricCard key={item.id} rubricSlug={rubricSlug} item={item} fallbackCards={fallbackCards} establishmentCount={countForSubrubric(counts, item)} />
      ))}
    </div>
  );
}
