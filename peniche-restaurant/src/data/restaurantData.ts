export interface MenuItem {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  category: 'entrees' | 'plats' | 'desserts' | 'degustation' | 'vins' | 'cocktails';
  badge?: string;
  pairing?: string;
  dietary?: string[];
  image: string;
  highlight?: boolean;
}

export interface TastingMenu {
  id: string;
  name: string;
  subtitle: string;
  courses: number;
  price: number;
  winePairingPrice?: number;
  description: string;
  steps: { courseName: string; dish: string; wine?: string }[];
  highlight?: boolean;
}

export const RESTAURANT_INFO = {
  name: "L'ÉCRIN D'O",
  baseline: "Haute Gastronomie & Salons Flottants sur la Seine",
  address: "Port de Debilly — Face à la Tour Eiffel, 75016 Paris",
  metro: "Métro Iéna (Ligne 9) / Pont de l'Alma (RER C)",
  phone: "+33 (0)1 45 28 90 90",
  email: "reservations@lecrindo-paris.fr",
  valet: "Service Voiturier Privé au Port de Debilly",
  services: [
    { title: "Dîner Prestige & Ambiance Feutrée", hours: "Mardi au Dimanche : 19h30 — 00h30" },
    { title: "Déjeuner Panoramique au Fil de l'Eau", hours: "Vendredi au Dimanche : 12h00 — 15h30" },
    { title: "Bar à Cocktails & Champagne d'Étrave", hours: "Chaque soir dès 18h30 jusqu'à 01h30" }
  ],
  decks: [
    {
      id: "panoramique",
      name: "Pont Supérieur Panoramique",
      description: "Vue spectaculaire à 360° sur la Tour Eiffel scintillante et les ponts historiques de Paris sous une verrière chauffée.",
      tag: "Vue Iconique Tour Eiffel"
    },
    {
      id: "salon-prive",
      name: "Salon Privé d'Étrave",
      description: "Cadre confidentiel en acajou précieux, assises de cuir capitonné noir et dorures champagne pour vos réceptions d'exception.",
      tag: "Prestige & Intimité"
    },
    {
      id: "terrasse-eau",
      name: "Terrasse Flottante au Ras de l'Eau",
      description: "La sensation magique d'effleurer les clapotis de la Seine avec braséros design et plaids en cachemire.",
      tag: "Ambiance Lounge"
    }
  ]
};

