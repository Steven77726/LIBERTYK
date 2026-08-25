"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AdminRubricStatus = "Publié" | "Brouillon" | "Masqué";
export type RubricFormat = "Petit carré" | "Carré" | "Carré standard" | "Grand carré" | "Rectangle horizontal" | "Bannière" | "Bannière pleine largeur";

export type RubricRecord = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  imageAlt?: string;
  showOnHome?: boolean;
  format?: RubricFormat;
  columnsDesktop?: 2 | 3 | 4;
  columnsTablet?: 1 | 2 | 3;
  columnsMobile?: 1 | 2;
  searchKeywords?: string[];
  order: number;
  status: AdminRubricStatus;
  createdAt?: string;
  updatedAt?: string;
};

type RubricRow = {
  id: string;
  external_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  image_alt: string | null;
  show_on_home: boolean | null;
  search_keywords: string[] | null;
  display_order: number | null;
  status: "published" | "draft" | "hidden" | "trashed";
  display_format: string | null;
  desktop_columns: number | null;
  tablet_columns: number | null;
  mobile_columns: number | null;
  created_at: string | null;
  updated_at: string | null;
};

const statusToDb: Record<AdminRubricStatus, RubricRow["status"]> = {
  Publié: "published",
  Brouillon: "draft",
  Masqué: "hidden",
};

const statusFromDb: Record<RubricRow["status"], AdminRubricStatus> = {
  published: "Publié",
  draft: "Brouillon",
  hidden: "Masqué",
  trashed: "Masqué",
};

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function asColumns<T extends number>(value: number | null | undefined, fallback: T): T {
  return (value ? Number(value) : fallback) as T;
}

export function rowToRubric(row: RubricRow): RubricRecord {
  return {
    id: row.external_id || row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    icon: row.icon ?? "",
    image: row.image_url ?? "",
    imageAlt: row.image_alt ?? "",
    showOnHome: row.show_on_home ?? true,
    format: (row.display_format as RubricFormat | null) ?? "Carré standard",
    columnsDesktop: asColumns(row.desktop_columns, 3),
    columnsTablet: asColumns(row.tablet_columns, 2),
    columnsMobile: asColumns(row.mobile_columns, 1),
    searchKeywords: row.search_keywords ?? [],
    order: row.display_order ?? 0,
    status: statusFromDb[row.status] ?? "Brouillon",
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function rubricToPayload(rubric: RubricRecord, statusOverride?: RubricRow["status"]) {
  const slug = normalizeSlug(rubric.slug || rubric.name || rubric.id);
  return {
    external_id: rubric.id,
    slug,
    name: rubric.name.trim(),
    description: rubric.description ?? "",
    icon: rubric.icon ?? "",
    image_url: rubric.image ?? "",
    image_alt: rubric.imageAlt ?? rubric.name,
    show_on_home: rubric.showOnHome ?? true,
    search_keywords: rubric.searchKeywords ?? [],
    display_order: Number(rubric.order) || 0,
    status: statusOverride ?? statusToDb[rubric.status] ?? "draft",
    display_format: rubric.format ?? "Carré standard",
    desktop_columns: rubric.columnsDesktop ?? 3,
    tablet_columns: rubric.columnsTablet ?? 2,
    mobile_columns: rubric.columnsMobile ?? 1,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };
}

function getClientOrThrow() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Connexion Supabase non configurée.");
  return supabase;
}

function readableError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Erreur Supabase inconnue.";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function listPublishedRubrics() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("rubrics")
    .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
    .eq("status", "published")
    .eq("show_on_home", true)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<RubricRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? []).map(rowToRubric);
}

export async function listAllRubricsForAdmin() {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("rubrics")
    .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<RubricRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? []).map(rowToRubric);
}

