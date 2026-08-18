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
  rubrics?: { name: string; slug: string } | null;
  subrubrics?: { name: string; slug: string } | null;
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
};

type TaxonomyMatch = {
  rubricIds: string[];
  subrubricIds: string[];
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
  id,slug,name,short_description,description,address,city,arrondissement,district,postal_code,
  country,phone,whatsapp,email,instagram,website,reservation_url,reservation_target,hours,amenities,services,
  certification,kosher_type,average_price,latitude,longitude,customer_searches,visible_tags,field_visibility,reservation_enabled,
  sponsorship,sponsor_priority,display_order,
  rubrics(name,slug),
  subrubrics(name,slug)
`;

const synonymMap: Record<string, string[]> = {
  abitol: ["abitbol"],
  abitbol: ["abitol"],
  resto: ["restaurant"],
  restaurant: ["resto", "restaurants"],
  bakery: ["boulangerie", "boulangeries", "pain"],
  boulangerie: ["bakery", "boulangeries", "pain"],
  boulangeries: ["bakery", "boulangerie", "pain"],
  pastry: ["patisserie", "patisseries", "gateau", "gateaux"],
  patisserie: ["pastry", "patisseries", "gateau", "gateaux"],
  patisseries: ["pastry", "patisserie", "gateau", "gateaux"],
  wine: ["vin", "caviste", "spiritueux"],
  vin: ["wine", "caviste", "spiritueux"],
  bar: ["cocktail", "cocktails", "vin", "spiritueux", "caviste"],
  travel: ["voyage"],
  voyage: ["travel"],
  hotel: ["hotels", "voyage", "sejour"],
  hotels: ["hotel", "voyage", "sejour"],
  kosher: ["casher", "cacher", "kasher"],
  casher: ["kosher", "cacher", "kasher"],
  viande: ["bassari", "steak", "grill"],
  steak: ["grill", "viande", "bassari"],
  brunch: ["avocado", "pancakes"],
  tequila: ["spiritueux", "vin", "caviste"],
  tequilla: ["tequila", "spiritueux", "vin", "caviste"],
  avocato: ["avocado"],
};

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
  const checks: Array<[SearchMatch["field"], string, number]> = [
    ["name", row.name, 100],
    ["alias", (row.customer_searches ?? []).join(" "), 90],
    ["tag", tagLabels.join(" "), 80],
    ["rubric", row.rubrics?.name ?? "", 70],
    ["subrubric", row.subrubrics?.name ?? "", 65],
    ["city", row.city ?? "", 55],
    ["district", `${row.district ?? ""} ${row.arrondissement ?? ""} ${row.postal_code ?? ""}`, 50],
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
  const fields: Array<[string, number]> = [
    [row.name, 120],
    [(row.customer_searches ?? []).join(" "), 90],
    [tagLabels.join(" "), 80],
    [row.subrubrics?.name ?? "", 62],
    [row.rubrics?.name ?? "", 55],
    [row.city ?? "", 42],
    [`${row.district ?? ""} ${row.arrondissement ?? ""} ${row.postal_code ?? ""}`, 40],
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
  ].join(" "));
  const matchedTokens = tokens.filter((token) => tokenMatchesText(allCorpus, token)).length;
  score += matchedTokens * 12;
  if (score > 35 && row.sponsorship !== "standard") score += row.sponsorship === "partner" || row.sponsorship === "liberty_favorite" ? 8 : 5;
  score += Math.max(0, 8 - (row.display_order ?? 99) * 0.05);
  return score;
}

function rowToEstablishment(row: EstablishmentSearchRow, image: string, tagLabels: string[]): EstablishmentRecord {
  const sponsorshipLevel = row.sponsorship === "partner" || row.sponsorship === "liberty_favorite"
    ? "Premium"
    : row.sponsorship === "sponsored"
      ? "Featured"
      : "Standard";

  return {
    id: row.id,
    rubricId: row.rubrics?.slug ?? "food",
    subrubricId: row.subrubrics?.slug ?? "",
    mainPhoto: image,
    photos: [],
    photoAlts: [],
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? "",
    description: row.description ?? row.short_description ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    arrondissement: row.district ?? row.arrondissement ?? "",
    postalCode: row.postal_code ?? "",
    country: row.country ?? "France",
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
  };
}

function rowToResult(row: EstablishmentSearchRow, image: string, tagLabels: string[], score: number, matches: SearchMatch[], tokens: string[]): EstablishmentSearchResult {
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
    establishment: rowToEstablishment(row, image || "/images/food/restaurants-khan.jpg", tagLabels),
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
  const [{ data: rubrics }, { data: subrubrics }] = await Promise.all([
    supabase
      .from("rubrics")
      .select("id,name,slug")
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
  const next = {
    expiresAt: Date.now() + DICTIONARY_CACHE_TTL_MS,
    rubrics: rubrics ?? [],
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

function fallbackSearch(query: string): EstablishmentSearchResult[] {
  return searchItems(searchIndex, query).slice(0, 8).map((item, index) => ({
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
  const [tagRows, taxonomyMatches] = tokens.length
    ? await Promise.all([getTagRows(), getTaxonomyMatches(tokens, normalizedQuery)])
    : [[], { rubricIds: [], subrubricIds: [] } satisfies TaxonomyMatch];
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
    .limit(normalizedQuery ? 36 : 10);

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
    ].filter(Boolean);
    request = request.or([...scalarFilters, ...arrayFilters, ...taxonomyFilters].join(","));
  }

  if (options.signal) request = request.abortSignal(options.signal);

  const { data, error } = await request.returns<EstablishmentSearchRow[]>();
  const rows = error ? [] : data ?? [];
  if (error) return fallbackSearch(query);

  if (!normalizedQuery) {
    const tagMap = tagRowsToMap(await getTagRows());
    return rows.map((row, index) => {
      const tags = resolveTagLabels(row.visible_tags, tagMap);
      return rowToResult(row, "/images/food/restaurants-khan.jpg", tags, 1_000 - index, [], tokens);
    });
  }

  const tagMap = tagRowsToMap(tagRows);
  return rows
    .map((row) => {
      const tags = resolveTagLabels(row.visible_tags, tagMap);
      const matches = getMatches(row, tags, tokens, normalizedQuery);
      const score = scoreRow(row, tags, tokens, normalizedQuery);
      return rowToResult(row, "/images/food/restaurants-khan.jpg", tags, score, matches, tokens);
    })
    .filter((result) => result.score > 12)
    .sort((a, b) => b.score - a.score)
    .filter((result, index, list) => list.findIndex((item) => item.href === result.href) === index)
    .slice(0, options.limit ?? 10);
}
