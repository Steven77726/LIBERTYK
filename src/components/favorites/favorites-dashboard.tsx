"use client";

import Link from "next/link";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { brunches } from "@/data/brunches";
import { restaurants } from "@/data/restaurants";
import { azamra } from "@/data/shops";
import { wineActivities } from "@/data/wine-activities";
import { getFavorites, getLikes, removeSavedEntity } from "@/lib/client-store";
import { assetPath } from "@/lib/assets";

type FavoriteItem = {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
};

const catalog: FavoriteItem[] = [
  ...restaurants.map((restaurant) => ({
    id: `restaurant-${restaurant.id}`,
    category: "🍽 Restaurants",
    title: restaurant.name,
    subtitle: `${restaurant.cuisine} · ${restaurant.fullAddress}`,
    href: `/food/restaurants#${restaurant.id}`,
    image: restaurant.image,
  })),
  ...brunches.map((brunch) => ({
    id: `brunch-${brunch.slug}`,
    category: "🍽 Brunch",
    title: brunch.name,
    subtitle: `${brunch.cuisine}${brunch.address ? ` · ${brunch.address}` : ""}`,
    href: `/food/brunch/${brunch.slug}`,
    image: brunch.images[0],
  })),
  ...wineActivities.map((activity) => ({
    id: `wine-${activity.slug}`,
    category: "🍷 Cavistes",
    title: activity.title,
    subtitle: activity.type,
    href: `/vin-spiritueux/${activity.slug}`,
    image: activity.image,
  })),
  {
    id: "shop-azamra",
    category: "🛍 Boutiques",
    title: azamra.name,
    subtitle: azamra.type,
    href: "/shopping/vetements/azamra",
    image: azamra.image,
  },
];

export function FavoritesDashboard() {
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds([...new Set([...getFavorites(), ...getLikes()])]);
  }, []);

  const grouped = useMemo(() => {
    const selected = catalog.filter((item) => savedIds.includes(item.id));
    return selected.reduce<Record<string, FavoriteItem[]>>((acc, item) => {
      acc[item.category] = [...(acc[item.category] ?? []), item];
      return acc;
    }, {});
  }, [savedIds]);

  const categories = Object.entries(grouped);
  const remove = (item: FavoriteItem) => setSavedIds(removeSavedEntity(item.id, item.title));

  if (!categories.length) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[2rem] bg-white p-8 text-center shadow-soft">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage text-moss"><Heart size={25} /></span>
          <h2 className="mt-6 text-2xl font-semibold tracking-[-.04em]">Aucun favori pour le moment</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/45">Aimez une fiche restaurant, brunch, boutique ou vin pour la retrouver automatiquement ici.</p>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-white">Explorer Liberty <ArrowRight size={14} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {categories.map(([category, items]) => (
        <section key={category}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">{category}</p>
              <h2 className="text-2xl font-semibold tracking-[-.045em]">{items.length} favori{items.length > 1 ? "s" : ""}</h2>
            </div>
            <Sparkles className="hidden text-gold sm:block" size={20} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="group overflow-hidden rounded-[1.75rem] border border-black/[.055] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <Link href={item.href} className="block">
                <div className="relative aspect-[16/10] overflow-hidden bg-sage">
                  <img src={assetPath(item.image)} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 text-[#a54b4b] backdrop-blur"><Heart size={17} fill="currentColor" /></span>
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-moss/55">{item.category}</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-.035em]">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/45">{item.subtitle}</p>
                </div>
                </Link>
                <button onClick={() => remove(item)} className="mx-5 mb-5 rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/55">Retirer des favoris</button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
