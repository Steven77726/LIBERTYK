"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { LocalEstablishment, LocalEstablishmentStatus, LocalKosherType, LocalSponsorshipLevel } from "@/data/establishments";

export type EstablishmentRecord = LocalEstablishment & {
  createdAt?: string;
  updatedAt?: string;
};

type StatusDb = "published" | "draft" | "hidden" | "trashed";
type SponsorshipDb = "standard" | "sponsored" | "partner" | "liberty_favorite";

type EstablishmentRow = {
  id: string;
  external_id: string | null;
  rubric_id: string | null;
  subrubric_id: string | null;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  arrondissement: string | null;
  district: string | null;
  country: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
  deliveroo_url?: string | null;
  uber_eats_url?: string | null;
  deliverooUrl?: string;
  uberEatsUrl?: string;
  website: string | null;
  reservation_url: string | null;
  reservation_target: string | null;
  hours: Record<string, unknown> | null;
  amenities: Record<string, unknown> | null;
  services: Record<string, unknown> | null;
  certification: string | null;
  kosher_type: string | null;
  average_price: string | null;
  customer_searches: string[] | null;
  visible_tags: string[] | null;
  field_visibility: Record<string, boolean> | null;
  display_order: number | null;
  sponsorship: SponsorshipDb;
  sponsor_priority: number | null;
  sponsor_starts_at: string | null;
  sponsor_ends_at: string | null;
  sponsor_placement: string | null;
  sponsor_notes: string | null;
  reservation_enabled: boolean | null;
  status: StatusDb;
  is_visible: boolean | null;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  rubrics?: { id: string; external_id: string | null; slug: string | null } | null;
  subrubrics?: { id: string; external_id: string | null; slug: string | null } | null;
};

type EstablishmentCountRow = {
  id: string;
  rubric_id: string | null;
  subrubric_id: string | null;
  rubrics?: { id: string; external_id: string | null; slug: string | null } | null;
  subrubrics?: { id: string; external_id: string | null; slug: string | null } | null;
};

type PhotoRow = {
  id: string;
  entity_id: string;
  url: string;
  alt: string | null;
  display_order: number;
};

type LookupRow = {
  id: string;
  external_id: string | null;
  slug: string;
};

type VisibleTagLookupRow = {
  id: string;
  external_id: string | null;
  label: string;
};

type EstablishmentFilters = {
  rubricSlug?: string;
  subrubricSlug?: string;
};

const selectColumns = `
  id,external_id,rubric_id,subrubric_id,slug,name,short_description,description,address,city,postal_code,
  arrondissement,district,country,latitude,longitude,phone,whatsapp,email,instagram,website,reservation_url,
  reservation_target,hours,amenities,services,certification,kosher_type,average_price,customer_searches,
  visible_tags,field_visibility,display_order,sponsorship,sponsor_priority,sponsor_starts_at,sponsor_ends_at,sponsor_placement,
  sponsor_notes,reservation_enabled,status,is_visible,owner_id,created_at,updated_at,
  rubrics(id,external_id,slug),
  subrubrics(id,external_id,slug)
`;

const statusToDb: Record<LocalEstablishmentStatus, StatusDb> = {
  Publié: "published",
  Brouillon: "draft",
  Masqué: "hidden",
};

const statusFromDb: Record<StatusDb, LocalEstablishmentStatus> = {
  published: "Publié",
  draft: "Brouillon",
  hidden: "Masqué",
  trashed: "Masqué",
};

const sponsorshipToDb: Record<LocalSponsorshipLevel, SponsorshipDb> = {
  Standard: "standard",
  Featured: "sponsored",
  Premium: "partner",
  Sponsorisé: "sponsored",
  "Partenaire officiel": "partner",
  "Coup de cœur Liberty": "liberty_favorite",
};

