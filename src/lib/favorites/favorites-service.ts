"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { localEstablishments } from "@/data/establishments";

export type FavoriteRecord = {
  id: string;
  establishmentId: string;
  title: string;
  category: string;
  subcategory: string;
  city: string;
  href: string;
  image: string;
  createdAt: string;
};

type FavoriteEstablishmentRow = {
  id: string;
  external_id: string | null;
  slug: string;
  name: string;
  city: string | null;
  address: string | null;
  display_order: number | null;
  created_at: string | null;
  rubrics?: { name: string; slug: string } | null;
  subrubrics?: { name: string; slug: string } | null;
};

type FavoritePhotoRow = {
  entity_id: string;
  url: string;
  display_order: number;
};

type UserFavoriteRow = {
  establishment_id: string;
  created_at: string;
  establishments: FavoriteEstablishmentRow | null;
};

const LOCAL_FAVORITES_KEY = "liberty-favorites";
const FAVORITES_CHANGED_EVENT = "liberty-favorites-changed";

const routeOverrides: Record<string, string> = {
  "food/restaurants": "/food/restaurants",
  "food/brunch": "/food/brunch",
};

function readLocalFavorites() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_FAVORITES_KEY);
    return raw ? JSON.parse(raw) as string[] : [];
  } catch {
    return [];
  }
}

function writeLocalFavorites(values: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify([...new Set(values)]));
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

function notifyFavoritesChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeEntityId(entityId: string) {
  return entityId
    .replace(/^establishment-/, "")
    .replace(/^restaurant-/, "")
    .replace(/^brunch-/, "")
    .replace(/^wine-/, "")
    .replace(/^shop-/, "");
}

function getHref(row: FavoriteEstablishmentRow) {
  const rubricSlug = row.rubrics?.slug ?? "food";
  const subrubricSlug = row.subrubrics?.slug ?? "";
  const base = routeOverrides[[rubricSlug, subrubricSlug].filter(Boolean).join("/")] ?? `/${[rubricSlug, subrubricSlug].filter(Boolean).join("/")}`;
  return `${base}#${row.slug}`;
}

async function getUserId() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function resolveEstablishmentId(entityId: string) {
  const supabase = getSupabaseBrowserClient();
  const normalized = normalizeEntityId(entityId);
  if (!supabase || !normalized) return null;
  if (isUuid(normalized)) return normalized;

  const { data } = await supabase
    .from("establishments")
    .select("id")
    .or(`external_id.eq.${normalized},slug.eq.${normalized}`)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
}

async function resolveEstablishmentIds(entityIds: string[]) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return new Map<string, string>();

  const normalizedIds = [...new Set(entityIds.map(normalizeEntityId).filter(Boolean))];
  const uuidIds = normalizedIds.filter(isUuid);
  const lookupIds = normalizedIds.filter((id) => !isUuid(id));
  const map = new Map<string, string>();
  uuidIds.forEach((id) => map.set(id, id));

  if (lookupIds.length) {
    const { data } = await supabase
      .from("establishments")
      .select("id,external_id,slug")
      .or(`external_id.in.(${lookupIds.join(",")}),slug.in.(${lookupIds.join(",")})`)
      .returns<Array<{ id: string; external_id: string | null; slug: string }>>();
    (data ?? []).forEach((row) => {
      if (row.external_id) map.set(row.external_id, row.id);
      map.set(row.slug, row.id);
    });
  }

  return map;
}

async function getPhotoMap(ids: string[]) {
  const supabase = getSupabaseBrowserClient();
  const map = new Map<string, string>();
  if (!supabase || !ids.length) return map;
  const { data } = await supabase
    .from("photos")
    .select("entity_id,url,display_order")
    .eq("entity_type", "establishment")
    .in("entity_id", ids)
    .order("display_order", { ascending: true })
    .returns<FavoritePhotoRow[]>();
  (data ?? []).forEach((photo) => {
    if (!map.has(photo.entity_id)) map.set(photo.entity_id, photo.url);
  });
  return map;
}

function rowToFavorite(row: FavoriteEstablishmentRow, createdAt: string, photo = ""): FavoriteRecord {
  return {
    id: `establishment-${row.id}`,
    establishmentId: row.id,
    title: row.name,
    category: row.rubrics?.name ?? "Établissements",
    subcategory: row.subrubrics?.name ?? "",
    city: row.city ?? "",
    href: getHref(row),
    image: photo || "/images/food/restaurants-khan.jpg",
    createdAt,
  };
}

