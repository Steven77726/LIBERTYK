"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Calendar,
  CalendarDays,
  Camera,
  Car,
  Clock,
  Eye,
  EyeOff,
  ImageIcon,
  Layers,
  MapPin,
  Megaphone,
  Phone,
  Plus,
  Search,
  Sparkles,
  Star,
  Store,
  Tag as TagIcon,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { assetPath } from "@/lib/assets";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";
import { uploadLibertyImage } from "@/lib/supabase/storage";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";
import {
  isNonCuisineRubric,
  toCanonicalCuisineName,
} from "@/components/restaurants/restaurant-explorer";
import type {
  AdminCertification,
  AdminEstablishment,
  AdminRubric,
  AdminSubrubric,
  AdminTag,
  BeautyCategory,
  BeautyProfessionalService,
  BeautyService,
  FieldVisibility,
  KosherType,
  SponsorshipLevel,
} from "./admin-dashboard";

type EditorTab =
  | "identite"
  | "category"
  | "photos"
  | "location"
  | "contact"
  | "services"
  | "tags"
  | "visibility"
  | "preview";

export type EstablishmentEditorProps = {
  establishment: AdminEstablishment;
  rubrics: AdminRubric[];
  subrubrics: AdminSubrubric[];
  tags: AdminTag[];
  certifications: AdminCertification[];
  allAvailableCuisineTypes?: string[];
  beautyCategories?: BeautyCategory[];
  beautyServices?: BeautyService[];
  beautyServicesByProfessional?: Record<string, BeautyProfessionalService[]>;
  busy?: boolean;
  savingAction?: string;
  onUpdate: (changes: Partial<AdminEstablishment>) => void;
  onDraft: () => void;
  onPublish: () => void;
  onHide: () => void;
  onTrash: () => void;
  onDuplicate: () => void;
  onSyncGooglePhotos?: () => void;
  onOpenGoogleSync?: () => void;
  onGoToBeauty?: () => void;
  onNewSubrubric?: (rubricId: string) => void;
  onAddTag?: () => void;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeExternalUrl(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const cleanTextList = (value: string) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const defaultCuisineOptions = [
  "Français",
  "Israélien",
  "Japonais",
  "Chinois",
  "Thaïlandais",
  "Africain",
  "Italien",
  "Libanais",
  "Américain",
  "Marocain",
  "Tunisien",
  "Ashkénaze",
];

const visibilityLabels: Array<{ key: string; label: string; description?: string }> = [
  { key: "phone", label: "Téléphone", description: "Bouton d'appel direct" },
  { key: "whatsapp", label: "WhatsApp", description: "Bouton de contact WhatsApp" },
  { key: "email", label: "Email", description: "Lien de contact email" },
  { key: "instagram", label: "Instagram", description: "Lien vers profil social" },
  { key: "deliveroo", label: "Deliveroo", description: "Bouton de commande Deliveroo" },
  { key: "ubereats", label: "Uber Eats", description: "Bouton de commande Uber Eats" },
  { key: "website", label: "Site internet", description: "Lien vers le site officiel" },
  { key: "reservation", label: "Réservation", description: "Lien ou bouton de réservation" },
  { key: "address", label: "Adresse", description: "Adresse et itinéraire" },
  { key: "opening_hours", label: "Horaires", description: "Grille des horaires d'ouverture" },
  { key: "tags", label: "Tags & Ambiance", description: "Badges de caractéristiques" },
  { key: "terrace", label: "Terrasse", description: "Indicateur de terrasse" },
  { key: "delivery", label: "Livraison", description: "Indicateur de livraison" },
  { key: "takeaway", label: "À emporter", description: "Indicateur à emporter" },
  { key: "price", label: "Gamme de prix", description: "Niveau de prix (€, €€, €€€)" },
  { key: "map", label: "Carte interactive", description: "Localisation sur plan" },
  { key: "reviews", label: "Avis clients", description: "Note et avis vérifiés" },
  { key: "gallery", label: "Galerie photos", description: "Carrousel et grille d'images" },
  { key: "certification", label: "Certification", description: "Badge de cacherout" },
];

function CuisineTypesSelector({
  value = [],
  availableOptions = defaultCuisineOptions,
  onChange,
}: {
  value: string[];
  availableOptions?: string[];
  onChange: (newValues: string[]) => void;
}) {
  const [newTagInput, setNewTagInput] = useState("");

  const normalizedValue = useMemo(() => {
    return value
      .map(toCanonicalCuisineName)
      .filter((c) => Boolean(c) && !isNonCuisineRubric(c));
  }, [value]);

  const allKnownOptions = useMemo(() => {
    const set = new Set<string>();
    defaultCuisineOptions.forEach((c) => set.add(toCanonicalCuisineName(c)));
    availableOptions.forEach((c) => {
      const canon = toCanonicalCuisineName(c);
      if (canon && !isNonCuisineRubric(canon)) set.add(canon);
    });
    normalizedValue.forEach((c) => {
      const canon = toCanonicalCuisineName(c);
      if (canon && !isNonCuisineRubric(canon)) set.add(canon);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [availableOptions, normalizedValue]);

  const handleAdd = (tag: string) => {
    const canon = toCanonicalCuisineName(tag);
    if (!canon || isNonCuisineRubric(canon)) return;
    const norm = canon.toLowerCase();
    if (!normalizedValue.some((v) => v.toLowerCase() === norm)) {
      onChange([...normalizedValue, canon]);
    }
  };

  const handleRemove = (tag: string) => {
    const norm = tag.toLowerCase();
    onChange(normalizedValue.filter((v) => v.toLowerCase() !== norm));
  };

  const handleToggle = (tag: string) => {
    const canon = toCanonicalCuisineName(tag);
    if (!canon || isNonCuisineRubric(canon)) return;
    const norm = canon.toLowerCase();
    const exists = normalizedValue.some((v) => v.toLowerCase() === norm);
    if (exists) {
      handleRemove(canon);
    } else {
      handleAdd(canon);
    }
  };

  const handleAddNewCustom = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    handleAdd(trimmed);
    setNewTagInput("");
  };

  return (
    <div className="space-y-3 rounded-2xl border border-black/10 bg-white p-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-ink/80 flex items-center gap-1.5">
          <UtensilsCrossed size={14} className="text-moss" />
          Types de cuisine / Spécialités
        </label>
        <span className="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold text-moss">
          {normalizedValue.length} sélectionné{normalizedValue.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Badges sélectionnés */}
      <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl border border-black/5 bg-cream/50 items-center">
        {normalizedValue.length === 0 ? (
          <span className="text-xs text-ink/40 italic px-1">
            Aucun type de cuisine assigné (cliquez sur un tag ci-dessous ou ajoutez-en un)
          </span>
        ) : (
          normalizedValue.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white shadow-xs"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="grid size-4 place-items-center rounded-full bg-white/20 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                title={`Retirer ${tag}`}
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Grille de sélection rapide des tags disponibles (Chips cliquables) */}
      <div>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink/40">
          Sélection rapide en 1 clic :
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-0.5">
          {allKnownOptions.map((opt) => {
            const isSelected = normalizedValue.some((v) => v.toLowerCase() === opt.toLowerCase());
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleToggle(opt)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? "bg-moss text-white font-bold shadow-2xs"
                    : "bg-[#f4f0e8] text-ink/70 hover:bg-sage hover:text-moss"
                }`}
              >
                {isSelected ? `✓ ${opt}` : `+ ${opt}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu déroulant + Ajout nouveau tag */}
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] pt-2 border-t border-black/5">
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleAdd(e.target.value);
            }
          }}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold outline-hidden focus:border-moss cursor-pointer"
        >
          <option value="">+ Ajouter depuis la liste ({allKnownOptions.length} cuisines)...</option>
          {allKnownOptions.map((opt) => {
            const isSelected = normalizedValue.some((v) => v.toLowerCase() === opt.toLowerCase());
            return (
              <option key={opt} value={opt} disabled={isSelected}>
                {isSelected ? `✓ ${opt} (déjà ajouté)` : `+ ${opt}`}
              </option>
            );
          })}
        </select>

        <div className="flex gap-1.5">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNewCustom();
              }
            }}
            placeholder="Nouveau tag personnalisé..."
            className="w-36 sm:w-44 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium outline-hidden focus:border-moss"
          />
          <button
            type="button"
            onClick={handleAddNewCustom}
            disabled={!newTagInput.trim()}
            className="rounded-xl bg-moss px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-moss/90 disabled:opacity-40 transition cursor-pointer"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

export function EstablishmentEditor({
  establishment,
  rubrics,
  subrubrics,
  tags,
  certifications,
  allAvailableCuisineTypes,
  busy = false,
  savingAction = "",
  onUpdate,
  onDraft,
  onPublish,
  onHide,
  onTrash,
  onDuplicate,
  onSyncGooglePhotos,
  onOpenGoogleSync,
  onGoToBeauty,
  onNewSubrubric,
  onAddTag,
}: EstablishmentEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("identite");
  const [tagSearch, setTagSearch] = useState("");
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryUploadMessage, setGalleryUploadMessage] = useState("");
  const [newPhotoUrl, setNewPhotoUrl] = useState("");

  // Détection de la catégorie
  const currentRubric = rubrics.find((r) => r.id === establishment.rubricId);
  const currentSubrubric = subrubrics.find((s) => s.id === establishment.subrubricId);
  const rubricSlug = currentRubric?.slug || establishment.rubricId || "";
  const subrubricSlug = currentSubrubric?.slug || establishment.subrubricId || "";

  const isFoodCategory =
    rubricSlug === "food" ||
    rubricSlug.includes("resto") ||
    rubricSlug.includes("brunch") ||
    rubricSlug.includes("patisserie") ||
    subrubricSlug.includes("resto") ||
    subrubricSlug.includes("brunch") ||
    subrubricSlug.includes("patisserie");

  const isEventCategory =
    rubricSlug === "sorties" ||
    subrubricSlug.includes("evenement") ||
    subrubricSlug.includes("concert") ||
    subrubricSlug.includes("spectacle") ||
    subrubricSlug.includes("soiree");

  const isBeautyCategory =
    rubricSlug === "soins-feminin" ||
    rubricSlug === "beaute" ||
    subrubricSlug.includes("coiffure") ||
    subrubricSlug.includes("esthetique") ||
    subrubricSlug.includes("massage");

  const isShoppingCategory = rubricSlug === "shopping" || rubricSlug.includes("mode");
  const isWineCategory = rubricSlug === "vin-spiritueux" || subrubricSlug.includes("caviste");

  // Photos normalisées
  const allPhotos = useMemo(() => {
    const main = establishment.mainPhoto?.trim() ? [establishment.mainPhoto.trim()] : [];
    const rest = (establishment.photos ?? []).map((p: string) => p?.trim()).filter(Boolean) as string[];
    return [...main, ...rest.filter((p: string) => p !== establishment.mainPhoto)];
  }, [establishment.mainPhoto, establishment.photos]);

  const metroStyle = establishment.nearestMetroLine
    ? getMetroLineStyle(establishment.nearestMetroLine)
    : null;

  // Gestion des photos
  const handleSetMainPhoto = (photoUrl: string) => {
    const remaining = allPhotos.filter((p: string) => p !== photoUrl);
    onUpdate({
      mainPhoto: photoUrl,
      photos: remaining,
    });
  };

  const handleMovePhoto = (index: number, direction: -1 | 1) => {
    const list = [...allPhotos];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(target, 0, moved);
    onUpdate({
      mainPhoto: list[0] || "",
      photos: list.slice(1),
    });
  };

  const handleDeletePhoto = (photoUrl: string) => {
    const list = allPhotos.filter((p: string) => p !== photoUrl);
    onUpdate({
      mainPhoto: list[0] || "",
      photos: list.slice(1),
    });
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    const url = newPhotoUrl.trim();
    if (!establishment.mainPhoto) {
      onUpdate({ mainPhoto: url });
    } else {
      const photos = [...(establishment.photos ?? []).filter((p: string) => p !== url), url];
      onUpdate({ photos });
    }
    setNewPhotoUrl("");
  };

  const handleUploadMainPhoto = async (file: File) => {
    setUploadingMain(true);
    try {
      const res = await uploadLibertyImage(file, "establishments");
      if (res.url) {
        onUpdate({ mainPhoto: res.url });
      }
    } finally {
      setUploadingMain(false);
    }
  };

  const handleUploadGalleryPhoto = async (file: File) => {
    setUploadingGallery(true);
    setGalleryUploadMessage("Envoi en cours...");
    try {
      const res = await uploadLibertyImage(file, "establishments");
      if (res.url) {
        if (!establishment.mainPhoto) {
          onUpdate({ mainPhoto: res.url });
        } else {
          const photos = [...(establishment.photos ?? []).filter((p: string) => p !== res.url), res.url];
          onUpdate({ photos });
        }
        setGalleryUploadMessage("✅ Photo ajoutée à la galerie");
        setTimeout(() => setGalleryUploadMessage(""), 3000);
      } else {
        setGalleryUploadMessage(res.error || "Échec de l'envoi.");
      }
    } catch {
      setGalleryUploadMessage("Erreur lors de l'envoi.");
    } finally {
      setUploadingGallery(false);
    }
  };

  // Liste des sous-rubriques filtrées par rubrique sélectionnée
  const availableSubrubrics = subrubrics.filter(
    (s) => s.rubricId === establishment.rubricId
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Entête de la Fiche & Barre de Statut */}
      <div className="flex flex-col gap-4 rounded-3xl border border-black/[.06] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                establishment.status === "Publié"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : establishment.status === "En sommeil"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : establishment.status === "Brouillon"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-zinc-200 bg-zinc-100 text-zinc-600"
              }`}
            >
              {establishment.status}
            </span>
            {establishment.sponsored && (
              <span className="rounded-full bg-[#f6ecd9] px-2.5 py-0.5 text-xs font-bold text-[#8f6424]">
                {establishment.sponsorshipLevel || "Sponsorisé"}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl font-black text-ink">{establishment.name || "Nouvelle fiche"}</h2>
          <p className="text-xs text-ink/45">
            {[currentRubric?.name, currentSubrubric?.name, establishment.city].filter(Boolean).join(" · ")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenGoogleSync && (
            <button
              type="button"
              onClick={onOpenGoogleSync}
              className="flex items-center gap-1.5 rounded-full border border-moss/30 bg-gradient-to-r from-[#d5bb7d]/20 to-[#8fa98d]/30 px-4 py-2 text-xs font-bold text-ink shadow-xs transition hover:scale-105"
            >
              <Sparkles size={14} className="text-moss" /> Google Business
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={onDuplicate}
            className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/70 transition hover:bg-sage hover:text-moss disabled:opacity-50"
          >
            Dupliquer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-moss"
          >
            <Eye size={13} /> Aperçu direct
          </button>
        </div>
      </div>

      {/* 2. Navigation par Onglets Modernes */}
      <div className="flex overflow-x-auto rounded-2xl border border-black/[.06] bg-cream/70 p-1.5 gap-1 select-none">
        {[
          { id: "identite" as const, label: "Identité", icon: Building2 },
          { id: "category" as const, label: "Spécificités", icon: Layers },
          { id: "photos" as const, label: `Photos (${allPhotos.length})`, icon: Camera },
          { id: "location" as const, label: "Localisation", icon: MapPin },
          { id: "contact" as const, label: "Contact & Réseaux", icon: Phone },
          { id: "services" as const, label: "Horaires & Services", icon: Clock },
          { id: "tags" as const, label: "Tags & Cacherout", icon: TagIcon },
          { id: "visibility" as const, label: "Visibilité & Sponsoring", icon: Eye },
          { id: "preview" as const, label: "Aperçu", icon: Star },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                isActive
                  ? "bg-white text-ink shadow-xs"
                  : "text-ink/50 hover:bg-white/50 hover:text-ink"
              }`}
            >
              <Icon size={14} className={isActive ? "text-moss" : "text-ink/40"} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Contenu de la Section Active */}
      <div className="rounded-3xl border border-black/[.06] bg-white p-6 shadow-xs">
        {/* =========================================================================
            ONGLET 1 : IDENTITÉ
        ========================================================================= */}
        {activeTab === "identite" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Identité principale</h3>
              <p className="text-xs text-ink/45">Renseignez le nom et les rubriques de classement de la fiche.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">
                  Nom de l&apos;établissement / Événement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={establishment.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="Ex. Barbanegra, Concert Kinor..."
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">
                  Slug URL <span className="text-ink/35">(auto-généré si vide)</span>
                </label>
                <input
                  type="text"
                  value={establishment.slug ?? ""}
                  onChange={(e) => onUpdate({ slug: slugify(e.target.value) })}
                  placeholder={slugify(establishment.name || "slug-automatique")}
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">
                  Rubrique principale <span className="text-rose-500">*</span>
                </label>
                <select
                  value={establishment.rubricId}
                  onChange={(e) => {
                    const rubricId = e.target.value;
                    const firstSub = subrubrics.find((s) => s.rubricId === rubricId);
                    onUpdate({
                      rubricId,
                      subrubricId: firstSub?.id ?? "",
                    });
                  }}
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                >
                  <option value="">Sélectionner une rubrique</option>
                  {rubrics.map((rubric) => (
                    <option key={rubric.id} value={rubric.id}>
                      📁 {rubric.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-ink/70">
                    Sous-rubrique <span className="text-rose-500">*</span>
                  </label>
                  {onNewSubrubric && (
                    <button
                      type="button"
                      onClick={() => onNewSubrubric(establishment.rubricId)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-moss hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> Nouvelle sous-rubrique
                    </button>
                  )}
                </div>
                <select
                  value={establishment.subrubricId}
                  onChange={(e) => onUpdate({ subrubricId: e.target.value })}
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                >
                  <option value="">Sélectionner une sous-rubrique</option>
                  {availableSubrubrics.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      ↳ {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">
                  Description courte / Accroche <span className="text-ink/35">(optionnel, affiché sous le nom)</span>
                </label>
                <input
                  type="text"
                  value={establishment.shortDescription ?? ""}
                  onChange={(e) => onUpdate({ shortDescription: e.target.value })}
                  placeholder="Ex. Restaurant méditerranéen branché · Grillades au feu de bois"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">
                  Description complète <span className="text-ink/35">(optionnel, affiché dans le tiroir de détail)</span>
                </label>
                <textarea
                  rows={4}
                  value={establishment.description ?? ""}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Présentation détaillée du lieu, de son histoire, de son ambiance ou du programme de l'événement..."
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 2 : SPÉCIFICITÉS CATÉGORIELLES DYNAMIQUES
        ========================================================================= */}
        {activeTab === "category" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">
                Spécificités métier ({currentRubric?.name || "Catégorie"})
              </h3>
              <p className="text-xs text-ink/45">
                Champs contextuels adaptés automatiquement selon votre activité.
              </p>
            </div>

            {/* A. SPÉCIFIQUE RESTAURANTS / FOOD / BRUNCH / PATISSERIES */}
            {isFoodCategory && (
              <div className="space-y-5 rounded-2xl border border-moss/15 bg-sage/20 p-5">
                <div className="flex items-center gap-2 text-moss font-bold text-sm">
                  <UtensilsCrossed size={16} /> Informations Restauration & Cacherout
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Type de cacherout</label>
                    <select
                      value={establishment.kosherType || ""}
                      onChange={(e) => onUpdate({ kosherType: e.target.value as KosherType })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss"
                    >
                      <option value="">Non spécifié / Non applicable</option>
                      <option value="Bassari">Bassari (Viande)</option>
                      <option value="Halavi">Halavi (Lait)</option>
                      <option value="Parvé">Parvé</option>
                      <option value="No Teouda / Friendly">No Teouda / Friendly</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Certification de cacherout</label>
                    <select
                      value={establishment.certification || ""}
                      onChange={(e) => onUpdate({ certification: e.target.value })}
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss"
                    >
                      <option value="">Aucune / Non applicable</option>
                      {certifications
                        .filter((c) => c.status !== "Masqué")
                        .map((cert) => (
                          <option key={cert.id} value={cert.label}>
                            ✡ {cert.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Fourchette de prix</label>
                    <input
                      type="text"
                      value={establishment.averagePrice ?? ""}
                      onChange={(e) => onUpdate({ averagePrice: e.target.value })}
                      placeholder="Ex. €€ (25-40 €)"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 items-start">
                  <div>
                    <CuisineTypesSelector
                      value={establishment.cuisineTypes ?? []}
                      availableOptions={allAvailableCuisineTypes || defaultCuisineOptions}
                      onChange={(cuisineTypes) => onUpdate({ cuisineTypes })}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">URL Réservation table</label>
                    <input
                      type="url"
                      value={establishment.reservationTarget ?? ""}
                      onChange={(e) => onUpdate({ reservationTarget: e.target.value })}
                      placeholder="https://zenith.app/reserver/..."
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Lien Deliveroo direct</label>
                    <input
                      type="url"
                      value={establishment.deliverooUrl ?? ""}
                      onChange={(e) => onUpdate({ deliverooUrl: e.target.value })}
                      placeholder="https://deliveroo.fr/fr/restaurants/..."
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Lien Uber Eats direct</label>
                    <input
                      type="url"
                      value={establishment.uberEatsUrl ?? ""}
                      onChange={(e) => onUpdate({ uberEatsUrl: e.target.value })}
                      placeholder="https://www.ubereats.com/fr/store/..."
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* B. SPÉCIFIQUE ÉVÉNEMENTS / SORTIES */}
            {isEventCategory && (
              <div className="space-y-5 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <Calendar size={16} /> Paramètres de l&apos;Événement
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Date de l&apos;événement</label>
                    <input
                      type="text"
                      value={establishment.hours ?? ""}
                      onChange={(e) => onUpdate({ hours: e.target.value })}
                      placeholder="Ex. 15 Octobre 2026 ou Tous les jeudis"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Tarif / Entrée</label>
                    <input
                      type="text"
                      value={establishment.averagePrice ?? ""}
                      onChange={(e) => onUpdate({ averagePrice: e.target.value })}
                      placeholder="Ex. Gratuit ou Dès 20 €"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Organisateur / Lieu</label>
                    <input
                      type="text"
                      value={establishment.shortDescription ?? ""}
                      onChange={(e) => onUpdate({ shortDescription: e.target.value })}
                      placeholder="Ex. Salons Hoche · Liberty Events"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/70">
                    Lien Billetterie / Inscription en ligne
                  </label>
                  <input
                    type="url"
                    value={establishment.reservationTarget ?? ""}
                    onChange={(e) => onUpdate({ reservationTarget: e.target.value })}
                    placeholder="https://billetterie.example.com/evenement-123"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                  />
                </div>
              </div>
            )}

            {/* C. SPÉCIFIQUE BEAUTÉ / SOINS FÉMININS */}
            {isBeautyCategory && (
              <div className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50/30 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <Sparkles size={16} /> Prestations Beauté & Soins Féminins
                  </div>
                  {onGoToBeauty && (
                    <button
                      type="button"
                      onClick={onGoToBeauty}
                      className="rounded-full bg-ink px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-moss cursor-pointer"
                    >
                      Ouvrir le module Beauté →
                    </button>
                  )}
                </div>

                <p className="text-xs text-ink/55">
                  {(establishment.beautyServices ?? []).length} prestation(s) rattachée(s) à cette professionnelle.
                </p>

                <div className="flex flex-wrap gap-2">
                  {(establishment.beautyServices ?? []).length > 0 ? (
                    establishment.beautyServices?.map((service: BeautyProfessionalService) => (
                      <span
                        key={service.id}
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow-2xs"
                      >
                        {service.serviceName}{" "}
                        {service.price ? `· ${service.price} €` : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-ink/40">Aucune prestation configurée pour le moment.</span>
                  )}
                </div>
              </div>
            )}

            {/* D. SPÉCIFIQUE SHOPPING & AUTRES */}
            {isShoppingCategory && (
              <div className="space-y-4 rounded-2xl border border-black/10 bg-cream/30 p-5">
                <div className="flex items-center gap-2 text-ink font-bold text-sm">
                  <Store size={16} /> Boutique & Shopping
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Type de boutique</label>
                    <input
                      type="text"
                      value={establishment.shortDescription ?? ""}
                      onChange={(e) => onUpdate({ shortDescription: e.target.value })}
                      placeholder="Ex. Prêt-à-porter féminin · Vêtements tsniout"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Fourchette de prix</label>
                    <input
                      type="text"
                      value={establishment.averagePrice ?? ""}
                      onChange={(e) => onUpdate({ averagePrice: e.target.value })}
                      placeholder="Ex. €€"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* E. SPÉCIFIQUE VIN & SPIRITUEUX */}
            {isWineCategory && (
              <div className="space-y-4 rounded-2xl border border-purple-200 bg-purple-50/30 p-5">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                  <Store size={16} /> Caviste & Dégustations
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Type d&apos;activité</label>
                    <input
                      type="text"
                      value={establishment.shortDescription ?? ""}
                      onChange={(e) => onUpdate({ shortDescription: e.target.value })}
                      placeholder="Ex. Caviste grand cru · Masterclass dégustation"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-ink/70">Lien Boutique / Réservation</label>
                    <input
                      type="url"
                      value={establishment.reservationTarget ?? ""}
                      onChange={(e) => onUpdate({ reservationTarget: e.target.value })}
                      placeholder="https://winess.com/reserver"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ONGLET 3 : PHOTOS & GALERIE DÉTERMINISTE
        ========================================================================= */}
        {activeTab === "photos" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">Galerie photos déterministe</h3>
                <p className="text-xs text-ink/45">
                  La <strong>Photo 1</strong> sera systématiquement utilisée sur les cartes de liste et en couverture du tiroir.
                </p>
              </div>

              {onSyncGooglePhotos && (
                <button
                  type="button"
                  onClick={onSyncGooglePhotos}
                  className="flex items-center gap-1.5 rounded-full bg-[#f6ecd9] px-4 py-2 text-xs font-bold text-[#8f6424] shadow-xs transition hover:bg-[#8f6424] hover:text-white cursor-pointer"
                >
                  <Sparkles size={14} /> Synchroniser Google Photos
                </button>
              )}
            </div>

            {/* Photo 1 Principale */}
            <div className="rounded-3xl border-2 border-moss/30 bg-sage/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-moss px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                  ★ Photo 1 (Vitrine & Couverture)
                </span>
                {establishment.mainPhoto && (
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(establishment.mainPhoto)}
                    className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-[200px_1fr] md:items-center">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-cream border">
                  {establishment.mainPhoto ? (
                    <img
                      src={assetPath(establishment.mainPhoto)}
                      alt="Photo principale"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-xs text-ink/35">
                      Aucune photo
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={establishment.mainPhoto ?? ""}
                    onChange={(e) => onUpdate({ mainPhoto: e.target.value })}
                    placeholder="URL de la photo principale (/images/... ou https://...)"
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-xs font-medium outline-hidden focus:border-moss"
                  />

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cream px-4 py-2 text-xs font-bold text-ink transition hover:bg-sage hover:text-moss">
                    <ImageIcon size={14} /> {uploadingMain ? "Envoi en cours..." : "Téléverser une image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingMain}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadMainPhoto(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Photos secondaires / Galerie */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-ink">
                  Photos secondaires ({allPhotos.length > 1 ? allPhotos.length - 1 : 0})
                </h4>
                {galleryUploadMessage && (
                  <span className="text-xs font-semibold text-moss">{galleryUploadMessage}</span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {allPhotos.slice(1).map((photoUrl: string, index: number) => {
                  const trueIndex = index + 1;
                  return (
                    <div
                      key={photoUrl + index}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-3 shadow-2xs"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-cream">
                        <img
                          src={assetPath(photoUrl)}
                          alt={`Photo ${trueIndex + 1}`}
                          className="size-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                          Photo {trueIndex + 1}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetMainPhoto(photoUrl)}
                          title="Définir en Photo 1"
                          className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-ink transition hover:bg-moss hover:text-white cursor-pointer"
                        >
                          ★ Photo 1
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(trueIndex, -1)}
                            disabled={trueIndex <= 1}
                            title="Déplacer vers le haut"
                            className="grid size-7 place-items-center rounded-full bg-cream text-ink/70 transition hover:bg-sage hover:text-moss disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(trueIndex, 1)}
                            disabled={trueIndex >= allPhotos.length - 1}
                            title="Déplacer vers le bas"
                            className="grid size-7 place-items-center rounded-full bg-cream text-ink/70 transition hover:bg-sage hover:text-moss disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photoUrl)}
                            title="Supprimer"
                            className="grid size-7 place-items-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ajouter une nouvelle photo */}
              <div className="mt-5 rounded-2xl border border-dashed border-black/15 bg-cream/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Coller l'URL d'une nouvelle photo..."
                    className="flex-1 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-medium outline-hidden focus:border-moss"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    disabled={!newPhotoUrl.trim()}
                    className="rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-moss disabled:opacity-40 cursor-pointer"
                  >
                    + Ajouter via URL
                  </button>

                  <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-cream px-4 py-2 text-xs font-bold text-ink transition hover:bg-sage hover:text-moss">
                    <ImageIcon size={14} /> {uploadingGallery ? "Téléversement..." : "Envoyer un fichier"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingGallery}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadGalleryPhoto(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 4 : LOCALISATION & MÉTRO
        ========================================================================= */}
        {activeTab === "location" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Adresse & Accès Métro</h3>
              <p className="text-xs text-ink/45">
                Renseignez la localisation exacte pour afficher le métro et les itinéraires Maps/Waze.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Adresse postale</label>
                <input
                  type="text"
                  value={establishment.address ?? ""}
                  onChange={(e) => onUpdate({ address: e.target.value })}
                  placeholder="Ex. 14 rue de Paradis"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Ville</label>
                <input
                  type="text"
                  value={establishment.city ?? "Paris"}
                  onChange={(e) => onUpdate({ city: e.target.value })}
                  placeholder="Paris"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Arrondissement / Quartier</label>
                <input
                  type="text"
                  value={establishment.arrondissement ?? ""}
                  onChange={(e) => onUpdate({ arrondissement: e.target.value })}
                  placeholder="Ex. 10e ou 17e"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Code postal</label>
                <input
                  type="text"
                  value={establishment.postalCode ?? ""}
                  onChange={(e) => onUpdate({ postalCode: e.target.value })}
                  placeholder="75010"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Pays</label>
                <input
                  type="text"
                  value={establishment.country ?? "France"}
                  onChange={(e) => onUpdate({ country: e.target.value })}
                  placeholder="France"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/20"
                />
              </div>
            </div>

            {/* Transport & Métro avec Preview de Ligne */}
            <div className="rounded-2xl border border-moss/20 bg-sage/15 p-5">
              <div className="flex items-center gap-2 text-moss font-bold text-sm mb-4">
                <Car size={16} /> Métro le plus proche (Optionnel)
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/70">
                    Station de métro
                  </label>
                  <input
                    type="text"
                    value={establishment.nearestMetroName ?? ""}
                    onChange={(e) => onUpdate({ nearestMetroName: e.target.value })}
                    placeholder="Ex. Ternes, Château d'Eau, Gare du Nord..."
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/70">
                    Ligne (1 à 14, 3bis, 7bis)
                  </label>
                  <input
                    type="text"
                    value={establishment.nearestMetroLine ?? ""}
                    onChange={(e) => onUpdate({ nearestMetroLine: e.target.value })}
                    placeholder="Ex. 2, 4, 7..."
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-hidden focus:border-moss"
                  />
                </div>
              </div>

              {/* Aperçu du badge métro */}
              {establishment.nearestMetroName && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs text-ink/50 font-medium">Aperçu carte :</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-ink shadow-2xs">
                    <span>Métro {establishment.nearestMetroName}</span>
                    {metroStyle && (
                      <span
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[9px] font-black"
                        style={{
                          backgroundColor: metroStyle.background,
                          color: metroStyle.foreground,
                          borderColor: metroStyle.border,
                        }}
                      >
                        {metroStyle.label}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Coordonnées GPS */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Latitude GPS</label>
                <input
                  type="text"
                  value={establishment.latitude ?? ""}
                  onChange={(e) => onUpdate({ latitude: e.target.value })}
                  placeholder="48.8566"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Longitude GPS</label>
                <input
                  type="text"
                  value={establishment.longitude ?? ""}
                  onChange={(e) => onUpdate({ longitude: e.target.value })}
                  placeholder="2.3522"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 5 : CONTACT & RÉSEAUX
        ========================================================================= */}
        {activeTab === "contact" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Contact & Réseaux sociaux</h3>
              <p className="text-xs text-ink/45">
                Tous les champs sont optionnels. Les boutons correspondants ne s&apos;affichent que si une information valide est renseignée.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Téléphone</label>
                <input
                  type="tel"
                  value={establishment.phone ?? ""}
                  onChange={(e) => onUpdate({ phone: e.target.value })}
                  placeholder="Ex. 01 42 68 00 00"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Numéro WhatsApp</label>
                <input
                  type="tel"
                  value={establishment.whatsapp ?? ""}
                  onChange={(e) => onUpdate({ whatsapp: e.target.value })}
                  placeholder="Ex. +33 6 12 34 56 78"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Email de contact</label>
                <input
                  type="email"
                  value={establishment.email ?? ""}
                  onChange={(e) => onUpdate({ email: e.target.value })}
                  placeholder="contact@etablissement.com"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-ink/70">
                  <span>Profil Instagram</span>
                  {establishment.instagram && (
                    <span className="text-[10px] text-moss font-semibold">
                      → {safeExternalUrl(establishment.instagram)}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={establishment.instagram ?? ""}
                  onChange={(e) => onUpdate({ instagram: e.target.value })}
                  placeholder="Ex. @barbanegra_paris ou lien complet"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-bold text-ink/70">Site internet officiel</label>
                <input
                  type="url"
                  value={establishment.website ?? ""}
                  onChange={(e) => onUpdate({ website: e.target.value })}
                  placeholder="https://www.barbanegra-paris.fr"
                  className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 6 : HORAIRES & SERVICES
        ========================================================================= */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Horaires & Commodités</h3>
              <p className="text-xs text-ink/45">
                Renseignez les créneaux d&apos;ouverture pour le calcul automatique de l&apos;état Ouvert/Fermé.
              </p>
            </div>

            {/* Horaires par jour */}
            <div className="rounded-2xl border border-black/10 bg-cream/20 p-5">
              <label className="mb-2 block text-xs font-bold text-ink/70">
                Grille des horaires (Format texte par ligne : &quot;lundi: 12:00-15:00, 19:00-23:00&quot;)
              </label>
              <textarea
                rows={7}
                value={establishment.hours ?? ""}
                onChange={(e) => onUpdate({ hours: e.target.value })}
                placeholder={`lundi: 12:00-15:00, 19:00-23:00\nmardi: 12:00-15:00, 19:00-23:00\nmercredi: 12:00-15:00, 19:00-23:00\njeudi: 12:00-15:00, 19:00-23:00\nvendredi: 12:00-15:00\nsamedi: Fermé\ndimanche: 12:00-23:00`}
                className="w-full font-mono rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs outline-hidden focus:border-moss"
              />
            </div>

            {/* Services & Commodités Toggles */}
            <div>
              <h4 className="text-sm font-bold text-ink mb-3">Commodités proposées</h4>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {[
                  { key: "terrace" as const, label: "Terrasse extérieure", icon: Store },
                  { key: "takeaway" as const, label: "Vente à emporter", icon: UtensilsCrossed },
                  { key: "delivery" as const, label: "Service livraison", icon: Car },
                  { key: "reservation" as const, label: "Réservation acceptée", icon: CalendarDays },
                  { key: "privateHire" as const, label: "Privatisation possible", icon: Building2 },
                ].map(({ key, label, icon: Icon }) => {
                  const checked = Boolean(establishment[key]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onUpdate({ [key]: !checked })}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
                        checked
                          ? "border-moss bg-sage/40 text-moss font-bold"
                          : "border-black/10 bg-white text-ink/60 hover:bg-cream"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <Icon size={16} />
                        <span>{label}</span>
                      </div>
                      <span
                        className={`size-4 rounded-full border transition ${
                          checked ? "border-moss bg-moss" : "border-black/20 bg-white"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 7 : TAGS & CERTIFICATIONS
        ========================================================================= */}
        {activeTab === "tags" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Tags & Mots-clés de recherche</h3>
              <p className="text-xs text-ink/45">
                Les tags sont 100% facultatifs. 0 tag sélectionné est un état tout à fait valide.
              </p>
            </div>

            {/* Tags visibles sélectionnés */}
            <div className="rounded-2xl border border-black/10 bg-cream/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-ink">
                  Tags visibles sur la fiche ({establishment.visibleTagIds?.length || 0})
                </span>
                {onAddTag && (
                  <button
                    type="button"
                    onClick={onAddTag}
                    className="text-xs font-bold text-moss hover:underline cursor-pointer"
                  >
                    + Créer un nouveau tag global
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 min-h-10 items-center">
                {establishment.visibleTagIds && establishment.visibleTagIds.length > 0 ? (
                  establishment.visibleTagIds.map((tagId: string) => {
                    const tag = tags.find((t) => t.id === tagId);
                    return (
                      <button
                        key={tagId}
                        type="button"
                        onClick={() =>
                          onUpdate({
                            visibleTagIds: (establishment.visibleTagIds ?? []).filter((id: string) => id !== tagId),
                          })
                        }
                        className="flex items-center gap-1.5 rounded-full bg-sage px-3.5 py-1.5 text-xs font-bold text-moss transition hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                        title="Cliquer pour retirer ce tag"
                      >
                        <span>{tag?.label || tagId}</span>
                        <X size={12} />
                      </button>
                    );
                  })
                ) : (
                  <span className="text-xs text-ink/40 italic">
                    Aucun tag sélectionné (Optionnel).
                  </span>
                )}
              </div>

              {/* Recherche de tags à ajouter */}
              <div className="mt-4 pt-4 border-t border-black/5">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Rechercher un tag à ajouter (terrasse, bassari, buffet, musique live...)"
                    className="w-full rounded-xl border border-black/10 bg-white pl-9 pr-4 py-2 text-xs font-medium outline-hidden focus:border-moss"
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {tags
                    .filter((t) => t.status !== "Masqué")
                    .filter((t, idx, arr) => arr.findIndex((x) => x.label.trim().toLowerCase() === t.label.trim().toLowerCase() || x.id === t.id) === idx)
                    .filter(
                      (t) =>
                        !tagSearch.trim() ||
                        t.label.toLowerCase().includes(tagSearch.toLowerCase())
                    )
                    .slice(0, 40)
                    .map((tag) => {
                      const isSelected = establishment.visibleTagIds?.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const current = establishment.visibleTagIds ?? [];
                            const next = isSelected
                              ? current.filter((id: string) => id !== tag.id)
                              : [...new Set([...current, tag.id])];
                            onUpdate({
                              visibleTagIds: next,
                            });
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                            isSelected
                              ? "bg-moss text-white font-bold"
                              : "bg-cream text-ink/65 hover:bg-sage hover:text-moss"
                          }`}
                        >
                          {isSelected ? `✓ ${tag.label}` : `+ ${tag.label}`}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Recherches clients / Mots-clés IA */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/70">
                Mots-clés de recherche clients (Indexation IA & Moteur de recherche)
              </label>
              <input
                type="text"
                value={(establishment.customerSearches ?? []).join(", ")}
                onChange={(e) => onUpdate({ customerSearches: cleanTextList(e.target.value) })}
                placeholder="Ex. viande cacher, burger gourmet, anniversaire, traiteur shabbat"
                className="w-full rounded-2xl border border-black/10 bg-cream/30 px-4 py-3 text-sm font-medium outline-hidden focus:border-moss focus:bg-white"
              />
              <p className="mt-1 text-[11px] text-ink/40">
                Séparez les expressions par des virgules. Utilisé pour booster la pertinence de la recherche instantanée.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 8 : VISIBILITÉ & SPONSORING
        ========================================================================= */}
        {activeTab === "visibility" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Contrôle de visibilité & Sponsoring</h3>
              <p className="text-xs text-ink/45">
                Masquez certains blocs si vous ne souhaitez pas les afficher sur la fiche publique.
              </p>
            </div>

            {/* Sponsoring & Mise en avant */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-4">
                <Megaphone size={16} /> Mise en avant sponsorisée
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/70">Niveau de mise en avant</label>
                  <select
                    value={establishment.sponsorshipLevel ?? "Standard"}
                    onChange={(e) => {
                      const level = e.target.value as SponsorshipLevel;
                      onUpdate({
                        sponsorshipLevel: level,
                        sponsored: level !== "Standard",
                      });
                    }}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold outline-hidden focus:border-moss"
                  >
                    <option value="Standard">Standard (Gratuit)</option>
                    <option value="Featured">Featured (Badge Sponsorisé)</option>
                    <option value="Premium">Premium (Mise en avant VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/70">Priorité de tri (0 à 100)</label>
                  <input
                    type="number"
                    value={establishment.sponsorPriority ?? 0}
                    onChange={(e) => onUpdate({ sponsorPriority: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-bold outline-hidden focus:border-moss"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-ink/70">Durée sponsorisée</label>
                  <input
                    type="text"
                    value={establishment.sponsorDuration ?? ""}
                    onChange={(e) => onUpdate({ sponsorDuration: e.target.value })}
                    placeholder="Ex. 1 mois, Permanent..."
                    className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium outline-hidden focus:border-moss"
                  />
                </div>
              </div>
            </div>

            {/* Visibilité des champs individuels */}
            <div>
              <h4 className="text-sm font-bold text-ink mb-3">Champs activés sur la fiche publique</h4>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {visibilityLabels.map(({ key, label, description }) => {
                  const visibility: FieldVisibility = establishment.fieldVisibility ?? {};
                  const isVisible = visibility[key] !== false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        onUpdate({
                          fieldVisibility: {
                            ...visibility,
                            [key]: !isVisible,
                          },
                        })
                      }
                      className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition cursor-pointer ${
                        isVisible
                          ? "border-moss/30 bg-sage/20 text-ink"
                          : "border-black/10 bg-zinc-50 text-ink/40 opacity-70"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold">{label}</span>
                        {isVisible ? (
                          <Eye size={14} className="text-moss" />
                        ) : (
                          <EyeOff size={14} className="text-ink/30" />
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-ink/45 line-clamp-1">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ONGLET 9 : APERÇU EN DIRECT
        ========================================================================= */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-ink">Aperçu de la fiche publique autonome</h3>
              <p className="text-xs text-ink/45">
                Rendu exact de votre fiche autonome telle qu&apos;elle apparaît sur le site public. Cliquez sur la photo pour tester le zoom Lightbox.
              </p>
            </div>

            <div className="max-w-md mx-auto py-4">
              <UniversalEstablishmentCard
                establishment={establishment}
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Barre d'Action & Enregistrement Fixe */}
      <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-black/[.08] bg-white/95 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {savingAction ? (
            <span className="flex items-center gap-2 text-xs font-bold text-moss animate-pulse">
              <span className="size-2 rounded-full bg-moss" />
              {savingAction}
            </span>
          ) : (
            <span className="text-xs text-ink/45 font-medium">
              Statut actuel : <strong className="text-ink">{establishment.status}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onDraft}
            className="rounded-full bg-cream px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-sage hover:text-moss disabled:opacity-50 cursor-pointer"
          >
            Enregistrer le brouillon
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onPublish}
            className="rounded-full bg-ink px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:bg-moss hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            Publier la fiche
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onHide}
            className="rounded-full bg-zinc-100 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-200 disabled:opacity-50 cursor-pointer"
          >
            Masquer
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={onTrash}
            className="grid size-9 place-items-center rounded-full bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 cursor-pointer"
            title="Envoyer dans la corbeille"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
