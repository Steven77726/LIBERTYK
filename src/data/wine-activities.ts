export type WineActivity = {
  slug: string;
  title: string;
  type: string;
  address?: string;
  image: string;
  imagePosition?: string;
  tags: string[];
  description: string;
  action: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
};

export const wineActivities: WineActivity[] = [
  {
    slug: "winess",
    title: "Winess",
    type: "Caviste",
    address: "42 rue des Acacias, 75017 Paris",
    image: "/images/winess/winess-shop.webp",
    tags: ["🍷 Caviste"],
    description: "Une sélection exigeante de vins, champagnes et spiritueux au cœur du 17e arrondissement.",
    action: "Visiter le site",
    website: "https://winess.com/",
  },
  {
    slug: "winess-experience",
    title: "Winess Experience",
    type: "Dégustations de vins privées",
    address: "42 rue des Acacias, 75017 Paris",
    image: "/images/winess/winess-experience.webp",
    tags: ["🍷 Dégustation privée", "🥂 Masterclass", "🍇 Vins du monde"],
    description: "Des expériences privées et des masterclass guidées pour découvrir le vin autrement.",
    action: "Découvrir l’expérience",
  },
  {
    slug: "winess-signature",
    title: "Winess Signature",
    type: "Bar mobile",
    image: "/images/winess/winess-signature.jpeg",
    imagePosition: "center 42%",
    tags: ["💍 Mariage", "🎉 Événements", "🎂 Anniversaire", "🍸 Cocktails", "🍷 Bar à vin"],
    description: "Un bar mobile élégant et entièrement personnalisé pour donner une vraie signature à vos événements.",
    action: "Demander un devis",
  },
  {
    slug: "pinot-noah",
    title: "Pinot Noah",
    type: "Wine Tour",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1400&q=85",
    tags: ["🍇 Wine Tour", "✈️ Voyage", "🍷 Découverte des vignobles"],
    description: "Des escapades œnologiques pensées pour rencontrer les domaines et vivre les vignobles de l’intérieur.",
    action: "Découvrir",
  },
];

export const wineActivityBySlug = Object.fromEntries(wineActivities.map((activity) => [activity.slug, activity]));
