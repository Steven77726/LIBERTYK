"use client";

import { useEffect, useState } from "react";
import { azamra } from "@/data/shops";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";

const azamraToEstablishmentRecord = (): EstablishmentRecord => ({
  id: "azamra",
  rubricId: "shopping",
  subrubricId: "mode",
  mainPhoto: azamra.image,
  photos: [],
  name: azamra.name,
  slug: azamra.slug,
  shortDescription: azamra.type,
  description: azamra.description,
  address: "",
  city: "Paris",
  arrondissement: "",
  postalCode: "",
  country: "France",
  email: "",
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
  averagePrice: "",
  latitude: "",
  longitude: "",
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
  cuisineTypes: azamra.tags,
  order: 1,
  customerSearches: [],
  visibleTagIds: azamra.tags,
  fieldVisibility: {},
});

export function AzamraCard() {
  const [open, setOpen] = useState(false);
  const [shopRecord, setShopRecord] = useState<EstablishmentRecord>(() => azamraToEstablishmentRecord());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const records = await listPublishedEstablishments({ rubricSlug: "shopping", subrubricSlug: "mode" }).catch(() => null);
      const azamraRecord = records?.find((item) => (item.slug ?? item.id) === "azamra") ?? records?.[0];
      if (!mounted || !azamraRecord) return;
      setShopRecord(azamraRecord);
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
    <>
      <UniversalEstablishmentCard
        establishment={shopRecord}
        onOpen={() => setOpen(true)}
      />
      <EstablishmentDetailDrawer establishment={shopRecord} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
