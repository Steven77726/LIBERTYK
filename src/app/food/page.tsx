import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, CakeSlice, ChefHat, Coffee, Croissant, IceCreamBowl,
  Sandwich, Soup, Store, UtensilsCrossed,
} from "lucide-react";
import { FoodSubrubricGrid } from "@/components/ui/subrubric-grids";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Food casher — Restaurants, brunchs et traiteurs",
  description: "Découvrez les meilleures adresses food casher : restaurants, brunchs, salons de thé, pâtisseries, traiteurs, fast-food et glaciers.",
  path: "/food",
  image: "/images/food/restaurants-khan.jpg",
  imageAlt: "Restaurant casher Khan à Paris",
});

import { restaurants } from "@/data/restaurants";

const addressTypes = [
  { label: "Restaurants", description: "Les tables incontournables", href: "/food/restaurants", icon: UtensilsCrossed, image: "/images/food/restaurants-khan.jpg" },
  { label: "Brunch", description: "Pour prendre le temps", href: "/food/brunch", icon: Coffee, image: "/images/food/brunch-marceau.jpg" },
  { label: "Salons de thé", description: "Douceurs et conversations", href: "/food/salons-de-the", icon: Coffee, image: "/images/food/salon-de-the.webp" },
  { label: "Pâtisseries", description: "Créations gourmandes", href: "/food/patisseries", icon: CakeSlice, image: "/images/food/patisserie.webp" },
  { label: "Traiteurs", description: "Pour recevoir sans compromis", href: "/food/traiteurs", icon: ChefHat, image: "/images/food/traiteur.jpg" },
  { label: "Traiteur Shabbat", description: "Vos repas de Shabbat, prêts avec soin", href: "/food/traiteur-chabbat", icon: ChefHat, image: "/images/food/traiteur.jpg" },
  { label: "Fast-food", description: "Rapide et généreux", href: "/food/fast-food", icon: Sandwich, image: "/images/food/fast-food.jpg" },
  { label: "Street Food", description: "Saveurs sur le pouce", href: "/food/street-food", icon: Soup, image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=85" },
  { label: "Boulangeries", description: "Le goût du savoir-faire", href: "/food/boulangeries", icon: Croissant, image: "/images/food/boulangerie.jpg" },
  { label: "Glaciers", description: "Fraîcheur et plaisir", href: "/food/glaciers", icon: IceCreamBowl, image: "/images/food/glacier.webp" },
];

const cuisineList = [
  { label: "Français", detail: "Élégance & tradition" },
  { label: "Israélien", detail: "Solaire & généreux" },
  { label: "Japonais", detail: "Précis & raffiné" },
  { label: "Chinois", detail: "Parfumé & authentique" },
  { label: "Thaïlandais", detail: "Vibrant & épicé" },
  { label: "Africain", detail: "Intense & convivial" },
  { label: "Italien", detail: "Simple & passionné" },
  { label: "Libanais", detail: "Frais & généreux" },
  { label: "Américain", detail: "Gourmand & iconique" },
  { label: "Marocain", detail: "Chaleureux & parfumé" },
  { label: "Tunisien", detail: "Solaire & relevé" },
  { label: "Ashkénaze", detail: "Mémoire & transmission" },
];

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
}

function getCuisineCount(label: string): number {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const target = norm(label);

  const count = restaurants.filter((r) => {
    const full = norm(
      `${r.cuisine || ""} ${r.specialty || ""} ${r.name || ""} ${(r.tags || []).join(" ")}`
    );
    if (target === "francais") return full.includes("francais") || full.includes("francaise") || full.includes("gastronomique");
    if (target === "israelien") return full.includes("israel") || full.includes("israélien") || full.includes("israelienne");
    if (target === "japonais") return full.includes("japon") || full.includes("sushi") || full.includes("asiatique");
    if (target === "chinois") return full.includes("chinois") || full.includes("chinoise") || full.includes("asiatique");
    if (target === "thailandais") return full.includes("thai") || full.includes("asiatique");
    if (target === "africain") return full.includes("afric") || full.includes("africa") || full.includes("yassa") || full.includes("mafe");
    if (target === "italien") return full.includes("italien") || full.includes("italienne") || full.includes("pizza");
    if (target === "libanais") return full.includes("libanais") || full.includes("libanaise") || full.includes("oriental");
    if (target === "americain") return full.includes("americain") || full.includes("burger") || full.includes("fast-food");
    if (target === "marocain") return full.includes("maroc") || full.includes("oriental");
    if (target === "tunisien") return full.includes("tunisi") || full.includes("oriental");
    if (target === "ashkenaze") return full.includes("ashkenaze") || full.includes("sandwicherie") || full.includes("traiteur");
    return full.includes(target);
  }).length;

  return count;
}

export default function FoodPage() {
  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-moss shadow-sm"><UtensilsCrossed size={22} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">Toutes les saveurs casher</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Food</h1>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ink/50">Trouvez la bonne adresse, pour chaque envie et chaque moment.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">Rubrique</span>
        </div>
      </section>

      <section className="page-shell py-10 sm:py-14">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-7">
          <div>
            <div className="mb-8">
              <p className="eyebrow">Choisir une adresse</p>
              <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Où souhaitez-vous aller ?</h2>
            </div>
            <FoodSubrubricGrid fallbackCards={addressTypes.map(({ label, description, href, image }) => ({ label, description, href, image }))} />
          </div>

          <div className="lg:sticky lg:top-28">
            <div className="mb-8">
              <p className="eyebrow">Choisir une cuisine</p>
              <h2 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Quelle saveur vous appelle ?</h2>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-black/[.06] bg-white p-2 shadow-soft sm:p-3">
              {cuisineList.map(({ label, detail }, index) => {
                const count = getCuisineCount(label);
                return (
                  <Link
                    key={label}
                    href={`/food/restaurants?cuisine=${slugify(label)}`}
                    className={`group flex items-center gap-4 rounded-2xl px-3 py-4 transition hover:bg-cream sm:px-5 ${index !== cuisineList.length - 1 ? "border-b border-black/[.055]" : ""}`}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#f2eee5] text-base font-extrabold tracking-tight text-[#806944] transition group-hover:bg-ink group-hover:text-white shadow-2xs">
                      {count}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold tracking-tight">{label}</h3>
                        <span className="text-[11px] font-medium text-ink/40">
                          ({count} restaurant{count > 1 ? "s" : ""})
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink/40">{detail}</p>
                    </div>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-ink/35 transition group-hover:bg-ink group-hover:text-white">
                      <ArrowRight size={15} />
                    </span>
                  </Link>
                );
              })}
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
