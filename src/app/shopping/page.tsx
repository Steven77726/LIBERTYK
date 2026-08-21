import type { Metadata } from "next";
import { Baby, House, Shirt, Sparkles } from "lucide-react";
import { CardSubrubricGrid } from "@/components/ui/subrubric-grids";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Shopping — Boutiques et marques",
  description: "Explorez les boutiques, vêtements, judaïca, maison et belles adresses shopping sélectionnées par Liberty.",
  path: "/shopping",
  image: "/images/shopping/azamra.jpg",
  imageAlt: "Boutique Azamra",
});

const sections = [
  { title: "Vêtements", description: "Mode pour homme, femme et enfant.", href: "/shopping/vetements", icon: Shirt, image: "/images/shopping/azamra.jpg" },
  { title: "Maison", description: "Objets, décoration et art de vivre.", href: "/shopping/maison", icon: House, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85" },
  { title: "Enfants", description: "Les belles trouvailles pour les plus jeunes.", href: "/shopping/enfants", icon: Baby, image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=85" },
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
