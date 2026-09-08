import { categories } from "../src/data/categories";
import { localSubrubrics, subrubricSlugAliases } from "../src/data/subrubrics";
import { localEstablishments } from "../src/data/establishments";
import { restaurants } from "../src/data/restaurants";

console.log("=== 1. AUDIT DES CATÉGORIES EN SOMMEIL / MASQUÉES ===");
const dormantCheck = ["voyages", "religion", "chauffeurs"];
dormantCheck.forEach((slug) => {
  const cat = categories.find((c) => c.slug === slug);
  console.log(`Catégorie [${slug}]:`, {
    label: cat?.label,
    status: cat?.status,
    isDormant: cat?.isDormant,
    featured: cat?.featured,
  });
  const subs = localSubrubrics.filter((s) => s.rubricId === slug);
  console.log(`  Sous-rubriques [${slug}] (${subs.length}):`);
  subs.forEach((s) => {
    console.log(`   - slug: ${s.slug}, name: ${s.name}, isDormant: ${s.isDormant}, status: ${s.status}`);
  });
});

console.log("\n=== 2. AUDIT DES FILTRES DE RENDU SHOPPING & SORTIES ===");

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function getCanonicalSubrubricSlug(slugOrNameOrId: string, rubricSlug: string): string {
  if (!slugOrNameOrId) return "";
  const clean = slugify(slugOrNameOrId).toLowerCase().replace(new RegExp(`^(${rubricSlug}|rubric-${rubricSlug})-`), "");
  return (subrubricSlugAliases as Record<string, string>)[`${rubricSlug}-${clean}`] || (subrubricSlugAliases as Record<string, string>)[clean] || clean;
}

const SHOPPING_WHITELIST_SLUGS = new Set([
  "vetement-masculin",
  "vetement-feminin",
  "objet-utile",
]);

const SORTIES_WHITELIST_SLUGS = new Set([
  "evenements",
  "concerts",
  "concert",
  "soirees-celibataires",
  "soirees-celibataire",
  "soiree-celibataires",
  "soiree-celibataire",
  "soirees-celibatiare",
  "celibataire",
  "celibataires",
]);

function applyWhitelists<T extends { slug?: string; name?: string; id?: string }>(items: T[], rubricSlug: string): T[] {
  if (rubricSlug === "shopping" || rubricSlug === "rubric-shopping") {
    return items.filter((item) => {
      const slug = getCanonicalSubrubricSlug(item.slug || item.name || item.id || "", "shopping");
      return (
        SHOPPING_WHITELIST_SLUGS.has(slug) ||
        slug.includes("masculin") ||
        slug.includes("feminin") ||
        slug.includes("objet") ||
        slug.includes("utile")
      );
    });
  }
  if (rubricSlug === "sorties" || rubricSlug === "rubric-sorties") {
    return items.filter((item) => {
      const slug = getCanonicalSubrubricSlug(item.slug || item.name || item.id || "", "sorties");
      return (
        SORTIES_WHITELIST_SLUGS.has(slug) ||
        slug.includes("evenement") ||
        slug.includes("concert") ||
        slug.includes("celibat") ||
        slug.includes("soiree")
      );
    });
  }
  return items;
}

// Test shopping fallback
const rawShopping = localSubrubrics.filter((s) => s.rubricId === "shopping");
const whitelistedShopping = applyWhitelists(rawShopping, "shopping");
console.log(`Shopping fallback brut (${rawShopping.length} items):`, rawShopping.map((s) => `${s.slug} (${s.name})`));
console.log(`Shopping filtré (${whitelistedShopping.length} items):`, whitelistedShopping.map((s) => `${s.slug} (${s.name})`));

// Test sorties fallback
const rawSorties = localSubrubrics.filter((s) => s.rubricId === "sorties");
const whitelistedSorties = applyWhitelists(rawSorties, "sorties");
console.log(`\nSorties fallback brut (${rawSorties.length} items):`, rawSorties.map((s) => `${s.slug} (${s.name})`));
console.log(`Sorties filtré (${whitelistedSorties.length} items):`, whitelistedSorties.map((s) => `${s.slug} (${s.name})`));

// Test with rogue / unwhitelisted items injected (simulating external Supabase or dirty localStorage)
console.log("\n=== Test d'injection d'éléments non autorisés ===");
const dirtyShopping = [
  ...rawShopping,
  { id: "rogue-1", rubricId: "shopping", slug: "mode", name: "Mode" },
  { id: "rogue-2", rubricId: "shopping", slug: "enfants", name: "Enfants" },
  { id: "rogue-3", rubricId: "shopping", slug: "boutique-inconnue", name: "Boutique Inconnue" },
];
const filteredDirtyShopping = applyWhitelists(dirtyShopping, "shopping");
console.log(`Shopping pollué injecté (${dirtyShopping.length}) -> Filtré (${filteredDirtyShopping.length}):`, filteredDirtyShopping.map((s) => `${s.slug} (${s.name})`));

const dirtySorties = [
  ...rawSorties,
  { id: "rogue-4", rubricId: "sorties", slug: "degustation-vins", name: "Dégustation Vins" },
  { id: "rogue-5", rubricId: "sorties", slug: "theatre-inconnu", name: "Théâtre Inconnu" },
];
const filteredDirtySorties = applyWhitelists(dirtySorties, "sorties");
console.log(`Sorties pollué injecté (${dirtySorties.length}) -> Filtré (${filteredDirtySorties.length}):`, filteredDirtySorties.map((s) => `${s.slug} (${s.name})`));

console.log("\n=== 3. VÉRIFICATION D'ABSENCE TOTALE DE PITZMAN ===");
const pitzmanInRestaurants = restaurants.filter((r) => r.name.toLowerCase().includes("pitzman") || r.id.toLowerCase().includes("pitzman"));
const pitzmanInEstablishments = localEstablishments.filter((e) => e.name.toLowerCase().includes("pitzman") || e.id.toLowerCase().includes("pitzman"));
console.log("Pitzman dans restaurants.ts:", pitzmanInRestaurants.length);
console.log("Pitzman dans localEstablishments:", pitzmanInEstablishments.length);
