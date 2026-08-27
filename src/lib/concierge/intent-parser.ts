/**
 * LIBERTY AI CONCIERGE V1 — INTENT PARSER & CONVERSATIONAL CONTEXT
 * Moteur déterministe de compréhension du langage naturel en français.
 * Zéro hallucination, 100% rattaché aux données Supabase et fiches réelles.
 */

import { searchEstablishments, type EstablishmentSearchResult } from "@/lib/search/search-service";

export type ConciergeCriteria = {
  rawQuery: string;
  category?: string;
  subrubric?: string;
  arrondissement?: string;
  city?: string;
  kosherType?: "Bassari" | "Halavi" | "Parvé";
  certification?: string;
  serviceMode?: "domicile" | "sur_place";
  services?: {
    terrace?: boolean;
    delivery?: boolean;
    takeaway?: boolean;
    reservation?: boolean;
    openNow?: boolean;
    openSunday?: boolean;
  };
  maxPrice?: number;
  priceLevel?: string;
  searchTerms: string[];
  nearMe?: boolean;
};

export type ConciergeTurn = {
  role: "user" | "concierge";
  text: string;
  criteria?: ConciergeCriteria;
  resultCount?: number;
  timestamp: number;
};

export type ConciergeSession = {
  accumulatedCriteria: Partial<ConciergeCriteria>;
  history: ConciergeTurn[];
};

