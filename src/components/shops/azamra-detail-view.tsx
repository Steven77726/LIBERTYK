"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Globe2,
  Instagram,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Shirt,
} from "lucide-react";
import { azamra } from "@/data/shops";
import { assetPath } from "@/lib/assets";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { LikeButton, ShareButton } from "@/components/ui/entity-actions";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { PhotoLightboxModal } from "@/components/ui/photo-lightbox-modal";
import { getEstablishmentGoogleBusiness } from "@/lib/google-places";

const azamraDefaultRecord = (): EstablishmentRecord => ({
  id: "azamra",
  rubricId: "shopping",
  subrubricId: "vetement-feminin",
  mainPhoto: azamra.image,
  photos: azamra.photos,
  photoAlts: ["Azamra Boutique", "Azamra Collection 1", "Azamra Collection 2", "Azamra Collection 3"],
  name: azamra.name,
  slug: azamra.slug,
  shortDescription: `${azamra.type} · Shopping`,
  description: azamra.description,
  address: azamra.address,
  city: azamra.city,
  arrondissement: azamra.arrondissement,
  postalCode: azamra.postalCode,
  country: azamra.country,
  nearestMetroName: azamra.nearestMetroName,
  nearestMetroLine: azamra.nearestMetroLine,
  email: "contact@azamra.fr",
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
  visible: true,
  sponsorshipLevel: "Standard",
  sponsored: false,
  sponsorPriority: 0,
  sponsorDuration: "",
  sponsorStartsAt: "",
  sponsorEndsAt: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: "",
  cuisineTypes: [],
  order: 1,
  customerSearches: ["azamra", "vêtements", "mode", "homme", "femme", "enfant"],
  visibleTagIds: azamra.tags,
  fieldVisibility: {
    address: true,
    phone: true,
    instagram: true,
    website: true,
    opening_hours: true,
    reviews: true,
    gallery: true,
  },
});

