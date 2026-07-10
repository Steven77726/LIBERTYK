export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  subcategory?: string;
  href: string;
  image: string;
  keywords: string[];
  customerSearches?: string[];
  location?: {
    city?: string;
    arrondissement?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  filters?: {
    certification?: string;
    kosherType?: "Bassari" | "Halavi" | "Parvé" | "Viande" | "Lait" | "À compléter" | string;
    terrace?: boolean;
    openNow?: boolean | null;
    delivery?: boolean;
    takeaway?: boolean;
    reservation?: boolean;
    price?: string;
  };
  ranking?: {
    sponsored?: boolean;
    popularity?: number;
    favorites?: number;
    reviewCount?: number;
  };
};

const concepts: Record<string, string[]> = {
  cacher: ["cacher", "casher", "kasher", "kosher", "certifié", "beth din"],
  viande: ["viande", "bassari", "bassari 17", "carné", "grill", "grillade", "steak", "burger", "viande paris", "restaurant viande"],
  lait: ["lait", "halavi", "halavi", "fromage", "dairy", "laitier", "halavi paris"],
  restaurant: ["restaurant", "resto", "table", "déjeuner", "dîner", "manger", "repas"],
  brunch: ["brunch", "petit déjeuner", "pancakes", "avocado toast", "œufs", "bagel", "gaufre"],
  traiteur: ["traiteur", "traiteur shabbat", "traiteur chabbat", "plateau chabbat", "repas shabbat", "réception"],
  patisserie: ["patisserie", "pâtisserie", "gateau", "gâteau", "dessert", "salon de thé", "glacier", "boulangerie"],
  voyage: ["voyage", "séjour", "vacances", "hôtel", "club", "destination", "pessah", "marrakech", "mai", "orthodoxe", "famille"],
  evenement: ["événement", "concert", "conférence", "soirée", "dj", "spectacle", "dégustation"],
  sport: ["sport", "padel", "coach", "musculation", "salle", "cours privé", "fitness"],
  mariage: ["mariage", "houppa", "dj", "salle", "traiteur", "décoration", "photographe"],
  shopping: ["shopping", "boutique", "mode", "costume", "robe", "chaussures", "judaïca", "vêtement", "vetement", "azamra"],
  religion: ["religion", "torah", "cours", "synagogue", "mikvé", "mikve", "chabbat", "shabbat", "librairie", "cadeau religieux"],
  vin: ["vin", "spiritueux", "caviste", "dégustation", "masterclass", "cocktail", "bar à vin", "tequila casher", "winess"],
  chauffeur: ["chauffeur", "transport", "taxi", "vtc", "aéroport", "navette"],
  calendrier: ["calendrier juif", "fête juive", "horaire chabbat", "chabbat", "pessah", "roch hachana", "kippour"],
  bonplan: ["bon plan", "promotion", "promo", "pas cher", "réduction", "offre"],
  famille: ["famille", "familial", "enfant", "kids", "menu enfant"],
  paris17: ["17", "17e", "75017", "paris 17", "paris17", "dix-septième arrondissement"],
  terrasse: ["terrasse", "dehors", "extérieur"],
  livraison: ["livraison", "livrer", "deliveroo", "uber eats"],
  emporter: ["à emporter", "a emporter", "takeaway", "click collect", "click & collect"],
  reservation: ["réservation", "reserver", "réserver", "table"],
  ouvert: ["ouvert", "ouvert maintenant", "ouvert dimanche", "dimanche", "midi", "soir", "tard"],
};

export function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, " ").replace(/[^a-z0-9€]+/g, " ").trim();
}

export function buildInvisibleKeywords(seed: string[], context: { category?: string; location?: string } = {}) {
  const base = new Set(seed.map((value) => value.trim()).filter(Boolean));
  const joined = normalizeSearchText([...base].join(" "));
  Object.entries(concepts).forEach(([concept, aliases]) => {
    if ([concept, ...aliases].some((alias) => joined.includes(normalizeSearchText(alias)))) {
      aliases.forEach((alias) => base.add(alias));
    }
  });
  if (context.category) base.add(context.category);
  if (context.location) base.add(context.location);
  const core = [...base].slice(0, 36);
  const prefixes = ["près de moi", "meilleur", "adresse", "trouver", "recommandé", "ouvert", "familial", "romantique"];
  core.slice(0, 12).forEach((value) => {
    if (context.category) base.add(`${context.category} ${value}`);
    if (context.location) base.add(`${value} ${context.location}`);
  });
  prefixes.forEach((prefix) => core.slice(0, 8).forEach((value) => base.add(`${prefix} ${value}`)));
  core.slice(0, 10).forEach((left) => core.slice(0, 10).forEach((right) => {
    if (left !== right) base.add(`${left} ${right}`);
  }));
  return [...base].slice(0, 100);
}

