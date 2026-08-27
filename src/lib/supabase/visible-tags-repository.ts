"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type VisibleTagRecord = {
  id: string;
  label: string;
  kind?: "visible" | "search";
  icon?: string;
  color?: string;
  rubricIds?: string[];
  order: number;
  status?: "Publié" | "Brouillon" | "Masqué";
};

type TagRow = {
  id: string;
  external_id: string | null;
  label: string;
  icon: string | null;
  display_order: number | null;
  status: "published" | "draft" | "hidden" | "trashed";
  deleted_at: string | null;
};

function readableError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Erreur Supabase inconnue.";
}

function getClientOrThrow() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Connexion Supabase non configurée.");
  return supabase;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toDbStatus(status?: VisibleTagRecord["status"]) {
  if (status === "Publié") return "published";
  if (status === "Masqué") return "hidden";
  return "draft";
}

function fromDbStatus(status: TagRow["status"]): VisibleTagRecord["status"] {
  if (status === "published") return "Publié";
  if (status === "hidden" || status === "trashed") return "Masqué";
  return "Brouillon";
}

function rowToTag(row: TagRow): VisibleTagRecord {
  return {
    id: row.external_id || row.id,
    label: row.label,
    kind: "visible",
    icon: row.icon ?? "",
    color: "#1f4d3b",
    rubricIds: [],
    order: row.display_order ?? 0,
    status: fromDbStatus(row.status),
  };
}

function tagToPayload(tag: VisibleTagRecord) {
  const stableExternalId = tag.id && !tag.id.startsWith("tag-") ? tag.id : slugify(tag.label);
  return {
    external_id: stableExternalId,
    label: tag.label.trim(),
    icon: tag.icon ?? "",
    display_order: Number(tag.order) || 0,
    status: toDbStatus(tag.status),
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };
}

function deduplicateTagRecords(tags: VisibleTagRecord[]): VisibleTagRecord[] {
  const seen = new Set<string>();
  const result: VisibleTagRecord[] = [];
  for (const tag of tags) {
    const key = (tag.label || tag.id || "").trim().toLowerCase();
    const slugKey = slugify(tag.label || tag.id || "");
    if (!key || seen.has(key) || seen.has(slugKey)) continue;
    seen.add(key);
    seen.add(slugKey);
    result.push(tag);
  }
  return result;
}

export async function listAllVisibleTagsForAdmin() {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("visible_tags")
    .select("id,external_id,label,icon,display_order,status,deleted_at")
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<TagRow[]>();
  if (error) throw new Error(readableError(error));
  return deduplicateTagRecords((data ?? []).map(rowToTag));
}

export async function listPublishedVisibleTags() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("visible_tags")
    .select("id,external_id,label,icon,display_order,status,deleted_at")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<TagRow[]>();
  if (error) return [];
  return deduplicateTagRecords((data ?? []).map(rowToTag));
}

export async function upsertVisibleTag(tag: VisibleTagRecord, status?: VisibleTagRecord["status"]) {
  const supabase = getClientOrThrow();
  const payload = tagToPayload({ ...tag, status: status ?? tag.status });
  const { data, error } = await supabase
    .from("visible_tags")
    .upsert(payload, { onConflict: "external_id" })
    .select("id,external_id,label,icon,display_order,status,deleted_at")
    .single<TagRow>();
  if (error) throw new Error(readableError(error));
  return rowToTag(data);
}

export async function hideVisibleTag(tag: VisibleTagRecord) {
  return upsertVisibleTag({ ...tag, status: "Masqué" }, "Masqué");
}

export async function moveVisibleTagToTrash(tag: VisibleTagRecord) {
  const supabase = getClientOrThrow();
  const externalId = tag.id && !tag.id.startsWith("tag-") ? tag.id : slugify(tag.label);
  const query = supabase
    .from("visible_tags")
    .update({ status: "trashed", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  const { error } = isUuid(tag.id)
    ? await query.or(`external_id.eq.${externalId},id.eq.${tag.id}`)
    : await query.eq("external_id", externalId);
  if (error) throw new Error(readableError(error));
}

export async function importVisibleTagsIfMissing(tags: VisibleTagRecord[]) {
  const current = await listAllVisibleTagsForAdmin();
  if (current.length) return current;
  const imported: VisibleTagRecord[] = [];
  for (const tag of tags) imported.push(await upsertVisibleTag(tag, tag.status));
  return imported;
}
