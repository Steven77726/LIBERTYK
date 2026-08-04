import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight, CakeSlice, ChefHat, Coffee, Croissant, IceCreamBowl,
  Sandwich, Soup, Store, UtensilsCrossed,
} from "lucide-react";
import { FoodSubrubricResults } from "@/components/food/food-subrubric-results";
import { FoodSubrubricGrid } from "@/components/ui/subrubric-grids";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Food casher — Restaurants, brunchs et traiteurs",
  description: "Découvrez les meilleures adresses food casher : restaurants, brunchs, salons de thé, pâtisseries, traiteurs, fast-food et glaciers.",
  path: "/food",
  image: "/images/food/restaurants-khan.jpg",
  imageAlt: "Restaurant casher Khan à Paris",
});

const addressTypes = [
  { label: "Restaurants", description: "Les tables incontournables", href: "/food/restaurants", icon: UtensilsCrossed, image: "/images/food/restaurants-khan.jpg" },
  { label: "Brunch", description: "Pour prendre le temps", href: "/food/brunch", icon: Coffee, image: "/images/food/brunch-marceau.jpg" },
  { label: "Salons de thé", description: "Douceurs et conversations", href: "/food?type=salons-de-the", icon: Coffee, image: "/images/food/salon-de-the.webp" },
  { label: "Pâtisseries", description: "Créations gourmandes", href: "/food?type=patisseries", icon: CakeSlice, image: "/images/food/patisserie.webp" },
  { label: "Traiteurs", description: "Pour recevoir sans compromis", href: "/food?type=traiteurs", icon: ChefHat, image: "/images/food/traiteur.jpg" },
  { label: "Traiteur Shabbat", description: "Vos repas de Shabbat, prêts avec soin", href: "/food?type=traiteur-chabbat", icon: ChefHat, image: "/images/food/traiteur.jpg" },
  { label: "Fast-food", description: "Rapide et généreux", href: "/food?type=fast-food", icon: Sandwich, image: "/images/food/fast-food.jpg" },
  { label: "Street Food", description: "Saveurs sur le pouce", href: "/food?type=street-food", icon: Soup, image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=85" },
  { label: "Boulangeries", description: "Le goût du savoir-faire", href: "/food?type=boulangeries", icon: Croissant, image: "/images/food/boulangerie.jpg" },
  { label: "Glaciers", description: "Fraîcheur et plaisir", href: "/food?type=glaciers", icon: IceCreamBowl, image: "/images/food/glacier.webp" },
];

const cuisines = [
  { label: "Français", detail: "Élégance & tradition", emoji: "FR" },
  { label: "Israélien", detail: "Solaire & généreux", emoji: "IL" },
  { label: "Japonais", detail: "Précis & raffiné", emoji: "JP" },
  { label: "Chinois", detail: "Parfumé & authentique", emoji: "CN" },
  { label: "Thaïlandais", detail: "Vibrant & épicé", emoji: "TH" },
  { label: "Africain", detail: "Intense & convivial", emoji: "AF" },
  { label: "Italien", detail: "Simple & passionné", emoji: "IT" },
  { label: "Libanais", detail: "Frais & généreux", emoji: "LB" },
  { label: "Américain", detail: "Gourmand & iconique", emoji: "US" },
  { label: "Marocain", detail: "Chaleureux & parfumé", emoji: "MA" },
  { label: "Tunisien", detail: "Solaire & relevé", emoji: "TN" },
  { label: "Ashkénaze", detail: "Mémoire & transmission", emoji: "AS" },
];

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
}

export default function FoodPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[#171c19] px-7 py-16 text-white sm:px-14 sm:py-24 lg:px-20">
          <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1800&q=85" alt="" className="absolute inset-0 size-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111713] via-[#111713]/85 to-transparent" />
          <div className="relative max-w-3xl">
            <span className="mb-7 grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"><UtensilsCrossed size={24} /></span>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[.22em] text-[#d7ba7b]">Toutes les saveurs casher</p>
            <h1 className="text-6xl font-semibold tracking-[-.07em] sm:text-8xl">Food</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/55 sm:text-lg">Trouvez la bonne adresse, pour chaque envie et chaque moment.</p>
          </div>
        </div>
      </section>

      <section className="page-shell py-20 sm:py-28">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-7">
          <div>
            <div className="mb-8">
              <p className="eyebrow">Choisir une adresse</p>
              <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Où souhaitez-vous aller ?</h2>
            </div>
            <FoodSubrubricGrid fallbackCards={addressTypes.map(({ icon: _icon, ...item }) => item)} />
            <Suspense fallback={null}>
              <FoodSubrubricResults />
            </Suspense>
          </div>

          <div className="lg:sticky lg:top-28">
            <div className="mb-8">
              <p className="eyebrow">Choisir une cuisine</p>
              <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Quelle saveur vous appelle ?</h2>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-black/[.06] bg-white p-2 shadow-soft sm:p-3">
              {cuisines.map(({ label, detail, emoji }, index) => (
                <Link
                  key={label}
                  href={`/food?cuisine=${slugify(label)}`}
                  className={`group flex items-center gap-4 rounded-2xl px-3 py-4 transition hover:bg-cream sm:px-5 ${index !== cuisines.length - 1 ? "border-b border-black/[.055]" : ""}`}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#f2eee5] text-[11px] font-bold tracking-[.08em] text-[#806944] transition group-hover:bg-ink group-hover:text-white">{emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold tracking-tight">{label}</h3>
                    <p className="mt-0.5 text-xs text-ink/40">{detail}</p>
                  </div>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-ink/35 transition group-hover:bg-ink group-hover:text-white"><ArrowRight size={15} /></span>
                </Link>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-4 rounded-[1.75rem] bg-[#e2eae4] p-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-moss"><Store size={20} /></span>
              <div><p className="text-sm font-semibold">Vous êtes restaurateur ?</p><p className="mt-1 text-xs text-ink/45">Faites découvrir votre établissement.</p></div>
              <ArrowRight size={17} className="ml-auto text-moss" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
