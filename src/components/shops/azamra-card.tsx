"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Shirt } from "lucide-react";
import { azamra } from "@/data/shops";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { assetPath } from "@/lib/assets";
import { EntityActions, LikeButton } from "@/components/ui/entity-actions";
import { listPublishedEstablishments } from "@/lib/supabase/establishments-repository";

export function AzamraCard() {
  const [open, setOpen] = useState(false);
  const [shop, setShop] = useState(azamra);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const records = await listPublishedEstablishments({ rubricSlug: "shopping", subrubricSlug: "mode" }).catch(() => null);
      const azamraRecord = records?.find((item) => (item.slug ?? item.id) === "azamra") ?? records?.[0];
      if (!mounted || !azamraRecord) return;
      setShop({
        ...azamra,
        slug: azamraRecord.slug ?? azamraRecord.id,
        name: azamraRecord.name,
        type: azamraRecord.shortDescription?.split("·")[0]?.trim() || azamra.type,
        image: azamraRecord.mainPhoto || azamra.image,
        tags: azamraRecord.cuisineTypes?.length ? azamraRecord.cuisineTypes : azamra.tags,
        description: azamraRecord.description || azamra.description,
      });
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
      <article className="group relative overflow-hidden rounded-[2rem] border border-black/[.06] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
        <button onClick={() => setOpen(true)} className="w-full text-left">
          <div className="relative aspect-[4/3] overflow-hidden"><img src={assetPath(shop.image)} alt="" className="size-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" /><div className="absolute left-5 top-5"><RecommendationBadge rating={shop.rating} reviewCount={shop.reviewCount} /></div></div>
          <div className="p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{shop.type}</p><h2 className="mt-1 text-2xl font-semibold">{shop.name}</h2></div><span className="grid size-10 place-items-center rounded-full bg-cream"><ArrowRight size={16} /></span></div><div className="mt-4 flex gap-2">{shop.tags.map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-2 text-xs">{tag}</span>)}</div><div className="mt-4"><CustomerRating rating={shop.rating} reviewCount={shop.reviewCount} /></div></div>
        </button>
        <div className="absolute right-5 top-5"><LikeButton entity={{ id: "shop-azamra", title: shop.name, url: "/shopping/vetements/azamra", text: `${shop.name} · ${shop.type}` }} /></div>
      </article>
      <EntityDrawer open={open} onClose={() => setOpen(false)} title="Azamra">
        <div><div className="relative aspect-[3/4] max-h-[65vh]"><img src={assetPath(shop.image)} alt="" className="size-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" /><div className="absolute bottom-6 left-6 text-white"><Shirt size={20} /><p className="mt-3 text-xs text-white/55">{shop.type}</p><h2 className="mt-1 text-3xl font-semibold">{shop.name}</h2></div></div><div className="space-y-5 p-6"><CustomerRating rating={shop.rating} reviewCount={shop.reviewCount} /><EntityActions entity={{ id: "shop-azamra", title: shop.name, url: "/shopping/vetements/azamra", text: `${shop.name} · ${shop.type}` }} /><p className="text-sm leading-7 text-ink/55">{shop.description}</p><div className="flex gap-2">{shop.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-2 text-xs">{tag}</span>)}</div></div></div>
      </EntityDrawer>
    </>
  );
}
