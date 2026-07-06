export type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
  image: string;
  keywords: string[];
};

const concepts: Record<string, string[]> = {
  cacher: ["cacher", "casher", "kasher", "kosher", "certifié", "certification", "beth din", "rav rottenberg", "rabbinat"],
  viande: ["viande", "bassari", "basari", "carné", "grill", "grillade", "steak", "burger", "barbecue", "viande grillée"],
  lait: ["lait", "halavi", "halavi", "halavi", "fromage", "dairy", "pizza", "pizzeria", "salon de thé"],
  restaurant: ["restaurant", "resto", "restau", "table", "déjeuner", "dîner", "manger", "repas", "adresse", "sortir manger"],
  brunch: ["brunch", "petit déjeuner", "pancakes", "avocado toast", "œufs", "bagel", "gaufre"],
  voyage: ["voyage", "séjour", "vacances", "hôtel", "club", "destination", "pessah"],
  evenement: ["événement", "concert", "conférence", "soirée", "dj", "spectacle", "dégustation"],
  sport: ["sport", "padel", "coach", "musculation", "salle", "cours privé", "fitness"],
  mariage: ["mariage", "houppa", "dj", "salle", "traiteur", "décoration", "photographe"],
  shopping: ["shopping", "boutique", "mode", "costume", "robe", "chaussures", "judaïca", "vêtement"],
  religion: ["religion", "torah", "cours", "synagogue", "mikvé", "chabbat", "shabbat"],
  famille: ["famille", "familial", "enfant", "kids", "menu enfant"],
  paris17: ["17", "17e", "75017", "paris 17", "paris17", "dix-septième arrondissement"],
  ouvert: ["ouvert", "ouvert maintenant", "ouvert midi", "ouvert soir", "ouvert dimanche", "ouvert tard"],
  livraison: ["livraison", "livrer", "deliveroo", "uber eats", "à emporter", "take away", "click collect"],
  vin: ["vin", "vins", "spiritueux", "caviste", "dégustation", "masterclass", "cocktail", "tequila", "whisky", "champagne"],
};

export function normalizeSearchText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, " ").replace(/[^a-z0-9€]+/g, " ").trim();
}

export function buildInvisibleKeywords(seed: string[], context: { category?: string; location?: string } = {}) {
  const base = new Set(seed.map((value) => value.trim()).filter(Boolean));
  const joined = normalizeSearchText([...base].join(" "));
  Object.entries(concepts).forEach(([concept, aliases]) => {
    if ([concept, ...aliases].some((alias) => joined.includes(normalizeSearchText(alias)))) {
      aliases.forEach((alias) => base.add(alias));
    }
  });
  if (context.category) base.add(context.category);
  if (context.location) base.add(context.location);
  const core = [...base].slice(0, 24);
  const prefixes = ["près de moi", "meilleur", "adresse", "trouver", "recommandé"];
  core.slice(0, 12).forEach((value) => {
    if (context.category) base.add(`${context.category} ${value}`);
    if (context.location) base.add(`${value} ${context.location}`);
  });
  prefixes.forEach((prefix) => core.slice(0, 5).forEach((value) => base.add(`${prefix} ${value}`)));
  return [...base].slice(0, 100);
}

function expandQuery(query: string) {
  const normalized = normalizeSearchText(query);
  const tokens = normalized.split(" ").filter((token) => token.length > 1);
  const expanded = new Set(tokens);
  Object.entries(concepts).forEach(([concept, aliases]) => {
    if ([concept, ...aliases].some((alias) => normalized.includes(normalizeSearchText(alias)))) {
      expanded.add(concept);
      aliases.flatMap((alias) => normalizeSearchText(alias).split(" ")).forEach((token) => expanded.add(token));
    }
  });
  return { normalized, tokens: [...expanded] };
}

function closeEnough(token: string, word: string) {
  if (token.length < 4 || word.length < 4) return false;
  if (word.startsWith(token) || token.startsWith(word)) return true;
  let mismatch = Math.abs(token.length - word.length);
  if (mismatch > 1) return false;
  const max = Math.min(token.length, word.length);
  for (let index = 0; index < max; index++) if (token[index] !== word[index]) mismatch++;
  return mismatch <= 1;
}

export function searchItems(items: SearchItem[], query: string) {
  if (query.trim().length < 2) return [];
  const { normalized, tokens } = expandQuery(query);
  return items.map((item) => {
    const title = normalizeSearchText(item.title);
    const category = normalizeSearchText(item.category);
    const keywords = item.keywords.map(normalizeSearchText);
    const corpus = normalizeSearchText(`${item.title} ${item.subtitle} ${item.category} ${item.keywords.join(" ")}`);
    const words = corpus.split(" ");
    let score = title === normalized ? 160 : title.includes(normalized) ? 90 : corpus.includes(normalized) ? 55 : 0;
    tokens.forEach((token) => {
      if (title.includes(token)) score += 18;
      else if (category.includes(token)) score += 12;
      else if (keywords.some((keyword) => keyword === token)) score += 10;
      else if (keywords.some((keyword) => keyword.includes(token))) score += 6;
      else if (corpus.includes(token)) score += 3;
      else if (words.some((word) => closeEnough(token, word))) score += 2;
    });
    const matchedOriginalTokens = normalizeSearchText(query).split(" ").filter((token) => token.length > 1 && corpus.includes(token)).length;
    const coverage = matchedOriginalTokens / Math.max(1, normalizeSearchText(query).split(" ").filter(Boolean).length);
    score += matchedOriginalTokens * 15 + coverage * 20;
    return { item, score };
  }).filter(({ score }) => score > 8).sort((a, b) => b.score - a.score).slice(0, 8).map(({ item }) => item);
}
