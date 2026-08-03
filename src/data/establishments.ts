import { brunches } from "@/data/brunches";
import { restaurants } from "@/data/restaurants";
import { azamra } from "@/data/shops";
import { wineActivities } from "@/data/wine-activities";

export type LocalEstablishmentStatus = "Publié" | "Brouillon" | "Masqué";
export type LocalKosherType = "Bassari" | "Halavi" | "Parvé" | "À compléter";
export type LocalSponsorshipLevel = "Standard" | "Sponsorisé" | "Partenaire officiel" | "Coup de cœur Liberty";

export type LocalEstablishment = {
  id: string;
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
  email?: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
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
  return "À compléter";
};

const restaurantEstablishments: LocalEstablishment[] = restaurants.map((restaurant, index) => ({
  id: restaurant.id,
  rubricId: "food",
  subrubricId: "food-restaurants",
  mainPhoto: restaurant.image,
  photos: ["", ""],
  photoAlts: ["", ""],
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
  cuisineTypes: [restaurant.cuisine].filter(Boolean),
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
  photos: normalizePhotoSlots(brunch.images[0], [brunch.images[1], brunch.images[2]], 2),
  photoAlts: ["", ""],
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
  cuisineTypes: [brunch.cuisine, brunch.specialty, ...brunch.tags].filter(Boolean),
  order: restaurantEstablishments.length + index + 1,
  customerSearches: [brunch.name, brunch.specialty, brunch.cuisine, "brunch", "pancakes", "avocado toast", "café", "halavi", "lait"].filter(Boolean),
  visibleTagIds: ["reservation", "livraison", "halavi", "terrasse"].filter(Boolean),
}));

const wineEstablishments: LocalEstablishment[] = wineActivities.map((activity, index) => ({
  id: activity.slug,
  rubricId: "vin-spiritueux",
  subrubricId: "vin-spiritueux-selections",
  mainPhoto: activity.image,
  photos: ["", ""],
  photoAlts: ["", ""],
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
  cuisineTypes: ["Vin & Spiritueux", activity.type, ...activity.tags],
  order: index + 1,
  customerSearches: [activity.title, activity.type, ...activity.tags, "vin casher", "spiritueux casher", "dégustation", "winess"],
  visibleTagIds: ["sponsorise", "reservation", "parve"],
}));

const shoppingEstablishments: LocalEstablishment[] = [{
  id: azamra.slug,
  rubricId: "shopping",
  subrubricId: "shopping-mode",
  mainPhoto: azamra.image,
  photos: ["", ""],
  photoAlts: ["", ""],
  name: azamra.name,
  slug: azamra.slug,
  shortDescription: `${azamra.type} · Shopping`,
  description: azamra.description,
  address: "",
  city: "Paris",
  arrondissement: "",
  postalCode: "",
  country: "France",
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  website: "",
  hours: "",
  terrace: false,
  delivery: false,
  takeaway: false,
  reservation: false,
  privateHire: false,
  certification: "Non concerné",
  kosherType: "À compléter",
  averagePrice: "€€",
  latitude: "",
  longitude: "",
  status: "Publié",
  visible: true,
  sponsorshipLevel: "Standard",
  sponsored: false,
  sponsorPriority: 0,
  sponsorDuration: "",
  sponsorStartsAt: "",
  sponsorEndsAt: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: "",
  cuisineTypes: azamra.tags,
  order: 1,
  customerSearches: ["azamra", "vêtements", "mode", "homme", "femme", "enfant", "shopping", "boutique"],
  visibleTagIds: [],
}];

export const localEstablishments: LocalEstablishment[] = [
  ...restaurantEstablishments,
  ...brunchEstablishments,
  ...wineEstablishments,
  ...shoppingEstablishments,
];

export const localEstablishmentBySlug = Object.fromEntries(localEstablishments.map((item) => [item.slug ?? slugify(item.name), item]));
