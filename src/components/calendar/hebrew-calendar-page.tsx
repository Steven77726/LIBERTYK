"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Globe,
  List,
  MapPin,
  Moon,
  Navigation,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import {
  fetchCurrentHebrewDate,
  fetchJewishHolidays,
  fetchShabbatTimes,
  getWebcalSubscriptionUrl,
  POPULAR_CITIES,
  type HebcalCity,
  type JewishHolidayEvent,
  type ShabbatTimes,
} from "@/lib/hebcal";
import { AddToCalendarModal } from "./add-to-calendar-modal";

export function HebrewCalendarPage() {
  const [selectedCity, setSelectedCity] = useState<HebcalCity>(POPULAR_CITIES[0]);
  const [shabbatTimes, setShabbatTimes] = useState<ShabbatTimes | null>(null);
  const [hebrewDate, setHebrewDate] = useState<{ hebrew: string; dateFr: string } | null>(null);
  const [holidays, setHolidays] = useState<JewishHolidayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLocating, setGeoLocating] = useState(false);

  // Vue & Filtres
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [showRotateHint, setShowRotateHint] = useState<boolean>(true);

  // Panneau pop-up auto-fermable de 7 secondes
  const [popupDay, setPopupDay] = useState<{
    dateIso: string;
    dayNumber: number;
    events: JewishHolidayEvent[];
  } | null>(null);
  const [popupCountdown, setPopupCountdown] = useState<number>(7);
  const popupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleOpenDayPopup = (day: { dateIso: string; dayNumber: number; events?: JewishHolidayEvent[] }) => {
    setSelectedDayDate(day.dateIso);
    setPopupDay({
      dateIso: day.dateIso,
      dayNumber: day.dayNumber,
      events: day.events || [],
    });
    setPopupCountdown(7);
  };

  const handleCloseDayPopup = () => {
    setPopupDay(null);
    if (popupTimerRef.current) clearInterval(popupTimerRef.current);
  };

  useEffect(() => {
    if (!popupDay) return;
    if (popupTimerRef.current) clearInterval(popupTimerRef.current);

    popupTimerRef.current = setInterval(() => {
      setPopupCountdown((prev) => {
        if (prev <= 1) {
          setPopupDay(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (popupTimerRef.current) clearInterval(popupTimerRef.current);
    };
  }, [popupDay]);

  // Modale d'exportation
  const [modalEvent, setModalEvent] = useState<{
    title: string;
    description: string;
    location?: string;
    startDateIso: string;
    endDateIso?: string;
    alarmMinutesBefore?: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  // Chargement des données à l'ouverture et lors du changement de ville
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [shabbat, hDate, hDays] = await Promise.all([
          fetchShabbatTimes(selectedCity),
          fetchCurrentHebrewDate(),
          fetchJewishHolidays(selectedYear, selectedCity),
        ]);
        if (isMounted) {
          setShabbatTimes(shabbat);
          setHebrewDate(hDate);
          setHolidays(hDays);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [selectedCity, selectedYear]);

  // Géolocalisation GPS automatique
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n’est pas supportée par votre navigateur.");
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Trouver la ville préconfigurée la plus proche
        let closest = POPULAR_CITIES[0];
        let minDistance = Infinity;
        for (const city of POPULAR_CITIES) {
          const d = Math.hypot(city.latitude - lat, city.longitude - lng);
          if (d < minDistance) {
            minDistance = d;
            closest = city;
          }
        }
        setSelectedCity(closest);
        setGeoLocating(false);
      },
      () => {
        setGeoLocating(false);
        alert("Impossible de déterminer votre position. Veuillez sélectionner votre ville manuellement.");
      }
    );
  };

  // Filtrage des événements
  const filteredHolidays = useMemo(() => {
    return holidays.filter((event) => {
      if (categoryFilter !== "all" && event.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = event.titleFr.toLowerCase().includes(q) || (event.titleHe && event.titleHe.includes(q));
        const matchHDate = event.hebrewDate.toLowerCase().includes(q);
        const matchDesc = event.description.toLowerCase().includes(q);
        if (!matchTitle && !matchHDate && !matchDesc) return false;
      }
      return true;
    });
  }, [holidays, categoryFilter, searchQuery]);

  // Calcul du calendrier mensuel
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    // Décalage pour commencer par Lundi (0=Lundi, ..., 6=Dimanche)
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

    const days = [];
    // Jours du mois précédent (padding)
    for (let i = 0; i < startDayIndex; i++) {
      days.push({ isCurrentMonth: false, dayNumber: 0, dateIso: "" });
    }
    // Jours du mois actuel
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(selectedYear, selectedMonth, d);
      const isoStr = date.toISOString().split("T")[0];
      const matchingEvents = holidays.filter((h) => h.dateIso.startsWith(isoStr));
      days.push({
        isCurrentMonth: true,
        dayNumber: d,
        dateIso: isoStr,
        isToday:
          new Date().getDate() === d &&
          new Date().getMonth() === selectedMonth &&
          new Date().getFullYear() === selectedYear,
        events: matchingEvents,
      });
    }
    return days;
  }, [selectedYear, selectedMonth, holidays]);

  // Jour actif sélectionné (ou aujourd'hui / premier jour avec fête par défaut)
  const activeDay = useMemo(() => {
    const currentMonthDays = monthDays.filter((d) => d.isCurrentMonth);
    if (!currentMonthDays.length) return null;
    if (selectedDayDate) {
      const found = currentMonthDays.find((d) => d.dateIso === selectedDayDate);
      if (found) return found;
    }
    const today = currentMonthDays.find((d) => d.isToday);
    if (today) return today;
    const withEvents = currentMonthDays.find((d) => d.events && d.events.length > 0);
    if (withEvents) return withEvents;
    return currentMonthDays[0];
  }, [monthDays, selectedDayDate]);

  const openExportModalForShabbat = () => {
    if (!shabbatTimes) return;
    setModalEvent({
      title: `Chabbat ${shabbatTimes.parashaFr} — ${selectedCity.name}`,
      description: `Horaires Chabbat à ${selectedCity.name} :\n🕯️ Allumage des bougies : ${shabbatTimes.candlesTime}\n🍷 Havdala : ${shabbatTimes.havdalahTime}\n📖 Paracha : ${shabbatTimes.parashaFr}`,
      location: selectedCity.name,
      startDateIso: shabbatTimes.candlesIso || new Date().toISOString(),
      endDateIso: shabbatTimes.havdalahIso,
      alarmMinutesBefore: 15,
    });
    setIsModalOpen(true);
  };

  const openExportModalForHoliday = (event: JewishHolidayEvent) => {
    setModalEvent({
      title: `${event.titleFr} (${event.hebrewDate})`,
      description: `${event.description}\n\nLieu : ${selectedCity.name}`,
      location: selectedCity.name,
      startDateIso: event.dateIso,
      alarmMinutesBefore: event.category === "fast" ? 60 : 15,
    });
    setIsModalOpen(true);
  };

  const handleCopyWebcal = () => {
    const url = getWebcalSubscriptionUrl(selectedCity);
    navigator.clipboard.writeText(url);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2000);
  };

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  return (
    <div className="min-h-screen pb-20 pt-8 sm:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* EN-TÊTE DYNAMIQUE & SÉLECTEUR DE VILLE */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-6 rounded-[2.5rem] border border-black/[.06] bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6ecd9] px-3.5 py-1 text-xs font-bold text-[#8f6424]">
                  <Sparkles size={13} /> Calendrier Hébraïque Officiel
                </span>
                <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-ink/60">
                  Année {selectedYear} / 5786
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Fêtes, Paracha & Horaires de Chabbat
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-ink/60">
                Consultez en temps réel les horaires de Chabbat géolocalisés, la Paracha de la semaine,
                les fêtes et jeûnes, et synchronisez-les en 1 clic sur votre mobile.
              </p>
            </div>

            {/* Sélecteur de ville & GPS */}
            <div className="flex flex-col gap-2.5 rounded-3xl bg-cream/70 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-moss" />
                <span className="text-xs font-bold text-ink/50">Ville :</span>
              </div>
              <select
                value={selectedCity.id}
                onChange={(e) => {
                  const found = POPULAR_CITIES.find((c) => c.id === e.target.value);
                  if (found) setSelectedCity(found);
                }}
                className="rounded-2xl border border-black/10 bg-white px-3.5 py-2 text-xs font-bold text-ink shadow-2xs outline-none focus:border-moss"
              >
                {POPULAR_CITIES.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.country})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={geoLocating || loading}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-semibold text-ink/75 shadow-2xs transition hover:bg-moss hover:text-white disabled:opacity-50"
                title="Détecter ma position GPS"
              >
                <Navigation size={13} className={geoLocating || loading ? "animate-spin" : ""} />
                {geoLocating ? "Recherche…" : loading ? "Chargement…" : "Ma position"}
              </button>
            </div>
          </div>

          {/* Date Hébraïque du Jour en grand format */}
          <div className="grid gap-4 rounded-3xl bg-gradient-to-br from-[#fbf8f2] via-[#f7f2e7] to-[#ece5d5] p-5 sm:grid-cols-3 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-white shadow-2xs">
                <Sun size={22} className="text-[#c99b42]" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">Date hébraïque du jour</p>
                <p className="text-base font-bold text-ink sm:text-lg">
                  {hebrewDate ? hebrewDate.dateFr : "14 Adar 5786"}
                </p>
                <p className="font-serif text-xs text-[#8f6424]">
                  {hebrewDate ? hebrewDate.hebrew : "י״ד בַּאֲדָר תשפ״ו"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-black/5 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div className="grid size-12 place-items-center rounded-2xl bg-white shadow-2xs">
                <CalendarIcon size={22} className="text-moss" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">Paracha de la semaine</p>
                <p className="text-base font-bold text-ink sm:text-lg">
                  {shabbatTimes?.parashaFr || "Parachat Terouma"}
                </p>
                <p className="font-serif text-xs text-moss">
                  {shabbatTimes?.parashaHe || "פָּרָשַׁת תְּרוּמָה"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-black/5 pt-3 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <div className="grid size-12 place-items-center rounded-2xl bg-white shadow-2xs">
                <Globe size={22} className="text-ink/60" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/40">Localisation active</p>
                <p className="text-base font-bold text-ink sm:text-lg">
                  {selectedCity.name}, {selectedCity.country}
                </p>
                <p className="text-xs text-ink/50">Fuseau : {selectedCity.tzid}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARTE HERO : HORAIRES DE CHABBAT & RAPPELS */}
        {/* ========================================================================= */}
        <div className="mt-8 overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#101a15,#1f3328)] p-6 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Prochain Chabbat à {selectedCity.name}
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {shabbatTimes?.parashaFr || "Chabbat"}
              </h2>
              <p className="text-xs text-white/65 sm:text-sm">
                Horaires précis calculés pour la ville de {selectedCity.name} (Allumage 18 min avant le coucher du soleil).
              </p>
            </div>

            <button
              type="button"
              onClick={openExportModalForShabbat}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#d5bb7d] to-[#c99b42] px-6 py-3.5 text-xs font-bold text-[#101a15] shadow-lg transition hover:scale-[1.02]"
            >
              <Bell size={16} /> 🔔 Ajouter ce Chabbat à mon agenda
            </button>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Allumage des bougies */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Allumage des bougies
                </span>
                <Flame size={20} className="text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white sm:text-5xl">
                  {shabbatTimes?.candlesTime || "18:24"}
                </span>
                <span className="text-xs font-semibold text-white/40">Vendredi soir</span>
              </div>
              <p className="mt-2 text-xs text-white/50">18 minutes avant le coucher du soleil</p>
            </div>

            {/* Havdala */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Fin de Chabbat / Havdala
                </span>
                <Moon size={20} className="text-sky-300" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-black text-white sm:text-5xl">
                  {shabbatTimes?.havdalahTime || "19:32"}
                </span>
                <span className="text-xs font-semibold text-white/40">Samedi soir</span>
              </div>
              <p className="mt-2 text-xs text-white/50">Sortie des 3 étoiles (50 min)</p>
            </div>

            {/* Paracha & Lecture */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">
                  Paracha de la semaine
                </span>
                <Sparkles size={20} className="text-[#d5bb7d]" />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {shabbatTimes?.parashaFr || "Parachat Terouma"}
              </p>
              <p className="mt-1 font-serif text-sm text-[#d5bb7d]">
                {shabbatTimes?.parashaHe || "פָּרָשַׁת תְּרוּמָה"}
              </p>
              <p className="mt-2 text-xs text-white/50">Lecture de la Torah samedi matin</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BANDEAU SYNCHRONISATION MOBILE DE TOUTE L'ANNÉE */}
        {/* ========================================================================= */}
        <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-black/5 bg-[#f6ecd9] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#8f6424] sm:text-lg">
              📲 Synchronisez toutes les fêtes et Chabbatot de l&apos;année sur votre smartphone
            </h3>
            <p className="text-xs text-[#8f6424]/85 max-w-xl leading-relaxed">
              Ajoutez automatiquement les fêtes et horaires de Chabbat de {selectedCity.name} dans votre téléphone :
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {/* BOUTON IPHONE (APPLE CALENDAR) */}
            <a
              href={getWebcalSubscriptionUrl(selectedCity)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-neutral-800 hover:scale-[1.02]"
            >
              <svg className="size-4 shrink-0 fill-current text-white" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.57-11.05-20.73-14.25-33.48-3.2-12.75-4.81-24.3-4.81-34.64 0-14.88 3.72-27.18 11.16-36.9 7.44-9.72 17.08-14.69 28.92-14.9 5.37 0 11.16 1.34 17.38 4.02 6.22 2.68 10.23 4.08 12.03 4.2 1.68-.22 5.92-1.63 12.74-4.2 6.81-2.58 12.69-3.77 17.65-3.58 12.83.66 22.86 5.32 30.08 13.98-10.97 6.64-16.32 15.75-16.06 27.34.22 9.07 3.74 16.63 10.56 22.68 6.82 6.05 14.89 9.38 24.2 9.99-2.23 6.94-4.89 13.88-7.97 20.82zM119.22 31.85c0-7.39 2.68-14.28 8.04-20.67 5.36-6.39 12.03-10.36 20.02-11.18.22 1.12.34 2.18.34 3.19 0 7.39-2.73 14.37-8.19 20.93-5.46 6.56-12.19 10.45-20.21 11.66-.22-1.34-.34-2.65-.34-3.93z" />
              </svg>
              Synchroniser sur iPhone (Apple)
            </a>

            {/* BOUTON ANDROID (GOOGLE AGENDA) */}
            <a
              href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
                getWebcalSubscriptionUrl(selectedCity)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#0b57d0] px-5 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#0842a0] hover:scale-[1.02]"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#FFFFFF"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FFFFFF"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#FFFFFF"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Synchroniser sur Android (Google)
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VUE CALENDRIER & FÊTES À VENIR */}
        {/* ========================================================================= */}
        <div className="mt-12 space-y-6">
          {/* Barre de contrôle : Mode de vue + Filtres + Recherche */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Toggle de vue */}
            <div className="flex items-center rounded-2xl border border-black/10 bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  viewMode === "list" ? "bg-ink text-white shadow-xs" : "text-ink/60 hover:text-ink"
                }`}
              >
                <List size={15} /> Chronologie des Fêtes
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                  viewMode === "calendar" ? "bg-ink text-white shadow-xs" : "text-ink/60 hover:text-ink"
                }`}
              >
                <CalendarIcon size={15} /> Calendrier Mensuel
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="flex flex-1 max-w-md items-center rounded-2xl border border-black/10 bg-white px-4 py-2 shadow-2xs">
              <Search size={16} className="text-ink/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une fête (Pessah, Pourim, Jeûne...)"
                className="ml-2 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs font-bold text-ink/40 hover:text-ink"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Filtres par catégorie */}
          {viewMode === "list" && (
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "Toutes les dates" },
                { id: "major", label: "Grandes Fêtes (Yom Tov)" },
                { id: "fast", label: "Jeûnes" },
                { id: "roshchodesh", label: "Roch Hodech" },
                { id: "minor", label: "Fêtes mineures" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCategoryFilter(f.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    categoryFilter === f.id
                      ? "bg-ink text-white shadow-xs"
                      : "bg-white border border-black/5 text-ink/65 hover:bg-cream"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VUE 1 : CHRONOLOGIE ÉPURÉE DES FÊTES */}
          {/* ========================================================================= */}
          {viewMode === "list" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredHolidays.map((event) => {
                const dateObj = new Date(event.dateIso);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleDateString("fr-FR", { month: "short" });
                const weekday = dateObj.toLocaleDateString("fr-FR", { weekday: "long" });

                const isMajor = event.category === "major";
                const isFast = event.category === "fast";

                return (
                  <article
                    key={event.id}
                    className="flex flex-col justify-between rounded-3xl border border-black/[.06] bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      {/* En-tête de la carte */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid size-14 shrink-0 place-items-center rounded-2xl text-center shadow-2xs ${
                              isMajor
                                ? "bg-[#f6ecd9] text-[#8f6424]"
                                : isFast
                                ? "bg-rose-50 text-rose-700"
                                : "bg-cream text-ink"
                            }`}
                          >
                            <span className="text-xl font-black leading-none">{day}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {month}
                            </span>
                          </div>
                          <div>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isMajor
                                  ? "bg-amber-100/70 text-amber-800"
                                  : isFast
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-neutral-100 text-ink/60"
                              }`}
                            >
                              {event.categoryLabel}
                            </span>
                            <p className="mt-1 text-xs font-semibold capitalize text-ink/45">
                              {weekday}
                            </p>
                          </div>
                        </div>

                        {event.hebrewDate && (
                          <span className="font-serif text-xs font-semibold text-[#8f6424]">
                            {event.hebrewDate}
                          </span>
                        )}
                      </div>

                      {/* Titre & Description */}
                      <h3 className="mt-4 text-lg font-bold text-ink">{event.titleFr}</h3>
                      {event.titleHe && (
                        <p className="font-serif text-xs text-ink/40">{event.titleHe}</p>
                      )}
                      <p className="mt-2 text-xs leading-relaxed text-ink/60">
                        {event.description}
                      </p>
                    </div>

                    {/* Bouton d'action agenda */}
                    <div className="mt-6 pt-4 border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => openExportModalForHoliday(event)}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cream py-2.5 text-xs font-bold text-ink/75 transition hover:bg-moss hover:text-white"
                      >
                        <CalendarIcon size={14} /> Ajouter à mon agenda
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* VUE 2 : CALENDRIER MENSUEL INTERACTIF & OPTIMISÉ IPHONE */}
          {/* ========================================================================= */}
          {viewMode === "calendar" && (
            <div className="space-y-6">
              {/* BANDEAU INDICATEUR IPHONE / MOBILE : TOURNER EN PAYSAGE (CLIGNOTEMENT ATTENTION) */}
              {showRotateHint && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#8f6424] bg-[#fef3c7] p-3.5 text-xs text-[#78350f] shadow-md animate-banner-blink sm:hidden">
                  <div className="flex items-center gap-3">
                    <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-xs border border-amber-300">
                      {/* Icône smartphone animée avec rotation douce toutes les 2.8s */}
                      <div className="animate-rotate-device text-[#8f6424]">
                        <Smartphone size={22} />
                      </div>
                      {/* Point clignotant rouge / or pour capter l'attention */}
                      <span className="absolute -top-1 -right-1 size-3 rounded-full bg-rose-500 animate-blink-dot ring-2 ring-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-amber-600 animate-ping" />
                        <p className="font-extrabold uppercase tracking-wide text-[11px] text-[#78350f]">
                          Tournez votre iPhone à l&apos;horizontale
                        </p>
                      </div>
                      <p className="text-[11px] font-medium text-ink/75 leading-tight mt-0.5">
                        Basculez en mode paysage (écran large) pour lire tout le mois en grand format, ou touchez un jour ci-dessous.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRotateHint(false)}
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-white/80 text-[#8f6424] hover:bg-white shadow-2xs"
                    aria-label="Fermer le conseil"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              <div className="rounded-3xl border border-black/[.06] bg-white p-4 shadow-sm sm:p-8">
                {/* Navigation de mois */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-ink sm:text-2xl">
                      {monthNames[selectedMonth]} {selectedYear}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMonth === 0) {
                          setSelectedMonth(11);
                          setSelectedYear((y) => y - 1);
                        } else {
                          setSelectedMonth((m) => m - 1);
                        }
                      }}
                      className="grid size-9 place-items-center rounded-full bg-cream text-ink/60 transition hover:bg-ink hover:text-white"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonth(new Date().getMonth());
                        setSelectedYear(new Date().getFullYear());
                        setSelectedDayDate(new Date().toISOString().split("T")[0]);
                      }}
                      className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-ink hover:text-white"
                    >
                      Aujourd&apos;hui
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMonth === 11) {
                          setSelectedMonth(0);
                          setSelectedYear((y) => y + 1);
                        } else {
                          setSelectedMonth((m) => m + 1);
                        }
                      }}
                      className="grid size-9 place-items-center rounded-full bg-cream text-ink/60 transition hover:bg-ink hover:text-white"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* En-tête des jours */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-ink/40 mb-2">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mer</span>
                  <span>Jeu</span>
                  <span>Ven</span>
                  <span className="text-moss">Sam</span>
                  <span>Dim</span>
                </div>

                {/* Grille des jours */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {monthDays.map((day, idx) => {
                    if (!day.isCurrentMonth) {
                      return (
                        <div
                          key={idx}
                          className="min-h-14 sm:min-h-24 rounded-2xl bg-cream/20 p-1 sm:p-2 opacity-30"
                        />
                      );
                    }

                    const hasEvents = day.events && day.events.length > 0;
                    const isSelected = selectedDayDate === day.dateIso || (!selectedDayDate && day.isToday);

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleOpenDayPopup(day)}
                        className={`min-h-14 sm:min-h-24 flex flex-col justify-between rounded-2xl p-1.5 sm:p-2.5 text-left border transition cursor-pointer ${
                          isSelected
                            ? "border-[#8f6424] bg-[#f6ecd9]/40 ring-2 ring-[#8f6424]/30 shadow-xs"
                            : day.isToday
                            ? "border-moss bg-moss/5 shadow-2xs"
                            : hasEvents
                            ? "border-black/10 bg-white hover:border-black/25 hover:shadow-2xs"
                            : "border-black/5 bg-cream/25 hover:bg-cream/50"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-bold ${
                              day.isToday
                                ? "grid size-6 place-items-center rounded-full bg-moss text-white"
                                : isSelected
                                ? "text-[#8f6424] font-black"
                                : "text-ink"
                            }`}
                          >
                            {day.dayNumber}
                          </span>

                          {/* Pastille mobile tactile */}
                          {hasEvents && (
                            <span className="sm:hidden flex items-center gap-0.5">
                              {day.events?.slice(0, 2).map((ev, i) => (
                                <span
                                  key={i}
                                  className={`size-2 rounded-full ${
                                    ev.category === "major"
                                      ? "bg-[#8f6424]"
                                      : ev.category === "fast"
                                      ? "bg-rose-500"
                                      : "bg-moss"
                                  }`}
                                />
                              ))}
                            </span>
                          )}
                        </div>

                        {/* Événements complets visibles sur grand écran et en mode paysage */}
                        <div className="mt-1 space-y-1 hidden sm:block landscape:block w-full">
                          {day.events?.map((ev) => (
                            <div
                              key={ev.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openExportModalForHoliday(ev);
                              }}
                              className="w-full truncate rounded-lg bg-[#f6ecd9] px-1.5 py-0.5 text-[10px] font-bold text-[#8f6424] text-left hover:bg-moss hover:text-white transition"
                              title={`${ev.titleFr} - Cliquer pour ajouter à l'agenda`}
                            >
                              {ev.titleFr}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* PANNEAU INTERACTIF DU JOUR SÉLECTIONNÉ (LISIBLE ET CLAIR SUR MOBILE) */}
              {/* ========================================================================= */}
              {activeDay && (
                <div className="rounded-3xl border border-black/[.06] bg-white p-6 shadow-sm sm:p-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/5 pb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-moss">
                        Jour sélectionné
                      </span>
                      <h3 className="text-xl font-extrabold text-ink sm:text-2xl capitalize">
                        {new Date(activeDay.dateIso).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#f6ecd9] px-3.5 py-1 text-xs font-bold text-[#8f6424]">
                        Ville : {selectedCity.name}
                      </span>
                    </div>
                  </div>

                  {/* Liste des fêtes ou horaires du jour */}
                  {activeDay.events && activeDay.events.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {activeDay.events.map((event) => (
                        <div
                          key={event.id}
                          className="flex flex-col justify-between rounded-2xl border border-black/10 bg-[#fbf8f2] p-5 shadow-2xs space-y-4"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  event.category === "major"
                                    ? "bg-amber-100/80 text-amber-900"
                                    : event.category === "fast"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-neutral-200/80 text-ink/70"
                                }`}
                              >
                                {event.categoryLabel}
                              </span>
                              {event.hebrewDate && (
                                <span className="font-serif text-xs font-bold text-[#8f6424]">
                                  {event.hebrewDate}
                                </span>
                              )}
                            </div>

                            <h4 className="mt-3 text-lg font-bold text-ink">{event.titleFr}</h4>
                            {event.titleHe && (
                              <p className="font-serif text-xs text-ink/50">{event.titleHe}</p>
                            )}
                            <p className="mt-2 text-xs leading-relaxed text-ink/70">
                              {event.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => openExportModalForHoliday(event)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-moss"
                          >
                            <CalendarIcon size={14} /> Ajouter {event.titleFr} à mon agenda
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-cream/40 p-8 text-center">
                      <CalendarIcon size={28} className="text-ink/30 mb-2" />
                      <p className="text-sm font-bold text-ink">Aucune fête majeure ce jour</p>
                      <p className="text-xs text-ink/50 mt-1 max-w-md">
                        Journée classique du calendrier hébraïque. Vous pouvez consulter les horaires de Chabbat pour ce week-end ci-dessus.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANNEAU POP-UP 7 SECONDES (TAILLE MOYENNE, ULTRA LISIBLE, FERMETURE AUTO) */}
      {/* ========================================================================= */}
      {popupDay && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm transition-all"
          onClick={handleCloseDayPopup}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-black/10 bg-white p-6 shadow-2xl transition-all sm:p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barre de progression dégressive de 7 secondes */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-black/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8f6424] via-[#c99b42] to-moss transition-all duration-1000 ease-linear"
                style={{ width: `${(popupCountdown / 7) * 100}%` }}
              />
            </div>

            {/* En-tête du panneau */}
            <div className="flex items-start justify-between gap-4 pt-1">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f6ecd9] px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#8f6424]">
                    📍 {selectedCity.name}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold text-ink/60">
                    <Clock size={12} /> Auto-fermeture {popupCountdown}s
                  </span>
                </div>
                <h3 className="mt-2 text-xl font-extrabold text-ink sm:text-2xl capitalize">
                  {new Date(popupDay.dateIso).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <p className="font-serif text-sm font-bold text-[#8f6424] mt-0.5">
                  {popupDay.events[0]?.hebrewDate || "Date hébraïque"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDayPopup}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-ink/60 transition hover:bg-ink hover:text-white"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenu et événements du jour */}
            {popupDay.events.length > 0 ? (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {popupDay.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded-2xl border border-black/10 bg-[#fbf8f2] p-4.5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          ev.category === "major"
                            ? "bg-amber-100/80 text-amber-900"
                            : ev.category === "fast"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-neutral-200/80 text-ink/70"
                        }`}
                      >
                        {ev.categoryLabel}
                      </span>
                      {ev.titleHe && (
                        <span className="font-serif text-xs font-bold text-[#8f6424]">{ev.titleHe}</span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-extrabold text-ink">{ev.titleFr}</h4>
                      <p className="mt-1 text-xs leading-relaxed text-ink/70">{ev.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleCloseDayPopup();
                        openExportModalForHoliday(ev);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-moss"
                    >
                      <CalendarIcon size={14} /> Synchroniser {ev.titleFr} sur mon mobile
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-cream/40 p-6 text-center">
                <CalendarIcon size={32} className="text-ink/30 mb-2" />
                <p className="text-base font-bold text-ink">Journée classique du calendrier</p>
                <p className="text-xs text-ink/50 mt-1 max-w-sm">
                  Aucun jeûne ou fête majeure n&apos;est recensé pour ce jour à {selectedCity.name}.
                </p>
              </div>
            )}

            {/* Pied de panneau avec bouton fermeture immédiate */}
            <div className="flex items-center justify-between border-t border-black/5 pt-3 text-xs text-ink/50">
              <span>Fermeture automatique dans {popupCountdown} seconde{popupCountdown > 1 ? "s" : ""}</span>
              <button
                type="button"
                onClick={handleCloseDayPopup}
                className="font-bold text-ink hover:underline"
              >
                Fermer maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE D'EXPORTATION D'ÉVÉNEMENT (Google / Apple) */}
      <AddToCalendarModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={modalEvent}
      />
    </div>
  );
}
