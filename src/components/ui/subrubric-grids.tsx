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
import { localSubrubrics } from "@/data/subrubrics";
import { assetPath } from "@/lib/assets";
import { listPublishedSubrubrics, type SubrubricRecord } from "@/lib/supabase/subrubrics-repository";
import { listPublishedRubrics } from "@/lib/supabase/rubrics-repository";
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
  order: number;
  status: "Publié" | "Brouillon" | "Masqué";
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
  mode: Store,
  maison: Store,
  beaute: Store,
  "mikve-femme": Store,
  "mikve-vaisselle": Store,
};

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeSubrubric(record: SubrubricRecord): SubrubricPreview {
  return {
    id: record.id,
    rubricId: record.rubricId,
    slug: record.slug,
    name: record.name,
    description: record.description,
    icon: record.icon,
    photo: record.photo,
    imageAlt: record.imageAlt,
    visible: record.visible,
    showPublicly: record.showPublicly,
    order: record.order,
    status: record.status,
  };
}

function localSubrubricsFor(rubricSlug: string): SubrubricPreview[] {
  return localSubrubrics
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
      order: item.order,
      status: "Publié",
    }));
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
  const [items, setItems] = useState<SubrubricPreview[] | null>(null);
  const [isDormant, setIsDormant] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [remoteRubrics, remote] = await Promise.all([
          listPublishedRubrics().catch(() => []),
          listPublishedSubrubrics(rubricSlug).catch(() => []),
        ]);

        const parentRubric = (remoteRubrics ?? []).find((r) => r.slug === rubricSlug || r.id === rubricSlug);
        if (mounted && parentRubric?.isDormant) {
          setIsDormant(true);
          setItems([]);
          return;
        }

        if (mounted && remote?.length) {
          setItems(dedupe(remote.map(normalizeSubrubric)));
          return;
        }
        // Lecture depuis le cache de l'administrateur
        if (typeof window !== "undefined") {
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
                status?: string;
                showPublicly?: boolean;
                order?: number;
              };
              const rawSubs = (parsed?.subrubrics as StoredSubrubric[]) ?? [];
              const matched = rawSubs.filter(
                (s) => (s.rubricId === rubricSlug || s.rubricId === `rubric-${rubricSlug}`) && s.status === "Publié" && s.showPublicly !== false
              );
              if (matched.length > 0) {
                const combined = dedupe([
                  ...fallback,
                  ...matched.map((s) => ({
                    id: s.id,
                    rubricId: s.rubricId,
                    slug: s.slug || slugify(s.name),
                    name: s.name,
                    description: s.description,
                    icon: s.icon,
                    photo: s.photo || s.image,
                    imageAlt: s.imageAlt || s.name,
                    visible: true,
                    showPublicly: true,
                    order: s.order || 1,
                    status: "Publié" as const,
                  })),
                ]);
                setItems(combined);
                return;
              }
          }
        }
      } catch {
        // Fallback d'urgence lecture seule
      }
      if (mounted) setItems(fallback);
    }
    void load();

    const refresh = () => void load();
    window.addEventListener("storage", refresh);
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, [fallback, rubricSlug]);

  return { items: items ?? fallback, isDormant };
}

function usePublishedEstablishmentCounts(rubricSlug: string) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const remoteCounts = await listPublishedEstablishmentCountsBySubrubric(rubricSlug);
        if (mounted) setCounts(remoteCounts ?? {});
      } catch {
        if (mounted) setCounts({});
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
  return counts[item.id] ?? counts[item.slug ?? ""] ?? 0;
}

function countLabel(count: number) {
  return `${count} fiche${count > 1 ? "s" : ""}`;
}

function imageForSubrubric(rubricSlug: string, item: SubrubricPreview, fallbackCards?: StaticSubrubricCard[]) {
  const slug = item.slug ?? slugify(item.name);
  const fallbackCard = fallbackCards?.find((card) => slugify(card.label) === slug);
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

  return (
    <Link
      href={subrubricHref(rubricSlug, slug)}
      className={`group relative overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-2xl ${featured ? "min-h-[350px] sm:col-span-2" : "min-h-[255px]"}`}
    >
      <img src={assetPath(image)} alt={item.imageAlt || item.name} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
        <div className="min-w-0">
          <span className="mb-4 grid size-10 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur"><Icon size={18} /></span>
          <h3 className="truncate text-xl font-semibold tracking-tight">{item.name}</h3>
          {description && <p className="mt-1 line-clamp-2 text-xs text-white/60">{description}</p>}
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[.14em] text-white/45">{countLabel(establishmentCount)}</p>
        </div>
        <span className="grid size-10 shrink-0 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowRight size={17} /></span>
      </div>
    </Link>
  );
}

export function GenericSubrubricGrid({ rubricSlug }: { rubricSlug: string }) {
  const fallback = useMemo(() => localSubrubricsFor(rubricSlug), [rubricSlug]);
  const { items, isDormant } = usePublishedSubrubrics(rubricSlug, fallback);
  const counts = usePublishedEstablishmentCounts(rubricSlug);

  if (isDormant) {
    return (
      <div className="mt-8 rounded-3xl border border-black/10 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
        <span className="inline-block rounded-full border border-amber-500/30 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
          Bientôt disponible
        </span>
        <p className="mt-3 text-sm text-ink/60">Cette rubrique sera prochainement disponible sur Liberty K.</p>
      </div>
    );
  }

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
  const { items, isDormant } = usePublishedSubrubrics("food", fallback);
  const counts = usePublishedEstablishmentCounts("food");

  if (isDormant) {
    return (
      <div className="mt-8 rounded-3xl border border-black/10 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
        <span className="inline-block rounded-full border border-amber-500/30 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
          Bientôt disponible
        </span>
        <p className="mt-3 text-sm text-ink/60">Cette rubrique sera prochainement disponible sur Liberty K.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
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
  const { items, isDormant } = usePublishedSubrubrics(rubricSlug, fallback);
  const counts = usePublishedEstablishmentCounts(rubricSlug);

  if (isDormant) {
    return (
      <div className="mt-8 rounded-3xl border border-black/10 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
        <span className="inline-block rounded-full border border-amber-500/30 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider">
          Bientôt disponible
        </span>
        <p className="mt-3 text-sm text-ink/60">Cette rubrique sera prochainement disponible sur Liberty K.</p>
      </div>
    );
  }

  return (
    <div className={`mt-9 grid gap-5 ${columns}`}>
      {items.map((item) => (
        <SubrubricCard key={item.id} rubricSlug={rubricSlug} item={item} fallbackCards={fallbackCards} establishmentCount={countForSubrubric(counts, item)} />
      ))}
    </div>
  );
}
