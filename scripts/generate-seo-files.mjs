import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SITE_ORIGIN = "https://steven77726.github.io";
const SITE_BASE_PATH = "/LIBERTYK";
const SITE_URL = `${SITE_ORIGIN}${SITE_BASE_PATH}`;
const PUBLIC_DIR = path.join(process.cwd(), "public");

const fallbackRubrics = [
  "food",
  "sorties",
  "voyages",
  "shopping",
  "vin-spiritueux",
  "mariage",
  "sport",
  "religion",
  "enfants",
  "chauffeurs",
  "calendrier-juif",
  "mikve",
].map((slug, index) => ({ slug, updated_at: null, display_order: index + 1 }));

function absoluteUrl(route = "/") {
  const normalized = route.startsWith("/") ? route : `/${route}`;
  return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

function xmlEscape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function subrubricPath(rubricSlug, subrubricSlug) {
  if (rubricSlug === "food" && subrubricSlug === "restaurants") return "/food/restaurants";
  if (rubricSlug === "food" && subrubricSlug === "brunch") return "/food/brunch";
  return `/${rubricSlug}?type=${subrubricSlug}`;
}

function establishmentPath(rubricSlug, subrubricSlug, establishmentSlug) {
  if (!rubricSlug || !establishmentSlug) return null;
  if (rubricSlug === "vin-spiritueux") return `/vin-spiritueux/${establishmentSlug}`;
  if (rubricSlug === "food" && subrubricSlug === "restaurants") return `/food/restaurants#${establishmentSlug}`;
  if (rubricSlug === "food" && subrubricSlug === "brunch") return `/food/brunch#${establishmentSlug}`;
  return `/${rubricSlug}${subrubricSlug ? `?type=${subrubricSlug}` : ""}#${establishmentSlug}`;
}

async function loadSeoContent() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { rubrics: fallbackRubrics, subrubrics: [], establishments: [] };

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [rubricsResult, subrubricsResult, establishmentsResult] = await Promise.all([
    supabase
      .from("rubrics")
      .select("slug,display_order,updated_at")
      .eq("status", "published")
      .eq("show_on_home", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true }),
    supabase
      .from("subrubrics")
      .select("slug,display_order,updated_at,rubrics(slug)")
      .eq("status", "published")
      .eq("show_publicly", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true }),
    supabase
      .from("establishments")
      .select("slug,updated_at,rubrics(slug),subrubrics(slug)")
      .eq("status", "published")
      .eq("is_visible", true)
      .is("deleted_at", null)
      .order("display_order", { ascending: true }),
  ]);

  return {
    rubrics: rubricsResult.data?.length ? rubricsResult.data : fallbackRubrics,
    subrubrics: subrubricsResult.data ?? [],
    establishments: establishmentsResult.data ?? [],
  };
}

function add(entries, route, options = {}) {
  const url = absoluteUrl(route);
  if (!entries.has(url)) entries.set(url, { url, ...options });
}

function renderSitemap(entries) {
  const urls = [...entries.values()].map((entry) => {
    const lastmod = entry.lastModified ? `\n<lastmod>${xmlEscape(entry.lastModified)}</lastmod>` : "";
    return `<url>\n<loc>${xmlEscape(entry.url)}</loc>${lastmod}\n<changefreq>${entry.changeFrequency}</changefreq>\n<priority>${entry.priority}</priority>\n</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

function renderRobots() {
  return [
    "User-Agent: *",
    `Allow: ${SITE_BASE_PATH}/`,
    `Disallow: ${SITE_BASE_PATH}/admin`,
    `Disallow: ${SITE_BASE_PATH}/mon-compte`,
    `Disallow: ${SITE_BASE_PATH}/mes-favoris`,
    `Disallow: ${SITE_BASE_PATH}/api/`,
    `Disallow: ${SITE_BASE_PATH}/*draft*`,
    `Disallow: ${SITE_BASE_PATH}/*preview*`,
    "",
    `Host: ${SITE_URL}`,
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

const { rubrics, subrubrics, establishments } = await loadSeoContent();
const entries = new Map();

add(entries, "/", { changeFrequency: "daily", priority: "1" });
rubrics.forEach((rubric) => add(entries, `/${rubric.slug}`, {
  lastModified: rubric.updated_at ? new Date(rubric.updated_at).toISOString() : undefined,
  changeFrequency: "weekly",
  priority: "0.85",
}));
subrubrics.forEach((subrubric) => {
  const rubricSlug = Array.isArray(subrubric.rubrics) ? subrubric.rubrics[0]?.slug : subrubric.rubrics?.slug;
  if (!rubricSlug) return;
  add(entries, subrubricPath(rubricSlug, subrubric.slug), {
    lastModified: subrubric.updated_at ? new Date(subrubric.updated_at).toISOString() : undefined,
    changeFrequency: "weekly",
    priority: "0.75",
  });
});
establishments.forEach((establishment) => {
  const rubricSlug = Array.isArray(establishment.rubrics) ? establishment.rubrics[0]?.slug : establishment.rubrics?.slug;
  const subrubricSlug = Array.isArray(establishment.subrubrics) ? establishment.subrubrics[0]?.slug : establishment.subrubrics?.slug;
  const route = establishmentPath(rubricSlug, subrubricSlug, establishment.slug);
  if (!route) return;
  add(entries, route, {
    lastModified: establishment.updated_at ? new Date(establishment.updated_at).toISOString() : undefined,
    changeFrequency: "weekly",
    priority: "0.7",
  });
});

fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), renderSitemap(entries));
fs.writeFileSync(path.join(PUBLIC_DIR, "robots.txt"), renderRobots());
console.log(`Generated SEO files: ${entries.size} sitemap URLs`);
