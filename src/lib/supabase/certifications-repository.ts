"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type CertificationRecord = {
  id: string;
  label: string;
  order: number;
  status?: "Publié" | "Brouillon" | "Masqué";
};

type CertificationDbStatus = "published" | "draft" | "hidden" | "trashed" | "publié" | "brouillon" | "masqué";

type CertificationRow = {
  id: string;
  name: string;
  slug: string;
  label: string | null;
  display_order: number | null;
  sort_order: number | null;
  status: CertificationDbStatus;
  deleted_at: string | null;
  is_deleted: boolean | null;
};

const selectColumns = "id,name,slug,label,display_order,sort_order,status,deleted_at,is_deleted";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function readableError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Erreur Supabase inconnue.";
}

function getClientOrThrow() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Connexion Supabase non configurée.");
  return supabase;
}

function toDbStatus(status?: CertificationRecord["status"]): CertificationDbStatus {
  if (status === "Publié") return "published";
  if (status === "Masqué") return "hidden";
  return "draft";
}

function fromDbStatus(status: CertificationDbStatus): CertificationRecord["status"] {
  if (status === "published" || status === "publié") return "Publié";
  if (status === "hidden" || status === "trashed" || status === "masqué") return "Masqué";
  return "Brouillon";
}

function rowToCertification(row: CertificationRow): CertificationRecord {
  return {
    id: row.slug || row.id,
    label: row.label || row.name,
    order: row.display_order ?? row.sort_order ?? 0,
    status: fromDbStatus(row.status),
  };
}

function certificationToPayload(certification: CertificationRecord, status?: CertificationRecord["status"]) {
  const label = certification.label.trim();
  const slug = slugify(certification.id && !certification.id.startsWith("certification-") ? certification.id : label);
  return {
    name: label,
    label,
    slug,
    sort_order: Number(certification.order) || 0,
    display_order: Number(certification.order) || 0,
    status: toDbStatus(status ?? certification.status),
    is_deleted: false,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };
}

export async function listAllCertificationsForAdmin() {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("certifications")
    .select(selectColumns)
    .or("deleted_at.is.null,is_deleted.eq.false")
    .order("display_order", { ascending: true })
    .returns<CertificationRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? []).filter((row) => !row.deleted_at && row.is_deleted !== true).map(rowToCertification);
}

export async function upsertCertification(certification: CertificationRecord, status?: CertificationRecord["status"]) {
  const supabase = getClientOrThrow();
  const payload = certificationToPayload(certification, status);
  const { data, error } = await supabase
    .from("certifications")
    .upsert(payload, { onConflict: "slug" })
    .select(selectColumns)
    .single<CertificationRow>();
  if (error) throw new Error(readableError(error));
  return rowToCertification(data);
}

export async function hideCertification(certification: CertificationRecord) {
  return upsertCertification({ ...certification, status: "Masqué" }, "Masqué");
}

export async function moveCertificationToTrash(certification: CertificationRecord) {
  const supabase = getClientOrThrow();
  const slug = slugify(certification.id && !certification.id.startsWith("certification-") ? certification.id : certification.label);
  const { error } = await supabase
    .from("certifications")
    .update({ status: "trashed", is_deleted: true, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw new Error(readableError(error));
}

export async function importCertificationsIfMissing(certifications: CertificationRecord[]) {
  const current = await listAllCertificationsForAdmin();
  if (current.length) return current;
  const imported: CertificationRecord[] = [];
  for (const certification of certifications) imported.push(await upsertCertification(certification, certification.status));
  return imported;
}
