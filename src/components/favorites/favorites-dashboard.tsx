"use client";

import Link from "next/link";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { assetPath } from "@/lib/assets";
import {
  favoritesChangedEvent,
  listFavorites,
  toggleFavorite,
  type FavoriteRecord,
} from "@/lib/favorites/favorites-service";

export function FavoritesDashboard() {
  const [items, setItems] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setError("");
        const favorites = await listFavorites();
        if (mounted) setItems(favorites);
      } catch (loadError) {
        if (mounted) setError(loadError instanceof Error ? loadError.message : "Impossible de charger vos favoris.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    window.addEventListener(favoritesChangedEvent, load);
    return () => {
      mounted = false;
      window.removeEventListener(favoritesChangedEvent, load);
    };
  }, []);

  const grouped = useMemo(() => {
    return items.reduce<Record<string, FavoriteRecord[]>>((acc, item) => {
      acc[item.category] = [...(acc[item.category] ?? []), item];
      return acc;
    }, {});
  }, [items]);

  const categories = Object.entries(grouped);
  const remove = async (item: FavoriteRecord) => {
    const previous = items;
    setItems((current) => current.filter((favorite) => favorite.establishmentId !== item.establishmentId));
    try {
      await toggleFavorite(item.establishmentId);
    } catch (removeError) {
      setItems(previous);
      setError(removeError instanceof Error ? removeError.message : "Impossible de retirer ce favori.");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[2rem] bg-white p-8 text-center shadow-soft">
        <p className="text-sm font-semibold text-ink/45">Chargement de vos favoris…</p>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-[2rem] bg-white p-8 text-center shadow-soft">
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-sage text-moss"><Heart size={25} /></span>
          <h2 className="mt-6 text-2xl font-semibold tracking-[-.04em]">No favorites yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink/45">Ajoutez une adresse en favori pour la retrouver automatiquement ici.</p>
          {error && <p className="mx-auto mt-4 max-w-md rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-white">Explorer Liberty <ArrowRight size={14} /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
      {categories.map(([category, favorites]) => (
        <section key={category}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">{category}</p>
              <h2 className="text-2xl font-semibold tracking-[-.045em]">{favorites.length} favori{favorites.length > 1 ? "s" : ""}</h2>
            </div>
            <Sparkles className="hidden text-gold sm:block" size={20} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((item) => (
              <article key={item.establishmentId} className="group overflow-hidden rounded-[1.75rem] border border-black/[.055] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                <Link href={item.href} className="block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-sage">
                    <img src={assetPath(item.image)} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 text-[#a54b4b] backdrop-blur"><Heart size={17} fill="currentColor" /></span>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-moss/55">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-.035em]">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/45">{item.city || "Adresse Liberty"}</p>
                  </div>
                </Link>
                <div className="mx-5 mb-5 grid grid-cols-2 gap-2">
                  <Link href={item.href} className="rounded-full bg-ink px-4 py-2 text-center text-xs font-semibold text-white">Ouvrir</Link>
                  <button onClick={() => remove(item)} className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/55">Retirer</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
