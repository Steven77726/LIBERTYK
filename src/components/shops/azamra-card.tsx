"use client";

import { useEffect, useState } from "react";
import { azamra } from "@/data/shops";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";

const azamraToEstablishmentRecord = (): EstablishmentRecord => ({
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

export function AzamraCard() {
  const [shopRecord, setShopRecord] = useState<EstablishmentRecord>(() => azamraToEstablishmentRecord());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // 1. Chercher dans le cache local admin
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
              setShopRecord({
                ...azamraToEstablishmentRecord(),
                ...localAzamra,
              });
            }
          }
        } catch {
          // ignore
        }
      }

      // 2. Chercher dans Supabase
      try {
        const records = await listPublishedEstablishments({ rubricSlug: "shopping" }).catch(() => null);
        const azamraRecord = records?.find(
          (item) => item.slug === "azamra" || item.id === "azamra" || (item.name || "").toLowerCase().includes("azamra")
        ) ?? records?.[0];
        if (mounted && azamraRecord) {
          setShopRecord({
            ...azamraToEstablishmentRecord(),
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

  return (
    <UniversalEstablishmentCard
      establishment={shopRecord}
    />
  );
}
