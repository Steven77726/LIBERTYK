"use client";

import { searchIndex } from "@/data/search-index";
import { normalizeSearchText, searchItems, type SearchItem } from "@/lib/search-engine";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { EstablishmentRecord } from "@/lib/supabase/establishments-repository";

export type SearchMatch = {
  field: "name" | "alias" | "tag" | "rubric" | "subrubric" | "city" | "district" | "description";
  label: string;
};

export type EstablishmentSearchResult = SearchItem & {
  score: number;
  matches: SearchMatch[];
  highlight: string;
  establishment?: EstablishmentRecord;
};

type EstablishmentSearchRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  arrondissement: string | null;
  district: string | null;
  postal_code: string | null;
  nearest_metro_name?: string | null;
  nearest_metro_line?: string | null;
  certification: string | null;
  kosher_type: string | null;
  average_price: string | null;
  country: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  website: string | null;
  reservation_url: string | null;
  reservation_target: string | null;
  hours: Record<string, unknown> | null;
  amenities: Record<string, unknown> | null;
  services: Record<string, unknown> | null;
  field_visibility: Record<string, boolean> | null;
  reservation_enabled: boolean | null;
  latitude: number | null;
  longitude: number | null;
  customer_searches: string[] | null;
  visible_tags: string[] | null;
  sponsorship: "standard" | "sponsored" | "partner" | "liberty_favorite";
  sponsor_priority: number | null;
  display_order: number | null;
  rubric_id?: string | null;
  subrubric_id?: string | null;
  rubrics?: { name: string; slug: string } | null;
  subrubrics?: { name: string; slug: string } | null;
  professional_services?: Array<{
    price: number | string | null;
    price_from: boolean | null;
    duration_minutes: number | null;
    at_home: boolean | null;
    on_site: boolean | null;
    active: boolean | null;
    beauty_services?: {
      id: string;
      category_id: string;
      name: string;
      slug: string;
      beauty_categories?: { name: string; slug: string } | null;
    } | null;
  }> | null;
};

type PhotoRow = {
  entity_id: string;
  url: string;
  alt: string | null;
  display_order: number;
};

type TagRow = {
  id: string;
  external_id: string | null;
  label: string;
};

type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  is_dormant?: boolean | null;
};

type TaxonomyMatch = {
  rubricIds: string[];
  subrubricIds: string[];
};

type BeautyMatch = {
  professionalIds: string[];
};

const searchableColumns = [
  "slug",
  "name",
  "short_description",
  "description",
  "address",
  "city",
  "arrondissement",
  "district",
  "postal_code",
  "certification",
  "kosher_type",
];

const routeOverrides: Record<string, string> = {
  "food/restaurants": "/food/restaurants",
  "food/brunch": "/food/brunch",
};

const establishmentSelect = `
  id,slug,name,short_description,description,address,city,arrondissement,district,postal_code,nearest_metro_name,nearest_metro_line,
  country,phone,whatsapp,email,instagram,website,reservation_url,reservation_target,hours,amenities,services,
  certification,kosher_type,average_price,latitude,longitude,customer_searches,visible_tags,field_visibility,reservation_enabled,
  sponsorship,sponsor_priority,display_order,
  rubrics(name,slug),
  subrubrics(name,slug),
  professional_services(price,price_from,duration_minutes,at_home,on_site,active,beauty_services(id,category_id,name,slug,beauty_categories(name,slug)))
`;