export async function createRubric(rubric: RubricRecord) {
  const supabase = getClientOrThrow();
  const payload = rubricToPayload(rubric, "draft");
  if (isUuid(rubric.id)) {
    const { data: updated, error: updateError } = await supabase
      .from("rubrics")
      .update(payload)
      .eq("id", rubric.id)
      .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
      .maybeSingle<RubricRow>();
    if (updateError) throw new Error(readableError(updateError));
    if (updated) return rowToRubric(updated);
  }
  const { data, error } = await supabase
    .from("rubrics")
    .upsert(payload, { onConflict: "external_id" })
    .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
    .single<RubricRow>();
  if (error) throw new Error(readableError(error));
  return rowToRubric(data);
}

export async function updateRubric(rubric: RubricRecord) {
  const supabase = getClientOrThrow();
  const payload = rubricToPayload(rubric);
  if (isUuid(rubric.id)) {
    const { data: updated, error: updateError } = await supabase
      .from("rubrics")
      .update(payload)
      .eq("id", rubric.id)
      .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
      .maybeSingle<RubricRow>();
    if (updateError) throw new Error(readableError(updateError));
    if (updated) return rowToRubric(updated);
  }
  const { data, error } = await supabase
    .from("rubrics")
    .upsert(payload, { onConflict: "external_id" })
    .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
    .single<RubricRow>();
  if (error) throw new Error(readableError(error));
  return rowToRubric(data);
}

export async function publishRubric(rubric: RubricRecord) {
  return updateRubric({ ...rubric, status: "Publié" });
}

export async function hideRubric(rubric: RubricRecord) {
  return updateRubric({ ...rubric, status: "Masqué" });
}

export async function duplicateRubric(rubric: RubricRecord) {
  const copy: RubricRecord = {
    ...rubric,
    id: `${rubric.id}-copy-${Date.now()}`,
    slug: `${normalizeSlug(rubric.slug || rubric.name)}-copie-${Date.now().toString().slice(-5)}`,
    name: `${rubric.name} copie`,
    status: "Brouillon",
    order: rubric.order + 1,
  };
  return createRubric(copy);
}

export async function moveRubricToTrash(rubric: RubricRecord) {
  const supabase = getClientOrThrow();
  let query = supabase
    .from("rubrics")
    .update({ status: "trashed", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("external_id", rubric.id);
  if (isUuid(rubric.id)) {
    query = supabase
      .from("rubrics")
      .update({ status: "trashed", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", rubric.id);
  }
  const { error } = await query;
  if (error) throw new Error(readableError(error));
}

export async function restoreRubric(rubric: RubricRecord) {
  const supabase = getClientOrThrow();
  const payload = rubricToPayload({ ...rubric, status: rubric.status === "Masqué" ? "Brouillon" : rubric.status });
  if (isUuid(rubric.id)) {
    const { data: updated, error: updateError } = await supabase
      .from("rubrics")
      .update(payload)
      .eq("id", rubric.id)
      .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
      .maybeSingle<RubricRow>();
    if (updateError) throw new Error(readableError(updateError));
    if (updated) return rowToRubric(updated);
  }
  const { data, error } = await supabase
    .from("rubrics")
    .upsert(payload, { onConflict: "external_id" })
    .select("id,external_id,slug,name,description,icon,image_url,image_alt,show_on_home,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at")
    .single<RubricRow>();
  if (error) throw new Error(readableError(error));
  return rowToRubric(data);
}

export async function updateRubricOrder(rubrics: RubricRecord[]) {
  const supabase = getClientOrThrow();
  const updates = rubrics.map((rubric, index) => ({
    ...rubricToPayload({ ...rubric, order: index + 1 }),
    display_order: index + 1,
  }));
  const { error } = await supabase.from("rubrics").upsert(updates, { onConflict: "external_id" });
  if (error) throw new Error(readableError(error));
  return updates.length;
}

export async function importRubricsIfMissing(rubrics: RubricRecord[]) {
  const supabase = getClientOrThrow();
  const payload = rubrics.map((rubric) => rubricToPayload(rubric));
  if (!payload.length) return [];
  const { error } = await supabase.from("rubrics").upsert(payload, { onConflict: "external_id", ignoreDuplicates: true });
  if (error) throw new Error(readableError(error));
  return listAllRubricsForAdmin();
}