// 1. Dictionnaire de synonymes & métiers vers catégories Liberty
const CATEGORY_MAP: Record<string, { rubric: string; subrubric?: string; label: string }> = {
  // Food / Restauration
  resto: { rubric: "food", subrubric: "restaurants", label: "Restaurants" },
  restos: { rubric: "food", subrubric: "restaurants", label: "Restaurants" },
  restaurant: { rubric: "food", subrubric: "restaurants", label: "Restaurants" },
  restaurants: { rubric: "food", subrubric: "restaurants", label: "Restaurants" },
  brunch: { rubric: "food", subrubric: "brunch", label: "Brunch" },
  brunches: { rubric: "food", subrubric: "brunch", label: "Brunch" },
  petit_dejeuner: { rubric: "food", subrubric: "brunch", label: "Brunch" },
  traiteur: { rubric: "food", subrubric: "traiteurs", label: "Traiteurs" },
  traiteurs: { rubric: "food", subrubric: "traiteurs", label: "Traiteurs" },
  boulangerie: { rubric: "food", subrubric: "boulangeries", label: "Boulangeries" },
  boulangeries: { rubric: "food", subrubric: "boulangeries", label: "Boulangeries" },
  patisserie: { rubric: "food", subrubric: "patisseries", label: "Pâtisseries" },
  patisseries: { rubric: "food", subrubric: "patisseries", label: "Pâtisseries" },
  gateau: { rubric: "food", subrubric: "patisseries", label: "Pâtisseries" },
  gateaux: { rubric: "food", subrubric: "patisseries", label: "Pâtisseries" },
  salon_de_the: { rubric: "food", subrubric: "salons-de-the", label: "Salons de thé" },
  boucherie: { rubric: "food", subrubric: "boucheries", label: "Boucheries" },
  boucheries: { rubric: "food", subrubric: "boucheries", label: "Boucheries" },
  supermarche: { rubric: "food", subrubric: "supermarches", label: "Supermarchés" },
  epicerie: { rubric: "food", subrubric: "supermarches", label: "Épiceries" },

  // Beauty & Soins Féminin
  coiffure: { rubric: "soins-feminin", subrubric: "coiffure", label: "Coiffure" },
  coiffeuse: { rubric: "soins-feminin", subrubric: "coiffure", label: "Coiffure" },
  coiffeur: { rubric: "soins-feminin", subrubric: "coiffure", label: "Coiffure" },
  brushing: { rubric: "soins-feminin", subrubric: "coiffure", label: "Coiffure" },
  lissage: { rubric: "soins-feminin", subrubric: "coiffure", label: "Lissage" },
  tanin: { rubric: "soins-feminin", subrubric: "coiffure", label: "Lissage" },
  keratine: { rubric: "soins-feminin", subrubric: "coiffure", label: "Lissage" },
  maquillage: { rubric: "soins-feminin", subrubric: "maquillage", label: "Maquillage" },
  maquilleuse: { rubric: "soins-feminin", subrubric: "maquillage", label: "Maquillage" },
  makeup: { rubric: "soins-feminin", subrubric: "maquillage", label: "Maquillage" },
  ongles: { rubric: "soins-feminin", subrubric: "manucure", label: "Onglerie & Manucure" },
  manucure: { rubric: "soins-feminin", subrubric: "manucure", label: "Onglerie & Manucure" },
  pedicure: { rubric: "soins-feminin", subrubric: "manucure", label: "Onglerie & Manucure" },
  semi_permanent: { rubric: "soins-feminin", subrubric: "manucure", label: "Manucure" },
  massage: { rubric: "soins-feminin", subrubric: "massages", label: "Massages" },
  massages: { rubric: "soins-feminin", subrubric: "massages", label: "Massages" },
  soin: { rubric: "soins-feminin", subrubric: "soins-du-visage", label: "Soins visage" },
  soins: { rubric: "soins-feminin", subrubric: "soins-du-visage", label: "Soins visage" },
  epilation: { rubric: "soins-feminin", subrubric: "epilation", label: "Épilation" },
  regard: { rubric: "soins-feminin", subrubric: "regard-cils", label: "Regard & Cils" },
  cils: { rubric: "soins-feminin", subrubric: "regard-cils", label: "Regard & Cils" },
  sourcils: { rubric: "soins-feminin", subrubric: "regard-cils", label: "Regard & Cils" },

  // Vin & Spiritueux
  vin: { rubric: "vin-spiritueux", label: "Vin & Spiritueux" },
  vins: { rubric: "vin-spiritueux", label: "Vin & Spiritueux" },
  caviste: { rubric: "vin-spiritueux", label: "Cavistes" },
  cavistes: { rubric: "vin-spiritueux", label: "Cavistes" },
  spiritueux: { rubric: "vin-spiritueux", label: "Vin & Spiritueux" },
  champagne: { rubric: "vin-spiritueux", label: "Champagnes" },
  tequila: { rubric: "vin-spiritueux", label: "Spiritueux" },
  whisky: { rubric: "vin-spiritueux", label: "Spiritueux" },
  vodka: { rubric: "vin-spiritueux", label: "Spiritueux" },
  degustation: { rubric: "vin-spiritueux", label: "Dégustations de vin" },

  // Sorties & Événements
  sortie: { rubric: "sorties", label: "Sorties & Loisirs" },
  sorties: { rubric: "sorties", label: "Sorties & Loisirs" },
  evenement: { rubric: "sorties", subrubric: "evenements", label: "Événements" },
  evenements: { rubric: "sorties", subrubric: "evenements", label: "Événements" },
  concert: { rubric: "sorties", subrubric: "concerts", label: "Concerts" },
  concerts: { rubric: "sorties", subrubric: "concerts", label: "Concerts" },
  spectacle: { rubric: "sorties", subrubric: "spectacles", label: "Spectacles" },
  theatre: { rubric: "sorties", subrubric: "spectacles", label: "Théâtre" },
  dj: { rubric: "sorties", subrubric: "evenements", label: "DJ & Événements" },
  mariage: { rubric: "sorties", subrubric: "evenements", label: "Mariages & Réceptions" },

  // Enfants
  enfant: { rubric: "enfants", label: "Enfants & Famille" },
  enfants: { rubric: "enfants", label: "Enfants & Famille" },
  famille: { rubric: "enfants", label: "Enfants & Famille" },
  activite_enfant: { rubric: "enfants", label: "Activités Enfants" },
  bebe: { rubric: "enfants", label: "Enfants & Bébés" },

  // Mikvé & Culte
  mikve: { rubric: "mikve", label: "Mikvé" },
  mikveh: { rubric: "mikve", label: "Mikvé" },
  synagogue: { rubric: "religion", label: "Synagogues & Culte" },

  // Shopping & Mode
  shopping: { rubric: "shopping", label: "Shopping" },
  vetement: { rubric: "shopping", subrubric: "mode", label: "Mode & Vêtements" },
  vetements: { rubric: "shopping", subrubric: "mode", label: "Mode & Vêtements" },
  mode: { rubric: "shopping", subrubric: "mode", label: "Mode" },
  robe: { rubric: "shopping", subrubric: "mode", label: "Mode" },
  bijoux: { rubric: "shopping", subrubric: "bijoux", label: "Bijoux" },
  deco: { rubric: "shopping", subrubric: "maison", label: "Décoration & Maison" },
  decoration: { rubric: "shopping", subrubric: "maison", label: "Décoration & Maison" },
  maison: { rubric: "shopping", subrubric: "maison", label: "Maison" },

  // Voyages & Chauffeurs
  voyage: { rubric: "voyages", label: "Voyages" },
  voyages: { rubric: "voyages", label: "Voyages" },
  hotel: { rubric: "voyages", label: "Hôtels & Séjours" },
  sejour: { rubric: "voyages", label: "Séjours cachers" },
  chauffeur: { rubric: "services-utiles", label: "Chauffeurs & VTC" },
  vtc: { rubric: "services-utiles", label: "Chauffeurs & VTC" },
  taxi: { rubric: "services-utiles", label: "Chauffeurs" },
};

