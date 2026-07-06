"use client";

import { useState } from "react";
import { ArrowRight, Shirt } from "lucide-react";
import { azamra } from "@/data/shops";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { EntityEngagement } from "@/components/ui/entity-engagement";

export function AzamraCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <article className="group overflow-hidden rounded-[2rem] border border-black/[.06] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
        <button onClick={() => setOpen(true)} className="w-full text-left">
          <div className="relative aspect-[4/3] overflow-hidden"><img src={azamra.image} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" /><div className="absolute left-5 top-5"><RecommendationBadge rating={azamra.rating} reviewCount={azamra.reviewCount} /></div></div>
          <div className="p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{azamra.type}</p><h2 className="mt-1 text-2xl font-semibold">{azamra.name}</h2></div><span className="grid size-10 place-items-center rounded-full bg-cream"><ArrowRight size={16} /></span></div><div className="mt-4 flex gap-2">{azamra.tags.map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-2 text-xs">{tag}</span>)}</div><div className="mt-4"><CustomerRating rating={azamra.rating} reviewCount={azamra.reviewCount} /></div></div>
        </button>
      </article>
      <EntityDrawer open={open} onClose={() => setOpen(false)} title="Azamra">
        <div><div className="relative aspect-[3/4] max-h-[65vh]"><img src={azamra.image} alt="" className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-6 left-6 text-white"><Shirt size={20} /><p className="mt-3 text-xs text-white/55">{azamra.type}</p><h2 className="mt-1 text-3xl font-semibold">{azamra.name}</h2></div></div><div className="space-y-5 p-6"><CustomerRating rating={azamra.rating} reviewCount={azamra.reviewCount} /><p className="text-sm leading-7 text-ink/55">{azamra.description}</p><div className="flex gap-2">{azamra.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-2 text-xs">{tag}</span>)}</div><EntityEngagement entityId="shop-azamra" title={azamra.name} url="/shopping/vetements/azamra" /></div></div>
      </EntityDrawer>
    </>
  );
}
