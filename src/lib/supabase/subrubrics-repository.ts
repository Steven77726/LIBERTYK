"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type AdminSubrubricStatus = "Publié" | "Brouillon" | "Masqué";
export type SubrubricFormat = "Petit carré" | "Carré" | "Carré standard" | "Grand carré" | "Rectangle horizontal" | "Bannière" | "Bannière pleine largeur";

export type SubrubricRecord = {
  id: string;
  rubricId: string;
  slug?: string;
  name: string;
  description: string;
  icon?: string;
  photo: string;
  imageAlt?: string;
  visible?: boolean;
  showPublicly?: boolean;
  isDormant?: boolean;
  format?: SubrubricFormat;
  gridColumns?: 1 | 2 | 3 | 4;
  columnsDesktop?: 2 | 3 | 4;
  columnsTablet?: 1 | 2 | 3;
  columnsMobile?: 1 | 2;
  searchKeywords?: string[];
  order: number;
  status: AdminSubrubricStatus;
  createdAt?: string;
  updatedAt?: string;
};

type StatusDb = "published" | "draft" | "hidden" | "trashed";

type SubrubricRow = {
  id: string;
  external_id: string | null;
  rubric_id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  image_alt: string | null;
  show_publicly: boolean | null;
  is_dormant?: boolean | null;
  search_keywords: string[] | null;
  display_order: number | null;
  status: StatusDb;
  display_format: string | null;
  desktop_columns: number | null;
  tablet_columns: number | null;
  mobile_columns: number | null;
  created_at: string | null;
  updated_at: string | null;
  rubrics?: { id: string; external_id: string | null; slug: string | null } | null;
};

type SubrubricCountRow = {
  id: string;
  rubric_id: string;
  rubrics?: { id: string; external_id: string | null; slug: string | null } | null;
};

type RubricLookupRow = {
  id: string;
  external_id: string | null;
  slug: string;
};

const selectColumns = "id,external_id,rubric_id,slug,name,description,icon,image_url,image_alt,show_publicly,search_keywords,display_order,status,display_format,desktop_columns,tablet_columns,mobile_columns,created_at,updated_at,rubrics(id,external_id,slug)";

const statusToDb: Record<AdminSubrubricStatus, StatusDb> = {
  Publié: "published",
  Brouillon: "draft",
  Masqué: "hidden",
};

const statusFromDb: Record<StatusDb, AdminSubrubricStatus> = {
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

function readableError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Erreur Supabase inconnue.";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getClientOrThrow() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Connexion Supabase non configurée.");
  return supabase;
}

function rowToSubrubric(row: SubrubricRow): SubrubricRecord {
  const parentId = row.rubrics?.external_id || row.rubrics?.slug || row.rubric_id;
  const desktop = asColumns(row.desktop_columns, 3);
  const isDormant = row.is_dormant === true || (row.search_keywords || []).includes("__dormant__");
  return {
    id: row.external_id || row.id,
    rubricId: parentId,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    icon: row.icon ?? "",
    photo: row.image_url ?? "",
    imageAlt: row.image_alt ?? "",
    visible: row.show_publicly ?? true,
    showPublicly: row.show_publicly ?? true,
    isDormant,
    format: (row.display_format as SubrubricFormat | null) ?? "Carré standard",
    gridColumns: desktop,
    columnsDesktop: desktop,
    columnsTablet: asColumns(row.tablet_columns, 2),
    columnsMobile: asColumns(row.mobile_columns, 1),
    searchKeywords: (row.search_keywords || []).filter((k) => k !== "__dormant__"),
    order: row.display_order ?? 0,
    status: statusFromDb[row.status] ?? "Brouillon",
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

async function getRubricLookup() {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("rubrics")
    .select("id,external_id,slug")
    .is("deleted_at", null)
    .returns<RubricLookupRow[]>();
  if (error) throw new Error(readableError(error));
  const map = new Map<string, string>();
  (data ?? []).forEach((rubric) => {
    map.set(rubric.id, rubric.id);
    if (rubric.external_id) map.set(rubric.external_id, rubric.id);
    map.set(rubric.slug, rubric.id);
  });
  return map;
}

async function subrubricToPayload(subrubric: SubrubricRecord, statusOverride?: StatusDb) {
  const rubricLookup = await getRubricLookup();
  const rubricId = rubricLookup.get(subrubric.rubricId);
  if (!rubricId) throw new Error(`Rubrique parente introuvable pour ${subrubric.name}.`);
  const slug = normalizeSlug(subrubric.slug || subrubric.name || subrubric.id);
  const showPublicly = subrubric.showPublicly ?? subrubric.visible ?? true;
  const keywords = Array.from(
    new Set([
      ...(subrubric.searchKeywords ?? []).filter((k) => k !== "__dormant__"),
      ...(subrubric.isDormant ? ["__dormant__"] : []),
    ])
  );
  return {
    external_id: subrubric.id,
    rubric_id: rubricId,
    slug,
    name: subrubric.name.trim(),
    description: subrubric.description ?? "",
    icon: subrubric.icon ?? "",
    image_url: subrubric.photo ?? "",
    image_alt: subrubric.imageAlt ?? subrubric.name,
    show_publicly: showPublicly,
    is_dormant: subrubric.isDormant === true,
    search_keywords: keywords,
    display_order: Number(subrubric.order) || 0,
    status: statusOverride ?? statusToDb[subrubric.status] ?? "draft",
    display_format: subrubric.format ?? "Carré standard",
    desktop_columns: subrubric.columnsDesktop ?? subrubric.gridColumns ?? 3,
    tablet_columns: subrubric.columnsTablet ?? 2,
    mobile_columns: subrubric.columnsMobile ?? 1,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };
}

export async function listPublishedSubrubrics(parentRubricSlug?: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const query = supabase
    .from("subrubrics")
    .select(selectColumns)
    .eq("status", "published")
    .eq("show_publicly", true)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });
  const { data, error } = await query.returns<SubrubricRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? [])
    .filter((row) => !parentRubricSlug || row.rubrics?.slug === parentRubricSlug || row.rubrics?.external_id === parentRubricSlug || row.rubric_id === parentRubricSlug)
    .map(rowToSubrubric)
    .filter((item) => !item.isDormant && !item.searchKeywords?.includes("__dormant__"));
}

