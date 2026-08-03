import type { Metadata } from "next";
import { Baby, House, Shirt, Sparkles } from "lucide-react";
import { CardSubrubricGrid } from "@/components/ui/subrubric-grids";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Shopping — Boutiques et marques",
  description: "Explorez les boutiques, vêtements, judaïca, maison et belles adresses shopping sélectionnées par Liberty.",
  path: "/shopping",
  image: "/images/shopping/azamra.webp",
  imageAlt: "Boutique Azamra",
});

const sections = [
  { title: "Vêtements", description: "Mode pour homme, femme et enfant.", href: "/shopping/vetements", icon: Shirt, image: "/images/shopping/azamra.webp" },
  { title: "Maison", description: "Objets, décoration et art de vivre.", href: "/shopping?type=maison", icon: House, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85" },
  { title: "Enfants", description: "Les belles trouvailles pour les plus jeunes.", href: "/shopping?type=enfants", icon: Baby, image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=85" },
];

export default function ShoppingPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12"><div className="rounded-[2.25rem] bg-[#4b2934] px-7 py-16 text-white sm:px-14 sm:py-24"><Sparkles size={25} /><p className="mt-7 text-xs font-semibold uppercase tracking-[.2em] text-white/45">À découvrir</p><h1 className="mt-3 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Shopping</h1><p className="mt-5 max-w-xl text-base text-white/55">Marques, boutiques et nouveautés choisies pour vous.</p></div></section>
      <section className="page-shell py-16 sm:py-24"><p className="eyebrow">Explorer</p><h2 className="section-title">Tous les univers shopping</h2><CardSubrubricGrid rubricSlug="shopping" fallbackCards={sections.map(({ title, icon: _icon, ...item }) => ({ ...item, label: title }))} /></section>
    </>
  );
}
