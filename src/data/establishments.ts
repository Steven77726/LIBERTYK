import { brunches } from "@/data/brunches";
import { restaurants } from "@/data/restaurants";
import { azamra } from "@/data/shops";
import { wineActivities } from "@/data/wine-activities";
import type { BeautyProfessionalService } from "@/lib/beauty/types";

export type LocalEstablishmentStatus = "Publié" | "En sommeil" | "Brouillon" | "Masqué";
export type LocalKosherType = "Bassari" | "Halavi" | "Parvé" | "No Teouda / Friendly" | "À compléter";
export type LocalSponsorshipLevel = "Standard" | "Featured" | "Premium" | "Sponsorisé" | "Partenaire officiel" | "Coup de cœur Liberty";

export type LocalEstablishment = {
  id: string;
  databaseId?: string;
  rubricId: string;
  subrubricId: string;
  mainPhoto: string;
  photos: string[];
  photoAlts?: string[];
  name: string;
  slug?: string;
  shortDescription?: string;
  description: string;
  address: string;
  city: string;
  arrondissement: string;
  postalCode?: string;
  country?: string;
  nearestMetroName?: string;
  nearestMetroLine?: string;
  email?: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
  deliverooUrl?: string;
  uberEatsUrl?: string;
  hours: string;
  terrace: boolean;
  delivery: boolean;
  takeaway: boolean;
  reservation: boolean;
  privateHire: boolean;
  certification: string;
  kosherType: LocalKosherType;
  averagePrice: string;
  latitude: string;
  longitude: string;
  status: LocalEstablishmentStatus;
  visible?: boolean;
  sponsorshipLevel: LocalSponsorshipLevel;
  sponsored: boolean;
  sponsorPriority: number;
  sponsorDuration: string;
  sponsorStartsAt?: string;
  sponsorEndsAt?: string;
  sponsorPlacement?: string;
  sponsorNotes?: string;
  reservationTarget?: string;
  ownerId?: string;
  cuisineTypes?: string[];
  order: number;
  customerSearches: string[];
  visibleTagIds: string[];
  fieldVisibility?: Record<string, boolean>;
  beautyServices?: BeautyProfessionalService[];
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizePhotoSlots = (mainPhoto: string | undefined, photos: Array<string | undefined>, slots = 2) => {
  const main = mainPhoto?.trim() ?? "";
  const clean = photos.map((photo) => photo?.trim()).filter(Boolean) as string[];
  const unique = clean.filter((photo, index, list) => photo !== main && list.indexOf(photo) === index).slice(0, slots);
  return [...unique, ...Array(Math.max(0, slots - unique.length)).fill("")];
};

const toKosherType = (value?: string): LocalKosherType => {
  if (value === "Viande") return "Bassari";
  if (value === "Lait") return "Halavi";
  if (value === "Parvé") return "Parvé";
  if (value === "Bassari" || value === "Halavi") return value;
  if (/no\s*teouda|no\s*theouda|friendly/i.test(value ?? "")) return "No Teouda / Friendly";
  return "À compléter";
};

const inferFoodSubrubric = (name: string, specialty?: string, cuisine?: string) => {
  const text = `${name} ${specialty || ""} ${cuisine || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (text.includes("boulangerie") && !text.includes("patisserie")) return "food-boulangeries";
  if (text.includes("patisserie") || text.includes("gateau") || text.includes("macaron") || text.includes("trompe oeil") || text.includes("viennoiserie") || text.includes("vatrouchka")) return "food-patisseries";
  if (text.includes("boulangerie") || text.includes("pain") || text.includes("hallot") || text.includes("challah")) return "food-boulangeries";
  if (text.includes("traiteur")) return "food-traiteurs";
  if (text.includes("salon de the") || text.includes("tea") || (text.includes("cafe") && !text.includes("grill") && !text.includes("benson"))) return "food-salons-de-the";
  if (text.includes("glacier") || text.includes("glace")) return "food-glaciers";
  if (text.includes("fast food") || text.includes("snack") || text.includes("sandwicherie") || text.includes("casse-croute") || text.includes("pita") || text.includes("falafel") || text.includes("shawarma")) return "food-restauration-rapide";
  return "food-restaurants";
};

const restaurantEstablishments: LocalEstablishment[] = restaurants.map((restaurant, index) => ({
  id: restaurant.id,
  rubricId: "food",
  subrubricId: inferFoodSubrubric(restaurant.name, restaurant.specialty, restaurant.cuisine),
  mainPhoto: restaurant.image,
  photos: ["", "", "", ""],
  photoAlts: ["", "", "", ""],
  name: restaurant.name,
  slug: restaurant.id,
  shortDescription: `${restaurant.specialty || "Restaurant casher"} · ${restaurant.cuisine || "Cuisine à compléter"}`,
  description: `${restaurant.specialty || "Restaurant casher"} — ${restaurant.cuisine || "Cuisine à compléter"}.`,
  address: restaurant.fullAddress,
  city: "Paris",
  arrondissement: restaurant.arrondissement ? `${restaurant.arrondissement}e` : "",
  postalCode: restaurant.postalCode,
  country: "France",
  email: "",
  phone: restaurant.phone,
  whatsapp: "",
  instagram: "",
  website: "",
  deliverooUrl: restaurant.deliverooUrl ?? "",
  uberEatsUrl: restaurant.uberEatsUrl ?? "",
  hours: Object.entries(restaurant.hours).map(([day, hours]) => `${day}: ${hours}`).join("\n"),
  terrace: restaurant.amenities.terrace === true,
  delivery: restaurant.services.delivery === true,
  takeaway: restaurant.services.takeaway === true,
  reservation: restaurant.services.reservation === true,
  privateHire: restaurant.amenities.privateHire === true,
  certification: restaurant.certification,
  kosherType: toKosherType(restaurant.type),
  averagePrice: restaurant.price,
  latitude: String(restaurant.latitude),
  longitude: String(restaurant.longitude),
  status: "Publié",
  visible: true,
  sponsorshipLevel: restaurant.name === "Khan" ? "Sponsorisé" : "Standard",
  sponsored: restaurant.name === "Khan",
  sponsorPriority: restaurant.name === "Khan" ? 1 : index + 10,
  sponsorDuration: restaurant.name === "Khan" ? "30 jours" : "",
  sponsorStartsAt: "",
  sponsorEndsAt: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: "",
  cuisineTypes: (restaurant.cuisine ? restaurant.cuisine.split(",").map((s) => s.trim()) : []).filter(Boolean),
  order: index + 1,
  customerSearches: [
    restaurant.name,
    restaurant.cuisine,
    restaurant.specialty,
    restaurant.fullAddress,
    restaurant.postalCode,
    `restaurant casher ${restaurant.arrondissement}`,
    `restaurant viande ${restaurant.postalCode}`,
    "cacher",
    "kasher",
    "déjeuner",
    "dîner",
  ].filter(Boolean),
  visibleTagIds: ["reservation", "livraison", "a-emporter", restaurant.type === "Viande" ? "bassari" : "halavi"].filter(Boolean),
}));

const brunchEstablishments: LocalEstablishment[] = brunches.map((brunch, index) => ({
  id: brunch.slug,
  rubricId: "food",
  subrubricId: "food-brunch",
  mainPhoto: brunch.images[0] ?? "",
  photos: normalizePhotoSlots(brunch.images[0], [brunch.images[1], brunch.images[2], brunch.images[3], brunch.images[4]], 4),
  photoAlts: ["", "", "", ""],
  name: brunch.name,
  slug: brunch.slug,
  shortDescription: `${brunch.specialty || "Brunch casher"} · ${brunch.cuisine || "Brunch"}`,
  description: brunch.description ?? "",
  address: brunch.address ?? "",
  city: "Paris",
  arrondissement: brunch.arrondissement ? `${brunch.arrondissement}e` : "",
  postalCode: brunch.postalCode ?? "",
  country: "France",
  email: "",
  phone: brunch.phone ?? "",
  whatsapp: "",
  instagram: "",
  website: brunch.source ?? "",
  hours: Object.entries(brunch.hours ?? {}).map(([day, hours]) => `${day}: ${hours ?? ""}`).join("\n"),
  terrace: brunch.amenities.terrace === true,
  delivery: brunch.services.delivery === true,
  takeaway: brunch.services.takeaway === true,
  reservation: brunch.services.reservation === true,
  privateHire: brunch.amenities.privateHire === true,
  certification: brunch.certification ?? "",
  kosherType: toKosherType(brunch.kosherType),
  averagePrice: brunch.price ?? "",
  latitude: String(brunch.latitude ?? ""),
  longitude: String(brunch.longitude ?? ""),
  status: "Publié",
  visible: true,
  sponsorshipLevel: "Standard",
  sponsored: false,
  sponsorPriority: index + 20,
  sponsorDuration: "",
  sponsorStartsAt: "",
  sponsorEndsAt: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: "",
  cuisineTypes: (brunch.cuisine ? [brunch.cuisine.split("/")[0].trim()] : ["Brunch"]).filter(Boolean),
  order: restaurantEstablishments.length + index + 1,
  customerSearches: [brunch.name, brunch.specialty, brunch.cuisine, "brunch", "pancakes", "avocado toast", "café", "halavi", "lait"].filter(Boolean),
  visibleTagIds: ["reservation", "livraison", "halavi", "terrasse"].filter(Boolean),
}));

const wineEstablishments: LocalEstablishment[] = wineActivities.map((activity, index) => ({
  id: activity.slug,
  rubricId: "vin-spiritueux",
  subrubricId: "vin-spiritueux-selections",
  mainPhoto: activity.image,
  photos: ["", "", "", ""],
  photoAlts: ["", "", "", ""],
  name: activity.title,
  slug: activity.slug,
  shortDescription: `${activity.type} · Vin & Spiritueux`,
  description: activity.description,
  address: activity.address ?? "",
  city: "Paris",
  arrondissement: activity.address?.includes("75017") ? "17e" : "",
  postalCode: activity.address?.match(/750\d{2}/)?.[0] ?? "",
  country: "France",
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  website: activity.website ?? "",
  hours: "",
  terrace: false,
  delivery: false,
  takeaway: true,
  reservation: activity.slug !== "winess",
  privateHire: activity.slug.includes("signature"),
  certification: "",
  kosherType: "Parvé",
  averagePrice: "€€€",
  latitude: "",
  longitude: "",
  status: "Publié",
  visible: true,
  sponsorshipLevel: "Partenaire officiel",
  sponsored: true,
  sponsorPriority: index + 1,
  sponsorDuration: "En cours",
  sponsorStartsAt: "",
  sponsorEndsAt: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: activity.website ?? "",
  cuisineTypes: [],
  order: index + 1,
  customerSearches: [activity.title, activity.type, ...activity.tags, "vin casher", "spiritueux casher", "dégustation", "winess"],
  visibleTagIds: ["sponsorise", "reservation", "parve"],
}));

const shoppingEstablishments: LocalEstablishment[] = [{
  id: azamra.slug,
  rubricId: "shopping",
  subrubricId: "vetement-feminin",
  mainPhoto: azamra.image,
  photos: azamra.photos,
  photoAlts: ["Azamra Boutique", "Azamra Collection 1", "Azamra Collection 2", "Azamra Collection 3"],
  name: azamra.name,
  slug: azamra.slug,
  shortDescription: `${azamra.type} · Shopping`,
  description: azamra.description,
  address: azamra.address,
  city: azamra.city,
  arrondissement: azamra.arrondissement,
  postalCode: azamra.postalCode,
  country: azamra.country,
  nearestMetroName: azamra.nearestMetroName,
  nearestMetroLine: azamra.nearestMetroLine,
  email: "contact@azamra.fr",
  phone: azamra.phone,
  whatsapp: azamra.whatsapp,
  instagram: azamra.instagram,
  website: azamra.website,
  hours: azamra.hours,
  terrace: false,
  delivery: false,
  takeaway: false,
  reservation: false,
  privateHire: false,
  certification: "Non concerné",
  kosherType: "À compléter",
  averagePrice: "€€",
  latitude: "48.8862",
  longitude: "2.3025",
  status: "Publié",
  visible: true,
  sponsorshipLevel: "Standard",
  sponsored: false,
  sponsorPriority: 0,
  sponsorDuration: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: "",
  cuisineTypes: [],
  order: 1,
  customerSearches: ["azamra", "vêtements", "mode", "homme", "femme", "enfant", "shopping", "boutique"],
  visibleTagIds: [],
}];

const specificFoodEstablishments: LocalEstablishment[] = [
  {
    id: "david-abitbol-paris",
    databaseId: "8b89f2e1-c00e-46a1-a84f-13f8c25abf64",
    rubricId: "food",
    subrubricId: "food-patisseries",
    mainPhoto: "https://dnpcrousaeoyyuxszwwm.supabase.co/storage/v1/object/public/liberty-images/establishments/d9b7ccdc-90be-4603-b949-5d4868a3f537.png",
    photos: [
      "https://dnpcrousaeoyyuxszwwm.supabase.co/storage/v1/object/public/liberty-images/establishments/3558b963-2b5a-4734-bd81-499e294b2a07.png"
    ],
    photoAlts: ["David Abitbol Paris - Pâtisserie d'exception & Trompe l'œil"],
    name: "David Abitbol Paris",
    slug: "david-abitbol-paris",
    shortDescription: "Lounge café, trompe l'œil, pâtisserie fine",
    description: "Lounge café, créations trompe l'œil, pâtisserie fine et salon de thé raffiné à Paris 17e.",
    address: "97 Rue de Prony",
    city: "Paris",
    arrondissement: "17e",
    postalCode: "75017",
    country: "France",
    phone: "01 42 27 50 50",
    whatsapp: "",
    instagram: "https://www.instagram.com/davidabitbol_paris/",
    website: "",
    hours: "Lundi au Jeudi : 10:00–19:00 / 19:00–23:00\nVendredi : 10:00–15:00\nDimanche : 10:00–15:00 / 19:00–23:00",
    terrace: true,
    delivery: true,
    takeaway: true,
    reservation: false,
    privateHire: false,
    certification: "Rottenberg / Loubavitch",
    kosherType: "Parvé",
    averagePrice: "€€",
    latitude: "48.8845",
    longitude: "2.3065",
    status: "Publié",
    visible: true,
    sponsorshipLevel: "Premium",
    sponsored: true,
    sponsorPriority: 1,
    sponsorDuration: "",
    cuisineTypes: ["Ashkénaze", "Français"],
    order: 1,
    customerSearches: ["david abitbol", "trompe oeil", "patisserie", "café", "matcha", "macaron", "rue de prony", "paris 17"],
    visibleTagIds: ["Loubavitch", "Terrasse", "Ouvert", "Livraison", "À emporter", "Parvé", "Rottenberg"],
  }
];

const sortiesEstablishments: LocalEstablishment[] = [
  {
    id: "barbanegra-terrasse-festive",
    databaseId: "939badf9-28f1-453e-8226-5d2d86599098",
    rubricId: "sorties",
    subrubricId: "sorties-evenements",
    mainPhoto: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkeBfDPFTq6C4fD7y92hgp3R9c3qQ7riyTXjA5T4CHNI3WTyNmSNts36c3jwaEU0Cc7lNqGFyL_26GHGMolotOhLOzBFem-DS_kfjpZhNpBnLsllLCGJvMwEAPJidyiEagTDFiQqQ=s1360-w1360-h1020-rw",
    photos: [
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkeBfDPFTq6C4fD7y92hgp3R9c3qQ7riyTXjA5T4CHNI3WTyNmSNts36c3jwaEU0Cc7lNqGFyL_26GHGMolotOhLOzBFem-DS_kfjpZhNpBnLsllLCGJvMwEAPJidyiEagTDFiQqQ=s1360-w1360-h1020-rw",
      "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlHl7cZTtA4IPNqOxif4BHAsKe9SfrEvTUd2RhObkT7MGTsuoNpgrAc2qC7uzGMF32kavBuyMDtSUpFFs6z7vs_IPijMQVTvehW8hM1nbiY4GdSv3UqrD5DOGBrcRVA_IfZZ1Q-pg=s1360-w1360-h1020-rw",
    ],
    photoAlts: ["Barbanegra - Terrasse Festive", "Ambiance terrasse festive"],
    name: "Barbanegra - Terrasse Festive (Saisonnier)",
    slug: "terrasse-festive",
    shortDescription: "La terrasse des Clubs / Pas de tehouda",
    description: "La terrasse des Clubs | 1 soir = 1 fête - Open 7/7, de juin a septembre",
    address: "13 Port de la Rapée",
    city: "Paris",
    arrondissement: "12e",
    postalCode: "75012",
    country: "France",
    nearestMetroName: "Gare de Lyon",
    nearestMetroLine: "1 & 14",
    phone: "",
    whatsapp: "",
    instagram: "https://www.instagram.com/barbanegraparis/",
    website: "",
    hours: "Lundi au Dimanche : 09:00 - 18:00 (Saisonnier)",
    terrace: true,
    delivery: false,
    takeaway: false,
    reservation: true,
    privateHire: false,
    certification: "No Teouda / Friendly",
    kosherType: "No Teouda / Friendly",
    averagePrice: "€€€",
    latitude: "48.8415",
    longitude: "2.3736",
    status: "Publié",
    visible: true,
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: 0,
    sponsorDuration: "",
    cuisineTypes: [],
    order: 1,
    customerSearches: ["barbanegra", "terrasse festive", "soirée", "club", "port de la rapee", "sorties", "fete"],
    visibleTagIds: ["terrasse", "reservation"],
  },
  {
    id: "lehayiim-peniche-festive",
    databaseId: "542277d0-3782-4ee8-a8a9-141cffa55d91",
    rubricId: "sorties",
    subrubricId: "sorties-soirees-celibataires",
    mainPhoto: "https://res.cloudinary.com/shotgun/image/upload/v1784901165/production/artworks/16EE6FD6-1223-4A68-ADB5-D9563CDCC54D_bafm57.png",
    photos: ["https://res.cloudinary.com/shotgun/image/upload/v1784901165/production/artworks/16EE6FD6-1223-4A68-ADB5-D9563CDCC54D_bafm57.png"],
    photoAlts: ["Lehayiim - Péniche festive"],
    name: "lehayiim - Peniche festive (Saisonnier)",
    slug: "peniche-festive",
    shortDescription: "Péniche festive & soirées célibataires",
    description: "Lehayiim by @dateliers_de_david 🥂: Chaque rencontre est une opportunité✨ Expériences sociales à Paris ✡️ Dîners, activités & découvertes uniques.",
    address: "Port de Paris",
    city: "Paris",
    arrondissement: "",
    postalCode: "75000",
    country: "France",
    phone: "",
    whatsapp: "",
    instagram: "https://www.instagram.com/lehayiim/",
    website: "",
    hours: "Mardi : 09:00 - 18:00",
    terrace: true,
    delivery: false,
    takeaway: false,
    reservation: false,
    privateHire: false,
    certification: "No Teouda / Friendly",
    kosherType: "No Teouda / Friendly",
    averagePrice: "€€",
    latitude: "48.8566",
    longitude: "2.3522",
    status: "Publié",
    visible: true,
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: 0,
    sponsorDuration: "",
    cuisineTypes: [],
    order: 2,
    customerSearches: ["lehayiim", "peniche festive", "soirée célibataire", "rencontre", "sorties"],
    visibleTagIds: ["terrasse"],
  },
  {
    id: "la-gainsbar-festif",
    databaseId: "e715c88f-a1d3-489e-b5ba-f67bfce5d38d",
    rubricId: "sorties",
    subrubricId: "sorties-evenements",
    mainPhoto: "https://www.1001salles.com/images/provider/61181/1760443839_68ee3dbf0597f.webp",
    photos: ["https://www.1001salles.com/images/provider/61181/1760443839_68ee3dbf0597f.webp"],
    photoAlts: ["La Gainsbar - Restaurant festif"],
    name: "La Gainsbar - Restaurant festif (Saisonnier)",
    slug: "lagainsbar",
    shortDescription: "Restaurant festif (Saisonnier)",
    description: "Modern Kosher Food 🔥 Festive Dinner 🎤 Music by @kosmomusic_off 🍽️ Kosher food by @maisonmoricetraiteur. 32 rue de Tilsitt PARIS 17.",
    address: "32 Rue de Tilsitt",
    city: "Paris",
    arrondissement: "17",
    postalCode: "75017",
    country: "France",
    phone: "0698229897",
    whatsapp: "",
    instagram: "https://www.instagram.com/lagainsbar/",
    website: "",
    hours: "Soirées festives sur réservation",
    terrace: false,
    delivery: false,
    takeaway: false,
    reservation: true,
    privateHire: false,
    certification: "Maison Morice Traiteur",
    kosherType: "Bassari",
    averagePrice: "€€€",
    latitude: "48.8765",
    longitude: "2.2965",
    status: "Publié",
    visible: true,
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: 0,
    sponsorDuration: "",
    cuisineTypes: [],
    order: 3,
    customerSearches: ["la gainsbar", "gainsbar", "festif", "rue de tilsitt", "paris 17", "sorties"],
    visibleTagIds: ["reservation"],
  }
];

const beautyEstablishments: LocalEstablishment[] = [
  {
    id: "abigael-hassan-coiffure",
    databaseId: "88b03215-8cf5-41c1-a7b5-ec90e60c71d0",
    rubricId: "soins-feminin",
    subrubricId: "soins-feminin-coiffure-maquillage",
    mainPhoto: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
    photos: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85"],
    photoAlts: ["Abigael Hassan — Coiffure & Maquillage"],
    name: "Abigael Hassan",
    slug: "abigael-hassan-coiffure",
    shortDescription: "Coiffure de mariée, lissage et maquillage professionnel",
    description: "Experte en coiffure événementielle, lissages sur-mesure et maquillage professionnel à domicile et en salon.",
    address: "Paris & Île-de-France (À domicile)",
    city: "Paris",
    arrondissement: "",
    postalCode: "75000",
    country: "France",
    phone: "06 12 34 56 78",
    whatsapp: "06 12 34 56 78",
    instagram: "https://www.instagram.com/abigaelhassan/",
    website: "",
    hours: "Sur rendez-vous du Dimanche au Vendredi",
    terrace: false,
    delivery: false,
    takeaway: false,
    reservation: true,
    privateHire: false,
    certification: "Certifiée",
    kosherType: "Parvé",
    averagePrice: "€€",
    latitude: "48.8566",
    longitude: "2.3522",
    status: "Publié",
    visible: true,
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: 0,
    sponsorDuration: "",
    cuisineTypes: [],
    order: 1,
    customerSearches: ["abigael hassan", "coiffeuse", "lissage", "maquillage", "coiffure mariage"],
    visibleTagIds: ["reservation"],
  }
];

const salleEstablishments: LocalEstablishment[] = [
  {
    id: "chichi-paris",
    databaseId: "7f17e9ff-a988-48f3-b642-4854535f2553",
    rubricId: "location-de-salle",
    subrubricId: "location-de-salle-salle-luxe",
    mainPhoto: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu3pj7u-tzY_rzVHN_vFPMyNBGvE9AcXtjRbTWx24eEcoqE5VniisKOls&s=10",
    photos: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTu3pj7u-tzY_rzVHN_vFPMyNBGvE9AcXtjRbTWx24eEcoqE5VniisKOls&s=10"],
    photoAlts: ["Chichi Paris — Salle de réception de luxe"],
    name: "Chichi Paris (max 180 pers)",
    slug: "chichi-paris",
    shortDescription: "Salle de réception haut de gamme toute équipée",
    description: "Espace événementiel de prestige pouvant accueillir jusqu'à 180 personnes pour mariages, bar-mitsvot, fiançailles et événements privés.",
    address: "Paris",
    city: "Paris",
    arrondissement: "",
    postalCode: "75000",
    country: "France",
    phone: "01 42 00 00 00",
    whatsapp: "",
    instagram: "https://www.instagram.com/chichiparis/",
    website: "",
    hours: "Sur réservation pour vos réceptions privées",
    terrace: true,
    delivery: false,
    takeaway: false,
    reservation: true,
    privateHire: true,
    certification: "Cacher Friendly",
    kosherType: "Parvé",
    averagePrice: "Sur devis",
    latitude: "48.8566",
    longitude: "2.3522",
    status: "Publié",
    visible: true,
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: 0,
    sponsorDuration: "",
    cuisineTypes: [],
    order: 1,
    customerSearches: ["chichi paris", "location de salle", "salle réception", "salle mariage"],
    visibleTagIds: ["reservation"],
  }
];

const weddingEstablishments: LocalEstablishment[] = [
  {
    id: "kinor-decor",
    rubricId: "mariage",
    subrubricId: "mariage-decor",
    mainPhoto: "/images/mariage/kinor-decor.jpg",
    photos: [
      "/images/mariage/kinor-decor.jpg",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85",
      "",
      "",
    ],
    photoAlts: ["Kinor Decor — Scénographie florale et Houppa féerique", "Décoration de mariage d'exception", "", ""],
    name: "Kinor Decor",
    slug: "kinor-decor",
    shortDescription: "Décoration, scénographie florale & Houppot d'exception",
    description: "Kinor Decor sublime vos mariages, fiançailles et réceptions avec des créations florales d'exception, des houppot féeriques et une scénographie personnalisée sur mesure.",
    address: "Paris & Île-de-France (Déplacements France et International)",
    city: "Paris",
    arrondissement: "",
    postalCode: "75000",
    country: "France",
    email: "contact@kinordecor.com",
    phone: "+33652879555",
    whatsapp: "+33652879555",
    instagram: "https://www.instagram.com/kinor_decor_officiel/",
    website: "https://www.instagram.com/kinor_decor_officiel/",
    hours: "Sur rendez-vous du Dimanche au Vendredi",
    terrace: false,
    delivery: true,
    takeaway: false,
    reservation: true,
    privateHire: true,
    certification: "Prestataire Recommandé",
    kosherType: "Parvé",
    averagePrice: "Sur devis",
    latitude: "48.8566",
    longitude: "2.3522",
    status: "Publié",
    visible: true,
    sponsorshipLevel: "Coup de cœur Liberty",
    sponsored: true,
    sponsorPriority: 1,
    sponsorDuration: "Permanent",
    sponsorStartsAt: "",
    sponsorEndsAt: "",
    sponsorPlacement: "En vedette Décoration Mariage",
    sponsorNotes: "Scénographie et Houppa de prestige",
    reservationTarget: "https://www.instagram.com/kinor_decor_officiel/",
    cuisineTypes: [],
    order: 1,
    customerSearches: ["kinor decor", "décoration mariage", "decor", "fleurs mariage", "houppa", "scénographie", "mariage juif", "kinor"],
    visibleTagIds: ["coup-de-coeur", "mariage", "decor"],
  }
];

export const localEstablishments: LocalEstablishment[] = [
  ...specificFoodEstablishments,
  ...restaurantEstablishments,
  ...brunchEstablishments,
  ...wineEstablishments,
  ...shoppingEstablishments,
  ...weddingEstablishments,
  ...sortiesEstablishments,
  ...beautyEstablishments,
  ...salleEstablishments,
];

export const localEstablishmentBySlug = Object.fromEntries(localEstablishments.map((item) => [item.slug ?? slugify(item.name), item]));
