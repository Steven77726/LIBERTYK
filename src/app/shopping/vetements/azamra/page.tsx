import Link from "next/link";
import { ArrowLeft, Heart, Shirt } from "lucide-react";
import { azamra } from "@/data/shops";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { assetPath } from "@/lib/assets";

export default function AzamraPage() {
  return (
    <section className="page-shell py-8 sm:py-12">
      <Link href="/shopping/vetements" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-ink/50"><ArrowLeft size={14} /> Vêtements</Link>
      <div className="overflow-hidden rounded-[2.25rem] bg-white shadow-soft">
        <div className="relative min-h-[520px]"><img src={assetPath(azamra.image)} alt="" className="absolute inset-0 size-full object-cover object-center" /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/10" /><div className="absolute left-7 top-7"><RecommendationBadge rating={azamra.rating} reviewCount={azamra.reviewCount} /></div><div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-12"><Shirt size={22} /><p className="mt-5 text-xs uppercase tracking-[.16em] text-white/50">{azamra.type}</p><h1 className="mt-2 text-5xl font-semibold tracking-[-.055em]">{azamra.name}</h1><div className="mt-4"><CustomerRating rating={azamra.rating} reviewCount={azamra.reviewCount} light /></div></div></div>
        <div className="flex flex-col justify-between gap-7 p-7 sm:flex-row sm:p-10"><div><p className="max-w-2xl text-sm leading-7 text-ink/55">{azamra.description}</p><div className="mt-5 flex gap-2">{azamra.tags.map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-2 text-xs">{tag}</span>)}</div></div><button className="flex h-fit items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-xs font-semibold text-white"><Heart size={14} /> Ajouter aux favoris</button></div>
      </div>
    </section>
  );
}
