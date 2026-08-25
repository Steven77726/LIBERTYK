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
    restaurant.services.dineIn && "sur place",
    restaurant.services.takeaway && "à emporter",
    restaurant.services.delivery && "livraison",
    restaurant.services.reservation && "réservation",
    restaurant.amenities.familyFriendly && "restaurant familial",
  ].filter(Boolean) as string[];

  const isViande = restaurant.type === "Viande" || /grill|viande|steak|burger|boucher|viandes/i.test(`${restaurant.specialty} ${restaurant.cuisine}`);
  const isLait = restaurant.type === "Lait" || /lait|pizza|fromage|halavi/i.test(`${restaurant.specialty} ${restaurant.cuisine}`);
  const isParve = restaurant.type === "Parvé" || /parve|sushi|asiatique/i.test(`${restaurant.specialty} ${restaurant.cuisine}`);

  const kosherKeywords = [
    ...(isViande ? ["Bassari", "Viande", "Restaurant bassari", "Restaurant viande", "Grill", "Grillades", "Meat", "Carné"] : []),
    ...(isLait ? ["Halavi", "Lait", "Restaurant halavi", "Restaurant lait", "Pizza", "Fromage", "Dairy"] : []),
    ...(isParve ? ["Parvé", "Parve", "Restaurant parvé"] : []),
  ];

  const allSearches = [
    restaurant.name,
    restaurant.fullAddress,
    restaurant.postalCode,
    restaurant.arrondissement ? `${restaurant.arrondissement}e arrondissement` : "",
    restaurant.arrondissement ? `Paris ${restaurant.arrondissement}` : "",
    restaurant.specialty,
    restaurant.cuisine,
    restaurant.type,
    restaurant.certification,
    "restaurant casher",
    "restaurant cacher",
    "restaurant kasher",
    ...services,
    ...kosherKeywords,
  ].filter(Boolean) as string[];

  return {
    id: `restaurant-${restaurant.id}`,
    title: restaurant.name,
    subtitle: `${restaurant.cuisine} · ${restaurant.fullAddress}`,
    category: "Restaurant",
    subcategory: "Restaurants",
    href: `/food/restaurants#${restaurant.id}`,
    image: restaurant.image,
    customerSearches: allSearches,
    keywords: buildInvisibleKeywords(allSearches, {
      category: "restaurant food",
      location: `Paris ${restaurant.arrondissement} ${restaurant.postalCode}`,
    }),
    location: {
      city: "Paris",
      arrondissement: String(restaurant.arrondissement || ""),
      postalCode: restaurant.postalCode,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
    },
    filters: {
      certification: restaurant.certification,
      kosherType: isViande ? "Bassari" : isLait ? "Halavi" : isParve ? "Parvé" : restaurant.type,
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

const brunchItems: SearchItem[] = brunches.map((brunch) => {
  const isViande = brunch.kosherType === "Viande";
  const isLait = brunch.kosherType === "Lait";
  const isParve = brunch.kosherType === "Parvé";

  const kosherKeywords = [
    ...(isViande ? ["Bassari", "Viande", "Brunch bassari"] : []),
    ...(isLait ? ["Halavi", "Lait", "Brunch halavi"] : []),
    ...(isParve ? ["Parvé", "Parve", "Brunch parvé"] : []),
  ];

  const allSearches = [
    brunch.name,
    brunch.address ?? "Paris",
    brunch.postalCode ?? "",
    brunch.arrondissement ? `${brunch.arrondissement}e arrondissement` : "",
    brunch.arrondissement ? `Paris ${brunch.arrondissement}` : "",
    brunch.specialty,
    brunch.cuisine,
    brunch.kosherType,
    brunch.certification ?? "",
    ...brunch.tags,
    ...kosherKeywords,
    "brunch casher",
    "brunch cacher",
    "petit déjeuner casher",
    "brunch Paris",
    "avocado toast",
    "pancakes",
    "healthy",
  ].filter(Boolean) as string[];

  return {
    id: `brunch-${brunch.slug}`,
    title: brunch.name,
    subtitle: `${brunch.cuisine}${brunch.address ? ` · ${brunch.address}` : ""}`,
    category: "Brunch",
    subcategory: "Brunch",
    href: `/food/brunch/${brunch.slug}`,
    image: brunch.images[0],
    customerSearches: allSearches,
    keywords: buildInvisibleKeywords(allSearches, {
      category: "brunch food",
      location: `Paris ${brunch.arrondissement ?? ""} ${brunch.postalCode ?? ""}`,
    }),
    location: {
      city: "Paris",
      arrondissement: String(brunch.arrondissement ?? ""),
      postalCode: brunch.postalCode,
      latitude: brunch.latitude,
      longitude: brunch.longitude,
    },
    filters: {
      certification: brunch.certification,
      kosherType: isViande ? "Bassari" : isLait ? "Halavi" : isParve ? "Parvé" : brunch.kosherType,
      terrace: brunch.amenities.terrace === true,
      openNow: null,
      delivery: brunch.services.delivery === true,
      takeaway: brunch.services.takeaway === true,
      reservation: brunch.services.reservation === true,
      price: brunch.price,
    },
    ranking: {
      sponsored: false,
      popularity: 70,
      favorites: 18,
      reviewCount: brunch.reviewCount,
    },
  };
});

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

const patisserieItems: SearchItem[] = [{
  id: "patisserie-david-abitbol",
  title: "David Abitbol — Trompe-l'œil",
  subtitle: "Pâtisserie & Trompe-l'œil · Paris",
  category: "Pâtisserie",
  subcategory: "Trompe-l'œil",
  href: "/food/patisseries",
  image: "/images/food/patisserie.webp",
  customerSearches: [
    "David Abitbol", "Abitbol", "Abitol", "Trompe l'oeil", "Trompe oeil", "Trompe-l'œil", "Trompeloeil",
    "Pâtisserie David Abitbol", "Pâtisserie casher", "Gâteau trompe l'oeil", "Dessert casher", "Paris", "Pâtisserie", "Gâteau",
  ],
  keywords: buildInvisibleKeywords([
    "David Abitbol", "Abitbol", "Abitol", "Trompe l'oeil", "Trompe oeil", "Trompe-l'œil", "trompeloeil",
    "Pâtisserie", "Pâtisserie casher", "Gâteaux", "Trompe l'œil", "Dessert", "Paris",
  ], { category: "food patisserie dessert", location: "Paris" }),
  location: { city: "Paris" },
  filters: { kosherType: "Halavi", openNow: null, price: "€€" },
  ranking: { sponsored: true, popularity: 95, favorites: 42, reviewCount: 28 },
}];

const weddingItems: SearchItem[] = [{
  id: "wedding-kinor-decor",
  title: "Kinor Decor",
  subtitle: "Décoration & Scénographie de Mariage",
  category: "Mariage",
  subcategory: "Décor",
  href: "/mariage/decor",
  image: "/images/mariage/kinor-decor.jpg",
  customerSearches: [
    "Kinor Decor", "Kinor", "Décoration mariage", "Houppa", "Scénographie", "Fleurs mariage", "Mariage juif", "Décor",
  ],
  keywords: buildInvisibleKeywords([
    "Kinor Decor", "Kinor", "Décoration mariage", "Houppa", "Fleurs", "Mariage", "Scénographie florale", "Prestataire mariage",
  ], { category: "mariage decor decoration fleurs", location: "Paris France" }),
  location: { city: "Paris" },
  filters: { openNow: null, price: "Sur devis" },
  ranking: { sponsored: true, popularity: 98, favorites: 68, reviewCount: 68 },
}];

export const searchIndex: SearchItem[] = [...restaurantItems, ...brunchItems, ...wineItems, ...shopItems, ...patisserieItems, ...weddingItems, ...categoryItems];