export const MENU_ITEMS: MenuItem[] = [
  // --- ENTRÉES ---
  {
    id: "e1",
    name: "Carpaccio de Bar Sauvage & Caviar Impérial",
    subtitle: "Agrumes de Menton et émulsion de salicorne",
    description: "Fines tranches de bar de ligne mariné à l'huile d'olive de Kalamata fumée au bois de hêtre, perles de caviar Osciètre sélection prestige, gelée d'eau de mer iodée.",
    price: 38,
    category: "entrees",
    badge: "Signature du Chef",
    pairing: "Chablis Premier Cru 'Fourchaume' 2021",
    dietary: ["Sans Gluten", "Pêche Durable"],
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    highlight: true
  },
  {
    id: "e2",
    name: "Noix de Saint-Jacques Rôties au Beurre Noisette",
    subtitle: "Mousseline de topinambour et truffe noire Melanosporum",
    description: "Saint-Jacques de la Baie de Seine justes saisies, crémeux de racines d'antan infusé à la fève tonka, râpée généreuse de truffe noire fraîche du Périgord.",
    price: 36,
    category: "entrees",
    badge: "Coup de Cœur",
    pairing: "Meursault Domaine des Comtes Lafon 2020",
    dietary: ["Pêche Côtière"],
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "e3",
    name: "Foie Gras Poêlé aux Baies Noires & Porto Millésimé",
    subtitle: "Brioche dorée maison aux éclats de fleur de sel",
    description: "Escalope de foie gras mi-cuit caramélisée au sucre muscovado, réduction de griottes sauvages au poivre de Timut, toast brioché aérien.",
    price: 34,
    category: "entrees",
    pairing: "Sauternes Château Guiraud 1er Grand Cru Classé",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "e4",
    name: "Tartare de Thon Rouge Akami & Avocat Givré",
    subtitle: "Vinaigrette ponzu yuzu truffée et tuile de sarrasin croustillante",
    description: "Thon rouge de ligne d'une fraîcheur absolue relevé aux jeunes pousses de shiso pourpre, graines de sésame noir torréfiées.",
    price: 32,
    category: "entrees",
    dietary: ["Sans Gluten"],
    pairing: "Condrieu 'La Doriane' Guigal 2021",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80"
  },

  // --- PLATS ---
  {
    id: "p1",
    name: "Filet de Bœuf Black Angus Façon Rossini",
    subtitle: "Cœur de filet maturé 45 jours, jus corsé à la truffe d'Alba",
    description: "Pavé de Black Angus cuit à la braise de sarments de vigne, surmonté d'un médaillon de foie gras poêlé, mousseline de pommes rattes du Touquet au beurre Bordier.",
    price: 54,
    category: "plats",
    badge: "Signature Mythique",
    pairing: "Pauillac Château Lynch-Bages 2015",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    highlight: true
  },
  {
    id: "p2",
    name: "Dos de Bar Sauvage en Croûte d'Herbes Marines",
    subtitle: "Risotto crémeux à l'encre de seiche et émulsion champagne",
    description: "Pêche éco-responsable des côtes bretonnes, cuisson douce basse température, sabayon mousseux au Champagne Ruinart blanc de blancs.",
    price: 48,
    category: "plats",
    pairing: "Puligny-Montrachet Domaine Leflaive 2020",
    dietary: ["Pêche Durable"],
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "p3",
    name: "Homard Bleu de Bretagne Flambé au Cognac XO",
    subtitle: "Gnocchis artisanaux truffés et bisque onctueuse au corail",
    description: "Queue et pinces décortiquées délicatement, saisies minute au beurre clarifié et cognac vintage, jeunes poireaux crayons confits.",
    price: 68,
    category: "plats",
    badge: "Joyau de l'Écrin",
    pairing: "Corton-Charlemagne Grand Cru Louis Latour 2019",
    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80",
    highlight: true
  },
  {
    id: "p4",
    name: "Pigeon Royal de Bresse au Sang & Épices Douces",
    subtitle: "Cuisse confite croustillante et betteraves glacées au vinaigre balsamique",
    description: "Filets rosés laqués au miel de châtaignier et poivre sauvage de Madagascar, purée fine de panais vanillé.",
    price: 49,
    category: "plats",
    pairing: "Hermitage Domaine Jean-Louis Chave 2018",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "p5",
    name: "Risotto Acquerello à la Truffe Blanche d'Alba",
    subtitle: "Parmigiano Reggiano 36 mois affiné et tombée de jeunes épinards",
    description: "Grains vieillis 7 ans cuits au bouillon de légumes nobles, émulsion au mascarpone fermier et copeaux généreux de truffe blanche.",
    price: 42,
    category: "plats",
    dietary: ["Végétarien"],
    pairing: "Barolo Cannubi Marchesi di Barolo 2016",
    image: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80"
  },

  // --- DESSERTS ---
  {
    id: "d1",
    name: "Le Dôme Noir Obsidienne & Or Pur 24k",
    subtitle: "Chocolat Grand Cru Guanaja 70%, cœur coulant caramel beurre salé",
    description: "Coque miroir laquée d'un noir profond, sablé croustillant à la fleur de sel, ganache soyeuse et glace vanille Bourbon de Madagascar turbinée minute.",
    price: 24,
    category: "desserts",
    badge: "Création Visuelle",
    pairing: "Porto Ramos Pinto Vintage 2000",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    highlight: true
  },
  {
    id: "d2",
    name: "Pavlova Cristalline aux Baies Sauvages & Yuzu",
    subtitle: "Meringue soufflée aérienne, chantilly mascarpone vanillée",
    description: "Nuage de meringue croquante et fondante, coulis de mûres sauvages et framboises fraîches, sorbet rafraîchissant au yuzu japonais.",
    price: 21,
    category: "desserts",
    pairing: "Champagne Laurent-Perrier Cuvée Rosé",
    dietary: ["Sans Gluten"],
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "d3",
    name: "Millefeuille Inversé à la Vanille Givrée de Tahiti",
    subtitle: "Feuilletage caramélisé ultra-croustillant et praliné pécan",
    description: "Superposition de couches croustillantes caramélisées, crème légère doublement infusée aux gousses charnues de Tahiti, éclat de caramel doré.",
    price: 22,
    category: "desserts",
    pairing: "Muscat de Beaumes-de-Venise Domaine des Bernardins",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "d4",
    name: "Soufflé Chaud Cointreau & Sorbet Orange Sanguine",
    subtitle: "Cœur coulant flambé au guéridon devant vos yeux",
    description: "Soufflé traditionnel monté à la perfection, délicatement arrosé d'un trait de liqueur grand siècle, contraste chaud-froid vibrant.",
    price: 23,
    category: "desserts",
    badge: "Service Flambé en Salle",
    pairing: "Grand Marnier Cuvée du Centenaire",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80"
  },

  // --- VINS & CHAMPAGNES ---
  {
    id: "v1",
    name: "Dom Pérignon Vintage 2013",
    subtitle: "Champagne d'Exception — Brut Millésimé",
    description: "Équilibre magistral entre tension minérale et maturité fruitée. Notes de fleurs blanches, brioche dorée et zeste de bergamote.",
    price: 360,
    category: "vins",
    badge: "Flacon Mythique",
    image: "https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "v2",
    name: "Château Margaux 1er Grand Cru Classé 2012",
    subtitle: "Bordeaux — Margaux AOC",
    description: "Une élégance soyeuse incomparable, tanins de velours, arômes de cassis mûr, violette et boîte à cigare.",
    price: 980,
    category: "vins",
    badge: "Sommelier Secret",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "v3",
    name: "Meursault Premier Cru 'Charmes' 2020",
    subtitle: "Bourgogne — Domaine Guy Roulot",
    description: "Grande intensité aromatique, noisette grillée, beurre frais et finale saline vibrante qui accompagne magnifiquement les poissons de ligne.",
    price: 290,
    category: "vins",
    image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80"
  },

  // --- COCKTAILS SIGNATURE ---
  {
    id: "c1",
    name: "Sillage d'Or (Signature)",
    subtitle: "Cognac Rémy Martin 1738, liqueur de pêche de vigne, paillettes d'or 24k, Champagne Ruinart",
    description: "Le cocktail d'accueil emblématique servi dans une flûte en cristal ciselé fumée aux sarments de vigne.",
    price: 26,
    category: "cocktails",
    badge: "Signature de la Péniche",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
    highlight: true
  },
  {
    id: "c2",
    name: "Nocturne sur Seine",
    subtitle: "Gin artisanal d'Île-de-France, cordial de mûre sauvage, tonic botanique, brume de romarin calciné",
    description: "Une teinte violette sombre et envoûtante rappelant les reflets de la nuit parisienne sur l'eau noire.",
    price: 24,
    category: "cocktails",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "c3",
    name: "L'Élixir sans Alcool 'Écume Céleste'",
    subtitle: "Distillat botanique sans alcool Seedlip, nectar de poire Williams, yuzu pressé, émulsion ginger beer",
    description: "Fraîcheur vive et effervescence raffinée pour une expérience haute en goût sans une goutte d'alcool.",
    price: 18,
    category: "cocktails",
    badge: "Mocktail Haute Couture",
    dietary: ["Sans Alcool"],
    image: "https://images.unsplash.com/photo-1536935338788-846bb9981813?auto=format&fit=crop&w=800&q=80"
  }
];