const synonymMap: Record<string, string[]> = {
  abitol: ["abitbol", "david abitbol", "trompe", "oeil"],
  abitbol: ["abitol", "david abitbol", "trompe", "oeil", "patisserie"],
  trompe: ["trompe l'oeil", "trompe oeil", "trompe-l'œil", "abitbol", "david abitbol", "patisserie"],
  oeil: ["trompe l'oeil", "trompe oeil", "trompe-l'œil", "abitbol", "david abitbol"],
  trompeloeil: ["trompe l'oeil", "trompe oeil", "abitbol", "david abitbol", "patisserie"],
  resto: ["restaurant"],
  restaurant: ["resto", "restaurants"],
  bakery: ["boulangerie", "boulangeries", "pain"],
  boulangerie: ["bakery", "boulangeries", "pain"],
  boulangeries: ["bakery", "boulangerie", "pain"],
  pastry: ["patisserie", "patisseries", "gateau", "gateaux"],
  patisserie: ["pastry", "patisseries", "gateau", "gateaux", "trompe oeil", "abitbol"],
  patisseries: ["pastry", "patisserie", "gateau", "gateaux", "trompe oeil", "abitbol"],
  wine: ["vin", "caviste", "spiritueux"],
  vin: ["wine", "caviste", "spiritueux"],
  bar: ["cocktail", "cocktails", "vin", "spiritueux", "caviste"],
  travel: ["voyage"],
  voyage: ["travel"],
  hotel: ["hotels", "voyage", "sejour"],
  kosher: ["casher", "cacher", "kasher"],
  casher: ["kosher", "cacher", "kasher"],
  cacher: ["casher", "kosher", "kasher"],
  kasher: ["casher", "cacher", "kosher"],
  bassari: ["viande", "bassari", "steak", "grill", "grillades", "meat", "carné", "carne", "burger", "burgers", "boucher"],
  viande: ["bassari", "viande", "steak", "grill", "grillades", "meat", "carné", "carne", "burger", "burgers", "boucher"],
  halavi: ["lait", "halavi", "fromage", "pizza", "pizzas", "dairy", "pates", "pâtes"],
  lait: ["halavi", "lait", "fromage", "pizza", "pizzas", "dairy"],
  parve: ["parve", "parvé"],
  parvé: ["parve", "parvé"],
  steak: ["grill", "viande", "bassari", "grillades"],
  grill: ["grillades", "viande", "bassari", "steak"],
  grillades: ["grill", "viande", "bassari", "steak"],
  burger: ["burgers", "viande", "bassari"],
  burgers: ["burger", "viande", "bassari"],
  brunch: ["avocado", "pancakes", "petit dejeuner"],
  coiffure: ["brushing", "coupe", "coiffure mariage"],
  brushing: ["coiffure", "cheveux"],
  maquillage: ["makeup", "make-up", "mariee", "soiree"],
  lissage: ["coiffure", "cheveux", "bresilien"],
  massage: ["soin", "soins", "detente", "domicile"],
  onglerie: ["manucure", "ongles", "semi permanent"],
  epilation: ["soins femme", "beaute"],
  domicile: ["a domicile", "chez moi"],
  tequila: ["spiritueux", "vin", "caviste"],
  tequilla: ["tequila", "spiritueux", "vin", "caviste"],
  avocato: ["avocado"],
  "1ee": ["17e", "17", "75017"],
};

const queryStopWords = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "je",
  "la",
  "le",
  "les",
  "me",
  "mon",
  "ou",
  "pour",
  "pres",
  "proche",
  "qui",
  "sur",
  "trouve",
  "trouver",
  "un",
  "une",
]);

let visibleTagsCache: { expiresAt: number; rows: TagRow[] } | null = null;
let taxonomyCache: { expiresAt: number; rubrics: TaxonomyRow[]; subrubrics: TaxonomyRow[] } | null = null;
const DICTIONARY_CACHE_TTL_MS = 5 * 60 * 1000;

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getQueryTokens(query: string) {
  const normalized = normalizeSearchText(query);
  const tokens = normalized.split(" ").filter((token) => token.length > 1);
  return unique(tokens.flatMap((token) => [token, ...(synonymMap[token] ?? [])])).slice(0, 10);
}

function expandDistrictToken(token: string) {
  if (token === "1ee") return ["17e", "17", "75017", "paris 17"];

  const postal = token.match(/^750([0-2][0-9])$/)?.[1];
  const ordinal = token.match(/^(\d{1,2})(e|eme|er)?$/)?.[1];
  const district = postal ? String(Number(postal)) : ordinal;
  if (!district) return [];

  const padded = district.padStart(2, "0");
  return unique([district, `${district}e`, `${district}eme`, `750${padded}`, `paris ${district}`]);
}

function getRequiredTokenGroups(query: string) {
  const normalized = normalizeSearchText(query);
  return unique(normalized.split(" ").filter((token) => token.length > 1 && !queryStopWords.has(token)))
    .map((token) => unique([token, ...(synonymMap[token] ?? []), ...expandDistrictToken(token)]))
    .slice(0, 6);
}

