import { createClient } from "@supabase/supabase-js";
import { categories } from "@/data/categories";
import { localSubrubrics } from "@/data/subrubrics";

type PublishedRubricRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  display_order: number | null;
  updated_at: string | null;
};

type PublishedSubrubricRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  display_order: number | null;
  updated_at: string | null;
  rubrics: { slug: string | null; name: string | null } | null;
};

type PublishedEstablishmentRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  arrondissement: string | null;
  country: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  phone: string | null;
  website: string | null;
  updated_at: string | null;
  rubrics: { slug: string | null; name: string | null } | null;
  subrubrics: { slug: string | null; name: string | null } | null;
  photos: { url: string; alt: string | null; display_order: number | null }[] | null;
};

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function listPublishedSeoContent() {
  const supabase = getServerClient();

  if (!supabase) {
    return {
      rubrics: categories.map((category, index) => ({
        id: category.slug,
        slug: category.slug,
        name: category.label,
        description: category.description,
        image_url: category.image,
        image_alt: category.label,
        display_order: index + 1,
        updated_at: null,
      })),
      subrubrics: localSubrubrics.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        image_url: item.image,
        image_alt: item.imageAlt,
        display_order: item.order,
        updated_at: null,
        rubrics: { slug: item.rubricId, name: categories.find((category) => category.slug === item.rubricId)?.label ?? item.rubricId },
      })),
      establishments: [],
    };
  }

  const [rubricsResult, subrubricsResult, establishmentsResult] = await Promise.all([
    supabase
      .from("rubrics")
      .select("id,slug,name,description,image_url,image_alt,display_order,updated_at")
      .eq("status", "published")
      .eq("show_on_home", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })
      .returns<PublishedRubricRow[]>(),
    supabase
      .from("subrubrics")
      .select("id,slug,name,description,image_url,image_alt,display_order,updated_at,rubrics(slug,name)")
      .eq("status", "published")
      .eq("show_publicly", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })
      .returns<PublishedSubrubricRow[]>(),
    supabase
      .from("establishments")
      .select("id,slug,name,short_description,description,address,city,postal_code,arrondissement,country,latitude,longitude,phone,website,updated_at,rubrics(slug,name),subrubrics(slug,name),photos(url,alt,display_order)")
      .eq("status", "published")
      .eq("is_visible", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })
      .returns<PublishedEstablishmentRow[]>(),
  ]);

  return {
    rubrics: rubricsResult.data?.length ? rubricsResult.data : categories.map((category, index) => ({
      id: category.slug,
      slug: category.slug,
      name: category.label,
      description: category.description,
      image_url: category.image,
      image_alt: category.label,
      display_order: index + 1,
      updated_at: null,
    })),
    subrubrics: subrubricsResult.data?.length ? subrubricsResult.data : localSubrubrics.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      image_url: item.image,
      image_alt: item.imageAlt,
      display_order: item.order,
      updated_at: null,
      rubrics: { slug: item.rubricId, name: categories.find((category) => category.slug === item.rubricId)?.label ?? item.rubricId },
    })),
    establishments: establishmentsResult.data ?? [],
  };
}
