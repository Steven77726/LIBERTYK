import type { Brunch } from "@/types/brunch";

export function parseDelimitedCsv(text: string, delimiter = ";") {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const clean = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < clean.length; index++) {
    const char = clean[index];
    const next = clean[index + 1];
    if (char === '"') {
      if (quoted && next === '"') { field += '"'; index++; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field); field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index++;
      row.push(field); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...values] = rows;
  return values.map((cells) => Object.fromEntries(headers.map((header, index) => [header.trim(), cells[index]?.trim() ?? ""])));
}

const hiddenValue = (value?: string) => !value || /à vérifier/i.test(value) ? undefined : value.trim();
const yes = (value?: string) => /^oui$/i.test(value?.trim() ?? "") ? true : undefined;
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const brunchIdentity = (name: string, address?: string) => `${name.trim().toLowerCase()}|${(address ?? "").trim().toLowerCase()}`;

export function normalizeBrunchRow(row: Record<string, string>, index = 0): Brunch {
  const name = row["Nom"].trim();
  const address = hiddenValue(row["Adresse complète"]);
  const arrondissement = Number(hiddenValue(row["Arrondissement"])) || undefined;
  const tags = (row["Filtres"] ?? "").split(";").map((value) => value.trim()).filter(Boolean);
  const images = [
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&w=1400&q=85",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=1400&q=85",
  ];
  const specialty = row["Spécialité"] || "Brunch";
  return {
    slug: slugify(`${name}-${address ?? "paris"}`),
    name,
    address,
    postalCode: hiddenValue(row["Code postal"]),
    arrondissement,
    phone: hiddenValue(row["Téléphone"]),
    specialty,
    cuisine: row["Cuisine"] || "Brunch",
    kosherType: (row["Type (Viande/Lait/Parvé)"] || "Parvé") as Brunch["kosherType"],
    certification: hiddenValue(row["Certification"]),
    services: {
      dineIn: yes(row["Sur place"]), takeaway: yes(row["À emporter"]), delivery: yes(row["Livraison"]),
      clickCollect: yes(row["Click & Collect"]), reservation: yes(row["Réservation"]),
    },
    hours: Object.fromEntries(["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"].map((day) => [day, hiddenValue(row[`Horaires ${day}`])])),
    price: hiddenValue(row["Prix"]) as Brunch["price"],
    amenities: {
      family: yes(row["Adapté aux familles"]), accessible: yes(row["Accessible PMR"]),
      parking: yes(row["Parking"]), terrace: yes(row["Terrasse"]), wifi: yes(row["Wifi"]),
      kidsMenu: yes(row["Menu enfant"]), privateHire: yes(row["Privatisation"]),
    },
    tags,
    source: hiddenValue(row["Source"]),
    rawData: row,
    images: [images[index % images.length], images[(index + 1) % images.length], images[(index + 2) % images.length]],
    description: `${specialty}. Une adresse brunch casher à découvrir${arrondissement ? ` dans le ${arrondissement}e arrondissement de Paris` : " à Paris"}.`,
    reviewCount: 0,
    distanceKm: Number((1.1 + ((index * 13 + (arrondissement ?? 9)) % 68) / 10).toFixed(1)),
    latitude: 48.8566 + ((index % 5) - 2) * 0.009,
    longitude: 2.3522 + ((index % 6) - 2.5) * 0.013,
    importedAt: "2026-07-03",
  };
}

export function mergeBrunchImports(existing: Brunch[], rows: Record<string, string>[]) {
  const map = new Map(existing.map((item) => [brunchIdentity(item.name, item.address), item]));
  rows.forEach((row, index) => {
    const incoming = normalizeBrunchRow(row, index);
    const key = brunchIdentity(incoming.name, incoming.address);
    const previous = map.get(key);
    map.set(key, previous ? { ...previous, ...incoming, images: previous.images, rating: previous.rating, reviewCount: previous.reviewCount } : incoming);
  });
  return [...map.values()];
}
