export type HebcalCity = {
  id: string;
  name: string;
  country: string;
  geonameid: number;
  latitude: number;
  longitude: number;
  tzid: string;
};

export const POPULAR_CITIES: HebcalCity[] = [
  { id: "paris", name: "Paris", country: "France", geonameid: 2988507, latitude: 48.8566, longitude: 2.3522, tzid: "Europe/Paris" },
  { id: "marseille", name: "Marseille", country: "France", geonameid: 2995469, latitude: 43.2965, longitude: 5.3698, tzid: "Europe/Paris" },
  { id: "lyon", name: "Lyon", country: "France", geonameid: 2996944, latitude: 45.7640, longitude: 4.8357, tzid: "Europe/Paris" },
  { id: "nice", name: "Nice", country: "France", geonameid: 2990440, latitude: 43.7102, longitude: 7.2620, tzid: "Europe/Paris" },
  { id: "strasbourg", name: "Strasbourg", country: "France", geonameid: 2973783, latitude: 48.5734, longitude: 7.7521, tzid: "Europe/Paris" },
  { id: "toulouse", name: "Toulouse", country: "France", geonameid: 2972315, latitude: 43.6047, longitude: 1.4442, tzid: "Europe/Paris" },
  { id: "jerusalem", name: "Jérusalem", country: "Israël", geonameid: 281184, latitude: 31.7683, longitude: 35.2137, tzid: "Asia/Jerusalem" },
  { id: "telaviv", name: "Tel Aviv", country: "Israël", geonameid: 293397, latitude: 32.0853, longitude: 34.7818, tzid: "Asia/Jerusalem" },
  { id: "netanya", name: "Netanya", country: "Israël", geonameid: 294071, latitude: 32.3215, longitude: 34.8532, tzid: "Asia/Jerusalem" },
  { id: "newyork", name: "New York", country: "États-Unis", geonameid: 5128581, latitude: 40.7128, longitude: -74.0060, tzid: "America/New_York" },
  { id: "miami", name: "Miami", country: "États-Unis", geonameid: 4164138, latitude: 25.7617, longitude: -80.1918, tzid: "America/New_York" },
  { id: "london", name: "Londres", country: "Royaume-Uni", geonameid: 2643743, latitude: 51.5074, longitude: -0.1278, tzid: "Europe/London" },
];

export type ShabbatTimes = {
  parashaFr: string;
  parashaHe: string;
  candlesTime: string;
  candlesIso: string;
  havdalahTime: string;
  havdalahIso: string;
  cityName: string;
  dateStr: string;
  hebrewDate: string;
};

export type JewishHolidayEvent = {
  id: string;
  titleFr: string;
  titleHe?: string;
  dateIso: string;
  endDateIso?: string;
  category: "major" | "minor" | "fast" | "roshchodesh" | "shabbat" | "modern";
  categoryLabel: string;
  hebrewDate: string;
  description: string;
  dayRank?: string;
  entryLabel?: string;
  entryTime?: string;
  entryDay?: string;
  entryIso?: string;
  exitLabel?: string;
  exitTime?: string;
  exitDay?: string;
  exitIso?: string;
  isCrossDays?: boolean;
  candlesIso?: string;
  havdalahIso?: string;
  fastStartIso?: string;
  fastEndIso?: string;
};

export type HebcalItem = {
  category?: string;
  subcat?: string;
  title: string;
  title_orig?: string;
  yomtov?: boolean;
  date: string;
  hebrew?: string;
  hdate?: string;
  memo?: string;
};

/**
 * Récupère les horaires de Chabbat pour une ville donnée
 */
export async function fetchShabbatTimes(city: HebcalCity): Promise<ShabbatTimes> {
  const now = new Date();
  const url = `https://www.hebcal.com/shabbat?cfg=json&geonameid=${city.geonameid}&M=on&lg=fr&b=18`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API response not ok");
    const data = await res.json();

    const items: HebcalItem[] = data.items || [];
    const candleItem = items.find((i) => i.category === "candles");
    const havdalahItem = items.find((i) => i.category === "havdalah");
    const parashaItem = items.find((i) => i.category === "parashat");

    const formatHour = (isoStr?: string) => {
      if (!isoStr) return "--:--";
      const d = new Date(isoStr);
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: city.tzid });
    };

    return {
      parashaFr: parashaItem ? parashaItem.title.replace(/^Parashat\s+/i, "Parachat ") : "À consulter",
      parashaHe: parashaItem?.hebrew || "",
      candlesTime: formatHour(candleItem?.date),
      candlesIso: candleItem?.date || now.toISOString(),
      havdalahTime: formatHour(havdalahItem?.date),
      havdalahIso: havdalahItem?.date || now.toISOString(),
      cityName: city.name,
      dateStr: candleItem?.date
        ? new Date(candleItem.date).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: city.tzid,
          })
        : "Vendredi",
      hebrewDate: candleItem?.hdate || "",
    };
  } catch (err) {
    console.warn("Hebcal shabbat fetch error, using calculation fallback:", err);
    return getFallbackShabbatTimes(city);
  }
}

