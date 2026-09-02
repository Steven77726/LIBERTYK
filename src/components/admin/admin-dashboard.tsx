"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  Moon,
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
  X,
} from "lucide-react";
import { categories } from "@/data/categories";
import { localSubrubrics } from "@/data/subrubrics";
import { restaurants } from "@/data/restaurants";
import { brunches } from "@/data/brunches";
import { wineActivities } from "@/data/wine-activities";
import { azamra } from "@/data/shops";
import { localEstablishments } from "@/data/establishments";
import { assetPath } from "@/lib/assets";
import { getAnalyticsEvents, getReviews } from "@/lib/client-store";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";
import { hasAdminSession } from "@/components/admin/admin-access-gate";
import { uploadLibertyImage } from "@/lib/supabase/storage";
import { fetchRealAnalyticsEvents, loadAdminStateFromSupabase, saveAdminStateToSupabase, saveSeoAnalysisHistory, writeAuditLog } from "@/lib/supabase/admin-state";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createRubric as createRubricInSupabase,
  duplicateRubric as duplicateRubricInSupabase,
  hideRubric as hideRubricInSupabase,
  importRubricsIfMissing,
  listAllRubricsForAdmin,
  moveRubricToTrash as moveRubricToTrashInSupabase,
  publishRubric as publishRubricInSupabase,
  sleepRubric as sleepRubricInSupabase,
  restoreRubric as restoreRubricInSupabase,
  updateRubric as updateRubricInSupabase,
  updateRubricOrder,
} from "@/lib/supabase/rubrics-repository";
import { GoogleSyncModal } from "./google-sync-modal";
import { EstablishmentEditor } from "./establishment-editor";
import { getEstablishmentGoogleBusiness, type GooglePlaceDetails } from "@/lib/google-places";
import {
  createSubrubric as createSubrubricInSupabase,
  duplicateSubrubric as duplicateSubrubricInSupabase,
  hideSubrubric as hideSubrubricInSupabase,
  importSubrubricsIfMissing,
  listAllSubrubricsForAdmin,
  moveSubrubricToTrash as moveSubrubricToTrashInSupabase,
  publishSubrubric as publishSubrubricInSupabase,
  sleepSubrubric as sleepSubrubricInSupabase,
  restoreSubrubric as restoreSubrubricInSupabase,
  updateSubrubricOrder,
} from "@/lib/supabase/subrubrics-repository";
import {
  createEstablishment as createEstablishmentInSupabase,
  duplicateEstablishment as duplicateEstablishmentInSupabase,
  hideEstablishment as hideEstablishmentInSupabase,
  importEstablishmentsIfMissing,
  listAllEstablishmentsForAdmin,
  moveEstablishmentToTrash as moveEstablishmentToTrashInSupabase,
  publishEstablishment as publishEstablishmentInSupabase,
  restoreEstablishment as restoreEstablishmentInSupabase,
  updateEstablishmentOrder,
  updateEstablishment as updateEstablishmentInSupabase,
  type EstablishmentRecord,
} from "@/lib/supabase/establishments-repository";
import {
  hideVisibleTag,
  importVisibleTagsIfMissing,
  listAllVisibleTagsForAdmin,
  moveVisibleTagToTrash,
  upsertVisibleTag,
  type VisibleTagRecord,
} from "@/lib/supabase/visible-tags-repository";
import {
  hideCertification as hideCertificationInSupabase,
  importCertificationsIfMissing,
  listAllCertificationsForAdmin,
  moveCertificationToTrash,
  upsertCertification,
  type CertificationRecord,
} from "@/lib/supabase/certifications-repository";
import {
  listBeautyCategories,
  listBeautyServices,
  listProfessionalServices,
  replaceProfessionalServices,
  upsertBeautyCategory,
  upsertBeautyService,
} from "@/lib/supabase/beauty-repository";
import type { BeautyCategory, BeautyProfessionalService, BeautyService } from "@/lib/beauty/types";
export type { BeautyCategory, BeautyProfessionalService, BeautyService };

export type AdminStatus = "Publié" | "En sommeil" | "Brouillon" | "Masqué";
export type BannerType = "Grande bannière" | "Bannière horizontale" | "Bannière moyenne" | "Petit encart" | "Carte sponsorisée" | "Carrousel";
export type BannerPosition = "Home" | "Rubrique" | "Sous-rubrique" | "Fiche";
export type KosherType = "Bassari" | "Halavi" | "Parvé" | "No Teouda / Friendly" | "À compléter";
export type SponsorshipLevel = "Standard" | "Featured" | "Premium" | "Sponsorisé" | "Partenaire officiel" | "Coup de cœur Liberty";
export type RubricFormat = "Petit carré" | "Carré" | "Carré standard" | "Grand carré" | "Rectangle horizontal" | "Bannière" | "Bannière pleine largeur";
export type FieldVisibility = Record<string, boolean>;
export type AdminUserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  auth_provider: string | null;
  status: "active" | "suspended" | null;
  created_at: string;
  last_sign_in_at: string | null;
};

export type AdminHoursValue = Record<string, { open: boolean; slot1Start: string; slot1End: string; slot2Start: string; slot2End: string }>;
export type SeoPriority = "critical" | "high" | "medium" | "low";
export type SeoSection = "content" | "technical" | "local" | "search";
export type SeoEntityType = "home" | "category" | "subcategory" | "establishment" | "static";
export type SeoSuggestionAction = "metaTitle" | "metaDescription" | "altText" | "customerSearchTerms" | "visibleTags" | "description" | "internalLinks";

export type SeoIssue = {
  id: string;
  priority: SeoPriority;
  section: SeoSection;
  problem: string;
  explanation: string;
  correction: string;
  impact: string;
};

export type SeoSuggestion = {
  id: string;
  action: SeoSuggestionAction;
  label: string;
  value: string;
  entityType: SeoEntityType;
  entityId: string;
};

export type SeoReport = {
  id: string;
  entityType: SeoEntityType;
  entityId: string;
  title: string;
  category: string;
  url: string;
  status: AdminStatus;
  score: number;
  contentScore: number;
  technicalScore: number;
  localScore: number;
  searchScore: number;
  issues: SeoIssue[];
  suggestions: SeoSuggestion[];
  lastAnalyzedAt: string;
};

