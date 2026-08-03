"use client";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

const LEGACY_ADMIN_STATE_KEY = "admin_state";

export async function loadAdminStateFromSupabase<T>() {
  void LEGACY_ADMIN_STATE_KEY;
  return null as T | null;
}

export async function saveAdminStateToSupabase<T>(_value: T) {
  void _value;
  return {
    ok: true,
    error: undefined,
    skipped: true,
    reason: "admin_state est figé : app_settings n'est plus une source de contenu Liberty.",
  };
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

export async function saveSeoAnalysisHistory(payload: Record<string, unknown>) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !isSupabaseConfigured) return { ok: false, error: "Supabase non configuré" };
  const { data } = await supabase.auth.getUser();
  const { error } = await supabase.from("seo_analysis_history").insert({
    actor_id: data.user?.id ?? null,
    payload,
    overall_score: typeof payload.overallScore === "number" ? payload.overallScore : null,
    total_pages: typeof payload.totalPages === "number" ? payload.totalPages : null,
  });
  return { ok: !error, error: error?.message };
}
