export type RestaurantType = "Viande" | "Lait" | "Parvé" | "À compléter";
export type RestaurantPrice = "€" | "€€" | "€€€" | "À compléter";

export type RestaurantServices = {
  dineIn: boolean | null;
  takeaway: boolean | null;
  delivery: boolean | null;
  clickAndCollect: boolean | null;
  reservation: boolean | null;
};

export type RestaurantAmenities = {
  familyFriendly: boolean | null;
  accessible: boolean | null;
  parking: boolean | null;
  terrace: boolean | null;
  wifi: boolean | null;
  kidsMenu: boolean | null;
  privateHire: boolean | null;
  metroNearby: boolean | null;
};

export type Restaurant = {
  id: string;
  name: string;
  fullAddress: string;
  postalCode: string;
  arrondissement: number;
  phone: string;
  specialty: string;
  cuisine: string;
  type: RestaurantType;
  certification: string;
  services: RestaurantServices;
  amenities: RestaurantAmenities;
  hours: Record<string, string>;
  price: RestaurantPrice;
  rating: number | null;
  reviewCount: number;
  distanceKm: number;
  isOpenNow: boolean | null;
  openLunch: boolean | null;
  openDinner: boolean | null;
  openSunday: boolean | null;
  openLate: boolean | null;
  image: string;
  gallery?: string[];
  website?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  city?: string;
  country?: string;
  tags?: string[];
  sponsored?: boolean;
  sponsorshipLevel?: string;
  fieldVisibility?: Record<string, boolean>;
  latitude: number;
  longitude: number;
  importedAt: string;
};

export type RestaurantImportRow = Record<string, string | number | boolean | null | undefined>;
