"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, MapPin } from "lucide-react";
import type { WineActivity } from "@/data/wine-activities";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { assetPath } from "@/lib/assets";
import { LikeButton } from "@/components/ui/entity-actions";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";

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

function displayType(item: EstablishmentRecord) {
  return item.shortDescription?.split("·")[0]?.trim() || "Vin & Spiritueux";
}

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
        {activityData.map((activity) => {
          const metroStyle = getMetroLineStyle(activity.nearestMetroLine);
          return (
          <article key={activity.id} className="group relative overflow-hidden rounded-[2rem] border border-black/[.055] bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-soft">
            <button onClick={() => setSelected(activity)} className="block w-full text-left">
              <div className="relative aspect-[16/10] overflow-hidden bg-ink"><img src={assetPath(activity.mainPhoto || "/images/winess/winess-shop.webp")} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/5" /><div className="absolute left-5 top-5"><RecommendationBadge rating={null} reviewCount={0} /></div><span className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-white backdrop-blur">{displayType(activity)}</span></div>
              <div className="p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-[-.04em]">{activity.name}</h2>{activity.address && <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/45"><MapPin size={13} />{activity.address}</p>}{activity.nearestMetroName && <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink/50"><span className="truncate">Métro {activity.nearestMetroName}</span>{metroStyle && <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border px-1 text-[10px] font-black" style={{ backgroundColor: metroStyle.background, color: metroStyle.foreground, borderColor: metroStyle.border }}>{metroStyle.label}</span>}</p>}</div><span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream transition group-hover:bg-ink group-hover:text-white"><ArrowRight size={16} /></span></div><p className="mt-4 max-w-xl text-sm leading-6 text-ink/52">{activity.description}</p><div className="mt-3"><CustomerRating rating={null} reviewCount={0} /></div><div className="mt-5 flex flex-wrap gap-2">{activity.visibleTagIds.slice(0, 6).map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-2 text-[11px] text-ink/65">{tag}</span>)}</div></div>
            </button>
            <div className="absolute right-5 top-5"><LikeButton entity={{ id: `establishment-${activity.id}`, title: activity.name, url: `/vin-spiritueux/selections#${activity.slug ?? activity.id}`, text: `${activity.name} · ${displayType(activity)}` }} /></div>
            {activity.website && <div className="px-6 pb-6 sm:px-7 sm:pb-7"><a href={activity.website} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-white">🌐 Visiter le site <ExternalLink size={13} /></a></div>}
          </article>
        );
        })}
      </div>
      <EstablishmentDetailDrawer establishment={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
}
