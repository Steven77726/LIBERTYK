import type { Metadata } from "next";
import { Droplets, Sparkles, UtensilsCrossed } from "lucide-react";
import { CardSubrubricGrid } from "@/components/ui/subrubric-grids";

export const metadata: Metadata = { title: "Mikvé", description: "Mikvé femme et mikvé vaisselle." };

const options = [
  { title: "Mikvé femme", description: "Retrouvez les adresses, horaires et informations pratiques.", icon: Sparkles, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85" },
  { title: "Mikvé vaisselle", description: "Trouvez un mikvé pour la tévilat kélim près de chez vous.", icon: UtensilsCrossed, image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1200&q=85" },
];

export default function MikvePage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[#17343c] px-7 py-16 text-white sm:px-14 sm:py-24">
          <div className="absolute -right-24 -top-24 size-96 rounded-full bg-[#65a9ba]/25 blur-[90px]" />
          <div className="relative"><span className="grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10"><Droplets size={25} /></span><p className="mt-7 text-xs font-semibold uppercase tracking-[.2em] text-white/45">Pureté & tradition</p><h1 className="mt-3 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Mikvé</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/55">Les informations utiles, réunies dans un espace simple et respectueux.</p></div>
        </div>
      </section>
      <section className="page-shell py-16 sm:py-24"><p className="eyebrow">Choisir une rubrique</p><h2 className="section-title">Que recherchez-vous ?</h2><CardSubrubricGrid rubricSlug="mikve" fallbackCards={options.map(({ title, icon: _icon, ...item }) => ({ ...item, label: title, href: `/mikve?type=${encodeURIComponent(title)}` }))} columns="md:grid-cols-2" /></section>
    </>
  );
}