function expandQuery(query: string) {
  const normalized = normalizeSearchText(query);
  const tokens = normalized.split(" ").filter((token) => token.length > 1);
  const expanded = new Set(tokens);
  Object.entries(concepts).forEach(([concept, aliases]) => {
    if ([concept, ...aliases].some((alias) => normalized.includes(normalizeSearchText(alias)))) {
      expanded.add(concept);
      aliases.flatMap((alias) => normalizeSearchText(alias).split(" ")).forEach((token) => expanded.add(token));
    }
  });
  return { normalized, tokens: [...expanded] };
}

export type SearchFilters = {
  arrondissement?: string;
  certification?: string;
  kosherType?: string;
  terrace?: boolean;
  openNow?: boolean;
  delivery?: boolean;
  takeaway?: boolean;
  reservation?: boolean;
  price?: string;
};

export type SearchOptions = {
  filters?: SearchFilters;
  userLocation?: { latitude: number; longitude: number };
};

const categoryIntents: Record<string, string[]> = {
  Food: ["food", "restaurant", "brunch", "traiteur", "patisserie", "pâtisserie", "boulangerie", "glacier", "manger"],
  Restaurant: ["restaurant", "resto", "viande", "bassari", "grill", "entrecote", "entrecôte", "burger"],
  Brunch: ["brunch", "avocado", "pancakes", "bagel", "gaufre", "cafe", "café", "oeufs"],
  "Vin & Spiritueux": ["vin", "spiritueux", "tequila", "caviste", "winess", "dégustation", "degustation", "cocktail"],
  Shopping: ["shopping", "boutique", "vetement", "vêtement", "mode", "robe", "costume", "azamra"],
  Mariage: ["mariage", "dj", "salle", "photographe", "houppa", "traiteur"],
  Religion: ["religion", "torah", "synagogue", "mikve", "mikvé", "chabbat"],
  Voyages: ["voyage", "marrakech", "hotel", "hôtel", "pessah", "vacances"],
  Sorties: ["sortie", "concert", "soirée", "événement", "evenement", "conference"],
  Sport: ["sport", "padel", "coach", "musculation", "fitness"],
};

type BooleanFilterKey = "terrace" | "openNow" | "delivery" | "takeaway" | "reservation";

const serviceIntentMap: Array<{ key: BooleanFilterKey; words: string[] }> = [
  { key: "terrace", words: concepts.terrasse },
  { key: "delivery", words: concepts.livraison },
  { key: "takeaway", words: concepts.emporter },
  { key: "reservation", words: concepts.reservation },
  { key: "openNow", words: concepts.ouvert },
];

function detectArrondissement(normalized: string) {
  const postal = normalized.match(/\b750([0-2][0-9])\b/)?.[1];
  if (postal) return String(Number(postal));
  const paris = normalized.match(/\bparis\s*(\d{1,2})\b/)?.[1];
  if (paris) return paris;
  const ordinal = normalized.match(/\b(\d{1,2})(e|eme|er)\b/)?.[1];
  return ordinal ?? "";
}

