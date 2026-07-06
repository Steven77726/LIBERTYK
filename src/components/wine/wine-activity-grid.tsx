"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink, MapPin, Wine } from "lucide-react";
import type { WineActivity } from "@/data/wine-activities";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { assetPath } from "@/lib/assets";

export function WineActivityGrid({ activities }: { activities: WineActivity[] }) {
  const [selected, setSelected] = useState<WineActivity | null>(null);
  return (
    <>
      <div className="grid gap-5 md:grid-cols-2">
        {activities.map((activity) => (
          <article key={activity.slug} className="group overflow-hidden rounded-[2rem] border border-black/[.055] bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-soft">
            <button onClick={() => setSelected(activity)} className="block w-full text-left">
              <div className="relative aspect-[16/10] overflow-hidden bg-ink"><img src={assetPath(activity.image)} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: activity.imagePosition }} /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/5" /><div className="absolute right-5 top-5"><RecommendationBadge rating={activity.rating} reviewCount={activity.reviewCount} /></div><span className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-black/25 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-white backdrop-blur">{activity.type}</span></div>
              <div className="p-6 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold tracking-[-.04em]">{activity.title}</h2>{activity.address && <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/45"><MapPin size={13} />{activity.address}</p>}</div><span className="grid size-10 shrink-0 place-items-center rounded-full bg-cream transition group-hover:bg-ink group-hover:text-white"><ArrowRight size={16} /></span></div><p className="mt-4 max-w-xl text-sm leading-6 text-ink/52">{activity.description}</p><div className="mt-3"><CustomerRating rating={activity.rating} reviewCount={activity.reviewCount} /></div><div className="mt-5 flex flex-wrap gap-2">{activity.tags.map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-2 text-[11px] text-ink/65">{tag}</span>)}</div></div>
            </button>
            {activity.website && <div className="px-6 pb-6 sm:px-7 sm:pb-7"><a href={activity.website} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-white">🌐 {activity.action} <ExternalLink size={13} /></a></div>}
          </article>
        ))}
      </div>
      <EntityDrawer open={!!selected} onClose={() => setSelected(null)} title={selected?.title ?? "Vin & Spiritueux"}>
        {selected && <div><div className="relative aspect-[4/3]"><img src={assetPath(selected.image)} alt="" className="size-full object-cover" style={{ objectPosition: selected.imagePosition }} /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-5 left-5 text-white"><Wine size={20} /><p className="mt-3 text-xs text-white/55">{selected.type}</p><h2 className="mt-1 text-3xl font-semibold">{selected.title}</h2></div></div><div className="space-y-6 p-6"><CustomerRating rating={selected.rating} reviewCount={selected.reviewCount} /><p className="text-sm leading-7 text-ink/55">{selected.description}</p><div className="flex flex-wrap gap-2">{selected.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-2 text-xs">{tag}</span>)}</div>{selected.address && <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Adresse</p><p className="mt-2 text-sm">{selected.address}</p></div>}{selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-ink py-4 text-sm font-semibold text-white">{selected.action} <ExternalLink size={15} /></a>}</div></div>}
      </EntityDrawer>
    </>
  );
}