function toPostgrestArray(values: string[]) {
  return `{${unique(values).map((value) => `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`).join(",")}}`;
}

function isNearTokenMatch(word: string, token: string) {
  if (token.length < 4 || word.length < 4 || Math.abs(word.length - token.length) > 1) return false;

  let previous = Array.from({ length: token.length + 1 }, (_, index) => index);
  for (let rowIndex = 1; rowIndex <= word.length; rowIndex += 1) {
    const current = [rowIndex];
    let bestInRow = current[0];
    for (let columnIndex = 1; columnIndex <= token.length; columnIndex += 1) {
      const cost = word[rowIndex - 1] === token[columnIndex - 1] ? 0 : 1;
      const value = Math.min(
        previous[columnIndex] + 1,
        current[columnIndex - 1] + 1,
        previous[columnIndex - 1] + cost,
      );
      current[columnIndex] = value;
      bestInRow = Math.min(bestInRow, value);
    }
    if (bestInRow > 1) return false;
    previous = current;
  }

  return previous[token.length] <= 1;
}

function tokenMatchesText(normalizedText: string, token: string) {
  if (!normalizedText || !token) return false;
  if (normalizedText.includes(token)) return true;
  return normalizedText.split(" ").some((word) => isNearTokenMatch(word, token));
}

function getHref(row: EstablishmentSearchRow) {
  const rubricSlug = row.rubrics?.slug ?? "food";
  const subrubricSlug = row.subrubrics?.slug ?? "";
  const routeKey = [rubricSlug, subrubricSlug].filter(Boolean).join("/");
  const base = routeOverrides[routeKey] ?? `/${[rubricSlug, subrubricSlug].filter(Boolean).join("/")}`;
  return `${base}#${row.slug}`;
}

function highlightText(value: string, tokens: string[]) {
  const normalizedValue = normalizeSearchText(value);
  const token = tokens.find((item) => tokenMatchesText(normalizedValue, item));
  if (!token) return escapeHtml(value);
  const index = normalizedValue.indexOf(token);
  if (index < 0) return escapeHtml(value);
  return `${escapeHtml(value.slice(0, index))}<mark>${escapeHtml(value.slice(index, index + token.length))}</mark>${escapeHtml(value.slice(index + token.length))}`;
}

function parseJsonHours(value: Record<string, unknown> | null) {
  if (!value || !Object.keys(value).length) return "";
  return Object.entries(value)
    .map(([day, hours]) => `${day}: ${String(hours ?? "")}`)
    .join("\n");
}

