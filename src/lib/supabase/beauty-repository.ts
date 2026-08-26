"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BeautyCategory, BeautyProfessionalService, BeautyService } from "@/lib/beauty/types";

type BeautyCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type BeautyServiceRow = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  beauty_categories?: { name: string; slug: string } | null;
};

type ProfessionalServiceRow = {
  id: string;
  professional_id: string;
  service_id: string;
  price: number | string | null;
  price_from: boolean | null;
  duration_minutes: number | null;
  at_home: boolean | null;
  on_site: boolean | null;
  active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  beauty_services?: {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    beauty_categories?: { name: string; slug: string } | null;
  } | null;
};

function readableError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  return "Erreur Supabase inconnue.";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function getClientOrThrow() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Connexion Supabase non configurée.");
  return supabase;
}

function categoryFromRow(row: BeautyCategoryRow): BeautyCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    displayOrder: row.display_order ?? 0,
    active: row.active !== false,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function serviceFromRow(row: BeautyServiceRow): BeautyService {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.beauty_categories?.name,
    categorySlug: row.beauty_categories?.slug,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    displayOrder: row.display_order ?? 0,
    active: row.active !== false,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function professionalServiceFromRow(row: ProfessionalServiceRow): BeautyProfessionalService {
  const price = row.price === null ? null : Number(row.price);
  return {
    id: row.id,
    professionalId: row.professional_id,
    serviceId: row.service_id,
    categoryId: row.beauty_services?.category_id,
    categoryName: row.beauty_services?.beauty_categories?.name,
    categorySlug: row.beauty_services?.beauty_categories?.slug,
    serviceName: row.beauty_services?.name,
    serviceSlug: row.beauty_services?.slug,
    price: Number.isFinite(price) ? price : null,
    priceFrom: row.price_from === true,
    durationMinutes: row.duration_minutes,
    atHome: row.at_home === true,
    onSite: row.on_site !== false,
    active: row.active !== false,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export async function listBeautyCategories(options: { admin?: boolean } = {}) {
  const supabase = getClientOrThrow();
  let query = supabase.from("beauty_categories").select("id,name,slug,description,display_order,active,created_at,updated_at").order("display_order", { ascending: true });
  if (!options.admin) query = query.eq("active", true);
  const { data, error } = await query.returns<BeautyCategoryRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? []).map(categoryFromRow);
}

export async function upsertBeautyCategory(category: BeautyCategory) {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("beauty_categories")
    .upsert({
      id: category.id?.startsWith("beauty-category-") ? undefined : category.id,
      name: category.name.trim(),
      slug: slugify(category.slug || category.name),
      description: category.description ?? "",
      display_order: Number(category.displayOrder) || 0,
      active: category.active,
      updated_at: new Date().toISOString(),
    }, { onConflict: "slug" })
    .select("id,name,slug,description,display_order,active,created_at,updated_at")
    .single<BeautyCategoryRow>();
  if (error) throw new Error(readableError(error));
  return categoryFromRow(data);
}

export async function listBeautyServices(options: { admin?: boolean; categoryId?: string } = {}) {
  const supabase = getClientOrThrow();
  let query = supabase
    .from("beauty_services")
    .select("id,category_id,name,slug,description,display_order,active,created_at,updated_at,beauty_categories(name,slug)")
    .order("display_order", { ascending: true });
  if (!options.admin) query = query.eq("active", true);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);
  const { data, error } = await query.returns<BeautyServiceRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? []).map(serviceFromRow);
}

export async function upsertBeautyService(service: BeautyService) {
  const supabase = getClientOrThrow();
  const { data, error } = await supabase
    .from("beauty_services")
    .upsert({
      id: service.id?.startsWith("beauty-service-") ? undefined : service.id,
      category_id: service.categoryId,
      name: service.name.trim(),
      slug: slugify(service.slug || service.name),
      description: service.description ?? "",
      display_order: Number(service.displayOrder) || 0,
      active: service.active,
      updated_at: new Date().toISOString(),
    }, { onConflict: "category_id,slug" })
    .select("id,category_id,name,slug,description,display_order,active,created_at,updated_at,beauty_categories(name,slug)")
    .single<BeautyServiceRow>();
  if (error) throw new Error(readableError(error));
  return serviceFromRow(data);
}

export async function listProfessionalServices(professionalIds?: string[]) {
  const supabase = getClientOrThrow();
  let query = supabase
    .from("professional_services")
    .select("id,professional_id,service_id,price,price_from,duration_minutes,at_home,on_site,active,display_order,created_at,updated_at,beauty_services(id,category_id,name,slug,beauty_categories(name,slug))")
    .order("display_order", { ascending: true });
  if (professionalIds?.length) query = query.in("professional_id", professionalIds);
  const { data, error } = await query.returns<ProfessionalServiceRow[]>();
  if (error) throw new Error(readableError(error));
  return (data ?? []).map(professionalServiceFromRow);
}

export async function replaceProfessionalServices(professionalId: string, services: BeautyProfessionalService[]) {
  const supabase = getClientOrThrow();
  const activeServices = services
    .filter((item) => item.serviceId)
    .map((item, index) => ({
      professional_id: professionalId,
      service_id: item.serviceId,
      price: item.price ?? null,
      price_from: item.priceFrom,
      duration_minutes: item.durationMinutes ?? null,
      at_home: item.atHome,
      on_site: item.onSite,
      active: item.active,
      display_order: item.displayOrder || index + 1,
      updated_at: new Date().toISOString(),
    }));

  if (activeServices.length) {
    const { error: upsertError } = await supabase
      .from("professional_services")
      .upsert(activeServices, { onConflict: "professional_id,service_id" });
    if (upsertError) throw new Error(readableError(upsertError));
  }

  const keepServiceIds = activeServices.map((item) => item.service_id);
  let deleteQuery = supabase.from("professional_services").delete().eq("professional_id", professionalId);
  if (keepServiceIds.length) deleteQuery = deleteQuery.not("service_id", "in", `(${keepServiceIds.join(",")})`);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw new Error(readableError(deleteError));

  return listProfessionalServices([professionalId]);
}
