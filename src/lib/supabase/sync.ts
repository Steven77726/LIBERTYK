"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function getUserId() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function normalizeEntityId(entityId: string) {
  return entityId
    .replace(/^establishment-/, "")
    .replace(/^restaurant-/, "")
    .replace(/^brunch-/, "")
    .replace(/^wine-/, "")
    .replace(/^shop-/, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

export async function syncFavorite(entityId: string, label: string | undefined, enabled: boolean) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  const establishmentId = await resolveEstablishmentId(entityId);
  if (!supabase || !userId || !establishmentId) return;
  if (enabled) {
    await supabase.from("user_favorites").upsert({ user_id: userId, establishment_id: establishmentId }, { onConflict: "user_id,establishment_id" });
  } else {
    await supabase.from("user_favorites").delete().eq("user_id", userId).eq("establishment_id", establishmentId);
  }
}

export async function syncLike(entityId: string, label: string | undefined, enabled: boolean) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  if (!supabase || !userId) return;
  if (enabled) {
    await supabase.from("likes").upsert({ user_id: userId, entity_id: entityId, label });
  } else {
    await supabase.from("likes").delete().eq("user_id", userId).eq("entity_id", entityId);
  }
}

export async function fetchUserSavedEntities() {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  if (!supabase || !userId) return { favorites: [] as string[], likes: [] as string[] };
  const [{ data: favorites }, { data: likes }] = await Promise.all([
    supabase.from("user_favorites").select("establishment_id").eq("user_id", userId),
    supabase.from("likes").select("entity_id").eq("user_id", userId),
  ]);
  return {
    favorites: (favorites ?? []).map((item) => String(item.establishment_id)),
    likes: (likes ?? []).map((item) => String(item.entity_id)),
  };
}

export async function syncReview(entityId: string, text: string, label?: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  if (!supabase || !userId) return;
  await supabase.from("reviews").insert({ user_id: userId, entity_id: entityId, label, text, status: "published" });
}

export async function syncAnalyticsEvent(type: string, label?: string, entityId?: string) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  if (!supabase) return;
  await supabase.from("analytics_events").insert({
    user_id: userId,
    event_type: type,
    entity_id: entityId,
    label,
    path: typeof window !== "undefined" ? window.location.pathname : null,
  });
}
