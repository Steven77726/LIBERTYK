import { brunches } from "@/data/brunches";
import { categories } from "@/data/categories";
import { restaurants } from "@/data/restaurants";
import { azamra } from "@/data/shops";
import { wineActivities } from "@/data/wine-activities";
import { buildInvisibleKeywords, type SearchItem } from "@/lib/search-engine";

const categoryIntentions: Record<string, string[]> = {
  food: ["restaurant", "brunch", "salon de thé", "pâtisserie", "fast-food", "traiteur", "boulangerie", "glacier", "manger", "casher"],
  sorties: ["événement", "concert", "conférence", "soirée", "dj", "spectacle", "dégustation", "activité"],
  voyages: ["Marrakech", "mai", "Pessah", "traditionnel", "orthodoxe", "famille", "club", "hôtel", "séjour casher"],
  shopping: ["boutique", "mode", "costume", "robe", "chaussures", "judaïca", "vêtements", "Azamra"],
  mariage: ["DJ", "salle", "traiteur", "décoration", "photographe", "houppa", "événement"],
  sport: ["padel", "salle femme", "coach", "musculation", "cours privé", "fitness"],
  religion: ["Torah", "cours de Torah", "synagogue", "rabbin", "chabbat", "judaïsme"],
  mikve: ["mikvé femme", "mikvé vaisselle", "tévilat kélim", "bain rituel", "pureté familiale"],
  enfants: ["famille", "enfant", "école", "activité enfant", "vacances", "colonie"],
  chauffeurs: ["chauffeur", "transport", "taxi", "vtc", "aéroport", "navette"],
  "calendrier-juif": ["calendrier juif", "fêtes juives", "chabbat", "horaires", "dates importantes"],
  "vin-spiritueux": ["vin", "spiritueux", "caviste", "dégustation", "cocktail", "wine tour"],
};

const categoryItems: SearchItem[] = categories.map((category) => ({
  id: `category-${category.slug}`,
  title: category.label,
  subtitle: category.description,
  category: "Catégorie",
  href: `/${category.slug}`,
  image: category.image,
  keywords: buildInvisibleKeywords(
    [category.label, category.description, category.eyebrow, ...category.featured, ...(categoryIntentions[category.slug] ?? [])],
    { category: category.label, location: "France Paris communauté juive" },
  ),
}));

const restaurantItems: SearchItem[] = restaurants.map((restaurant) => {
  const services = [
    restaurant.services.dineIn && "sur place", restaurant.services.takeaway && "à emporter",
    restaurant.services.delivery && "livraison", restaurant.services.reservation && "réservation",
    restaurant.amenities.familyFriendly && "restaurant familial",
  ].filter(Boolean) as string[];
  const khanKeywords = restaurant.name === "Khan" ? [
    "Restaurant", "Restaurant casher", "Bassari", "Viande", "Grill", "Paris", "75017",
    "17e arrondissement", "Paris 17", "Shabbat", "Livraison", "Sur place", "À emporter",
    "Dîner", "Déjeuner", "Restaurant familial", "Restaurant romantique", "Viande grillée",
    "Kasher", "Cacher", "Restaurant cacher Paris", "Restaurant viande Paris",
    "Restaurant bassari Paris", "Restaurant casher 17", "Restaurant casher Paris 17",
    "Cuisine israélienne", "Cuisine orientale",
  ] : [];
  return {
    id: `restaurant-${restaurant.id}`,
    title: restaurant.name,
    subtitle: `${restaurant.cuisine} · ${restaurant.fullAddress}`,
    category: "Restaurant",
    subcategory: "Restaurants",
    href: `/food/restaurants#${restaurant.id}`,
    image: restaurant.image,
    customerSearches: [
      restaurant.name, restaurant.fullAddress, restaurant.postalCode, `${restaurant.arrondissement}e arrondissement`,
      `Paris ${restaurant.arrondissement}`, restaurant.specialty, restaurant.cuisine, restaurant.type,
      restaurant.certification, "restaurant casher", "restaurant cacher", "restaurant kasher", ...services, ...khanKeywords,
    ].filter(Boolean) as string[],
    keywords: buildInvisibleKeywords([
      restaurant.name, restaurant.fullAddress, restaurant.postalCode, `${restaurant.arrondissement}e arrondissement`,
      `Paris ${restaurant.arrondissement}`, restaurant.specialty, restaurant.cuisine, restaurant.type,
      restaurant.certification, "restaurant casher", "restaurant cacher", "restaurant kasher", ...services, ...khanKeywords,
    ], { category: "restaurant food", location: `Paris ${restaurant.arrondissement} ${restaurant.postalCode}` }),
    location: {
      city: "Paris",
      arrondissement: String(restaurant.arrondissement || ""),
      postalCode: restaurant.postalCode,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    },
    filters: {
      certification: restaurant.certification,
      kosherType: restaurant.type === "Viande" ? "Bassari" : restaurant.type === "Lait" ? "Halavi" : restaurant.type,
      terrace: restaurant.amenities.terrace === true,
      openNow: restaurant.isOpenNow,
      delivery: restaurant.services.delivery === true,
      takeaway: restaurant.services.takeaway === true,
      reservation: restaurant.services.reservation === true,
      price: restaurant.price,
    },
    ranking: {
      sponsored: restaurant.name === "Khan",
      popularity: restaurant.name === "Khan" ? 92 : 45 + restaurant.arrondissement,
      favorites: restaurant.name === "Khan" ? 34 : restaurant.reviewCount,
      reviewCount: restaurant.reviewCount,
    },
  };
});