export async function listPublishedSubrubricCountsByRubric() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("subrubrics")
    .select("id,rubric_id,rubrics(id,external_id,slug)")
    .eq("status", "published")
    .eq("show_publicly", true)
    .is("deleted_at", null)
    .returns<SubrubricCountRow[]>();
  if (error) throw new Error(readableError(error));

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    [row.rubric_id, row.rubrics?.id, row.rubrics?.external_id, row.rubrics?.slug]
      .filter(Boolean)
      .forEach((key) => {
        counts[key as string] = (counts[key as string] ?? 0) + 1;
      });
  });
  return counts;
}

export async function listAllSubrubricsForAdmin() {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("subrubrics")
    .select(selectColumns)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<SubrubricRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? []).map(rowToSubrubric);
}

async function upsertSubrubric(subrubric: SubrubricRecord, statusOverride?: StatusDb) {
  const supabase = getClientOrThrow();
  const payload = await subrubricToPayload(subrubric, statusOverride);
  if (isUuid(subrubric.id)) {
    const { data: updated, error: updateError } = await supabase
      .from("subrubrics")
      .update(payload)
      .eq("id", subrubric.id)
      .select(selectColumns)
      .maybeSingle<SubrubricRow>();
    if (updateError) throw new Error(readableError(updateError));
    if (updated) return rowToSubrubric(updated);
  }
  const { data, error } = await supabase
    .from("subrubrics")
    .upsert(payload, { onConflict: "external_id" })
    .select(selectColumns)
    .single<SubrubricRow>();
  if (error) throw new Error(readableError(error));
  return rowToSubrubric(data);
}

export async function createSubrubric(subrubric: SubrubricRecord) {
  return upsertSubrubric(subrubric, "draft");
}

export async function updateSubrubric(subrubric: SubrubricRecord) {
  return upsertSubrubric(subrubric);
}

export async function publishSubrubric(subrubric: SubrubricRecord) {
  return upsertSubrubric({ ...subrubric, status: "Publié", visible: true, showPublicly: true });
}

export async function hideSubrubric(subrubric: SubrubricRecord) {
  return upsertSubrubric({ ...subrubric, status: "Masqué", visible: false, showPublicly: false });
}

export async function duplicateSubrubric(subrubric: SubrubricRecord) {
  const copy: SubrubricRecord = {
    ...subrubric,
    id: `${subrubric.id}-copy-${Date.now()}`,
    slug: `${normalizeSlug(subrubric.slug || subrubric.name)}-copie-${Date.now().toString().slice(-5)}`,
    name: `${subrubric.name} copie`,
    status: "Brouillon",
    order: subrubric.order + 1,
  };
  return createSubrubric(copy);
}

export async function moveSubrubricToTrash(subrubric: SubrubricRecord) {
  const supabase = getClientOrThrow();
  let query = supabase
    .from("subrubrics")
    .update({ status: "trashed", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("external_id", subrubric.id);
  if (isUuid(subrubric.id)) {
    query = supabase
      .from("subrubrics")
      .update({ status: "trashed", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", subrubric.id);
  }
  const { error } = await query;
  if (error) throw new Error(readableError(error));
}

export async function restoreSubrubric(subrubric: SubrubricRecord) {
  return upsertSubrubric({ ...subrubric, status: subrubric.status === "Masqué" ? "Brouillon" : subrubric.status });
}

export async function updateSubrubricOrder(subrubrics: SubrubricRecord[]) {
  const supabase = getClientOrThrow();
  const payload = await Promise.all(subrubrics.map((subrubric, index) => subrubricToPayload({ ...subrubric, order: index + 1 })));
  const { error } = await supabase.from("subrubrics").upsert(payload, { onConflict: "external_id" });
  if (error) throw new Error(readableError(error));
  return payload.length;
}

export async function importSubrubricsIfMissing(subrubrics: SubrubricRecord[]) {
  const supabase = getClientOrThrow();
  const payload = await Promise.all(subrubrics.map((subrubric) => subrubricToPayload(subrubric)));
  if (!payload.length) return [];
  const { error } = await supabase.from("subrubrics").upsert(payload, { onConflict: "external_id", ignoreDuplicates: true });
  if (error) throw new Error(readableError(error));
  return listAllSubrubricsForAdmin();
}