const sponsorshipFromDb: Record<SponsorshipDb, LocalSponsorshipLevel> = {
  standard: "Standard",
  sponsored: "Featured",
  partner: "Premium",
  liberty_favorite: "Premium",
};

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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

function parseJsonHours(value: Record<string, unknown> | null) {
  if (!value || !Object.keys(value).length) return "";
  return Object.entries(value).map(([day, hours]) => `${day}: ${String(hours ?? "")}`).join("\n");
}

const defaultFieldVisibility: Record<string, boolean> = {
  phone: true,
  whatsapp: true,
  email: true,
  website: true,
  reservation: true,
  instagram: true,
  address: true,
  opening_hours: true,
  tags: true,
  gallery: true,
  price: true,
  map: true,
  reviews: true,
  certification: true,
  delivery: true,
  takeaway: true,
  terrace: true,
};

function normalizeFieldVisibility(value?: Record<string, boolean> | null) {
  return { ...defaultFieldVisibility, ...(value ?? {}) };
}

function serializeHours(value: string) {
  if (!value.trim()) return {};
  return Object.fromEntries(value.split("\n").map((line) => {
    const [day, ...rest] = line.split(":");
    return [day.trim().toLowerCase(), rest.join(":").trim()];
  }).filter(([day]) => Boolean(day)));
}

function boolFromJson(source: Record<string, unknown> | null | undefined, key: string) {
  return source?.[key] === true;
}

