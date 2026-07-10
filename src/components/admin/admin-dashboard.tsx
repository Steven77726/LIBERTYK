"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileDown,
  GripVertical,
  Home,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tags,
  Trash2,
  UsersRound,
} from "lucide-react";
import { categories } from "@/data/categories";
import { restaurants } from "@/data/restaurants";
import { brunches } from "@/data/brunches";
import { wineActivities } from "@/data/wine-activities";
import { azamra } from "@/data/shops";
import { getAnalyticsEvents, getReviews } from "@/lib/client-store";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { hasAdminSession } from "@/components/admin/admin-access-gate";
import { uploadLibertyImage } from "@/lib/supabase/storage";
import { fetchRealAnalyticsEvents, loadAdminStateFromSupabase, saveAdminStateToSupabase, writeAuditLog } from "@/lib/supabase/admin-state";
import { isSupabaseConfigured } from "@/lib/supabase/client";

type AdminStatus = "Publié" | "Brouillon" | "Masqué";
type BannerType = "Grande bannière" | "Bannière horizontale" | "Bannière moyenne" | "Petit encart" | "Carte sponsorisée" | "Carrousel";
type BannerPosition = "Home" | "Rubrique" | "Sous-rubrique" | "Fiche";
type KosherType = "Bassari" | "Halavi" | "Parvé" | "À compléter";
type SponsorshipLevel = "Standard" | "Sponsorisé" | "Partenaire officiel" | "Coup de cœur Liberty";
type RubricFormat = "Petit carré" | "Carré" | "Grand carré" | "Rectangle horizontal" | "Bannière";
type FieldVisibility = Record<string, boolean>;

type AdminRubric = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  imageAlt?: string;
  showOnHome?: boolean;
  format?: RubricFormat;
  columnsDesktop?: 2 | 3 | 4;
  columnsTablet?: 1 | 2 | 3;
  columnsMobile?: 1 | 2;
  searchKeywords?: string[];
  order: number;
  status: AdminStatus;
  createdAt?: string;
  updatedAt?: string;
};

type AdminSubrubric = {
  id: string;
  rubricId: string;
  slug?: string;
  name: string;
  description: string;
  photo: string;
  icon?: string;
  imageAlt?: string;
  visible?: boolean;
  gridColumns?: 1 | 2 | 3 | 4;
  searchKeywords?: string[];
  order: number;
  status: AdminStatus;
};

type AdminTag = {
  id: string;
  label: string;
  kind?: "visible" | "search";
  icon?: string;
  color?: string;
  rubricIds?: string[];
  order: number;
  status?: AdminStatus;
};

type AdminCertification = {
  id: string;
  label: string;
  order: number;
  status: AdminStatus;
};

type AdminEstablishment = {
  id: string;
  rubricId: string;
  subrubricId: string;
  mainPhoto: string;
  photos: string[];
  photoAlts?: string[];
  name: string;
  slug?: string;
  shortDescription?: string;
  description: string;
  address: string;
  city: string;
  arrondissement: string;
  postalCode?: string;
  email?: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
  hours: string;
  terrace: boolean;
  delivery: boolean;
  takeaway: boolean;
  reservation: boolean;
  privateHire: boolean;
  certification: string;
  kosherType: KosherType;
  averagePrice: string;
  latitude: string;
  longitude: string;
  status: AdminStatus;
  visible?: boolean;
  sponsorshipLevel: SponsorshipLevel;
  sponsored: boolean;
  sponsorPriority: number;
  sponsorDuration: string;
  sponsorStartsAt?: string;
  sponsorEndsAt?: string;
  sponsorPlacement?: string;
  sponsorNotes?: string;
  reservationTarget?: string;
  ownerId?: string;
  cuisineTypes?: string[];
  order: number;
  customerSearches: string[];
  visibleTagIds: string[];
  fieldVisibility?: FieldVisibility;
};

type AdminBanner = {
  id: string;
  type: BannerType;
  internalName?: string;
  title: string;
  subtitle: string;
  image: string;
  imageAlt?: string;
  button: string;
  internalLink: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  position: BannerPosition;
  placementTarget: string;
  startsAt?: string;
  endsAt?: string;
  sponsored?: boolean;
  professionalId?: string;
  order: number;
  status: AdminStatus;
  impressions: number;
  clicks: number;
  visitors: number;
};

type AdminNotification = {
  id: string;
  title: string;
  text: string;
  image: string;
  button: string;
  link: string;
  destination: string;
  date: string;
  time: string;
  target: string;
  status: "Brouillon" | "Programmée" | "Envoyée" | "Annulée";
  professionalId?: string;
  campaignId?: string;
  sentCount: number;
  opens: number;
  clicks: number;
  visitors: number;
};

type PageSection = {
  id: string;
  page: string;
  title: string;
  type: "Recherche" | "Rubrique" | "Bloc" | "Bannière";
  linkedId?: string;
  order: number;
  locked?: boolean;
  status: AdminStatus;
};

type TrashItem = {
  id: string;
  entityType: string;
  label: string;
  deletedAt: string;
  deletedBy: string;
  payload: unknown;
};

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  label: string;
  createdAt: string;
};

type AdminState = {
  rubrics: AdminRubric[];
  subrubrics: AdminSubrubric[];
  establishments: AdminEstablishment[];
  tags: AdminTag[];
  certifications: AdminCertification[];
  banners: AdminBanner[];
  notifications: AdminNotification[];
  pageSections: PageSection[];
  trash: TrashItem[];
  audit: AuditEntry[];
};

const STORAGE_KEY = "liberty-admin-dashboard-v1";
const today = new Date().toISOString().slice(0, 10);

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const newId = (prefix: string) =>
  `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;

const cleanTextList = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const defaultFieldVisibility: FieldVisibility = {
  phone: true,
  whatsapp: true,
  email: true,
  instagram: true,
  website: true,
  reservation: true,
  terrace: true,
  delivery: true,
  takeaway: true,
  price: true,
  map: true,
  reviews: true,
  gallery: true,
  certification: true,
};

const visibilityLabels: Array<{ key: string; label: string }> = [
  { key: "phone", label: "Téléphone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "instagram", label: "Instagram" },
  { key: "website", label: "Site internet" },
  { key: "reservation", label: "Réservation" },
  { key: "terrace", label: "Terrasse" },
  { key: "delivery", label: "Livraison" },
  { key: "takeaway", label: "À emporter" },
  { key: "price", label: "Prix" },
  { key: "map", label: "Carte" },
  { key: "reviews", label: "Avis" },
  { key: "gallery", label: "Galerie" },
  { key: "certification", label: "Certification" },
];

const weekDays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function parseAdminHours(value: string) {
  const parsed = Object.fromEntries(weekDays.map((day) => [day, { open: false, slot1Start: "", slot1End: "", slot2Start: "", slot2End: "" }])) as Record<string, { open: boolean; slot1Start: string; slot1End: string; slot2Start: string; slot2End: string }>;
  value.split("\n").forEach((line) => {
    const [rawDay, ...rest] = line.split(":");
    const day = rawDay?.trim().toLowerCase();
    if (!weekDays.includes(day)) return;
    const text = rest.join(":").trim();
    if (!text || text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("ferme")) {
      parsed[day] = { ...parsed[day], open: false };
      return;
    }
    const slots = text.split("/").map((slot) => slot.trim());
    const first = slots[0]?.split(/[–-]/).map((part) => part.trim().replace("h", ":")) ?? [];
    const second = slots[1]?.split(/[–-]/).map((part) => part.trim().replace("h", ":")) ?? [];
    parsed[day] = {
      open: Boolean(first[0] && first[1]),
      slot1Start: first[0] ?? "",
      slot1End: first[1] ?? "",
      slot2Start: second[0] ?? "",
      slot2End: second[1] ?? "",
    };
  });
  return parsed;
}

function serializeAdminHours(hours: ReturnType<typeof parseAdminHours>) {
  return weekDays.map((day) => {
    const value = hours[day];
    if (!value.open) return `${day}: Fermé`;
    const slots = [`${value.slot1Start || "09:00"}–${value.slot1End || "18:00"}`];
    if (value.slot2Start && value.slot2End) slots.push(`${value.slot2Start}–${value.slot2End}`);
    return `${day}: ${slots.join(" / ")}`;
  }).join("\n");
}

function getCompleteness(item: AdminEstablishment) {
  const missing: string[] = [];
  if (!item.name.trim()) missing.push("Nom");
  if (!item.description.trim()) missing.push("Description");
  if (!item.address.trim()) missing.push("Adresse");
  if (!item.mainPhoto.trim()) missing.push("Photo principale");
  if ((item.photos ?? []).filter(Boolean).length < 2) missing.push("2 photos");
  if (!item.photoAlts?.some(Boolean)) missing.push("Texte alternatif");
  if ((item.customerSearches ?? []).length < 3) missing.push("3 recherches clients");
  if (!item.certification.trim()) missing.push("Certification");
  if (!item.latitude.trim() || !item.longitude.trim()) missing.push("Coordonnées GPS");
  const total = 9;
  return { score: Math.max(0, Math.round(((total - missing.length) / total) * 100)), missing };
}

const visibleTagsSeed: AdminTag[] = [
  "Terrasse",
  "Ouvert",
  "Réservation",
  "Livraison",
  "À emporter",
  "Bassari",
  "Halavi",
  "Parvé",
  "Beth Din de Paris",
  "Badatz",
  "Loubavitch",
  "Rottenberg",
  "Sponsorisé",
].map((label, index) => ({ id: slugify(label), label, kind: "visible" as const, icon: "", color: "#1f4d3b", rubricIds: [], order: index + 1, status: "Publié" as AdminStatus }));

const certificationSeed: AdminCertification[] = [
  "Beth Din de Paris",
  "Badatz",
  "Loubavitch",
  "Rottenberg",
].map((label, index) => ({ id: slugify(label), label, order: index + 1, status: "Publié" as AdminStatus }));

function normalizeAdminState(state: Partial<AdminState>): AdminState {
  const seed = createSeedState();
  return {
    ...seed,
    ...state,
    rubrics: (state.rubrics ?? seed.rubrics).map((item) => ({ ...item, slug: item.slug ?? slugify(item.name), showOnHome: item.showOnHome ?? true, format: item.format ?? "Carré", columnsDesktop: item.columnsDesktop ?? 3, columnsTablet: item.columnsTablet ?? 2, columnsMobile: item.columnsMobile ?? 1, searchKeywords: item.searchKeywords ?? [], createdAt: item.createdAt ?? today, updatedAt: item.updatedAt ?? today })),
    subrubrics: (state.subrubrics ?? seed.subrubrics).map((item) => ({ ...item, slug: item.slug ?? slugify(item.name), visible: item.visible ?? true, gridColumns: item.gridColumns ?? 3, searchKeywords: item.searchKeywords ?? [] })),
    tags: (state.tags ?? seed.tags).map((item) => ({ ...item, kind: item.kind ?? "visible", color: item.color ?? "#1f4d3b", rubricIds: item.rubricIds ?? [], status: item.status ?? "Publié" })),
    certifications: state.certifications ?? seed.certifications,
    establishments: (state.establishments ?? seed.establishments).map((item) => ({
      ...item,
      slug: item.slug ?? slugify(item.name),
      shortDescription: item.shortDescription ?? item.description.slice(0, 120),
      photoAlts: item.photoAlts ?? ["", "", "", ""],
      postalCode: item.postalCode ?? "",
      email: item.email ?? "",
      sponsorStartsAt: item.sponsorStartsAt ?? "",
      sponsorEndsAt: item.sponsorEndsAt ?? "",
      sponsorPlacement: item.sponsorPlacement ?? "",
      sponsorNotes: item.sponsorNotes ?? "",
      reservationTarget: item.reservationTarget ?? "",
      cuisineTypes: item.cuisineTypes ?? [],
      sponsorshipLevel: item.sponsorshipLevel ?? (item.sponsored ? "Sponsorisé" : "Standard"),
      visible: item.visible ?? true,
      fieldVisibility: { ...defaultFieldVisibility, ...(item.fieldVisibility ?? {}) },
    })),
    banners: (state.banners ?? seed.banners).map((item) => ({ ...item, internalName: item.internalName ?? item.title, imageAlt: item.imageAlt ?? item.title, sponsored: item.sponsored ?? false })),
    notifications: (state.notifications ?? seed.notifications).map((item) => ({ ...item, status: ["Brouillon", "Programmée", "Envoyée", "Annulée"].includes(item.status) ? item.status : "Brouillon" })),
    pageSections: state.pageSections ?? [
      { id: "home-search", page: "Home Page", title: "Barre de recherche", type: "Recherche", order: 1, locked: true, status: "Publié" },
      { id: "home-food", page: "Home Page", title: "Food", type: "Rubrique", linkedId: "food", order: 2, status: "Publié" },
      { id: "home-wine", page: "Home Page", title: "Vin & Spiritueux", type: "Rubrique", linkedId: "vin-spiritueux", order: 3, status: "Publié" },
    ],
    trash: state.trash ?? [],
    audit: state.audit ?? [],
  };
}

function getRubricId(label: string) {
  return categories.find((category) => category.label === label)?.slug ?? slugify(label);
}

function createSeedState(): AdminState {
  const rubrics: AdminRubric[] = categories.map((category, index) => ({
    id: category.slug,
    name: category.label,
    description: category.description,
    icon: category.shortLabel ?? category.label,
    image: category.image,
    imageAlt: category.label,
    showOnHome: true,
    format: "Carré",
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    order: index + 1,
    status: "Publié",
  }));

  const categorySubrubrics = categories.flatMap((category) =>
    category.featured.map((item, index) => ({
      id: `${category.slug}-${slugify(item)}`,
      rubricId: category.slug,
      name: item,
      description: `${item} sélectionnés dans Liberty.`,
      photo: category.image,
      imageAlt: item,
      visible: true,
      gridColumns: 3 as const,
      order: index + 1,
      status: "Publié" as AdminStatus,
    })),
  );

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
  ].map((name, index) => ({
    id: `food-${slugify(name)}`,
    rubricId: "food",
    name,
    description: `${name} casher, sélection premium Liberty.`,
    photo: "/images/food/restaurants-khan.jpg",
    imageAlt: name,
    visible: true,
    gridColumns: 3 as const,
    order: index + 1,
    status: "Publié" as AdminStatus,
  }));

  const subrubricMap = new Map<string, AdminSubrubric>();
  [...categorySubrubrics, ...foodExtra].forEach((item) => subrubricMap.set(item.id, item));
  const subrubrics = [...subrubricMap.values()];

  const restaurantSubrubric = "food-restaurants";
  const brunchSubrubric = "food-brunch";
  const wineRubric = getRubricId("Vin & Spiritueux");
  const shoppingRubric = getRubricId("Shopping");

  const restaurantEstablishments: AdminEstablishment[] = restaurants.map((restaurant, index) => ({
    id: restaurant.id,
    rubricId: "food",
    subrubricId: restaurantSubrubric,
    mainPhoto: restaurant.image,
    photos: [restaurant.image, "", "", ""],
    name: restaurant.name,
    description: `${restaurant.specialty || "Restaurant casher"} — ${restaurant.cuisine || "Cuisine à compléter"}.`,
    address: restaurant.fullAddress,
    city: "Paris",
    arrondissement: restaurant.arrondissement ? `${restaurant.arrondissement}e` : "",
    phone: restaurant.phone,
    whatsapp: "",
    instagram: "",
    website: "",
    hours: Object.entries(restaurant.hours).map(([day, hours]) => `${day}: ${hours}`).join("\n"),
    terrace: restaurant.amenities.terrace === true,
    delivery: restaurant.services.delivery === true,
    takeaway: restaurant.services.takeaway === true,
    reservation: restaurant.services.reservation === true,
    privateHire: restaurant.amenities.privateHire === true,
    certification: restaurant.certification,
    kosherType: restaurant.type === "Viande" ? "Bassari" : restaurant.type === "Lait" ? "Halavi" : restaurant.type === "Parvé" ? "Parvé" : "À compléter",
    averagePrice: restaurant.price,
    latitude: String(restaurant.latitude),
    longitude: String(restaurant.longitude),
    status: "Publié",
    sponsorshipLevel: restaurant.name === "Khan" ? "Sponsorisé" : "Standard",
    sponsored: restaurant.name === "Khan",
    sponsorPriority: restaurant.name === "Khan" ? 1 : index + 10,
    sponsorDuration: restaurant.name === "Khan" ? "30 jours" : "",
    order: index + 1,
    customerSearches: [
      restaurant.name,
      restaurant.cuisine,
      restaurant.specialty,
      restaurant.fullAddress,
      restaurant.postalCode,
      `restaurant casher ${restaurant.arrondissement}`,
      `restaurant viande ${restaurant.postalCode}`,
      "cacher",
      "kasher",
      "déjeuner",
      "dîner",
    ].filter(Boolean),
    visibleTagIds: ["reservation", "livraison", "a-emporter", restaurant.type === "Viande" ? "bassari" : "halavi"].filter(Boolean),
    fieldVisibility: defaultFieldVisibility,
  }));

  const brunchEstablishments: AdminEstablishment[] = brunches.map((brunch, index) => ({
    id: brunch.slug,
    rubricId: "food",
    subrubricId: brunchSubrubric,
    mainPhoto: brunch.images[0] ?? "",
    photos: [brunch.images[0] ?? "", brunch.images[1] ?? "", brunch.images[2] ?? "", ""],
    name: brunch.name,
    description: brunch.description ?? "",
    address: brunch.address ?? "",
    city: "Paris",
    arrondissement: brunch.arrondissement ? `${brunch.arrondissement}e` : "",
    phone: brunch.phone ?? "",
    whatsapp: "",
    instagram: "",
    website: brunch.source ?? "",
    hours: Object.entries(brunch.hours ?? {}).map(([day, hours]) => `${day}: ${hours}`).join("\n"),
    terrace: brunch.amenities.terrace === true,
    delivery: brunch.services.delivery === true,
    takeaway: brunch.services.takeaway === true,
    reservation: brunch.services.reservation === true,
    privateHire: brunch.amenities.privateHire === true,
    certification: brunch.certification ?? "",
    kosherType: brunch.kosherType === "Lait" ? "Halavi" : brunch.kosherType === "Viande" ? "Bassari" : brunch.kosherType === "Parvé" ? "Parvé" : "À compléter",
    averagePrice: brunch.price ?? "",
    latitude: String(brunch.latitude ?? ""),
    longitude: String(brunch.longitude ?? ""),
    status: "Publié",
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: index + 20,
    sponsorDuration: "",
    order: restaurantEstablishments.length + index + 1,
    customerSearches: [brunch.name, brunch.specialty, brunch.cuisine, "brunch", "pancakes", "avocado toast", "café", "halavi", "lait"].filter(Boolean),
    visibleTagIds: ["reservation", "livraison", "halavi", "terrasse"].filter(Boolean),
    fieldVisibility: defaultFieldVisibility,
  }));

  const wineEstablishments: AdminEstablishment[] = wineActivities.map((activity, index) => ({
    id: activity.slug,
    rubricId: wineRubric,
    subrubricId: `${wineRubric}-selections`,
    mainPhoto: activity.image,
    photos: [activity.image, "", "", ""],
    name: activity.title,
    description: activity.description,
    address: activity.address ?? "",
    city: "Paris",
    arrondissement: activity.address?.includes("75017") ? "17e" : "",
    phone: "",
    whatsapp: "",
    instagram: "",
    website: activity.website ?? "",
    hours: "",
    terrace: false,
    delivery: false,
    takeaway: true,
    reservation: activity.slug !== "winess",
    privateHire: activity.slug.includes("signature"),
    certification: "À compléter",
    kosherType: "Parvé",
    averagePrice: "€€€",
    latitude: "",
    longitude: "",
    status: "Publié",
    sponsorshipLevel: "Partenaire officiel",
    sponsored: true,
    sponsorPriority: index + 1,
    sponsorDuration: "En cours",
    order: index + 1,
    customerSearches: [activity.title, activity.type, ...activity.tags, "vin casher", "spiritueux casher", "dégustation", "winess"],
    visibleTagIds: ["sponsorise", "reservation", "parve"],
    fieldVisibility: defaultFieldVisibility,
  }));

  const shoppingEstablishments: AdminEstablishment[] = [{
    id: azamra.slug,
    rubricId: shoppingRubric,
    subrubricId: `${shoppingRubric}-mode`,
    mainPhoto: azamra.image,
    photos: [azamra.image, "", "", ""],
    name: azamra.name,
    description: azamra.description,
    address: "",
    city: "Paris",
    arrondissement: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    website: "",
    hours: "",
    terrace: false,
    delivery: false,
    takeaway: false,
    reservation: false,
    privateHire: false,
    certification: "Non concerné",
    kosherType: "À compléter",
    averagePrice: "€€",
    latitude: "",
    longitude: "",
    status: "Publié",
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: 0,
    sponsorDuration: "",
    order: 1,
    customerSearches: ["azamra", "vêtements", "mode", "homme", "femme", "enfant", "shopping", "boutique"],
    visibleTagIds: [],
    fieldVisibility: defaultFieldVisibility,
  }];

  return {
    rubrics,
    subrubrics,
    establishments: [...restaurantEstablishments, ...brunchEstablishments, ...wineEstablishments, ...shoppingEstablishments],
    tags: visibleTagsSeed,
    certifications: certificationSeed,
    banners: [
      {
        id: "banner-home",
        type: "Grande bannière",
        title: "Liberty sélectionne le meilleur du casher",
        subtitle: "Une bannière éditoriale premium configurable depuis l’admin.",
        image: categories[0]?.image ?? "",
        button: "Découvrir",
        internalLink: "/food",
        position: "Home",
        placementTarget: "Accueil",
        order: 1,
        status: "Publié",
        impressions: 0,
        clicks: 0,
        visitors: 0,
      },
    ],
    notifications: [
      {
        id: "notification-winess",
        title: "Nouvelle sélection Winess",
        text: "Découvrez les vins et expériences du moment.",
        image: "/images/winess/winess-shop.webp",
        button: "Découvrir",
        link: "/vin-spiritueux",
        destination: "/vin-spiritueux",
        date: today,
        time: "18:00",
        target: "Tous les utilisateurs",
        status: "Brouillon",
        sentCount: 0,
        opens: 0,
        clicks: 0,
        visitors: 0,
      },
    ],
    pageSections: [
      { id: "home-search", page: "Home Page", title: "Barre de recherche", type: "Recherche", order: 1, locked: true, status: "Publié" },
      { id: "home-food", page: "Home Page", title: "Food", type: "Rubrique", linkedId: "food", order: 2, status: "Publié" },
      { id: "home-wine", page: "Home Page", title: "Vin & Spiritueux", type: "Rubrique", linkedId: "vin-spiritueux", order: 3, status: "Publié" },
    ],
    trash: [],
    audit: [],
  };
}

function useAdminState() {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<AdminState>(createSeedState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState(normalizeAdminState(JSON.parse(raw) as Partial<AdminState>));
    } catch {
      setState(createSeedState());
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  return [state, setState] as const;
}

const menu = [
  { id: "dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  { id: "rubrics", label: "Rubriques", icon: Store },
  { id: "subrubrics", label: "Sous-rubriques", icon: Tags },
  { id: "establishments", label: "Fiches / Établissements", icon: Building2 },
  { id: "tags", label: "Tags visibles", icon: Tags },
  { id: "customer-searches", label: "Recherches clients", icon: Search },
  { id: "certifications", label: "Certifications", icon: ShieldCheck },
  { id: "page-order", label: "Ordre d’affichage", icon: GripVertical },
  { id: "photos", label: "Photos", icon: Camera },
  { id: "trash", label: "Corbeille", icon: Trash2 },
  { id: "settings", label: "Paramètres", icon: Settings },
] as const;

type AdminSection =
  | (typeof menu)[number]["id"]
  | "banners"
  | "notifications"
  | "sponsored"
  | "users"
  | "professionals"
  | "reviews"
  | "analytics";

const menuLabelById: Record<string, string> = Object.fromEntries(menu.map((item) => [item.id, item.label]));

function statusBadge(status: AdminStatus) {
  const styles = {
    Publié: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Brouillon: "bg-amber-50 text-amber-700 border-amber-100",
    Masqué: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };
  return styles[status];
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-ink/35">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss/40 focus:ring-4 focus:ring-moss/10"
        />
      ) : (
        <input
          value={value}
          type={type}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-moss/40 focus:ring-4 focus:ring-moss/10"
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-ink/35">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-moss/40 focus:ring-4 focus:ring-moss/10"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/35" size={16} />
      </span>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
        checked ? "border-moss/20 bg-sage text-moss" : "border-black/10 bg-white text-ink/55"
      }`}
    >
      <span>{label}</span>
      <span className={`size-5 rounded-full border ${checked ? "border-moss bg-moss" : "border-black/20 bg-white"}`} />
    </button>
  );
}

function HoursEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const hours = parseAdminHours(value);
  const updateDay = (day: string, next: Partial<(typeof hours)[string]>) => {
    onChange(serializeAdminHours({ ...hours, [day]: { ...hours[day], ...next } }));
  };
  const copyToAll = (day: string) => {
    const source = hours[day];
    onChange(serializeAdminHours(Object.fromEntries(weekDays.map((current) => [current, { ...source }])) as typeof hours));
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm lg:col-span-2">
      <div className="mb-4">
        <p className="text-sm font-semibold">Horaires</p>
        <p className="mt-1 text-xs text-ink/45">Saisissez les horaires par jour. Les fiches publiques et le statut ouvert/fermé utiliseront ces données.</p>
      </div>
      <div className="space-y-3">
        {weekDays.map((day) => {
          const current = hours[day];
          return (
            <div key={day} className="rounded-2xl bg-cream p-3">
              <div className="grid gap-3 lg:grid-cols-[120px_110px_1fr_auto] lg:items-center">
                <p className="text-sm font-semibold capitalize">{day}</p>
                <Toggle label={current.open ? "Ouvert" : "Fermé"} checked={current.open} onChange={(open) => updateDay(day, { open })} />
                {current.open ? (
                  <div className="grid gap-2 sm:grid-cols-4">
                    <input type="time" value={current.slot1Start} onChange={(event) => updateDay(day, { slot1Start: event.target.value })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" />
                    <input type="time" value={current.slot1End} onChange={(event) => updateDay(day, { slot1End: event.target.value })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" />
                    <input type="time" value={current.slot2Start} onChange={(event) => updateDay(day, { slot2Start: event.target.value })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" />
                    <input type="time" value={current.slot2End} onChange={(event) => updateDay(day, { slot2End: event.target.value })} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" />
                  </div>
                ) : (
                  <p className="text-sm text-ink/40">Fermé</p>
                )}
                <button type="button" onClick={() => copyToAll(day)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink/55">Copier sur les autres jours</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormActionBar({
  disabled,
  onDraft,
  onPreview,
  onPublish,
  onHide,
  onTrash,
}: {
  disabled?: boolean;
  onDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onHide: () => void;
  onTrash: () => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2 rounded-3xl border border-black/[.06] bg-cream p-3">
      <button disabled={disabled} onClick={onDraft} className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-45">
        Enregistrer en brouillon
      </button>
      <button disabled={disabled} onClick={onPreview} className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-45">
        Prévisualiser
      </button>
      <button disabled={disabled} onClick={onPublish} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[.08em] text-white shadow-[0_14px_32px_rgba(16,26,21,.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">
        VALIDER ET PUBLIER
      </button>
      <button disabled={disabled} onClick={onHide} className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink/55 shadow-sm disabled:cursor-not-allowed disabled:opacity-45">
        Masquer
      </button>
      <button disabled={disabled} onClick={onTrash} className="rounded-full bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-45">
        Supprimer vers la corbeille
      </button>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, folder = "admin" }: { label: string; value: string; onChange: (value: string) => void; folder?: string }) {
  const [message, setMessage] = useState("");
  return (
    <div>
      <Field label={label} value={value} onChange={onChange} placeholder="URL locale, externe ou Supabase Storage" />
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full bg-cream px-3 py-2 text-[11px] font-semibold text-ink/55 transition hover:bg-sage hover:text-moss">
        <ImageIcon size={13} /> Envoyer une image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setMessage("Envoi en cours…");
            const result = await uploadLibertyImage(file, folder);
            if (result.url) {
              onChange(result.url);
              setMessage("Image envoyée.");
            } else {
              setMessage(result.error);
            }
          }}
        />
      </label>
      {message && <p className="mt-1 text-[11px] text-ink/35">{message}</p>}
    </div>
  );
}

function EmptyPhoto({ label = "Image" }: { label?: string }) {
  return (
    <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-black/15 bg-cream text-center text-xs text-ink/35">
      <span>
        <ImageIcon className="mx-auto mb-2" size={18} />
        {label}
      </span>
    </div>
  );
}

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  if (!src) return <EmptyPhoto label="Photo à compléter" />;
  return <img src={src} alt={alt} className="aspect-[4/3] w-full rounded-2xl object-cover" />;
}

function ctr(clicks: number, impressions: number) {
  if (!impressions) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

function countEvents(events: ReturnType<typeof getAnalyticsEvents>, type: string) {
  return events.filter((event) => event.type.includes(type)).length;
}

function topLabels(events: ReturnType<typeof getAnalyticsEvents>, type: string, fallback: string[]) {
  const map = new Map<string, number>();
  events.filter((event) => event.type.includes(type)).forEach((event) => {
    const label = event.label ?? event.entityId ?? "Recherche";
    map.set(label, (map.get(label) ?? 0) + 1);
  });
  const ranked = [...map.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label);
  return ranked.length ? ranked.slice(0, 5) : fallback;
}

export function AdminDashboard() {
  const auth = useSupabaseAuth();
  const [state, setState] = useAdminState();
  const [active, setActive] = useState<AdminSection>("dashboard");
  const [backStack, setBackStack] = useState<AdminSection[]>([]);
  const [forwardStack, setForwardStack] = useState<AdminSection[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState(state.establishments[0]?.id ?? "");
  const [reviews, setReviews] = useState<ReturnType<typeof getReviews>>([]);
  const [events, setEvents] = useState<ReturnType<typeof getAnalyticsEvents>>([]);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [simpleAdminReady, setSimpleAdminReady] = useState(false);
  const [simpleAdminGranted, setSimpleAdminGranted] = useState(false);
  const [savingAction, setSavingAction] = useState("");

  const goToSection = (section: AdminSection) => {
    if (section === active) return;
    setBackStack((current) => [...current, active].slice(-20));
    setForwardStack([]);
    setActive(section);
  };

  const goBack = () => {
    setBackStack((current) => {
      const previous = current.at(-1);
      if (!previous) return current;
      setForwardStack((next) => [active, ...next].slice(0, 20));
      setActive(previous);
      return current.slice(0, -1);
    });
  };

  const goForward = () => {
    setForwardStack((current) => {
      const next = current[0];
      if (!next) return current;
      setBackStack((previous) => [...previous, active].slice(-20));
      setActive(next);
      return current.slice(1);
    });
  };

  useEffect(() => {
    const granted = hasAdminSession();
    setSimpleAdminGranted(granted);
    setSimpleAdminReady(true);
    if (!granted) {
      window.sessionStorage.setItem("liberty-admin-open-modal", "1");
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      window.location.href = `${basePath || ""}/`;
    }
  }, []);

  const hasAdminAccess = simpleAdminGranted || (auth.configured && auth.isAdmin);

  useEffect(() => {
    setReviews(getReviews());
    setEvents(getAnalyticsEvents());
  }, []);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || supabaseLoaded) return;
    loadAdminStateFromSupabase<AdminState>().then((remoteState) => {
      if (remoteState) {
        setState(normalizeAdminState(remoteState));
        setAdminMessage("Données chargées depuis Supabase.");
      } else {
        setAdminMessage("Aucun état admin Supabase trouvé : fallback local actif.");
      }
      setSupabaseLoaded(true);
    });
  }, [auth.configured, hasAdminAccess, setState, supabaseLoaded]);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || !supabaseLoaded) return;
    const timer = window.setTimeout(() => {
      saveAdminStateToSupabase(state).then((result) => {
        if (!result.ok) setAdminMessage(`Sauvegarde Supabase impossible : ${result.error}`);
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [auth.configured, hasAdminAccess, state, supabaseLoaded]);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess) return;
    fetchRealAnalyticsEvents().then((remoteEvents) => {
      if (!remoteEvents) return;
      setEvents(remoteEvents.map((event) => ({
        id: String(event.id),
        type: String(event.event_type),
        entityId: event.entity_id ? String(event.entity_id) : undefined,
        label: event.label ? String(event.label) : undefined,
        createdAt: String(event.created_at),
      })));
    });
  }, [auth.configured, hasAdminAccess]);

  useEffect(() => {
    if (!state.establishments.find((item) => item.id === selectedEstablishmentId)) {
      setSelectedEstablishmentId(state.establishments[0]?.id ?? "");
    }
  }, [selectedEstablishmentId, state.establishments]);

  const selectedEstablishment = state.establishments.find((item) => item.id === selectedEstablishmentId) ?? state.establishments[0];

  const filteredEstablishments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return state.establishments;
    return state.establishments.filter((item) =>
      [item.name, item.address, item.city, item.arrondissement, item.description, ...item.customerSearches]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [search, state.establishments]);

  const stats = useMemo(() => {
    return [
      { label: "Rubriques", value: state.rubrics.length, icon: Store, trend: `${state.rubrics.filter((item) => item.status === "Publié").length} publiées` },
      { label: "Sous-rubriques", value: state.subrubrics.length, icon: Tags, trend: `${state.subrubrics.filter((item) => item.status === "Publié").length} publiées` },
      { label: "Fiches", value: state.establishments.length, icon: Building2, trend: `${state.establishments.filter((item) => item.status === "Publié").length} publiées` },
      { label: "Tags visibles", value: state.tags.length, icon: Tags, trend: `${state.tags.filter((item) => item.status === "Publié").length} actifs` },
      { label: "Recherches clients", value: state.establishments.reduce((sum, item) => sum + item.customerSearches.length, 0), icon: Search, trend: "mots saisis" },
      { label: "Certifications", value: state.certifications.length, icon: ShieldCheck, trend: `${state.certifications.filter((item) => item.status === "Publié").length} publiées` },
      { label: "Photos", value: state.establishments.reduce((sum, item) => sum + [item.mainPhoto, ...item.photos].filter(Boolean).length, 0), icon: Camera, trend: "visuels fiches" },
      { label: "Corbeille", value: state.trash.length, icon: Trash2, trend: "restaurables" },
    ];
  }, [state]);

  const analytics = useMemo(() => {
    const likes = countEvents(events, "like_added");
    const favorites = countEvents(events, "favorite_added");
    const shares = countEvents(events, "share");
    const searches = countEvents(events, "ai_search");
    const notificationSent = state.notifications.reduce((sum, item) => sum + (item.sentCount ?? 0), 0);
    const notificationOpens = state.notifications.reduce((sum, item) => sum + (item.opens ?? 0), 0);
    const notificationClicks = state.notifications.reduce((sum, item) => sum + (item.clicks ?? 0), 0);
    const bannerImpressions = state.banners.reduce((sum, item) => sum + (item.impressions ?? 0), 0);
    const bannerClicks = state.banners.reduce((sum, item) => sum + (item.clicks ?? 0), 0);
    return {
      visitors: new Set(events.map((event) => event.entityId ?? event.label ?? event.id)).size,
      registeredUsers: auth.user ? 1 : 0,
      connectedUsers: auth.user ? 1 : 0,
      averageTime: events.length ? "Collecte active" : "—",
      searches,
      likes,
      favorites,
      shares,
      phoneClicks: countEvents(events, "phone"),
      whatsappClicks: countEvents(events, "whatsapp"),
      websiteClicks: countEvents(events, "website"),
      reservationClicks: countEvents(events, "reservation"),
      notificationSent,
      notificationOpens,
      notificationClicks,
      bannerImpressions,
      bannerClicks,
    };
  }, [auth.user, events, state.banners, state.notifications]);

  const professionalStats = useMemo(() => {
    const item = selectedEstablishment;
    if (!item) return null;
    const entityEvents = events.filter((event) => event.entityId === item.id || event.entityId === `restaurant-${item.id}` || event.label === item.name);
    return {
      views: entityEvents.filter((event) => event.type.includes("view") || event.type.includes("impression") || event.type.includes("drawer")).length,
      clicks: entityEvents.filter((event) => event.type.includes("click") || event.type.includes("share") || event.type.includes("phone") || event.type.includes("reservation")).length,
      averageTime: entityEvents.length ? "Collecte active" : "—",
      likes: entityEvents.filter((event) => event.type.includes("like")).length,
      favorites: entityEvents.filter((event) => event.type.includes("favorite")).length,
      shares: entityEvents.filter((event) => event.type.includes("share")).length,
      phone: entityEvents.filter((event) => event.type.includes("phone")).length,
      whatsapp: entityEvents.filter((event) => event.type.includes("whatsapp")).length,
      website: entityEvents.filter((event) => event.type.includes("website")).length,
      reservations: entityEvents.filter((event) => event.type.includes("reservation")).length,
      searches: events.filter((event) => event.type.includes("ai_search") && event.entityId === item.id).map((event) => event.label ?? "").filter(Boolean).slice(0, 8),
    };
  }, [events, selectedEstablishment]);

  const updateRubric = (id: string, patch: Partial<AdminRubric>) =>
    setState((current) => ({ ...current, rubrics: current.rubrics.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

  const updateSubrubric = (id: string, patch: Partial<AdminSubrubric>) =>
    setState((current) => ({ ...current, subrubrics: current.subrubrics.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

  const updateEstablishment = (id: string, patch: Partial<AdminEstablishment>) =>
    setState((current) => ({
      ...current,
      establishments: current.establishments.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const updateBanner = (id: string, patch: Partial<AdminBanner>) =>
    setState((current) => ({ ...current, banners: current.banners.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

  const updateNotification = (id: string, patch: Partial<AdminNotification>) =>
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const updateTag = (id: string, patch: Partial<AdminTag>) =>
    setState((current) => ({ ...current, tags: current.tags.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

  const updateCertification = (id: string, patch: Partial<AdminCertification>) =>
    setState((current) => ({ ...current, certifications: current.certifications.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

  const reorderById = (collection: "rubrics" | "subrubrics" | "establishments" | "tags", id: string, direction: -1 | 1) => {
    setState((current) => {
      const list = [...current[collection]].sort((a, b) => a.order - b.order);
      const index = list.findIndex((item) => item.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= list.length) return current;
      const target = list[targetIndex];
      const currentItem = list[index];
      return {
        ...current,
        [collection]: current[collection].map((item) => {
          if (item.id === currentItem.id) return { ...item, order: target.order };
          if (item.id === target.id) return { ...item, order: currentItem.order };
          return item;
        }),
      };
    });
  };

  const moveBeforeById = (collection: "rubrics" | "subrubrics" | "establishments" | "tags", sourceId: string, targetId: string) => {
    setState((current) => {
      const list = [...current[collection]].sort((a, b) => a.order - b.order);
      const source = list.find((item) => item.id === sourceId);
      const withoutSource = list.filter((item) => item.id !== sourceId);
      const targetIndex = withoutSource.findIndex((item) => item.id === targetId);
      if (!source || targetIndex < 0) return current;
      withoutSource.splice(targetIndex, 0, source);
      const reordered = withoutSource.map((item, index) => ({ ...item, order: index + 1 }));
      return { ...current, [collection]: reordered };
    });
  };

  const addRubric = () =>
    setState((current) => {
      const id = newId("rubrique");
      return {
        ...current,
        rubrics: [
          ...current.rubrics,
          { id, name: "Nouvelle rubrique", description: "Description à compléter", icon: "✨", image: "", format: "Carré", order: current.rubrics.length + 1, status: "Brouillon" },
        ],
      };
    });

  const addSubrubric = () =>
    setState((current) => {
      const rubricId = current.rubrics[0]?.id ?? "food";
      return {
        ...current,
        subrubrics: [
          ...current.subrubrics,
          {
            id: newId("sous-rubrique"),
            rubricId,
            name: "Nouvelle sous-rubrique",
            description: "Description à compléter",
            photo: "",
            order: current.subrubrics.length + 1,
            status: "Brouillon",
          },
        ],
      };
    });

  const addEstablishment = () =>
    setState((current) => {
      const firstSubrubric = current.subrubrics[0];
      const id = newId("fiche");
      const establishment: AdminEstablishment = {
        id,
        rubricId: firstSubrubric?.rubricId ?? "food",
        subrubricId: firstSubrubric?.id ?? "food-restaurants",
        mainPhoto: "",
        photos: ["", "", "", ""],
        name: "Nouvel établissement",
        description: "Description à compléter",
        address: "",
        city: "Paris",
        arrondissement: "",
        phone: "",
        whatsapp: "",
        instagram: "",
        website: "",
        hours: "",
        terrace: false,
        delivery: false,
        takeaway: false,
        reservation: false,
        privateHire: false,
        certification: "",
        kosherType: "À compléter",
        averagePrice: "€€",
        latitude: "",
        longitude: "",
        status: "Brouillon",
        sponsorshipLevel: "Standard",
        sponsored: false,
        sponsorPriority: 0,
        sponsorDuration: "",
        order: current.establishments.length + 1,
        customerSearches: [],
        visibleTagIds: [],
        fieldVisibility: defaultFieldVisibility,
      };
      setSelectedEstablishmentId(id);
      return { ...current, establishments: [establishment, ...current.establishments] };
    });

  const addBanner = () =>
    setState((current) => ({
      ...current,
      banners: [
        ...current.banners,
        {
          id: newId("banner"),
          type: "Grande bannière",
          title: "Nouvelle bannière",
          subtitle: "Sous-titre à compléter",
          image: "",
          button: "Découvrir",
          internalLink: "/",
          position: "Home",
          placementTarget: "Accueil",
          order: current.banners.length + 1,
          status: "Brouillon",
          impressions: 0,
          clicks: 0,
          visitors: 0,
        },
      ],
    }));

  const addNotification = () =>
    setState((current) => ({
      ...current,
      notifications: [
        ...current.notifications,
        {
          id: newId("notification"),
          title: "Nouvelle notification",
          text: "Texte à compléter",
          image: "",
          button: "Ouvrir",
          link: "/",
          destination: "/",
          date: today,
          time: "10:00",
          target: "Tous les utilisateurs",
          status: "Brouillon",
          sentCount: 0,
          opens: 0,
          clicks: 0,
          visitors: 0,
        },
      ],
    }));

  const addTag = () =>
    setState((current) => ({
      ...current,
      tags: [...current.tags, { id: newId("tag"), label: "Nouveau tag", kind: "visible", icon: "", color: "#1f4d3b", rubricIds: [], order: current.tags.length + 1, status: "Brouillon" }],
    }));

  const addCertification = () =>
    setState((current) => ({
      ...current,
      certifications: [...current.certifications, { id: newId("certification"), label: "Nouvelle certification", order: current.certifications.length + 1, status: "Brouillon" }],
    }));

  const audit = (action: string, entityType: string, entityId: string, label: string, payload: Record<string, unknown> = {}) => {
    const entry: AuditEntry = { id: newId("audit"), action, entityType, entityId, label, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, audit: [entry, ...current.audit].slice(0, 200) }));
    void writeAuditLog(action, entityType, entityId, label, payload);
  };

  const commitState = (updater: (current: AdminState) => AdminState, successMessage: string, actionLabel = "Sauvegarde") => {
    setSavingAction(actionLabel);
    setAdminMessage(`${actionLabel} en cours…`);
    setState((current) => {
      const next = updater(current);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("liberty-admin-published"));
      if (auth.configured && hasAdminAccess) {
        saveAdminStateToSupabase(next).then((result) => {
          setAdminMessage(result.ok ? successMessage : `Erreur Supabase : ${result.error}`);
          setSavingAction("");
        });
      } else {
        window.setTimeout(() => {
          setAdminMessage(successMessage);
          setSavingAction("");
        }, 250);
      }
      return next;
    });
  };

  const requireFields = (fields: Array<[string, string | number | undefined | null]>) => {
    const missing = fields.filter(([, value]) => String(value ?? "").trim().length === 0).map(([label]) => label);
    if (missing.length) {
      setAdminMessage(`Champ obligatoire manquant : ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const previewPublicUrl = (path: string) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    window.open(`${basePath}${path}`, "_blank", "noopener,noreferrer");
    setAdminMessage("Prévisualisation ouverte dans un nouvel onglet.");
  };

  const saveRubricDraft = (rubric: AdminRubric) => {
    commitState((current) => ({
      ...current,
      rubrics: current.rubrics.map((item) => (item.id === rubric.id ? { ...item, status: "Brouillon", updatedAt: new Date().toISOString() } : item)),
    }), "Rubrique enregistrée en brouillon.", "Sauvegarde");
    audit("brouillon", "rubrique", rubric.id, rubric.name);
  };

  const publishRubric = (rubric: AdminRubric) => {
    const slug = rubric.slug || slugify(rubric.name);
    if (!requireFields([["nom", rubric.name], ["slug", slug], ["description", rubric.description], ["icône", rubric.icon], ["image principale", rubric.image], ["texte alternatif", rubric.imageAlt], ["ordre d’affichage", rubric.order]])) return;
    commitState((current) => ({
      ...current,
      rubrics: current.rubrics.map((item) => (item.id === rubric.id ? { ...item, slug, status: "Publié", showOnHome: item.showOnHome ?? true, updatedAt: new Date().toISOString() } : item)),
    }), "Rubrique publiée avec succès.", "Publication");
    audit("publication", "rubrique", rubric.id, rubric.name);
  };

  const saveSubrubricDraft = (subrubric: AdminSubrubric) => {
    commitState((current) => ({
      ...current,
      subrubrics: current.subrubrics.map((item) => (item.id === subrubric.id ? { ...item, status: "Brouillon" } : item)),
    }), "Sous-rubrique enregistrée en brouillon.", "Sauvegarde");
    audit("brouillon", "sous-rubrique", subrubric.id, subrubric.name);
  };

  const publishSubrubric = (subrubric: AdminSubrubric) => {
    const slug = subrubric.slug || slugify(subrubric.name);
    if (!requireFields([["nom", subrubric.name], ["slug", slug], ["description", subrubric.description], ["photo", subrubric.photo], ["ordre", subrubric.order]])) return;
    commitState((current) => ({
      ...current,
      subrubrics: current.subrubrics.map((item) => (item.id === subrubric.id ? { ...item, slug, status: "Publié", visible: true } : item)),
    }), "Sous-rubrique publiée avec succès.", "Publication");
    audit("publication", "sous-rubrique", subrubric.id, subrubric.name);
  };

  const saveEstablishmentDraft = (establishment: AdminEstablishment) => {
    commitState((current) => ({
      ...current,
      establishments: current.establishments.map((item) => (item.id === establishment.id ? { ...item, status: "Brouillon" } : item)),
    }), "Fiche enregistrée en brouillon.", "Sauvegarde");
    audit("brouillon", "fiche", establishment.id, establishment.name);
  };

  const publishEstablishment = (establishment: AdminEstablishment) => {
    const slug = establishment.slug || slugify(establishment.name);
    if (!requireFields([["nom", establishment.name], ["slug", slug], ["description", establishment.description], ["photo principale", establishment.mainPhoto], ["rubrique", establishment.rubricId], ["sous-rubrique", establishment.subrubricId]])) return;
    commitState((current) => ({
      ...current,
      establishments: current.establishments.map((item) => (item.id === establishment.id ? { ...item, slug, status: "Publié", visible: true } : item)),
    }), "Fiche publiée avec succès.", "Publication");
    audit("publication", "fiche", establishment.id, establishment.name);
  };

  const saveTagDraft = (tag: AdminTag) => {
    commitState((current) => ({
      ...current,
      tags: current.tags.map((item) => (item.id === tag.id ? { ...item, status: "Brouillon" } : item)),
    }), "Tag enregistré en brouillon.", "Sauvegarde");
    audit("brouillon", "tag", tag.id, tag.label);
  };

  const publishTag = (tag: AdminTag) => {
    if (!requireFields([["nom", tag.label], ["ordre", tag.order]])) return;
    commitState((current) => ({
      ...current,
      tags: current.tags.map((item) => (item.id === tag.id ? { ...item, status: "Publié" } : item)),
    }), "Tag publié avec succès.", "Publication");
    audit("publication", "tag", tag.id, tag.label);
  };

  const saveCertificationDraft = (certification: AdminCertification) => {
    commitState((current) => ({
      ...current,
      certifications: current.certifications.map((item) => (item.id === certification.id ? { ...item, status: "Brouillon" } : item)),
    }), "Certification enregistrée en brouillon.", "Sauvegarde");
    audit("brouillon", "certification", certification.id, certification.label);
  };

  const publishCertification = (certification: AdminCertification) => {
    if (!requireFields([["nom", certification.label], ["ordre", certification.order]])) return;
    commitState((current) => ({
      ...current,
      certifications: current.certifications.map((item) => (item.id === certification.id ? { ...item, status: "Publié" } : item)),
    }), "Certification publiée avec succès.", "Publication");
    audit("publication", "certification", certification.id, certification.label);
  };

  const moveToTrash = <T extends { id: string }>(entityType: string, label: string, payload: T, apply: (current: AdminState) => AdminState) => {
    const trashItem: TrashItem = {
      id: newId("trash"),
      entityType,
      label,
      deletedAt: new Date().toISOString(),
      deletedBy: auth.user?.email ?? "admin local",
      payload,
    };
    setState((current) => ({ ...apply(current), trash: [trashItem, ...current.trash] }));
    audit("suppression_corbeille", entityType, payload.id, label, { trashItem });
  };

  const restoreTrashItem = (trashItem: TrashItem) => {
    setState((current) => {
      const next = { ...current, trash: current.trash.filter((item) => item.id !== trashItem.id) };
      if (trashItem.entityType === "rubrique") next.rubrics = [trashItem.payload as AdminRubric, ...next.rubrics];
      if (trashItem.entityType === "sous-rubrique") next.subrubrics = [trashItem.payload as AdminSubrubric, ...next.subrubrics];
      if (trashItem.entityType === "fiche") next.establishments = [trashItem.payload as AdminEstablishment, ...next.establishments];
      if (trashItem.entityType === "bannière") next.banners = [trashItem.payload as AdminBanner, ...next.banners];
      if (trashItem.entityType === "tag") next.tags = [trashItem.payload as AdminTag, ...next.tags];
      if (trashItem.entityType === "certification") next.certifications = [trashItem.payload as AdminCertification, ...next.certifications];
      if (trashItem.entityType === "notification") next.notifications = [trashItem.payload as AdminNotification, ...next.notifications];
      return next;
    });
    audit("restauration", trashItem.entityType, trashItem.id, trashItem.label);
  };

  if (!simpleAdminReady) {
    return (
      <section className="page-shell py-16">
        <div className="rounded-4xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-ink/45">Vérification de l’accès administrateur…</p>
        </div>
      </section>
    );
  }

  if (!hasAdminAccess) return null;

  if (auth.configured && auth.loading && !simpleAdminGranted) {
    return (
      <section className="page-shell py-16">
        <div className="rounded-4xl bg-white p-10 text-center shadow-soft">
          <p className="text-sm text-ink/45">Vérification des droits administrateur…</p>
        </div>
      </section>
    );
  }

  if (auth.configured && !auth.user && !simpleAdminGranted) {
    return (
      <section className="page-shell py-16">
        <div className="mx-auto max-w-xl rounded-4xl bg-white p-10 shadow-soft">
          <span className="grid size-12 place-items-center rounded-2xl bg-cream text-ink"><ShieldCheck size={22} /></span>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-.04em]">Connexion administrateur</h1>
          <p className="mt-3 text-sm leading-6 text-ink/50">Connectez-vous avec un compte ayant le rôle admin. Les données privées restent protégées par Supabase RLS.</p>
          <div className="mt-7 grid gap-3">
            <button onClick={() => void auth.signInWithGoogle()} className="rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold">Continuer avec Google</button>
            <button onClick={() => void auth.signInWithApple()} className="rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold">Continuer avec Apple</button>
            <input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} type="email" placeholder="Email admin" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
            <input value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} type="password" placeholder="Mot de passe" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
            <button onClick={() => void auth.signInWithEmail(adminEmail, adminPassword)} className="rounded-2xl bg-ink py-4 text-sm font-semibold text-white">Connexion Email</button>
          </div>
        </div>
      </section>
    );
  }

  if (auth.configured && !auth.isAdmin && !simpleAdminGranted) {
    return (
      <section className="page-shell py-16">
        <div className="mx-auto max-w-xl rounded-4xl bg-white p-10 text-center shadow-soft">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream text-ink"><ShieldCheck size={22} /></span>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-.04em]">Accès non autorisé</h1>
          <p className="mt-3 text-sm leading-6 text-ink/50">Votre compte est connecté mais ne possède pas le rôle admin. Aucune donnée privée du Dashboard n’a été chargée.</p>
          <button onClick={() => void auth.signOut()} className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Se déconnecter</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell py-8">
      <div className="overflow-hidden rounded-4xl border border-black/5 bg-[#f2f3ef] shadow-soft">
        <div className="flex min-h-[840px]">
          <aside className="hidden w-72 shrink-0 flex-col bg-ink p-6 text-white lg:flex">
            <a href="/" className="mb-10 flex items-center gap-3 text-lg font-semibold">
              <span className="grid size-9 place-items-center rounded-xl bg-white text-moss">ל</span>
              liberty admin
            </a>
            <nav className="space-y-1 text-sm">
              {menu.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToSection(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                    active === id ? "bg-white/10 font-medium text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={17} /> {label}
                </button>
              ))}
            </nav>
            <div className="mt-auto rounded-3xl bg-white/8 p-4 text-xs text-white/55">
              <p className="font-semibold text-white">Centre de pilotage</p>
              <p className="mt-1 leading-relaxed">Créez, publiez, masquez, réorganisez et restaurez vos contenus depuis un seul endroit.</p>
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
            <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-ink/45">Administration Liberty</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Gérer Liberty sans toucher au code</h1>
                <p className="mt-2 text-xs text-ink/40">
                  {auth.configured ? `${auth.user?.email ?? "Admin"} · connecté à Supabase` : "Mode local actif · connectez Supabase pour publier sur tous les appareils."}
                  {adminMessage ? ` · ${adminMessage}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-[260px] items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm">
                  <Search size={17} className="text-ink/35" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Rechercher une fiche, une ville, un tag..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-ink/35"
                  />
                </div>
                <button onClick={() => goToSection("dashboard")} className="grid size-11 place-items-center rounded-full bg-white shadow-sm" aria-label="Retour au Dashboard">
                  <Home size={18} />
                </button>
                {auth.configured && (
                  <button onClick={() => void auth.signOut()} className="rounded-full bg-ink px-4 py-3 text-xs font-semibold text-white">Déconnexion</button>
                )}
              </div>
            </header>

            <div className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {menu.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToSection(id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${active === id ? "bg-ink text-white" : "bg-white text-ink/55"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-white/70 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={!backStack.length}
                  className="grid size-10 place-items-center rounded-full bg-cream text-ink transition hover:bg-sage disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Retour"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={goForward}
                  disabled={!forwardStack.length}
                  className="grid size-10 place-items-center rounded-full bg-cream text-ink transition hover:bg-sage disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Avancer"
                >
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => goToSection("dashboard")}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white"
                >
                  <Home size={14} /> Retour au Dashboard
                </button>
              </div>
              <div className="text-xs text-ink/40">
                Liberty Admin <span className="mx-1 text-ink/20">/</span> <span className="font-semibold text-ink/65">{menuLabelById[active] ?? "Gestion avancée"}</span>
              </div>
            </div>

            {adminMessage && (
              <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
                adminMessage.toLowerCase().includes("erreur") || adminMessage.toLowerCase().includes("manquant")
                  ? "border-rose-100 bg-rose-50 text-rose-600"
                  : savingAction
                    ? "border-amber-100 bg-amber-50 text-amber-700"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
              }`}>
                {adminMessage}
              </div>
            )}

            {active === "dashboard" && (
              <div className="mt-8 space-y-6">
                <div className="rounded-4xl bg-ink p-5 text-white shadow-soft sm:p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Gestion des contenus</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Ajouter ou modifier Liberty</h2>
                      <p className="mt-1 text-sm text-white/50">Commence ici pour créer des rubriques, sous-rubriques, fiches, tags et gérer l’ordre d’affichage.</p>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/60">Sans code</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {[
                      { id: "rubrics", label: "Rubriques", text: "Créer une catégorie Home", icon: Store },
                      { id: "subrubrics", label: "Sous-rubriques", text: "Créer les sections internes", icon: Tags },
                      { id: "establishments", label: "Fiches", text: "Ajouter une adresse", icon: Building2 },
                      { id: "tags", label: "Tags visibles", text: "Badges affichés", icon: Tags },
                      { id: "customer-searches", label: "Recherches", text: "Mots Liberty IA", icon: Search },
                      { id: "photos", label: "Photos", text: "Images & galeries", icon: Camera },
                      { id: "certifications", label: "Certifications", text: "Cacher & labels", icon: ShieldCheck },
                      { id: "page-order", label: "Ordre", text: "Réorganiser l’affichage", icon: GripVertical },
                      { id: "trash", label: "Corbeille", text: "Restaurer / supprimer", icon: Trash2 },
                    ].map(({ id, label, text, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => goToSection(id as AdminSection)}
                        className="group rounded-3xl bg-white/8 p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-ink"
                      >
                        <span className="grid size-10 place-items-center rounded-2xl bg-white/10 text-gold transition group-hover:bg-cream group-hover:text-moss"><Icon size={18} /></span>
                        <span className="mt-4 block text-sm font-semibold">{label}</span>
                        <span className="mt-1 block text-[11px] leading-4 text-white/45 transition group-hover:text-ink/45">{text}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map(({ label, value, trend, icon: Icon }) => (
                    <article key={label} className="rounded-3xl bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <span className="grid size-10 place-items-center rounded-xl bg-sage text-moss"><Icon size={18} /></span>
                        <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink/50">{trend}</span>
                      </div>
                      <p className="mt-6 text-2xl font-semibold tracking-tight">{value}</p>
                      <p className="mt-1 text-xs text-ink/40">{label}</p>
                    </article>
                  ))}
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.4fr_.6fr]">
                  <Panel title="État des contenus" subtitle="Ce tableau affiche uniquement les éléments réellement présents dans l’Admin.">
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {(["rubrics", "subrubrics", "establishments"] as const).map((collection) => {
                        const labels = { rubrics: "Rubriques", subrubrics: "Sous-rubriques", establishments: "Fiches" };
                        const list = state[collection];
                        return (
                          <div key={collection} className="rounded-3xl bg-white p-5">
                            <p className="text-sm font-semibold">{labels[collection]}</p>
                            <div className="mt-4 space-y-2 text-xs text-ink/55">
                              <p>Publié : {list.filter((item) => item.status === "Publié").length}</p>
                              <p>Brouillon : {list.filter((item) => item.status === "Brouillon").length}</p>
                              <p>Masqué : {list.filter((item) => item.status === "Masqué").length}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                  <Panel title="Actions rapides" subtitle="Création directe des contenus.">
                    <div className="mt-5 grid gap-3">
                      <QuickAction label="Ajouter une rubrique" onClick={addRubric} />
                      <QuickAction label="Ajouter une sous-rubrique" onClick={addSubrubric} />
                      <QuickAction label="Ajouter un établissement" onClick={addEstablishment} />
                      <QuickAction label="Créer un tag visible" onClick={addTag} />
                      <QuickAction label="Ajouter une certification" onClick={addCertification} />
                      <QuickAction label="Gérer les photos" onClick={() => goToSection("photos")} />
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {active === "rubrics" && (
              <Panel title="Rubriques" subtitle="Ajouter, modifier, masquer, publier et organiser les catégories principales." actionLabel="Ajouter une rubrique" onAction={addRubric}>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {state.rubrics.sort((a, b) => a.order - b.order).map((rubric) => (
                    <article key={rubric.id} className="rounded-3xl border border-black/5 bg-white p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(rubric.status)}`}>{rubric.status}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { const copy = { ...rubric, id: newId("rubrique"), name: `${rubric.name} copie`, slug: `${rubric.slug ?? slugify(rubric.name)}-copie`, status: "Brouillon" as AdminStatus, order: state.rubrics.length + 1 }; setState((current) => ({ ...current, rubrics: [copy, ...current.rubrics] })); audit("duplication", "rubrique", rubric.id, rubric.name); }} className="grid size-9 place-items-center rounded-full bg-sage text-moss">
                            <Plus size={15} />
                          </button>
                          <button onClick={() => updateRubric(rubric.id, { status: "Publié" })} className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={15} />
                          </button>
                          <button onClick={() => reorderById("rubrics", rubric.id, -1)} className="grid size-9 place-items-center rounded-full bg-cream text-ink/55">↑</button>
                          <button onClick={() => reorderById("rubrics", rubric.id, 1)} className="grid size-9 place-items-center rounded-full bg-cream text-ink/55">↓</button>
                          <button onClick={() => updateRubric(rubric.id, { status: rubric.status === "Masqué" ? "Publié" : "Masqué" })} className="grid size-9 place-items-center rounded-full bg-cream text-ink/55">
                            {rubric.status === "Masqué" ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            onClick={() => moveToTrash("rubrique", rubric.name, rubric, (current) => ({ ...current, rubrics: current.rubrics.filter((item) => item.id !== rubric.id) }))}
                            className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <FormActionBar
                        disabled={Boolean(savingAction)}
                        onDraft={() => saveRubricDraft(rubric)}
                        onPreview={() => previewPublicUrl(`/${rubric.slug ?? slugify(rubric.name)}`)}
                        onPublish={() => publishRubric(rubric)}
                        onHide={() => commitState((current) => ({ ...current, rubrics: current.rubrics.map((item) => item.id === rubric.id ? { ...item, status: "Masqué" } : item) }), "Rubrique masquée avec succès.", "Masquage")}
                        onTrash={() => moveToTrash("rubrique", rubric.name, rubric, (current) => ({ ...current, rubrics: current.rubrics.filter((item) => item.id !== rubric.id) }))}
                      />
                      <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr]">
                        <PreviewImage src={rubric.image} alt={rubric.name} />
                        <div className="grid gap-3">
                          <Field label="Nom" value={rubric.name} onChange={(value) => updateRubric(rubric.id, { name: value })} />
                          <Field label="Description" value={rubric.description} onChange={(value) => updateRubric(rubric.id, { description: value })} textarea />
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Field label="Slug" value={rubric.slug ?? slugify(rubric.name)} onChange={(value) => updateRubric(rubric.id, { slug: value })} />
                        <Field label="Icône" value={rubric.icon} onChange={(value) => updateRubric(rubric.id, { icon: value })} />
                        <ImageUploadField label="Image" value={rubric.image} folder="rubrics" onChange={(value) => updateRubric(rubric.id, { image: value })} />
                        <Field label="Texte alternatif" value={rubric.imageAlt ?? ""} onChange={(value) => updateRubric(rubric.id, { imageAlt: value })} />
                        <Field label="Ordre" value={rubric.order} type="number" onChange={(value) => updateRubric(rubric.id, { order: Number(value) })} />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <SelectField label="Statut" value={rubric.status} onChange={(value) => updateRubric(rubric.id, { status: value as AdminStatus })}>
                          <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                        </SelectField>
                        <SelectField label="Format de carte" value={rubric.format ?? "Carré"} onChange={(value) => updateRubric(rubric.id, { format: value as RubricFormat })}>
                          <option>Petit carré</option>
                          <option>Carré</option>
                          <option>Grand carré</option>
                          <option>Rectangle horizontal</option>
                          <option>Bannière</option>
                        </SelectField>
                        <Toggle label="Afficher sur la Home" checked={rubric.showOnHome ?? true} onChange={(value) => updateRubric(rubric.id, { showOnHome: value })} />
                        <Field label="Mots-clés" value={(rubric.searchKeywords ?? []).join(", ")} onChange={(value) => updateRubric(rubric.id, { searchKeywords: cleanTextList(value) })} />
                        <SelectField label="Colonnes desktop" value={String(rubric.columnsDesktop ?? 3)} onChange={(value) => updateRubric(rubric.id, { columnsDesktop: Number(value) as 2 | 3 | 4 })}>
                          <option value="2">2 colonnes</option><option value="3">3 colonnes</option><option value="4">4 colonnes</option>
                        </SelectField>
                        <SelectField label="Colonnes tablette" value={String(rubric.columnsTablet ?? 2)} onChange={(value) => updateRubric(rubric.id, { columnsTablet: Number(value) as 1 | 2 | 3 })}>
                          <option value="1">1 colonne</option><option value="2">2 colonnes</option><option value="3">3 colonnes</option>
                        </SelectField>
                        <SelectField label="Colonnes mobile" value={String(rubric.columnsMobile ?? 1)} onChange={(value) => updateRubric(rubric.id, { columnsMobile: Number(value) as 1 | 2 })}>
                          <option value="1">1 colonne</option><option value="2">2 colonnes</option>
                        </SelectField>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "subrubrics" && (
              <Panel title="Sous-rubriques" subtitle="Créer autant de sous-rubriques que nécessaire pour chaque rubrique." actionLabel="Ajouter une sous-rubrique" onAction={addSubrubric}>
                <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white">
                  {state.subrubrics.sort((a, b) => a.order - b.order).map((subrubric) => (
                    <div key={subrubric.id} className="grid gap-3 border-b border-black/5 p-4 last:border-b-0 lg:grid-cols-[36px_1fr_1fr_90px_140px_148px] lg:items-center">
                      <GripVertical size={16} className="text-ink/25" />
                      <Field label="Nom" value={subrubric.name} onChange={(value) => updateSubrubric(subrubric.id, { name: value })} />
                      <SelectField label="Rubrique" value={subrubric.rubricId} onChange={(value) => updateSubrubric(subrubric.id, { rubricId: value })}>
                        {state.rubrics.map((rubric) => <option key={rubric.id} value={rubric.id}>{rubric.name}</option>)}
                      </SelectField>
                      <Field label="Ordre" value={subrubric.order} type="number" onChange={(value) => updateSubrubric(subrubric.id, { order: Number(value) })} />
                      <SelectField label="Statut" value={subrubric.status} onChange={(value) => updateSubrubric(subrubric.id, { status: value as AdminStatus })}>
                        <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                      </SelectField>
                      <div className="flex gap-2">
                        <button onClick={() => reorderById("subrubrics", subrubric.id, -1)} className="grid size-8 place-items-center rounded-full bg-cream text-ink/55">↑</button>
                        <button onClick={() => reorderById("subrubrics", subrubric.id, 1)} className="grid size-8 place-items-center rounded-full bg-cream text-ink/55">↓</button>
                        <button onClick={() => { const copy = { ...subrubric, id: newId("sous-rubrique"), name: `${subrubric.name} copie`, slug: `${subrubric.slug ?? slugify(subrubric.name)}-copie`, status: "Brouillon" as AdminStatus, order: state.subrubrics.length + 1 }; setState((current) => ({ ...current, subrubrics: [copy, ...current.subrubrics] })); audit("duplication", "sous-rubrique", subrubric.id, subrubric.name); }} className="grid size-8 place-items-center rounded-full bg-sage text-moss"><Plus size={13} /></button>
                        <button
                          onClick={() => moveToTrash("sous-rubrique", subrubric.name, subrubric, (current) => ({ ...current, subrubrics: current.subrubrics.filter((item) => item.id !== subrubric.id) }))}
                          className="grid size-8 place-items-center rounded-full bg-rose-50 text-rose-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="lg:col-span-6">
                        <FormActionBar
                          disabled={Boolean(savingAction)}
                          onDraft={() => saveSubrubricDraft(subrubric)}
                          onPreview={() => {
                            const rubric = state.rubrics.find((item) => item.id === subrubric.rubricId);
                            previewPublicUrl(`/${rubric?.slug ?? subrubric.rubricId}/${subrubric.slug ?? slugify(subrubric.name)}`);
                          }}
                          onPublish={() => publishSubrubric(subrubric)}
                          onHide={() => commitState((current) => ({ ...current, subrubrics: current.subrubrics.map((item) => item.id === subrubric.id ? { ...item, status: "Masqué", visible: false } : item) }), "Sous-rubrique masquée avec succès.", "Masquage")}
                          onTrash={() => moveToTrash("sous-rubrique", subrubric.name, subrubric, (current) => ({ ...current, subrubrics: current.subrubrics.filter((item) => item.id !== subrubric.id) }))}
                        />
                        <div className="grid gap-3 lg:grid-cols-2">
                          <Field label="Slug" value={subrubric.slug ?? slugify(subrubric.name)} onChange={(value) => updateSubrubric(subrubric.id, { slug: value })} />
                          <Field label="Description" value={subrubric.description} onChange={(value) => updateSubrubric(subrubric.id, { description: value })} />
                          <ImageUploadField label="Photo" value={subrubric.photo} folder="subrubrics" onChange={(value) => updateSubrubric(subrubric.id, { photo: value })} />
                          <Field label="Texte alternatif" value={subrubric.imageAlt ?? ""} onChange={(value) => updateSubrubric(subrubric.id, { imageAlt: value })} />
                          <Field label="Icône" value={subrubric.icon ?? ""} onChange={(value) => updateSubrubric(subrubric.id, { icon: value })} />
                          <SelectField label="Colonnes de grille" value={String(subrubric.gridColumns ?? 3)} onChange={(value) => updateSubrubric(subrubric.id, { gridColumns: Number(value) as 1 | 2 | 3 | 4 })}>
                            <option value="1">1 colonne</option><option value="2">2 colonnes</option><option value="3">3 colonnes</option><option value="4">4 colonnes</option>
                          </SelectField>
                          <Toggle label="Affichage sur le site" checked={subrubric.visible ?? true} onChange={(value) => updateSubrubric(subrubric.id, { visible: value })} />
                          <Field label="Mots-clés" value={(subrubric.searchKeywords ?? []).join(", ")} onChange={(value) => updateSubrubric(subrubric.id, { searchKeywords: cleanTextList(value) })} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {active === "establishments" && selectedEstablishment && (
              <div className="mt-8 grid gap-5 xl:grid-cols-[330px_1fr]">
                <Panel title="Établissements" subtitle={`${filteredEstablishments.length} fiches disponibles`} actionLabel="Ajouter" onAction={addEstablishment}>
                  <div className="mt-5 max-h-[720px] space-y-2 overflow-y-auto pr-1">
                    {filteredEstablishments.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedEstablishmentId(item.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                          selectedEstablishment.id === item.id ? "bg-ink text-white" : "bg-cream hover:bg-sage"
                        }`}
                      >
                        <img src={item.mainPhoto || categories[0]?.image} alt="" className="size-12 rounded-xl object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{item.name}</span>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] ${selectedEstablishment.id === item.id ? "bg-white/10 text-white/60" : "bg-white text-ink/40"}`}>
                            {item.status} · {item.sponsorshipLevel ?? (item.sponsored ? "Sponsorisé" : "Standard")}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col gap-1">
                          <span onClick={(event) => { event.stopPropagation(); reorderById("establishments", item.id, -1); }} className="grid size-6 place-items-center rounded-full bg-white/70 text-[10px] text-ink">↑</span>
                          <span onClick={(event) => { event.stopPropagation(); reorderById("establishments", item.id, 1); }} className="grid size-6 place-items-center rounded-full bg-white/70 text-[10px] text-ink">↓</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Panel>

                <Panel title={selectedEstablishment.name} subtitle="Fiche éditable complète, prête à être branchée sur Supabase.">
                  <div className="mt-6 grid gap-6">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => { const copy = { ...selectedEstablishment, id: newId("fiche"), name: `${selectedEstablishment.name} copie`, slug: `${selectedEstablishment.slug ?? slugify(selectedEstablishment.name)}-copie`, status: "Brouillon" as AdminStatus }; setState((current) => ({ ...current, establishments: [copy, ...current.establishments] })); setSelectedEstablishmentId(copy.id); audit("duplication", "fiche", selectedEstablishment.id, selectedEstablishment.name); }} className="rounded-full bg-sage px-4 py-2 text-xs font-semibold text-moss">Dupliquer</button>
                      <button onClick={() => updateEstablishment(selectedEstablishment.id, { status: selectedEstablishment.status === "Publié" ? "Masqué" : "Publié" })} className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/55">{selectedEstablishment.status === "Publié" ? "Masquer" : "Publier"}</button>
                      <button onClick={() => moveToTrash("fiche", selectedEstablishment.name, selectedEstablishment, (current) => ({ ...current, establishments: current.establishments.filter((item) => item.id !== selectedEstablishment.id) }))} className="rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-500">Envoyer à la corbeille</button>
                    </div>
                    <FormActionBar
                      disabled={Boolean(savingAction)}
                      onDraft={() => saveEstablishmentDraft(selectedEstablishment)}
                      onPreview={() => {
                        const rubric = state.rubrics.find((item) => item.id === selectedEstablishment.rubricId);
                        const subrubric = state.subrubrics.find((item) => item.id === selectedEstablishment.subrubricId);
                        previewPublicUrl(`/${rubric?.slug ?? selectedEstablishment.rubricId}/${subrubric?.slug ?? ""}#${selectedEstablishment.slug ?? selectedEstablishment.id}`.replace(/\/#/g, "#"));
                      }}
                      onPublish={() => publishEstablishment(selectedEstablishment)}
                      onHide={() => commitState((current) => ({ ...current, establishments: current.establishments.map((item) => item.id === selectedEstablishment.id ? { ...item, status: "Masqué", visible: false } : item) }), "Fiche masquée avec succès.", "Masquage")}
                      onTrash={() => moveToTrash("fiche", selectedEstablishment.name, selectedEstablishment, (current) => ({ ...current, establishments: current.establishments.filter((item) => item.id !== selectedEstablishment.id) }))}
                    />
                    {(() => {
                      const completeness = getCompleteness(selectedEstablishment);
                      return (
                        <div className="rounded-3xl border border-black/[.06] bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold">Complétude de la fiche</p>
                              <p className="mt-1 text-xs leading-5 text-ink/45">Liberty vérifie les informations importantes avant publication.</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-32 overflow-hidden rounded-full bg-cream">
                                <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${completeness.score}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-moss">{completeness.score}%</span>
                            </div>
                          </div>
                          {completeness.missing.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {completeness.missing.map((item) => (
                                <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{item} à compléter</span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-4 rounded-full bg-sage px-3 py-2 text-xs font-semibold text-moss">Fiche prête à être publiée.</p>
                          )}
                        </div>
                      );
                    })()}
                    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                      <PreviewImage src={selectedEstablishment.mainPhoto} alt={selectedEstablishment.name} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <ImageUploadField label="Photo principale" value={selectedEstablishment.mainPhoto} folder="establishments" onChange={(value) => updateEstablishment(selectedEstablishment.id, { mainPhoto: value })} />
                          {selectedEstablishment.mainPhoto && (
                            <button onClick={() => updateEstablishment(selectedEstablishment.id, { mainPhoto: "" })} className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">Supprimer la photo</button>
                          )}
                        </div>
                      {selectedEstablishment.photos.map((photo, index) => (
                          <div key={index} className="grid gap-2">
                            <Field
                              label={`Photo ${index + 1}`}
                              value={photo}
                              onChange={(value) => {
                                const photos = [...selectedEstablishment.photos];
                                photos[index] = value;
                                updateEstablishment(selectedEstablishment.id, { photos });
                              }}
                            />
                            <Field
                              label={`Alt photo ${index + 1}`}
                              value={selectedEstablishment.photoAlts?.[index] ?? ""}
                              onChange={(value) => {
                                const photoAlts = [...(selectedEstablishment.photoAlts ?? ["", "", "", ""])];
                                photoAlts[index] = value;
                                updateEstablishment(selectedEstablishment.id, { photoAlts });
                              }}
                            />
                            {photo && (
                              <button
                                onClick={() => {
                                  const photos = [...selectedEstablishment.photos];
                                  photos[index] = "";
                                  updateEstablishment(selectedEstablishment.id, { photos });
                                }}
                                className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <Field label="Nom" value={selectedEstablishment.name} onChange={(value) => updateEstablishment(selectedEstablishment.id, { name: value })} />
                      <Field label="Slug" value={selectedEstablishment.slug ?? slugify(selectedEstablishment.name)} onChange={(value) => updateEstablishment(selectedEstablishment.id, { slug: value })} />
                      <SelectField label="Rubrique" value={selectedEstablishment.rubricId} onChange={(value) => updateEstablishment(selectedEstablishment.id, { rubricId: value, subrubricId: state.subrubrics.find((item) => item.rubricId === value)?.id ?? selectedEstablishment.subrubricId })}>
                        {state.rubrics.map((rubric) => <option key={rubric.id} value={rubric.id}>{rubric.name}</option>)}
                      </SelectField>
                      <SelectField label="Sous-rubrique" value={selectedEstablishment.subrubricId} onChange={(value) => {
                        const subrubric = state.subrubrics.find((item) => item.id === value);
                        updateEstablishment(selectedEstablishment.id, { subrubricId: value, rubricId: subrubric?.rubricId ?? selectedEstablishment.rubricId });
                      }}>
                        {state.subrubrics.map((subrubric) => <option key={subrubric.id} value={subrubric.id}>{state.rubrics.find((item) => item.id === subrubric.rubricId)?.name} → {subrubric.name}</option>)}
                      </SelectField>
                      <Field label="Description courte" value={selectedEstablishment.shortDescription ?? ""} onChange={(value) => updateEstablishment(selectedEstablishment.id, { shortDescription: value })} />
                      <Field label="Description" value={selectedEstablishment.description} textarea onChange={(value) => updateEstablishment(selectedEstablishment.id, { description: value })} />
                      <HoursEditor value={selectedEstablishment.hours} onChange={(value) => updateEstablishment(selectedEstablishment.id, { hours: value })} />
                      <Field label="Adresse" value={selectedEstablishment.address} onChange={(value) => updateEstablishment(selectedEstablishment.id, { address: value })} />
                      <Field label="Ville" value={selectedEstablishment.city} onChange={(value) => updateEstablishment(selectedEstablishment.id, { city: value })} />
                      <Field label="Arrondissement" value={selectedEstablishment.arrondissement} onChange={(value) => updateEstablishment(selectedEstablishment.id, { arrondissement: value })} />
                      <Field label="Code postal" value={selectedEstablishment.postalCode ?? ""} onChange={(value) => updateEstablishment(selectedEstablishment.id, { postalCode: value })} />
                      <Field label="Email" value={selectedEstablishment.email ?? ""} onChange={(value) => updateEstablishment(selectedEstablishment.id, { email: value })} />
                      <Field label="Téléphone" value={selectedEstablishment.phone} onChange={(value) => updateEstablishment(selectedEstablishment.id, { phone: value })} />
                      <Field label="WhatsApp" value={selectedEstablishment.whatsapp} onChange={(value) => updateEstablishment(selectedEstablishment.id, { whatsapp: value })} />
                      <Field label="Instagram" value={selectedEstablishment.instagram} onChange={(value) => updateEstablishment(selectedEstablishment.id, { instagram: value })} />
                      <Field label="Site Internet" value={selectedEstablishment.website} onChange={(value) => updateEstablishment(selectedEstablishment.id, { website: value })} />
                      <SelectField label="Certification cacher" value={selectedEstablishment.certification} onChange={(value) => updateEstablishment(selectedEstablishment.id, { certification: value })}>
                        <option value="">À compléter</option>
                        {state.certifications.filter((item) => item.status !== "Masqué").sort((a, b) => a.order - b.order).map((certification) => <option key={certification.id}>{certification.label}</option>)}
                      </SelectField>
                      <SelectField label="Type" value={selectedEstablishment.kosherType} onChange={(value) => updateEstablishment(selectedEstablishment.id, { kosherType: value as KosherType })}>
                        <option>Bassari</option><option>Halavi</option><option>Parvé</option><option>À compléter</option>
                      </SelectField>
                      <Field label="Prix moyen" value={selectedEstablishment.averagePrice} onChange={(value) => updateEstablishment(selectedEstablishment.id, { averagePrice: value })} />
                      <Field label="Types de cuisine" value={(selectedEstablishment.cuisineTypes ?? []).join(", ")} onChange={(value) => updateEstablishment(selectedEstablishment.id, { cuisineTypes: cleanTextList(value) })} />
                      <Field label="Latitude" value={selectedEstablishment.latitude} onChange={(value) => updateEstablishment(selectedEstablishment.id, { latitude: value })} />
                      <Field label="Longitude" value={selectedEstablishment.longitude} onChange={(value) => updateEstablishment(selectedEstablishment.id, { longitude: value })} />
                      <Field label="Ordre d’affichage" value={selectedEstablishment.order} type="number" onChange={(value) => updateEstablishment(selectedEstablishment.id, { order: Number(value) })} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <Toggle label="Terrasse" checked={selectedEstablishment.terrace} onChange={(value) => updateEstablishment(selectedEstablishment.id, { terrace: value })} />
                      <Toggle label="Livraison" checked={selectedEstablishment.delivery} onChange={(value) => updateEstablishment(selectedEstablishment.id, { delivery: value })} />
                      <Toggle label="À emporter" checked={selectedEstablishment.takeaway} onChange={(value) => updateEstablishment(selectedEstablishment.id, { takeaway: value })} />
                      <Toggle label="Réservation" checked={selectedEstablishment.reservation} onChange={(value) => updateEstablishment(selectedEstablishment.id, { reservation: value })} />
                      <Toggle label="Privatisation" checked={selectedEstablishment.privateHire} onChange={(value) => updateEstablishment(selectedEstablishment.id, { privateHire: value })} />
                      <Toggle label="Visible sur le site" checked={selectedEstablishment.visible ?? true} onChange={(value) => updateEstablishment(selectedEstablishment.id, { visible: value })} />
                      <Toggle label="Sponsorisé actif" checked={selectedEstablishment.sponsored} onChange={(value) => updateEstablishment(selectedEstablishment.id, { sponsored: value, sponsorshipLevel: value ? "Sponsorisé" : "Standard" })} />
                    </div>

                    <div className="rounded-3xl bg-white p-5 shadow-sm">
                      <div className="mb-4">
                        <p className="font-semibold">Champs visibles sur la fiche publique</p>
                        <p className="mt-1 text-xs leading-5 text-ink/45">Activez uniquement les informations que vous voulez afficher côté utilisateur.</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {visibilityLabels.map(({ key, label }) => {
                          const visibility = { ...defaultFieldVisibility, ...(selectedEstablishment.fieldVisibility ?? {}) };
                          return (
                            <Toggle
                              key={key}
                              label={label}
                              checked={visibility[key] !== false}
                              onChange={(value) => updateEstablishment(selectedEstablishment.id, { fieldVisibility: { ...visibility, [key]: value } })}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-4">
                      <SelectField label="Statut" value={selectedEstablishment.status} onChange={(value) => updateEstablishment(selectedEstablishment.id, { status: value as AdminStatus })}>
                        <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                      </SelectField>
                      <SelectField label="Mise en avant" value={selectedEstablishment.sponsorshipLevel ?? (selectedEstablishment.sponsored ? "Sponsorisé" : "Standard")} onChange={(value) => updateEstablishment(selectedEstablishment.id, { sponsorshipLevel: value as SponsorshipLevel, sponsored: value !== "Standard" })}>
                        <option>Standard</option><option>Sponsorisé</option><option>Partenaire officiel</option><option>Coup de cœur Liberty</option>
                      </SelectField>
                      <Field label="Priorité sponsorisée" value={selectedEstablishment.sponsorPriority} type="number" onChange={(value) => updateEstablishment(selectedEstablishment.id, { sponsorPriority: Number(value) })} />
                      <Field label="Durée sponsorisée" value={selectedEstablishment.sponsorDuration} onChange={(value) => updateEstablishment(selectedEstablishment.id, { sponsorDuration: value })} />
                    </div>

                    <div className="rounded-3xl bg-ink p-5 text-white">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold">Monétisation de la fiche</p>
                          <p className="mt-1 text-xs text-white/45">Le badge devient visible côté fiche dès que le niveau est Sponsorisé, Partenaire officiel ou Coup de cœur Liberty.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {["Standard", "Sponsorisé", "Partenaire officiel", "Coup de cœur Liberty"].map((level) => (
                            <button
                              key={level}
                              onClick={() => updateEstablishment(selectedEstablishment.id, { sponsorshipLevel: level as SponsorshipLevel, sponsored: level !== "Standard" })}
                              className={`rounded-full px-4 py-2 text-xs font-semibold ${((selectedEstablishment.sponsorshipLevel ?? "Standard") === level) ? "bg-white text-ink" : "bg-white/10 text-white/55"}`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                      {(selectedEstablishment.sponsorshipLevel ?? "Standard") !== "Standard" && (
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#f6ecd9] px-3 py-1 text-xs font-semibold text-[#9b6b2d]">
                          <Megaphone size={13} /> Badge {selectedEstablishment.sponsorshipLevel} · priorité {selectedEstablishment.sponsorPriority || 1}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                      <div>
                        <Field
                          label="Recherches clients"
                          value={selectedEstablishment.customerSearches.join("\n")}
                          textarea
                          onChange={(value) => updateEstablishment(selectedEstablishment.id, { customerSearches: cleanTextList(value) })}
                        />
                        {selectedEstablishment.customerSearches.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedEstablishment.customerSearches.map((term) => (
                              <button
                                key={term}
                                onClick={() => updateEstablishment(selectedEstablishment.id, { customerSearches: selectedEstablishment.customerSearches.filter((item) => item !== term) })}
                                className="rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-moss"
                              >
                                {term} ×
                              </button>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs leading-5 text-ink/45">Ajoutez les mots ou expressions que les utilisateurs sont susceptibles de saisir dans la barre de recherche. Ces mots servent uniquement à Liberty IA et au classement.</p>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-ink/35">Tags visibles sur la fiche</p>
                          <button onClick={addTag} className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">Créer un tag</button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {state.tags.sort((a, b) => a.order - b.order).map((tag) => {
                            const checked = selectedEstablishment.visibleTagIds.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                onClick={() => updateEstablishment(selectedEstablishment.id, {
                                  visibleTagIds: checked
                                    ? selectedEstablishment.visibleTagIds.filter((id) => id !== tag.id)
                                    : [...selectedEstablishment.visibleTagIds, tag.id],
                                })}
                                className={`rounded-2xl border px-4 py-3 text-left text-sm ${checked ? "border-moss/20 bg-sage text-moss" : "border-black/10 bg-white text-ink/55"}`}
                              >
                                {tag.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-cream p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Gestion globale des tags visibles</p>
                          <p className="mt-1 text-xs text-ink/45">Créer, modifier, supprimer et réorganiser les tags disponibles.</p>
                        </div>
                        <button onClick={addTag} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Ajouter</button>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {state.tags.map((tag) => (
                          <div key={tag.id} className="grid grid-cols-[1fr_80px_40px] gap-2">
                            <input value={tag.label} onChange={(event) => setState((current) => ({ ...current, tags: current.tags.map((item) => item.id === tag.id ? { ...item, label: event.target.value } : item) }))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" />
                            <input value={tag.order} type="number" onChange={(event) => setState((current) => ({ ...current, tags: current.tags.map((item) => item.id === tag.id ? { ...item, order: Number(event.target.value) } : item) }))} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" />
                            <button onClick={() => setState((current) => ({ ...current, tags: current.tags.filter((item) => item.id !== tag.id) }))} className="grid place-items-center rounded-xl bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>
            )}

            {active === "customer-searches" && (
              <Panel title="Recherches clients" subtitle="Ajoutez les expressions que vos visiteurs écrivent naturellement dans la barre Liberty IA.">
                <div className="mt-6 grid gap-4">
                  {filteredEstablishments.map((item) => (
                    <article key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <img src={item.mainPhoto || categories[0]?.image} alt="" className="size-16 rounded-2xl object-cover" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{item.name}</p>
                            <p className="mt-1 text-xs text-ink/40">{state.rubrics.find((rubric) => rubric.id === item.rubricId)?.name} · {state.subrubrics.find((subrubric) => subrubric.id === item.subrubricId)?.name}</p>
                          </div>
                        </div>
                        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                      </div>
                      <div className="mt-4">
                        <Field
                          label="Recherches clients"
                          value={item.customerSearches.join("\n")}
                          textarea
                          onChange={(value) => updateEstablishment(item.id, { customerSearches: cleanTextList(value) })}
                        />
                        {item.customerSearches.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.customerSearches.map((term) => (
                              <button
                                key={term}
                                onClick={() => updateEstablishment(item.id, { customerSearches: item.customerSearches.filter((search) => search !== term) })}
                                className="rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-moss"
                              >
                                {term} ×
                              </button>
                            ))}
                          </div>
                        )}
                        <p className="mt-2 text-xs leading-5 text-ink/45">Exemples : entrecôte, bassari 17e, brunch terrasse, avocado toast, tequila casher. Ces termes ne sont pas affichés publiquement.</p>
                      </div>
                      <FormActionBar
                        disabled={Boolean(savingAction)}
                        onDraft={() => saveEstablishmentDraft(item)}
                        onPreview={() => setAdminMessage(`Prévisualisation recherches : ${(item.customerSearches ?? []).slice(0, 6).join(", ") || "aucune recherche"}`)}
                        onPublish={() => publishEstablishment(item)}
                        onHide={() => commitState((current) => ({ ...current, establishments: current.establishments.map((establishment) => establishment.id === item.id ? { ...establishment, status: "Masqué", visible: false } : establishment) }), "Fiche masquée avec succès.", "Masquage")}
                        onTrash={() => moveToTrash("fiche", item.name, item, (current) => ({ ...current, establishments: current.establishments.filter((establishment) => establishment.id !== item.id) }))}
                      />
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "photos" && (
              <Panel title="Photos" subtitle="Gérez les images principales et les galeries sans modifier le code.">
                <div className="mt-6 space-y-6">
                  {!isSupabaseConfigured && (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
                      <p className="font-semibold">Supabase Storage n’est pas encore configuré.</p>
                      <p className="mt-1 leading-6">Les liens d’images existants continuent de fonctionner. L’envoi direct de fichiers sera actif dès que les variables Supabase seront renseignées.</p>
                    </div>
                  )}
                  <div className="rounded-3xl bg-white p-5 shadow-sm">
                    <p className="font-semibold">Formats recommandés</p>
                    <div className="mt-3 grid gap-2 text-xs text-ink/55 sm:grid-cols-2 xl:grid-cols-5">
                      <span className="rounded-2xl bg-cream px-3 py-2">Fiche : 1600×900</span>
                      <span className="rounded-2xl bg-cream px-3 py-2">Galerie : 1200×1200</span>
                      <span className="rounded-2xl bg-cream px-3 py-2">Logo : 512×512</span>
                      <span className="rounded-2xl bg-cream px-3 py-2">Rubrique : 1200×1200</span>
                      <span className="rounded-2xl bg-cream px-3 py-2">Bannière : 1920×700</span>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-white p-5">
                    <p className="font-semibold">Photos des rubriques</p>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      {state.rubrics.sort((a, b) => a.order - b.order).map((rubric) => (
                        <div key={rubric.id} className="rounded-2xl bg-cream p-4">
                          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                            <PreviewImage src={rubric.image} alt={rubric.imageAlt ?? rubric.name} />
                            <div className="grid gap-3">
                              <p className="font-semibold">{rubric.name}</p>
                              <ImageUploadField label="Image principale" value={rubric.image} folder="rubrics" onChange={(value) => updateRubric(rubric.id, { image: value })} />
                              <Field label="Texte alternatif" value={rubric.imageAlt ?? ""} onChange={(value) => updateRubric(rubric.id, { imageAlt: value })} />
                              {rubric.image && (
                                <button onClick={() => updateRubric(rubric.id, { image: "" })} className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">Supprimer l’image</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-5">
                    <p className="font-semibold">Photos des fiches</p>
                    <div className="mt-4 grid gap-4">
                      {filteredEstablishments.map((item) => (
                        <article key={item.id} className="rounded-2xl bg-cream p-4">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <img src={item.mainPhoto || categories[0]?.image} alt="" className="size-14 rounded-2xl object-cover" />
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-ink/40">{item.status}</p>
                              </div>
                            </div>
                            <button onClick={() => publishEstablishment(item)} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">Valider les photos</button>
                          </div>
                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="grid gap-2">
                              <ImageUploadField label="Photo principale" value={item.mainPhoto} folder="establishments" onChange={(value) => updateEstablishment(item.id, { mainPhoto: value })} />
                              {item.mainPhoto && (
                                <button onClick={() => updateEstablishment(item.id, { mainPhoto: "" })} className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">Supprimer la photo</button>
                              )}
                            </div>
                            {item.photos.map((photo, index) => (
                              <div key={index} className="grid gap-2">
                                <ImageUploadField
                                  label={`Photo galerie ${index + 1}`}
                                  value={photo}
                                  folder="establishments"
                                  onChange={(value) => {
                                    const photos = [...item.photos];
                                    photos[index] = value;
                                    updateEstablishment(item.id, { photos });
                                  }}
                                />
                                <Field
                                  label={`Texte alternatif ${index + 1}`}
                                  value={item.photoAlts?.[index] ?? ""}
                                  onChange={(value) => {
                                    const photoAlts = [...(item.photoAlts ?? ["", "", "", ""])];
                                    photoAlts[index] = value;
                                    updateEstablishment(item.id, { photoAlts });
                                  }}
                                />
                                {photo && (
                                  <button
                                    onClick={() => {
                                      const photos = [...item.photos];
                                      photos[index] = "";
                                      updateEstablishment(item.id, { photos });
                                    }}
                                    className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500"
                                  >
                                    Supprimer
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {active === "tags" && (
              <Panel title="Tags" subtitle="Gérer séparément les tags visibles et les recherches clients utilisées par Liberty IA." actionLabel="Créer un tag" onAction={addTag}>
                <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_.8fr]">
                  <div className="rounded-3xl bg-white p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">Tags visibles</p>
                        <p className="mt-1 text-xs text-ink/40">Ils peuvent apparaître sur les fiches publiques et être sélectionnés fiche par fiche.</p>
                      </div>
                      <button onClick={addTag} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">Ajouter</button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {state.tags.sort((a, b) => a.order - b.order).map((tag) => (
                        <article key={tag.id} className="rounded-2xl border border-black/[.06] bg-cream p-4">
                          <FormActionBar
                            disabled={Boolean(savingAction)}
                            onDraft={() => saveTagDraft(tag)}
                            onPreview={() => setAdminMessage(`Prévisualisation tag : ${tag.icon ? `${tag.icon} ` : ""}${tag.label}`)}
                            onPublish={() => publishTag(tag)}
                            onHide={() => commitState((current) => ({ ...current, tags: current.tags.map((item) => item.id === tag.id ? { ...item, status: "Masqué" } : item) }), "Tag masqué avec succès.", "Masquage")}
                            onTrash={() => moveToTrash("tag", tag.label, tag, (current) => ({ ...current, tags: current.tags.filter((item) => item.id !== tag.id) }))}
                          />
                          <div className="grid gap-3 lg:grid-cols-[1fr_120px_100px_100px_130px]">
                            <Field label="Nom" value={tag.label} onChange={(value) => updateTag(tag.id, { label: value })} />
                            <SelectField label="Type" value={tag.kind ?? "visible"} onChange={(value) => updateTag(tag.id, { kind: value as AdminTag["kind"] })}>
                              <option value="visible">Visible</option>
                              <option value="search">Recherche IA</option>
                            </SelectField>
                            <Field label="Icône" value={tag.icon ?? ""} onChange={(value) => updateTag(tag.id, { icon: value })} />
                            <Field label="Couleur" value={tag.color ?? "#1f4d3b"} onChange={(value) => updateTag(tag.id, { color: value })} />
                            <SelectField label="Statut" value={tag.status ?? "Publié"} onChange={(value) => updateTag(tag.id, { status: value as AdminStatus })}>
                              <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                            </SelectField>
                          </div>
                          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_110px_190px]">
                            <Field label="Rubriques associées" value={(tag.rubricIds ?? []).join(", ")} onChange={(value) => updateTag(tag.id, { rubricIds: cleanTextList(value) })} placeholder="food, shopping..." />
                            <Field label="Ordre" value={tag.order} type="number" onChange={(value) => updateTag(tag.id, { order: Number(value) })} />
                            <div className="flex items-end gap-2">
                              <button onClick={() => reorderById("tags", tag.id, -1)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">Monter</button>
                              <button onClick={() => reorderById("tags", tag.id, 1)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">Descendre</button>
                              <button onClick={() => moveToTrash("tag", tag.label, tag, (current) => ({ ...current, tags: current.tags.filter((item) => item.id !== tag.id) }))} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Corbeille</button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-ink p-5 text-white">
                    <p className="font-semibold">Recherches clients</p>
                    <p className="mt-1 text-sm leading-6 text-white/50">Les expressions de recherche ne sont pas obligées d’être visibles. Elles se gèrent directement dans chaque fiche, champ “Recherches clients”.</p>
                    <div className="mt-5 space-y-3">
                      {state.establishments.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-2xl bg-white/8 p-3">
                          <p className="text-sm font-semibold">{item.name}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.customerSearches.slice(0, 6).map((term) => <span key={term} className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/65">{term}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => goToSection("customer-searches")} className="mt-5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Modifier les recherches clients</button>
                  </div>

                  <div className="rounded-3xl bg-white p-5 xl:col-span-2">
                    <p className="font-semibold">Informations structurées</p>
                    <p className="mt-1 text-sm leading-6 text-ink/45">Ces informations ne doivent pas être mélangées aux tags. Elles restent des champs dédiés dans chaque fiche pour permettre une recherche et un classement fiables.</p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {["ville", "arrondissement", "certification", "type Bassari / Halavi / Parvé", "terrasse", "réservation", "livraison", "à emporter", "horaires", "prix", "cuisine", "latitude", "longitude"].map((item) => (
                        <span key={item} className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/60">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {active === "certifications" && (
              <Panel title="Certifications" subtitle="Ajouter, modifier, masquer et supprimer les certifications cacher utilisées dans les fiches." actionLabel="Ajouter une certification" onAction={addCertification}>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {state.certifications.sort((a, b) => a.order - b.order).map((certification) => (
                    <article key={certification.id} className="rounded-3xl bg-white p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(certification.status)}`}>{certification.status}</span>
                        <div className="flex gap-2">
                          <button onClick={() => updateCertification(certification.id, { status: "Publié" })} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Publier</button>
                          <button onClick={() => updateCertification(certification.id, { status: "Masqué" })} className="rounded-full bg-cream px-3 py-2 text-xs font-semibold text-ink/55">Masquer</button>
                          <button onClick={() => moveToTrash("certification", certification.label, certification, (current) => ({ ...current, certifications: current.certifications.filter((item) => item.id !== certification.id) }))} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Corbeille</button>
                        </div>
                      </div>
                      <FormActionBar
                        disabled={Boolean(savingAction)}
                        onDraft={() => saveCertificationDraft(certification)}
                        onPreview={() => setAdminMessage(`Prévisualisation certification : ${certification.label}`)}
                        onPublish={() => publishCertification(certification)}
                        onHide={() => commitState((current) => ({ ...current, certifications: current.certifications.map((item) => item.id === certification.id ? { ...item, status: "Masqué" } : item) }), "Certification masquée avec succès.", "Masquage")}
                        onTrash={() => moveToTrash("certification", certification.label, certification, (current) => ({ ...current, certifications: current.certifications.filter((item) => item.id !== certification.id) }))}
                      />
                      <div className="grid gap-3 sm:grid-cols-[1fr_100px_150px]">
                        <Field label="Nom" value={certification.label} onChange={(value) => updateCertification(certification.id, { label: value })} />
                        <Field label="Ordre" value={certification.order} type="number" onChange={(value) => updateCertification(certification.id, { order: Number(value) })} />
                        <SelectField label="Statut" value={certification.status} onChange={(value) => updateCertification(certification.id, { status: value as AdminStatus })}>
                          <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                        </SelectField>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "banners" && (
              <Panel title="Bannières & Publicité" subtitle="Créer, positionner et mesurer les campagnes publicitaires Liberty." actionLabel="Créer une bannière" onAction={addBanner}>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <MetricCard label="Affichages publicitaires" value={analytics.bannerImpressions.toLocaleString("fr-FR")} />
                  <MetricCard label="Clics publicitaires" value={analytics.bannerClicks.toLocaleString("fr-FR")} />
                  <MetricCard label="CTR global" value={ctr(analytics.bannerClicks, analytics.bannerImpressions)} />
                  <MetricCard label="Visiteurs générés" value={state.banners.reduce((sum, banner) => sum + (banner.visitors ?? 0), 0).toLocaleString("fr-FR")} />
                </div>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {state.banners.map((banner) => (
                    <article key={banner.id} className="rounded-3xl bg-white p-5">
                      <PreviewImage src={banner.image} alt={banner.title} />
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <SelectField label="Format" value={banner.type} onChange={(value) => updateBanner(banner.id, { type: value as BannerType })}>
                          <option>Grande bannière</option><option>Bannière horizontale</option><option>Bannière moyenne</option><option>Petit encart</option><option>Carte sponsorisée</option><option>Carrousel</option>
                        </SelectField>
                        <SelectField label="Statut" value={banner.status} onChange={(value) => updateBanner(banner.id, { status: value as AdminStatus })}>
                          <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                        </SelectField>
                        <SelectField label="Position d’affichage" value={banner.position ?? "Home"} onChange={(value) => updateBanner(banner.id, { position: value as BannerPosition })}>
                          <option>Home</option><option>Rubrique</option><option>Sous-rubrique</option><option>Fiche</option>
                        </SelectField>
                        <Field label="Cible précise" value={banner.placementTarget ?? ""} onChange={(value) => updateBanner(banner.id, { placementTarget: value })} placeholder="Ex : Food, Restaurants, Khan..." />
                        <Field label="Titre" value={banner.title} onChange={(value) => updateBanner(banner.id, { title: value })} />
                        <Field label="Sous-titre" value={banner.subtitle} onChange={(value) => updateBanner(banner.id, { subtitle: value })} />
                        <ImageUploadField label="Image" value={banner.image} folder="banners" onChange={(value) => updateBanner(banner.id, { image: value })} />
                        <Field label="Bouton" value={banner.button} onChange={(value) => updateBanner(banner.id, { button: value })} />
                        <Field label="Lien interne Liberty" value={banner.internalLink} onChange={(value) => updateBanner(banner.id, { internalLink: value })} />
                        <Field label="Ordre" value={banner.order} type="number" onChange={(value) => updateBanner(banner.id, { order: Number(value) })} />
                        <Field label="Affichages" value={banner.impressions ?? 0} type="number" onChange={(value) => updateBanner(banner.id, { impressions: Number(value) })} />
                        <Field label="Clics" value={banner.clicks ?? 0} type="number" onChange={(value) => updateBanner(banner.id, { clicks: Number(value) })} />
                        <Field label="Visiteurs générés" value={banner.visitors ?? 0} type="number" onChange={(value) => updateBanner(banner.id, { visitors: Number(value) })} />
                      </div>
                      <div className="mt-4 grid gap-3 rounded-3xl bg-cream p-4 sm:grid-cols-4">
                        <MiniStat label="Affichages" value={(banner.impressions ?? 0).toLocaleString("fr-FR")} />
                        <MiniStat label="Clics" value={(banner.clicks ?? 0).toLocaleString("fr-FR")} />
                        <MiniStat label="CTR" value={ctr(banner.clicks ?? 0, banner.impressions ?? 0)} />
                        <MiniStat label="Visiteurs" value={(banner.visitors ?? 0).toLocaleString("fr-FR")} />
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "page-order" && (
              <Panel title="Ordre d’affichage" subtitle="Réorganiser les rubriques, sous-rubriques, fiches et tags visibles sans modifier le code." actionLabel="Ajouter une section" onAction={() => setState((current) => ({ ...current, pageSections: [...current.pageSections, { id: newId("section"), page: "Home Page", title: "Nouvelle section", type: "Rubrique", order: current.pageSections.length + 1, status: "Brouillon" }] }))}>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => audit("enregistrement_ordre", "ordre", "admin-order", "Ordre d’affichage")} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">Enregistrer l’ordre</button>
                  <button onClick={() => setAdminMessage("Prévisualisation : les blocs ci-dessous représentent l’ordre public actuel.")} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Prévisualiser</button>
                  <button onClick={() => { setState((current) => ({ ...current, rubrics: current.rubrics.map((item) => ({ ...item, status: item.status === "Brouillon" ? "Publié" : item.status })) })); audit("publication_ordre", "ordre", "admin-order", "Ordre publié"); }} className="rounded-full bg-sage px-4 py-2 text-xs font-semibold text-moss">Publier</button>
                  <button onClick={() => setState(normalizeAdminState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<AdminState>))} className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/55">Annuler</button>
                </div>
                <div className="mt-6 grid gap-4 xl:grid-cols-4">
                  <OrderColumn title="Rubriques Home" items={state.rubrics.filter((item) => item.showOnHome).sort((a, b) => a.order - b.order).map((item) => ({ id: item.id, label: item.name, order: item.order }))} onUp={(id) => reorderById("rubrics", id, -1)} onDown={(id) => reorderById("rubrics", id, 1)} onDropItem={(sourceId, targetId) => moveBeforeById("rubrics", sourceId, targetId)} />
                  <OrderColumn title="Sous-rubriques" items={state.subrubrics.sort((a, b) => a.order - b.order).slice(0, 12).map((item) => ({ id: item.id, label: item.name, order: item.order }))} onUp={(id) => reorderById("subrubrics", id, -1)} onDown={(id) => reorderById("subrubrics", id, 1)} onDropItem={(sourceId, targetId) => moveBeforeById("subrubrics", sourceId, targetId)} />
                  <OrderColumn title="Fiches" items={state.establishments.sort((a, b) => a.order - b.order).slice(0, 12).map((item) => ({ id: item.id, label: item.name, order: item.order }))} onUp={(id) => reorderById("establishments", id, -1)} onDown={(id) => reorderById("establishments", id, 1)} onDropItem={(sourceId, targetId) => moveBeforeById("establishments", sourceId, targetId)} />
                  <OrderColumn title="Tags visibles" items={state.tags.sort((a, b) => a.order - b.order).map((item) => ({ id: item.id, label: item.label, order: item.order }))} onUp={(id) => reorderById("tags", id, -1)} onDown={(id) => reorderById("tags", id, 1)} onDropItem={(sourceId, targetId) => moveBeforeById("tags", sourceId, targetId)} />
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl bg-white">
                  {state.pageSections.sort((a, b) => a.order - b.order).map((section) => (
                    <div key={section.id} className="grid gap-3 border-b border-black/5 p-4 last:border-b-0 lg:grid-cols-[36px_1fr_150px_100px_140px] lg:items-center">
                      <GripVertical size={16} className={section.locked ? "text-ink/15" : "text-ink/35"} />
                      <Field label="Titre" value={section.title} onChange={(value) => setState((current) => ({ ...current, pageSections: current.pageSections.map((item) => item.id === section.id ? { ...item, title: value } : item) }))} />
                      <SelectField label="Type" value={section.type} onChange={(value) => setState((current) => ({ ...current, pageSections: current.pageSections.map((item) => item.id === section.id ? { ...item, type: value as PageSection["type"] } : item) }))}>
                        <option>Recherche</option><option>Rubrique</option><option>Bloc</option><option>Bannière</option>
                      </SelectField>
                      <Field label="Ordre" value={section.order} type="number" onChange={(value) => !section.locked && setState((current) => ({ ...current, pageSections: current.pageSections.map((item) => item.id === section.id ? { ...item, order: Number(value) } : item) }))} />
                      <SelectField label="Statut" value={section.status} onChange={(value) => setState((current) => ({ ...current, pageSections: current.pageSections.map((item) => item.id === section.id ? { ...item, status: value as AdminStatus } : item) }))}>
                        <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                      </SelectField>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-3xl bg-cream p-5 text-sm text-ink/55">La section « Barre de recherche » est verrouillée pour éviter une suppression accidentelle.</div>
              </Panel>
            )}

            {active === "sponsored" && (
              <Panel title="Publicités / Sponsorisés" subtitle="Gérer les mises en avant commerciales sans rendre les résultats incohérents.">
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {state.establishments.map((item) => (
                    <article key={item.id} className="rounded-3xl bg-white p-5">
                      <div className="flex gap-4">
                        <img src={item.mainPhoto || categories[0]?.image} alt="" className="size-20 rounded-2xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{item.name}</p>
                          <p className="mt-1 text-xs text-ink/40">{item.city} {item.arrondissement} · priorité {item.sponsorPriority}</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <SelectField label="Statut commercial" value={item.sponsorshipLevel ?? "Standard"} onChange={(value) => updateEstablishment(item.id, { sponsorshipLevel: value as SponsorshipLevel, sponsored: value !== "Standard" })}>
                              <option>Standard</option><option>Sponsorisé</option><option>Partenaire officiel</option><option>Coup de cœur Liberty</option>
                            </SelectField>
                            <Field label="Priorité" value={item.sponsorPriority} type="number" onChange={(value) => updateEstablishment(item.id, { sponsorPriority: Number(value) })} />
                            <Field label="Début" value={item.sponsorStartsAt ?? ""} type="date" onChange={(value) => updateEstablishment(item.id, { sponsorStartsAt: value })} />
                            <Field label="Fin" value={item.sponsorEndsAt ?? ""} type="date" onChange={(value) => updateEstablishment(item.id, { sponsorEndsAt: value })} />
                            <Field label="Emplacement" value={item.sponsorPlacement ?? ""} onChange={(value) => updateEstablishment(item.id, { sponsorPlacement: value })} />
                            <Field label="Notes internes" value={item.sponsorNotes ?? ""} onChange={(value) => updateEstablishment(item.id, { sponsorNotes: value })} />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "notifications" && (
              <Panel title="Centre de notifications" subtitle="Créer, cibler et mesurer les notifications push administrateur ou sponsorisées." actionLabel="Créer une notification" onAction={addNotification}>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <MetricCard label="Notifications envoyées" value={analytics.notificationSent.toLocaleString("fr-FR")} />
                  <MetricCard label="Ouvertures" value={analytics.notificationOpens.toLocaleString("fr-FR")} />
                  <MetricCard label="Clics notification" value={analytics.notificationClicks.toLocaleString("fr-FR")} />
                  <MetricCard label="CTR ouverture → clic" value={ctr(analytics.notificationClicks, analytics.notificationOpens)} />
                </div>
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {state.notifications.map((notification) => (
                    <article key={notification.id} className="rounded-3xl bg-white p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Titre" value={notification.title} onChange={(value) => updateNotification(notification.id, { title: value })} />
                        <Field label="Bouton" value={notification.button ?? "Ouvrir"} onChange={(value) => updateNotification(notification.id, { button: value })} />
                        <Field label="Texte" value={notification.text} textarea onChange={(value) => updateNotification(notification.id, { text: value })} />
                        <ImageUploadField label="Image" value={notification.image} folder="notifications" onChange={(value) => updateNotification(notification.id, { image: value })} />
                        <Field label="Lien" value={notification.link ?? notification.destination} onChange={(value) => updateNotification(notification.id, { link: value, destination: value })} />
                        <Field label="Destination interne" value={notification.destination} onChange={(value) => updateNotification(notification.id, { destination: value, link: value })} />
                        <Field label="Date" value={notification.date} type="date" onChange={(value) => updateNotification(notification.id, { date: value })} />
                        <Field label="Heure" value={notification.time} type="time" onChange={(value) => updateNotification(notification.id, { time: value })} />
                        <SelectField label="Ciblage" value={notification.target} onChange={(value) => updateNotification(notification.id, { target: value })}>
                          <option>Tous les utilisateurs</option>
                          <option>Une catégorie</option>
                          <option>Une sous-catégorie</option>
                          <option>Une ville</option>
                          <option>Un arrondissement</option>
                          <option>Favoris d’un établissement</option>
                          <option>Utilisateurs ayant consulté une catégorie</option>
                          <option>Utilisateurs ayant consulté un établissement</option>
                        </SelectField>
                        <SelectField label="Statut" value={notification.status} onChange={(value) => updateNotification(notification.id, { status: value as AdminNotification["status"] })}>
                          <option>Brouillon</option><option>Programmée</option><option>Envoyée</option><option>Annulée</option>
                        </SelectField>
                        <Field label="Envoyées" value={notification.sentCount ?? 0} type="number" onChange={(value) => updateNotification(notification.id, { sentCount: Number(value) })} />
                        <Field label="Ouvertures" value={notification.opens ?? 0} type="number" onChange={(value) => updateNotification(notification.id, { opens: Number(value) })} />
                        <Field label="Clics" value={notification.clicks ?? 0} type="number" onChange={(value) => updateNotification(notification.id, { clicks: Number(value) })} />
                        <Field label="Visiteurs générés" value={notification.visitors ?? 0} type="number" onChange={(value) => updateNotification(notification.id, { visitors: Number(value) })} />
                      </div>
                      <div className="mt-4 grid gap-3 rounded-3xl bg-cream p-4 sm:grid-cols-4">
                        <MiniStat label="Envoyées" value={(notification.sentCount ?? 0).toLocaleString("fr-FR")} />
                        <MiniStat label="Ouvertures" value={(notification.opens ?? 0).toLocaleString("fr-FR")} />
                        <MiniStat label="CTR" value={ctr(notification.clicks ?? 0, notification.opens ?? 0)} />
                        <MiniStat label="Visiteurs" value={(notification.visitors ?? 0).toLocaleString("fr-FR")} />
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "users" && (
              <Panel title="Utilisateurs" subtitle="Base utilisateurs prête pour connexion Supabase/Auth.">
                <MockTable rows={[
                  [auth.user?.email ?? "Utilisateur Liberty", "Rôle actuel", auth.role, auth.configured ? "Supabase" : "Local"],
                  ["Professionnel Winess", "pro@winess.com", "Professionnel", "Actif"],
                  ["Admin Steven", "admin@liberty.local", "Administrateur", "Actif"],
                ]} />
              </Panel>
            )}

            {active === "professionals" && (
              <Panel title="Professionnels" subtitle="Associer un professionnel à ses établissements et préparer ses rapports.">
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {state.establishments.filter((item) => item.sponsored || item.website || item.phone).slice(0, 8).map((item) => (
                    <article key={item.id} className="rounded-3xl bg-white p-5">
                      <div className="flex items-center gap-4">
                        <img src={item.mainPhoto || categories[0]?.image} alt="" className="size-16 rounded-2xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{item.name}</p>
                          <p className="mt-1 text-xs text-ink/40">{item.website || item.phone || "Contact à compléter"}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <Field label="Professionnel associé" value={item.ownerId ?? ""} onChange={(value) => updateEstablishment(item.id, { ownerId: value })} placeholder="ID utilisateur Supabase" />
                        <SelectField label="Accès rapport" value={item.ownerId ? "Actif" : "À configurer"} onChange={() => undefined}>
                          <option>À configurer</option><option>Actif</option>
                        </SelectField>
                      </div>
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "reviews" && (
              <Panel title="Avis" subtitle="Modération des avis clients.">
                {reviews.length ? (
                  <div className="mt-6 space-y-3">
                    {reviews.map((review) => (
                      <article key={`${review.entityId}-${review.userId}`} className="rounded-2xl bg-white p-4">
                        <p className="text-sm font-semibold">{review.userName}</p>
                        <p className="mt-1 text-sm text-ink/60">{review.text}</p>
                        <p className="mt-2 text-xs text-ink/35">{review.entityId} · {new Date(review.createdAt).toLocaleString("fr-FR")}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl bg-white p-8 text-center text-sm text-ink/45">Aucun avis pour le moment.</div>
                )}
              </Panel>
            )}

            {active === "analytics" && (
              <div className="mt-8 space-y-5">
                <Panel title="Analytics Admin" subtitle="Pilotage temps réel de Liberty : audience, recherche IA, engagement, publicité et notifications.">
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard label="Visiteurs" value={analytics.visitors.toLocaleString("fr-FR")} />
                    <MetricCard label="Utilisateurs inscrits" value={analytics.registeredUsers.toLocaleString("fr-FR")} />
                    <MetricCard label="Connectés" value={analytics.connectedUsers.toLocaleString("fr-FR")} />
                    <MetricCard label="Temps moyen" value={analytics.averageTime} />
                    <MetricCard label="Recherches Liberty IA" value={analytics.searches.toLocaleString("fr-FR")} trend="Intentions" />
                    <MetricCard label="Likes" value={analytics.likes.toLocaleString("fr-FR")} />
                    <MetricCard label="Favoris" value={analytics.favorites.toLocaleString("fr-FR")} />
                    <MetricCard label="Partages" value={analytics.shares.toLocaleString("fr-FR")} />
                    <MetricCard label="Clics téléphone" value={analytics.phoneClicks.toLocaleString("fr-FR")} />
                    <MetricCard label="Clics WhatsApp" value={analytics.whatsappClicks.toLocaleString("fr-FR")} />
                    <MetricCard label="Clics Site Internet" value={analytics.websiteClicks.toLocaleString("fr-FR")} />
                    <MetricCard label="Clics Réservation" value={analytics.reservationClicks.toLocaleString("fr-FR")} />
                    <MetricCard label="Notifications envoyées" value={analytics.notificationSent.toLocaleString("fr-FR")} />
                    <MetricCard label="Ouvertures notifications" value={analytics.notificationOpens.toLocaleString("fr-FR")} />
                    <MetricCard label="Clics notifications" value={analytics.notificationClicks.toLocaleString("fr-FR")} />
                  </div>
                  <div className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_.7fr]">
                    <div className="rounded-3xl bg-white p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Évolution hebdomadaire</p>
                          <p className="mt-1 text-xs text-ink/40">Visites, recherches et clics commerciaux.</p>
                        </div>
                        <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">Temps réel</span>
                      </div>
                      <MiniBarChart values={[0, 0, 0, 0, 0, 0, Math.min(100, events.length * 10)]} />
                    </div>
                    <div className="rounded-3xl bg-ink p-5 text-white">
                      <p className="font-semibold">Revenus pilotables</p>
                      <p className="mt-1 text-xs text-white/45">Inventaire monétisable actuellement configuré.</p>
                      <div className="mt-5 grid gap-3">
                        <MiniStat dark label="Fiches sponsorisées" value={state.establishments.filter((item) => (item.sponsorshipLevel ?? "Standard") !== "Standard").length} />
                        <MiniStat dark label="Bannières actives" value={state.banners.filter((item) => item.status === "Publié").length} />
                        <MiniStat dark label="Notifications sponsorisables" value={state.notifications.length} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <InsightList title="Recherches les plus fréquentes" items={topLabels(events, "ai_search", ["Aucune recherche collectée"])} />
                    <InsightList title="Rubriques les plus consultées" items={topLabels(events, "category_view", ["Aucune rubrique collectée"])} />
                    <InsightList title="Sous-rubriques les plus consultées" items={topLabels(events, "subcategory_view", ["Aucune sous-rubrique collectée"])} />
                    <InsightList title="Établissements les plus consultés" items={topLabels(events, "drawer", ["Aucune fiche collectée"])} />
                    <InsightList title="Bannières les plus cliquées" items={[...state.banners].sort((a, b) => (b.clicks ?? 0) - (a.clicks ?? 0)).slice(0, 5).map((item) => `${item.title} · ${ctr(item.clicks ?? 0, item.impressions ?? 0)}`)} />
                    <InsightList title="Notifications les plus ouvertes" items={[...state.notifications].sort((a, b) => (b.opens ?? 0) - (a.opens ?? 0)).slice(0, 5).map((item) => `${item.title} · ${item.opens ?? 0} ouvertures`)} />
                  </div>
                </Panel>
                <Panel title="Tableau de bord Professionnel" subtitle="Chaque professionnel ne verra que les statistiques de son établissement.">
                  <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
                    <div className="rounded-3xl bg-white p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Établissement</p>
                      <select value={selectedEstablishment?.id ?? ""} onChange={(event) => setSelectedEstablishmentId(event.target.value)} className="w-full rounded-2xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none">
                        {state.establishments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                      {selectedEstablishment && <div className="mt-4"><PreviewImage src={selectedEstablishment.mainPhoto} alt={selectedEstablishment.name} /></div>}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                      {professionalStats && (
                        <>
                          <MetricCard label="Vues" value={professionalStats.views.toLocaleString("fr-FR")} />
                          <MetricCard label="Clics" value={professionalStats.clicks.toLocaleString("fr-FR")} />
                          <MetricCard label="Temps fiche" value={professionalStats.averageTime} />
                          <MetricCard label="Likes" value={professionalStats.likes.toLocaleString("fr-FR")} />
                          <MetricCard label="Favoris" value={professionalStats.favorites.toLocaleString("fr-FR")} />
                          <MetricCard label="Partages" value={professionalStats.shares.toLocaleString("fr-FR")} />
                          <MetricCard label="Téléphone" value={professionalStats.phone.toLocaleString("fr-FR")} />
                          <MetricCard label="WhatsApp" value={professionalStats.whatsapp.toLocaleString("fr-FR")} />
                          <MetricCard label="Site Internet" value={professionalStats.website.toLocaleString("fr-FR")} />
                          <MetricCard label="Réservation" value={professionalStats.reservations.toLocaleString("fr-FR")} />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.75fr]">
                    <div className="rounded-3xl bg-white p-5">
                      <p className="font-semibold">Recherches clients ayant amené des visiteurs</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(professionalStats?.searches.length ? professionalStats.searches : ["Aucune recherche attribuée pour le moment"]).map((searchTerm) => (
                          <span key={searchTerm} className="rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-moss">{searchTerm}</span>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white p-5">
                      <p className="font-semibold">Performance commerciale</p>
                      <MiniBarChart values={[0, 0, 0, 0, 0, 0, Math.min(100, (professionalStats?.clicks ?? 0) * 10)]} compact />
                    </div>
                  </div>
                  <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">Rapport professionnel</p>
                      <p className="mt-1 text-sm text-white/50">Inclura les recherches clients ayant amené des visiteurs sur la fiche.</p>
                    </div>
                    <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink">
                      <FileDown size={16} /> Exporter un rapport PDF
                    </button>
                  </div>
                </Panel>
              </div>
            )}

            {active === "settings" && (
              <Panel title="Paramètres" subtitle="Préparation du branchement Supabase, rôles et publication.">
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <SettingCard icon={<ShieldCheck size={18} />} title="Rôles admin" text="Administrateur, éditeur, modérateur, professionnel." />
                  <SettingCard icon={<Sparkles size={18} />} title="Liberty IA" text="La recherche utilisera les champs Recherches clients et tags." />
                  <SettingCard icon={<CheckCircle2 size={18} />} title="Publication" text="Statuts Publié, Brouillon et Masqué conservés sur chaque module." />
                </div>
                <div className="mt-6 rounded-3xl bg-white p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">Certifications cacher administrables</p>
                      <p className="mt-1 text-sm text-ink/45">Les certifications ne sont plus figées dans le code : elles peuvent être utilisées dans les fiches et futurs filtres.</p>
                    </div>
                    <button onClick={addCertification} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">Ajouter une certification</button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {state.certifications.sort((a, b) => a.order - b.order).map((certification) => (
                      <div key={certification.id} className="rounded-2xl bg-cream p-3">
                        <div className="grid gap-2 sm:grid-cols-[1fr_90px_120px]">
                          <Field label="Nom" value={certification.label} onChange={(value) => updateCertification(certification.id, { label: value })} />
                          <Field label="Ordre" value={certification.order} type="number" onChange={(value) => updateCertification(certification.id, { order: Number(value) })} />
                          <SelectField label="Statut" value={certification.status} onChange={(value) => updateCertification(certification.id, { status: value as AdminStatus })}>
                            <option>Publié</option><option>Brouillon</option><option>Masqué</option>
                          </SelectField>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => updateCertification(certification.id, { status: certification.status === "Masqué" ? "Publié" : "Masqué" })} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">{certification.status === "Masqué" ? "Publier" : "Masquer"}</button>
                          <button onClick={() => moveToTrash("certification", certification.label, certification, (current) => ({ ...current, certifications: current.certifications.filter((item) => item.id !== certification.id) }))} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Corbeille</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            )}

            {active === "trash" && (
              <Panel title="Corbeille & journal d’audit" subtitle="Restaurer les éléments supprimés et suivre les actions critiques.">
                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  <div className="rounded-3xl bg-white p-5">
                    <p className="font-semibold">Corbeille</p>
                    <div className="mt-4 space-y-3">
                      {state.trash.length ? state.trash.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-cream p-3">
                          <div>
                            <p className="text-sm font-semibold">{item.label}</p>
                            <p className="text-xs text-ink/40">{item.entityType} · {new Date(item.deletedAt).toLocaleString("fr-FR")} · {item.deletedBy}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => restoreTrashItem(item)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">Restaurer</button>
                            <button onClick={() => setState((current) => ({ ...current, trash: current.trash.filter((trash) => trash.id !== item.id) }))} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Supprimer</button>
                          </div>
                        </div>
                      )) : <p className="rounded-2xl bg-cream p-4 text-sm text-ink/45">Corbeille vide.</p>}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-white p-5">
                    <p className="font-semibold">Journal d’audit</p>
                    <div className="mt-4 space-y-3">
                      {state.audit.length ? state.audit.slice(0, 12).map((item) => (
                        <div key={item.id} className="rounded-2xl bg-cream p-3">
                          <p className="text-sm font-semibold">{item.action} · {item.label}</p>
                          <p className="text-xs text-ink/40">{item.entityType} · {new Date(item.createdAt).toLocaleString("fr-FR")}</p>
                        </div>
                      )) : <p className="rounded-2xl bg-cream p-4 text-sm text-ink/45">Aucune action enregistrée dans cette session.</p>}
                    </div>
                  </div>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  title,
  subtitle,
  children,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <section className="mt-8 rounded-4xl bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-.03em]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink/45">{subtitle}</p>}
        </div>
        {actionLabel && onAction && (
          <button onClick={onAction} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
            <Plus size={16} /> {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-sm">
      {label}
      <Plus size={16} />
    </button>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl bg-white p-5">
      <p className="font-semibold">{title}</p>
      <div className="mt-4 space-y-2">
        {items.map((item, index) => (
          <div key={item} className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3 text-sm">
            <span>{item}</span>
            <span className="text-xs text-ink/35">#{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend }: { label: string; value: string | number; trend?: string }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs leading-4 text-ink/40">{label}</p>
        {trend && <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 text-[10px] font-semibold text-ink/45">{trend}</span>}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-[-.03em]">{value}</p>
    </article>
  );
}

function MiniStat({ label, value, dark = false }: { label: string; value: string | number; dark?: boolean }) {
  return (
    <div className={dark ? "rounded-2xl bg-white/10 p-3" : "rounded-2xl bg-white p-3"}>
      <p className={dark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-ink"}>{value}</p>
      <p className={dark ? "mt-1 text-[11px] text-white/45" : "mt-1 text-[11px] text-ink/40"}>{label}</p>
    </div>
  );
}

function MiniBarChart({ values, compact = false }: { values: number[]; compact?: boolean }) {
  return (
    <div className={`mt-6 flex ${compact ? "h-28" : "h-64"} items-end gap-3`}>
      {values.map((height, index) => (
        <div key={`${height}-${index}`} className="flex h-full flex-1 items-end">
          <div
            className="w-full rounded-t-xl bg-sage transition hover:bg-moss"
            style={{ height: `${height}%` }}
            title={`${height}%`}
          />
        </div>
      ))}
    </div>
  );
}

function OrderColumn({
  title,
  items,
  onUp,
  onDown,
  onDropItem,
}: {
  title: string;
  items: { id: string; label: string; order: number }[];
  onUp: (id: string) => void;
  onDown: (id: string) => void;
  onDropItem: (sourceId: string, targetId: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="rounded-3xl bg-white p-4">
      <p className="font-semibold">{title}</p>
      <div className="mt-4 space-y-2">
        {items.length ? items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedId && draggedId !== item.id) onDropItem(draggedId, item.id);
              setDraggedId(null);
            }}
            className={`flex cursor-grab items-center gap-2 rounded-2xl bg-cream px-3 py-2 transition ${draggedId === item.id ? "opacity-45" : "hover:bg-sage"}`}
          >
            <GripVertical size={14} className="text-ink/25" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.order}. {item.label}</span>
            <button onClick={() => onUp(item.id)} className="grid size-7 place-items-center rounded-full bg-white text-xs">↑</button>
            <button onClick={() => onDown(item.id)} className="grid size-7 place-items-center rounded-full bg-white text-xs">↓</button>
          </div>
        )) : <p className="rounded-2xl bg-cream p-3 text-sm text-ink/40">Aucun élément.</p>}
      </div>
    </div>
  );
}

function MockTable({ rows }: { rows: string[][] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-white">
      {rows.map((row) => (
        <div key={row.join("-")} className="grid gap-2 border-b border-black/5 p-4 last:border-b-0 md:grid-cols-4">
          {row.map((cell) => <span key={cell} className="text-sm text-ink/65">{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function SettingCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="rounded-3xl bg-white p-5">
      <span className="grid size-10 place-items-center rounded-xl bg-sage text-moss">{icon}</span>
      <p className="mt-5 font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/50">{text}</p>
    </article>
  );
}
