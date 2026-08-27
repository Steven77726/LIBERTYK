"use client";

import { useEffect, useState } from "react";
import type { WineActivity } from "@/data/wine-activities";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";

const activityToEstablishmentRecord = (activity: WineActivity, index: number): EstablishmentRecord => ({
  id: activity.slug,
  rubricId: "vin-spiritueux",
  subrubricId: "selections",
  mainPhoto: activity.image,
  photos: [],
  name: activity.title,
  slug: activity.slug,
  shortDescription: `${activity.type} · Vin & Spiritueux`,
  description: activity.description,
  address: activity.address ?? "",
  city: "Paris",
  arrondissement: activity.address?.includes("75017") ? "17e" : "",
  postalCode: activity.address?.match(/750\d{2}/)?.[0] ?? "",
  country: "France",
  email: "",
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
  certification: "",
  kosherType: "Parvé",
  averagePrice: "€€€",
  latitude: "",
  longitude: "",
  status: "Publié",
  visible: true,
  sponsorshipLevel: "Premium",
  sponsored: true,
  sponsorPriority: index + 1,
  sponsorDuration: "",
  sponsorStartsAt: "",
  sponsorEndsAt: "",
  sponsorPlacement: "",
  sponsorNotes: "",
  reservationTarget: activity.website ?? "",
  cuisineTypes: ["Vin & Spiritueux", activity.type, ...activity.tags],
  order: index + 1,
  customerSearches: [],
  visibleTagIds: activity.tags,
  fieldVisibility: {},
});

export function WineActivityGrid({ activities }: { activities: WineActivity[] }) {
  const [activityData, setActivityData] = useState<EstablishmentRecord[]>(() => activities.map(activityToEstablishmentRecord));
  const [selected, setSelected] = useState<EstablishmentRecord | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const records = await listPublishedEstablishments({ rubricSlug: "vin-spiritueux" }).catch(() => null);
      if (!mounted) return;
      setActivityData(records?.length ? records : activities.map(activityToEstablishmentRecord));
    };
    void load();
    const refresh = () => void load();
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, [activities]);

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        {activityData.map((activity, index) => (
          <UniversalEstablishmentCard
            key={activity.id}
            establishment={activity}
            onOpen={() => setSelected(activity)}
            priorityImage={index < 2}
          />
        ))}
      </div>
      <EstablishmentDetailDrawer establishment={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
