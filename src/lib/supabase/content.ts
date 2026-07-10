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

type AdminStateSearchPreview = {
  rubrics?: Array<{ id: string; slug?: string; name: string; description?: string; image?: string; status: string; searchKeywords?: string[] }>;
  subrubrics?: Array<{ id: string; rubricId: string; slug?: string; name: string; description?: string; photo?: string; status: string; searchKeywords?: string[] }>;
  establishments?: Array<{
    id: string;
    rubricId: string;
    subrubricId: string;
    slug?: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    arrondissement?: string;
    postalCode?: string;
    certification?: string;
    kosherType?: string;
    averagePrice?: string;
    latitude?: string;
    longitude?: string;
    customerSearches?: string[];
    visibleTagIds?: string[];
    mainPhoto?: string;
    status: string;
    visible?: boolean;
    sponsored?: boolean;
    sponsorshipLevel?: string;
    sponsorPriority?: number;
    terrace?: boolean;
    delivery?: boolean;
    takeaway?: boolean;
    reservation?: boolean;
    order?: number;
  }>;
  tags?: Array<{ id: string; label: string; status?: string }>;
};

const ADMIN_STORAGE_KEY = "liberty-admin-dashboard-v1";
const ADMIN_STATE_KEY = "admin_state";

function adminStateToSearchItems(state: AdminStateSearchPreview | null | undefined): SearchItem[] {
  if (!state?.establishments?.length) return [];
  const rubrics = new Map((state.rubrics ?? []).map((rubric) => [rubric.id, rubric]));
  const subrubrics = new Map((state.subrubrics ?? []).map((subrubric) => [subrubric.id, subrubric]));
  const tags = new Map((state.tags ?? []).map((tag) => [tag.id, tag]));

  return state.establishments
    .filter((item) => item.status === "Publié" && item.visible !== false)
    .map((item) => {
      const rubric = rubrics.get(item.rubricId);
      const subrubric = subrubrics.get(item.subrubricId);
      const visibleTags = (item.visibleTagIds ?? [])
        .flatMap((id) => {
          const tag = tags.get(id);
          return tag && tag.status !== "Masqué" ? [tag.label] : [];
        });
      const category = rubric?.name ?? "Établissement";
      const subcategory = subrubric?.name;
      const customerSearches = item.customerSearches ?? [];
      const href = `/${rubric?.slug ?? rubric?.id ?? "food"}/${subrubric?.slug ?? ""}#${item.slug ?? item.id}`.replace(/\/#/g, "#");
      return {
        id: `admin-${item.id}`,
        title: item.name,
        subtitle: [subcategory, item.address, item.city].filter(Boolean).join(" · "),
        category,
        subcategory,
        href,
        image: item.mainPhoto || subrubric?.photo || rubric?.image || "/images/food/restaurants-khan.jpg",
        customerSearches,
        keywords: buildInvisibleKeywords([
          item.name,
          item.description ?? "",
          item.address ?? "",
          item.city ?? "",
          item.arrondissement ?? "",
          item.postalCode ?? "",
          item.certification ?? "",
          item.kosherType ?? "",
          item.averagePrice ?? "",
          ...(rubric?.searchKeywords ?? []),
          ...(subrubric?.searchKeywords ?? []),
          ...visibleTags,
          ...customerSearches,
        ], { category, location: `${item.city ?? ""} ${item.arrondissement ?? ""} ${item.postalCode ?? ""}` }),
        location: {
          city: item.city,
          arrondissement: item.arrondissement?.replace(/\D/g, "") || undefined,
          postalCode: item.postalCode,
          latitude: Number(item.latitude) || undefined,
          longitude: Number(item.longitude) || undefined,
        },
        filters: {
          certification: item.certification,
          kosherType: item.kosherType,
          terrace: item.terrace,
          delivery: item.delivery,
          takeaway: item.takeaway,
          reservation: item.reservation,
          price: item.averagePrice,
        },
        ranking: {
          sponsored: item.sponsored || item.sponsorshipLevel !== "Standard",
          popularity: item.sponsorshipLevel === "Partenaire officiel" ? 88 : item.sponsored ? 70 : 36,
          favorites: 0,
          reviewCount: 0,
        },
      };
    });
}

function fetchLocalAdminSearchItems() {
  try {
    const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    return adminStateToSearchItems(raw ? JSON.parse(raw) as AdminStateSearchPreview : null);
  } catch {
    return [];
  }
}

async function fetchAdminStateSearchItems() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fetchLocalAdminSearchItems();
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", ADMIN_STATE_KEY).maybeSingle();
  if (error || !data?.value) return fetchLocalAdminSearchItems();
  return adminStateToSearchItems(data.value as AdminStateSearchPreview);
}

export async function fetchSupabaseSearchItems(): Promise<SearchItem[] | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fetchLocalAdminSearchItems();

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

  const adminItems = await fetchAdminStateSearchItems();
  if (error) return adminItems.length ? adminItems : null;

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
  return [...adminItems, ...establishmentItems];
}
