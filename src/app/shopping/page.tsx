import type { Metadata } from "next";
import { Shirt, Sparkles, Store } from "lucide-react";
import { CardSubrubricGrid } from "@/components/ui/subrubric-grids";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Shopping — Boutiques et marques · Liberty K",
  description: "Explorez les boutiques, prêt-à-porter, mode et objets utiles sélectionnés par Liberty K.",
  path: "/shopping",
  image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85",
  imageAlt: "Shopping Liberty K",
});

const sections = [
  {
    title: "Vêtement masculin",
    description: "Costumes, chemises et mode homme.",
    href: "/shopping/vetement-masculin",
    icon: Shirt,
    image: "https://dnpcrousaeoyyuxszwwm.supabase.co/storage/v1/object/public/liberty-images/subrubrics/95561406-7161-49c0-b01f-a28e5995b212.png?v=1787657340916",
  },
  {
    title: "Vêtement féminin",
    description: "Prêt-à-porter féminin, robes et élégance.",
    href: "/shopping/vetement-feminin",
    icon: Sparkles,
    image: "https://dnpcrousaeoyyuxszwwm.supabase.co/storage/v1/object/public/liberty-images/subrubrics/f5898d18-04d9-4f92-b8a0-1dd8637a8d12.png?v=1787657099897",
  },
  {
    title: "Objet utile",
    description: "Objets, accessoires, décoration et art de vivre.",
    href: "/shopping/objet-utile",
    icon: Store,
    image: "https://dnpcrousaeoyyuxszwwm.supabase.co/storage/v1/object/public/liberty-images/subrubrics/bead8356-d4a6-4b86-884b-e80bdc7b9821.png?v=1787658132120",
  },
];

export default function ShoppingPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-[#8f4e56] shadow-sm"><Sparkles size={22} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">À découvrir</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Shopping</h1>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ink/50">Marques, boutiques et nouveautés choisies pour vous.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">Rubrique</span>
        </div>
      </section>
      <section className="page-shell py-10 sm:py-14"><p className="eyebrow">Explorer</p><h2 className="section-title">Tous les univers shopping</h2><CardSubrubricGrid rubricSlug="shopping" fallbackCards={sections.map(({ title, description, href, image }) => ({ label: title, description, href, image }))} /></section>
    </>
  );
}
