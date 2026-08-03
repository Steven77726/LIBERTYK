import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { listPublishedSeoContent } from "@/lib/supabase/server-content";

export const dynamic = "force-static";

function subrubricPath(rubricSlug: string, subrubricSlug: string) {
  if (rubricSlug === "food" && subrubricSlug === "restaurants") return "/food/restaurants";
  if (rubricSlug === "food" && subrubricSlug === "brunch") return "/food/brunch";
  return `/${rubricSlug}?type=${subrubricSlug}`;
}

function establishmentPath(rubricSlug?: string | null, subrubricSlug?: string | null, establishmentSlug?: string | null) {
  if (!rubricSlug || !establishmentSlug) return null;
  if (rubricSlug === "vin-spiritueux") return `/vin-spiritueux/${establishmentSlug}`;
  if (rubricSlug === "food" && subrubricSlug === "restaurants") return `/food/restaurants#${establishmentSlug}`;
  if (rubricSlug === "food" && subrubricSlug === "brunch") return `/food/brunch#${establishmentSlug}`;
  return `/${rubricSlug}${subrubricSlug ? `?type=${subrubricSlug}` : ""}#${establishmentSlug}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { rubrics, subrubrics, establishments } = await listPublishedSeoContent();
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();

  const add = (path: string, item: Omit<MetadataRoute.Sitemap[number], "url"> = {}) => {
    const url = absoluteUrl(path);
    if (!entries.has(url)) entries.set(url, { url, ...item });
  };

  add("/", { changeFrequency: "daily", priority: 1 });

  rubrics.forEach((rubric) => {
    add(`/${rubric.slug}`, {
      lastModified: rubric.updated_at ? new Date(rubric.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.85,
    });
  });

  subrubrics.forEach((subrubric) => {
    const rubricSlug = subrubric.rubrics?.slug;
    if (!rubricSlug) return;
    add(subrubricPath(rubricSlug, subrubric.slug), {
      lastModified: subrubric.updated_at ? new Date(subrubric.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  });

  establishments.forEach((establishment) => {
    const path = establishmentPath(establishment.rubrics?.slug, establishment.subrubrics?.slug, establishment.slug);
    if (!path) return;
    add(path, {
      lastModified: establishment.updated_at ? new Date(establishment.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  return [...entries.values()];
}