function boolFromJson(source: Record<string, unknown> | null | undefined, key: string) {
  return source?.[key] === true;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resolveTagLabels(values: string[] | null | undefined, tagMap: Map<string, string>) {
  return unique((values ?? []).map((value) => tagMap.get(value) ?? value));
}

function tagRowsToMap(rows: TagRow[]) {
  const map = new Map<string, string>();
  rows.forEach((tag) => {
    map.set(tag.id, tag.label);
    if (tag.external_id) map.set(tag.external_id, tag.label);
    map.set(tag.label, tag.label);
  });
  return map;
}

function getMatches(row: EstablishmentSearchRow, tagLabels: string[], tokens: string[], normalizedQuery: string): SearchMatch[] {
  const beautyText = (row.professional_services ?? []).map((item) => [
    item.beauty_services?.name ?? "",
    item.beauty_services?.slug ?? "",
    item.beauty_services?.beauty_categories?.name ?? "",
    item.beauty_services?.beauty_categories?.slug ?? "",
    item.at_home ? "à domicile domicile" : "",
    item.on_site ? "sur place" : "",
  ].join(" ")).join(" ");
  const checks: Array<[SearchMatch["field"], string, number]> = [
    ["name", row.name, 100],
    ["alias", (row.customer_searches ?? []).join(" "), 90],
    ["tag", tagLabels.join(" "), 80],
    ["rubric", row.rubrics?.name ?? "", 70],
    ["subrubric", row.subrubrics?.name ?? "", 65],
    ["city", row.city ?? "", 55],
    ["district", `${row.district ?? ""} ${row.arrondissement ?? ""} ${row.postal_code ?? ""}`, 50],
    ["tag", beautyText, 75],
    ["description", `${row.short_description ?? ""} ${row.description ?? ""}`, 30],
  ];
  return checks.flatMap(([field, value]) => {
    const normalized = normalizeSearchText(value);
    if (!normalized) return [];
    if (normalizedQuery.length > 1 && normalized.includes(normalizedQuery)) return [{ field, label: value.split(/\s+/).slice(0, 6).join(" ") }];
    const token = tokens.find((item) => tokenMatchesText(normalized, item));
    return token ? [{ field, label: token }] : [];
  });
}

function scoreRow(row: EstablishmentSearchRow, tagLabels: string[], tokens: string[], normalizedQuery: string) {
  const beautyText = (row.professional_services ?? []).map((item) => [
    item.beauty_services?.name ?? "",
    item.beauty_services?.beauty_categories?.name ?? "",
    item.at_home ? "à domicile domicile" : "",
    item.on_site ? "sur place" : "",
  ].join(" ")).join(" ");
  const fields: Array<[string, number]> = [
    [row.name, 120],
    [(row.customer_searches ?? []).join(" "), 90],
    [tagLabels.join(" "), 80],
    [row.subrubrics?.name ?? "", 62],
    [row.rubrics?.name ?? "", 55],
    [row.city ?? "", 42],
    [`${row.district ?? ""} ${row.arrondissement ?? ""} ${row.postal_code ?? ""}`, 40],
    [beautyText, 78],
    [`${row.short_description ?? ""} ${row.description ?? ""}`, 22],
  ];
  let score = 0;
  fields.forEach(([value, weight]) => {
    const normalized = normalizeSearchText(value);
    if (!normalized) return;
    if (normalized === normalizedQuery) score += weight * 3.2;
    else if (normalized.startsWith(normalizedQuery) && normalizedQuery.length > 1) score += weight * 2.1;
    else if (normalized.includes(normalizedQuery) && normalizedQuery.length > 1) score += weight * 1.35;
    const words = normalized.split(" ");
    tokens.forEach((token) => {
      if (words.includes(token)) score += weight * 0.42;
      else if (normalized.includes(token)) score += weight * 0.22;
      else if (words.some((word) => isNearTokenMatch(word, token))) score += weight * 0.18;
    });
  });
  const allCorpus = normalizeSearchText([
    row.slug,
    row.name,
    row.short_description ?? "",
    row.description ?? "",
    row.address ?? "",
    row.city ?? "",
    row.district ?? "",
    row.arrondissement ?? "",
    row.postal_code ?? "",
    row.rubrics?.name ?? "",
    row.subrubrics?.name ?? "",
    tagLabels.join(" "),
    (row.customer_searches ?? []).join(" "),
    beautyText,
  ].join(" "));
  const matchedTokens = tokens.filter((token) => tokenMatchesText(allCorpus, token)).length;
  score += matchedTokens * 12;
  if (score > 35 && row.sponsorship !== "standard") score += row.sponsorship === "partner" || row.sponsorship === "liberty_favorite" ? 8 : 5;
  score += Math.max(0, 8 - (row.display_order ?? 99) * 0.05);
  return score;
}

function getRowCorpus(row: EstablishmentSearchRow, tagLabels: string[]) {
  return normalizeSearchText([
    row.slug,
    row.name,
    row.short_description ?? "",
    row.description ?? "",
    row.address ?? "",
    row.city ?? "",
    row.district ?? "",
    row.arrondissement ?? "",
    row.postal_code ?? "",
    row.rubrics?.name ?? "",
    row.rubrics?.slug ?? "",
    row.subrubrics?.name ?? "",
    row.subrubrics?.slug ?? "",
    tagLabels.join(" "),
    (row.customer_searches ?? []).join(" "),
    (row.professional_services ?? []).map((item) => `${item.beauty_services?.name ?? ""} ${item.beauty_services?.slug ?? ""} ${item.beauty_services?.beauty_categories?.name ?? ""} ${item.beauty_services?.beauty_categories?.slug ?? ""} ${item.at_home ? "domicile à domicile" : ""} ${item.on_site ? "sur place" : ""}`).join(" "),
  ].join(" "));
}

function requiredTokenMatchesCorpus(corpus: string, token: string) {
  if (!/\d/.test(token)) return tokenMatchesText(corpus, token);

  const words = corpus.split(" ").filter(Boolean);
  return words.some((word) => word === token);
}

function countMatchedRequiredGroups(corpus: string, requiredGroups: string[][]) {
  return requiredGroups.filter((group) => group.some((token) => requiredTokenMatchesCorpus(corpus, token))).length;
}

async function getPhotoMap(entityIds: string[]) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !entityIds.length) return new Map<string, PhotoRow[]>();

  const { data, error } = await supabase
    .from("photos")
    .select("entity_id,url,alt,display_order")
    .eq("entity_type", "establishment")
    .in("entity_id", entityIds)
    .order("display_order", { ascending: true })
    .returns<PhotoRow[]>();

  if (error) return new Map<string, PhotoRow[]>();

  const map = new Map<string, PhotoRow[]>();
  (data ?? []).forEach((photo) => {
    const list = map.get(photo.entity_id) ?? [];
    list.push(photo);
    map.set(photo.entity_id, list);
  });
  return map;
}