function safeExternalUrl(value?: string | null): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|whatsapp:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return `https://instagram.com/${trimmed.slice(1)}`;
  if (/^[a-zA-Z0-9_.-]+$/.test(trimmed) && !trimmed.includes("/")) {
    return `https://instagram.com/${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function AzamraDetailView() {
  const [record, setRecord] = useState<EstablishmentRecord>(() => azamraDefaultRecord());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // 1. Local admin cache
      if (typeof window !== "undefined") {
        try {
          const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            const ests = (parsed?.establishments as EstablishmentRecord[]) ?? [];
            const localAzamra = ests.find(
              (item) => item.id === "azamra" || item.slug === "azamra" || (item.name || "").toLowerCase().includes("azamra")
            );
            if (localAzamra && mounted) {
              setRecord({
                ...azamraDefaultRecord(),
                ...localAzamra,
              });
            }
          }
        } catch {
          // ignore
        }
      }

      // 2. Supabase
      try {
        const records = await listPublishedEstablishments({ rubricSlug: "shopping" }).catch(() => null);
        const azamraRecord = records?.find(
          (item) => item.slug === "azamra" || item.id === "azamra" || (item.name || "").toLowerCase().includes("azamra")
        ) ?? records?.[0];
        if (mounted && azamraRecord) {
          setRecord({
            ...azamraDefaultRecord(),
            ...azamraRecord,
          });
        }
      } catch {
        // ignore
      }
    };

    void load();
    const refresh = () => void load();
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, []);

  const googleData = getEstablishmentGoogleBusiness(record.name || "Azamra");
  const metroStyle = record.nearestMetroLine ? getMetroLineStyle(record.nearestMetroLine) : null;
  const allPhotos = [record.mainPhoto, ...(record.photos ?? [])].filter(Boolean) as string[];

  const fullAddress = [record.address, record.postalCode, record.city].filter(Boolean).join(", ");
  const mapsUrl = record.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || record.name)}`
    : googleData.googleMapsUrl;
  const wazeUrl = record.latitude && record.longitude
    ? `https://waze.com/ul?ll=${record.latitude},${record.longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(fullAddress || record.name)}&navigate=yes`;

  return (
    <section className="page-shell py-8 sm:py-12">
      {/* Navigation retour */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/shopping/vetements"
          className="inline-flex items-center gap-2 text-xs font-bold text-ink/60 transition hover:text-moss"
        >
          <ArrowLeft size={14} /> Retour à Vêtements
        </Link>
      </div>

      <div className="overflow-hidden rounded-[2.25rem] bg-white shadow-soft border border-black/[.05]">
        {/* Grande Couverture / Galerie (clic photo = zoom lightbox) */}
        <div className="relative min-h-[420px] sm:min-h-[500px] bg-sage select-none overflow-hidden cursor-pointer">
          <img
            src={assetPath(allPhotos[activePhoto] || record.mainPhoto || "/images/shopping/azamra.jpg")}
            alt={record.name}
            onClick={() => {
              setLightboxIndex(activePhoto);
              setLightboxOpen(true);
            }}
            title="Cliquer pour agrandir la photo"
            className="absolute inset-0 size-full object-cover object-center transition duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20 pointer-events-none" />

          {/* Badges supérieurs */}
          <div className="absolute left-6 top-6 right-6 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <RecommendationBadge rating={googleData.rating} reviewCount={googleData.userRatingsTotal} />
              {record.sponsored && (
                <span className="w-fit rounded-full bg-[#f6ecd9] px-3 py-1 text-xs font-bold text-[#8f6424] shadow-xs">
                  Sponsorisé
                </span>
              )}
            </div>
            <LikeButton
              entity={{
                id: "shop-azamra",
                title: record.name,
                url: "/shopping/vetements/azamra",
                text: `${record.name} · ${record.shortDescription || record.address}`,
              }}
            />
          </div>

          {/* Sélecteur de miniatures photos */}
          {allPhotos.length > 1 && (
            <div className="absolute bottom-28 left-6 right-6 flex gap-2 overflow-x-auto pb-2">
              {allPhotos.map((p, idx) => (
                <button
                  key={p + idx}
                  type="button"
                  onClick={() => setActivePhoto(idx)}
                  className={`size-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    activePhoto === idx ? "border-white scale-105 shadow-md" : "border-white/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={assetPath(p)} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Titre & Informations principales sur l'image */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
            <div className="flex items-center gap-2 text-white/80">
              <Shirt size={20} />
              <span className="text-xs uppercase font-bold tracking-[.16em]">
                {record.shortDescription || "Mode & Vêtements"}
              </span>
            </div>
            <h1 className="mt-1 text-4xl sm:text-5xl font-black tracking-[-.04em]">{record.name}</h1>
            <div className="mt-3">
              <CustomerRating rating={googleData.rating} reviewCount={googleData.userRatingsTotal} light />
            </div>
          </div>
        </div>

        {/* Corps de la page */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* =========================================================================
              BLOC 1 : ADRESSE & LOCALISATION (Ce que l'admin configure dans le Dashboard)
          ========================================================================= */}
          <div className="rounded-3xl border border-black/[.08] bg-cream/30 p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-moss">
                  <MapPin size={16} /> Localisation & Adresse
                </div>
                <h3 className="mt-1.5 text-xl sm:text-2xl font-bold text-ink">
                  {record.address ? record.address : "Adresse à renseigner dans le Dashboard"}
                </h3>
                <p className="mt-1 text-sm text-ink/60">
                  {[record.postalCode, record.city, record.arrondissement ? `${record.arrondissement}` : null, record.country]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                {/* Badge Métro */}
                {record.nearestMetroName && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-ink shadow-xs">
                    <span>Métro {record.nearestMetroName}</span>
                    {metroStyle && (
                      <span
                        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-[10px] font-black"
                        style={{
                          backgroundColor: metroStyle.background,
                          color: metroStyle.foreground,
                          borderColor: metroStyle.border,
                        }}
                      >
                        {metroStyle.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Boutons Itinéraires direct */}
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl bg-white border border-black/10 px-4 py-3 text-xs font-bold text-ink shadow-2xs transition hover:bg-moss hover:text-white"
                >
                  <Navigation size={14} /> Google Maps
                </a>
                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-2xl bg-white border border-black/10 px-4 py-3 text-xs font-bold text-ink shadow-2xs transition hover:bg-[#33B5E5] hover:text-white"
                >
                  <span className="font-black text-[#33B5E5]">W</span> Waze
                </a>
              </div>
            </div>
          </div>

          {/* =========================================================================
              BLOC 2 : CONTACT & ACTIONS DIRECTES
          ========================================================================= */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink/40 mb-3">
              Contact direct & Réseaux
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {record.phone && (
                <a
                  href={`tel:${record.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white transition hover:bg-moss"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-white/15">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="block text-[11px] text-white/60 font-medium">Téléphone</span>
                    <strong className="text-xs font-bold">{record.phone}</strong>
                  </div>
                </a>
              )}

              {record.whatsapp && (
                <a
                  href={`https://wa.me/${record.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 p-4 text-[#128C7E] transition hover:bg-[#25D366] hover:text-white"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-[#25D366]/20">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <span className="block text-[11px] opacity-70 font-medium">WhatsApp</span>
                    <strong className="text-xs font-bold">Message direct</strong>
                  </div>
                </a>
              )}

              {record.instagram && (
                <a
                  href={safeExternalUrl(record.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200/60 p-4 text-rose-800 transition hover:bg-rose-600 hover:text-white"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-rose-100">
                    <Instagram size={18} />
                  </div>
                  <div>
                    <span className="block text-[11px] opacity-70 font-medium">Instagram</span>
                    <strong className="text-xs font-bold">{record.instagram}</strong>
                  </div>
                </a>
              )}

              {record.website && (
                <a
                  href={safeExternalUrl(record.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-cream border border-black/10 p-4 text-ink transition hover:bg-sage hover:text-moss"
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-white">
                    <Globe2 size={18} />
                  </div>
                  <div>
                    <span className="block text-[11px] text-ink/50 font-medium">Site officiel</span>
                    <strong className="text-xs font-bold truncate max-w-[140px] block">
                      {record.website.replace(/^https?:\/\//, "")}
                    </strong>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* =========================================================================
              BLOC 3 : DESCRIPTION & TAGS
          ========================================================================= */}
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink/40 mb-2">
                À propos de {record.name}
              </h4>
              <p className="text-base leading-relaxed text-ink/75 font-medium">
                {record.description || "Aucune description renseignée."}
              </p>

              {/* Tags */}
              {record.visibleTagIds && record.visibleTagIds.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {record.visibleTagIds.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-cream px-3.5 py-1.5 text-xs font-semibold text-ink/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Horaires d'ouverture */}
            {record.hours && (
              <div className="rounded-3xl border border-black/[.08] bg-white p-6 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-moss mb-4">
                  <Clock size={15} /> Horaires d&apos;ouverture
                </div>
                <div className="space-y-2 text-xs font-medium">
                  {record.hours.split("\n").map((line, idx) => {
                    const parts = line.split(":");
                    const day = parts[0]?.trim();
                    const hours = parts.slice(1).join(":").trim();
                    return (
                      <div
                        key={line + idx}
                        className="flex items-center justify-between border-b border-black/[.04] pb-2 last:border-0"
                      >
                        <span className="capitalize text-ink/70 font-semibold">{day}</span>
                        <span className="font-bold text-ink">{hours || "Fermé"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Partage */}
          <div className="flex items-center justify-between border-t border-black/[.06] pt-6">
            <ShareButton
              entity={{
                id: "shop-azamra",
                title: record.name,
                url: "/shopping/vetements/azamra",
                text: `${record.name} · ${record.address}`,
              }}
            />
            <p className="text-xs text-ink/40">Fiche certifiée Liberty K</p>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Plein Écran */}
      <PhotoLightboxModal
        photos={allPhotos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={record.name}
      />
    </section>
  );
}