/**
 * Récupère la date hébraïque actuelle
 */
export async function fetchCurrentHebrewDate(): Promise<{ hebrew: string; dateFr: string; hy: number; hm: string; hd: number }> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const url = `https://www.hebcal.com/converter?cfg=json&gy=${yyyy}&gm=${mm}&gd=${dd}&g2h=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API response not ok");
    const data = await res.json();
    return {
      hebrew: data.hebrew || `${data.hd} ${data.hm} ${data.hy}`,
      dateFr: `${data.hd} ${translateHebrewMonth(data.hm)} ${data.hy}`,
      hy: data.hy,
      hm: data.hm,
      hd: data.hd,
    };
  } catch {
    return {
      hebrew: "י״ד בַּאֲדָר תשפ״ו",
      dateFr: "14 Adar 5786",
      hy: 5786,
      hm: "Adar",
      hd: 14,
    };
  }
}

/**
 * Traduction française des mois hébraïques
 */
export function translateHebrewMonth(month: string): string {
  const map: Record<string, string> = {
    Nisan: "Nissan",
    Iyyar: "Iyar",
    Sivan: "Sivan",
    Tamuz: "Tamouz",
    Av: "Av",
    Elul: "Eloul",
    Tishrei: "Tichri",
    Cheshvan: "Hechvan",
    Kislev: "Kislev",
    Tevet: "Tévet",
    "Sh'vat": "Chevat",
    Adar: "Adar",
    "Adar I": "Adar I",
    "Adar II": "Adar II",
  };
  return map[month] || month;
}

function getHolidayDayRank(title: string): string | undefined {
  const t = title.toLowerCase();
  if (t.includes("veille") || t.includes("erev")) return "Veille de fête";
  if (t.includes("1er jour") || t.includes(" i ") || t.endsWith(" i") || t.includes("1ère bougie") || t.includes("1 bougie") || t.includes("5787")) return "1er jour de Yom Tov";
  if (t.includes("2e jour") || t.includes(" ii ") || t.endsWith(" ii") || t.includes("2 bougies") || t.includes("2ème jour")) return "2e jour de Yom Tov";
  if (t.includes("3e jour") || t.includes(" iii ") || t.endsWith(" iii") || t.includes("3 bougies")) return "3e jour";
  if (t.includes("4e jour") || t.includes(" iv ") || t.endsWith(" iv") || t.includes("4 bougies")) return "4e jour";
  if (t.includes("5e jour") || t.includes(" v ") || t.endsWith(" v") || t.includes("5 bougies")) return "5e jour";
  if (t.includes("6e jour") || t.includes(" vi ") || t.endsWith(" vi") || t.includes("6 bougies")) return "6e jour";
  if (t.includes("7e jour") || t.includes(" vii ") || t.endsWith(" vii") || t.includes("7 bougies")) return "7e jour de Yom Tov";
  if (t.includes("8e jour") || t.includes(" viii ") || t.endsWith(" viii") || t.includes("8 bougies")) return "8e jour (Clôture)";
  if (t.includes("hol hamoed") || t.includes("h’’m")) return "Hol Hamoed (Demi-fête)";
  if (t.includes("jeûne") || t.includes("ta’anit") || t.includes("taanit")) return "Jour de jeûne";
  if (t.includes("hodech")) return "Roch Hodech";
  return undefined;
}

/**
 * Récupère la liste des fêtes et jeûnes de l'année en cours
 */
export async function fetchJewishHolidays(year: number, city: HebcalCity): Promise<JewishHolidayEvent[]> {
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${year}&month=x&ss=on&mf=on&c=on&geo=geoname&geonameid=${city.geonameid}&M=on&s=on&lg=fr&b=18`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API response not ok");
    const data = await res.json();

    const items: HebcalItem[] = data.items || [];
    const candleItems = items.filter((i) => i.category === "candles");
    const havdalahItems = items.filter((i) => i.category === "havdalah");
    const fastItems = items.filter((i) => (i.category === "zmanim" || i.category === "holiday") && i.subcat === "fast");

    const formatHour = (isoStr?: string) => {
      if (!isoStr) return "";
      const d = new Date(isoStr);
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: city.tzid });
    };

    const formatDayName = (isoStr?: string) => {
      if (!isoStr) return "";
      const d = new Date(isoStr);
      return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: city.tzid });
    };

    const events: JewishHolidayEvent[] = items
      .filter((item) => item.category !== "parashat" && item.category !== "candles" && item.category !== "havdalah" && item.category !== "mevarchim" && item.category !== "zmanim")
      .map((item, idx: number) => {
        const titleLower = (item.title || "").toLowerCase();
        const origLower = (item.title_orig || "").toLowerCase();
        const hDateStr = item.date.split("T")[0];
        const hDate = new Date(hDateStr);

        const isRoshChodesh =
          item.category === "roshchodesh" ||
          item.subcat === "roshchodesh" ||
          /rosh chodesh|roch hodech/i.test(titleLower);

        const isFast =
          item.category === "fast" ||
          item.subcat === "fast" ||
          /ta'anit|tzom|jeûne|fast|tish'a b'av|gedaliah|guedalia|tevet|tévet|tammuz|tamouz|esther/i.test(titleLower) ||
          /ta'anit|tzom|jeûne|fast|tish'a b'av|gedaliah|tevet|tammuz|esther/i.test(origLower);

        const isMajor =
          !isRoshChodesh &&
          !isFast &&
          (item.subcat === "major" ||
            item.yomtov === true ||
            item.category === "major" ||
            /pessah|pesach|shavuot|chavouot|chavou’ot|sukkot|souccot|soukkot|rosh hashana|hachana|hachanah|kippur|kippour|shemini|chemini|simchat|simhat|sim'hat|purim|pourim|chanukah|hanoucca/i.test(titleLower) ||
            /pessah|pesach|shavuot|chavouot|sukkot|souccot|rosh hashana|hachana|kippur|kippour|shemini|chemini|simchat|sim'hat|purim|pourim|chanukah|hanoucca/i.test(origLower));

        const isModern =
          item.category === "modern" ||
          item.subcat === "modern" ||
          /shoah|choah|zikaron|atzma|atsmaout|yerushalayim|yérouchalayim/i.test(titleLower);

        let cat: JewishHolidayEvent["category"] = "minor";
        let catLabel = "Fête";

        if (isMajor) {
          cat = "major";
          catLabel = "Yom Tov";
        } else if (isFast) {
          cat = "fast";
          catLabel = "Jeûne";
        } else if (isRoshChodesh) {
          cat = "roshchodesh";
          catLabel = "Roch Hodech";
        } else if (isModern) {
          cat = "modern";
          catLabel = "Commémoration";
        }

        const titleFr = translateHolidayTitle(item.title);
        const dayRank = getHolidayDayRank(titleFr) || getHolidayDayRank(item.title);

        let entryLabel = "Allumage";
        let entryTime = "";
        let entryDay = "";
        let entryIso: string | undefined;
        let exitLabel = "Havdala / Sortie";
        let exitTime = "";
        let exitDay = "";
        let exitIso: string | undefined;
        let isCrossDays = false;

        if (isFast) {
          entryLabel = "Début du jeûne";
          exitLabel = "Fin du jeûne";
          const fStart = fastItems.find((f) => f.title.includes("Début") && f.date.startsWith(hDateStr));
          const fEnd = fastItems.find((f) => f.title.includes("Fin") && f.date.startsWith(hDateStr));
          if (fStart) {
            entryTime = formatHour(fStart.date);
            entryDay = formatDayName(fStart.date);
            entryIso = fStart.date;
          }
          if (fEnd) {
            exitTime = formatHour(fEnd.date);
            exitDay = formatDayName(fEnd.date);
            exitIso = fEnd.date;
          }
        } else if (isMajor || cat === "minor") {
          const cMatch = candleItems.find((c) => {
            const cDate = new Date(c.date.split("T")[0]);
            const diff = (cDate.getTime() - hDate.getTime()) / (1000 * 3600 * 24);
            return diff === 0 || diff === -1;
          });
          if (cMatch) {
            entryTime = formatHour(cMatch.date);
            entryDay = formatDayName(cMatch.date);
            entryIso = cMatch.date;
          }

          const hvMatch = havdalahItems.find((hv) => {
            const hvDate = new Date(hv.date.split("T")[0]);
            const diff = (hvDate.getTime() - hDate.getTime()) / (1000 * 3600 * 24);
            return diff >= 0 && diff <= 2;
          });
          if (hvMatch) {
            exitTime = formatHour(hvMatch.date);
            exitDay = formatDayName(hvMatch.date);
            exitIso = hvMatch.date;
          }

          if (entryDay && exitDay && entryDay !== exitDay) {
            isCrossDays = true;
          }
        }

        return {
          id: `${item.title}-${item.date}-${idx}`,
          titleFr,
          titleHe: item.hebrew,
          dateIso: item.date,
          category: cat,
          categoryLabel: catLabel,
          hebrewDate: item.hdate || "",
          description: getHolidayDescription(item.title, item.title_orig),
          dayRank,
          entryLabel,
          entryTime,
          entryDay,
          entryIso,
          exitLabel,
          exitTime,
          exitDay,
          exitIso,
          isCrossDays,
        };
      });

    return events.length > 0 ? events : getFallbackJewishHolidays(year);
  } catch (err) {
    console.warn("Hebcal holidays fetch error, using fallback:", err);
    return getFallbackJewishHolidays(year);
  }
}