const brunchItems: SearchItem[] = brunches.map((brunch) => ({
  id: `brunch-${brunch.slug}`,
  title: brunch.name,
  subtitle: `${brunch.cuisine}${brunch.address ? ` · ${brunch.address}` : ""}`,
  category: "Brunch",
  subcategory: "Brunch",
  href: `/food/brunch/${brunch.slug}`,
  image: brunch.images[0],
  customerSearches: [
    brunch.name, brunch.address ?? "Paris", brunch.postalCode ?? "", `${brunch.arrondissement ?? ""}e arrondissement`,
    brunch.specialty, brunch.cuisine, brunch.kosherType, brunch.certification ?? "", ...brunch.tags,
    "brunch casher", "petit déjeuner casher", "brunch Paris", "avocado toast", "pancakes", "healthy",
  ].filter(Boolean),
  keywords: buildInvisibleKeywords([
    brunch.name, brunch.address ?? "Paris", brunch.postalCode ?? "", `${brunch.arrondissement ?? ""}e arrondissement`,
    brunch.specialty, brunch.cuisine, brunch.kosherType, brunch.certification ?? "", ...brunch.tags,
    "brunch casher", "petit déjeuner casher", "brunch Paris",
  ], { category: "brunch food", location: `Paris ${brunch.arrondissement ?? ""}` }),
  location: {
    city: "Paris",
    arrondissement: String(brunch.arrondissement ?? ""),
    postalCode: brunch.postalCode,
    latitude: brunch.latitude,
    longitude: brunch.longitude,
  },
  filters: {
    certification: brunch.certification,
    kosherType: brunch.kosherType === "Lait" ? "Halavi" : brunch.kosherType === "Viande" ? "Bassari" : brunch.kosherType,
    terrace: brunch.amenities.terrace === true,
    openNow: null,
    delivery: brunch.services.delivery === true,
    takeaway: brunch.services.takeaway === true,
    reservation: brunch.services.reservation === true,
    price: brunch.price,
  },
  ranking: {
    sponsored: false,
    popularity: 55 + (brunch.arrondissement ?? 1),
    favorites: brunch.reviewCount,
    reviewCount: brunch.reviewCount,
  },
}));

const wineItems: SearchItem[] = wineActivities.map((activity) => ({
  id: `wine-${activity.slug}`,
  title: activity.title,
  subtitle: activity.type,
  category: "Vin & Spiritueux",
  subcategory: activity.type,
  href: `/vin-spiritueux/${activity.slug}`,
  image: activity.image,
  customerSearches: [activity.title, activity.type, activity.address ?? "Paris", activity.description, ...activity.tags, "vin casher", "spiritueux casher", "tequila casher", "dégustation", "cocktail"],
  keywords: buildInvisibleKeywords([activity.title, activity.type, activity.address ?? "Paris", activity.description, ...activity.tags, "vin casher", "dégustation"], { category: "vin spiritueux", location: "Paris France" }),
  location: { city: "Paris", arrondissement: activity.address?.includes("75017") ? "17" : "", postalCode: activity.address?.includes("75017") ? "75017" : undefined },
  filters: {
    kosherType: "Parvé",
    reservation: activity.slug !== "winess",
    takeaway: true,
    delivery: false,
    openNow: null,
    price: "€€€",
  },
  ranking: {
    sponsored: true,
    popularity: 88,
    favorites: 26,
    reviewCount: activity.reviewCount ?? 0,
  },
}));

const shopItems: SearchItem[] = [{
  id: "shop-azamra",
  title: azamra.name,
  subtitle: "Mode · Homme · Femme · Enfant",
  category: "Vêtements",
  subcategory: "Mode",
  href: "/shopping/vetements/azamra",
  image: azamra.image,
  customerSearches: [azamra.name, azamra.type, azamra.description, ...azamra.tags, "boutique juive", "mode pudique", "vêtement Paris", "shopping", "robe", "homme", "femme", "enfant"],
  keywords: buildInvisibleKeywords([azamra.name, azamra.type, azamra.description, ...azamra.tags, "boutique juive", "mode pudique", "vêtement Paris", "spiritual studio"], { category: "shopping mode vêtements", location: "Paris" }),
  location: { city: "Paris" },
  filters: { openNow: null },
  ranking: { sponsored: false, popularity: 64, favorites: azamra.reviewCount, reviewCount: azamra.reviewCount },
}];

export const searchIndex: SearchItem[] = [...restaurantItems, ...brunchItems, ...wineItems, ...shopItems, ...categoryItems];