function rowToEstablishment(row: EstablishmentSearchRow, image: string, tagLabels: string[], photos: PhotoRow[] = []): EstablishmentRecord {
  const sponsorshipLevel = row.sponsorship === "partner" || row.sponsorship === "liberty_favorite"
    ? "Premium"
    : row.sponsorship === "sponsored"
      ? "Featured"
      : "Standard";
  const gallery = [...photos].sort((a, b) => a.display_order - b.display_order);
  const galleryUrls = gallery.map((photo) => photo.url).filter(Boolean);

  return {
    id: row.id,
    rubricId: row.rubrics?.slug ?? "food",
    subrubricId: row.subrubrics?.slug ?? "",
    mainPhoto: image,
    photos: galleryUrls.slice(1),
    photoAlts: gallery.slice(1).map((photo) => photo.alt ?? row.name),
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? "",
    description: row.description ?? row.short_description ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    arrondissement: row.district ?? row.arrondissement ?? "",
    postalCode: row.postal_code ?? "",
    country: row.country ?? "France",
    nearestMetroName: row.nearest_metro_name ?? "",
    nearestMetroLine: row.nearest_metro_line ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    instagram: row.instagram ?? "",
    website: row.website ?? "",
    hours: parseJsonHours(row.hours),
    terrace: boolFromJson(row.amenities, "terrace"),
    delivery: boolFromJson(row.services, "delivery"),
    takeaway: boolFromJson(row.services, "takeaway"),
    reservation: row.reservation_enabled === true || boolFromJson(row.services, "reservation"),
    privateHire: boolFromJson(row.amenities, "privateHire"),
    certification: row.certification ?? "",
    kosherType: (row.kosher_type || "À compléter") as EstablishmentRecord["kosherType"],
    averagePrice: row.average_price ?? "",
    latitude: row.latitude === null ? "" : String(row.latitude),
    longitude: row.longitude === null ? "" : String(row.longitude),
    status: "Publié",
    visible: true,
    sponsorshipLevel,
    sponsored: sponsorshipLevel !== "Standard",
    sponsorPriority: row.sponsor_priority ?? 0,
    sponsorDuration: "",
    reservationTarget: row.reservation_url ?? row.reservation_target ?? "",
    cuisineTypes: [],
    order: row.display_order ?? 0,
    customerSearches: row.customer_searches ?? [],
    visibleTagIds: tagLabels,
    fieldVisibility: row.field_visibility ?? undefined,
    beautyServices: (row.professional_services ?? []).filter((item) => item.active !== false).map((item, index) => ({
      id: `${row.id}-${item.beauty_services?.id ?? index}`,
      professionalId: row.id,
      serviceId: item.beauty_services?.id ?? "",
      categoryId: item.beauty_services?.category_id,
      categoryName: item.beauty_services?.beauty_categories?.name,
      categorySlug: item.beauty_services?.beauty_categories?.slug,
      serviceName: item.beauty_services?.name,
      serviceSlug: item.beauty_services?.slug,
      price: item.price === null ? null : Number(item.price),
      priceFrom: item.price_from === true,
      durationMinutes: item.duration_minutes,
      atHome: item.at_home === true,
      onSite: item.on_site !== false,
      active: item.active !== false,
      displayOrder: index + 1,
    })),
  };
}

