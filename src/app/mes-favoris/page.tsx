import type { Metadata } from "next";
import { Heart, Sparkles } from "lucide-react";
import { FavoritesDashboard } from "@/components/favorites/favorites-dashboard";

export const metadata: Metadata = {
  title: "Mes Favoris",
  description: "Retrouvez vos contenus favoris classés par catégories.",
};

export default function FavoritesPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[#171c19] px-7 py-14 text-white sm:px-14 sm:py-20">
          <div className="absolute -right-24 -top-32 size-[460px] rounded-full bg-[#c7a868]/20 blur-[100px]" />
          <div className="relative max-w-3xl">
            <span className="mb-6 grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"><Heart size={24} /></span>
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-[#d7ba7b]"><Sparkles size={13} /> Votre sélection</p>
            <h1 className="text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Mes Favoris</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">Tous vos coups de cœur Liberty, automatiquement regroupés par catégories.</p>
          </div>
        </div>
      </section>

      <section className="page-shell py-12 sm:py-16">
        <FavoritesDashboard />
      </section>
    </>
  );
}
