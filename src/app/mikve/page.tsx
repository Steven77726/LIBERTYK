import type { Metadata } from "next";
import { Droplets, Sparkles, UtensilsCrossed } from "lucide-react";
import { CardSubrubricGrid } from "@/components/ui/subrubric-grids";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Mikvé — Femme et vaisselle",
  description: "Retrouvez les informations utiles autour du mikvé femme et du mikvé vaisselle.",
  path: "/mikve",
});

const options = [
  { title: "Mikvé femme", description: "Retrouvez les adresses, horaires et informations pratiques.", icon: Sparkles, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85" },
  { title: "Mikvé vaisselle", description: "Trouvez un mikvé pour la tévilat kélim près de chez vous.", icon: UtensilsCrossed, image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=85" },
];

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function MikvePage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-[#21606c] shadow-sm"><Droplets size={22} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">Pureté & tradition</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Mikvé</h1>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ink/50">Les informations utiles, réunies dans un espace simple et respectueux.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">Rubrique</span>
        </div>
      </section>
      <section className="page-shell py-10 sm:py-14"><p className="eyebrow">Choisir une rubrique</p><h2 className="section-title">Que recherchez-vous ?</h2><CardSubrubricGrid rubricSlug="mikve" fallbackCards={options.map(({ title, description, image }) => ({ label: title, description, image, href: `/mikve/${slugify(title)}` }))} columns="md:grid-cols-2" /></section>
    </>
  );
}