function rowToResult(row: EstablishmentSearchRow, image: string, tagLabels: string[], score: number, matches: SearchMatch[], tokens: string[], photos: PhotoRow[] = []): EstablishmentSearchResult {
  const category = row.rubrics?.name ?? "Établissement";
  const subcategory = row.subrubrics?.name ?? undefined;
  return {
    id: `establishment-${row.id}`,
    title: row.name,
    subtitle: [subcategory, row.address, row.city].filter(Boolean).join(" · "),
    category,
    subcategory,
    href: getHref(row),
    image: image || "/images/food/restaurants-khan.jpg",
    keywords: unique([
      row.name,
      row.slug,
      row.short_description ?? "",
      row.description ?? "",
      row.address ?? "",
      row.city ?? "",
      row.district ?? "",
      row.arrondissement ?? "",
      row.postal_code ?? "",
      row.rubrics?.name ?? "",
      row.subrubrics?.name ?? "",
      ...tagLabels,
      ...(row.customer_searches ?? []),
      ...(row.professional_services ?? []).flatMap((item) => [item.beauty_services?.name ?? "", item.beauty_services?.beauty_categories?.name ?? ""]),
    ]),
    customerSearches: row.customer_searches ?? [],
    location: {
      city: row.city ?? undefined,
      arrondissement: (row.district ?? row.arrondissement ?? "").replace(/\D/g, "") || undefined,
      postalCode: row.postal_code ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
    },
    filters: {
      certification: row.certification ?? undefined,
      kosherType: row.kosher_type ?? undefined,
      price: row.average_price ?? undefined,
    },
    ranking: {
      sponsored: row.sponsorship !== "standard",
      popularity: Math.max(0, 100 - (row.display_order ?? 80)),
    },
    score,
    matches,
    highlight: highlightText(row.name, tokens),
    establishment: rowToEstablishment(row, image || "/images/food/restaurants-khan.jpg", tagLabels, photos),
  };
}

async function getTagRows() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  if (visibleTagsCache && visibleTagsCache.expiresAt > Date.now()) return visibleTagsCache.rows;
  const { data } = await supabase
    .from("visible_tags")
    .select("id,external_id,label")
    .eq("status", "published")
    .is("deleted_at", null)
    .returns<TagRow[]>();
  const rows = data ?? [];
  visibleTagsCache = { expiresAt: Date.now() + DICTIONARY_CACHE_TTL_MS, rows };
  return rows;
}

async function getTaxonomyRows() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { rubrics: [], subrubrics: [] };
  if (taxonomyCache && taxonomyCache.expiresAt > Date.now()) {
    return { rubrics: taxonomyCache.rubrics, subrubrics: taxonomyCache.subrubrics };
  }
  const [{ data: rubrics, error: rError }, { data: subrubrics }] = await Promise.all([
    supabase
      .from("rubrics")
      .select("id,name,slug,is_dormant")
      .eq("status", "published")
      .is("deleted_at", null)
      .returns<TaxonomyRow[]>(),
    supabase
      .from("subrubrics")
      .select("id,name,slug")
      .eq("status", "published")
      .is("deleted_at", null)
      .returns<TaxonomyRow[]>(),
  ]);

  let finalRubrics = rubrics ?? [];
  if (rError && (rError as { code?: string }).code === "42703") {
    const { data: fbRubrics } = await supabase
      .from("rubrics")
      .select("id,name,slug")
      .eq("status", "published")
      .is("deleted_at", null)
      .returns<TaxonomyRow[]>();
    finalRubrics = fbRubrics ?? [];
  }

  const next = {
    expiresAt: Date.now() + DICTIONARY_CACHE_TTL_MS,
    rubrics: finalRubrics,
    subrubrics: subrubrics ?? [],
  };
  taxonomyCache = next;
  return { rubrics: next.rubrics, subrubrics: next.subrubrics };
}

