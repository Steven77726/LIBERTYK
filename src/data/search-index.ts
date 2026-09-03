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
  shopping: ["boutique", "mode", "costume", "robe", "chaussures", "judaïca", "vêtement masculin", "vêtement féminin", "objet utile", "vêtements", "Azamra"],
  mariage: ["DJ", "salle", "traiteur", "décoration", "photographe", "houppa", "événement"],
  sport: ["padel", "salle femme", "coach", "musculation", "cours privé", "fitness"],
  religion: ["Torah", "cours de Torah", "synagogue", "rabbin", "chabbat", "judaïsme"],
  mikve: ["mikvé femme", "mikvé vaisselle", "tévilat kélim", "bain rituel", "pureté familiale"],
  enfants: ["famille", "enfant", "école", "activité enfant", "vacances", "colonie"],
  chauffeurs: ["chauffeur", "transport", "taxi", "vtc", "aéroport", "navette"],
  "calendrier-juif": ["calendrier juif", "fêtes juives", "chabbat", "horaires", "dates importantes"],
  "vin-spiritueux": ["vin", "spiritueux", "caviste", "dégustation", "cocktail", "wine tour"],
};

const categoryItems: SearchItem[] = categories
  .filter((category) => !category.isDormant)
  .map((category) => ({
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
  subtitle: "Prêt-à-porter féminin & mode pudique · Paris",
  category: "Shopping",
  subcategory: "Vêtement féminin",
  href: "/shopping/vetements/azamra",
  image: azamra.image,
  customerSearches: [azamra.name, azamra.type, azamra.description, ...azamra.tags, "boutique juive", "mode pudique", "vêtement Paris", "shopping", "robe", "vêtement féminin", "homme", "femme", "enfant"],
  keywords: buildInvisibleKeywords([azamra.name, azamra.type, azamra.description, ...azamra.tags, "boutique juive", "mode pudique", "vêtement Paris", "spiritual studio"], { category: "shopping vêtement féminin mode", location: "Paris" }),
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
    "David Abitbol", "Abitbol", "Abitol", "trompe l'oeil", "trompe oeil", "trompe eoil", "fruits sculptés", "fruits sculptes", "pâtisserie", "patisserie", "Trompe-l'œil", "Trompeloeil",
    "Pâtisserie David Abitbol", "Pâtisserie casher", "Gâteau trompe l'oeil", "Dessert casher", "Paris", "Gâteau",
  ],
  keywords: buildInvisibleKeywords([
    "David Abitbol", "Abitbol", "Abitol", "trompe l'oeil", "trompe oeil", "trompe eoil", "fruits sculptés", "fruits sculptes", "pâtisserie", "patisserie", "Trompe-l'œil", "trompeloeil",
    "Pâtisserie casher", "Gâteaux", "Trompe l'œil", "Dessert", "Paris",
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

const sortiesItems: SearchItem[] = [
  {
    id: "sorties-barbanegra",
    title: "Barbanegra - Terrasse Festive (Saisonnier)",
    subtitle: "La terrasse des Clubs · Paris 12e",
    category: "Sorties",
    subcategory: "Événements",
    href: "/sorties/evenements",
    image: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkeBfDPFTq6C4fD7y92hgp3R9c3qQ7riyTXjA5T4CHNI3WTyNmSNts36c3jwaEU0Cc7lNqGFyL_26GHGMolotOhLOzBFem-DS_kfjpZhNpBnLsllLCGJvMwEAPJidyiEagTDFiQqQ=s1360-w1360-h1020-rw",
    customerSearches: ["Barbanegra", "terrasse festive", "soirée", "club", "port de la rapée", "sorties", "fête"],
    keywords: buildInvisibleKeywords(["Barbanegra", "terrasse festive", "soirée", "club", "sorties"], { category: "sorties evenements", location: "Paris 12" }),
    location: { city: "Paris", arrondissement: "12" },
    filters: { terrace: true, kosherType: "No Teouda / Friendly" },
    ranking: { sponsored: false, popularity: 90, favorites: 30, reviewCount: 15 },
  },
  {
    id: "sorties-lehayiim",
    title: "lehayiim - Peniche festive (Saisonnier)",
    subtitle: "Péniche festive & soirées célibataires · Paris",
    category: "Sorties",
    subcategory: "Soirées célibataires",
    href: "/sorties/soirees-celibataires",
    image: "https://res.cloudinary.com/shotgun/image/upload/v1784901165/production/artworks/16EE6FD6-1223-4A68-ADB5-D9563CDCC54D_bafm57.png",
    customerSearches: ["lehayiim", "peniche festive", "soirée célibataire", "rencontre", "sorties"],
    keywords: buildInvisibleKeywords(["lehayiim", "peniche", "célibataire", "sorties", "rencontres"], { category: "sorties soirees-celibataires", location: "Paris" }),
    location: { city: "Paris" },
    filters: { terrace: true, kosherType: "No Teouda / Friendly" },
    ranking: { sponsored: false, popularity: 88, favorites: 25, reviewCount: 12 },
  },
  {
    id: "sorties-lagainsbar",
    title: "La Gainsbar - Restaurant festif (Saisonnier)",
    subtitle: "Restaurant festif & dîners musicaux · Paris 17e",
    category: "Sorties",
    subcategory: "Événements",
    href: "/sorties/evenements",
    image: "https://www.1001salles.com/images/provider/61181/1760443839_68ee3dbf0597f.webp",
    customerSearches: ["la gainsbar", "gainsbar", "festif", "rue de tilsitt", "paris 17", "sorties", "dîner musical"],
    keywords: buildInvisibleKeywords(["La Gainsbar", "gainsbar", "festif", "musique", "sorties"], { category: "sorties evenements", location: "Paris 17" }),
    location: { city: "Paris", arrondissement: "17" },
    filters: { kosherType: "Bassari" },
    ranking: { sponsored: false, popularity: 89, favorites: 28, reviewCount: 14 },
  },
];

const beautyItems: SearchItem[] = [
  {
    id: "beauty-abigael-hassan",
    title: "Abigael Hassan",
    subtitle: "Coiffure de mariée, lissage et maquillage · Paris",
    category: "Soins féminin",
    subcategory: "Coiffure & Maquillage",
    href: "/soins-feminin/coiffure-maquillage",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
    customerSearches: ["abigael hassan", "coiffeuse", "lissage", "maquillage", "coiffure mariage", "domicile"],
    keywords: buildInvisibleKeywords(["Abigael Hassan", "coiffeuse", "lissage", "maquillage", "soins féminin"], { category: "soins-feminin coiffure", location: "Paris domicile" }),
    location: { city: "Paris" },
    filters: { kosherType: "Parvé" },
    ranking: { sponsored: false, popularity: 85, favorites: 20, reviewCount: 10 },
  }
];

const salleItems: SearchItem[] = [
  {
    id: "salle-chichi-paris",
    title: "Chichi Paris (max 180 pers)",
    subtitle: "Salle de réception haut de gamme toute équipée · Paris",
    category: "Location de Salle",
    subcategory: "Salle Luxe",
    href: "/location-de-salle/salle-luxe",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu3pj7u-tzY_rzVHN_vFPMyNBGvE9AcXtjRbTWx24eEcoqE5VniisKOls&s=10",
    customerSearches: ["chichi paris", "location de salle", "salle réception", "salle mariage", "salle fêtes"],
    keywords: buildInvisibleKeywords(["Chichi Paris", "location de salle", "salle de fête", "mariage"], { category: "location-de-salle salle-luxe", location: "Paris" }),
    location: { city: "Paris" },
    filters: { kosherType: "Parvé" },
    ranking: { sponsored: false, popularity: 92, favorites: 35, reviewCount: 18 },
  }
];

export const searchIndex: SearchItem[] = [
  ...restaurantItems,
  ...brunchItems,
  ...wineItems,
  ...shopItems,
  ...patisserieItems,
  ...weddingItems,
  ...sortiesItems,
  ...beautyItems,
  ...salleItems,
  ...categoryItems,
];
