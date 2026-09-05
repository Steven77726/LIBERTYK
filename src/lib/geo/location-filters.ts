export type LocationFilterable = {
  city?: string | null;
  arrondissement?: number | string | null;
  postalCode?: string | null;
  address?: string | null;
  fullAddress?: string | null;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function parseArrondissementNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value >= 1 && value <= 20 ? value : undefined;
  const str = String(value).trim();
  const directMatch = str.match(/^(?:paris\s*)?(\d{1,2})(?:e|er|ème)?$/i);
  if (directMatch) {
    const num = parseInt(directMatch[1], 10);
    if (num >= 1 && num <= 20) return num;
  }
  const zipMatch = str.match(/750?(\d{2})/);
  if (zipMatch) {
    const num = parseInt(zipMatch[1], 10);
    if (num >= 1 && num <= 20) return num;
  }
  const inlineMatch = str.match(/(?:paris|arrondissement)\s*(\d{1,2})(?:e|er|ème)?/i);
  if (inlineMatch) {
    const num = parseInt(inlineMatch[1], 10);
    if (num >= 1 && num <= 20) return num;
  }
  return undefined;
}

export function formatArrondissementLabel(num: number): string {
  if (num === 1) return "Paris 1er";
  return `Paris ${num}e`;
}

export function extractCityAndArrondissement(item: LocationFilterable): {
  isParis: boolean;
  arrondissement?: number;
  city: string;
} {
  const rawCity = (item.city || "").trim();
  const rawPostal = (item.postalCode || "").trim();
  const rawAddr = (item.fullAddress || item.address || "").trim();

  const arrFromItem = parseArrondissementNumber(item.arrondissement);
  const arrFromPostal = parseArrondissementNumber(rawPostal);
  const arrFromAddr = parseArrondissementNumber(rawAddr);
  const arrondissement = arrFromItem || arrFromPostal || arrFromAddr;

  const isParisPostal = rawPostal.startsWith("75");
  const isParisCity = normalize(rawCity) === "paris";
  const isParisAddr = normalize(rawAddr).includes("paris");
  const isParis = Boolean(arrondissement || isParisPostal || isParisCity || isParisAddr);

  let city = "Paris";
  if (!isParis) {
    if (rawCity && normalize(rawCity) !== "paris") {
      city = rawCity;
    } else if (rawAddr) {
      const parts = rawAddr.split(",").map((p) => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        const last = parts[parts.length - 1].replace(/^\d{5}\s*/, "").trim();
        if (last && normalize(last) !== "paris") {
          city = last;
        }
      }
    }
  }

  return { isParis, arrondissement, city };
}

export function buildLocationFilterOptions(items: LocationFilterable[]): string[] {
  const parisArrs = new Set<number>();
  const otherCities = new Set<string>();

  items.forEach((item) => {
    const { isParis, arrondissement, city } = extractCityAndArrondissement(item);
    if (isParis && arrondissement) {
      parisArrs.add(arrondissement);
    } else if (!isParis && city && normalize(city) !== "paris") {
      otherCities.add(city);
    }
  });

  // 1. Arrondissements de Paris (du 1er au 20e) présents dans les fiches
  const sortedParis = Array.from(parisArrs)
    .sort((a, b) => a - b)
    .map(formatArrondissementLabel);

  // 2. Autres villes réelles existantes triées alphabétiquement
  const sortedCities = Array.from(otherCities).sort((a, b) =>
    a.localeCompare(b, "fr", { sensitivity: "base" })
  );

  return [...sortedParis, ...sortedCities];
}

export function matchesLocationFilter(item: LocationFilterable, filter: string): boolean {
  const normFilter = normalize(filter);
  const filterArr = parseArrondissementNumber(filter);

  const { isParis, arrondissement, city } = extractCityAndArrondissement(item);

  // Filtre par arrondissement de Paris (ex: "Paris 17e", "Paris 1er")
  if (filterArr !== undefined) {
    if (!isParis) return false;
    return arrondissement === filterArr;
  }

  // Filtre par autre ville (ex: "Levallois-Perret", "Boulogne-Billancourt", "Marseille")
  const normCity = normalize(city);
  if (normCity && (normCity === normFilter || normCity.includes(normFilter) || normFilter.includes(normCity))) {
    return true;
  }

  const rawAddr = normalize(item.fullAddress || item.address || "");
  if (rawAddr.includes(normFilter)) {
    return true;
  }

  return false;
}

export function matchesAnyLocationFilter(
  item: LocationFilterable,
  activeFilters: string[],
  availableLocationOptions: string[]
): boolean {
  const locationOptionsSet = new Set(availableLocationOptions.map(normalize));
  const activeLocationFilters = activeFilters.filter((f) =>
    locationOptionsSet.has(normalize(f))
  );

  if (activeLocationFilters.length === 0) return true;

  return activeLocationFilters.some((filter) => matchesLocationFilter(item, filter));
}
