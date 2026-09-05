"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { restaurants as staticRestaurants } from "@/data/restaurants";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import type { Restaurant } from "@/types/restaurant";
import {
  generateCuisineFilterOptions,
  matchesStrictCuisineFilter,
} from "@/components/restaurants/restaurant-explorer";

const defaultDetails: Record<string, string> = {
  Français: "Élégance & tradition",
  Israélien: "Solaire & généreux",
  Israélienne: "Solaire & généreux",
  Japonais: "Précis & raffiné",
  Japonaise: "Précis & raffiné",
  Chinois: "Parfumé & authentique",
  Thaïlandais: "Vibrant & épicé",
  Africain: "Intense & convivial",
  Italien: "Simple & passionné",
  Italienne: "Simple & passionné",
  Libanais: "Frais & généreux",
  Américain: "Gourmand & iconique",
  Marocain: "Chaleureux & parfumé",
  Tunisien: "Solaire & relevé",
  Tunisienne: "Solaire & relevé",
  Ashkénaze: "Mémoire & transmission",
  Burgers: "Gourmands & généreux",
  Grillades: "Cuisson braisée & viandes nobles",
  Brunch: "Pancakes, œufs & douceurs",
  Pâtisserie: "Créations sucrées & fines",
  Sandwicherie: "Sur le pouce & savoureux",
  "Salon de thé": "Douceurs & conversations",
  Pizzeria: "Pizzas au feu de bois & pâtes",
  Traiteur: "Réceptions & chabbat",
  Boulangerie: "Pains & viennoiseries",
  Boucherie: "Viandes sélectionnées & rôtisserie",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function FoodCuisineList() {
  const [restaurantsList, setRestaurantsList] = useState<Restaurant[]>(staticRestaurants);

  useEffect(() => {
    let mounted = true;
    const loadRestaurants = () => {
      const mergedMap = new Map<string, Restaurant>();
      staticRestaurants.forEach((r) => mergedMap.set(r.id, r));

      // Local admin cache (localStorage)
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            const rawEsts = (parsed?.establishments as EstablishmentRecord[]) ?? [];
            rawEsts.forEach((est) => {
              const types = Array.isArray(est.cuisineTypes) ? est.cuisineTypes : [];
              if (types.length > 0) {
                mergedMap.set(est.id, {
                  id: est.id,
                  name: est.name,
                  fullAddress: est.address || "",
                  postalCode: est.postalCode || "",
                  arrondissement: 0,
                  phone: est.phone || "",
                  specialty: est.shortDescription || est.description || "",
                  cuisine: types.join(", "),
                  cuisineTypes: types,
                  type: "Viande",
                  certification: est.certification || "",
                  services: { dineIn: true, takeaway: null, delivery: null, clickAndCollect: null, reservation: null },
                  amenities: { familyFriendly: null, accessible: null, parking: null, terrace: null, wifi: null, kidsMenu: null, privateHire: null, metroNearby: null },
                  hours: {},
                  price: "€€",
                  rating: 4.8,
                  reviewCount: 100,
                  distanceKm: 0,
                  isOpenNow: null,
                  openLunch: null,
                  openDinner: null,
                  openSunday: null,
                  openLate: null,
                  image: est.mainPhoto || "/images/food/restaurants-khan.jpg",
                  latitude: 48.8566,
                  longitude: 2.3522,
                  importedAt: "",
                });
              }
            });
          }
        } catch {
          // ignore
        }
      }

      if (mounted) {
        setRestaurantsList(Array.from(mergedMap.values()));
      }
    };

    loadRestaurants();
    window.addEventListener("storage", loadRestaurants);
    window.addEventListener("liberty-admin-published", loadRestaurants);
    return () => {
      mounted = false;
      window.removeEventListener("storage", loadRestaurants);
      window.removeEventListener("liberty-admin-published", loadRestaurants);
    };
  }, []);

  const items = useMemo(() => {
    const cuisineOptions = generateCuisineFilterOptions(restaurantsList);
    return cuisineOptions
      .map((label) => {
        const count = restaurantsList.filter((r) => matchesStrictCuisineFilter(r, label)).length;
        const detail = defaultDetails[label] || "Saveurs & spécialités sélectionnées";
        return { label, detail, count };
      })
      .filter((item) => item.count > 0);
  }, [restaurantsList]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/[.06] bg-white p-2 shadow-soft sm:p-3">
      {items.map(({ label, detail, count }, index) => (
        <Link
          key={label}
          href={`/food/restaurants?cuisine=${slugify(label)}`}
          className={`group flex items-center gap-4 rounded-2xl px-3 py-4 transition hover:bg-cream sm:px-5 ${
            index !== items.length - 1 ? "border-b border-black/[.055]" : ""
          }`}
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
      ))}
    </div>
  );
}
