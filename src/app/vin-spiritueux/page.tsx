import type { Metadata } from "next";
import { Grape, Sparkles, Wine } from "lucide-react";
import { wineActivities } from "@/data/wine-activities";
import { WineActivityGrid } from "@/components/wine/wine-activity-grid";

export const metadata: Metadata = {
  title: "Vin & Spiritueux",
  description: "Découvrez les activités Winess et Pinot Noah.",
};

export default function WineSpiritsPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[#211315] px-7 py-16 text-white sm:px-14 sm:py-24 lg:px-20">
          <div className="absolute -right-24 -top-32 size-[480px] rounded-full bg-[#8f4e56]/25 blur-[100px]" />
          <div className="relative max-w-3xl">
            <span className="mb-7 grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"><Wine size={24} /></span>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[.22em] text-[#d3aa72]">Winess Collection</p>
            <h1 className="text-5xl font-semibold tracking-[-.065em] sm:text-7xl">Vin & Spiritueux</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/52 sm:text-lg">Quatre façons de découvrir, partager et célébrer le vin.</p>
          </div>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <div className="mb-10 flex items-end justify-between gap-5">
          <div><p className="eyebrow">Nos maisons</p><h2 className="section-title">Une expérience pour chaque envie.</h2></div>
          <Sparkles className="hidden text-gold sm:block" size={24} />
        </div>
        <WineActivityGrid activities={wineActivities} />
      </section>

      <section className="page-shell pb-20">
        <div className="flex items-center gap-5 rounded-[2rem] bg-[#e9e0d2] p-7 sm:p-10">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-[#773b45]"><Grape size={21} /></span>
          <div><p className="font-semibold">L’abus d’alcool est dangereux pour la santé.</p><p className="mt-1 text-xs text-ink/45">À consommer avec modération. Vente interdite aux mineurs.</p></div>
        </div>
      </section>
    </>
  );
}
