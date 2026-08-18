"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CakeSlice,
  ChefHat,
  ChevronRight,
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
    order: item.order,
    status: item.status,
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
  return `/${rubricSlug}/${subrubricSlug}`;
}

function usePublishedSubrubrics(rubricSlug: string, fallback: SubrubricPreview[]) {
  const [items, setItems] = useState<SubrubricPreview[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const remote = await listPublishedSubrubrics(rubricSlug);
        if (mounted && remote?.length) {
          setItems(dedupe(remote.map(normalizeSubrubric)));
          return;
        }
      } catch {
        // Fallback d'urgence lecture seule : données TypeScript locales.
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

  return items ?? fallback;
}

export function GenericSubrubricGrid({ rubricSlug }: { rubricSlug: string }) {
  const fallback = useMemo(() => localSubrubricsFor(rubricSlug), [rubricSlug]);
  const items = usePublishedSubrubrics(rubricSlug, fallback);

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-3">
      {items.map((item, index) => (
        <Link key={item.id} href={subrubricHref(rubricSlug, item.slug ?? slugify(item.name))} className="group flex items-center justify-between rounded-3xl border border-black/5 bg-white p-6 transition hover:-translate-y-1 hover:shadow-soft">
          <div>
            <span className="text-xs text-ink/35">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="mt-5 text-lg font-semibold">{item.name}</h3>
            {item.description && <p className="mt-1 text-xs text-ink/40">{item.description}</p>}
          </div>
          <span className="grid size-10 place-items-center rounded-full bg-cream transition group-hover:bg-ink group-hover:text-white"><ChevronRight size={17} /></span>
        </Link>
      ))}
    </div>
  );
}

export function FoodSubrubricGrid({ fallbackCards }: { fallbackCards: StaticSubrubricCard[] }) {
  const fallback = useMemo(() => localSubrubricsFor("food"), []);
  const items = usePublishedSubrubrics("food", fallback);

  const cards = items.map((item) => {
    const slug = item.slug ?? slugify(item.name);
    const fallbackCard = fallbackCards.find((card) => slugify(card.label) === slug);
    return {
      label: item.name,
      description: item.description || fallbackCard?.description || "",
      href: subrubricHref("food", slug),
      image: item.photo || fallbackCard?.image || "/images/food/restaurants-khan.jpg",
      icon: foodIconBySlug[slug] || Store,
    };
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map(({ label, description, icon: Icon, image, href }, index) => (
        <Link
          key={`${href}-${label}`}
          href={href}
          className={`group relative min-h-[255px] overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-2xl ${index === 0 ? "sm:col-span-2 sm:min-h-[350px]" : ""}`}
        >
          <img src={assetPath(image)} alt={label} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
            <div>
              <span className="mb-4 grid size-10 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur"><Icon size={18} /></span>
              <h3 className="text-xl font-semibold tracking-tight">{label}</h3>
              <p className="mt-1 text-xs text-white/55">{description}</p>
            </div>
            <span className="grid size-10 shrink-0 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowRight size={17} /></span>
          </div>
        </Link>
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
  const items = usePublishedSubrubrics(rubricSlug, fallback);

  const cards = items.map((item) => {
    const slug = item.slug ?? slugify(item.name);
    const fallbackCard = fallbackCards?.find((card) => slugify(card.label) === slug);
    return {
      title: item.name,
      description: item.description || fallbackCard?.description || "",
      href: subrubricHref(rubricSlug, slug),
      image: item.photo || fallbackCard?.image || categories.find((category) => category.slug === rubricSlug)?.image || "/images/food/restaurants-khan.jpg",
      icon: genericIconBySlug[slug] || Store,
    };
  });

  return (
    <div className={`mt-9 grid gap-5 ${columns}`}>
      {cards.map(({ title, description, href, icon: Icon, image }) => (
        <Link key={href} href={href} className="group relative min-h-[390px] overflow-hidden rounded-[2rem] text-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
          <img src={assetPath(image)} alt={title} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <span className="mb-5 grid size-11 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur"><Icon size={19} /></span>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-white/60">{description}</p>
            <span className="mt-5 grid size-9 place-items-center rounded-full bg-white text-ink"><ArrowRight size={15} /></span>
          </div>
        </Link>
      ))}
    </div>
  );
}