async function getTaxonomyMatches(tokens: string[], normalizedQuery: string): Promise<TaxonomyMatch> {
  if (!tokens.length) return { rubricIds: [], subrubricIds: [] };
  const { rubrics, subrubrics } = await getTaxonomyRows();

  return {
    rubricIds: unique(rubrics
      .filter((rubric) => {
        const normalized = normalizeSearchText(`${rubric.name} ${rubric.slug}`);
        return normalized.includes(normalizedQuery) || tokens.some((token) => tokenMatchesText(normalized, token));
      })
      .map((rubric) => rubric.id)),
    subrubricIds: unique(subrubrics
      .filter((subrubric) => {
        const normalized = normalizeSearchText(`${subrubric.name} ${subrubric.slug}`);
        return normalized.includes(normalizedQuery) || tokens.some((token) => tokenMatchesText(normalized, token));
      })
      .map((subrubric) => subrubric.id)),
  };
}

async function getBeautyMatches(tokens: string[], normalizedQuery: string): Promise<BeautyMatch> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !tokens.length) return { professionalIds: [] };

  const { data: services } = await supabase
    .from("beauty_services")
    .select("id,name,slug,beauty_categories(name,slug)")
    .eq("active", true)
    .limit(200);

  const serviceIds = unique(
    ((services as Array<{ id: string; name: string; slug: string; beauty_categories?: { name: string; slug: string } | null }> | null) ?? [])
      .filter((service) => {
        const normalized = normalizeSearchText(`${service.name} ${service.slug} ${service.beauty_categories?.name ?? ""} ${service.beauty_categories?.slug ?? ""}`);
        return normalized.includes(normalizedQuery) || tokens.some((token) => tokenMatchesText(normalized, token));
      })
      .map((service) => service.id),
  );

  const needsAtHome = tokens.some((token) => token === "domicile" || token === "chez moi");
  const needsOnSite = tokens.some((token) => token === "place" || token === "sur place");
  let query = supabase.from("professional_services").select("professional_id").eq("active", true);
  if (serviceIds.length) query = query.in("service_id", serviceIds);
  if (needsAtHome) query = query.eq("at_home", true);
  if (needsOnSite) query = query.eq("on_site", true);
  if (!serviceIds.length && !needsAtHome && !needsOnSite) return { professionalIds: [] };

  const { data } = await query.limit(100).returns<Array<{ professional_id: string }>>();
  return { professionalIds: unique((data ?? []).map((item) => item.professional_id)) };
}

function fallbackSearch(query: string): EstablishmentSearchResult[] {
  return searchItems(searchIndex, query).map((item, index) => ({
    ...item,
    score: 1_000 - index,
    matches: [],
    highlight: item.title,
  }));
}

