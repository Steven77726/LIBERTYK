"use client";

import { buildInvisibleKeywords, type SearchItem } from "@/lib/search-engine";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SupabaseEstablishmentRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  arrondissement: string | null;
  certification: string | null;
  kosher_type: string | null;
  average_price: string | null;
  latitude: number | null;
  longitude: number | null;
  customer_searches: string[] | null;
  visible_tags: string[] | null;
  sponsorship: "standard" | "sponsored" | "partner";
  sponsor_priority: number | null;
  photos?: { url: string; display_order: number }[];
  rubrics?: { name: string; slug: string } | null;
  subrubrics?: { name: string; slug: string } | null;
};

export async function fetchSupabaseSearchItems(): Promise<SearchItem[] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("establishments")
    .select(`
      id, slug, name, description, address, city, arrondissement, certification, kosher_type,
      average_price, latitude, longitude, customer_searches, visible_tags, sponsorship, sponsor_priority,
      rubrics(name, slug),
      subrubrics(name, slug),
      photos(url, display_order)
    `)
    .eq("status", "published")
    .order("sponsor_priority", { ascending: true })
    .returns<SupabaseEstablishmentRow[]>();

  if (error) return null;

  const establishmentItems = (data ?? []).map((item) => {
    const mainPhoto = [...(item.photos ?? [])].sort((a, b) => a.display_order - b.display_order)[0]?.url ?? "";
    const customerSearches = item.customer_searches ?? [];
    const category = item.rubrics?.name ?? "Établissement";
    const subcategory = item.subrubrics?.name ?? undefined;
    return {
      id: `supabase-${item.id}`,
      title: item.name,
      subtitle: [subcategory, item.address, item.city].filter(Boolean).join(" · "),
      category,
      subcategory,
      href: `/${item.rubrics?.slug ?? "food"}/${item.subrubrics?.slug ?? ""}#${item.slug}`.replace(/\/#/g, "#"),
      image: mainPhoto,
      customerSearches,
      keywords: buildInvisibleKeywords([
        item.name,
        item.description ?? "",
        item.address ?? "",
        item.city ?? "",
        item.arrondissement ?? "",
        item.certification ?? "",
        item.kosher_type ?? "",
        ...(item.visible_tags ?? []),
        ...customerSearches,
      ], { category, location: `${item.city ?? ""} ${item.arrondissement ?? ""}` }),
      location: {
        city: item.city ?? undefined,
        arrondissement: item.arrondissement?.replace(/\D/g, "") || undefined,
        latitude: item.latitude ?? undefined,
        longitude: item.longitude ?? undefined,
      },
      filters: {
        certification: item.certification ?? undefined,
        kosherType: item.kosher_type ?? undefined,
        price: item.average_price ?? undefined,
      },
      ranking: {
        sponsored: item.sponsorship !== "standard",
        popularity: item.sponsorship === "partner" ? 90 : item.sponsorship === "sponsored" ? 75 : 40,
      },
    };
  });
  return establishmentItems;
}
