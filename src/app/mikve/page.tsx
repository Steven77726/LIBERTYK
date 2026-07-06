import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Droplets, Sparkles, UtensilsCrossed } from "lucide-react";

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
      <section className="page-shell py-16 sm:py-24"><p className="eyebrow">Choisir une rubrique</p><h2 className="section-title">Que recherchez-vous ?</h2><div className="mt-9 grid gap-5 md:grid-cols-2">{options.map(({ title, description, icon: Icon, image }) => <Link key={title} href={`/mikve?type=${encodeURIComponent(title)}`} className="group relative min-h-[390px] overflow-hidden rounded-[2rem] text-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"><img src={image} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-7"><span className="mb-5 grid size-11 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur"><Icon size={19} /></span><div className="flex items-end justify-between gap-4"><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-white/60">{description}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink"><ArrowRight size={16} /></span></div></div></Link>)}</div></section>
    </>
  );
}
