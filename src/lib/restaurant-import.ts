import type { Restaurant, RestaurantImportRow } from "@/types/restaurant";

const emptyHours = Object.fromEntries(
  ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].map((day) => [day, "À compléter"]),
);

const normalize = (value: unknown) => String(value ?? "").trim();
const isUnknown = (value: unknown) => !normalize(value) || normalize(value).toLowerCase() === "à compléter";
const toOptionalBoolean = (value: unknown): boolean | null => {
  if (isUnknown(value)) return null;
  return ["oui", "true", "1", "yes"].includes(normalize(value).toLowerCase());
};
const slugify = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const restaurantIdentity = (name: string, address: string) =>
  `${normalize(name).toLocaleLowerCase("fr")}|${normalize(address).toLocaleLowerCase("fr")}`;

export function normalizeRestaurantRow(row: RestaurantImportRow, index = 0): Restaurant {
  const name = normalize(row["Nom"]);
  const fullAddress = normalize(row["Adresse complète"]);
  const arrondissement = Number(row["Arrondissement"]) || 0;
  const get = (key: string) => row[key];
  const images = [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=82",
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1000&q=82",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1000&q=82",
    "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1000&q=82",
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1000&q=82",
  ];

  return {
    id: slugify(`${name}-${fullAddress}`),
    name,
    fullAddress,
    postalCode: normalize(row["Code postal"]),
    arrondissement,
    phone: normalize(row["Téléphone"]),
    specialty: normalize(row["Spécialité"]),
    cuisine: normalize(row["Cuisine"]),
    type: isUnknown(get("Type (Viande/Lait/Parvé)")) ? "À compléter" : normalize(get("Type (Viande/Lait/Parvé)")) as Restaurant["type"],
    certification: isUnknown(get("Certification")) ? "À compléter" : normalize(get("Certification")),
    services: {
      dineIn: toOptionalBoolean(get("Sur place")),
      takeaway: toOptionalBoolean(get("À emporter")),
      delivery: toOptionalBoolean(get("Livraison")),
      clickAndCollect: toOptionalBoolean(get("Click & Collect")),
      reservation: toOptionalBoolean(get("Réservation")),
    },
    amenities: {
      familyFriendly: toOptionalBoolean(get("Adapté aux familles")),
      accessible: toOptionalBoolean(get("Accessible PMR")),
      parking: toOptionalBoolean(get("Parking")),
      terrace: toOptionalBoolean(get("Terrasse")),
      wifi: toOptionalBoolean(get("Wifi")),
      kidsMenu: toOptionalBoolean(get("Menu enfant")),
      privateHire: toOptionalBoolean(get("Privatisation")),
      metroNearby: null,
    },
    hours: Object.fromEntries(Object.keys(emptyHours).map((day) => [day, isUnknown(get(`Horaires ${day}`)) ? "À compléter" : normalize(get(`Horaires ${day}`))])),
    price: isUnknown(get("Prix")) ? "À compléter" : normalize(get("Prix")) as Restaurant["price"],
    rating: null,
    reviewCount: 0,
    distanceKm: Number((0.8 + ((arrondissement * 7 + index * 3) % 82) / 10).toFixed(1)),
    isOpenNow: toOptionalBoolean(get("Ouvert maintenant")),
    openLunch: null,
    openDinner: null,
    openSunday: null,
    openLate: null,
    image: images[index % images.length],
    latitude: 48.8566 + ((index % 7) - 3) * 0.008,
    longitude: 2.3522 + ((index % 6) - 2.5) * 0.012,
    importedAt: "2026-07-03",
  };
}

/** Upsert sans doublon : les favoris et avis existants restent attachés à l'identité nom + adresse. */
export function mergeRestaurantImports(existing: Restaurant[], incomingRows: RestaurantImportRow[]) {
  const merged = new Map(existing.map((restaurant) => [restaurantIdentity(restaurant.name, restaurant.fullAddress), restaurant]));
  incomingRows.forEach((row, index) => {
    const imported = normalizeRestaurantRow(row, index);
    const key = restaurantIdentity(imported.name, imported.fullAddress);
    const previous = merged.get(key);
    merged.set(key, previous ? { ...previous, ...imported, rating: previous.rating, reviewCount: previous.reviewCount } : imported);
  });
  return [...merged.values()];
}
