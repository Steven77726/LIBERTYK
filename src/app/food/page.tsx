import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, CakeSlice, ChefHat, Coffee, Croissant, IceCreamBowl,
  Sandwich, Soup, Store, UtensilsCrossed,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Food",
  description: "Découvrez les meilleures adresses et cuisines casher.",
};

const addressTypes = [
  { label: "Restaurants", description: "Les tables incontournables", icon: UtensilsCrossed, image: "/images/food/restaurants-khan.jpg" },
  { label: "Brunch", description: "Pour prendre le temps", icon: Coffee, image: "/images/food/brunch-marceau.jpg" },
  { label: "Salons de thé", description: "Douceurs et conversations", icon: Coffee, image: "/images/food/salon-de-the.webp" },
  { label: "Pâtisseries", description: "Créations gourmandes", icon: CakeSlice, image: "/images/food/patisserie.webp" },
  { label: "Traiteurs", description: "Pour recevoir sans compromis", icon: ChefHat, image: "/images/food/traiteur.jpg" },
  { label: "Traiteur Shabbat", description: "Vos repas de Shabbat, prêts avec soin", icon: ChefHat, image: "/images/food/traiteur.jpg" },
  { label: "Fast-food", description: "Rapide et généreux", icon: Sandwich, image: "/images/food/fast-food.jpg" },
  { label: "Street Food", description: "Saveurs sur le pouce", icon: Soup, image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=85" },
  { label: "Boulangeries", description: "Le goût du savoir-faire", icon: Croissant, image: "/images/food/boulangerie.jpg" },
  { label: "Glaciers", description: "Fraîcheur et plaisir", icon: IceCreamBowl, image: "/images/food/glacier.webp" },
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
            <div className="grid gap-4 sm:grid-cols-2">
              {addressTypes.map(({ label, description, icon: Icon, image }, index) => (
                <Link
                  key={label}
                  href={label === "Restaurants" ? "/food/restaurants" : label === "Brunch" ? "/food/brunch" : `/food?type=${slugify(label)}`}
                  className={`group relative min-h-[255px] overflow-hidden rounded-[1.75rem] bg-ink text-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-2xl ${index === 0 ? "sm:col-span-2 sm:min-h-[350px]" : ""}`}
                >
                  <img src={image} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                    <div>
                      <span className="mb-4 grid size-10 place-items-center rounded-xl border border-white/20 bg-white/15 backdrop-blur"><Icon size={18} /></span>
                      <h3 className="text-xl font-semibold tracking-tight">{label}</h3>
                      <p className="mt-1 text-xs text-white/55">{description}</p>
                    </div>
                    <span className="grid size-10 shrink-0 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowRight size={17} /></span>
                  </div>
                </Link>
              ))}
            </div>
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