function normalizeUrl(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  if (/^[\w.-]+\/?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function normalizeCoordinate(value?: string) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

async function getLookup(table: "rubrics" | "subrubrics") {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from(table)
    .select("id,external_id,slug")
    .is("deleted_at", null)
    .returns<LookupRow[]>();
  if (error) throw new Error(readableError(error));
  const map = new Map<string, string>();
  (data ?? []).forEach((item) => {
    map.set(item.id, item.id);
    if (item.external_id) map.set(item.external_id, item.id);
    map.set(item.slug, item.id);
  });
  return map;
}

async function getPhotos(entityIds: string[]) {
  if (!entityIds.length) return new Map<string, PhotoRow[]>();
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("photos")
    .select("id,entity_id,url,alt,display_order")
    .eq("entity_type", "establishment")
    .in("entity_id", entityIds)
    .order("display_order", { ascending: true })
    .returns<PhotoRow[]>();
  if (error) return new Map<string, PhotoRow[]>();
  const map = new Map<string, PhotoRow[]>();
  (data ?? []).forEach((photo) => {
    const list = map.get(photo.entity_id) ?? [];
    list.push(photo);
    map.set(photo.entity_id, list);
  });
  return map;
}

async function getVisibleTagMap() {
  const supabase = getSupabaseBrowserClient();
  const defaults = new Map<string, string>([
    ["terrasse", "Terrasse"],
    ["ouvert", "Ouvert"],
    ["reservation", "Réservation"],
    ["livraison", "Livraison"],
    ["a-emporter", "À emporter"],
    ["bassari", "Bassari"],
    ["halavi", "Halavi"],
    ["parve", "Parvé"],
    ["beth-din-de-paris", "Beth Din de Paris"],
    ["badatz", "Badatz"],
    ["loubavitch", "Loubavitch"],
    ["rottenberg", "Rottenberg"],
    ["sponsorise", "Sponsorisé"],
  ]);
  if (!supabase) return defaults;
  const { data, error } = await supabase
    .from("visible_tags")
    .select("id,external_id,label")
    .eq("status", "published")
    .is("deleted_at", null)
    .returns<VisibleTagLookupRow[]>();
  if (error) return defaults;
  (data ?? []).forEach((tag) => {
    defaults.set(tag.id, tag.label);
    if (tag.external_id) defaults.set(tag.external_id, tag.label);
    defaults.set(tag.label, tag.label);
  });
  return defaults;
}

async function resolvePublishedFilterIds(filters?: EstablishmentFilters) {
  if (!filters?.rubricSlug && !filters?.subrubricSlug) {
    return { rubricId: undefined, subrubricId: undefined, notFound: false };
  }

  const supabase = getClientOrThrow();
  let rubricId: string | undefined;
  let subrubricId: string | undefined;

  if (filters.rubricSlug) {
    const { data, error } = await supabase
      .from("rubrics")
      .select("id")
      .eq("status", "published")
      .eq("show_on_home", true)
      .is("deleted_at", null)
      .or(`slug.eq.${filters.rubricSlug},external_id.eq.${filters.rubricSlug}`)
      .limit(1)
      .maybeSingle<{ id: string }>();
    if (error) throw new Error(readableError(error));
    if (!data?.id) return { rubricId: undefined, subrubricId: undefined, notFound: true };
    rubricId = data.id;
  }

  if (filters.subrubricSlug) {
    let query = supabase
      .from("subrubrics")
      .select("id")
      .eq("status", "published")
      .is("deleted_at", null)
      .or(`slug.eq.${filters.subrubricSlug},external_id.eq.${filters.subrubricSlug}`)
      .limit(1);

    if (rubricId) query = query.eq("rubric_id", rubricId);

    const { data, error } = await query.maybeSingle<{ id: string }>();
    if (error) throw new Error(readableError(error));
    if (!data?.id) return { rubricId, subrubricId: undefined, notFound: true };
    subrubricId = data.id;
  }

  return { rubricId, subrubricId, notFound: false };
}

function resolveVisibleTags(values: string[] | null | undefined, tagMap: Map<string, string>) {
  return [...new Set((values ?? []).map((value) => tagMap.get(value) ?? value).filter(Boolean))];
}

function rowToEstablishment(row: EstablishmentRow, photos: PhotoRow[] = [], tagMap?: Map<string, string>): EstablishmentRecord {
  const photoUrls = photos.sort((a, b) => a.display_order - b.display_order).map((photo) => photo.url);
  const sponsorshipLevel = sponsorshipFromDb[row.sponsorship] ?? "Standard";
  const amenities = row.amenities ?? {};
  const services = row.services ?? {};
  return {
    id: row.external_id || row.id,
    rubricId: row.rubrics?.external_id || row.rubrics?.slug || row.rubric_id || "",
    subrubricId: row.subrubrics?.external_id || row.subrubrics?.slug || row.subrubric_id || "",
    mainPhoto: photoUrls[0] ?? "",
    photos: photoUrls.slice(1),
    photoAlts: photos.slice(1).map((photo) => photo.alt ?? ""),
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    arrondissement: row.district ?? row.arrondissement ?? "",
    postalCode: row.postal_code ?? "",
    country: row.country ?? "France",
    email: row.email ?? "",
    phone: row.phone ?? "",
    whatsapp: row.whatsapp ?? "",
    instagram: row.instagram ?? "",
    deliverooUrl: row.deliveroo_url ?? row.deliverooUrl ?? "",
    uberEatsUrl: row.uber_eats_url ?? row.uberEatsUrl ?? "",
    website: row.website ?? "",
    hours: parseJsonHours(row.hours),
    terrace: boolFromJson(amenities, "terrace"),
    delivery: boolFromJson(services, "delivery"),
    takeaway: boolFromJson(services, "takeaway"),
    reservation: row.reservation_enabled === true || boolFromJson(services, "reservation"),
    privateHire: boolFromJson(amenities, "privateHire"),
    certification: row.certification ?? "",
    kosherType: (row.kosher_type || "À compléter") as LocalKosherType,
    averagePrice: row.average_price ?? "",
    latitude: row.latitude === null ? "" : String(row.latitude),
    longitude: row.longitude === null ? "" : String(row.longitude),
    status: statusFromDb[row.status] ?? "Brouillon",
    visible: row.is_visible ?? true,
    sponsorshipLevel,
    sponsored: sponsorshipLevel !== "Standard",
    sponsorPriority: row.sponsor_priority ?? 0,
    sponsorDuration: "",
    sponsorStartsAt: row.sponsor_starts_at ?? "",
    sponsorEndsAt: row.sponsor_ends_at ?? "",
    sponsorPlacement: row.sponsor_placement ?? "",
    sponsorNotes: row.sponsor_notes ?? "",
    reservationTarget: row.reservation_url ?? row.reservation_target ?? "",
    ownerId: row.owner_id ?? undefined,
    cuisineTypes: [],
    order: row.display_order ?? 0,
    customerSearches: row.customer_searches ?? [],
    visibleTagIds: tagMap ? resolveVisibleTags(row.visible_tags, tagMap) : row.visible_tags ?? [],
    fieldVisibility: normalizeFieldVisibility(row.field_visibility),
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

async function establishmentToPayload(establishment: EstablishmentRecord, statusOverride?: StatusDb) {
  const [rubricLookup, subrubricLookup] = await Promise.all([getLookup("rubrics"), getLookup("subrubrics")]);
  const rubricId = rubricLookup.get(establishment.rubricId);
  const subrubricId = subrubricLookup.get(establishment.subrubricId);
  if (!rubricId) throw new Error(`Rubrique introuvable pour ${establishment.name}.`);
  if (!subrubricId) throw new Error(`Sous-rubrique introuvable pour ${establishment.name}.`);
  const slug = normalizeSlug(establishment.slug || establishment.name || establishment.id);
  return {
    external_id: establishment.id,
    rubric_id: rubricId,
    subrubric_id: subrubricId,
    slug,
    name: establishment.name.trim(),
    short_description: establishment.shortDescription ?? "",
    description: establishment.description ?? "",
    address: establishment.address ?? "",
    city: establishment.city ?? "",
    postal_code: establishment.postalCode ?? "",
    arrondissement: establishment.arrondissement ?? "",
    district: establishment.arrondissement ?? "",
    country: establishment.country || "France",
    latitude: normalizeCoordinate(establishment.latitude),
    longitude: normalizeCoordinate(establishment.longitude),
    phone: establishment.phone ?? "",
    whatsapp: establishment.whatsapp ?? "",
    email: establishment.email ?? "",
    instagram: normalizeUrl(establishment.instagram),
    website: normalizeUrl(establishment.website),
    reservation_url: normalizeUrl(establishment.reservationTarget),
    reservation_target: normalizeUrl(establishment.reservationTarget),
    hours: serializeHours(establishment.hours ?? ""),
    amenities: {
      terrace: establishment.terrace,
      privateHire: establishment.privateHire,
    },
    services: {
      delivery: establishment.delivery,
      takeaway: establishment.takeaway,
      reservation: establishment.reservation,
    },
    certification: establishment.certification ?? "",
    kosher_type: establishment.kosherType ?? "À compléter",
    average_price: establishment.averagePrice ?? "",
    customer_searches: establishment.customerSearches ?? [],
    visible_tags: establishment.visibleTagIds ?? [],
    field_visibility: normalizeFieldVisibility(establishment.fieldVisibility),
    display_order: Number(establishment.order) || 0,
    sponsorship: sponsorshipToDb[establishment.sponsorshipLevel ?? "Standard"] ?? "standard",
    sponsor_priority: Number(establishment.sponsorPriority) || 0,
    sponsor_starts_at: establishment.sponsorStartsAt || null,
    sponsor_ends_at: establishment.sponsorEndsAt || null,
    sponsor_placement: establishment.sponsorPlacement ?? "",
    sponsor_notes: establishment.sponsorNotes ?? "",
    reservation_enabled: establishment.reservation,
    status: statusOverride ?? statusToDb[establishment.status] ?? "draft",
    is_visible: establishment.visible ?? true,
    owner_id: establishment.ownerId || null,
    deleted_at: null,
    updated_at: new Date().toISOString(),
  };
}

async function upsertPhotos(establishmentId: string, establishment: EstablishmentRecord) {
  const supabase = getClientOrThrow();
  const urls = [establishment.mainPhoto, ...(establishment.photos ?? [])]
    .map((url) => url?.trim())
    .filter((url, index, list): url is string => Boolean(url) && list.indexOf(url) === index);
  if (!urls.length) {
    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("entity_type", "establishment")
      .eq("entity_id", establishmentId);
    if (deleteError) throw new Error(readableError(deleteError));
    return;
  }
  const payload = urls.map((url, index) => ({
    entity_type: "establishment",
    entity_id: establishmentId,
    url,
    alt: index === 0 ? establishment.name : establishment.photoAlts?.[index - 1] || establishment.name,
    display_order: index + 1,
  }));
  const { data: inserted, error } = await supabase.from("photos").insert(payload).select("id").returns<Array<{ id: string }>>();
  if (error) throw new Error(readableError(error));
  const insertedIds = (inserted ?? []).map((photo) => photo.id);
  if (!insertedIds.length) return;
  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("entity_type", "establishment")
    .eq("entity_id", establishmentId)
    .not("id", "in", `(${insertedIds.join(",")})`);
  if (deleteError) throw new Error(readableError(deleteError));
}

async function upsertEstablishment(establishment: EstablishmentRecord, statusOverride?: StatusDb) {
  const supabase = getClientOrThrow();
  const payload = await establishmentToPayload(establishment, statusOverride);
  if (isUuid(establishment.id)) {
    const { data: updated, error: updateError } = await supabase
      .from("establishments")
      .update(payload)
      .eq("id", establishment.id)
      .select(selectColumns)
      .maybeSingle<EstablishmentRow>();
    if (updateError) throw new Error(readableError(updateError));
    if (updated) {
      await upsertPhotos(updated.id, establishment);
      const photos = await getPhotos([updated.id]);
      return rowToEstablishment(updated, photos.get(updated.id));
    }
  }
  const { data, error } = await supabase
    .from("establishments")
    .upsert(payload, { onConflict: "external_id" })
    .select(selectColumns)
    .single<EstablishmentRow>();
  if (error) throw new Error(readableError(error));
  await upsertPhotos(data.id, establishment);
  const photos = await getPhotos([data.id]);
  return rowToEstablishment(data, photos.get(data.id));
}

export async function listPublishedEstablishments(filters?: EstablishmentFilters) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { rubricId, subrubricId, notFound } = await resolvePublishedFilterIds(filters);
  if (notFound) return [];

  let query = supabase
    .from("establishments")
    .select(selectColumns)
    .eq("status", "published")
    .eq("is_visible", true)
    .is("deleted_at", null)
    .order("display_order", { ascending: true });

  if (rubricId) query = query.eq("rubric_id", rubricId);
  if (subrubricId) query = query.eq("subrubric_id", subrubricId);

  const { data, error } = await query.returns<EstablishmentRow[]>();
  if (error) throw new Error(readableError(error));
  const rows = data ?? [];
  const photos = await getPhotos(rows.map((row) => row.id));
  const tagMap = await getVisibleTagMap();
  return rows.map((row) => rowToEstablishment(row, photos.get(row.id), tagMap));
}

export async function listPublishedEstablishmentCountsBySubrubric(rubricSlug?: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("establishments")
    .select("id,rubric_id,subrubric_id,rubrics(id,external_id,slug),subrubrics(id,external_id,slug)")
    .eq("status", "published")
    .eq("is_visible", true)
    .is("deleted_at", null)
    .returns<EstablishmentCountRow[]>();
  if (error) throw new Error(readableError(error));

  const counts: Record<string, number> = {};
  (data ?? [])
    .filter((row) => !rubricSlug || row.rubrics?.slug === rubricSlug || row.rubrics?.external_id === rubricSlug || row.rubric_id === rubricSlug)
    .forEach((row) => {
      [row.subrubric_id, row.subrubrics?.id, row.subrubrics?.external_id, row.subrubrics?.slug]
        .filter(Boolean)
        .forEach((key) => {
          counts[key as string] = (counts[key as string] ?? 0) + 1;
        });
    });
  return counts;
}

export async function listAllEstablishmentsForAdmin() {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("establishments")
    .select(selectColumns)
    .is("deleted_at", null)
    .order("display_order", { ascending: true })
    .returns<EstablishmentRow[]>();
  if (error) throw new Error(readableError(error));
  const rows = data ?? [];
  const photos = await getPhotos(rows.map((row) => row.id));
  return rows.map((row) => rowToEstablishment(row, photos.get(row.id)));
}

export async function getEstablishmentById(id: string) {
  const supabase = getClientOrThrow();
  const column = isUuid(id) ? "id" : "external_id";
  const { data, error } = await supabase
    .from("establishments")
    .select(selectColumns)
    .eq(column, id)
    .maybeSingle<EstablishmentRow>();
  if (error) throw new Error(readableError(error));
  if (!data) return null;
  const photos = await getPhotos([data.id]);
  return rowToEstablishment(data, photos.get(data.id));
}

export async function createEstablishment(establishment: EstablishmentRecord) {
  return upsertEstablishment(establishment, "draft");
}

export async function updateEstablishment(establishment: EstablishmentRecord) {
  return upsertEstablishment(establishment);
}

export async function publishEstablishment(establishment: EstablishmentRecord) {
  return upsertEstablishment({ ...establishment, status: "Publié", visible: true }, "published");
}

export async function hideEstablishment(establishment: EstablishmentRecord) {
  return upsertEstablishment({ ...establishment, status: "Masqué", visible: false }, "hidden");
}

export async function duplicateEstablishment(establishment: EstablishmentRecord) {
  const baseSlug = normalizeSlug(establishment.slug || establishment.name);
  const suffix = Date.now().toString().slice(-5);
  const copy: EstablishmentRecord = {
    ...establishment,
    id: `${establishment.id}-copy-${Date.now()}`,
    slug: `${baseSlug}-copie-${suffix}`,
    name: `${establishment.name} copie`,
    status: "Brouillon",
    visible: false,
    order: establishment.order + 1,
  };
  return createEstablishment(copy);
}

export async function moveEstablishmentToTrash(establishment: EstablishmentRecord) {
  const supabase = getClientOrThrow();
  const column = isUuid(establishment.id) ? "id" : "external_id";
  const { error } = await supabase
    .from("establishments")
    .update({ status: "trashed", is_visible: false, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq(column, establishment.id);
  if (error) throw new Error(readableError(error));
}

export async function restoreEstablishment(establishment: EstablishmentRecord) {
  return upsertEstablishment({ ...establishment, status: establishment.status === "Masqué" ? "Brouillon" : establishment.status, visible: establishment.visible ?? true });
}

export async function updateEstablishmentOrder(establishments: EstablishmentRecord[]) {
  const supabase = getClientOrThrow();
  const payload = await Promise.all(establishments.map((establishment, index) => establishmentToPayload({ ...establishment, order: index + 1 })));
  const { error } = await supabase.from("establishments").upsert(payload, { onConflict: "external_id" });
  if (error) throw new Error(readableError(error));
  return payload.length;
}

export async function importEstablishmentsIfMissing(establishments: EstablishmentRecord[]) {
  const supabase = getClientOrThrow();
  const imported: EstablishmentRecord[] = [];
  for (const establishment of establishments) {
    const existing = await getEstablishmentById(establishment.id);
    if (existing) {
      imported.push(existing);
      continue;
    }
    imported.push(await upsertEstablishment(establishment));
  }
  const { error } = await supabase.from("establishments").select("id").limit(1);
  if (error) throw new Error(readableError(error));
  return listAllEstablishmentsForAdmin();
}