/**
 * Traduction et embellissement des titres des fêtes
 */
function translateHolidayTitle(title: string): string {
  const clean = title
    .replace(/[\u0332\u0331]/g, "")
    .replace(/’/g, "'")
    .replace(/^Erev\s+/i, "Veille de ")
    .replace(/Roch Hachanah 5787|Roch Hachanah I\b|Rosh Hashana I\b/i, "Roch Hachana (1er jour)")
    .replace(/Roch Hachanah II\b|Rosh Hashana II\b/i, "Roch Hachana (2ème jour)")
    .replace(/Roch Hachanah\b/i, "Roch Hachana")
    .replace(/Soukkot VII.*|Hochanah Rabbah|Hoshana Raba/i, "Hochaana Rabba (7ème jour de Souccot)")
    .replace(/Soukkot VI.*|Souccot VI.*/i, "Souccot (6ème jour - Hol Hamoed)")
    .replace(/Soukkot V.*|Souccot V.*/i, "Souccot (5ème jour - Hol Hamoed)")
    .replace(/Soukkot IV.*|Souccot IV.*/i, "Souccot (4ème jour - Hol Hamoed)")
    .replace(/Soukkot III.*|Souccot III.*/i, "Souccot (3ème jour - Hol Hamoed)")
    .replace(/Soukkot II\b|Souccot II\b|Sukkot II\b/i, "Souccot (2ème jour)")
    .replace(/Soukkot I\b|Souccot I\b|Sukkot I\b/i, "Souccot (1er jour)")
    .replace(/Chemini Atzéret\b|Shemini Atzeret\b/i, "Chémini Atseret")
    .replace(/Simhat Torah\b|Simchat Torah\b/i, "Sim'hat Torah")
    .replace(/Pessah VIII\b|Pesach VIII\b/i, "Pessa'h (8ème jour)")
    .replace(/Pessah VII\b|Pesach VII\b/i, "Pessa'h (7ème jour)")
    .replace(/Pessah VI.*|Pesach VI.*/i, "Pessa'h (6ème jour - Hol Hamoed)")
    .replace(/Pessah V.*|Pesach V.*/i, "Pessa'h (5ème jour - Hol Hamoed)")
    .replace(/Pessah IV.*|Pesach IV.*/i, "Pessa'h (4ème jour - Hol Hamoed)")
    .replace(/Pessah III.*|Pesach III.*/i, "Pessa'h (3ème jour - Hol Hamoed)")
    .replace(/Pessah II\b|Pesach II\b/i, "Pessa'h (2ème jour)")
    .replace(/Pessah I\b|Pesach I\b/i, "Pessa'h (1er jour)")
    .replace(/Pessah Cheni\b|Pesach Sheni\b/i, "Pessa'h Chéni")
    .replace(/Chavou'ot II\b|Chavouot II\b|Shavuot II\b/i, "Chavouot (2ème jour)")
    .replace(/Chavou'ot I\b|Chavouot I\b|Shavuot I\b/i, "Chavouot (1er jour)")
    .replace(/Chavou'ot\b|Shavuot\b/i, "Chavouot")
    .replace(/Hanoukah: 8ème jour/i, "Hanouka (8ème jour - Clôture)")
    .replace(/Hanoukah: 8 Bougies|Chanukah: 8 Candles/i, "Hanouka (8ème jour - 8 bougies)")
    .replace(/Hanoukah: 7 Bougies|Chanukah: 7 Candles/i, "Hanouka (7ème jour - 7 bougies)")
    .replace(/Hanoukah: 6 Bougies|Chanukah: 6 Candles/i, "Hanouka (6ème jour - 6 bougies)")
    .replace(/Hanoukah: 5 Bougies|Chanukah: 5 Candles/i, "Hanouka (5ème jour - 5 bougies)")
    .replace(/Hanoukah: 4 Bougies|Chanukah: 4 Candles/i, "Hanouka (4ème jour - 4 bougies)")
    .replace(/Hanoukah: 3 Bougies|Chanukah: 3 Candles/i, "Hanouka (3ème jour - 3 bougies)")
    .replace(/Hanoukah: 2 Bougies|Chanukah: 2 Candles/i, "Hanouka (2ème jour - 2 bougies)")
    .replace(/Hanoukah: 1 Bougie|Chanukah: 1 Candle/i, "Hanouka (1er jour - 1ère bougie)")
    .replace(/Tou biChvat|Tu BiShvat/i, "Tou Bichevat")
    .replace(/Lag BaOmer/i, "Lag Baomer")
    .replace(/Ta'anit Esther/i, "Jeûne d'Esther")
    .replace(/Ta'anit Bekhorot/i, "Jeûne des Premiers-nés (Ta'anit Bekhorot)")
    .replace(/Tzom Gedaliah/i, "Jeûne de Guedalia")
    .replace(/Asara B'Tevet/i, "Jeûne du 10 Tevet")
    .replace(/Tzom Tammuz/i, "Jeûne du 17 Tamouz")
    .replace(/Tich'ah beAv|Tish'a B'Av/i, "Jeûne du 9 Av (Ticha Beav)")
    .replace(/Soukkot|Sukkot/i, "Souccot")
    .replace(/Pessah|Pesach/i, "Pessa'h")
    .replace(/^Rosh Chodesh\s+/i, "Roch Hodech ");
  return clean;
}

function getHolidayDescription(title: string, origTitle?: string): string {
  const t = `${title} ${origTitle || ""}`.toLowerCase();

  // Pessah
  if (t.includes("erev pessah") || t.includes("erev pesach") || t.includes("veille de pessah")) {
    return "Veille de Pessah : Recherche et élimination du Hamets (Bedikat Hamets), jeûne des premiers-nés et préparation du premier Séder.";
  }
  if (t.includes("pessah i") || t.includes("pesach i") || (t.includes("pessah") && t.includes("1er"))) {
    return "1er jour de Pessah (Yom Tov) : Célébration de la sortie d'Égypte, lecture de la Haggadah, consommation des Matsot et des 4 coupes de vin lors du Séder.";
  }
  if (t.includes("pessah ii") || t.includes("pesach ii") || (t.includes("pessah") && t.includes("2e"))) {
    return "2e jour de Pessah (Yom Tov en diaspora) : Deuxième Séder de Pessah et début du décompte solennel de l'Omer (Sefirat HaOmer).";
  }
  if (t.includes("pessah vii") || t.includes("pesach vii") || (t.includes("pessah") && t.includes("7e"))) {
    return "7e jour de Pessah (Yom Tov) : Commémoration de l'ouverture de la Mer Rouge (Kriat Yam Souf) et chant du Cantique de la Mer (Chirat HaYam).";
  }
  if (t.includes("pessah viii") || t.includes("pesach viii") || (t.includes("pessah") && t.includes("8e"))) {
    return "8e jour de Pessah (Dernier jour de Yom Tov) : Prière commémorative de Yizkor et repas festif du Machiah (Seoudat Machiah).";
  }
  if (t.includes("pessah cheni") || t.includes("pesach sheni")) {
    return "Pessah Chéni : Seconde chance pour le sacrifice pascal un mois après Nissan, coutume de consommer de la matsa.";
  }
  if (t.includes("pessah") || t.includes("pesach")) {
    return "Fête de Pessah (Hol Hamoed) : Demi-fête, interdiction de consommer du Hamets et joie de la libération.";
  }

  // Chavouot
  if (t.includes("erev chavou") || t.includes("erev shavuot") || t.includes("veille de chavou")) {
    return "Veille de Chavouot : Nuit du Tikoun Leil Chavouot consacrée à l'étude intensive de la Torah jusqu'à l'aube.";
  }
  if (t.includes("chavou") || t.includes("shavuot")) {
    return "Fête de Chavouot (Yom Tov) : Célébration du Don de la Torah (Matan Torah) au Mont Sinaï, lecture des Dix Paroles et dégustation de mets lactés.";
  }

  // Roch Hachana
  if (t.includes("erev roch hachan") || t.includes("erev rosh hashana") || t.includes("veille de roch")) {
    return "Veille de Roch Hachana : Prières de Sélihot, annulation des vœux (Hatarat Nedarim) et allumage des bougies de la nouvelle année.";
  }
  if (t.includes("roch hachana ii") || t.includes("rosh hashana ii")) {
    return "2e jour de Roch Hachana (Yom Tov) : Deuxième sonnerie du Chofar, dégustation d'un fruit nouveau pour la bénédiction de Chéhéhayanou.";
  }
  if (t.includes("roch hachan") || t.includes("rosh hashana")) {
    return "Roch Hachana (Jour du Jugement / Yom Tov) : Nouvel An juif, sonnerie du Chofar, bénédictions sur la pomme trempée dans le miel pour une année douce.";
  }

  // Yom Kippour
  if (t.includes("erev yom kippour") || t.includes("erev yom kippur") || t.includes("veille de yom kippour")) {
    return "Veille de Yom Kippour : Coutume des Kapparot, repas d'interruption (Seouda Hamafseket) et prière solennelle de Kol Nidré au coucher du soleil.";
  }
  if (t.includes("kippour") || t.includes("kippur")) {
    return "Yom Kippour (Jour du Grand Pardon) : Jour le plus saint du calendrier hébraïque, 25 heures de jeûne total, prières de pardon et sonnerie finale du Chofar (Néïla).";
  }

  // Souccot
  if (t.includes("erev souccot") || t.includes("erev sukkot") || t.includes("erev soukkot") || t.includes("veille de souccot")) {
    return "Veille de Souccot : Finalisation de la Soucca, préparation du bouquet des 4 espèces (Loulav, Etrog, Hadassim, Aravot).";
  }
  if (t.includes("souccot i") || t.includes("sukkot i") || t.includes("soukkot i")) {
    return "1er jour de Souccot (Yom Tov) : Repas sous la Soucca, première bénédiction sur les 4 espèces du Loulav.";
  }
  if (t.includes("souccot ii") || t.includes("sukkot ii") || t.includes("soukkot ii")) {
    return "2e jour de Souccot (Yom Tov en diaspora) : Séjour sous la Soucca, bénédictions et prières d'Ouchpizine.";
  }
  if (t.includes("hochanah") || t.includes("hoshana") || t.includes("souccot vii") || t.includes("soukkot vii")) {
    return "Hochaana Raba (7e jour de Souccot) : Nuit d'étude, 7 processions solennelles (Hakafot) autour de la Téva et rituel des branches de saule.";
  }
  if (t.includes("souccot") || t.includes("sukkot") || t.includes("soukkot")) {
    return "Souccot (Hol Hamoed) : Demi-fête des Cabanes, joie familiale et accomplissement de la mitsva du Loulav sous la Soucca.";
  }

  // Chemini Atseret & Simhat Torah
  if (t.includes("shemini") || t.includes("chemini")) {
    return "Chemini Atséret (Yom Tov) : Fête de clôture et de rassemblement intime avec le Créateur, prière solennelle pour la pluie (Téfilat HaGuechem) et Yizkor.";
  }
  if (t.includes("simchat") || t.includes("simhat") || t.includes("sim'hat")) {
    return "Sim'hat Torah (Yom Tov) : Joie immense de la Torah, 7 tours de danses avec les Séfarim (Hakafot), fin et recommencement immédiat du cycle de la Genèse (Béréchit).";
  }

  // Pourim
  if (t.includes("erev pourim") || t.includes("erev purim") || t.includes("veille de pourim")) {
    return "Veille de Pourim : Lecture nocturne de la Méguila d'Esther à la synagogue, déguisements et dons de demi-shekel (Mahantsit HaChékel).";
  }
  if (t.includes("chouchan pourim") || t.includes("shushan purim")) {
    return "Chouchan Pourim : Célébration de Pourim dans les villes fortifiées depuis l'époque de Josué (Jérusalem).";
  }
  if (t.includes("pourim") || t.includes("purim")) {
    return "Fête de Pourim : Célébration de la délivrance d'Esther et Mardochée, lecture publique de la Méguila, envoi de mets (Michloah Manot), dons aux nécessiteux (Matanot LaEvyonim) et grand festin joyeux (Michté).";
  }

  // Hanoucca
  if (t.includes("hanoucca") || t.includes("chanukah") || t.includes("anoukah")) {
    return "Hanoucca (Fête des Lumières) : Allumage quotidien de la Ménorah au coucher du soleil, bénédictions de miracles, prières de Al HaNissim et consommation de mets à l'huile (beignets/soufganiyot).";
  }

  // Tou Bichvat
  if (t.includes("tu bishvat") || t.includes("tou bichvat")) {
    return "Tou Bichvat (Nouvel An des Arbres) : Dégustation des sept fruits d'Israël (grenades, dattes, figues, raisins, olives) et bénédictions de la nature.";
  }

  // Lag BaOmer
  if (t.includes("lag baomer") || t.includes("lag ba'omer")) {
    return "Lag BaOmer (33e jour du Omer) : Fin de l'épidémie des élèves de Rabbi Akiva, célébration de la Hilloula de Rabbi Chimon Bar Yohaï avec feux de joie et festivités.";
  }

  // Jeûnes
  if (t.includes("esther")) {
    return "Jeûne d'Esther (Ta'anit Esther) : Jeûne de l'aube au coucher du soleil en mémoire du jeûne et des prières décrétés par la reine Esther avant d'aller voir le roi Assuérus.";
  }
  if (t.includes("ticha") || t.includes("b'av") || t.includes("tich'ah beav")) {
    return "Ticha Beav (9 Av) : Grand jeûne de 25 heures en signe de deuil national commémorant la destruction du Premier et du Second Temple de Jérusalem, lecture des Lamentations (Méguilat Eikha).";
  }
  if (t.includes("tammuz") || t.includes("tamouz") || t.includes("17 tamouz")) {
    return "Jeûne du 17 Tamouz : Commémoration de la brèche faite dans les murailles de Jérusalem, ouvrant la période de deuil des Trois Semaines (Bein HaMetsarim).";
  }
  if (t.includes("gedalia") || t.includes("gedaliah") || t.includes("guedalia")) {
    return "Jeûne de Guedalia : Jeûne de l'aube au coucher du soleil commémorant l'assassinat de Guedalia fils d'Ahikam, gouverneur de Judée, marquant l'exil complet de Babylone.";
  }
  if (t.includes("tevet") || t.includes("tévet") || t.includes("10 tévet")) {
    return "Jeûne du 10 Tévet (Assara BeTévet) : Commémoration du début du siège de Jérusalem par Nabuchodonosor roi de Babylone.";
  }

  // Roch Hodech
  if (t.includes("rosh chodesh") || t.includes("roch hodech") || t.includes("hodech")) {
    return "Roch Hodech : Célébration de la néoménie et du nouveau mois du calendrier hébraïque, récitation des prières festives de Hallel et Moussaf.";
  }

  // Commémorations modernes
  if (t.includes("shoah") || t.includes("choah")) {
    return "Yom HaChoah : Journée solennelle de mémoire des 6 millions de victimes de la Shoah et des actes d'héroïsme.";
  }
  if (t.includes("zikaron")) {
    return "Yom HaZikaron : Journée du souvenir des soldats tombés au combat et des victimes du terrorisme en Israël.";
  }
  if (t.includes("atzma") || t.includes("atsmaout")) {
    return "Yom HaAtsmaout : Fête nationale commémorant la déclaration d'indépendance de l'État d'Israël en 1948.";
  }
  if (t.includes("yerushalayim") || t.includes("yérouchalayim")) {
    return "Yom Yérouchalayim : Célébration de la réunification de Jérusalem et de l'accès retrouvé au Mur des Lamentations (Kotel).";
  }

  return "Temps fort et célébration du calendrier hébraïque traditionnel.";
}

/**
 * Génère un lien direct pour ajouter un événement à Google Calendar
 */
export function generateGoogleCalendarUrl(event: {
  title: string;
  description: string;
  location?: string;
  startDateIso: string;
  endDateIso?: string;
}): string {
  const formatGCalDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const start = formatGCalDate(event.startDateIso);
  const end = event.endDateIso
    ? formatGCalDate(event.endDateIso)
    : formatGCalDate(new Date(new Date(event.startDateIso).getTime() + 2 * 3600 * 1000).toISOString());

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description}\n\nVia Liberty — Le Guide Art de Vivre & Communauté`,
    location: event.location || "France",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Génère et déclenche le téléchargement d'un fichier .ics Apple Calendar avec rappel VALARM
 */
export function downloadIcsFile(event: {
  title: string;
  description: string;
  location?: string;
  startDateIso: string;
  endDateIso?: string;
  alarmMinutesBefore?: number;
}) {
  const formatIcsDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const start = formatIcsDate(event.startDateIso);
  const end = event.endDateIso
    ? formatIcsDate(event.endDateIso)
    : formatIcsDate(new Date(new Date(event.startDateIso).getTime() + 2 * 3600 * 1000).toISOString());
  const now = formatIcsDate(new Date().toISOString());
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@liberty-guide.fr`;
  const alarmMin = event.alarmMinutesBefore ?? 15;

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Liberty//Calendrier Hebraique//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
    `LOCATION:${event.location || "France"}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    `TRIGGER:-PT${alarmMin}M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:Rappel Liberty : ${event.title}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute("download", `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Génère le lien Webcal d'abonnement au flux complet
 */
export function getWebcalSubscriptionUrl(city: HebcalCity): string {
  return `webcal://www.hebcal.com/hebcal?v=1&cfg=ics&maj=on&min=on&mod=on&nx=on&year=now&month=x&ss=on&mf=on&c=on&geo=geoname&geonameid=${city.geonameid}&M=on&s=on&lg=fr`;
}

/**
 * Fallback de secours hors-ligne pour les horaires de Chabbat
 */
function getFallbackShabbatTimes(city: HebcalCity): ShabbatTimes {
  return {
    parashaFr: "Parachat Terouma",
    parashaHe: "פָּרָשַׁת תְּרוּמָה",
    candlesTime: "18:24",
    candlesIso: new Date().toISOString(),
    havdalahTime: "19:32",
    havdalahIso: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
    cityName: city.name,
    dateStr: "Vendredi & Samedi",
    hebrewDate: "14 Adar 5786",
  };
}

/**
 * Fallback de secours hors-ligne pour les fêtes juives
 */
function getFallbackJewishHolidays(year: number): JewishHolidayEvent[] {
  return [
    {
      id: `purim-${year}`,
      titleFr: "Pourim",
      titleHe: "פּוּרִים",
      dateIso: `${year}-03-14`,
      category: "major",
      categoryLabel: "Grande Fête",
      hebrewDate: "14 Adar",
      description: "Fête de la délivrance, lecture de la Méguila d'Esther, dons aux pauvres et festin joyeux.",
    },
    {
      id: `pesach-${year}`,
      titleFr: "Pessah (Pâque juive)",
      titleHe: "פֶּסַח",
      dateIso: `${year}-04-12`,
      category: "major",
      categoryLabel: "Grande Fête",
      hebrewDate: "15 Nissan",
      description: "Fête de la libération du peuple juif, soirées du Séder et interdiction du Hamets.",
    },
    {
      id: `lag-baomer-${year}`,
      titleFr: "Lag BaOmer",
      titleHe: "לַ״ג בָּעוֹמֶר",
      dateIso: `${year}-05-16`,
      category: "minor",
      categoryLabel: "Fête",
      hebrewDate: "18 Iyar",
      description: "33e jour de l'Omer, célébration de Rabbi Chimon Bar Yohaï et feux de joie traditionnels.",
    },
    {
      id: `shavuot-${year}`,
      titleFr: "Chavouot (Don de la Torah)",
      titleHe: "שָׁבוּעוֹת",
      dateIso: `${year}-06-01`,
      category: "major",
      categoryLabel: "Grande Fête",
      hebrewDate: "6 Sivan",
      description: "Célébration du Don de la Torah sur le Mont Sinaï, nuit d'étude et mets lactés.",
    },
    {
      id: `tisha-bav-${year}`,
      titleFr: "Ticha Beav (Jeûne du 9 Av)",
      titleHe: "תִּשְׁעָה בְּאָב",
      dateIso: `${year}-08-03`,
      category: "fast",
      categoryLabel: "Jeûne",
      hebrewDate: "9 Av",
      description: "Grand jeûne de 25h commémorant la destruction des deux Temples de Jérusalem.",
    },
    {
      id: `rosh-hashana-${year}`,
      titleFr: "Roch Hachana (Nouvel An juif 5787)",
      titleHe: "רֹאשׁ הַשָּׁנָה",
      dateIso: `${year}-09-22`,
      category: "major",
      categoryLabel: "Grande Fête",
      hebrewDate: "1 Tichri",
      description: "Début de la nouvelle année hébraïque, sonnerie du Chofar et bénédictions.",
    },
    {
      id: `yom-kippur-${year}`,
      titleFr: "Yom Kippour (Grand Pardon)",
      titleHe: "יוֹם כִּפּוּר",
      dateIso: `${year}-10-01`,
      category: "major",
      categoryLabel: "Grande Fête",
      hebrewDate: "10 Tichri",
      description: "Jour le plus saint de l'année, 25h de jeûne total, prières et expiation.",
    },
    {
      id: `sukkot-${year}`,
      titleFr: "Souccot",
      titleHe: "סֻכּוֹת",
      dateIso: `${year}-10-06`,
      category: "major",
      categoryLabel: "Yom Tov",
      hebrewDate: "15 Tichri",
      description: "Fête des Cabanes, bénédictions dans la Soucca et commandement des 4 espèces.",
    },
    {
      id: `shemini-atzeret-${year}`,
      titleFr: "Chemini Atséret & Sim'hat Torah",
      titleHe: "שְׁמִינִי עֲצֶרֶת",
      dateIso: `${year}-10-13`,
      category: "major",
      categoryLabel: "Yom Tov",
      hebrewDate: "22 Tichri",
      description: "Fête de la clôture et réjouissance de la Torah, danses et fin du cycle de lecture.",
    },
    {
      id: `chanukah-${year}`,
      titleFr: "Hanoucca (Fête des Lumières)",
      titleHe: "חֲנֻכָּה",
      dateIso: `${year}-12-14`,
      category: "major",
      categoryLabel: "Grande Fête",
      hebrewDate: "25 Kislev",
      description: "Allumage quotidien de la Ménorah pendant 8 soirs, beignets et miracles.",
    },
  ];
}
