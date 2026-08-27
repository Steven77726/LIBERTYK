"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { azamra } from "@/data/shops";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { assetPath } from "@/lib/assets";
import { LikeButton } from "@/components/ui/entity-actions";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { EstablishmentDetailDrawer } from "@/components/ui/establishment-detail-drawer";
import { getMetroLineStyle } from "@/lib/transport/metro-lines";

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
  const [shop, setShop] = useState(azamra);
  const [shopRecord, setShopRecord] = useState<EstablishmentRecord>(() => azamraToEstablishmentRecord());
  const metroStyle = getMetroLineStyle(shopRecord.nearestMetroLine);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const records = await listPublishedEstablishments({ rubricSlug: "shopping", subrubricSlug: "mode" }).catch(() => null);
      const azamraRecord = records?.find((item) => (item.slug ?? item.id) === "azamra") ?? records?.[0];
      if (!mounted || !azamraRecord) return;
      setShopRecord(azamraRecord);
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
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-moss/55">{shop.type}</p>
                <h2 className="mt-1 text-2xl font-semibold">{shop.name}</h2>
                {shopRecord.address && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/45">
                    <MapPin size={13} /> {[shopRecord.address, shopRecord.city].filter(Boolean).join(" · ")}
                  </p>
                )}
                {shopRecord.nearestMetroName && (
                  <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink/50">
                    <span className="truncate">Métro {shopRecord.nearestMetroName}</span>
                    {metroStyle && (
                      <span
                        className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border px-1 text-[10px] font-black"
                        style={{ backgroundColor: metroStyle.background, color: metroStyle.foreground, borderColor: metroStyle.border }}
                      >
                        {metroStyle.label}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <span className="grid size-10 place-items-center rounded-full bg-cream"><ArrowRight size={16} /></span>
            </div>
            <div className="mt-4 flex gap-2">{shop.tags.map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-2 text-xs">{tag}</span>)}</div>
            <div className="mt-4"><CustomerRating rating={shop.rating} reviewCount={shop.reviewCount} /></div>
          </div>
        </button>
        <div className="absolute right-5 top-5"><LikeButton entity={{ id: "shop-azamra", title: shop.name, url: "/shopping/vetements/azamra", text: `${shop.name} · ${shop.type}` }} /></div>
      </article>
      <EstablishmentDetailDrawer establishment={shopRecord} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