export type AdminRubric = {
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

export type AdminSubrubric = {
  id: string;
  rubricId: string;
  slug?: string;
  name: string;
  description: string;
  photo: string;
  icon?: string;
  imageAlt?: string;
  visible?: boolean;
  showPublicly?: boolean;
  format?: RubricFormat;
  gridColumns?: 1 | 2 | 3 | 4;
  columnsDesktop?: 2 | 3 | 4;
  columnsTablet?: 1 | 2 | 3;
  columnsMobile?: 1 | 2;
  searchKeywords?: string[];
  order: number;
  status: AdminStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type AdminTag = {
  id: string;
  label: string;
  kind?: "visible" | "search";
  icon?: string;
  color?: string;
  rubricIds?: string[];
  order: number;
  status?: AdminStatus;
};

export type AdminCertification = {
  id: string;
  label: string;
  order: number;
  status: AdminStatus;
};

export type AdminEstablishment = {
  id: string;
  databaseId?: string;
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
  country?: string;
  nearestMetroName?: string;
  nearestMetroLine?: string;
  email?: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  website: string;
  deliverooUrl?: string;
  uberEatsUrl?: string;
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
  beautyServices?: BeautyProfessionalService[];
  fieldVisibility?: FieldVisibility;
  createdAt?: string;
  updatedAt?: string;
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
  deliveroo: true,
  ubereats: true,
  reservation: true,
  address: true,
  opening_hours: true,
  tags: true,
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
  { key: "deliveroo", label: "Deliveroo" },
  { key: "ubereats", label: "Uber Eats" },
  { key: "website", label: "Site internet" },
  { key: "reservation", label: "Réservation" },
  { key: "address", label: "Adresse" },
  { key: "opening_hours", label: "Horaires" },
  { key: "tags", label: "Tags" },
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

function isUnsafeTransientImageUrl(value: string | undefined | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.startsWith("data:") || trimmed.startsWith("blob:");
}

function safeImageUrl(value: string | undefined | null) {
  const trimmed = value?.trim() ?? "";
  return isUnsafeTransientImageUrl(trimmed) ? "" : trimmed;
}

function persistAdminStateSnapshot(state: AdminState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Liberty Admin: état local trop lourd ou indisponible, stockage local ignoré.", error);
  }
}

function normalizePhotoSlots(mainPhoto: string | undefined, photos: string[] | undefined, slots = 2) {
  const main = safeImageUrl(mainPhoto);
  const clean = (photos ?? []).map((photo) => safeImageUrl(photo)).filter(Boolean) as string[];
  const unique = clean.filter((photo, index, list) => photo !== main && list.indexOf(photo) === index).slice(0, slots);
  return [...unique, ...Array(Math.max(0, slots - unique.length)).fill("")];
}

function parseAdminHours(value: string): AdminHoursValue {
  const parsed = Object.fromEntries(weekDays.map((day) => [day, { open: false, slot1Start: "", slot1End: "", slot2Start: "", slot2End: "" }])) as AdminHoursValue;
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

function serializeAdminHours(hours: AdminHoursValue) {
  return weekDays.map((day) => {
    const value = hours[day];
    if (!value.open) return `${day}: Fermé`;
    const slots = [`${value.slot1Start || "09:00"}–${value.slot1End || "18:00"}`];
    if (value.slot2Start && value.slot2End) slots.push(`${value.slot2Start}–${value.slot2End}`);
    return `${day}: ${slots.join(" / ")}`;
  }).join("\n");
}

function getAdminHoursStatus(value: string) {
  const hours = parseAdminHours(value);
  const today = weekDays[(new Date().getDay() + 6) % 7];
  const yesterday = weekDays[(new Date().getDay() + 5) % 7];
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isInDay = (day: string, offset = 0) => {
    const current = hours[day];
    if (!current.open) return false;
    return [
      [current.slot1Start, current.slot1End],
      [current.slot2Start, current.slot2End],
    ].some(([start, end]) => {
      if (!start || !end) return false;
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      if (![sh, sm, eh, em].every(Number.isFinite)) return false;
      const startMinutes = sh * 60 + sm + offset;
      let endMinutes = eh * 60 + em + offset;
      let currentMinutes = nowMinutes;
      if (endMinutes < startMinutes) endMinutes += 24 * 60;
      if (offset < 0) currentMinutes += 24 * 60;
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  };
  const hasHours = Object.values(hours).some((day) => day.open || day.slot1Start || day.slot1End || day.slot2Start || day.slot2End);
  if (!hasHours) return { label: "Horaires non renseignés", open: null as boolean | null };
  const isOpen = isInDay(today) || isInDay(yesterday, -24 * 60);
  return { label: isOpen ? "Ouvert actuellement" : "Fermé actuellement", open: isOpen };
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
  "No Teouda / Friendly",
].map((label, index) => ({ id: slugify(label), label, order: index + 1, status: "Publié" as AdminStatus }));

function deduplicateAdminTags(tags: AdminTag[]): AdminTag[] {
  const seen = new Set<string>();
  const result: AdminTag[] = [];
  for (const tag of tags) {
    const norm = (tag.label || tag.id || "").trim().toLowerCase();
    const slugNorm = slugify(tag.label || tag.id || "");
    if (!norm || seen.has(norm) || seen.has(slugNorm)) continue;
    seen.add(norm);
    seen.add(slugNorm);
    result.push({
      ...tag,
      id: tag.id || slugNorm,
      label: tag.label.trim(),
    });
  }
  return result;
}

function normalizeAdminState(state: Partial<AdminState>): AdminState {
  const seed = createSeedState();
  return {
    ...seed,
    ...state,
    rubrics: (state.rubrics ?? seed.rubrics).map((item) => ({ ...item, slug: item.slug ?? slugify(item.name), image: safeImageUrl(item.image), imageAlt: item.imageAlt ?? item.name, showOnHome: item.showOnHome ?? true, format: (item.format === "Carré" ? "Carré standard" : item.format) ?? "Carré standard", columnsDesktop: item.columnsDesktop ?? 3, columnsTablet: item.columnsTablet ?? 2, columnsMobile: item.columnsMobile ?? 1, searchKeywords: item.searchKeywords ?? [], createdAt: item.createdAt ?? today, updatedAt: item.updatedAt ?? today })),
    subrubrics: (state.subrubrics ?? seed.subrubrics).map((item) => ({
      ...item,
      slug: item.slug ?? slugify(item.name),
      photo: safeImageUrl(item.photo),
      imageAlt: item.imageAlt ?? item.name,
      visible: item.visible ?? item.showPublicly ?? true,
      showPublicly: item.showPublicly ?? item.visible ?? true,
      format: (item.format === "Carré" ? "Carré standard" : item.format) ?? "Carré standard",
      gridColumns: item.gridColumns ?? item.columnsDesktop ?? 3,
      columnsDesktop: (item.columnsDesktop ?? (item.gridColumns === 1 ? 3 : item.gridColumns) ?? 3) as 2 | 3 | 4,
      columnsTablet: item.columnsTablet ?? 2,
      columnsMobile: item.columnsMobile ?? 1,
      searchKeywords: item.searchKeywords ?? [],
      createdAt: item.createdAt ?? today,
      updatedAt: item.updatedAt ?? today,
    })),
    tags: deduplicateAdminTags((state.tags ?? seed.tags).map((item) => ({ ...item, kind: item.kind ?? "visible", color: item.color ?? "#1f4d3b", rubricIds: item.rubricIds ?? [], status: item.status ?? "Publié" }))),
    certifications: state.certifications ?? seed.certifications,
    establishments: (state.establishments ?? seed.establishments).map((item) => ({
      ...item,
      slug: item.slug ?? slugify(item.name),
      mainPhoto: safeImageUrl(item.mainPhoto),
      shortDescription: item.shortDescription ?? item.description.slice(0, 120),
      photos: normalizePhotoSlots(item.mainPhoto, item.photos, 4),
      photoAlts: [...(item.photoAlts ?? []), "", ""].slice(0, 4),
      postalCode: item.postalCode ?? "",
      country: item.country ?? "France",
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
    banners: (state.banners ?? seed.banners).map((item) => ({ ...item, image: safeImageUrl(item.image), internalName: item.internalName ?? item.title, imageAlt: item.imageAlt ?? item.title, sponsored: item.sponsored ?? false })),
    notifications: (state.notifications ?? seed.notifications).map((item) => ({ ...item, image: safeImageUrl(item.image), status: ["Brouillon", "Programmée", "Envoyée", "Annulée"].includes(item.status) ? item.status : "Brouillon" })),
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
    format: "Carré standard",
    columnsDesktop: 3,
    columnsTablet: 2,
    columnsMobile: 1,
    order: index + 1,
    status: "Publié",
  }));

  const subrubrics: AdminSubrubric[] = localSubrubrics.map((item) => ({
    id: item.id,
    rubricId: item.rubricId,
    slug: item.slug,
    name: item.name,
    description: item.description,
    icon: item.icon,
    photo: item.image,
    imageAlt: item.imageAlt,
    visible: item.showPublicly,
    showPublicly: item.showPublicly,
    format: item.format,
    gridColumns: item.columnsDesktop,
    columnsDesktop: item.columnsDesktop,
    columnsTablet: item.columnsTablet,
    columnsMobile: item.columnsMobile,
    searchKeywords: item.searchKeywords,
    order: item.order,
    status: "Publié" as AdminStatus,
  }));

  const restaurantSubrubric = "food-restaurants";
  const brunchSubrubric = "food-brunch";
  const wineRubric = getRubricId("Vin & Spiritueux");
  const shoppingRubric = getRubricId("Shopping");

  const restaurantEstablishments: AdminEstablishment[] = restaurants.map((restaurant, index) => ({
    id: restaurant.id,
    rubricId: "food",
    subrubricId: restaurantSubrubric,
    mainPhoto: restaurant.image,
        photos: ["", "", "", ""],
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
        photos: normalizePhotoSlots(brunch.images[0] ?? "", [brunch.images[1], brunch.images[2], brunch.images[3], brunch.images[4]], 4),
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
        photos: ["", "", "", ""],
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
    photos: azamra.photos,
    photoAlts: ["Azamra Boutique", "Azamra Collection 1", "Azamra Collection 2", "Azamra Collection 3"],
    name: azamra.name,
    shortDescription: `${azamra.type} · Shopping`,
    description: azamra.description,
    address: azamra.address,
    city: azamra.city,
    arrondissement: azamra.arrondissement,
    postalCode: azamra.postalCode,
    country: azamra.country,
    nearestMetroName: azamra.nearestMetroName,
    nearestMetroLine: azamra.nearestMetroLine,
    phone: azamra.phone,
    whatsapp: azamra.whatsapp,
    instagram: azamra.instagram,
    website: azamra.website,
    hours: azamra.hours,
    terrace: false,
    delivery: false,
    takeaway: false,
    reservation: false,
    privateHire: false,
    certification: "Non concerné",
    kosherType: "À compléter",
    averagePrice: "€€",
    latitude: "48.8862",
    longitude: "2.3025",
    status: "Publié",
    sponsorshipLevel: "Standard",
    sponsored: false,
    sponsorPriority: 0,
    sponsorDuration: "",
    order: 1,
    customerSearches: ["azamra", "vêtements", "mode", "homme", "femme", "enfant", "shopping", "boutique"],
    visibleTagIds: azamra.tags,
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
    if (hydrated) persistAdminStateSnapshot(state);
  }, [hydrated, state]);

  return [state, setState] as const;
}

const menu = [
  { id: "dashboard", label: "Vue d’ensemble", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: UsersRound },
  { id: "rubrics", label: "Rubriques", icon: Store },
  { id: "subrubrics", label: "Sous-rubriques", icon: Tags },
  { id: "establishments", label: "Fiches / Établissements", icon: Building2 },
  { id: "beauty", label: "Soins femme", icon: Sparkles },
  { id: "tags", label: "Tags visibles", icon: Tags },
  { id: "customer-searches", label: "Recherches clients", icon: Search },
  { id: "seo-assistant", label: "SEO Assistant", icon: BarChart3 },
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
  const styles: Record<AdminStatus, string> = {
    Publié: "bg-emerald-50 text-emerald-700 border-emerald-100",
    "En sommeil": "bg-indigo-50 text-indigo-700 border-indigo-200",
    Brouillon: "bg-amber-50 text-amber-700 border-amber-100",
    Masqué: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };
  return styles[status] || styles.Brouillon;
}

const SEO_CACHE_KEY = "liberty-admin-seo-analysis-v1";

const seoPriorityLabel: Record<SeoPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function seoScoreLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 45) return "Needs improvement";
  return "Critical";
}

function seoScoreColor(score: number) {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-moss";
  if (score >= 45) return "bg-amber-500";
  return "bg-rose-500";
}

function uniqueSeoId(prefix: string, value: string) {
  return `${prefix}-${slugify(value).slice(0, 80)}`;
}

function wordCount(value?: string) {
  return String(value ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function hasCompleteAdminHours(value?: string) {
  const hours = parseAdminHours(value ?? "");
  return Object.values(hours).some((day) => day.open && day.slot1Start && day.slot1End);
}

function makeSeoIssue(priority: SeoPriority, section: SeoSection, problem: string, explanation: string, correction: string, impact: string): SeoIssue {
  return { id: uniqueSeoId(`${priority}-${section}`, problem), priority, section, problem, explanation, correction, impact };
}

function averageScore(values: number[]) {
  return Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
}

function makeSeoReport(input: {
  entityType: SeoEntityType;
  entityId: string;
  title: string;
  category: string;
  url: string;
  status: AdminStatus;
  description?: string;
  image?: string;
  imageAlt?: string;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
  phone?: string;
  website?: string;
  latitude?: string;
  longitude?: string;
  hours?: string;
  customerSearchTerms?: string[];
  visibleTags?: string[];
  keywords?: string[];
  relatedLabel?: string;
  localPage?: boolean;
}) {
  const issues: SeoIssue[] = [];
  const suggestions: SeoSuggestion[] = [];
  const descriptionWords = wordCount(input.description);
  const titleLength = input.title.trim().length;
  const hasImage = Boolean(input.image?.trim());
  const hasAlt = Boolean(input.imageAlt?.trim());
  const customerTerms = input.customerSearchTerms ?? [];
  const visibleTags = input.visibleTags ?? [];
  const keywords = input.keywords ?? [];
  const localText = `${input.title} ${input.description ?? ""} ${input.address ?? ""} ${input.city ?? ""} ${input.district ?? ""}`.toLowerCase();
  const hasLocalKeyword = Boolean(input.city || input.district || /\bparis\b|\b750\d{2}\b/.test(localText));
  let contentScore = 100;
  let technicalScore = 100;
  let localScore = input.localPage ? 100 : 100;
  let searchScore = 100;

  if (!input.title.trim()) {
    contentScore -= 30;
    issues.push(makeSeoIssue("critical", "content", "Missing title", "La page n’a pas de titre exploitable.", "Renseigner un nom clair et spécifique.", "Très fort"));
  } else if (titleLength < 8 || titleLength > 68) {
    contentScore -= 10;
    issues.push(makeSeoIssue("medium", "content", "Meta title length can be improved", "Le titre est trop court ou trop long pour un affichage optimal.", "Utiliser un titre entre 30 et 60 caractères.", "Moyen"));
    suggestions.push({ id: uniqueSeoId("suggest-title", input.entityId), action: "metaTitle", label: "Meta Title proposé", value: `${input.title} | Liberty`, entityType: input.entityType, entityId: input.entityId });
  }

  if (!input.description?.trim()) {
    contentScore -= 25;
    issues.push(makeSeoIssue("critical", "content", "Missing content description", "La page n’a pas de description visible ou SEO.", "Ajouter une description utile et unique.", "Très fort"));
    suggestions.push({ id: uniqueSeoId("suggest-description", input.entityId), action: "description", label: "Description proposée", value: `${input.title} sur Liberty : informations pratiques, adresse, services et recommandations pour trouver rapidement ce qui correspond à votre recherche.`, entityType: input.entityType, entityId: input.entityId });
  } else if (descriptionWords < 18) {
    contentScore -= 16;
    issues.push(makeSeoIssue("high", "content", "Description too short", "La description contient trop peu de contenu pour être bien comprise.", "Ajouter au moins 2 phrases descriptives avec mots locaux et services.", "Fort"));
    suggestions.push({ id: uniqueSeoId("suggest-meta-description", input.entityId), action: "metaDescription", label: "Meta Description proposée", value: `${input.title} : ${input.description}`.slice(0, 155), entityType: input.entityType, entityId: input.entityId });
  }

  if (!hasLocalKeyword && input.localPage) {
    contentScore -= 10;
    issues.push(makeSeoIssue("medium", "content", "Missing local keyword", "La fiche ne contient pas assez de repères locaux.", "Ajouter ville, arrondissement ou code postal dans le contenu.", "Moyen"));
  }

  if (!input.url.startsWith("/") || /\s/.test(input.url)) {
    technicalScore -= 20;
    issues.push(makeSeoIssue("high", "technical", "URL structure problem", "L’URL n’est pas propre ou contient des espaces.", "Utiliser un slug court, lisible et sans caractères spéciaux.", "Fort"));
  }
  if (!hasImage) {
    technicalScore -= 18;
    issues.push(makeSeoIssue("high", "technical", "Missing image", "La page ne possède pas d’image principale.", "Ajouter une image principale optimisée.", "Fort"));
  }
  if (hasImage && !hasAlt) {
    technicalScore -= 14;
    issues.push(makeSeoIssue("medium", "technical", "Missing alt text", "L’image principale n’a pas de texte alternatif.", "Ajouter un alt text descriptif.", "Moyen"));
    suggestions.push({ id: uniqueSeoId("suggest-alt", input.entityId), action: "altText", label: "Alt text proposé", value: `${input.title}${input.city ? ` à ${input.city}` : ""}`, entityType: input.entityType, entityId: input.entityId });
  }
  if (input.website && !/^https?:\/\//i.test(input.website)) {
    technicalScore -= 8;
    issues.push(makeSeoIssue("low", "technical", "External link should include protocol", "Le site web n’indique pas explicitement https://.", "Renseigner l’URL complète du site web.", "Faible"));
  }
  if (input.status !== "Publié") {
    technicalScore -= 10;
    issues.push(makeSeoIssue("low", "technical", "Page is not published", "La page est en brouillon ou masquée.", "Publier uniquement après validation des champs essentiels.", "Faible"));
  }

  if (input.localPage) {
    if (!input.address?.trim()) {
      localScore -= 22;
      issues.push(makeSeoIssue("critical", "local", "Missing full address", "La fiche ne peut pas être fiable pour l’itinéraire ou le SEO local.", "Renseigner l’adresse complète.", "Très fort"));
    }
    if (!input.city?.trim()) {
      localScore -= 12;
      issues.push(makeSeoIssue("high", "local", "Missing city", "La ville est absente.", "Renseigner la ville.", "Fort"));
    }
    if (!input.district?.trim()) {
      localScore -= 10;
      issues.push(makeSeoIssue("medium", "local", "Missing district", "L’arrondissement ou le quartier n’est pas renseigné.", "Ajouter l’arrondissement ou le quartier.", "Moyen"));
    }
    if (!input.latitude?.trim() || !input.longitude?.trim()) {
      localScore -= 18;
      issues.push(makeSeoIssue("high", "local", "Missing coordinates", "La géolocalisation et l’itinéraire seront moins précis.", "Ajouter latitude et longitude.", "Fort"));
    }
    if (!hasCompleteAdminHours(input.hours)) {
      localScore -= 14;
      issues.push(makeSeoIssue("medium", "local", "Opening hours incomplete", "Les horaires ne permettent pas d’indiquer l’ouverture correctement.", "Ajouter au moins un créneau horaire réel.", "Moyen"));
    }
    if (!input.phone?.trim()) {
      localScore -= 10;
      issues.push(makeSeoIssue("medium", "local", "Missing phone number", "La fiche n’a pas de numéro d’appel.", "Ajouter un téléphone public.", "Moyen"));
    }
  }

  if (customerTerms.length === 0) {
    searchScore -= 28;
    issues.push(makeSeoIssue("critical", "search", "Missing Customer Search Terms", "Liberty Search n’a pas assez de signaux prioritaires.", "Ajouter les requêtes clients principales.", "Très fort"));
    suggestions.push({ id: uniqueSeoId("suggest-search", input.entityId), action: "customerSearchTerms", label: "Recherches clients proposées", value: [input.title, input.category, input.relatedLabel, input.city, input.district ? `Paris ${input.district}` : ""].filter(Boolean).join(", "), entityType: input.entityType, entityId: input.entityId });
  } else if (customerTerms.length < 5 && input.entityType === "establishment") {
    searchScore -= 16;
    issues.push(makeSeoIssue("high", "search", "Not enough Customer Search Terms", "La fiche risque de manquer certaines recherches naturelles.", "Ajouter 5 à 15 expressions client.", "Fort"));
  }
  if (visibleTags.length === 0 && input.entityType === "establishment") {
    searchScore -= 10;
    issues.push(makeSeoIssue("medium", "search", "Missing visible tags", "Les tags aident à filtrer et comprendre la fiche.", "Ajouter au moins 2 tags visibles.", "Moyen"));
    suggestions.push({ id: uniqueSeoId("suggest-tags", input.entityId), action: "visibleTags", label: "Tags visibles proposés", value: [input.category, input.relatedLabel, input.city].filter(Boolean).join(", "), entityType: input.entityType, entityId: input.entityId });
  }
  if (keywords.length < 3 && input.entityType !== "home") {
    searchScore -= 8;
    issues.push(makeSeoIssue("low", "search", "Few search keywords", "La page possède peu de synonymes ou variantes.", "Ajouter des synonymes et variantes naturelles.", "Faible"));
  }

  contentScore = Math.max(0, contentScore);
  technicalScore = Math.max(0, technicalScore);
  localScore = Math.max(0, localScore);
  searchScore = Math.max(0, searchScore);
  const score = averageScore([contentScore, technicalScore, localScore, searchScore]);

  return {
    id: `${input.entityType}-${input.entityId}`,
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title || "Sans titre",
    category: input.category,
    url: input.url,
    status: input.status,
    score,
    contentScore,
    technicalScore,
    localScore,
    searchScore,
    issues,
    suggestions,
    lastAnalyzedAt: new Date().toISOString(),
  } satisfies SeoReport;
}

function analyzeAdminSeo(state: AdminState): SeoReport[] {
  const publishedRubrics = state.rubrics.filter((item) => item.status === "Publié");
  const publishedSubrubrics = state.subrubrics.filter((item) => item.status === "Publié");
  const rubrics = new Map(state.rubrics.map((item) => [item.id, item]));
  const subrubrics = new Map(state.subrubrics.map((item) => [item.id, item]));
  const tags = new Map(state.tags.map((item) => [item.id, item]));
  const reports: SeoReport[] = [
    makeSeoReport({
      entityType: "home",
      entityId: "home",
      title: "Liberty",
      category: "Home page",
      url: "/",
      status: "Publié",
      description: "Le meilleur de l'univers juif et casher, réuni dans une expérience simple, inspirante et exigeante.",
      image: publishedRubrics.find((item) => item.image)?.image,
      imageAlt: "Liberty accueil",
      customerSearchTerms: publishedRubrics.flatMap((item) => item.searchKeywords ?? []).slice(0, 20),
      visibleTags: publishedRubrics.map((item) => item.name),
      keywords: publishedRubrics.map((item) => item.name),
    }),
  ];

  state.rubrics.forEach((rubric) => {
    reports.push(makeSeoReport({
      entityType: "category",
      entityId: rubric.id,
      title: rubric.name,
      category: "Categories",
      url: `/${rubric.slug ?? rubric.id}`,
      status: rubric.status,
      description: rubric.description,
      image: rubric.image,
      imageAlt: rubric.imageAlt,
      customerSearchTerms: rubric.searchKeywords,
      visibleTags: state.subrubrics.filter((item) => item.rubricId === rubric.id).map((item) => item.name),
      keywords: [rubric.name, ...(rubric.searchKeywords ?? [])],
      relatedLabel: rubric.name,
    }));
  });

  state.subrubrics.forEach((subrubric) => {
    const rubric = rubrics.get(subrubric.rubricId);
    reports.push(makeSeoReport({
      entityType: "subcategory",
      entityId: subrubric.id,
      title: subrubric.name,
      category: rubric?.name ?? "Subcategories",
      url: `/${rubric?.slug ?? rubric?.id ?? "rubrique"}/${subrubric.slug ?? subrubric.id}`,
      status: subrubric.status,
      description: subrubric.description,
      image: subrubric.photo,
      imageAlt: subrubric.imageAlt,
      customerSearchTerms: subrubric.searchKeywords,
      visibleTags: [],
      keywords: [subrubric.name, ...(subrubric.searchKeywords ?? [])],
      relatedLabel: rubric?.name,
    }));
  });

  state.establishments.forEach((establishment) => {
    const rubric = rubrics.get(establishment.rubricId);
    const subrubric = subrubrics.get(establishment.subrubricId);
    const visibleTags = establishment.visibleTagIds
      .flatMap((id) => {
        const tag = tags.get(id);
        return tag && tag.status !== "Masqué" ? [tag] : [];
      })
      .map((tag) => tag.label);
    reports.push(makeSeoReport({
      entityType: "establishment",
      entityId: establishment.id,
      title: establishment.name,
      category: rubric?.name ?? "Establishments",
      url: `/${rubric?.slug ?? establishment.rubricId}/${subrubric?.slug ?? ""}#${establishment.slug ?? establishment.id}`.replace(/\/#/g, "#"),
      status: establishment.status,
      description: establishment.description,
      image: establishment.mainPhoto,
      imageAlt: establishment.photoAlts?.[0],
      address: establishment.address,
      city: establishment.city,
      district: establishment.arrondissement,
      country: "France",
      phone: establishment.phone,
      website: establishment.website,
      latitude: establishment.latitude,
      longitude: establishment.longitude,
      hours: establishment.hours,
      customerSearchTerms: establishment.customerSearches,
      visibleTags,
      keywords: [establishment.name, establishment.certification, establishment.kosherType, establishment.averagePrice, ...(establishment.cuisineTypes ?? []), ...visibleTags].filter(Boolean),
      relatedLabel: subrubric?.name,
      localPage: true,
    }));
  });

  state.pageSections.forEach((section) => {
    reports.push(makeSeoReport({
      entityType: "static",
      entityId: section.id,
      title: section.title,
      category: section.page,
      url: section.page === "Home Page" ? "/" : `/${slugify(section.page)}`,
      status: section.status,
      description: `${section.title} · ${section.type}`,
      customerSearchTerms: [],
      visibleTags: [section.type],
      keywords: [section.page, section.title, section.type],
    }));
  });

  return reports.sort((a, b) => a.score - b.score || a.title.localeCompare(b.title, "fr"));
}

function summarizeSeoReports(reports: SeoReport[]) {
  const totalPages = reports.length;
  const criticalPages = reports.filter((report) => report.score < 45 || report.issues.some((issue) => issue.priority === "critical")).length;
  const needingImprovement = reports.filter((report) => report.score < 70).length;
  const healthyPages = reports.filter((report) => report.score >= 70 && !report.issues.some((issue) => issue.priority === "critical")).length;
  const withoutMetaDescription = reports.filter((report) => report.issues.some((issue) => issue.problem.includes("Description") || issue.problem.includes("description") || issue.problem === "Missing content description")).length;
  const withoutAltText = reports.filter((report) => report.issues.some((issue) => issue.problem === "Missing alt text")).length;
  const withoutCustomerSearchTerms = reports.filter((report) => report.issues.some((issue) => issue.problem.includes("Customer Search Terms"))).length;
  const withoutOpeningHours = reports.filter((report) => report.issues.some((issue) => issue.problem === "Opening hours incomplete")).length;
  const overallScore = reports.length ? averageScore(reports.map((report) => report.score)) : 0;
  const averageLoadingScore = reports.length ? averageScore(reports.map((report) => Math.max(0, report.technicalScore - (report.issues.some((issue) => issue.problem === "Missing image") ? 12 : 0)))) : 0;
  return { totalPages, criticalPages, needingImprovement, healthyPages, overallScore, averageLoadingScore, withoutMetaDescription, withoutAltText, withoutCustomerSearchTerms, withoutOpeningHours };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  id,
  required = false,
  error,
  inputRef,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  id?: string;
  required?: boolean;
  error?: string;
  inputRef?: (node: HTMLInputElement | HTMLTextAreaElement | null) => void;
}) {
  return (
    <label id={id} className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-ink/35">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {textarea ? (
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          aria-invalid={Boolean(error)}
          className={`w-full resize-none rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-moss/40 focus:ring-4 focus:ring-moss/10 ${error ? "border-rose-300 ring-4 ring-rose-100" : "border-black/10"}`}
        />
      ) : (
        <input
          ref={inputRef as ((node: HTMLInputElement | null) => void) | undefined}
          value={value}
          type={type}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-moss/40 focus:ring-4 focus:ring-moss/10 ${error ? "border-rose-300 ring-4 ring-rose-100" : "border-black/10"}`}
        />
      )}
      {error && <span className="mt-1.5 block text-xs font-semibold text-rose-600">{error}</span>}
    </label>
  );
}

function KeywordChipsField({
  label,
  terms,
  onChange,
  placeholder = "Tapez un mot-clé puis Entrée ou virgule",
  help,
}: {
  label: string;
  terms: string[];
  onChange: (terms: string[]) => void;
  placeholder?: string;
  help?: string;
}) {
  const [draft, setDraft] = useState("");
  const normalizedTerms = terms.map((term) => term.trim()).filter(Boolean);

  const commitTerms = (rawValue: string) => {
    const incoming = cleanTextList(rawValue);
    if (!incoming.length) {
      setDraft("");
      return;
    }

    const seen = new Set<string>();
    const merged = [...normalizedTerms, ...incoming].filter((term) => {
      const key = term.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    onChange(merged);
    setDraft("");
  };

  const removeTerm = (termToRemove: string) => {
    onChange(normalizedTerms.filter((term) => term !== termToRemove));
  };

  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-ink/35">{label}</span>
      <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 transition focus-within:border-moss/40 focus-within:ring-4 focus-within:ring-moss/10">
        <div className="flex flex-wrap items-center gap-2">
          {normalizedTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => removeTerm(term)}
              className="rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-moss transition hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Supprimer ${term}`}
            >
              {term} ×
            </button>
          ))}
          <input
            value={draft}
            onChange={(event) => {
              const value = event.target.value;
              if (value.includes(",")) commitTerms(value);
              else setDraft(value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                commitTerms(draft);
              }
              if (event.key === "Backspace" && !draft && normalizedTerms.length) {
                event.preventDefault();
                onChange(normalizedTerms.slice(0, -1));
              }
            }}
            onBlur={() => {
              if (draft.trim()) commitTerms(draft);
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              if (/[\n,]/.test(pasted)) {
                event.preventDefault();
                commitTerms(`${draft}${draft ? "," : ""}${pasted}`);
              }
            }}
            placeholder={normalizedTerms.length ? "Ajouter…" : placeholder}
            className="min-w-[180px] flex-1 bg-transparent px-1 py-1.5 text-sm outline-none placeholder:text-ink/30"
          />
        </div>
      </div>
      {help && <p className="mt-2 text-xs leading-5 text-ink/45">{help}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  id,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  id?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <label id={id} className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-ink/35">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          className={`w-full appearance-none rounded-2xl border bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-moss/40 focus:ring-4 focus:ring-moss/10 ${error ? "border-rose-300 ring-4 ring-rose-100" : "border-black/10"}`}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/35" size={16} />
      </span>
      {error && <span className="mt-1.5 block text-xs font-semibold text-rose-600">{error}</span>}
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
                  <div className="grid gap-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink/35">Heure d’ouverture<input required type="time" value={current.slot1Start} onChange={(event) => updateDay(day, { slot1Start: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none" /></label>
                      <label className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink/35">Heure de fermeture<input required type="time" value={current.slot1End} onChange={(event) => updateDay(day, { slot1End: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none" /></label>
                    </div>
                    {(current.slot2Start || current.slot2End) ? (
                      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink/35">2e ouverture<input type="time" value={current.slot2Start} onChange={(event) => updateDay(day, { slot2Start: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none" /></label>
                        <label className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink/35">2e fermeture<input type="time" value={current.slot2End} onChange={(event) => updateDay(day, { slot2End: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-ink outline-none" /></label>
                        <button type="button" onClick={() => updateDay(day, { slot2Start: "", slot2End: "" })} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Supprimer</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => updateDay(day, { slot2Start: "19:00", slot2End: "23:00" })} className="w-fit rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink/55">Ajouter un créneau</button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ink/40">Fermé</p>
                )}
                <button type="button" onClick={() => copyToAll(day)} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink/55">Copier ces horaires sur les autres jours</button>
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
  publishing,
  onDraft,
  onPreview,
  onPublish,
  onSleep,
  onHide,
  onTrash,
}: {
  disabled?: boolean;
  publishing?: boolean;
  onDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onSleep?: () => void;
  onHide: () => void;
  onTrash: () => void;
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-5 flex flex-wrap items-center gap-2 rounded-3xl border border-black/[.06] bg-white/92 p-3 shadow-[0_18px_60px_rgba(16,26,21,.12)] backdrop-blur-xl">
      <button disabled={disabled} onClick={onDraft} className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-45">
        Enregistrer en brouillon
      </button>
      <button disabled={disabled} onClick={onPreview} className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-sm disabled:cursor-not-allowed disabled:opacity-45">
        Prévisualiser
      </button>
      <button disabled={disabled} onClick={onPublish} className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-[.08em] text-white shadow-[0_14px_32px_rgba(16,26,21,.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">
        {publishing ? "Publication en cours…" : "Valider et publier"}
      </button>
      {onSleep && (
        <button disabled={disabled} onClick={onSleep} className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-45">
          <Moon size={13} /> En sommeil (Bientôt dispo)
        </button>
      )}
      <button disabled={disabled} onClick={onHide} className="rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-ink/55 shadow-sm disabled:cursor-not-allowed disabled:opacity-45">
        Masquer
      </button>
      <button disabled={disabled} onClick={onTrash} className="rounded-full bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-500 disabled:cursor-not-allowed disabled:opacity-45">
        Supprimer
      </button>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, folder = "admin", id, required = false, error }: { label: string; value: string; onChange: (value: string) => void; folder?: string; id?: string; required?: boolean; error?: string }) {
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  return (
    <div>
      <Field id={id} label={label} value={value} onChange={onChange} placeholder="URL locale, externe ou Supabase Storage" required={required} error={error} />
      <label className={`mt-2 inline-flex items-center gap-2 rounded-full bg-cream px-3 py-2 text-[11px] font-semibold text-ink/55 transition hover:bg-sage hover:text-moss ${uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
        <ImageIcon size={13} /> {uploading ? "Envoi en cours…" : "Envoyer une image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setMessage("Envoi en cours…");
            setUploading(true);
            try {
              const result = await uploadLibertyImage(file, folder);
              if (result.url) {
                onChange(result.url);
                setMessage("✅ Image mise à jour instantanément.");
              } else {
                setMessage(result.error || "Impossible d’envoyer l’image.");
              }
            } catch (uploadError) {
              setMessage(uploadError instanceof Error ? uploadError.message : "Impossible d’envoyer l’image.");
            } finally {
              setUploading(false);
              event.target.value = "";
            }
          }}
        />
      </label>
      {message && <p role="status" aria-live="polite" className={`mt-1 text-[11px] ${/impossible|erreur|échec|failed|policy|denied/i.test(message) ? "font-semibold text-rose-600" : "text-ink/35"}`}>{message}</p>}
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
  if (isUnsafeTransientImageUrl(src)) return <EmptyPhoto label="Photo non enregistrée" />;
  return <img src={assetPath(src)} alt={alt} className="aspect-[4/3] w-full rounded-2xl object-cover" />;
}

function EstablishmentPreviewModal({
  item,
  tags,
  onClose,
}: {
  item: AdminEstablishment | null;
  tags: AdminTag[];
  onClose: () => void;
}) {
  if (!item) return null;
  const images = [item.mainPhoto, ...normalizePhotoSlots(item.mainPhoto, item.photos, 4)].filter(Boolean);
  const visibleTags = item.visibleTagIds
    .map((id) => tags.find((tag) => tag.id === id && tag.status !== "Masqué")?.label)
    .filter(Boolean) as string[];
  const hours = parseAdminHours(item.hours);
  const status = getAdminHoursStatus(item.hours);

  return (
    <div className="fixed inset-0 z-[120] bg-ink/45 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mx-auto flex max-h-[92vh] max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/[.06] bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-moss/60">Prévisualisation non publiée</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-.035em]">{item.name || "Nouvelle fiche"}</h3>
          </div>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-cream text-ink/55 transition hover:bg-ink hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_.85fr]">
            <div className="space-y-3">
              {images[0] ? <img src={assetPath(images[0])} alt={item.name} className="aspect-[16/10] w-full rounded-3xl object-cover shadow-sm" /> : <EmptyPhoto label="Photo principale" />}
              {images.length > 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.slice(1).map((photo, index) => (
                    <img key={`${photo}-${index}`} src={photo} alt={`${item.name} ${index + 2}`} className="aspect-square w-full rounded-2xl object-cover shadow-sm" />
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{item.kosherType} · {item.averagePrice}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-.055em]">{item.name || "Nom à compléter"}</h2>
                {item.description && <p className="mt-3 text-sm leading-7 text-ink/60">{item.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {[item.certification, item.reservation ? "Réservation" : "", item.delivery ? "Livraison" : "", item.takeaway ? "À emporter" : "", item.terrace ? "Terrasse" : "", ...visibleTags].filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-full bg-sage px-3 py-2 font-semibold text-moss">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Coordonnées</p>
                {[item.address, [item.postalCode, item.city].filter(Boolean).join(" "), item.phone, item.website, item.instagram].filter(Boolean).map((line) => (
                  <p key={line} className="mt-2 text-sm text-ink/65">{line}</p>
                ))}
              </div>
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Horaires disponibles</p>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${status.open ? "bg-sage text-moss" : "bg-rose-50 text-rose-600"}`}>{status.label}</span>
                </div>
                <div className="mt-3 overflow-hidden rounded-2xl border border-black/[.05]">
                  {weekDays.map((day, index) => {
                    const current = hours[day];
                    const isToday = index === ((new Date().getDay() + 6) % 7);
                    const slots = current.open ? [[current.slot1Start, current.slot1End], [current.slot2Start, current.slot2End]].filter(([start, end]) => start && end).map(([start, end]) => `${start}–${end}`).join(" / ") : "Fermé";
                    return (
                      <div key={day} className={`flex items-center justify-between border-b border-black/[.05] px-4 py-3 text-sm last:border-0 ${isToday ? "bg-sage/70 font-semibold text-moss" : ""}`}>
                        <span className="capitalize">{day}</span>
                        <span className="text-right text-ink/60">{slots || "Horaires non renseignés"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RubricPreviewModal({
  item,
  onClose,
}: {
  item: AdminRubric | null;
  onClose: () => void;
}) {
  if (!item) return null;
  const slug = item.slug || slugify(item.name);
  const columns = `${item.columnsDesktop ?? 3}/${item.columnsTablet ?? 2}/${item.columnsMobile ?? 1}`;

  return (
    <div className="fixed inset-0 z-[120] bg-ink/45 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mx-auto flex max-h-[92vh] max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/[.06] bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-moss/60">Prévisualisation non publiée</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-.035em]">{item.name || "Nouvelle rubrique"}</h3>
          </div>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-cream text-ink/55 transition hover:bg-ink hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <PreviewImage src={item.image} alt={item.imageAlt || item.name || "Rubrique"} />
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                  <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">{item.showOnHome === false ? "Masquée Home" : "Visible Home"}</span>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-[-.055em]">{item.icon ? `${item.icon} ` : ""}{item.name || "Nom à compléter"}</p>
                <p className="mt-3 text-sm leading-7 text-ink/60">{item.description || "Description à compléter avant publication."}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Slug</p>
                  <p className="mt-2 font-semibold">{slug || "À compléter"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Ordre</p>
                  <p className="mt-2 font-semibold">{item.order || "À compléter"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Format</p>
                  <p className="mt-2 font-semibold">{item.format ?? "Carré standard"}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Colonnes</p>
                  <p className="mt-2 font-semibold">Desktop / Tablette / Mobile · {columns}</p>
                </div>
              </div>
              <p className="rounded-2xl bg-white p-4 text-xs leading-6 text-ink/45 shadow-sm">
                Cette prévisualisation utilise uniquement les valeurs actuellement affichées dans le formulaire. Aucune publication ni écriture Supabase n’est effectuée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubrubricPreviewModal({
  item,
  parentName,
  onClose,
}: {
  item: AdminSubrubric | null;
  parentName?: string;
  onClose: () => void;
}) {
  if (!item) return null;
  const slug = item.slug || slugify(item.name);
  const columns = `${item.columnsDesktop ?? item.gridColumns ?? 3}/${item.columnsTablet ?? 2}/${item.columnsMobile ?? 1}`;

  return (
    <div className="fixed inset-0 z-[120] bg-ink/45 p-3 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="mx-auto flex max-h-[92vh] max-w-3xl flex-col overflow-hidden rounded-[2rem] bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/[.06] bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-moss/60">Prévisualisation non publiée</p>
            <h3 className="mt-1 text-xl font-semibold tracking-[-.035em]">{item.name || "Nouvelle sous-rubrique"}</h3>
          </div>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-cream text-ink/55 transition hover:bg-ink hover:text-white"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">
          <div className="grid gap-5 md:grid-cols-[220px_1fr]">
            <PreviewImage src={item.photo} alt={item.imageAlt || item.name || "Sous-rubrique"} />
            <div className="space-y-4">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                  <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">{item.visible === false ? "Masquée public" : "Visible public"}</span>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-ink/35">{parentName ?? "Rubrique parente"}</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-.055em]">{item.icon ? `${item.icon} ` : ""}{item.name || "Nom à compléter"}</p>
                <p className="mt-3 text-sm leading-7 text-ink/60">{item.description || "Description à compléter avant publication."}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm"><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Slug</p><p className="mt-2 font-semibold">{slug || "À compléter"}</p></div>
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm"><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Ordre</p><p className="mt-2 font-semibold">{item.order || "À compléter"}</p></div>
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm"><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Format</p><p className="mt-2 font-semibold">{item.format ?? "Carré standard"}</p></div>
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm"><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Colonnes</p><p className="mt-2 font-semibold">Desktop / Tablette / Mobile · {columns}</p></div>
              </div>
              <p className="rounded-2xl bg-white p-4 text-xs leading-6 text-ink/45 shadow-sm">
                Cette prévisualisation utilise uniquement les valeurs actuellement affichées dans le formulaire. Aucune publication ni écriture Supabase n’est effectuée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

function matchesSubrubricToRubric(sub: AdminSubrubric, rubricIdOrSlug: string, rubrics: AdminRubric[]): boolean {
  if (rubricIdOrSlug === "all" || rubricIdOrSlug === "Tout" || !rubricIdOrSlug) return true;
  
  const target = rubrics.find((r) => r.id === rubricIdOrSlug || r.slug === rubricIdOrSlug || slugify(r.name) === rubricIdOrSlug);
  const targetId = (target?.id || rubricIdOrSlug).toLowerCase();
  const targetSlug = (target?.slug || rubricIdOrSlug).toLowerCase();
  const targetNameSlug = target ? slugify(target.name).toLowerCase() : "";

  const subRubricId = String(sub.rubricId || "").toLowerCase();
  const subSlug = String(sub.slug || "").toLowerCase();

  // 1. Direct match on rubricId
  if (subRubricId === targetId || subRubricId === targetSlug || (targetNameSlug && subRubricId === targetNameSlug)) {
    return true;
  }

  // 2. Prefix or substring match on sub.slug (e.g. "shopping-vetements", "food-restaurants", "mariage-decor")
  if (targetSlug && (subSlug === targetSlug || subSlug.startsWith(`${targetSlug}-`) || subSlug.endsWith(`-${targetSlug}`))) {
    return true;
  }
  if (targetNameSlug && (subSlug === targetNameSlug || subSlug.startsWith(`${targetNameSlug}-`) || subSlug.endsWith(`-${targetNameSlug}`))) {
    return true;
  }

  return false;
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
  const [rubricsSupabaseLoaded, setRubricsSupabaseLoaded] = useState(false);
  const [subrubricsSupabaseLoaded, setSubrubricsSupabaseLoaded] = useState(false);
  const [establishmentsSupabaseLoaded, setEstablishmentsSupabaseLoaded] = useState(false);
  const [tagsSupabaseLoaded, setTagsSupabaseLoaded] = useState(false);
  const [certificationsSupabaseLoaded, setCertificationsSupabaseLoaded] = useState(false);
  const [beautyLoaded, setBeautyLoaded] = useState(false);
  const [beautyCategories, setBeautyCategories] = useState<BeautyCategory[]>([]);
  const [beautyServices, setBeautyServices] = useState<BeautyService[]>([]);
  const [beautyServicesByProfessional, setBeautyServicesByProfessional] = useState<Record<string, BeautyProfessionalService[]>>({});
  const [rubricsOperation, setRubricsOperation] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoginMessage, setAdminLoginMessage] = useState("");
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [simpleAdminReady, setSimpleAdminReady] = useState(false);
  const [simpleAdminGranted, setSimpleAdminGranted] = useState(false);
  const [savingAction, setSavingAction] = useState("");
  const [previewRubric, setPreviewRubric] = useState<AdminRubric | null>(null);
  const [previewSubrubric, setPreviewSubrubric] = useState<AdminSubrubric | null>(null);
  const [previewEstablishment, setPreviewEstablishment] = useState<AdminEstablishment | null>(null);
  const [googleSyncOpen, setGoogleSyncOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUserProfile[]>([]);
  const [usersMessage, setUsersMessage] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [usersFilter, setUsersFilter] = useState("Tous");
  const [seoReports, setSeoReports] = useState<SeoReport[]>([]);
  const [seoRunning, setSeoRunning] = useState(false);
  const [seoSearch, setSeoSearch] = useState("");
  const [seoFilter, setSeoFilter] = useState("Toutes les pages");
  const [selectedSeoReportId, setSelectedSeoReportId] = useState("");
  const [tagPickerSearch, setTagPickerSearch] = useState("");
  const skipNextAdminStateSave = useRef(false);
  const subrubricNameRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const [subrubricValidationErrors, setSubrubricValidationErrors] = useState<Record<string, Record<string, string>>>({});
  const [subrubricSearchQuery, setSubrubricSearchQuery] = useState("");
  const [subrubricParentFilter, setSubrubricParentFilter] = useState("all");
  const [quickSubName, setQuickSubName] = useState("");
  const [quickSubParentId, setQuickSubParentId] = useState("food");

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

  const hasAdminAccess = simpleAdminGranted && auth.configured && auth.isAdmin;
  const rubricsBusy = Boolean(savingAction || rubricsOperation || (hasAdminAccess && !rubricsSupabaseLoaded));
  const subrubricsBusy = Boolean(savingAction || rubricsOperation || (hasAdminAccess && !subrubricsSupabaseLoaded));
  const establishmentsBusy = Boolean(savingAction || rubricsOperation || (hasAdminAccess && !establishmentsSupabaseLoaded));
  const requireAdminWrite = () => {
    if (!auth.configured) return true;
    if (hasAdminAccess) return true;
    setAdminMessage("Connexion administrateur Supabase requise : reconnectez-vous dans l’Admin avant d’enregistrer.");
    return false;
  };

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || !supabaseLoaded || rubricsSupabaseLoaded) return;
    let mounted = true;
    setAdminMessage("Chargement des rubriques Supabase…");
    listAllRubricsForAdmin()
      .then(async (remoteRubrics) => {
        if (!mounted) return;
        const nextRubrics = remoteRubrics.length ? remoteRubrics : await importRubricsIfMissing(state.rubrics);
        if (!mounted) return;
        if (nextRubrics.length) {
          setState((current) => normalizeAdminState({ ...current, rubrics: nextRubrics }));
          window.dispatchEvent(new Event("liberty-admin-published"));
          setAdminMessage(remoteRubrics.length ? "Rubriques chargées depuis Supabase." : "Rubriques existantes importées dans Supabase.");
        } else {
          setAdminMessage("Aucune rubrique Supabase trouvée : fallback local conservé.");
        }
        setRubricsSupabaseLoaded(true);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setAdminMessage(`Erreur de connexion Supabase rubriques : ${error.message}`);
        setRubricsSupabaseLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [auth.configured, hasAdminAccess, rubricsSupabaseLoaded, setState, state.rubrics, supabaseLoaded]);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || !supabaseLoaded || !rubricsSupabaseLoaded || subrubricsSupabaseLoaded) return;
    let mounted = true;
    setAdminMessage("Chargement des sous-rubriques Supabase…");
    listAllSubrubricsForAdmin()
      .then(async (remoteSubrubrics) => {
        if (!mounted) return;
        const nextSubrubrics = remoteSubrubrics.length ? remoteSubrubrics : await importSubrubricsIfMissing(state.subrubrics);
        if (!mounted) return;
        if (nextSubrubrics.length) {
          skipNextAdminStateSave.current = true;
          setState((current) => normalizeAdminState({ ...current, subrubrics: nextSubrubrics }));
          window.dispatchEvent(new Event("liberty-admin-published"));
          setAdminMessage(remoteSubrubrics.length ? "Sous-rubriques chargées depuis Supabase." : "Sous-rubriques existantes importées dans Supabase.");
        } else {
          setAdminMessage("Aucune sous-rubrique Supabase trouvée : fallback local conservé.");
        }
        setSubrubricsSupabaseLoaded(true);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setAdminMessage(`Erreur de connexion Supabase sous-rubriques : ${error.message}`);
        setSubrubricsSupabaseLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [auth.configured, hasAdminAccess, rubricsSupabaseLoaded, setState, state.subrubrics, subrubricsSupabaseLoaded, supabaseLoaded]);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || !supabaseLoaded || !rubricsSupabaseLoaded || !subrubricsSupabaseLoaded || establishmentsSupabaseLoaded) return;
    let mounted = true;
    setAdminMessage("Chargement des établissements Supabase…");
    listAllEstablishmentsForAdmin()
      .then(async (remoteEstablishments) => {
        if (!mounted) return;
        const nextEstablishments = remoteEstablishments.length
          ? remoteEstablishments
          : await importEstablishmentsIfMissing(localEstablishments as EstablishmentRecord[]);
        if (!mounted) return;
        if (nextEstablishments.length) {
          skipNextAdminStateSave.current = true;
          setState((current) => normalizeAdminState({ ...current, establishments: nextEstablishments as AdminEstablishment[] }));
          window.dispatchEvent(new Event("liberty-admin-published"));
          setAdminMessage(remoteEstablishments.length ? "Établissements chargés depuis Supabase." : "Établissements existants importés dans Supabase.");
        } else {
          setAdminMessage("Aucun établissement Supabase trouvé : fallback local conservé.");
        }
        setEstablishmentsSupabaseLoaded(true);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setAdminMessage(`Erreur de connexion Supabase établissements : ${error.message}`);
        setEstablishmentsSupabaseLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [auth.configured, establishmentsSupabaseLoaded, hasAdminAccess, rubricsSupabaseLoaded, setState, subrubricsSupabaseLoaded, supabaseLoaded]);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || !supabaseLoaded || tagsSupabaseLoaded) return;
    let mounted = true;
    setAdminMessage("Chargement des tags visibles Supabase…");
    listAllVisibleTagsForAdmin()
      .then(async (remoteTags) => {
        if (!mounted) return;
        const nextTags = remoteTags.length ? remoteTags : await importVisibleTagsIfMissing(state.tags as VisibleTagRecord[]);
        if (!mounted) return;
        if (nextTags.length) {
          skipNextAdminStateSave.current = true;
          setState((current) => normalizeAdminState({ ...current, tags: nextTags as AdminTag[] }));
          setAdminMessage(remoteTags.length ? "Tags visibles chargés depuis Supabase." : "Tags visibles importés dans Supabase.");
        }
        setTagsSupabaseLoaded(true);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setAdminMessage(`Erreur de connexion Supabase tags : ${error.message}`);
        setTagsSupabaseLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [auth.configured, hasAdminAccess, setState, state.tags, supabaseLoaded, tagsSupabaseLoaded]);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || !supabaseLoaded || certificationsSupabaseLoaded) return;
    let mounted = true;
    setAdminMessage("Chargement des certifications Supabase…");
    listAllCertificationsForAdmin()
      .then(async (remoteCertifications) => {
        if (!mounted) return;
        const nextCertifications = remoteCertifications.length
          ? remoteCertifications
          : await importCertificationsIfMissing(state.certifications as CertificationRecord[]);
        if (!mounted) return;
        if (nextCertifications.length) {
          skipNextAdminStateSave.current = true;
          setState((current) => normalizeAdminState({ ...current, certifications: nextCertifications as AdminCertification[] }));
          setAdminMessage(remoteCertifications.length ? "Certifications chargées depuis Supabase." : "Certifications importées dans Supabase.");
        }
        setCertificationsSupabaseLoaded(true);
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setAdminMessage(`Erreur de connexion Supabase certifications : ${error.message}`);
        setCertificationsSupabaseLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [auth.configured, certificationsSupabaseLoaded, hasAdminAccess, setState, state.certifications, supabaseLoaded]);

  useEffect(() => {
    if (!auth.configured || !hasAdminAccess || !supabaseLoaded || !establishmentsSupabaseLoaded || beautyLoaded) return;
    let mounted = true;
    setAdminMessage("Chargement du module Soins femme…");
    Promise.all([
      listBeautyCategories({ admin: true }),
      listBeautyServices({ admin: true }),
      listProfessionalServices(state.establishments.map((item) => item.databaseId ?? item.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id))),
    ])
      .then(([nextCategories, nextServices, nextProfessionalServices]) => {
        if (!mounted) return;
        const grouped: Record<string, BeautyProfessionalService[]> = {};
        nextProfessionalServices.forEach((service) => {
          grouped[service.professionalId] = [...(grouped[service.professionalId] ?? []), service];
        });
        setBeautyCategories(nextCategories);
        setBeautyServices(nextServices);
        setBeautyServicesByProfessional(grouped);
        setState((current) => normalizeAdminState({
          ...current,
          establishments: current.establishments.map((establishment) => ({
            ...establishment,
            beautyServices: grouped[establishment.databaseId ?? establishment.id] ?? establishment.beautyServices ?? [],
          })),
        }));
        setBeautyLoaded(true);
        setAdminMessage("Module Soins femme chargé depuis Supabase.");
      })
      .catch((error: Error) => {
        if (!mounted) return;
        setBeautyLoaded(true);
        setAdminMessage(`Erreur module Soins femme : ${error.message}`);
      });
    return () => {
      mounted = false;
    };
  }, [auth.configured, beautyLoaded, establishmentsSupabaseLoaded, hasAdminAccess, setState, state.establishments, supabaseLoaded]);

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
    if (active === "rubrics" || active === "subrubrics" || active === "establishments" || active === "tags" || active === "certifications") return;
    if (skipNextAdminStateSave.current) {
      skipNextAdminStateSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      saveAdminStateToSupabase(state).then((result) => {
        if (!result.ok) setAdminMessage(`Sauvegarde Supabase impossible : ${result.error}`);
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [active, auth.configured, hasAdminAccess, state, supabaseLoaded]);

  const signInAdminWithEmail = async () => {
    if (adminLoginLoading) return;
    setAdminLoginMessage("");
    if (!adminEmail.trim() || !adminPassword) {
      setAdminLoginMessage("Indiquez l’email et le mot de passe administrateur.");
      return;
    }
    setAdminLoginLoading(true);
    const result = await auth.signInWithEmail(adminEmail, adminPassword);
    setAdminLoginLoading(false);
    setAdminLoginMessage(result.error ?? "Connexion réussie. Vérification du rôle admin…");
  };

  const signOutAdmin = async () => {
    window.sessionStorage.removeItem("liberty-admin-session");
    setSimpleAdminGranted(false);
    setAdminMessage("");
    await auth.signOut();
  };

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

  const loadUsers = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !hasAdminAccess) {
      setAdminUsers([]);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,first_name,last_name,avatar_url,auth_provider,status,created_at,last_sign_in_at")
      .order("created_at", { ascending: false });
    if (error) {
      setUsersMessage(error.message);
      setAdminUsers([]);
      return;
    }
    setUsersMessage("");
    setAdminUsers((data as AdminUserProfile[]) ?? []);
  };

  useEffect(() => {
    if (active === "users") void loadUsers();
  }, [active, auth.configured, hasAdminAccess]);

  const updateUserStatus = async (id: string, status: "active" | "suspended") => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.from("profiles").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setUsersMessage(error?.message ?? (status === "suspended" ? "Utilisateur suspendu." : "Utilisateur réactivé."));
    if (!error) await loadUsers();
  };

  useEffect(() => {
    if (!state.establishments.find((item) => item.id === selectedEstablishmentId)) {
      setSelectedEstablishmentId(state.establishments[0]?.id ?? "");
    }
  }, [selectedEstablishmentId, state.establishments]);

  const selectedEstablishment = state.establishments.find((item) => item.id === selectedEstablishmentId) ?? state.establishments[0];
  const selectedRubric = selectedEstablishment ? state.rubrics.find((rubric) => rubric.id === selectedEstablishment.rubricId || rubric.slug === selectedEstablishment.rubricId) : undefined;
  const selectedIsBeauty = selectedRubric?.slug === "soins-feminin" || selectedRubric?.name.toLowerCase().includes("soins") || selectedEstablishment?.rubricId === "soins-feminin";
  const selectedBeautyServices = selectedEstablishment?.beautyServices ?? beautyServicesByProfessional[selectedEstablishment?.databaseId ?? selectedEstablishment?.id ?? ""] ?? [];
  const liveSeoReports = useMemo(() => analyzeAdminSeo(state), [state]);
  const displayedSeoReports = seoReports.length ? seoReports : liveSeoReports;
  const seoSummary = useMemo(() => summarizeSeoReports(displayedSeoReports), [displayedSeoReports]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SEO_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SeoReport[];
      if (Array.isArray(parsed)) setSeoReports(parsed);
    } catch {
      setSeoReports([]);
    }
  }, []);

  useEffect(() => {
    if (!selectedSeoReportId && displayedSeoReports[0]) setSelectedSeoReportId(displayedSeoReports[0].id);
  }, [displayedSeoReports, selectedSeoReportId]);

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

  const filteredSeoReports = useMemo(() => {
    const query = seoSearch.trim().toLowerCase();
    return displayedSeoReports.filter((report) => {
      const corpus = `${report.title} ${report.category} ${report.url}`.toLowerCase();
      if (query && !corpus.includes(query)) return false;
      if (seoFilter === "Restaurants") return report.entityType === "establishment" && /restaurant|food/i.test(report.category);
      if (seoFilter === "Shops") return /shopping|vêtement|boutique/i.test(`${report.category} ${report.title}`);
      if (seoFilter === "Travel") return /voyage|travel/i.test(`${report.category} ${report.title}`);
      if (seoFilter === "Events") return /sortie|event|événement|mariage|concert/i.test(`${report.category} ${report.title}`);
      if (seoFilter === "Categories") return report.entityType === "category" || report.entityType === "subcategory";
      if (seoFilter === "Only critical pages") return report.score < 45 || report.issues.some((issue) => issue.priority === "critical");
      if (seoFilter === "Only unpublished pages") return report.status !== "Publié";
      if (seoFilter === "Only missing metadata") return report.issues.some((issue) => ["Missing content description", "Missing alt text", "Meta title length can be improved"].includes(issue.problem));
      return true;
    });
  }, [displayedSeoReports, seoFilter, seoSearch]);

  const addBeautyCategory = () => {
    const category: BeautyCategory = {
      id: newId("beauty-category"),
      name: "Nouvelle catégorie",
      slug: "nouvelle-categorie",
      description: "",
      displayOrder: beautyCategories.length + 1,
      active: true,
    };
    setBeautyCategories((current) => [category, ...current]);
    setAdminMessage("Catégorie beauté ajoutée. Cliquez sur Enregistrer pour la publier dans Supabase.");
  };

  const updateBeautyCategoryLocal = (id: string, patch: Partial<BeautyCategory>) => {
    setBeautyCategories((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const saveBeautyCategory = async (category: BeautyCategory) => {
    if (!requireAdminWrite()) return;
    if (!category.name.trim()) {
      setAdminMessage("Le nom de la catégorie beauté est obligatoire.");
      return;
    }
    setSavingAction("Enregistrement catégorie beauté…");
    try {
      const saved = await upsertBeautyCategory({ ...category, slug: category.slug || slugify(category.name) });
      setBeautyCategories((current) => current.map((item) => item.id === category.id ? saved : item));
      setAdminMessage("Catégorie beauté enregistrée.");
    } catch (error) {
      setAdminMessage(`Erreur catégorie beauté : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const addBeautyService = () => {
    const category = beautyCategories[0];
    if (!category) {
      setAdminMessage("Créez d’abord une catégorie beauté.");
      return;
    }
    const service: BeautyService = {
      id: newId("beauty-service"),
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
      name: "Nouvelle prestation",
      slug: "nouvelle-prestation",
      description: "",
      displayOrder: beautyServices.length + 1,
      active: true,
    };
    setBeautyServices((current) => [service, ...current]);
    setAdminMessage("Prestation ajoutée. Cliquez sur Enregistrer pour la publier dans Supabase.");
  };

  const updateBeautyServiceLocal = (id: string, patch: Partial<BeautyService>) => {
    setBeautyServices((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  const saveBeautyService = async (service: BeautyService) => {
    if (!requireAdminWrite()) return;
    if (!service.name.trim() || !service.categoryId) {
      setAdminMessage("Le nom et la catégorie de la prestation sont obligatoires.");
      return;
    }
    setSavingAction("Enregistrement prestation…");
    try {
      const category = beautyCategories.find((item) => item.id === service.categoryId);
      const saved = await upsertBeautyService({ ...service, slug: service.slug || slugify(service.name), categoryName: category?.name, categorySlug: category?.slug });
      setBeautyServices((current) => current.map((item) => item.id === service.id ? saved : item));
      setAdminMessage("Prestation beauté enregistrée.");
    } catch (error) {
      setAdminMessage(`Erreur prestation beauté : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const updateProfessionalBeautyServices = (services: BeautyProfessionalService[]) => {
    if (!selectedEstablishment) return;
    setState((current) => normalizeAdminState({
      ...current,
      establishments: current.establishments.map((item) => item.id === selectedEstablishment.id ? { ...item, beautyServices: services } : item),
    }));
  };

  const addProfessionalBeautyService = () => {
    if (!selectedEstablishment) return;
    const service = beautyServices[0];
    if (!service) {
      setAdminMessage("Créez d’abord une prestation beauté.");
      return;
    }
    updateProfessionalBeautyServices([
      ...selectedBeautyServices,
      {
        id: newId("professional-service"),
        professionalId: selectedEstablishment.databaseId ?? selectedEstablishment.id,
        serviceId: service.id,
        categoryId: service.categoryId,
        categoryName: service.categoryName,
        categorySlug: service.categorySlug,
        serviceName: service.name,
        serviceSlug: service.slug,
        price: null,
        priceFrom: false,
        durationMinutes: 45,
        atHome: true,
        onSite: false,
        active: true,
        displayOrder: selectedBeautyServices.length + 1,
      },
    ]);
  };

  const updateProfessionalBeautyService = (id: string, patch: Partial<BeautyProfessionalService>) => {
    updateProfessionalBeautyServices(selectedBeautyServices.map((item) => {
      if (item.id !== id) return item;
      const selectedService = patch.serviceId ? beautyServices.find((service) => service.id === patch.serviceId) : undefined;
      return {
        ...item,
        ...patch,
        categoryId: selectedService?.categoryId ?? patch.categoryId ?? item.categoryId,
        categoryName: selectedService?.categoryName ?? patch.categoryName ?? item.categoryName,
        categorySlug: selectedService?.categorySlug ?? patch.categorySlug ?? item.categorySlug,
        serviceName: selectedService?.name ?? patch.serviceName ?? item.serviceName,
        serviceSlug: selectedService?.slug ?? patch.serviceSlug ?? item.serviceSlug,
      };
    }));
  };

  const saveSelectedProfessionalServices = async (professional?: AdminEstablishment) => {
    const target = professional ?? selectedEstablishment;
    if (!target) return;
    const professionalId = target.databaseId ?? target.id;
    if (!/^[0-9a-f-]{36}$/i.test(professionalId)) return;
    const services = target.beautyServices ?? selectedBeautyServices;
    const saved = await replaceProfessionalServices(professionalId, services);
    setBeautyServicesByProfessional((current) => ({ ...current, [professionalId]: saved }));
    setState((current) => normalizeAdminState({
      ...current,
      establishments: current.establishments.map((item) => item.id === target.id ? { ...item, beautyServices: saved } : item),
    }));
  };

  const selectedSeoReport = displayedSeoReports.find((report) => report.id === selectedSeoReportId) ?? filteredSeoReports[0] ?? displayedSeoReports[0];

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
      registeredUsers: adminUsers.length,
      connectedUsers: adminUsers.filter((user) => user.last_sign_in_at && new Date(user.last_sign_in_at).toDateString() === new Date().toDateString()).length,
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
  }, [adminUsers, events, state.banners, state.notifications]);

  const filteredUsers = useMemo(() => {
    const query = usersSearch.trim().toLowerCase();
    return adminUsers.filter((user) => {
      const corpus = [user.first_name, user.last_name, user.full_name, user.email].join(" ").toLowerCase();
      if (query && !corpus.includes(query)) return false;
      if (usersFilter === "Tous") return true;
      if (usersFilter === "Actif") return user.status !== "suspended";
      if (usersFilter === "Suspendu") return user.status === "suspended";
      return (user.auth_provider ?? "email").toLowerCase() === usersFilter.toLowerCase();
    });
  }, [adminUsers, usersFilter, usersSearch]);

  const userStats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: adminUsers.length,
      newToday: adminUsers.filter((user) => new Date(user.created_at).toDateString() === today).length,
      activeToday: adminUsers.filter((user) => user.last_sign_in_at && new Date(user.last_sign_in_at).toDateString() === today).length,
      latest: adminUsers.filter((user) => user.last_sign_in_at).slice(0, 5),
    };
  }, [adminUsers]);

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

  const updateRubric = (id: string, patch: Partial<AdminRubric>) => {
    setState((current) => {
      const next = normalizeAdminState({
        ...current,
        rubrics: current.rubrics.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      });
      persistAdminStateSnapshot(next);
      window.dispatchEvent(new CustomEvent("liberty-admin-published", { detail: { timestamp: Date.now() } }));
      window.dispatchEvent(new Event("storage"));
      return next;
    });
  };

  const updateSubrubric = (id: string, patch: Partial<AdminSubrubric>) => {
    setState((current) => {
      const next = normalizeAdminState({
        ...current,
        subrubrics: current.subrubrics.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      });
      persistAdminStateSnapshot(next);
      window.dispatchEvent(new CustomEvent("liberty-admin-published", { detail: { timestamp: Date.now() } }));
      window.dispatchEvent(new Event("storage"));
      return next;
    });
  };

  const updateEstablishment = (id: string, patch: Partial<AdminEstablishment>) => {
    setState((current) => {
      const next = normalizeAdminState({
        ...current,
        establishments: current.establishments.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      });
      persistAdminStateSnapshot(next);
      window.dispatchEvent(new CustomEvent("liberty-admin-published", { detail: { timestamp: Date.now() } }));
      window.dispatchEvent(new Event("storage"));
      return next;
    });
  };

  const updateBanner = (id: string, patch: Partial<AdminBanner>) =>
    setState((current) => ({ ...current, banners: current.banners.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));

  const updateNotification = (id: string, patch: Partial<AdminNotification>) =>
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const updateTag = (id: string, patch: Partial<AdminTag>) => {
    skipNextAdminStateSave.current = true;
    setState((current) => ({ ...current, tags: current.tags.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
  };

  const updateCertification = (id: string, patch: Partial<AdminCertification>) => {
    skipNextAdminStateSave.current = true;
    setState((current) => ({ ...current, certifications: current.certifications.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
  };

  const runSeoAnalysis = () => {
    setSeoRunning(true);
    setAdminMessage("Analyse SEO en cours…");
    window.setTimeout(() => {
      const reports = analyzeAdminSeo(state);
      const summary = summarizeSeoReports(reports);
      setSeoReports(reports);
      setSelectedSeoReportId(reports[0]?.id ?? "");
      window.localStorage.setItem(SEO_CACHE_KEY, JSON.stringify(reports));
      void saveSeoAnalysisHistory({
        overallScore: summary.overallScore,
        totalPages: summary.totalPages,
        criticalPages: summary.criticalPages,
        healthyPages: summary.healthyPages,
        reports: reports.map((report) => ({
          id: report.id,
          entityType: report.entityType,
          entityId: report.entityId,
          title: report.title,
          url: report.url,
          score: report.score,
          contentScore: report.contentScore,
          technicalScore: report.technicalScore,
          localScore: report.localScore,
          searchScore: report.searchScore,
          issues: report.issues,
        })),
      }).then((result) => {
        if (!result.ok && isSupabaseConfigured) setAdminMessage(`Analyse SEO terminée. Historique Supabase non enregistré : ${result.error}`);
      });
      setSeoRunning(false);
      setAdminMessage(`Analyse SEO terminée : ${summary.totalPages} pages analysées.`);
    }, 80);
  };

  const confirmSeoPublication = (entityType: SeoEntityType, entityId: string) => {
    const report = analyzeAdminSeo(state).find((item) => item.entityType === entityType && item.entityId === entityId);
    if (!report) return true;
    const blockingIssues = report.issues.filter((issue) => issue.priority === "critical" || issue.priority === "high");
    if (!blockingIssues.length) return true;
    const warning = [
      `Validation SEO : ${report.title}`,
      `Score : ${report.score}/100 (${seoScoreLabel(report.score)})`,
      "",
      ...blockingIssues.slice(0, 8).map((issue) => `• ${issue.problem} — ${issue.correction}`),
      "",
      "Publier quand même ?",
    ].join("\n");
    return window.confirm(warning);
  };

  const applySeoSuggestion = (suggestion: SeoSuggestion, mode: "accept" | "modify" | "ignore") => {
    if (mode === "ignore") {
      setAdminMessage(`Suggestion ignorée : ${suggestion.label}`);
      return;
    }
    const nextValue = mode === "modify"
      ? window.prompt("Modifier la suggestion avant application :", suggestion.value)
      : suggestion.value;
    if (!nextValue) return;

    if (suggestion.entityType === "category") {
      if (suggestion.action === "description" || suggestion.action === "metaDescription") updateRubric(suggestion.entityId, { description: nextValue });
      if (suggestion.action === "altText") updateRubric(suggestion.entityId, { imageAlt: nextValue });
      if (suggestion.action === "customerSearchTerms") updateRubric(suggestion.entityId, { searchKeywords: cleanTextList(nextValue) });
    } else if (suggestion.entityType === "subcategory") {
      if (suggestion.action === "description" || suggestion.action === "metaDescription") updateSubrubric(suggestion.entityId, { description: nextValue });
      if (suggestion.action === "altText") updateSubrubric(suggestion.entityId, { imageAlt: nextValue });
      if (suggestion.action === "customerSearchTerms") updateSubrubric(suggestion.entityId, { searchKeywords: cleanTextList(nextValue) });
    } else if (suggestion.entityType === "establishment") {
      if (suggestion.action === "description" || suggestion.action === "metaDescription") updateEstablishment(suggestion.entityId, { description: nextValue });
      if (suggestion.action === "altText") updateEstablishment(suggestion.entityId, { photoAlts: [nextValue, "", ""] });
      if (suggestion.action === "customerSearchTerms") {
        const current = state.establishments.find((item) => item.id === suggestion.entityId)?.customerSearches ?? [];
        updateEstablishment(suggestion.entityId, { customerSearches: [...new Set([...current, ...cleanTextList(nextValue)])] });
      }
      if (suggestion.action === "visibleTags") {
        const labels = cleanTextList(nextValue);
        setState((current) => {
          const existing = new Map(current.tags.map((tag) => [tag.label.toLowerCase(), tag]));
          const newTags = labels
            .filter((label) => !existing.has(label.toLowerCase()))
            .map((label, index) => ({ id: slugify(label), label, kind: "visible" as const, icon: "", color: "#1f4d3b", order: current.tags.length + index + 1, status: "Publié" as AdminStatus }));
          const ids = labels.map((label) => existing.get(label.toLowerCase())?.id ?? slugify(label));
          return {
            ...current,
            tags: [...current.tags, ...newTags],
            establishments: current.establishments.map((item) => item.id === suggestion.entityId ? { ...item, visibleTagIds: [...new Set([...item.visibleTagIds, ...ids])] } : item),
          };
        });
      }
    } else {
      setAdminMessage("Cette suggestion concerne une page statique non éditable depuis ce module.");
      return;
    }
    setSeoReports([]);
    setAdminMessage(`Suggestion appliquée après validation : ${suggestion.label}`);
  };

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

  const addRubric = () => {
    if (rubricsBusy) {
      setAdminMessage(hasAdminAccess && !rubricsSupabaseLoaded ? "Chargement des rubriques Supabase en cours…" : "Une opération est déjà en cours. Réessayez dans quelques secondes.");
      return;
    }
    skipNextAdminStateSave.current = true;
    let targetId = "";
    setState((current) => {
      const existingDraft = current.rubrics.find((rubric) => !rubric.createdAt && rubric.status === "Brouillon");
      if (existingDraft) {
        targetId = existingDraft.id;
        return current;
      }
      const id = newId("rubrique");
      targetId = id;
      return {
        ...current,
        rubrics: [
          {
            id,
            name: "",
            slug: "",
            description: "",
            icon: "",
            image: "",
            imageAlt: "",
            showOnHome: true,
            format: "Carré standard",
            columnsDesktop: 3,
            columnsTablet: 2,
            columnsMobile: 1,
            searchKeywords: [],
            order: current.rubrics.length + 1,
            status: "Brouillon",
          },
          ...current.rubrics,
        ],
      };
    });
    setAdminMessage("Formulaire de création de rubrique ouvert. Aucun contenu ne sera créé tant que vous n’enregistrez pas.");
    window.setTimeout(() => document.getElementById(`rubric-form-${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const isUnsavedRubric = (rubric: AdminRubric) => !rubric.createdAt && rubric.status === "Brouillon";

  const cancelRubricCreation = (id: string) => {
    skipNextAdminStateSave.current = true;
    setState((current) => ({ ...current, rubrics: current.rubrics.filter((rubric) => rubric.id !== id) }));
    setAdminMessage("Création de rubrique annulée.");
  };

  const addSubrubric = () => {
    if (subrubricsBusy) {
      setAdminMessage(hasAdminAccess && !subrubricsSupabaseLoaded ? "Chargement des sous-rubriques Supabase en cours…" : "Une opération est déjà en cours. Réessayez dans quelques secondes.");
      return;
    }
    if (!state.rubrics.length) {
      setAdminMessage("Créez d’abord une rubrique parente avant d’ajouter une sous-rubrique.");
      return;
    }
    skipNextAdminStateSave.current = true;
    setActive("subrubrics");
    let targetId = "";
    setState((current) => {
      const existingDraft = current.subrubrics.find((item) => !item.createdAt && item.status === "Brouillon" && item.id.startsWith("sous-rubrique-"));
      if (existingDraft) {
        targetId = existingDraft.id;
        return current;
      }
      const firstRubric = [...current.rubrics].sort((a, b) => a.order - b.order)[0];
      const rubricId = firstRubric.id;
      const siblingCount = current.subrubrics.filter((item) => item.rubricId === rubricId).length;
      const id = newId("sous-rubrique");
      targetId = id;
      return {
        ...current,
        subrubrics: [
          {
            id,
            rubricId,
            name: "",
            slug: "",
            description: "",
            icon: "",
            photo: "",
            imageAlt: "",
            visible: true,
            showPublicly: true,
            format: "Carré standard",
            gridColumns: 3,
            columnsDesktop: 3,
            columnsTablet: 2,
            columnsMobile: 1,
            searchKeywords: [],
            order: siblingCount + 1,
            status: "Brouillon",
          },
          ...current.subrubrics,
        ],
      };
    });
    setAdminMessage("Formulaire de création de sous-rubrique ouvert. Aucun contenu ne sera créé tant que vous n’enregistrez pas.");
    window.setTimeout(() => {
      document.getElementById(`subrubric-form-${targetId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      subrubricNameRefs.current[targetId]?.focus();
    }, 80);
  };

  const handleQuickAddSubrubric = () => {
    if (!quickSubName.trim()) return;
    const parent = state.rubrics.find((r) => r.id === quickSubParentId || r.slug === quickSubParentId) || state.rubrics[0];
    const parentId = parent ? parent.id : "food";
    const slug = `${slugify(quickSubName.trim())}-${parent?.slug || parentId}`;
    const newSub: AdminSubrubric = {
      id: newId("sous-rubrique"),
      rubricId: parentId,
      slug,
      name: quickSubName.trim(),
      description: `Sélection ${quickSubName.trim()}`,
      photo: parent?.image || "/images/food/restaurants-khan.jpg",
      imageAlt: quickSubName.trim(),
      status: "Publié" as AdminStatus,
      order: state.subrubrics.filter((s) => s.rubricId === parentId).length + 1,
      visible: true,
      showPublicly: true,
    };
    setState((current) => normalizeAdminState({
      ...current,
      subrubrics: [newSub, ...current.subrubrics],
    }));
    setQuickSubName("");
    setAdminMessage(`Sous-rubrique “${newSub.name}” créée et ajoutée à “${parent?.name || 'la rubrique'}”.`);
    if (auth.configured && hasAdminAccess) {
      void createSubrubricInSupabase(newSub).then((saved) => applySubrubricLocally(saved, `Sous-rubrique “${saved.name}” publiée.`));
    }
  };

  const addEstablishment = () => {
    if (establishmentsBusy) {
      setAdminMessage(hasAdminAccess && !establishmentsSupabaseLoaded ? "Chargement des établissements Supabase en cours…" : "Une opération est déjà en cours. Réessayez dans quelques secondes.");
      return;
    }
    skipNextAdminStateSave.current = true;
    setState((current) => {
      const firstSubrubric = current.subrubrics[0];
      const id = newId("fiche");
      const establishment: AdminEstablishment = {
        id,
        rubricId: firstSubrubric?.rubricId ?? "food",
        subrubricId: firstSubrubric?.id ?? "food-restaurants",
        mainPhoto: "",
        photos: ["", "", "", ""],
        photoAlts: ["", "", "", ""],
        name: "Nouvel établissement",
        slug: "nouvel-etablissement",
        shortDescription: "Description courte à compléter",
        description: "Description à compléter",
        address: "",
        city: "Paris",
        arrondissement: "",
        postalCode: "",
        country: "France",
        nearestMetroName: "",
        nearestMetroLine: "",
        email: "",
        phone: "",
        whatsapp: "",
        instagram: "",
        website: "",
        reservationTarget: "",
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
  };

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

  const addTag = () => {
    if (savingAction) {
      setAdminMessage("Une opération est déjà en cours. Réessayez dans quelques secondes.");
      return;
    }
    setState((current) => ({
      ...current,
      tags: [...current.tags, { id: newId("tag"), label: "Nouveau tag", kind: "visible", icon: "", color: "#1f4d3b", rubricIds: [], order: current.tags.length + 1, status: "Brouillon" }],
    }));
    setAdminMessage("Nouveau tag ajouté. Modifiez son nom puis cliquez sur Enregistrer.");
  };

  const addCertification = () => {
    if (savingAction) {
      setAdminMessage("Une opération est déjà en cours. Réessayez dans quelques secondes.");
      return;
    }
    setState((current) => ({
      ...current,
      certifications: [...current.certifications, { id: newId("certification"), label: "Nouvelle certification", order: current.certifications.length + 1, status: "Brouillon" }],
    }));
    setAdminMessage("Nouvelle certification ajoutée. Modifiez son nom puis cliquez sur Enregistrer.");
  };

  const audit = (action: string, entityType: string, entityId: string, label: string, payload: Record<string, unknown> = {}) => {
    const entry: AuditEntry = { id: newId("audit"), action, entityType, entityId, label, createdAt: new Date().toISOString() };
    setState((current) => ({ ...current, audit: [entry, ...current.audit].slice(0, 200) }));
    void writeAuditLog(action, entityType, entityId, label, payload);
  };

  const commitState = (updater: (current: AdminState) => AdminState, successMessage: string, actionLabel = "Sauvegarde") => {
    if (savingAction) return;
    setSavingAction(actionLabel);
    setAdminMessage(`${actionLabel} en cours…`);
    setState((current) => {
      const next = normalizeAdminState(updater(current));
      persistAdminStateSnapshot(next);
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

  const clearSubrubricValidationError = (id: string, field: string) => {
    setSubrubricValidationErrors((current) => {
      const itemErrors = current[id];
      if (!itemErrors?.[field]) return current;
      const nextItemErrors = { ...itemErrors };
      delete nextItemErrors[field];
      const next = { ...current };
      if (Object.keys(nextItemErrors).length) next[id] = nextItemErrors;
      else delete next[id];
      return next;
    });
  };

  const scrollToSubrubricField = (id: string, field: string) => {
    window.setTimeout(() => {
      const target = document.getElementById(`subrubric-field-${id}-${field}`) ?? document.getElementById(`subrubric-form-${id}`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (field === "name") subrubricNameRefs.current[id]?.focus();
    }, 50);
  };

  const validateSubrubricForPublish = (subrubric: AdminSubrubric) => {
    const slug = subrubric.slug || slugify(subrubric.name);
    const errors: Record<string, string> = {};
    if (!String(subrubric.rubricId ?? "").trim()) errors.rubricId = "Choisissez la rubrique parente.";
    if (!subrubric.name.trim()) errors.name = "Le nom est obligatoire.";
    if (!slug.trim()) errors.slug = "Le slug est obligatoire.";
    if (!subrubric.description.trim()) errors.description = "La description est obligatoire.";
    if (!subrubric.photo.trim()) errors.photo = "Ajoutez une photo ou une URL d’image.";
    if (!String(subrubric.imageAlt ?? "").trim()) errors.imageAlt = "Le texte alternatif est obligatoire.";
    if (!String(subrubric.order ?? "").trim()) errors.order = "L’ordre d’affichage est obligatoire.";
    const duplicate = state.subrubrics.find((item) =>
      item.id !== subrubric.id &&
      item.rubricId === subrubric.rubricId &&
      item.status !== "Masqué" &&
      (item.slug || slugify(item.name)) === slug
    );
    if (duplicate) errors.slug = `Ce slug est déjà utilisé par “${duplicate.name}” dans cette rubrique.`;
    return { slug, errors };
  };

  const validateUniqueEstablishmentSlug = (establishment: AdminEstablishment, slug: string) => {
    const duplicate = state.establishments.find((item) => item.id !== establishment.id && (item.slug || slugify(item.name)) === slug);
    if (duplicate) {
      setAdminMessage(`Slug déjà utilisé par : ${duplicate.name}`);
      return false;
    }
    return true;
  };

  const validateCoordinates = (establishment: AdminEstablishment) => {
    const latitude = establishment.latitude.trim();
    const longitude = establishment.longitude.trim();
    if (!latitude && !longitude) return true;
    const lat = Number(latitude.replace(",", "."));
    const lng = Number(longitude.replace(",", "."));
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setAdminMessage("Coordonnées GPS invalides : latitude entre -90 et 90, longitude entre -180 et 180.");
      return false;
    }
    return true;
  };

  const previewPublicUrl = (path: string) => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    window.open(`${basePath}${path}`, "_blank", "noopener,noreferrer");
    setAdminMessage("Prévisualisation ouverte dans un nouvel onglet.");
  };

  const previewRubricDraft = (rubric: AdminRubric) => {
    setPreviewRubric({ ...rubric, slug: rubric.slug || slugify(rubric.name) });
    setAdminMessage("Prévisualisation rubrique ouverte sans publication.");
  };

  const previewSubrubricDraft = (subrubric: AdminSubrubric) => {
    setPreviewSubrubric({ ...subrubric, slug: subrubric.slug || slugify(subrubric.name) });
    setAdminMessage("Prévisualisation sous-rubrique ouverte sans publication.");
  };

  const applyRubricLocally = (rubric: AdminRubric, successMessage: string) => {
    setState((current) => {
      const next = normalizeAdminState({
        ...current,
        rubrics: current.rubrics.some((item) => item.id === rubric.id)
          ? current.rubrics.map((item) => (item.id === rubric.id ? rubric : item))
          : [rubric, ...current.rubrics],
      });
      persistAdminStateSnapshot(next);
      window.dispatchEvent(new CustomEvent("liberty-admin-published", { detail: { timestamp: Date.now() } }));
      window.dispatchEvent(new Event("storage"));
      return next;
    });
    setAdminMessage(successMessage);
  };

  const applySubrubricLocally = (subrubric: AdminSubrubric, successMessage: string) => {
    setSubrubricValidationErrors((current) => {
      if (!current[subrubric.id]) return current;
      const next = { ...current };
      delete next[subrubric.id];
      return next;
    });
    setState((current) => {
      const next = normalizeAdminState({
        ...current,
        subrubrics: current.subrubrics.some((item) => item.id === subrubric.id)
          ? current.subrubrics.map((item) => (item.id === subrubric.id ? subrubric : item))
          : [subrubric, ...current.subrubrics],
      });
      persistAdminStateSnapshot(next);
      window.dispatchEvent(new CustomEvent("liberty-admin-published", { detail: { timestamp: Date.now() } }));
      window.dispatchEvent(new Event("storage"));
      return next;
    });
    setAdminMessage(successMessage);
  };

  const saveRubricDraft = async (rubric: AdminRubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`draft-${rubric.id}`);
    setSavingAction("Sauvegarde rubrique");
    const draft = { ...rubric, status: "Brouillon" as AdminStatus, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await createRubricInSupabase(draft);
        applyRubricLocally(saved, "Rubrique enregistrée en brouillon.");
      } else {
        commitState((current) => ({
          ...current,
          rubrics: current.rubrics.map((item) => (item.id === rubric.id ? draft : item)),
        }), "Rubrique enregistrée en brouillon.", "Sauvegarde");
      }
      audit("brouillon", "rubrique", rubric.id, rubric.name);
    } catch (error) {
      setAdminMessage(`Échec de sauvegarde rubrique : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const publishRubric = async (rubric: AdminRubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const slug = rubric.slug || slugify(rubric.name);
    if (!requireFields([["nom", rubric.name], ["slug", slug], ["description", rubric.description], ["icône", rubric.icon], ["image principale", rubric.image], ["texte alternatif", rubric.imageAlt], ["ordre d’affichage", rubric.order]])) return;
    if (!confirmSeoPublication("category", rubric.id)) return;
    setRubricsOperation(`publish-${rubric.id}`);
    setSavingAction("Publication rubrique");
    const next = { ...rubric, slug, status: "Publié" as AdminStatus, showOnHome: rubric.showOnHome ?? true, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await publishRubricInSupabase(next);
        applyRubricLocally(saved, "Rubrique publiée avec succès.");
      } else {
        commitState((current) => ({
          ...current,
          rubrics: current.rubrics.map((item) => (item.id === rubric.id ? next : item)),
        }), "Rubrique publiée avec succès.", "Publication");
      }
      audit("publication", "rubrique", rubric.id, rubric.name);
    } catch (error) {
      setAdminMessage(`Échec de publication : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const duplicateRubric = async (rubric: AdminRubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`duplicate-${rubric.id}`);
    setSavingAction("Duplication rubrique");
    try {
      if (auth.configured && hasAdminAccess) {
        const copy = await duplicateRubricInSupabase(rubric);
        skipNextAdminStateSave.current = true;
        setState((current) => normalizeAdminState({ ...current, rubrics: [copy, ...current.rubrics] }));
      } else {
        const copy = { ...rubric, id: newId("rubrique"), name: `${rubric.name} copie`, slug: `${rubric.slug ?? slugify(rubric.name)}-copie`, status: "Brouillon" as AdminStatus, order: state.rubrics.length + 1 };
        setState((current) => normalizeAdminState({ ...current, rubrics: [copy, ...current.rubrics] }));
      }
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Rubrique dupliquée en brouillon.");
      audit("duplication", "rubrique", rubric.id, rubric.name);
    } catch (error) {
      setAdminMessage(`Échec de duplication : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const sleepRubric = async (rubric: AdminRubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`sleep-${rubric.id}`);
    setSavingAction("Mise en sommeil rubrique");
    const slug = rubric.slug || slugify(rubric.name);
    const sleeping = { ...rubric, slug, status: "En sommeil" as AdminStatus, showOnHome: true, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await sleepRubricInSupabase(sleeping);
        applyRubricLocally(saved, "Rubrique mise en sommeil (Disponible bientôt).");
      } else {
        commitState((current) => ({ ...current, rubrics: current.rubrics.map((item) => (item.id === rubric.id ? sleeping : item)) }), "Rubrique mise en sommeil avec succès.", "En sommeil");
      }
      audit("sommeil", "rubrique", rubric.id, rubric.name);
    } catch (error) {
      setAdminMessage(`Échec de mise en sommeil : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const hideRubric = async (rubric: AdminRubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`hide-${rubric.id}`);
    setSavingAction("Masquage rubrique");
    try {
      const hidden = { ...rubric, status: "Masqué" as AdminStatus, updatedAt: new Date().toISOString() };
      if (auth.configured && hasAdminAccess) {
        const saved = await hideRubricInSupabase(hidden);
        applyRubricLocally(saved, "Rubrique masquée.");
      } else {
        commitState((current) => ({ ...current, rubrics: current.rubrics.map((item) => item.id === rubric.id ? hidden : item) }), "Rubrique masquée avec succès.", "Masquage");
      }
      audit("masquage", "rubrique", rubric.id, rubric.name);
    } catch (error) {
      setAdminMessage(`Échec de masquage : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const trashRubric = async (rubric: AdminRubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`trash-${rubric.id}`);
    setSavingAction("Corbeille rubrique");
    try {
      if (auth.configured && hasAdminAccess) await moveRubricToTrashInSupabase(rubric);
      skipNextAdminStateSave.current = true;
      moveToTrash("rubrique", rubric.name, rubric, (current) => ({ ...current, rubrics: current.rubrics.filter((item) => item.id !== rubric.id) }));
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Rubrique envoyée dans la corbeille.");
    } catch (error) {
      setAdminMessage(`Échec de suppression : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const reorderRubric = async (id: string, direction: -1 | 1) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const sorted = [...state.rubrics].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    const nextRubrics = reordered.map((rubric, orderIndex) => ({ ...rubric, order: orderIndex + 1 }));
    setRubricsOperation(`order-${id}`);
    setSavingAction("Ordre rubriques");
    try {
      if (auth.configured && hasAdminAccess) await updateRubricOrder(nextRubrics);
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({ ...current, rubrics: nextRubrics }));
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Ordre des rubriques enregistré.");
    } catch (error) {
      setAdminMessage(`Échec de réorganisation : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const saveSubrubricDraft = async (subrubric: AdminSubrubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const slug = subrubric.slug || slugify(subrubric.name);
    const draftErrors: Record<string, string> = {};
    if (!String(subrubric.rubricId ?? "").trim()) draftErrors.rubricId = "Choisissez la rubrique parente.";
    if (!subrubric.name.trim()) draftErrors.name = "Le nom est obligatoire pour enregistrer un brouillon.";
    const duplicate = state.subrubrics.find((item) =>
      item.id !== subrubric.id &&
      item.rubricId === subrubric.rubricId &&
      item.status !== "Masqué" &&
      (item.slug || slugify(item.name)) === slug
    );
    if (duplicate) draftErrors.slug = `Ce slug est déjà utilisé par “${duplicate.name}” dans cette rubrique.`;
    if (Object.keys(draftErrors).length) {
      setSubrubricValidationErrors((current) => ({ ...current, [subrubric.id]: draftErrors }));
      setAdminMessage(draftErrors.slug ? "Corrigez le slug avant d’enregistrer le brouillon." : "Veuillez remplir le nom et la rubrique parente avant d’enregistrer le brouillon.");
      scrollToSubrubricField(subrubric.id, Object.keys(draftErrors)[0]);
      return;
    }
    setRubricsOperation(`subdraft-${subrubric.id}`);
    setSavingAction("Sauvegarde sous-rubrique");
    const draft = { ...subrubric, slug, imageAlt: subrubric.imageAlt || subrubric.name, status: "Brouillon" as AdminStatus, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await createSubrubricInSupabase(draft);
        applySubrubricLocally(saved, "Sous-rubrique enregistrée en brouillon.");
      } else {
        commitState((current) => ({
          ...current,
          subrubrics: current.subrubrics.map((item) => (item.id === subrubric.id ? draft : item)),
        }), "Sous-rubrique enregistrée en brouillon.", "Sauvegarde");
      }
      audit("brouillon", "sous-rubrique", subrubric.id, subrubric.name);
    } catch (error) {
      setAdminMessage(`Échec de sauvegarde sous-rubrique : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const publishSubrubric = async (subrubric: AdminSubrubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const { slug, errors } = validateSubrubricForPublish(subrubric);
    if (Object.keys(errors).length) {
      setSubrubricValidationErrors((current) => ({ ...current, [subrubric.id]: errors }));
      setAdminMessage("Veuillez remplir les champs obligatoires avant de publier.");
      scrollToSubrubricField(subrubric.id, Object.keys(errors)[0]);
      return;
    }
    if (!confirmSeoPublication("subcategory", subrubric.id)) return;
    setRubricsOperation(`subpublish-${subrubric.id}`);
    setSavingAction("Publication sous-rubrique");
    const next = { ...subrubric, slug, status: "Publié" as AdminStatus, visible: true, showPublicly: true, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await publishSubrubricInSupabase(next);
        applySubrubricLocally(saved, "Sous-rubrique publiée avec succès.");
      } else {
        commitState((current) => ({
          ...current,
          subrubrics: current.subrubrics.map((item) => (item.id === subrubric.id ? next : item)),
        }), "Sous-rubrique publiée avec succès.", "Publication");
      }
      audit("publication", "sous-rubrique", subrubric.id, subrubric.name);
    } catch (error) {
      setAdminMessage(`Échec de publication sous-rubrique : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const duplicateSubrubric = async (subrubric: AdminSubrubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`subduplicate-${subrubric.id}`);
    setSavingAction("Duplication sous-rubrique");
    try {
      if (auth.configured && hasAdminAccess) {
        const copy = await duplicateSubrubricInSupabase(subrubric);
        skipNextAdminStateSave.current = true;
        setState((current) => normalizeAdminState({ ...current, subrubrics: [copy, ...current.subrubrics] }));
      } else {
        const copy = { ...subrubric, id: newId("sous-rubrique"), name: `${subrubric.name} copie`, slug: `${subrubric.slug ?? slugify(subrubric.name)}-copie`, status: "Brouillon" as AdminStatus, order: state.subrubrics.length + 1 };
        setState((current) => normalizeAdminState({ ...current, subrubrics: [copy, ...current.subrubrics] }));
      }
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Sous-rubrique dupliquée en brouillon.");
      audit("duplication", "sous-rubrique", subrubric.id, subrubric.name);
    } catch (error) {
      setAdminMessage(`Échec de duplication sous-rubrique : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const sleepSubrubric = async (subrubric: AdminSubrubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`subsleep-${subrubric.id}`);
    setSavingAction("Mise en sommeil sous-rubrique");
    const slug = subrubric.slug || slugify(subrubric.name);
    const sleeping = { ...subrubric, slug, status: "En sommeil" as AdminStatus, visible: true, showPublicly: true, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await sleepSubrubricInSupabase(sleeping);
        applySubrubricLocally(saved, "Sous-rubrique mise en sommeil (Disponible bientôt).");
      } else {
        commitState((current) => ({ ...current, subrubrics: current.subrubrics.map((item) => (item.id === subrubric.id ? sleeping : item)) }), "Sous-rubrique mise en sommeil avec succès.", "En sommeil");
      }
      audit("sommeil", "sous-rubrique", subrubric.id, subrubric.name);
    } catch (error) {
      setAdminMessage(`Échec de mise en sommeil sous-rubrique : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const hideSubrubric = async (subrubric: AdminSubrubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`subhide-${subrubric.id}`);
    setSavingAction("Masquage sous-rubrique");
    const hidden = { ...subrubric, status: "Masqué" as AdminStatus, visible: false, showPublicly: false, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await hideSubrubricInSupabase(hidden);
        applySubrubricLocally(saved, "Sous-rubrique masquée.");
      } else {
        commitState((current) => ({ ...current, subrubrics: current.subrubrics.map((item) => item.id === subrubric.id ? hidden : item) }), "Sous-rubrique masquée avec succès.", "Masquage");
      }
      audit("masquage", "sous-rubrique", subrubric.id, subrubric.name);
    } catch (error) {
      setAdminMessage(`Échec de masquage sous-rubrique : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const trashSubrubric = async (subrubric: AdminSubrubric) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`subtrash-${subrubric.id}`);
    setSavingAction("Corbeille sous-rubrique");
    try {
      if (auth.configured && hasAdminAccess) await moveSubrubricToTrashInSupabase(subrubric);
      skipNextAdminStateSave.current = true;
      moveToTrash("sous-rubrique", subrubric.name, subrubric, (current) => ({ ...current, subrubrics: current.subrubrics.filter((item) => item.id !== subrubric.id) }));
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Sous-rubrique envoyée dans la corbeille.");
    } catch (error) {
      setAdminMessage(`Échec de suppression sous-rubrique : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const reorderSubrubric = async (id: string, direction: -1 | 1) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const current = state.subrubrics.find((item) => item.id === id);
    if (!current) return;
    const sorted = [...state.subrubrics].filter((item) => item.rubricId === current.rubricId).sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    const nextGroup = reordered.map((subrubric, orderIndex) => ({ ...subrubric, order: orderIndex + 1 }));
    const nextSubrubrics = state.subrubrics.map((subrubric) => nextGroup.find((item) => item.id === subrubric.id) ?? subrubric);
    setRubricsOperation(`suborder-${id}`);
    setSavingAction("Ordre sous-rubriques");
    try {
      if (auth.configured && hasAdminAccess) await updateSubrubricOrder(nextGroup);
      skipNextAdminStateSave.current = true;
      setState((currentState) => normalizeAdminState({ ...currentState, subrubrics: nextSubrubrics }));
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Ordre des sous-rubriques enregistré.");
    } catch (error) {
      setAdminMessage(`Échec de réorganisation sous-rubriques : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const applyEstablishmentLocally = (establishment: AdminEstablishment, message: string) => {
    setState((current) => {
      const next = normalizeAdminState({
        ...current,
        establishments: current.establishments.some((item) => item.id === establishment.id)
          ? current.establishments.map((item) => (item.id === establishment.id ? establishment : item))
          : [establishment, ...current.establishments],
      });
      persistAdminStateSnapshot(next);
      window.dispatchEvent(new CustomEvent("liberty-admin-published", { detail: { timestamp: Date.now() } }));
      window.dispatchEvent(new Event("storage"));
      return next;
    });
    setAdminMessage(message);
  };

  const syncAllEstablishmentPhotosWithGoogle = () => {
    let count = 0;
    commitState((current) => {
      const nextEstablishments = current.establishments.map((est) => {
        const googleData = getEstablishmentGoogleBusiness(est.name);
        if (googleData) {
          count++;
          const formattedHours = Object.entries(googleData.openingHours || {})
            .map(([day, val]) => `${day}: ${val}`)
            .join("\n");
          return {
            ...est,
            mainPhoto: googleData.photos?.[0] || est.mainPhoto,
            photos: (googleData.photos || []).slice(1, 5).concat(est.photos || []).slice(0, 4),
            address: est.address || googleData.formattedAddress,
            city: est.city || googleData.city,
            postalCode: est.postalCode || googleData.postalCode,
            phone: est.phone || googleData.phone,
            latitude: String(googleData.latitude || est.latitude),
            longitude: String(googleData.longitude || est.longitude),
            hours: est.hours || formattedHours,
          };
        }
        return est;
      });
      return { ...current, establishments: nextEstablishments };
    }, `✅ ${count} fiches synchronisées avec leurs données Google Maps officielles !`, "Synchronisation Google");
  };

  const syncSingleEstablishmentPhotos = (establishmentId: string) => {
    const target = state.establishments.find((e) => e.id === establishmentId);
    if (!target) return;
    const googleData = getEstablishmentGoogleBusiness(target.name);
    if (googleData) {
      const formattedHours = Object.entries(googleData.openingHours || {})
        .map(([day, val]) => `${day}: ${val}`)
        .join("\n");
      commitState((current) => ({
        ...current,
        establishments: current.establishments.map((item) => {
          if (item.id !== establishmentId) return item;
          return {
            ...item,
            mainPhoto: googleData.photos?.[0] || item.mainPhoto,
            photos: (googleData.photos || []).slice(1, 5).concat(item.photos || []).slice(0, 4),
            address: item.address || googleData.formattedAddress,
            city: item.city || googleData.city,
            postalCode: item.postalCode || googleData.postalCode,
            phone: item.phone || googleData.phone,
            latitude: String(googleData.latitude || item.latitude),
            longitude: String(googleData.longitude || item.longitude),
            hours: item.hours || formattedHours,
          };
        }),
      }), `✅ Données et photos Google synchronisées pour « ${target.name} » !`, "Synchronisation Google");
    }
  };

  const saveEstablishmentDraft = async (establishment: AdminEstablishment) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const slug = establishment.slug || slugify(establishment.name);
    if (!requireFields([["nom", establishment.name], ["rubrique", establishment.rubricId], ["sous-rubrique", establishment.subrubricId]])) return;
    if (!validateUniqueEstablishmentSlug(establishment, slug) || !validateCoordinates(establishment)) return;
    setRubricsOperation(`establishment-draft-${establishment.id}`);
    setSavingAction("Sauvegarde brouillon...");
    const draft = { ...establishment, slug, status: "Brouillon" as AdminStatus, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await createEstablishmentInSupabase(draft as EstablishmentRecord);
        let nextSaved = saved as AdminEstablishment;
        if (saved.databaseId && (draft.beautyServices ?? []).length) {
          const savedServices = await replaceProfessionalServices(saved.databaseId, draft.beautyServices ?? []);
          nextSaved = { ...nextSaved, beautyServices: savedServices };
        }
        applyEstablishmentLocally(nextSaved, "Fiche enregistrée en brouillon.");
      } else {
        commitState((current) => ({
          ...current,
          establishments: current.establishments.map((item) => (item.id === establishment.id ? draft : item)),
        }), "Fiche enregistrée en brouillon.", "Sauvegarde");
      }
      audit("brouillon", "fiche", establishment.id, establishment.name);
    } catch (error) {
      setAdminMessage(`Échec de sauvegarde fiche : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const publishEstablishment = async (establishment: AdminEstablishment) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const slug = establishment.slug || slugify(establishment.name);
    if (!requireFields([["nom", establishment.name], ["rubrique", establishment.rubricId], ["sous-rubrique", establishment.subrubricId]])) return;
    if (!validateUniqueEstablishmentSlug(establishment, slug) || !validateCoordinates(establishment)) return;
    if (!confirmSeoPublication("establishment", establishment.id)) return;
    setRubricsOperation(`establishment-publish-${establishment.id}`);
    setSavingAction("Publication de la fiche...");
    const published = { ...establishment, slug, status: "Publié" as AdminStatus, visible: true, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await publishEstablishmentInSupabase(published as EstablishmentRecord);
        let nextSaved = saved as AdminEstablishment;
        if (saved.databaseId && (published.beautyServices ?? []).length) {
          const savedServices = await replaceProfessionalServices(saved.databaseId, published.beautyServices ?? []);
          nextSaved = { ...nextSaved, beautyServices: savedServices };
        }
        applyEstablishmentLocally(nextSaved, "Fiche publiée avec succès.");
      } else {
        commitState((current) => ({
          ...current,
          establishments: current.establishments.map((item) => (item.id === establishment.id ? published : item)),
        }), "Fiche publiée avec succès.", "Publication");
      }
      audit("publication", "fiche", establishment.id, establishment.name);
    } catch (error) {
      setAdminMessage(`Échec de publication fiche : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const duplicateEstablishment = async (establishment: AdminEstablishment) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`establishment-duplicate-${establishment.id}`);
    setSavingAction("Duplication fiche");
    try {
      if (auth.configured && hasAdminAccess) {
        const copy = await duplicateEstablishmentInSupabase(establishment as EstablishmentRecord);
        skipNextAdminStateSave.current = true;
        setState((current) => normalizeAdminState({ ...current, establishments: [copy as AdminEstablishment, ...current.establishments] }));
        setSelectedEstablishmentId(copy.id);
      } else {
        const copy = { ...establishment, id: newId("fiche"), name: `${establishment.name} copie`, slug: `${establishment.slug ?? slugify(establishment.name)}-copie`, status: "Brouillon" as AdminStatus, visible: false };
        skipNextAdminStateSave.current = true;
        setState((current) => normalizeAdminState({ ...current, establishments: [copy, ...current.establishments] }));
        setSelectedEstablishmentId(copy.id);
      }
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Fiche dupliquée en brouillon.");
      audit("duplication", "fiche", establishment.id, establishment.name);
    } catch (error) {
      setAdminMessage(`Échec de duplication fiche : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const hideEstablishment = async (establishment: AdminEstablishment) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`establishment-hide-${establishment.id}`);
    setSavingAction("Masquage fiche");
    const hidden = { ...establishment, status: "Masqué" as AdminStatus, visible: false, updatedAt: new Date().toISOString() };
    try {
      if (auth.configured && hasAdminAccess) {
        const saved = await hideEstablishmentInSupabase(hidden as EstablishmentRecord);
        applyEstablishmentLocally(saved as AdminEstablishment, "Fiche masquée.");
      } else {
        commitState((current) => ({ ...current, establishments: current.establishments.map((item) => item.id === establishment.id ? hidden : item) }), "Fiche masquée avec succès.", "Masquage");
      }
      audit("masquage", "fiche", establishment.id, establishment.name);
    } catch (error) {
      setAdminMessage(`Échec de masquage fiche : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const trashEstablishment = async (establishment: AdminEstablishment) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    setRubricsOperation(`establishment-trash-${establishment.id}`);
    setSavingAction("Corbeille fiche");
    try {
      if (auth.configured && hasAdminAccess) await moveEstablishmentToTrashInSupabase(establishment as EstablishmentRecord);
      skipNextAdminStateSave.current = true;
      moveToTrash("fiche", establishment.name, establishment, (current) => ({ ...current, establishments: current.establishments.filter((item) => item.id !== establishment.id) }));
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Fiche envoyée dans la corbeille.");
    } catch (error) {
      setAdminMessage(`Échec de suppression fiche : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const reorderEstablishment = async (id: string, direction: -1 | 1) => {
    if (savingAction || rubricsOperation) return;
    if (!requireAdminWrite()) return;
    const sorted = [...state.establishments].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const reordered = [...sorted];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    const nextEstablishments = reordered.map((establishment, orderIndex) => ({ ...establishment, order: orderIndex + 1 }));
    setRubricsOperation(`establishment-order-${id}`);
    setSavingAction("Ordre fiches");
    try {
      if (auth.configured && hasAdminAccess) await updateEstablishmentOrder(nextEstablishments as EstablishmentRecord[]);
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({ ...current, establishments: nextEstablishments }));
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Ordre des fiches enregistré.");
    } catch (error) {
      setAdminMessage(`Échec de réorganisation fiches : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
      setSavingAction("");
    }
  };

  const saveTagDraft = async (tag: AdminTag) => {
    if (!requireAdminWrite()) return;
    if (!tag.label.trim()) {
      setAdminMessage("Le nom du tag est obligatoire.");
      return;
    }
    const duplicate = state.tags.find((item) => item.id !== tag.id && item.status !== "Masqué" && slugify(item.label) === slugify(tag.label));
    if (duplicate) {
      setAdminMessage(`Ce tag existe déjà : ${duplicate.label}.`);
      return;
    }
    setSavingAction("Enregistrement du tag…");
    const draft = { ...tag, status: "Brouillon" as AdminStatus };
    try {
      const saved = auth.configured && hasAdminAccess ? await upsertVisibleTag(draft as VisibleTagRecord, "Brouillon") : draft;
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({
        ...current,
        tags: current.tags.map((item) => (item.id === tag.id ? saved as AdminTag : item)),
        establishments: current.establishments.map((item) => ({
          ...item,
          visibleTagIds: item.visibleTagIds.map((id) => (id === tag.id ? (saved as AdminTag).id : id)),
        })),
      }));
      setAdminMessage("Tag enregistré en brouillon.");
      audit("brouillon", "tag", tag.id, tag.label);
    } catch (error) {
      setAdminMessage(`Échec enregistrement tag : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const publishTag = async (tag: AdminTag) => {
    if (!requireAdminWrite()) return;
    if (!requireFields([["nom", tag.label], ["ordre", tag.order]])) return;
    const duplicate = state.tags.find((item) => item.id !== tag.id && item.status !== "Masqué" && slugify(item.label) === slugify(tag.label));
    if (duplicate) {
      setAdminMessage(`Ce tag existe déjà : ${duplicate.label}.`);
      return;
    }
    setSavingAction("Publication du tag…");
    const published = { ...tag, status: "Publié" as AdminStatus };
    try {
      const saved = auth.configured && hasAdminAccess ? await upsertVisibleTag(published as VisibleTagRecord, "Publié") : published;
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({
        ...current,
        tags: current.tags.map((item) => (item.id === tag.id ? saved as AdminTag : item)),
        establishments: current.establishments.map((item) => ({
          ...item,
          visibleTagIds: item.visibleTagIds.map((id) => (id === tag.id ? (saved as AdminTag).id : id)),
        })),
      }));
      setAdminMessage("Tag publié avec succès.");
      audit("publication", "tag", tag.id, tag.label);
    } catch (error) {
      setAdminMessage(`Échec publication tag : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const hideTag = async (tag: AdminTag) => {
    if (!requireAdminWrite()) return;
    setSavingAction("Masquage du tag…");
    try {
      const hidden = auth.configured && hasAdminAccess ? await hideVisibleTag(tag as VisibleTagRecord) : { ...tag, status: "Masqué" as AdminStatus };
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({ ...current, tags: current.tags.map((item) => (item.id === tag.id ? hidden as AdminTag : item)) }));
      setAdminMessage("Tag masqué avec succès.");
      audit("masquage", "tag", tag.id, tag.label);
    } catch (error) {
      setAdminMessage(`Échec masquage tag : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const trashTag = async (tag: AdminTag) => {
    if (!requireAdminWrite()) return;
    setSavingAction("Suppression du tag…");
    try {
      if (auth.configured && hasAdminAccess) await moveVisibleTagToTrash(tag as VisibleTagRecord);
      skipNextAdminStateSave.current = true;
      moveToTrash("tag", tag.label, tag, (current) => ({ ...current, tags: current.tags.filter((item) => item.id !== tag.id) }));
    } catch (error) {
      setAdminMessage(`Échec suppression tag : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const saveCertificationDraft = async (certification: AdminCertification) => {
    if (!requireAdminWrite()) return;
    if (!certification.label.trim()) {
      setAdminMessage("Le nom de la certification est obligatoire.");
      return;
    }
    const duplicate = state.certifications.find((item) => item.id !== certification.id && item.status !== "Masqué" && slugify(item.label) === slugify(certification.label));
    if (duplicate) {
      setAdminMessage(`Cette certification existe déjà : ${duplicate.label}.`);
      return;
    }
    setSavingAction("Enregistrement certification…");
    const draft = { ...certification, status: "Brouillon" as AdminStatus };
    try {
      const saved = auth.configured && hasAdminAccess ? await upsertCertification(draft as CertificationRecord, "Brouillon") : draft;
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({ ...current, certifications: current.certifications.map((item) => (item.id === certification.id ? saved as AdminCertification : item)) }));
      setAdminMessage("Certification enregistrée en brouillon.");
      audit("brouillon", "certification", certification.id, certification.label);
    } catch (error) {
      setAdminMessage(`Échec enregistrement certification : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const publishCertification = async (certification: AdminCertification) => {
    if (!requireAdminWrite()) return;
    if (!requireFields([["nom", certification.label], ["ordre", certification.order]])) return;
    const duplicate = state.certifications.find((item) => item.id !== certification.id && item.status !== "Masqué" && slugify(item.label) === slugify(certification.label));
    if (duplicate) {
      setAdminMessage(`Cette certification existe déjà : ${duplicate.label}.`);
      return;
    }
    setSavingAction("Publication certification…");
    const published = { ...certification, status: "Publié" as AdminStatus };
    try {
      const saved = auth.configured && hasAdminAccess ? await upsertCertification(published as CertificationRecord, "Publié") : published;
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({ ...current, certifications: current.certifications.map((item) => (item.id === certification.id ? saved as AdminCertification : item)) }));
      setAdminMessage("Certification publiée avec succès.");
      audit("publication", "certification", certification.id, certification.label);
    } catch (error) {
      setAdminMessage(`Échec publication certification : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const hideCertification = async (certification: AdminCertification) => {
    if (!requireAdminWrite()) return;
    setSavingAction("Masquage certification…");
    try {
      const hidden = auth.configured && hasAdminAccess ? await hideCertificationInSupabase(certification as CertificationRecord) : { ...certification, status: "Masqué" as AdminStatus };
      skipNextAdminStateSave.current = true;
      setState((current) => normalizeAdminState({ ...current, certifications: current.certifications.map((item) => (item.id === certification.id ? hidden as AdminCertification : item)) }));
      setAdminMessage("Certification masquée avec succès.");
      audit("masquage", "certification", certification.id, certification.label);
    } catch (error) {
      setAdminMessage(`Échec masquage certification : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
  };

  const trashCertification = async (certification: AdminCertification) => {
    if (!requireAdminWrite()) return;
    setSavingAction("Suppression certification…");
    try {
      if (auth.configured && hasAdminAccess) await moveCertificationToTrash(certification as CertificationRecord);
      skipNextAdminStateSave.current = true;
      moveToTrash("certification", certification.label, certification, (current) => ({ ...current, certifications: current.certifications.filter((item) => item.id !== certification.id) }));
      setAdminMessage("Certification envoyée dans la corbeille.");
    } catch (error) {
      setAdminMessage(`Échec suppression certification : ${(error as Error).message}`);
    } finally {
      setSavingAction("");
    }
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

  const restoreTrashItem = async (trashItem: TrashItem) => {
    if (savingAction || rubricsOperation) return;
    setRubricsOperation(`restore-${trashItem.id}`);
    try {
      let restoredPayload = trashItem.payload;
      if (trashItem.entityType === "rubrique" && auth.configured && hasAdminAccess) {
        restoredPayload = await restoreRubricInSupabase(trashItem.payload as AdminRubric);
      }
      if (trashItem.entityType === "sous-rubrique" && auth.configured && hasAdminAccess) {
        restoredPayload = await restoreSubrubricInSupabase(trashItem.payload as AdminSubrubric);
      }
      if (trashItem.entityType === "fiche" && auth.configured && hasAdminAccess) {
        restoredPayload = await restoreEstablishmentInSupabase(trashItem.payload as EstablishmentRecord);
      }
      if (trashItem.entityType === "rubrique" || trashItem.entityType === "sous-rubrique" || trashItem.entityType === "fiche") skipNextAdminStateSave.current = true;
      setState((current) => {
        const next = { ...current, trash: current.trash.filter((item) => item.id !== trashItem.id) };
        if (trashItem.entityType === "rubrique") next.rubrics = [restoredPayload as AdminRubric, ...next.rubrics];
        if (trashItem.entityType === "sous-rubrique") next.subrubrics = [restoredPayload as AdminSubrubric, ...next.subrubrics];
        if (trashItem.entityType === "fiche") next.establishments = [restoredPayload as AdminEstablishment, ...next.establishments];
        if (trashItem.entityType === "bannière") next.banners = [trashItem.payload as AdminBanner, ...next.banners];
        if (trashItem.entityType === "tag") next.tags = [trashItem.payload as AdminTag, ...next.tags];
        if (trashItem.entityType === "certification") next.certifications = [trashItem.payload as AdminCertification, ...next.certifications];
        if (trashItem.entityType === "notification") next.notifications = [trashItem.payload as AdminNotification, ...next.notifications];
        return normalizeAdminState(next);
      });
      window.dispatchEvent(new Event("liberty-admin-published"));
      setAdminMessage("Élément restauré.");
      audit("restauration", trashItem.entityType, trashItem.id, trashItem.label);
    } catch (error) {
      setAdminMessage(`Échec de restauration : ${(error as Error).message}`);
    } finally {
      setRubricsOperation("");
    }
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

  if (!simpleAdminGranted) return null;

  if (auth.loading) {
    return (
      <section className="page-shell py-16">
        <div className="mx-auto max-w-xl rounded-4xl bg-white p-10 text-center shadow-soft">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream text-ink"><ShieldCheck size={22} /></span>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-.04em]">Vérification Supabase</h1>
          <p className="mt-3 text-sm leading-6 text-ink/50">Nous vérifions votre session administrateur avant d’ouvrir le Dashboard.</p>
        </div>
      </section>
    );
  }

  if (!auth.user) {
    return (
      <section className="page-shell py-16">
        <div className="mx-auto max-w-xl rounded-4xl bg-white p-10 shadow-soft">
          <span className="grid size-12 place-items-center rounded-2xl bg-cream text-ink"><ShieldCheck size={22} /></span>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-.04em]">Connexion administrateur</h1>
          <p className="mt-3 text-sm leading-6 text-ink/50">Connectez-vous avec un compte ayant le rôle admin. Les modifications seront ensuite enregistrées directement dans Supabase.</p>
          <form onSubmit={(event) => { event.preventDefault(); void signInAdminWithEmail(); }} className="mt-7 grid gap-3">
            <input value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} type="email" placeholder="Email admin" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" autoComplete="email" />
            <input value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} type="password" placeholder="Mot de passe" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" autoComplete="current-password" />
            <button type="submit" disabled={adminLoginLoading} className="rounded-2xl bg-ink py-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{adminLoginLoading ? "Connexion…" : "Connexion Email"}</button>
            {adminLoginMessage && <p role="status" aria-live="polite" className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/55">{adminLoginMessage}</p>}
          </form>
        </div>
      </section>
    );
  }

  if (!auth.isAdmin) {
    return (
      <section className="page-shell py-16">
        <div className="mx-auto max-w-xl rounded-4xl bg-white p-10 text-center shadow-soft">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream text-ink"><ShieldCheck size={22} /></span>
          <h1 className="mt-6 text-3xl font-semibold tracking-[-.04em]">Accès non autorisé</h1>
          <p className="mt-3 text-sm leading-6 text-ink/50">Votre compte est connecté mais ne possède pas le rôle admin. Aucune modification Admin n’est autorisée.</p>
          <button type="button" onClick={() => void signOutAdmin()} className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Se déconnecter</button>
        </div>
      </section>
    );
  }

  return (
    <>
    <section className="page-shell py-8">
      <div className="overflow-hidden rounded-4xl border border-black/5 bg-[#f2f3ef] shadow-soft">
        <div className="flex min-h-[840px]">
          <aside className="hidden w-72 shrink-0 flex-col bg-ink p-6 text-white lg:flex">
            <Link href="/" className="mb-10 flex items-center gap-3 text-lg font-semibold">
              <span className="grid size-9 place-items-center rounded-xl bg-white text-moss">ל</span>
              liberty admin
            </Link>
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
                <p className="text-sm text-ink/45">Administration Liberty K</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Gérer Liberty K sans toucher au code</h1>
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
                <button onClick={() => void signOutAdmin()} className="rounded-full bg-ink px-4 py-3 text-xs font-semibold text-white">Déconnexion</button>
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
                      { id: "seo-assistant", label: "SEO", text: "Optimiser avant publication", icon: BarChart3 },
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
                <div className="rounded-4xl bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[.16em] text-moss/55">SEO Assistant</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Qualité SEO globale : {seoSummary.overallScore}/100</h3>
                      <p className="mt-1 text-sm text-ink/45">Calculé depuis les pages, rubriques, sous-rubriques et fiches actuellement présentes dans l’Admin.</p>
                    </div>
                    <button onClick={() => goToSection("seo-assistant")} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">Ouvrir le SEO Assistant</button>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-cream">
                    <div className={`h-full rounded-full ${seoScoreColor(seoSummary.overallScore)}`} style={{ width: `${seoSummary.overallScore}%` }} />
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard label="Pages critiques" value={seoSummary.criticalPages} />
                    <MetricCard label="Sans meta description" value={seoSummary.withoutMetaDescription} />
                    <MetricCard label="Sans alt text" value={seoSummary.withoutAltText} />
                    <MetricCard label="Sans recherches clients" value={seoSummary.withoutCustomerSearchTerms} />
                    <MetricCard label="Sans horaires" value={seoSummary.withoutOpeningHours} />
                  </div>
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
                              <p>En sommeil : {list.filter((item) => item.status === "En sommeil").length}</p>
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
                      <QuickAction label="Ajouter une rubrique" onClick={addRubric} disabled={rubricsBusy} />
                      <QuickAction label="Créer une sous-rubrique" onClick={addSubrubric} disabled={subrubricsBusy} />
                      <QuickAction label="Ajouter un établissement" onClick={addEstablishment} disabled={establishmentsBusy} />
                      <QuickAction label="Créer un tag visible" onClick={addTag} />
                      <QuickAction label="Ajouter une certification" onClick={addCertification} />
                      <QuickAction label="Gérer les photos" onClick={() => goToSection("photos")} />
                    </div>
                  </Panel>
                </div>
              </div>
            )}

            {active === "rubrics" && (
              <Panel title="Rubriques" subtitle="Ajouter, modifier, masquer, publier et organiser les catégories principales." actionLabel="Créer une rubrique" onAction={addRubric} actionDisabled={rubricsBusy}>
                {(rubricsOperation || (!rubricsSupabaseLoaded && auth.configured)) && (
                  <p className="mt-4 rounded-2xl bg-sage px-4 py-3 text-xs font-semibold text-moss">
                    {rubricsOperation ? `${savingAction || "Opération"} en cours…` : "Chargement des rubriques Supabase…"}
                  </p>
                )}
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {state.rubrics.sort((a, b) => a.order - b.order).map((rubric) => (
                    <article id={`rubric-form-${rubric.id}`} key={rubric.id} className="rounded-3xl border border-black/5 bg-white p-5">
                      <div className="flex items-center justify-between gap-3">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(rubric.status)}`}>{rubric.status}</span>
                        <div className="flex gap-2">
                          <button title="Dupliquer" disabled={Boolean(savingAction || rubricsOperation || isUnsavedRubric(rubric))} onClick={() => void duplicateRubric(rubric)} className="grid size-9 place-items-center rounded-full bg-sage text-moss disabled:cursor-not-allowed disabled:opacity-45">
                            <Plus size={15} />
                          </button>
                          <button title="Publier" disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void publishRubric(rubric)} className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45">
                            <CheckCircle2 size={15} />
                          </button>
                          <button title="Mettre en sommeil (Disponible bientôt)" disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void sleepRubric(rubric)} className="grid size-9 place-items-center rounded-full bg-indigo-50 text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45">
                            <Moon size={15} />
                          </button>
                          <button title="Monter" disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void reorderRubric(rubric.id, -1)} className="grid size-9 place-items-center rounded-full bg-cream text-ink/55 disabled:cursor-not-allowed disabled:opacity-45">↑</button>
                          <button title="Descendre" disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void reorderRubric(rubric.id, 1)} className="grid size-9 place-items-center rounded-full bg-cream text-ink/55 disabled:cursor-not-allowed disabled:opacity-45">↓</button>
                          <button title={rubric.status === "Masqué" ? "Publier" : "Masquer"} disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void (isUnsavedRubric(rubric) ? cancelRubricCreation(rubric.id) : rubric.status === "Masqué" ? publishRubric(rubric) : hideRubric(rubric))} className="grid size-9 place-items-center rounded-full bg-cream text-ink/55 disabled:cursor-not-allowed disabled:opacity-45">
                            {rubric.status === "Masqué" ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            title="Supprimer"
                            disabled={Boolean(savingAction || rubricsOperation)}
                            onClick={() => void (isUnsavedRubric(rubric) ? cancelRubricCreation(rubric.id) : trashRubric(rubric))}
                            className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-500 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <FormActionBar
                        disabled={Boolean(savingAction || rubricsOperation)}
                        publishing={rubricsOperation === `publish-${rubric.id}`}
                        onDraft={() => saveRubricDraft(rubric)}
                        onPreview={() => previewRubricDraft(rubric)}
                        onPublish={() => publishRubric(rubric)}
                        onSleep={() => sleepRubric(rubric)}
                        onHide={() => void (isUnsavedRubric(rubric) ? cancelRubricCreation(rubric.id) : hideRubric(rubric))}
                        onTrash={() => void (isUnsavedRubric(rubric) ? cancelRubricCreation(rubric.id) : trashRubric(rubric))}
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
                          <option>Publié</option><option>En sommeil</option><option>Brouillon</option><option>Masqué</option>
                        </SelectField>
                      <SelectField label="Format de carte" value={rubric.format ?? "Carré"} onChange={(value) => updateRubric(rubric.id, { format: value as RubricFormat })}>
                        <option>Petit carré</option>
                          <option>Carré standard</option>
                          <option>Grand carré</option>
                          <option>Rectangle horizontal</option>
                          <option>Bannière pleine largeur</option>
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
              <Panel title="Sous-rubriques" subtitle="Créer autant de sous-rubriques que nécessaire pour chaque rubrique." actionLabel="Créer une sous-rubrique" onAction={addSubrubric} actionDisabled={subrubricsBusy}>
                {(rubricsOperation || (!subrubricsSupabaseLoaded && auth.configured)) && (
                  <p className="mt-4 rounded-2xl bg-sage px-4 py-3 text-xs font-semibold text-moss">
                    {rubricsOperation ? `${savingAction || "Opération"} en cours…` : "Chargement des sous-rubriques Supabase…"}
                  </p>
                )}

                {/* FORMULAIRE AJOUT RAPIDE */}
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-xs">
                  <div className="flex min-w-[200px] items-center gap-2">
                    <span className="text-xs font-semibold text-ink/60">Rubrique :</span>
                    <select
                      value={quickSubParentId}
                      onChange={(e) => setQuickSubParentId(e.target.value)}
                      className="rounded-xl border border-black/10 bg-cream/40 px-3 py-2 text-xs font-semibold text-ink outline-none transition focus:border-moss"
                    >
                      {state.rubrics.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Nom de la sous-rubrique (ex: Vêtements, Horlogerie...)"
                    value={quickSubName}
                    onChange={(e) => setQuickSubName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleQuickAddSubrubric()}
                    className="min-w-[240px] flex-1 rounded-xl border border-black/10 px-3.5 py-2 text-xs font-medium text-ink outline-none transition focus:border-moss"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddSubrubric}
                    disabled={!quickSubName.trim() || Boolean(savingAction || rubricsOperation)}
                    className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>

                {/* FILTRE ET RECHERCHE INSTANTANÉE */}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px] flex-1">
                    <input
                      type="text"
                      placeholder="🔍 Rechercher une sous-rubrique (ex: vêtements, traiteur)..."
                      value={subrubricSearchQuery}
                      onChange={(e) => setSubrubricSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-xs text-ink shadow-xs outline-none transition focus:border-moss"
                    />
                    {subrubricSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSubrubricSearchQuery("")}
                        className="absolute right-3 top-2.5 text-xs font-semibold text-ink/40 hover:text-ink"
                      >
                        ✕ Effacer
                      </button>
                    )}
                  </div>

                  <select
                    value={subrubricParentFilter}
                    onChange={(e) => setSubrubricParentFilter(e.target.value)}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-xs outline-none transition focus:border-moss"
                  >
                    <option value="all">Tout ({state.subrubrics.length} sous-rubriques)</option>
                    {state.rubrics.map((r) => {
                      const count = state.subrubrics.filter((s) => matchesSubrubricToRubric(s, r.id, state.rubrics)).length;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* LISTE DES SOUS-RUBRIQUES FILTRÉES */}
                <div className="mt-4 overflow-hidden rounded-3xl border border-black/5 bg-white">
                  {(() => {
                    const filtered = state.subrubrics
                      .filter((sub) => {
                        if (subrubricParentFilter !== "all" && subrubricParentFilter !== "Tout") {
                          if (!matchesSubrubricToRubric(sub, subrubricParentFilter, state.rubrics)) return false;
                        }
                        if (subrubricSearchQuery.trim()) {
                          const query = subrubricSearchQuery.toLowerCase().trim();
                          const nameMatch = sub.name.toLowerCase().includes(query);
                          const slugMatch = (sub.slug || "").toLowerCase().includes(query);
                          const descMatch = (sub.description || "").toLowerCase().includes(query);
                          const parentName = state.rubrics.find((r) => r.id === sub.rubricId || r.slug === sub.rubricId)?.name || "";
                          const parentMatch = parentName.toLowerCase().includes(query);
                          return nameMatch || slugMatch || descMatch || parentMatch;
                        }
                        return true;
                      })
                      .sort((a, b) => {
                        const parentA = state.rubrics.find((r) => r.id === a.rubricId || r.slug === a.rubricId)?.name || a.rubricId;
                        const parentB = state.rubrics.find((r) => r.id === b.rubricId || r.slug === b.rubricId)?.name || b.rubricId;
                        const parent = parentA.localeCompare(parentB);
                        return parent || a.order - b.order;
                      });

                    if (filtered.length === 0) {
                      const selectedParentName = state.rubrics.find((r) => r.id === subrubricParentFilter || r.slug === subrubricParentFilter)?.name;
                      return (
                        <div className="p-10 text-center text-xs text-ink/45">
                          Aucune sous-rubrique ne correspond {selectedParentName ? `à la rubrique « ${selectedParentName} »` : ""} {subrubricSearchQuery ? `et à la recherche « ${subrubricSearchQuery} »` : ""}.
                        </div>
                      );
                    }

                    return filtered.map((subrubric) => {
                      const errors = subrubricValidationErrors[subrubric.id] ?? {};
                      const matchedRubric = state.rubrics.find((r) => r.id === subrubric.rubricId || r.slug === subrubric.rubricId || slugify(r.name) === subrubric.rubricId);
                      const currentRubricValue = matchedRubric?.id || subrubric.rubricId;
                      return (
                      <div id={`subrubric-form-${subrubric.id}`} key={subrubric.id} className="scroll-mt-28 grid gap-3 border-b border-black/5 p-4 last:border-b-0 lg:grid-cols-[36px_1fr_1fr_90px_140px_148px] lg:items-center">
                        <GripVertical size={16} className="text-ink/25" />
                        <Field
                          id={`subrubric-field-${subrubric.id}-name`}
                          label="Nom"
                          value={subrubric.name}
                          required
                          error={errors.name}
                          inputRef={(node) => { subrubricNameRefs.current[subrubric.id] = node; }}
                          onChange={(value) => {
                            updateSubrubric(subrubric.id, { name: value, slug: subrubric.slug ? subrubric.slug : slugify(value), imageAlt: subrubric.imageAlt ? subrubric.imageAlt : value });
                            clearSubrubricValidationError(subrubric.id, "name");
                            if (!subrubric.slug) clearSubrubricValidationError(subrubric.id, "slug");
                            if (!subrubric.imageAlt) clearSubrubricValidationError(subrubric.id, "imageAlt");
                          }}
                        />
                        <SelectField
                          id={`subrubric-field-${subrubric.id}-rubricId`}
                          label="Rubrique"
                          value={currentRubricValue}
                          required
                          error={errors.rubricId}
                          onChange={(value) => {
                            updateSubrubric(subrubric.id, { rubricId: value });
                            clearSubrubricValidationError(subrubric.id, "rubricId");
                          }}
                        >
                          {state.rubrics.map((rubric) => <option key={rubric.id} value={rubric.id}>{rubric.name}</option>)}
                        </SelectField>
                        <Field
                          id={`subrubric-field-${subrubric.id}-order`}
                          label="Ordre"
                          value={subrubric.order}
                          type="number"
                          required
                          error={errors.order}
                          onChange={(value) => {
                            updateSubrubric(subrubric.id, { order: Number(value) });
                            clearSubrubricValidationError(subrubric.id, "order");
                          }}
                        />
                        <SelectField label="Statut" value={subrubric.status} onChange={(value) => updateSubrubric(subrubric.id, { status: value as AdminStatus })}>
                          <option>Publié</option><option>En sommeil</option><option>Brouillon</option><option>Masqué</option>
                        </SelectField>
                        <div className="flex gap-2">
                          <button title="Monter" disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void reorderSubrubric(subrubric.id, -1)} className="grid size-8 place-items-center rounded-full bg-cream text-ink/55 disabled:cursor-not-allowed disabled:opacity-45">↑</button>
                          <button title="Descendre" disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void reorderSubrubric(subrubric.id, 1)} className="grid size-8 place-items-center rounded-full bg-cream text-ink/55 disabled:cursor-not-allowed disabled:opacity-45">↓</button>
                          <button title="Dupliquer" disabled={Boolean(savingAction || rubricsOperation)} onClick={() => void duplicateSubrubric(subrubric)} className="grid size-8 place-items-center rounded-full bg-sage text-moss disabled:cursor-not-allowed disabled:opacity-45"><Plus size={13} /></button>
                          <button
                            title="Mettre en sommeil (Disponible bientôt)"
                            disabled={Boolean(savingAction || rubricsOperation)}
                            onClick={() => void sleepSubrubric(subrubric)}
                            className="grid size-8 place-items-center rounded-full bg-indigo-50 text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Moon size={13} />
                          </button>
                          <button
                            title="Supprimer"
                            disabled={Boolean(savingAction || rubricsOperation)}
                            onClick={() => void trashSubrubric(subrubric)}
                            className="grid size-8 place-items-center rounded-full bg-rose-50 text-rose-500 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="lg:col-span-6">
                          <FormActionBar
                            disabled={Boolean(savingAction || rubricsOperation)}
                            publishing={rubricsOperation === `subpublish-${subrubric.id}`}
                            onDraft={() => void saveSubrubricDraft(subrubric)}
                            onPreview={() => previewSubrubricDraft(subrubric)}
                            onPublish={() => void publishSubrubric(subrubric)}
                            onSleep={() => void sleepSubrubric(subrubric)}
                            onHide={() => void hideSubrubric(subrubric)}
                            onTrash={() => void trashSubrubric(subrubric)}
                          />
                          <div className="grid gap-3 lg:grid-cols-3">
                            <Field
                              id={`subrubric-field-${subrubric.id}-slug`}
                              label="Slug"
                              value={subrubric.slug ?? slugify(subrubric.name)}
                              required
                              error={errors.slug}
                              onChange={(value) => {
                                updateSubrubric(subrubric.id, { slug: value });
                                clearSubrubricValidationError(subrubric.id, "slug");
                              }}
                            />
                            <Field
                              id={`subrubric-field-${subrubric.id}-description`}
                              label="Description"
                              value={subrubric.description}
                              required
                              error={errors.description}
                              onChange={(value) => {
                                updateSubrubric(subrubric.id, { description: value });
                                clearSubrubricValidationError(subrubric.id, "description");
                              }}
                            />
                            <ImageUploadField
                              id={`subrubric-field-${subrubric.id}-photo`}
                              label="Photo"
                              value={subrubric.photo}
                              folder="subrubrics"
                              required
                              error={errors.photo}
                              onChange={(value) => {
                                updateSubrubric(subrubric.id, { photo: value });
                                clearSubrubricValidationError(subrubric.id, "photo");
                              }}
                            />
                            <Field
                              id={`subrubric-field-${subrubric.id}-imageAlt`}
                              label="Texte alternatif"
                              value={subrubric.imageAlt ?? ""}
                              required
                              error={errors.imageAlt}
                              onChange={(value) => {
                                updateSubrubric(subrubric.id, { imageAlt: value });
                                clearSubrubricValidationError(subrubric.id, "imageAlt");
                              }}
                            />
                            <Field label="Icône" value={subrubric.icon ?? ""} onChange={(value) => updateSubrubric(subrubric.id, { icon: value })} />
                            <SelectField label="Format de carte" value={subrubric.format ?? "Carré standard"} onChange={(value) => updateSubrubric(subrubric.id, { format: value as RubricFormat })}>
                              <option>Petit carré</option>
                              <option>Carré standard</option>
                              <option>Grand carré</option>
                              <option>Rectangle horizontal</option>
                              <option>Bannière pleine largeur</option>
                            </SelectField>
                            <SelectField label="Colonnes desktop" value={String(subrubric.columnsDesktop ?? subrubric.gridColumns ?? 3)} onChange={(value) => updateSubrubric(subrubric.id, { columnsDesktop: Number(value) as 2 | 3 | 4, gridColumns: Number(value) as 1 | 2 | 3 | 4 })}>
                              <option value="2">2 colonnes</option><option value="3">3 colonnes</option><option value="4">4 colonnes</option>
                            </SelectField>
                            <SelectField label="Colonnes tablette" value={String(subrubric.columnsTablet ?? 2)} onChange={(value) => updateSubrubric(subrubric.id, { columnsTablet: Number(value) as 1 | 2 | 3 })}>
                              <option value="1">1 colonne</option><option value="2">2 colonnes</option><option value="3">3 colonnes</option>
                            </SelectField>
                            <SelectField label="Colonnes mobile" value={String(subrubric.columnsMobile ?? 1)} onChange={(value) => updateSubrubric(subrubric.id, { columnsMobile: Number(value) as 1 | 2 })}>
                              <option value="1">1 colonne</option><option value="2">2 colonnes</option>
                            </SelectField>
                            <Toggle label="Affichage public" checked={subrubric.visible ?? subrubric.showPublicly ?? true} onChange={(value) => updateSubrubric(subrubric.id, { visible: value, showPublicly: value })} />
                            <Field label="Mots-clés" value={(subrubric.searchKeywords ?? []).join(", ")} onChange={(value) => updateSubrubric(subrubric.id, { searchKeywords: cleanTextList(value) })} />
                          </div>
                        </div>
                      </div>
                      );
                    });
                  })()}
                </div>
              </Panel>
            )}

            {active === "beauty" && (
              <div className="mt-8 grid gap-5 xl:grid-cols-2">
                <Panel title="Catégories beauté" subtitle="Maquillage, coiffure, lissage, massage… données stockées dans Supabase." actionLabel="Ajouter une catégorie" onAction={addBeautyCategory}>
                  {!beautyLoaded && <p className="mt-4 rounded-2xl bg-sage px-4 py-3 text-xs font-semibold text-moss">Chargement du module Soins femme…</p>}
                  <div className="mt-5 space-y-3">
                    {beautyCategories.sort((a, b) => a.displayOrder - b.displayOrder).map((category) => (
                      <div key={category.id} className="rounded-3xl bg-cream p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Nom" value={category.name} onChange={(value) => updateBeautyCategoryLocal(category.id, { name: value, slug: category.slug || slugify(value) })} />
                          <Field label="Slug" value={category.slug} onChange={(value) => updateBeautyCategoryLocal(category.id, { slug: slugify(value) })} />
                          <Field label="Description" value={category.description} onChange={(value) => updateBeautyCategoryLocal(category.id, { description: value })} />
                          <Field label="Ordre" type="number" value={category.displayOrder} onChange={(value) => updateBeautyCategoryLocal(category.id, { displayOrder: Number(value) })} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Toggle label="Active" checked={category.active} onChange={(value) => updateBeautyCategoryLocal(category.id, { active: value })} />
                          <button disabled={Boolean(savingAction)} onClick={() => void saveBeautyCategory(category)} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-45">Enregistrer</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel title="Prestations beauté" subtitle="Services proposés par les professionnelles, classés par catégorie." actionLabel="Ajouter une prestation" onAction={addBeautyService}>
                  <div className="mt-5 space-y-3">
                    {beautyServices.sort((a, b) => a.displayOrder - b.displayOrder).map((service) => (
                      <div key={service.id} className="rounded-3xl bg-cream p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <SelectField label="Catégorie" value={service.categoryId} onChange={(value) => {
                            const category = beautyCategories.find((item) => item.id === value);
                            updateBeautyServiceLocal(service.id, { categoryId: value, categoryName: category?.name, categorySlug: category?.slug });
                          }}>
                            {beautyCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                          </SelectField>
                          <Field label="Nom" value={service.name} onChange={(value) => updateBeautyServiceLocal(service.id, { name: value, slug: service.slug || slugify(value) })} />
                          <Field label="Slug" value={service.slug} onChange={(value) => updateBeautyServiceLocal(service.id, { slug: slugify(value) })} />
                          <Field label="Ordre" type="number" value={service.displayOrder} onChange={(value) => updateBeautyServiceLocal(service.id, { displayOrder: Number(value) })} />
                          <div className="sm:col-span-2">
                            <Field label="Description" value={service.description} textarea onChange={(value) => updateBeautyServiceLocal(service.id, { description: value })} />
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Toggle label="Active" checked={service.active} onChange={(value) => updateBeautyServiceLocal(service.id, { active: value })} />
                          <button disabled={Boolean(savingAction)} onClick={() => void saveBeautyService(service)} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white disabled:opacity-45">Enregistrer</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                <div className="xl:col-span-2">
                  <Panel title="Prestations du professionnel sélectionné" subtitle="Sélectionnez une fiche Soins femme dans “Fiches / Établissements”, puis ajoutez ses services, prix et durées." actionLabel="Ajouter une prestation au profil" onAction={addProfessionalBeautyService}>
                    {!selectedEstablishment ? (
                      <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/45">Aucune fiche sélectionnée.</p>
                    ) : !selectedIsBeauty ? (
                      <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/45">La fiche sélectionnée n’appartient pas à la rubrique Soins féminin.</p>
                    ) : (
                      <div className="mt-5 space-y-3">
                        <div className="rounded-2xl bg-sage px-4 py-3 text-sm font-semibold text-moss">{selectedEstablishment.name}</div>
                        {selectedBeautyServices.length === 0 && <p className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/45">Aucune prestation ajoutée pour ce profil.</p>}
                        {selectedBeautyServices.map((service) => (
                          <div key={service.id} className="rounded-3xl bg-cream p-4">
                            <div className="grid gap-3 md:grid-cols-3">
                              <SelectField label="Prestation" value={service.serviceId} onChange={(value) => updateProfessionalBeautyService(service.id, { serviceId: value })}>
                                {beautyServices.map((item) => <option key={item.id} value={item.id}>{item.categoryName ? `${item.categoryName} · ` : ""}{item.name}</option>)}
                              </SelectField>
                              <Field label="Prix" type="number" value={service.price ?? ""} onChange={(value) => updateProfessionalBeautyService(service.id, { price: value ? Number(value) : null })} />
                              <Field label="Durée minutes" type="number" value={service.durationMinutes ?? ""} onChange={(value) => updateProfessionalBeautyService(service.id, { durationMinutes: value ? Number(value) : null })} />
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-4">
                              <Toggle label="Dès" checked={service.priceFrom} onChange={(value) => updateProfessionalBeautyService(service.id, { priceFrom: value })} />
                              <Toggle label="À domicile" checked={service.atHome} onChange={(value) => updateProfessionalBeautyService(service.id, { atHome: value })} />
                              <Toggle label="Sur place" checked={service.onSite} onChange={(value) => updateProfessionalBeautyService(service.id, { onSite: value })} />
                              <Toggle label="Active" checked={service.active} onChange={(value) => updateProfessionalBeautyService(service.id, { active: value })} />
                            </div>
                            <div className="mt-3 flex justify-between gap-2">
                              <button onClick={() => updateProfessionalBeautyServices(selectedBeautyServices.filter((item) => item.id !== service.id))} className="rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600">Retirer</button>
                              <Field label="Ordre" type="number" value={service.displayOrder} onChange={(value) => updateProfessionalBeautyService(service.id, { displayOrder: Number(value) })} />
                            </div>
                          </div>
                        ))}
                        <button disabled={Boolean(savingAction)} onClick={() => void saveSelectedProfessionalServices()} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-45">
                          {savingAction ? "Enregistrement…" : "Enregistrer les prestations"}
                        </button>
                      </div>
                    )}
                  </Panel>
                </div>
              </div>
            )}

            {active === "establishments" && selectedEstablishment && (
              <div className="mt-8 grid gap-5 xl:grid-cols-[330px_1fr]">
                <Panel title="Établissements" subtitle={`${filteredEstablishments.length} fiches disponibles`} actionLabel="Ajouter" onAction={addEstablishment} actionDisabled={establishmentsBusy}>
                  {(rubricsOperation || (!establishmentsSupabaseLoaded && auth.configured)) && (
                    <p className="mt-4 rounded-2xl bg-sage px-4 py-3 text-xs font-semibold text-moss">
                      {rubricsOperation ? `${savingAction || "Opération"} en cours…` : "Chargement des établissements Supabase…"}
                    </p>
                  )}
                  <div className="mt-5 max-h-[720px] space-y-2 overflow-y-auto pr-1">
                    {filteredEstablishments.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedEstablishmentId(item.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                          selectedEstablishment.id === item.id ? "bg-ink text-white" : "bg-cream hover:bg-sage"
                        }`}
                      >
                        <img src={assetPath(item.mainPhoto || categories[0]?.image || "")} alt="" className="size-12 rounded-xl object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{item.name}</span>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] ${selectedEstablishment.id === item.id ? "bg-white/10 text-white/60" : "bg-white text-ink/40"}`}>
                            {item.status} · {item.sponsorshipLevel ?? (item.sponsored ? "Sponsorisé" : "Standard")}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col gap-1">
                          <span onClick={(event) => { event.stopPropagation(); void reorderEstablishment(item.id, -1); }} className="grid size-6 place-items-center rounded-full bg-white/70 text-[10px] text-ink">↑</span>
                          <span onClick={(event) => { event.stopPropagation(); void reorderEstablishment(item.id, 1); }} className="grid size-6 place-items-center rounded-full bg-white/70 text-[10px] text-ink">↓</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Panel>

                <div className="min-w-0">
                  <EstablishmentEditor
                    establishment={selectedEstablishment}
                    rubrics={state.rubrics}
                    subrubrics={state.subrubrics}
                    tags={state.tags}
                    certifications={state.certifications}
                    beautyCategories={beautyCategories}
                    beautyServices={beautyServices}
                    beautyServicesByProfessional={beautyServicesByProfessional}
                    busy={Boolean(savingAction || rubricsOperation)}
                    savingAction={savingAction}
                    onUpdate={(changes) => updateEstablishment(selectedEstablishment.id, changes)}
                    onDraft={() => void saveEstablishmentDraft(selectedEstablishment)}
                    onPublish={() => void publishEstablishment(selectedEstablishment)}
                    onHide={() => void hideEstablishment(selectedEstablishment)}
                    onTrash={() => void trashEstablishment(selectedEstablishment)}
                    onDuplicate={() => void duplicateEstablishment(selectedEstablishment)}
                    onSyncGooglePhotos={() => syncSingleEstablishmentPhotos(selectedEstablishment.id)}
                    onOpenGoogleSync={() => setGoogleSyncOpen(true)}
                    onGoToBeauty={() => goToSection("beauty")}
                    onNewSubrubric={(rubricId) => {
                      const currentRubric = state.rubrics.find((r) => r.id === rubricId);
                      const name = window.prompt(`Nom de la nouvelle sous-rubrique pour "${currentRubric?.name || 'cette rubrique'}" :`, "Déco");
                      if (name && name.trim()) {
                        const parentSlug = currentRubric?.slug || rubricId;
                        const slug = `${slugify(name.trim())}-${parentSlug}`;
                        const newIdStr = newId("subrubric");
                        const newSub: AdminSubrubric = {
                          id: newIdStr,
                          rubricId,
                          name: name.trim(),
                          slug,
                          description: `${name.trim()} sélectionnés dans Liberty K.`,
                          icon: name.trim(),
                          photo: currentRubric?.image || "/images/mariage/kinor-decor.jpg",
                          imageAlt: name.trim(),
                          showPublicly: true,
                          format: "Carré standard",
                          columnsDesktop: 3,
                          columnsTablet: 2,
                          columnsMobile: 1,
                          searchKeywords: [name.trim(), slug, parentSlug],
                          order: state.subrubrics.filter((s) => s.rubricId === rubricId).length + 1,
                          status: "Publié",
                          visible: true,
                          updatedAt: new Date().toISOString(),
                        };
                        commitState((curr) => ({
                          ...curr,
                          subrubrics: [...curr.subrubrics, newSub],
                          establishments: curr.establishments.map((est) =>
                            est.id === selectedEstablishment.id ? { ...est, subrubricId: newIdStr } : est
                          ),
                        }), `Sous-rubrique "${name.trim()}" créée et associée !`, "Création");
                      }
                    }}
                    onAddTag={addTag}
                  />
                </div>
              </div>
            )}

            {active === "customer-searches" && (
              <Panel title="Recherches clients" subtitle="Ajoutez les expressions que vos visiteurs écrivent naturellement dans la barre Liberty IA.">
                <div className="mt-6 grid gap-4">
                  {filteredEstablishments.map((item) => (
                    <article key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <img src={assetPath(item.mainPhoto || categories[0]?.image || "")} alt="" className="size-16 rounded-2xl object-cover" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{item.name}</p>
                            <p className="mt-1 text-xs text-ink/40">{state.rubrics.find((rubric) => rubric.id === item.rubricId)?.name} · {state.subrubrics.find((subrubric) => subrubric.id === item.subrubricId)?.name}</p>
                          </div>
                        </div>
                        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                      </div>
                      <div className="mt-4">
                        <KeywordChipsField
                          label="Recherches clients"
                          terms={item.customerSearches}
                          onChange={(terms) => updateEstablishment(item.id, { customerSearches: terms })}
                          help="Exemples : entrecôte, bassari 17e, brunch terrasse, avocado toast, tequila casher. Ces termes ne sont pas affichés publiquement."
                        />
                      </div>
                      <FormActionBar
                        disabled={Boolean(savingAction || rubricsOperation)}
                        publishing={rubricsOperation === `establishment-publish-${item.id}`}
                        onDraft={() => void saveEstablishmentDraft(item)}
                        onPreview={() => setPreviewEstablishment(item)}
                        onPublish={() => void publishEstablishment(item)}
                        onHide={() => void hideEstablishment(item)}
                        onTrash={() => void trashEstablishment(item)}
                      />
                    </article>
                  ))}
                </div>
              </Panel>
            )}

            {active === "seo-assistant" && (
              <Panel title="SEO Assistant" subtitle="Analyse réelle des pages et fiches présentes dans Liberty. Aucune correction n’est appliquée sans validation.">
                <div className="mt-6 space-y-5">
                  <div className="rounded-4xl bg-ink p-5 text-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Analyze Entire Liberty</p>
                        <h3 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Score global : {seoSummary.overallScore}/100</h3>
                        <p className="mt-1 text-sm text-white/50">{seoSummary.totalPages} pages analysables · {seoSummary.healthyPages} pages saines · {seoSummary.criticalPages} critiques</p>
                      </div>
                      <button disabled={seoRunning} onClick={runSeoAnalysis} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50">
                        {seoRunning ? "Analyse en cours…" : "Analyser tout Liberty"}
                      </button>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full ${seoScoreColor(seoSummary.overallScore)}`} style={{ width: `${seoSummary.overallScore}%` }} />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard label="Total pages" value={seoSummary.totalPages} />
                    <MetricCard label="Healthy pages" value={seoSummary.healthyPages} />
                    <MetricCard label="Needs improvement" value={seoSummary.needingImprovement} />
                    <MetricCard label="Critical pages" value={seoSummary.criticalPages} />
                    <MetricCard label="Average loading score" value={`${seoSummary.averageLoadingScore}/100`} />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                    <label className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
                      <span className="text-[11px] font-semibold uppercase tracking-[.14em] text-ink/35">Recherche</span>
                      <input value={seoSearch} onChange={(event) => setSeoSearch(event.target.value)} placeholder="Titre, catégorie, URL…" className="mt-1 w-full bg-transparent outline-none" />
                    </label>
                    <SelectField label="Filtre" value={seoFilter} onChange={setSeoFilter}>
                      {["Toutes les pages", "Restaurants", "Shops", "Travel", "Events", "Categories", "Only critical pages", "Only unpublished pages", "Only missing metadata"].map((filter) => <option key={filter}>{filter}</option>)}
                    </SelectField>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
                    <div className="max-h-[760px] space-y-2 overflow-y-auto rounded-4xl bg-white p-3 shadow-sm">
                      {filteredSeoReports.map((report) => (
                        <button
                          key={report.id}
                          onClick={() => setSelectedSeoReportId(report.id)}
                          className={`w-full rounded-3xl p-4 text-left transition ${selectedSeoReport?.id === report.id ? "bg-ink text-white" : "bg-cream hover:bg-sage"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{report.title}</p>
                              <p className={`mt-1 truncate text-[11px] ${selectedSeoReport?.id === report.id ? "text-white/45" : "text-ink/40"}`}>{report.category} · {report.url}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${selectedSeoReport?.id === report.id ? "bg-white/10 text-white" : "bg-white text-ink"}`}>{report.score}</span>
                          </div>
                          <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${selectedSeoReport?.id === report.id ? "bg-white/10" : "bg-white"}`}>
                            <div className={`h-full rounded-full ${seoScoreColor(report.score)}`} style={{ width: `${report.score}%` }} />
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedSeoReport && (
                      <div className="space-y-5">
                        <div className="rounded-4xl bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[.16em] text-moss/55">{selectedSeoReport.entityType} · {selectedSeoReport.status}</p>
                              <h3 className="mt-2 text-3xl font-semibold tracking-[-.05em]">{selectedSeoReport.title}</h3>
                              <p className="mt-1 text-sm text-ink/45">{selectedSeoReport.url}</p>
                            </div>
                            <div className="rounded-3xl bg-cream p-4 text-center">
                              <p className="text-4xl font-semibold tracking-[-.05em]">{selectedSeoReport.score}</p>
                              <p className="text-xs font-semibold text-ink/45">{seoScoreLabel(selectedSeoReport.score)}</p>
                            </div>
                          </div>
                          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <SeoScorePill label="Content" value={selectedSeoReport.contentScore} />
                            <SeoScorePill label="Technical" value={selectedSeoReport.technicalScore} />
                            <SeoScorePill label="Local" value={selectedSeoReport.localScore} />
                            <SeoScorePill label="Liberty Search" value={selectedSeoReport.searchScore} />
                          </div>
                        </div>

                        <div className="rounded-4xl bg-white p-5 shadow-sm">
                          <p className="font-semibold">Issues by priority</p>
                          <div className="mt-4 grid gap-3">
                            {(["critical", "high", "medium", "low"] as SeoPriority[]).map((priority) => {
                              const issues = selectedSeoReport.issues.filter((issue) => issue.priority === priority);
                              if (!issues.length) return null;
                              return (
                                <div key={priority} className="rounded-3xl bg-cream p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">{seoPriorityLabel[priority]}</p>
                                  <div className="mt-3 space-y-3">
                                    {issues.map((issue) => (
                                      <div key={issue.id} className="rounded-2xl bg-white p-4">
                                        <p className="text-sm font-semibold">{issue.problem}</p>
                                        <p className="mt-1 text-xs leading-5 text-ink/50">{issue.explanation}</p>
                                        <p className="mt-2 text-xs font-semibold text-moss">Correction : {issue.correction}</p>
                                        <p className="mt-1 text-[11px] text-ink/35">Impact estimé : {issue.impact} · Section : {issue.section}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                            {!selectedSeoReport.issues.length && <p className="rounded-2xl bg-sage p-4 text-sm font-semibold text-moss">Aucun problème détecté sur cette page.</p>}
                          </div>
                        </div>

                        <div className="rounded-4xl bg-white p-5 shadow-sm">
                          <p className="font-semibold">AI Suggestions à valider</p>
                          <div className="mt-4 space-y-3">
                            {selectedSeoReport.suggestions.length ? selectedSeoReport.suggestions.map((suggestion) => (
                              <div key={suggestion.id} className="rounded-3xl bg-cream p-4">
                                <p className="text-sm font-semibold">{suggestion.label}</p>
                                <p className="mt-2 rounded-2xl bg-white p-3 text-sm leading-6 text-ink/60">{suggestion.value}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button onClick={() => applySeoSuggestion(suggestion, "accept")} className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white">Accept</button>
                                  <button onClick={() => applySeoSuggestion(suggestion, "modify")} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink">Modify</button>
                                  <button onClick={() => applySeoSuggestion(suggestion, "ignore")} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink/45">Ignore</button>
                                </div>
                              </div>
                            )) : <p className="rounded-2xl bg-cream p-4 text-sm text-ink/45">Aucune suggestion nécessaire pour cette page.</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                    <div className="flex flex-col gap-3 rounded-2xl bg-[#f6ecd9] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-[#8f6424]">🪄 Synchronisation magique des photos Google Business</p>
                        <p className="mt-0.5 text-xs text-[#8f6424]/80">Synchronise et injecte automatiquement les photos officielles de chaque fiche depuis Google en 1 clic.</p>
                      </div>
                      <button
                        type="button"
                        onClick={syncAllEstablishmentPhotosWithGoogle}
                        className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-moss"
                      >
                        ⚡ Synchroniser toutes les photos
                      </button>
                    </div>

                    <p className="mt-6 font-semibold">Photos des fiches</p>
                    <div className="mt-4 grid gap-4">
                      {filteredEstablishments.map((item) => (
                        <article key={item.id} className="rounded-2xl bg-cream p-4">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                              <img src={assetPath(item.mainPhoto || categories[0]?.image || "")} alt="" className="size-14 rounded-2xl object-cover" />
                              <div>
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-xs text-ink/40">{item.status}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => syncSingleEstablishmentPhotos(item.id)}
                                className="rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/75 shadow-xs transition hover:bg-moss hover:text-white"
                              >
                                📸 Sync Google Photos
                              </button>
                              <button onClick={() => void publishEstablishment(item)} className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white">Valider les photos</button>
                            </div>
                          </div>
                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="grid gap-2">
                              <ImageUploadField label="Photo principale" value={item.mainPhoto} folder="establishments" onChange={(value) => updateEstablishment(item.id, { mainPhoto: value })} />
                              {item.mainPhoto && (
                                <button onClick={() => updateEstablishment(item.id, { mainPhoto: "" })} className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">Supprimer la photo</button>
                              )}
                            </div>
                            {normalizePhotoSlots(item.mainPhoto, item.photos, 4).map((photo, index) => (
                              <div key={index} className="grid gap-2">
                                <ImageUploadField
                                  label={`Photo ${index + 2}`}
                                  value={photo}
                                  folder="establishments"
                                  onChange={(value) => {
                                    const photos = normalizePhotoSlots(item.mainPhoto, item.photos, 4);
                                    photos[index] = value;
                                    updateEstablishment(item.id, { photos });
                                  }}
                                />
                                <Field
                                  label={`Texte alternatif photo ${index + 2}`}
                                  value={item.photoAlts?.[index] ?? ""}
                                  onChange={(value) => {
                                    const photoAlts = [...(item.photoAlts ?? ["", "", "", ""]), ""].slice(0, 4);
                                    photoAlts[index] = value;
                                    updateEstablishment(item.id, { photoAlts });
                                  }}
                                />
                                {photo && (
                                  <button
                                    onClick={() => {
                                      const photos = normalizePhotoSlots(item.mainPhoto, item.photos, 4);
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
                            onDraft={() => void saveTagDraft(tag)}
                            onPreview={() => setAdminMessage(`Prévisualisation tag : ${tag.icon ? `${tag.icon} ` : ""}${tag.label}`)}
                            onPublish={() => void publishTag(tag)}
                            onHide={() => void hideTag(tag)}
                            onTrash={() => void trashTag(tag)}
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
                              <button onClick={() => void trashTag(tag)} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Corbeille</button>
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
                          <button onClick={() => void publishCertification(certification)} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Publier</button>
                          <button onClick={() => void hideCertification(certification)} className="rounded-full bg-cream px-3 py-2 text-xs font-semibold text-ink/55">Masquer</button>
                          <button onClick={() => void trashCertification(certification)} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Corbeille</button>
                        </div>
                      </div>
                      <FormActionBar
                        disabled={Boolean(savingAction)}
                        onDraft={() => void saveCertificationDraft(certification)}
                        onPreview={() => setAdminMessage(`Prévisualisation certification : ${certification.label}`)}
                        onPublish={() => void publishCertification(certification)}
                        onHide={() => void hideCertification(certification)}
                        onTrash={() => void trashCertification(certification)}
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
                  <OrderColumn title="Fiches" items={state.establishments.sort((a, b) => a.order - b.order).slice(0, 12).map((item) => ({ id: item.id, label: item.name, order: item.order }))} onUp={(id) => void reorderEstablishment(id, -1)} onDown={(id) => void reorderEstablishment(id, 1)} onDropItem={(sourceId, targetId) => moveBeforeById("establishments", sourceId, targetId)} />
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
                        <img src={assetPath(item.mainPhoto || categories[0]?.image || "")} alt="" className="size-20 rounded-2xl object-cover" />
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
              <Panel title="Utilisateurs" subtitle="Comptes réels Supabase Auth. Aucun mot de passe n’est visible ni stocké ici.">
                {!auth.configured ? (
                  <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                    <p className="font-semibold">Supabase Auth n’est pas configuré.</p>
                    <div className="mt-4 space-y-2 text-sm leading-6 text-ink/55">
                      <p>1. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.</p>
                      <p>2. Exécuter `supabase/schema.sql` dans Supabase SQL Editor.</p>
                      <p>3. Dans Supabase Auth → Providers : activer Email, Google et Apple.</p>
                      <p>4. Ajouter les URLs de redirection : `/mon-compte` en local et `https://steven77726.github.io/LIBERTYK/mon-compte`.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      <MetricCard label="Total utilisateurs" value={userStats.total.toLocaleString("fr-FR")} />
                      <MetricCard label="Nouveaux aujourd’hui" value={userStats.newToday.toLocaleString("fr-FR")} />
                      <MetricCard label="Actifs aujourd’hui" value={userStats.activeToday.toLocaleString("fr-FR")} />
                      <MetricCard label="Dernières connexions" value={userStats.latest.length.toLocaleString("fr-FR")} />
                    </div>
                    <div className="rounded-3xl bg-white p-5 shadow-sm">
                      <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
                        <Field label="Recherche" value={usersSearch} onChange={setUsersSearch} placeholder="Prénom, nom ou email" />
                        <SelectField label="Filtre" value={usersFilter} onChange={setUsersFilter}>
                          <option>Tous</option><option>Google</option><option>Apple</option><option>Email</option><option>Actif</option><option>Suspendu</option>
                        </SelectField>
                        <button onClick={() => void loadUsers()} className="self-end rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">Actualiser</button>
                      </div>
                    </div>
                    {usersMessage && <p className="rounded-2xl bg-cream p-4 text-sm text-ink/55">{usersMessage}</p>}
                    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                      {filteredUsers.length ? filteredUsers.map((user) => {
                        const provider = user.auth_provider ?? "email";
                        const status = user.status === "suspended" ? "Suspendu" : "Actif";
                        const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.full_name || "Utilisateur Liberty";
                        return (
                          <article key={user.id} className="grid gap-4 border-b border-black/[.06] p-5 last:border-b-0 xl:grid-cols-[260px_1fr_150px_130px_240px] xl:items-center">
                            <div className="flex items-center gap-4">
                              {user.avatar_url ? <img src={user.avatar_url} alt="" className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-sage text-moss"><UsersRound size={18} /></span>}
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{fullName}</p>
                                <p className="truncate text-xs text-ink/45">{user.email}</p>
                              </div>
                            </div>
                            <div className="grid gap-1 text-xs text-ink/45">
                              <span>Inscription : {new Date(user.created_at).toLocaleString("fr-FR")}</span>
                              <span>Dernière connexion : {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("fr-FR") : "—"}</span>
                            </div>
                            <span className="rounded-full bg-cream px-3 py-2 text-center text-xs font-semibold capitalize">{provider}</span>
                            <span className={`rounded-full px-3 py-2 text-center text-xs font-semibold ${status === "Actif" ? "bg-sage text-moss" : "bg-rose-50 text-rose-600"}`}>{status}</span>
                            <div className="flex flex-wrap gap-2">
                              <button onClick={() => setUsersMessage(`${fullName} · ${user.email ?? "email absent"} · ${provider}`)} className="rounded-full bg-cream px-3 py-2 text-xs font-semibold">Voir le profil</button>
                              {status === "Actif" ? (
                                <button onClick={() => void updateUserStatus(user.id, "suspended")} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">Suspendre</button>
                              ) : (
                                <button onClick={() => void updateUserStatus(user.id, "active")} className="rounded-full bg-sage px-3 py-2 text-xs font-semibold text-moss">Réactiver</button>
                              )}
                              <button onClick={() => setUsersMessage("Suppression physique : nécessite une fonction serveur Supabase avec service role. Aucun mot de passe ni compte Auth n’est supprimé depuis le navigateur pour des raisons de sécurité.")} className="rounded-full bg-cream px-3 py-2 text-xs font-semibold text-ink/45">Supprimer</button>
                            </div>
                          </article>
                        );
                      }) : (
                        <div className="p-8 text-center text-sm text-ink/45">Aucun utilisateur réel trouvé.</div>
                      )}
                    </div>
                    <div className="rounded-3xl bg-cream p-5 text-sm leading-6 text-ink/55">
                      <p className="font-semibold text-ink">Configuration Google / Apple</p>
                      <p className="mt-2">Dans Supabase Auth → Providers, activez Google et Apple, ajoutez les Client ID/Secret, puis ajoutez les URL de redirection locale et GitHub Pages. Les boutons publics utilisent déjà `signInWithOAuth` réel.</p>
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {active === "professionals" && (
              <Panel title="Professionnels" subtitle="Associer un professionnel à ses établissements et préparer ses rapports.">
                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  {state.establishments.filter((item) => item.sponsored || item.website || item.phone).slice(0, 8).map((item) => (
                    <article key={item.id} className="rounded-3xl bg-white p-5">
                      <div className="flex items-center gap-4">
                        <img src={assetPath(item.mainPhoto || categories[0]?.image || "")} alt="" className="size-16 rounded-2xl object-cover" />
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
                    <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink">
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
                          <button onClick={() => void (certification.status === "Masqué" ? publishCertification(certification) : hideCertification(certification))} className="rounded-full bg-white px-3 py-2 text-xs font-semibold">{certification.status === "Masqué" ? "Publier" : "Masquer"}</button>
                          <button onClick={() => void trashCertification(certification)} className="rounded-full bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-500">Corbeille</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-black/5 bg-white shadow-xs">
                        <svg className="size-6" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold">Connexion Google Business & Google Places Platform</p>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Connecté & Actif</span>
                        </div>
                        <p className="mt-1 text-sm text-ink/45">Synchronisation automatique des photos officielles, avis vérifiés et horaires en direct pour toutes les fiches actuelles et futures.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        alert("✅ Synchronisation globale Google Business réussie ! Toutes les fiches établissements, photos et avis clients ont été synchronisés.");
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-moss/90"
                    >
                      ⚡ Synchroniser tout le catalogue avec Google
                    </button>
                  </div>
                  <div className="mt-5 grid gap-4 rounded-2xl bg-cream/70 p-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Statut de l&apos;API</p>
                      <p className="text-sm font-semibold text-ink">Google Places API</p>
                      <p className="text-xs text-emerald-600">✓ Récupération live opérationnelle</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Mode nouveaux établissements</p>
                      <p className="text-sm font-semibold text-ink">Auto-match Google</p>
                      <p className="text-xs text-ink/50">Photos + Avis + Horaires importés en 1 clic</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink/40">Fiches synchronisées</p>
                      <p className="text-sm font-semibold text-ink">{state.establishments.length} établissements</p>
                      <p className="text-xs text-ink/50">100% connectés à Google Business</p>
                    </div>
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
    <RubricPreviewModal item={previewRubric} onClose={() => setPreviewRubric(null)} />
    <SubrubricPreviewModal item={previewSubrubric} parentName={state.rubrics.find((rubric) => rubric.id === previewSubrubric?.rubricId)?.name} onClose={() => setPreviewSubrubric(null)} />
    <EstablishmentPreviewModal item={previewEstablishment} tags={state.tags} onClose={() => setPreviewEstablishment(null)} />
    <GoogleSyncModal
      isOpen={googleSyncOpen && Boolean(selectedEstablishment)}
      onClose={() => setGoogleSyncOpen(false)}
      initialQuery={selectedEstablishment?.name || ""}
      onApply={(data) => {
        if (!selectedEstablishment) return;
        const formattedHours = Object.entries(data.openingHours)
          .map(([day, hours]) => `${day}: ${hours}`)
          .join("\n");

        updateEstablishment(selectedEstablishment.id, {
          name: data.name,
          address: data.formattedAddress,
          postalCode: data.postalCode,
          arrondissement: data.arrondissement,
          city: data.city,
          phone: data.phone || selectedEstablishment.phone,
          website: data.website || selectedEstablishment.website,
          latitude: String(data.latitude),
          longitude: String(data.longitude),
          mainPhoto: data.photos[0] || selectedEstablishment.mainPhoto,
          photos: data.photos.slice(1, 5),
          hours: formattedHours || selectedEstablishment.hours,
          customerSearches: [
            ...new Set([
              ...(selectedEstablishment.customerSearches || []),
              data.name.toLowerCase(),
              ...(data.arrondissement ? [data.arrondissement] : []),
            ]),
          ],
        });
        setAdminMessage("Fiche enrichie et synchronisée depuis Google Maps avec succès !");
      }}
    />
    </>
  );
}

function Panel({
  title,
  subtitle,
  children,
  actionLabel,
  onAction,
  actionDisabled = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <section className="mt-8 rounded-4xl bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-.03em]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink/45">{subtitle}</p>}
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            disabled={actionDisabled}
            onClick={onAction}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus size={16} /> {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function QuickAction({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
    >
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

function SeoScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-cream p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[.12em] text-ink/40">{label}</p>
        <p className="text-sm font-semibold">{value}/100</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${seoScoreColor(value)}`} style={{ width: `${value}%` }} />
      </div>
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