export async function searchEstablishments(query: string, options: { signal?: AbortSignal; limit?: number } = {}): Promise<EstablishmentSearchResult[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fallbackSearch(query);

  const normalizedQuery = normalizeSearchText(query);
  const tokens = getQueryTokens(query);
  const requiredGroups = getRequiredTokenGroups(query);
  const [tagRows, taxonomyMatches, beautyMatches] = tokens.length
    ? await Promise.all([getTagRows(), getTaxonomyMatches(tokens, normalizedQuery), getBeautyMatches(tokens, normalizedQuery)])
    : [[], { rubricIds: [], subrubricIds: [] } satisfies TaxonomyMatch, { professionalIds: [] } satisfies BeautyMatch];
  const tagSearchValues = tagRows.flatMap((tag) => {
    const normalizedTag = normalizeSearchText([tag.label, tag.external_id ?? ""].join(" "));
    const matches = normalizedQuery.length > 1 && normalizedTag.includes(normalizedQuery)
      ? true
      : tokens.some((token) => tokenMatchesText(normalizedTag, token));
    return matches ? [tag.id, tag.external_id, tag.label].filter(Boolean) as string[] : [];
  });
  const arraySearchValues = unique([query.trim(), normalizedQuery, ...tokens, ...tagSearchValues]).filter((value) => value.length > 1);
  let request = supabase
    .from("establishments")
    .select(establishmentSelect)
    .eq("status", "published")
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .limit(normalizedQuery ? 100 : 20);

  if (tokens.length) {
    const scalarFilters = tokens.flatMap((token) => searchableColumns.map((column) => `${column}.ilike.%${token}%`));
    const arrayFilters = arraySearchValues.length
      ? [
          `customer_searches.ov.${toPostgrestArray(arraySearchValues)}`,
          `visible_tags.ov.${toPostgrestArray(arraySearchValues)}`,
        ]
      : [];
    const taxonomyFilters = [
      taxonomyMatches.rubricIds.length ? `rubric_id.in.(${taxonomyMatches.rubricIds.join(",")})` : "",
      taxonomyMatches.subrubricIds.length ? `subrubric_id.in.(${taxonomyMatches.subrubricIds.join(",")})` : "",
      beautyMatches.professionalIds.length ? `id.in.(${beautyMatches.professionalIds.join(",")})` : "",
    ].filter(Boolean);
    request = request.or([...scalarFilters, ...arrayFilters, ...taxonomyFilters].join(","));
  }

  if (options.signal) request = request.abortSignal(options.signal);

  const { data, error } = await request.returns<EstablishmentSearchRow[]>();
  const rawRows = error ? [] : data ?? [];
  if (error) return fallbackSearch(query);

  const { rubrics } = await getTaxonomyRows();
  const dormantRubricIds = new Set(
    rubrics
      .filter((r) => r.is_dormant === true)
      .flatMap((r) => [r.id, r.slug, `rubric-${r.slug}`].filter(Boolean))
  );

  const rows = dormantRubricIds.size > 0
    ? rawRows.filter((row) => {
        const id = row.rubric_id ?? "";
        const slug = row.rubrics?.slug ?? "";
        return (!id || !dormantRubricIds.has(id)) && (!slug || !dormantRubricIds.has(slug));
      })
    : rawRows;

  if (!normalizedQuery) {
    const tagMap = tagRowsToMap(await getTagRows());
    const photoMap = await getPhotoMap(rows.map((row) => row.id));
    return rows.map((row, index) => {
      const tags = resolveTagLabels(row.visible_tags, tagMap);
      const photos = photoMap.get(row.id) ?? [];
      const image = photos[0]?.url || "/images/food/restaurants-khan.jpg";
      return rowToResult(row, image, tags, 1_000 - index, [], tokens, photos);
    });
  }

  const tagMap = tagRowsToMap(tagRows);
  const photoMap = await getPhotoMap(rows.map((row) => row.id));
  const scoredResults = rows
    .map((row) => {
      const tags = resolveTagLabels(row.visible_tags, tagMap);
      const photos = photoMap.get(row.id) ?? [];
      const image = photos[0]?.url || "/images/food/restaurants-khan.jpg";
      const matches = getMatches(row, tags, tokens, normalizedQuery);
      const corpus = getRowCorpus(row, tags);
      const matchedRequiredGroups = countMatchedRequiredGroups(corpus, requiredGroups);
      const allRequiredGroupsMatched = requiredGroups.length > 1 && matchedRequiredGroups === requiredGroups.length;
      const score = scoreRow(row, tags, tokens, normalizedQuery)
        + matchedRequiredGroups * 30
        + (allRequiredGroupsMatched ? 90 : 0);
      return {
        result: rowToResult(row, image, tags, score, matches, tokens, photos),
        allRequiredGroupsMatched,
      };
    })
    .filter(({ result }) => result.score > 12)
    .sort((a, b) => b.result.score - a.result.score)
    .filter((entry, index, list) => list.findIndex((item) => item.result.href === entry.result.href) === index);

  const shouldRequireAllGroups = requiredGroups.length > 1 && scoredResults.some((entry) => entry.allRequiredGroupsMatched);
  const primaryResults = scoredResults
    .filter((entry) => !shouldRequireAllGroups || entry.allRequiredGroupsMatched)
    .map((entry) => entry.result);

  const fallbackItems = fallbackSearch(query);
  if (primaryResults.length === 0) {
    return fallbackItems.slice(0, options.limit ?? 50);
  }

  const combined = [...primaryResults];
  for (const fallback of fallbackItems) {
    if (!combined.some((item) => item.href === fallback.href || item.title.toLowerCase() === fallback.title.toLowerCase())) {
      combined.push(fallback);
    }
  }
  return combined.slice(0, options.limit ?? 50);
}