async function listLocalFavoriteRecords(localIds = readLocalFavorites()) {
  const ids = localIds.length ? localIds : ["restaurant-khan", "bloomy-brunch", "wine-winess"];
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    const idMap = await resolveEstablishmentIds(ids);
    const resolvedIds = [...new Set([...idMap.values()])];
    if (resolvedIds.length) {
      const { data } = await supabase
        .from("establishments")
        .select("id,external_id,slug,name,city,address,display_order,created_at,rubrics(name,slug),subrubrics(name,slug)")
        .in("id", resolvedIds)
        .eq("status", "published")
        .eq("is_visible", true)
        .is("deleted_at", null)
        .returns<FavoriteEstablishmentRow[]>();

      if (data && data.length > 0) {
        const photos = await getPhotoMap(data.map((row) => row.id));
        return data.map((row) => rowToFavorite(row, new Date().toISOString(), photos.get(row.id)));
      }
    }
  }

  // Résolution locale directe pour afficher les fiches immédiatement
  const records: FavoriteRecord[] = [];
  for (const rawId of ids) {
    const norm = normalizeEntityId(rawId).toLowerCase();
    const found = localEstablishments.find((e) => {
      const eNorm = normalizeEntityId(e.id).toLowerCase();
      const eSlug = (e.slug || "").toLowerCase();
      const eName = e.name.toLowerCase();
      return eNorm === norm || eSlug === norm || eName === norm || eNorm.includes(norm) || norm.includes(eNorm);
    });

    if (found) {
      records.push({
        id: found.id,
        establishmentId: found.id,
        title: found.name,
        category: found.rubricId === "food" ? "Food" : found.rubricId === "shopping" ? "Shopping" : "Sélection",
        subcategory: found.subrubricId || "Restaurants",
        city: found.city || "Paris",
        href: found.rubricId === "food" ? `/food/restaurants#${found.slug || found.id}` : `/food#${found.slug || found.id}`,
        image: found.mainPhoto || "/images/food/restaurants-khan.jpg",
        createdAt: new Date().toISOString(),
      });
    }
  }

  if (!records.length && localEstablishments.length) {
    for (const found of localEstablishments.slice(0, 3)) {
      records.push({
        id: found.id,
        establishmentId: found.id,
        title: found.name,
        category: "Food",
        subcategory: "Restaurant & Brunch",
        city: found.city || "Paris",
        href: `/food#${found.slug || found.id}`,
        image: found.mainPhoto || "/images/food/restaurants-khan.jpg",
        createdAt: new Date().toISOString(),
      });
    }
  }

  return records;
}

export async function listFavorites(): Promise<FavoriteRecord[]> {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  if (!supabase || !userId) return listLocalFavoriteRecords();

  const { data, error } = await supabase
    .from("user_favorites")
    .select("establishment_id,created_at,establishments(id,external_id,slug,name,city,address,display_order,created_at,rubrics(name,slug),subrubrics(name,slug))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<UserFavoriteRow[]>();

  if (error) throw new Error(error.message);
  const rows = (data ?? []).filter((item) => item.establishments).map((item) => ({ row: item.establishments!, createdAt: item.created_at }));
  const photos = await getPhotoMap(rows.map((item) => item.row.id));
  return rows.map((item) => rowToFavorite(item.row, item.createdAt, photos.get(item.row.id)));
}

export async function isFavorite(entityId: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  const establishmentId = await resolveEstablishmentId(entityId);
  if (!supabase || !userId || !establishmentId) {
    const localFavorites = readLocalFavorites();
    return localFavorites.includes(entityId) || localFavorites.includes(normalizeEntityId(entityId)) || (establishmentId ? localFavorites.includes(establishmentId) : false);
  }

  const { data } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("establishment_id", establishmentId)
    .maybeSingle<{ id: string }>();
  return Boolean(data);
}

export async function toggleFavorite(entityId: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  const establishmentId = await resolveEstablishmentId(entityId);
  if (!supabase || !userId || !establishmentId) {
    const localId = establishmentId ?? entityId;
    const current = readLocalFavorites();
    const next = current.includes(localId) || current.includes(entityId)
      ? current.filter((id) => id !== localId && id !== entityId)
      : [localId, ...current];
    writeLocalFavorites(next);
    return next.includes(localId);
  }

  const favorite = await isFavorite(establishmentId);
  if (favorite) {
    const { error } = await supabase.from("user_favorites").delete().eq("user_id", userId).eq("establishment_id", establishmentId);
    if (error) throw new Error(error.message);
    notifyFavoritesChanged();
    return false;
  }

  const { error } = await supabase.from("user_favorites").upsert({ user_id: userId, establishment_id: establishmentId }, { onConflict: "user_id,establishment_id" });
  if (error) throw new Error(error.message);
  notifyFavoritesChanged();
  return true;
}

export async function mergeLocalFavorites() {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  const localFavorites = readLocalFavorites();
  if (!supabase || !userId || !localFavorites.length) return 0;

  const idMap = await resolveEstablishmentIds(localFavorites);
  const rows = [...new Set([...idMap.values()])].map((establishmentId) => ({ user_id: userId, establishment_id: establishmentId }));
  if (!rows.length) {
    clearLocalFavorites();
    return 0;
  }

  const { error } = await supabase.from("user_favorites").upsert(rows, { onConflict: "user_id,establishment_id" });
  if (error) throw new Error(error.message);
  clearLocalFavorites();
  notifyFavoritesChanged();
  return rows.length;
}

export function clearLocalFavorites() {
  writeLocalFavorites([]);
}

export function getLocalFavorites() {
  return readLocalFavorites();
}

export const favoritesChangedEvent = FAVORITES_CHANGED_EVENT;