export const TASTING_MENUS: TastingMenu[] = [
  {
    id: "sillage-nocturne",
    name: "Menu Sillage Nocturne",
    subtitle: "Une odyssée sensorielle en 5 escales gustatives",
    courses: 5,
    price: 145,
    winePairingPrice: 75,
    description: "Une traversée poétique guidée par notre Chef exécutif, mettant à l'honneur les produits d'exception de nos côtes et terroirs français.",
    highlight: true,
    steps: [
      {
        courseName: "Mise en Bouche Flottante",
        dish: "Tartare de thon Akami fumé minute, émulsion ponzu et caviar d'esturgeon",
        wine: "Champagne Ruinart Blanc de Blancs"
      },
      {
        courseName: "Première Escale",
        dish: "Noix de Saint-Jacques de plongée saisies, mousseline de topinambour et truffe noire",
        wine: "Chablis Premier Cru 'Fourchaume' 2021"
      },
      {
        courseName: "Cœur de Croisière",
        dish: "Filet de bœuf Black Angus maturé, foie gras poêlé et réduction corsée aux morilles",
        wine: "Pauillac Château Lynch-Bages 2015"
      },
      {
        courseName: "Pause Fraîcheur",
        dish: "Granité de pomme verte Granny Smith infusé au gin parisien et coriandre givrée"
      },
      {
        courseName: "Apothéose Gourmande",
        dish: "Le Dôme Noir Obsidienne au chocolat grand cru 70%, caramel ambré et or 24 carats",
        wine: "Porto Vintage Ramos Pinto 2000"
      }
    ]
  },
  {
    id: "prestige-imperial",
    name: "Menu Impérial de la Seine",
    subtitle: "Le voyage ultime en 7 créations du Chef",
    courses: 7,
    price: 195,
    winePairingPrice: 110,
    description: "L'expérience gastronomique absolue sur la Seine. Les accords les plus rares, servis au rythme des monuments illuminés de Paris.",
    steps: [
      {
        courseName: "Prélude Cristallin",
        dish: "Gelée de crustacés iodée, chair de tourteau royal et caviar Impérial",
        wine: "Dom Pérignon Vintage 2013"
      },
      {
        courseName: "Deuxième Éveil",
        dish: "Carpaccio de bar sauvage au yuzu et huile de Kalamata fumée",
        wine: "Puligny-Montrachet Domaine Leflaive 2020"
      },
      {
        courseName: "Le Noble des Mers",
        dish: "Demi-homard bleu de Bretagne rôti au beurre clarifié et cognac XO",
        wine: "Meursault Premier Cru 'Charmes' 2020"
      },
      {
        courseName: "L'Arbre & la Terre",
        dish: "Pigeon Royal de Bresse laqué au miel et poivre noir de Madagascar",
        wine: "Hermitage Domaine Jean-Louis Chave 2018"
      },
      {
        courseName: "Tradition Affinée",
        dish: "Sélection de nos terroirs : Comté 36 mois Marcel Petite et Saint-Marcellin crémeux truffé",
        wine: "Côte-Rôtie 'La Mouline' Guigal 2017"
      },
      {
        courseName: "Fraîcheur Boréale",
        dish: "Coupole de meringue givrée, sorbet yuzu et émulsion champagne rosé"
      },
      {
        courseName: "L'Or & le Cacao",
        dish: "Millefeuille inversé caramélisé aux trois vanilles rares et ganache noire satinée",
        wine: "Château d'Yquem 1er Cru Supérieur"
      }
    ]
  }
];

export const TESTIMONIALS = [
  {
    quote: "Une atmosphère d'une élégance rare. Dîner face à la Tour Eiffel illuminée tout en dégustant le bar au caviar reste l'un des plus grands moments gastronomiques parisiens.",
    author: "Guide Gastronomique Prestige",
    role: "Critique Culinaire",
    rating: 5
  },
  {
    quote: "Le mariage entre l'ébène, les dorures chaudes et le clapotis de l'eau crée une intimité féerique. Une péniche qui redéfinit le luxe nocturne.",
    author: "Le Figaro Évasion",
    role: "Chronique Art de Vivre",
    rating: 5
  },
  {
    quote: "Le service en gants blancs, la sélection des grands crus et la signature Rossini du Chef méritent tous les éloges.",
    author: "Club des Sommeliers de France",
    role: "Recommandation Spéciale",
    rating: 5
  }
];