function analyzeQuery(query: string) {
  const { normalized, tokens } = expandQuery(query);
  const intendedCategories = Object.entries(categoryIntents)
    .filter(([, words]) => words.some((word) => normalized.includes(normalizeSearchText(word))))
    .map(([category]) => category);
  const services = serviceIntentMap
    .filter(({ words }) => words.some((word) => normalized.includes(normalizeSearchText(word))))
    .map(({ key }) => key);
  const kosherType = concepts.viande.some((word) => normalized.includes(normalizeSearchText(word)))
    ? "Bassari"
    : concepts.lait.some((word) => normalized.includes(normalizeSearchText(word)))
      ? "Halavi"
      : normalized.includes("parve")
        ? "Parvé"
        : "";
  const arrondissement = detectArrondissement(normalized);
  return { normalized, tokens, intendedCategories, services, kosherType, arrondissement };
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadius = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLng = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function matchesFilters(item: SearchItem, filters: SearchFilters = {}) {
  if (filters.arrondissement && item.location?.arrondissement !== filters.arrondissement) return false;
  if (filters.certification && normalizeSearchText(item.filters?.certification ?? "").includes(normalizeSearchText(filters.certification)) === false) return false;
  if (filters.kosherType && normalizeSearchText(item.filters?.kosherType ?? "").includes(normalizeSearchText(filters.kosherType)) === false) return false;
  if (filters.terrace && item.filters?.terrace !== true) return false;
  if (filters.openNow && item.filters?.openNow !== true) return false;
  if (filters.delivery && item.filters?.delivery !== true) return false;
  if (filters.takeaway && item.filters?.takeaway !== true) return false;
  if (filters.reservation && item.filters?.reservation !== true) return false;
  if (filters.price && item.filters?.price !== filters.price) return false;
  return true;
}

export function searchItems(items: SearchItem[], query: string, options: SearchOptions = {}) {
  if (query.trim().length < 2) return [];
  const analysis = analyzeQuery(query);
  const filters = { ...options.filters };
  if (!filters.arrondissement && analysis.arrondissement) filters.arrondissement = analysis.arrondissement;
  if (!filters.kosherType && analysis.kosherType) filters.kosherType = analysis.kosherType;

  return items.filter((item) => matchesFilters(item, filters)).map((item) => {
    const title = normalizeSearchText(item.title);
    const category = normalizeSearchText(item.category);
    const subcategory = normalizeSearchText(item.subcategory ?? "");
    const keywords = item.keywords.map(normalizeSearchText);
    const customerSearches = (item.customerSearches ?? item.keywords).map(normalizeSearchText);
    const corpus = normalizeSearchText(`${item.title} ${item.subtitle} ${item.category} ${item.subcategory ?? ""} ${item.keywords.join(" ")} ${customerSearches.join(" ")}`);
    let intentScore = 0;
    let customerScore = 0;
    let locationScore = 0;
    let serviceScore = 0;

    if (title === analysis.normalized) customerScore += 180;
    else if (title.includes(analysis.normalized)) customerScore += 95;
    else if (customerSearches.some((keyword) => keyword.includes(analysis.normalized))) customerScore += 78;
    else if (corpus.includes(analysis.normalized)) customerScore += 45;

    analysis.intendedCategories.forEach((intended) => {
      const normalizedIntent = normalizeSearchText(intended);
      if (category.includes(normalizedIntent) || subcategory.includes(normalizedIntent)) intentScore += 45;
      else if (corpus.includes(normalizedIntent)) intentScore += 18;
    });

    analysis.tokens.forEach((token) => {
      if (title.includes(token)) customerScore += 18;
      else if (category.includes(token)) intentScore += 12;
      else if (subcategory.includes(token)) intentScore += 10;
      if (customerSearches.some((keyword) => keyword === token)) customerScore += 20;
      else if (customerSearches.some((keyword) => keyword.includes(token))) customerScore += 12;
      else if (keywords.some((keyword) => keyword === token)) customerScore += 8;
      else if (keywords.some((keyword) => keyword.includes(token))) customerScore += 5;
      else if (corpus.includes(token)) customerScore += 2;
    });

    if (analysis.arrondissement && item.location?.arrondissement === analysis.arrondissement) locationScore += 42;
    if (analysis.arrondissement && item.location?.postalCode?.endsWith(analysis.arrondissement.padStart(2, "0"))) locationScore += 16;
    if (options.userLocation && item.location?.latitude && item.location.longitude) {
      const km = distanceKm(options.userLocation, { latitude: item.location.latitude, longitude: item.location.longitude });
      locationScore += Math.max(0, 35 - km * 5);
    }

    analysis.services.forEach((service) => {
      if (item.filters?.[service] === true) serviceScore += 18;
    });

    const matchedOriginalTokens = normalizeSearchText(query).split(" ").filter((token) => token.length > 1 && corpus.includes(token)).length;
    customerScore += matchedOriginalTokens * 12;

    const relevance = intentScore + customerScore + locationScore + serviceScore;
    const sponsorBoost = relevance > 35 && item.ranking?.sponsored ? 10 : 0;
    const popularity = Math.min(15, (item.ranking?.popularity ?? 0) / 12);
    const favorites = Math.min(12, (item.ranking?.favorites ?? 0) / 8);
    const reviews = Math.min(10, (item.ranking?.reviewCount ?? 0) / 4);
    const score = relevance + sponsorBoost + popularity + favorites + reviews;
    return { item, score };
  }).filter(({ score }) => score > 18).sort((a, b) => b.score - a.score).slice(0, 10).map(({ item }) => item);
}

const suggestionPool = [
  "Entrecôte",
  "Restaurant viande",
  "Entrecôte Paris",
  "Restaurant grill",
  "Avocado toast Paris 17",
  "Brunch casher ouvert dimanche",
  "Restaurant bassari avec terrasse",
  "Tequila casher",
  "Dégustation de vin sur Paris",
  "DJ mariage Paris",
  "Mikvé homme Paris",
  "Traiteur Chabbat Paris",
  "Voyage casher à Marrakech",
  "Boutique vêtements juifs",
];

export function getSearchSuggestions(query: string) {
  const normalized = normalizeSearchText(query);
  if (normalized.length < 2) return [];
  const { tokens } = expandQuery(query);
  const suggestions = suggestionPool.filter((suggestion) => {
    const normalizedSuggestion = normalizeSearchText(suggestion);
    return normalizedSuggestion.includes(normalized) || tokens.some((token) => normalizedSuggestion.includes(token));
  });
  return suggestions.slice(0, 5);
}
