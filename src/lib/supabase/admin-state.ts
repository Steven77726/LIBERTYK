"use client";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const ADMIN_STATE_KEY = "admin_state";

export async function loadAdminStateFromSupabase<T>() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", ADMIN_STATE_KEY).maybeSingle();
  if (error) return null;
  return (data?.value as T | undefined) ?? null;
}

export async function saveAdminStateToSupabase<T>(value: T) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase non configuré" };
  const { error } = await supabase.from("app_settings").upsert({
    key: ADMIN_STATE_KEY,
    value,
    updated_at: new Date().toISOString(),
  });
  return { ok: !error, error: error?.message };
}

export async function writeAuditLog(action: string, entityType: string, entityId: string, label: string, payload: Record<string, unknown> = {}) {
  if (!isSupabaseConfigured) return;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  await supabase.from("audit_log").insert({
    actor_id: data.user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    label,
    payload,
  });
}

export async function fetchRealAnalyticsEvents() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) return null;
  return data ?? [];
}
