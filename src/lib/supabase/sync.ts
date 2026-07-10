"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function getUserId() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function syncFavorite(entityId: string, label: string | undefined, enabled: boolean) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getUserId();
  if (!supabase || !userId) return;
  if (enabled) {
    await supabase.from("favorites").upsert({ user_id: userId, entity_id: entityId, label });
  } else {
    await supabase.from("favorites").delete().eq("user_id", userId).eq("entity_id", entityId);
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
