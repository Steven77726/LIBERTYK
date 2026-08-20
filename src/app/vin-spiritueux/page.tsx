import type { Metadata } from "next";
import { Grape, Sparkles, Wine } from "lucide-react";
import { wineActivities } from "@/data/wine-activities";
import { WineActivityGrid } from "@/components/wine/wine-activity-grid";
import { CardSubrubricGrid } from "@/components/ui/subrubric-grids";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Vin & Spiritueux casher",
  description: "Découvrez Winess, Winess Experience, Winess Signature et Pinot Noah : caviste, dégustations privées, bar mobile et wine tours.",
  path: "/vin-spiritueux",
  image: "/images/winess/winess-shop.webp",
  imageAlt: "Winess caviste à Paris",
});

export default function WineSpiritsPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-[#773b45] shadow-sm"><Wine size={22} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">Winess Collection</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Vin & Spiritueux</h1>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ink/50">Quatre façons de découvrir, partager et célébrer le vin.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">Rubrique</span>
        </div>
      </section>

      <section className="page-shell pt-10 sm:pt-14">
        <p className="eyebrow">Explorer</p>
        <h2 className="section-title">Choisir un univers</h2>
        <CardSubrubricGrid rubricSlug="vin-spiritueux" columns="md:grid-cols-3" />
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
