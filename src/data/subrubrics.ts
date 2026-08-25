import { categories } from "@/data/categories";

export type LocalSubrubric = {
  id: string;
  rubricId: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  imageAlt: string;
  showPublicly: boolean;
  format: "Carré standard";
  columnsDesktop: 3;
  columnsTablet: 2;
  columnsMobile: 1;
  searchKeywords: string[];
  order: number;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const foodImages: Record<string, string> = {
  restaurants: "/images/food/restaurants-khan.jpg",
  brunch: "/images/food/brunch-marceau.jpg",
  "salons-de-the": "/images/food/salon-de-the.webp",
  patisseries: "/images/food/patisserie.webp",
  traiteurs: "/images/food/traiteur.jpg",
  "traiteur-chabbat": "/images/food/traiteur.jpg",
  "fast-food": "/images/food/fast-food.jpg",
  "street-food": "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=900&q=85",
  boulangeries: "/images/food/boulangerie.jpg",
  glaciers: "/images/food/glacier.webp",
};

const foodDescriptions: Record<string, string> = {
  restaurants: "Les tables incontournables",
  brunch: "Pour prendre le temps",
  "salons-de-the": "Douceurs et conversations",
  patisseries: "Créations gourmandes",
  traiteurs: "Pour recevoir sans compromis",
  "traiteur-chabbat": "Vos repas de Shabbat, prêts avec soin",
  "fast-food": "Rapide et généreux",
  "street-food": "Saveurs sur le pouce",
  boulangeries: "Le goût du savoir-faire",
  glaciers: "Fraîcheur et plaisir",
};

const foodExtra = [
  "Restaurants",
  "Brunch",
  "Salons de thé",
  "Pâtisseries",
  "Traiteurs",
  "Traiteur Chabbat",
  "Fast-food",
  "Street Food",
  "Boulangeries",
  "Glaciers",
];

const subrubricSlugOverrides: Record<string, string> = {
  "mariage-Déco": "deco-mariage",
  "mariage-Traiteur Mariage": "traiteur-mariage",
  "mariage-Salle de Réception": "salle-de-reception",
  "mariage-Photographe / Vidéaste": "photographe-videaste",
  "mariage-Orchestre / DJ": "orchestre-dj",
};

const specificSubrubricImages: Record<string, { image: string; description: string }> = {
  "mariage-deco-mariage": {
    image: "/images/mariage/kinor-decor.jpg",
    description: "Créations florales, scénographie et décors de mariage d'exception.",
  },
  "mariage-decor": {
    image: "/images/mariage/kinor-decor.jpg",
    description: "Créations florales, scénographie et décors de mariage d'exception.",
  },
  "mariage-deco": {
    image: "/images/mariage/kinor-decor.jpg",
    description: "Créations florales, scénographie et décors de mariage d'exception.",
  },
};

function createSubrubric(rubricId: string, name: string, order: number, image: string, description?: string, customSlug?: string): LocalSubrubric {
  const slug = customSlug || subrubricSlugOverrides[`${rubricId}-${name}`] || slugify(name);
  return {
    id: `${rubricId}-${slug}`,
    rubricId,
    slug,
    name,
    description: description || `${name} sélectionnés dans Liberty K.`,
    icon: name,
    image,
    imageAlt: name,
    showPublicly: true,
    format: "Carré standard",
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    searchKeywords: [name, slug.replace(/-/g, " "), rubricId].filter(Boolean),
    order,
  };
}

const categorySubrubrics = categories.flatMap((category) =>
  category.featured.map((item, index) => {
    const slug = subrubricSlugOverrides[`${category.slug}-${item}`] || slugify(item);
    const key = `${category.slug}-${slug}`;
    const specific = specificSubrubricImages[key] || specificSubrubricImages[`${category.slug}-${slugify(item)}`];
    return createSubrubric(
      category.slug,
      item,
      index + 1,
      specific?.image ?? category.image,
      specific?.description,
      slug
    );
  }),
);

const foodSubrubrics = foodExtra.map((name, index) => {
  const slug = slugify(name);
  return createSubrubric("food", name, index + 1, foodImages[slug] ?? "/images/food/restaurants-khan.jpg", foodDescriptions[slug]);
});

const map = new Map<string, LocalSubrubric>();
[...categorySubrubrics, ...foodSubrubrics].forEach((item) => map.set(item.id, item));

// Ajouter des alias de compatibilité pour éviter tout conflit de mapping CMS
if (map.has("mariage-deco-mariage")) {
  const base = map.get("mariage-deco-mariage")!;
  map.set("mariage-decor", { ...base, id: "mariage-decor", slug: "decor" });
  map.set("mariage-deco", { ...base, id: "mariage-deco", slug: "deco" });
}

export const localSubrubrics = [...map.values()];
