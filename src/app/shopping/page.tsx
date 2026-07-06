import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Baby, House, Shirt, Sparkles } from "lucide-react";
import { withBasePath } from "@/lib/paths";

export const metadata: Metadata = { title: "Shopping" };

const sections = [
  { title: "Vêtements", description: "Mode pour homme, femme et enfant.", href: "/shopping/vetements", icon: Shirt, image: withBasePath("/images/shopping/azamra.webp") },
  { title: "Maison", description: "Objets, décoration et art de vivre.", href: "/shopping?type=maison", icon: House, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85" },
  { title: "Enfants", description: "Les belles trouvailles pour les plus jeunes.", href: "/shopping?type=enfants", icon: Baby, image: "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=85" },
];

export default function ShoppingPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12"><div className="rounded-[2.25rem] bg-[#4b2934] px-7 py-16 text-white sm:px-14 sm:py-24"><Sparkles size={25} /><p className="mt-7 text-xs font-semibold uppercase tracking-[.2em] text-white/45">À découvrir</p><h1 className="mt-3 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">Shopping</h1><p className="mt-5 max-w-xl text-base text-white/55">Marques, boutiques et nouveautés choisies pour vous.</p></div></section>
      <section className="page-shell py-16 sm:py-24"><p className="eyebrow">Explorer</p><h2 className="section-title">Tous les univers shopping</h2><div className="mt-9 grid gap-5 md:grid-cols-3">{sections.map(({ title, description, href, icon: Icon, image }) => <Link key={title} href={href} className="group relative min-h-[390px] overflow-hidden rounded-[2rem] text-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft"><img src={image} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6"><span className="mb-5 grid size-11 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur"><Icon size={19} /></span><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm text-white/60">{description}</p><span className="mt-5 grid size-9 place-items-center rounded-full bg-white text-ink"><ArrowRight size={15} /></span></div></Link>)}</div></section>
    </>
  );
}