// 2. Normalisation du texte
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 3. Extraction d'arrondissement parisien
export function extractArrondissement(text: string): string | undefined {
  const norm = normalizeText(text);

  const match = norm.match(/\b(7500[1-9]|7501[0-9]|75020)\b/) ||
                norm.match(/\b([1-9]|1[0-9]|20)\s*(e|eme|eme|er|ere)?\s*(arrondissement|arrond|arr)?\b/) ||
                norm.match(/\bparis\s*([1-9]|1[0-9]|20)\b/);

  if (match) {
    let rawNum = match[1];
    if (rawNum.startsWith("750")) {
      rawNum = String(parseInt(rawNum.slice(3), 10));
    }
    const num = parseInt(rawNum, 10);
    if (num >= 1 && num <= 20) {
      return String(num);
    }
  }
  return undefined;
}

// 4. Extraction de villes
const KNOWN_CITIES = [
  "paris",
  "levallois",
  "levallois-perret",
  "boulogne",
  "boulogne-billancourt",
  "neuilly",
  "neuilly-sur-seine",
  "sarcelles",
  "creteil",
  "saint-mande",
  "vincennes",
  "charenton",
  "marseille",
  "lyon",
  "nice",
  "strasbourg",
  "villeurbanne",
  "cannes",
  "aix-en-provence",
  "antibes",
  "toulouse",
];

