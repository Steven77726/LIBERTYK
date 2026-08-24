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
      candlesIso: candleItem?.date || "",
      havdalahTime: formatHour(havdalahItem?.date),
      havdalahIso: havdalahItem?.date || "",
      cityName: city.name,
      dateStr: now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      hebrewDate: data.hebrew || "Calendrier Hébraïque",
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
  const url = `https://www.hebcal.com/converter?cfg=json&gy=${now.getFullYear()}&gm=${now.getMonth() + 1}&gd=${now.getDate()}&g2h=1`;

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

/**
 * Récupère la liste des fêtes et jeûnes de l'année en cours
 */
export async function fetchJewishHolidays(year: number, city: HebcalCity): Promise<JewishHolidayEvent[]> {
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${year}&month=x&ss=on&mf=on&c=on&geo=geoname&geonameid=${city.geonameid}&M=on&s=on&lg=fr`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API response not ok");
    const data = await res.json();

    const items: HebcalItem[] = data.items || [];
    const events: JewishHolidayEvent[] = items
      .filter((item) => item.category !== "parashat" && item.category !== "candles" && item.category !== "havdalah" && item.category !== "mevarchim")
      .map((item, idx: number) => {
        const titleLower = (item.title || "").toLowerCase();
        const origLower = (item.title_orig || "").toLowerCase();

        const isMajor =
          item.subcat === "major" ||
          item.yomtov === true ||
          item.category === "major" ||
          /pessah|pesach|shavuot|chavouot|chavou’ot|sukkot|souccot|rosh hashana|hachana|kippur|kippour|shemini|chemini|simchat|sim'hat|purim|pourim|chanukah|hanoucca/i.test(titleLower) ||
          /pessah|pesach|shavuot|chavouot|sukkot|souccot|rosh hashana|hachana|kippur|kippour|shemini|chemini|simchat|sim'hat|purim|pourim|chanukah|hanoucca/i.test(origLower);

        const isFast =
          item.category === "fast" ||
          item.subcat === "fast" ||
          /ta'anit|tzom|jeûne|fast|tish'a b'av|gedaliah|guedalia|tevet|tévet|tammuz|tamouz|esther/i.test(titleLower) ||
          /ta'anit|tzom|jeûne|fast|tish'a b'av|gedaliah|tevet|tammuz|esther/i.test(origLower);

        const isRoshChodesh =
          item.category === "roshchodesh" ||
          item.subcat === "roshchodesh" ||
          /rosh chodesh|roch hodech/i.test(titleLower);

        const isModern =
          item.category === "modern" ||
          item.subcat === "modern" ||
          /shoah|choah|zikaron|atzma|atsmaout|yerushalayim|yérouchalayim/i.test(titleLower);

        let cat: JewishHolidayEvent["category"] = "minor";
        let catLabel = "Fête";

        if (isMajor) {
          cat = "major";
          catLabel = item.yomtov ? "Yom Tov" : "Grande Fête";
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

        return {
          id: `${item.title}-${item.date}-${idx}`,
          titleFr: translateHolidayTitle(item.title),
          titleHe: item.hebrew,
          dateIso: item.date,
          category: cat,
          categoryLabel: catLabel,
          hebrewDate: item.hdate || "",
          description: item.memo || getHolidayDescription(item.title),
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
  return title
    .replace(/[\u0332\u0331]/g, "")
    .replace(/’/g, "'")
    .replace(/\(H’’M\)|\(CH''M\)/g, "(Hol Hamoed)")
    .replace(/^Erev\s+/i, "Veille de ")
    .replace(/^Rosh Hashana\b/i, "Roch Hachana")
    .replace(/^Yom Kippur\b/i, "Yom Kippour")
    .replace(/^Sukkot\b/i, "Souccot")
    .replace(/^Shemini Atzeret\b/i, "Chemini Atséret")
    .replace(/^Simchat Torah\b/i, "Sim'hat Torah")
    .replace(/^Chanukah\b/i, "Hanoucca")
    .replace(/^Tu BiShvat\b/i, "Tou Bichvat")
    .replace(/^Purim\b/i, "Pourim")
    .replace(/^Ta'anit Esther\b/i, "Jeûne d’Esther")
    .replace(/^Pesach\b/i, "Pessah")
    .replace(/^Pessah\b/i, "Pessah")
    .replace(/^Chavou'ot\b/i, "Chavouot")
    .replace(/^Chavouot\b/i, "Chavouot")
    .replace(/^Shavuot\b/i, "Chavouot")
    .replace(/^Yom HaShoah\b/i, "Yom HaChoah")
    .replace(/^Yom HaZikaron\b/i, "Yom HaZikaron")
    .replace(/^Yom HaAtzma'ut\b/i, "Yom HaAtsmaout")
    .replace(/^Lag BaOmer\b/i, "Lag BaOmer")
    .replace(/^Yom Yerushalayim\b/i, "Yom Yérouchalayim")
    .replace(/^Tzom Tammuz\b/i, "Jeûne du 17 Tamouz")
    .replace(/^Tish'a B'Av\b/i, "Ticha Beav (9 Av)")
    .replace(/^Tzom Gedaliah\b/i, "Jeûne de Guedalia")
    .replace(/^Asara B'Tevet\b/i, "Jeûne du 10 Tévet")
    .replace(/^Rosh Chodesh\s+/i, "Roch Hodech ");
}

function getHolidayDescription(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("pessah") || t.includes("pesach")) return "Fête de la libération et de la sortie d'Égypte. Consommation de Matsot.";
  if (t.includes("kippur") || t.includes("kippour")) return "Jour du Grand Pardon, 25 heures de jeûne, prières et recueillement.";
  if (t.includes("rosh hashana") || t.includes("hachana")) return "Nouvel An juif, sonnerie du Chofar, bénédictions sur la pomme et le miel.";
  if (t.includes("sukkot") || t.includes("souccot")) return "Fête des Cabanes, commandement des 4 espèces (Loulav et Etrog).";
  if (t.includes("hanoucca") || t.includes("chanukah")) return "Fête des Lumières, allumage de la Ménorah pendant 8 soirs consécutifs.";
  if (t.includes("purim") || t.includes("pourim")) return "Fête de la délivrance d'Esther, lecture de la Méguila, Michloah Manot et joie.";
  if (t.includes("chavouot") || t.includes("shavuot")) return "Fête du Don de la Torah au Mont Sinaï. Consommation de plats lactés.";
  if (t.includes("esther")) return "Jeûne de l'aube au coucher du soleil en mémoire du jeûne décrété par la reine Esther.";
  if (t.includes("ticha") || t.includes("b'av")) return "Grand jeûne de 25 heures commémorant la destruction des deux Temples de Jérusalem.";
  if (t.includes("rosh chodesh") || t.includes("hodech")) return "Début du nouveau mois hébraïque, prière de Hallel et Moussaf.";
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