export function extractCity(text: string): string | undefined {
  const norm = normalizeText(text);
  for (const city of KNOWN_CITIES) {
    const cityNorm = normalizeText(city);
    if (new RegExp(`\\b${cityNorm}\\b`).test(norm)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return undefined;
}

// 5. Extraction du type de Cacherout
export function extractKosherType(text: string): "Bassari" | "Halavi" | "Parvé" | undefined {
  const norm = normalizeText(text);
  if (/\b(bassari|viande|viandes|meat)\b/.test(norm)) return "Bassari";
  if (/\b(halavi|lait|fromage|dairy)\b/.test(norm)) return "Halavi";
  if (/\b(parve|parve|neutre)\b/.test(norm)) return "Parvé";
  return undefined;
}

// 6. Extraction de la certification
export function extractCertification(text: string): string | undefined {
  const norm = normalizeText(text);
  if (/\b(beth din|bdp|consistoire)\b/.test(norm)) return "Beth Din de Paris";
  if (/\b(badatz|mehadrin)\b/.test(norm)) return "Badatz";
  if (/\b(loubavitch|chabad)\b/.test(norm)) return "Loubavitch";
  if (/\b(rottenberg)\b/.test(norm)) return "Rottenberg";
  if (/\b(rabbinat)\b/.test(norm)) return "Rabbinat";
  return undefined;
}

// 7. Extraction du mode de service (domicile vs sur place)
export function extractServiceMode(text: string): "domicile" | "sur_place" | undefined {
  const norm = normalizeText(text);
  if (/\b(a domicile|chez moi|a la maison|deplacement)\b/.test(norm)) return "domicile";
  if (/\b(en institut|au salon|sur place|en boutique)\b/.test(norm)) return "sur_place";
  return undefined;
}

// 8. Extraction du budget / prix maximum
export function extractPriceCriteria(text: string): { maxPrice?: number; priceLevel?: string } {
  const norm = normalizeText(text);

  const priceMatch = norm.match(/moins de\s*(\d+)\s*(€|euros?)/) ||
                     norm.match(/max\s*(\d+)\s*(€|euros?)/) ||
                     norm.match(/jusqu\s*a\s*(\d+)\s*(€|euros?)/);

  if (priceMatch) {
    const parsed = parseInt(priceMatch[1], 10);
    if (!isNaN(parsed) && parsed > 0) {
      return { maxPrice: parsed };
    }
  }

  if (/\b(pas cher|economique|petit prix|abordable)\b/.test(norm)) {
    return { priceLevel: "€" };
  }
  if (/\b(haut de gamme|gastronomique|luxe|chic)\b/.test(norm)) {
    return { priceLevel: "€€€" };
  }

  return {};
}

// 9. Extraction des services annexes (terrasse, livraison, ouvert...)
export function extractServices(text: string) {
  const norm = normalizeText(text);
  return {
    terrace: /\b(terrasse|exterieur)\b/.test(norm) ? true : undefined,
    delivery: /\b(livraison|livrer|livre)\b/.test(norm) ? true : undefined,
    takeaway: /\b(a emporter|emporter)\b/.test(norm) ? true : undefined,
    reservation: /\b(reserver|reservation|table)\b/.test(norm) ? true : undefined,
    openNow: /\b(ouvert|ouvert maintenant|ce soir|actuellement)\b/.test(norm) ? true : undefined,
    openSunday: /\b(dimanche|ouvert dimanche)\b/.test(norm) ? true : undefined,
  };
}

// 10. Détection de géolocalisation demandée
export function isNearMeQuery(text: string): boolean {
  const norm = normalizeText(text);
  return /\b(pres de moi|autour de moi|le plus proche|a proximite|proche de moi|vers moi)\b/.test(norm);
}

// 11. Fonction Principale : Parser la phrase utilisateur
export function parseConciergeIntent(rawInput: string, sessionContext?: Partial<ConciergeCriteria>): ConciergeCriteria {
  const norm = normalizeText(rawInput);
  const words = norm.split(/\s+/).filter(Boolean);

  // 1. Détection de catégorie
  let matchedCategory: string | undefined;
  let matchedSubrubric: string | undefined;

  for (const word of words) {
    if (CATEGORY_MAP[word]) {
      matchedCategory = CATEGORY_MAP[word].rubric;
      matchedSubrubric = CATEGORY_MAP[word].subrubric;
      break;
    }
  }

  // Si non trouvé par mot simple, chercher expressions à 2 mots
  if (!matchedCategory) {
    for (let i = 0; i < words.length - 1; i++) {
      const pair = `${words[i]}_${words[i + 1]}`;
      if (CATEGORY_MAP[pair]) {
        matchedCategory = CATEGORY_MAP[pair].rubric;
        matchedSubrubric = CATEGORY_MAP[pair].subrubric;
        break;
      }
    }
  }

  const arrondissement = extractArrondissement(rawInput) ?? sessionContext?.arrondissement;
  const city = extractCity(rawInput) ?? sessionContext?.city ?? (arrondissement ? "Paris" : undefined);
  const kosherType = extractKosherType(rawInput) ?? sessionContext?.kosherType;
  const certification = extractCertification(rawInput) ?? sessionContext?.certification;
  const serviceMode = extractServiceMode(rawInput) ?? sessionContext?.serviceMode;
  const { maxPrice, priceLevel } = extractPriceCriteria(rawInput);
  const services = extractServices(rawInput);
  const nearMe = isNearMeQuery(rawInput);

  // Termes de recherche résiduels (mots porteurs de sens)
  const stopWords = new Set([
    "trouve", "trouver", "cherche", "chercher", "un", "une", "des", "le", "la", "les", "du", "de", "dans",
    "a", "au", "aux", "pour", "avec", "qui", "fait", "fais", "est", "sont", "moi", "je", "nous", "vous",
    "veux", "voudrais", "svp", "merci", "paris", "liberty", "cacher", "casher", "kosher"
  ]);

  const searchTerms = words.filter((w) => !stopWords.has(w) && w.length > 2);

  return {
    rawQuery: rawInput.trim(),
    category: matchedCategory ?? sessionContext?.category,
    subrubric: matchedSubrubric ?? sessionContext?.subrubric,
    arrondissement,
    city,
    kosherType,
    certification,
    serviceMode,
    services: {
      terrace: services.terrace ?? sessionContext?.services?.terrace,
      delivery: services.delivery ?? sessionContext?.services?.delivery,
      takeaway: services.takeaway ?? sessionContext?.services?.takeaway,
      reservation: services.reservation ?? sessionContext?.services?.reservation,
      openNow: services.openNow ?? sessionContext?.services?.openNow,
      openSunday: services.openSunday ?? sessionContext?.services?.openSunday,
    },
    maxPrice: maxPrice ?? sessionContext?.maxPrice,
    priceLevel: priceLevel ?? sessionContext?.priceLevel,
    searchTerms,
    nearMe,
  };
}

// 12. Génération de réponse naturelle & chaleureuse en français courant
export function generateConciergeResponse(criteria: ConciergeCriteria, resultCount: number): string {
  if (resultCount === 0) {
    const loc = criteria.arrondissement ? ` dans le ${criteria.arrondissement}e` : criteria.city ? ` à ${criteria.city}` : "";
    return `Je n’ai trouvé aucun établissement correspondant exactement à votre demande${loc}. Souhaitez-vous élargir la recherche ?`;
  }

  const categoryLabel = criteria.category === "food"
    ? (criteria.kosherType ? `restaurants ${criteria.kosherType.toLowerCase()}` : "adresses food")
    : criteria.category === "soins-feminin"
    ? (criteria.serviceMode === "domicile" ? "professionnelles à domicile" : "soins & beauté")
    : criteria.category === "vin-spiritueux"
    ? "sélections de vins & spiritueux"
    : criteria.category === "sorties"
    ? "sorties & événements"
    : criteria.category === "enfants"
    ? "activités enfants"
    : "adresses";

  const loc = criteria.arrondissement
    ? ` dans le ${criteria.arrondissement}e arrondissement`
    : criteria.city
    ? ` à ${criteria.city}`
    : "";

  if (resultCount === 1) {
    return `J’ai trouvé 1 adresse${loc} qui correspond parfaitement. La voici juste en dessous.`;
  }

  return `J’ai trouvé ${resultCount} ${categoryLabel}${loc} qui correspondent à votre recherche. Les voici :`;
}

// 13. Calcul de distance en kilomètres (Formule de Haversine)
export function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// 14. Exécution déterministe de la recherche Concierge
export async function executeConciergeSearch(
  criteria: ConciergeCriteria,
  userCoords?: { latitude: number; longitude: number }
): Promise<EstablishmentSearchResult[]> {
  const rawQuery = criteria.rawQuery.trim();
  const rawResults = await searchEstablishments(rawQuery, { limit: 50 });

  const filtered = rawResults.filter((item) => {
    const categoryNorm = (item.establishment?.rubricId || item.category || "").toLowerCase();

    // 1. Filtrage Catégorie
    if (criteria.category) {
      if (
        criteria.category === "food" &&
        !categoryNorm.includes("food") &&
        !categoryNorm.includes("rest") &&
        !categoryNorm.includes("brunch") &&
        !categoryNorm.includes("boulang") &&
        !categoryNorm.includes("patiss") &&
        !categoryNorm.includes("traiteur") &&
        !categoryNorm.includes("salon") &&
        !categoryNorm.includes("boucherie") &&
        !categoryNorm.includes("epicerie") &&
        !categoryNorm.includes("supermarche")
      ) {
        return false;
      }
      if (
        criteria.category === "soins-feminin" &&
        !categoryNorm.includes("soin") &&
        !categoryNorm.includes("beaut") &&
        !categoryNorm.includes("coiff") &&
        !categoryNorm.includes("feminin") &&
        !categoryNorm.includes("ongle") &&
        !categoryNorm.includes("manuc") &&
        !categoryNorm.includes("massage") &&
        !categoryNorm.includes("maquill") &&
        !categoryNorm.includes("epil") &&
        !categoryNorm.includes("cils")
      ) {
        return false;
      }
      if (
        criteria.category === "vin-spiritueux" &&
        !categoryNorm.includes("vin") &&
        !categoryNorm.includes("spirit") &&
        !categoryNorm.includes("cavis") &&
        !categoryNorm.includes("champagne") &&
        !categoryNorm.includes("degust")
      ) {
        return false;
      }
      if (
        criteria.category === "sorties" &&
        !categoryNorm.includes("sorti") &&
        !categoryNorm.includes("evenement") &&
        !categoryNorm.includes("concert") &&
        !categoryNorm.includes("spectacle") &&
        !categoryNorm.includes("theatre") &&
        !categoryNorm.includes("loisir")
      ) {
        return false;
      }
      if (
        criteria.category === "enfants" &&
        !categoryNorm.includes("enfant") &&
        !categoryNorm.includes("famille") &&
        !categoryNorm.includes("bebe")
      ) {
        return false;
      }
      if (criteria.category === "mikve" && !categoryNorm.includes("mikv")) {
        return false;
      }
      if (
        criteria.category === "shopping" &&
        !categoryNorm.includes("shop") &&
        !categoryNorm.includes("mode") &&
        !categoryNorm.includes("maison") &&
        !categoryNorm.includes("vetement") &&
        !categoryNorm.includes("bijou") &&
        !categoryNorm.includes("deco")
      ) {
        return false;
      }
    }

    // 2. Filtrage Arrondissement
    if (criteria.arrondissement) {
      const itemArr = (item.location?.arrondissement || item.establishment?.arrondissement || "").replace(/\D/g, "");
      const itemPostal = item.location?.postalCode || item.establishment?.postalCode || "";
      const matchesArr = itemArr === criteria.arrondissement || itemPostal.endsWith(criteria.arrondissement.padStart(2, "0"));
      if (!matchesArr) return false;
    }

    // 3. Filtrage Cacherout
    if (criteria.kosherType) {
      const itemKosher = (item.filters?.kosherType || item.establishment?.kosherType || "").toLowerCase();
      if (!itemKosher.includes(criteria.kosherType.toLowerCase())) return false;
    }

    // 4. Filtrage Mode de service (domicile vs sur place)
    if (criteria.serviceMode === "domicile") {
      const atHomeServices = item.establishment?.beautyServices?.some((s) => s.atHome);
      const atHomeKeywords = item.keywords.some((k) => k.toLowerCase().includes("domicile"));
      if (!atHomeServices && !atHomeKeywords) return false;
    }

    // 5. Filtrage Terrasse
    if (criteria.services?.terrace) {
      const hasTerrace = item.establishment?.terrace || item.filters?.terrace || item.keywords.some((k) => k.toLowerCase().includes("terrasse"));
      if (!hasTerrace) return false;
    }

    // 6. Filtrage Livraison
    if (criteria.services?.delivery) {
      const hasDelivery = item.establishment?.delivery || item.filters?.delivery || item.establishment?.deliverooUrl || item.establishment?.uberEatsUrl;
      if (!hasDelivery) return false;
    }

    // 7. Filtrage des termes de recherche résiduels spécifiques (zéro hallucination sur termes inconnus)
    const nonCategoryTerms = criteria.searchTerms.filter(
      (term) =>
        term !== "restaurant" &&
        term !== "restaurants" &&
        term !== "resto" &&
        term !== "restos" &&
        term !== "brunch" &&
        term !== "traiteur" &&
        term !== "boulangerie" &&
        term !== "patisserie" &&
        term !== "coiffure" &&
        term !== "coiffeuse" &&
        term !== "lissage" &&
        term !== "maquillage" &&
        term !== "caviste" &&
        term !== "vin" &&
        term !== "sortie" &&
        term !== "sorties" &&
        term !== "enfant" &&
        term !== "enfants" &&
        term !== "bassari" &&
        term !== "halavi" &&
        term !== "parve" &&
        term !== "domicile" &&
        term !== "terrasse" &&
        term !== "livraison" &&
        term !== "pres" &&
        !term.match(/^(750\d\d|\d\de?)$/)
    );

    if (nonCategoryTerms.length > 0) {
      const itemCorpus = [
        item.title,
        item.subtitle || "",
        item.category || "",
        ...(item.keywords || []),
      ]
        .join(" ")
        .toLowerCase();

      const matchesAllSpecific = nonCategoryTerms.every((term) =>
        itemCorpus.includes(term.toLowerCase())
      );
      if (!matchesAllSpecific) return false;
    }

    return true;
  });

  // Géolocalisation & distance
  if (userCoords && userCoords.latitude && userCoords.longitude) {
    const geoMapped = filtered.map((item) => {
      const lat = item.location?.latitude ? Number(item.location.latitude) : item.establishment?.latitude ? Number(item.establishment.latitude) : null;
      const lon = item.location?.longitude ? Number(item.location.longitude) : item.establishment?.longitude ? Number(item.establishment.longitude) : null;
      if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
        const dist = computeDistanceKm(userCoords.latitude, userCoords.longitude, lat, lon);
        return {
          ...item,
          distanceKm: dist,
          subtitle: `${dist} km · ${item.subtitle || item.category}`,
        };
      }
      return item;
    });

    if (criteria.nearMe) {
      geoMapped.sort((a, b) => ((a as EstablishmentSearchResult & { distanceKm?: number }).distanceKm ?? 999) - ((b as EstablishmentSearchResult & { distanceKm?: number }).distanceKm ?? 999));
    }
    return geoMapped;
  }

  return filtered;
}
