import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft, CalendarDays, Car, Check, Clock3, Globe2, Heart, Instagram,
  MapPin, Navigation, Package, Phone, Send, Share2, ShoppingBag, Store,
} from "lucide-react";
import { notFound } from "next/navigation";
import { brunchBySlug, brunches } from "@/data/brunches";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { assetPath } from "@/lib/assets";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return brunches.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brunch = brunchBySlug[(await params).slug];
  return brunch ? { title: brunch.name, description: brunch.description } : {};
}

export default async function BrunchDetailPage({ params }: Props) {
  const brunch = brunchBySlug[(await params).slug];
  if (!brunch) notFound();
  const services = [
    ["Sur place", brunch.services.dineIn, Store], ["À emporter", brunch.services.takeaway, Package],
    ["Livraison", brunch.services.delivery, Car], ["Click & Collect", brunch.services.clickCollect, ShoppingBag],
    ["Réservation", brunch.services.reservation, CalendarDays],
  ] as const;
  const amenities = [
    ["Terrasse", brunch.amenities.terrace], ["Wifi", brunch.amenities.wifi], ["Parking", brunch.amenities.parking],
    ["Adapté aux familles", brunch.amenities.family], ["Accessible PMR", brunch.amenities.accessible],
  ] as const;

  return (
    <>
      <section className="page-shell pt-6">
        <Link href="/food/brunch" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-ink/50 hover:text-ink"><ArrowLeft size={14} /> Retour aux brunchs</Link>
        <div className="grid h-[480px] grid-cols-1 gap-2 overflow-hidden rounded-[2rem] sm:grid-cols-2 lg:grid-cols-[1.5fr_.75fr_.75fr]">
          <img src={assetPath(brunch.images[0])} alt="" className="size-full object-cover sm:row-span-2" />
          <img src={assetPath(brunch.images[1])} alt="" className="hidden size-full object-cover sm:block" />
          <img src={assetPath(brunch.images[2])} alt="" className="hidden size-full object-cover lg:block" />
          <img src={assetPath(brunch.images[2])} alt="" className="hidden size-full object-cover sm:block" />
          <img src={assetPath(brunch.images[1])} alt="" className="hidden size-full object-cover lg:block" />
        </div>
      </section>

      <section className="page-shell py-10">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-black/[.07] pb-8">
              <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-moss/55">{brunch.cuisine}</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">{brunch.name}</h1><p className="mt-4 flex items-center gap-2 text-sm text-ink/50"><MapPin size={15} />{brunch.address || "Adresse en cours de vérification"}{brunch.arrondissement && ` · Paris ${brunch.arrondissement}e`}</p></div>
              <div className="flex gap-2"><button className="grid size-11 place-items-center rounded-full bg-white" aria-label="Partager"><Share2 size={17} /></button><button className="grid size-11 place-items-center rounded-full bg-white" aria-label="Ajouter aux favoris"><Heart size={17} /></button></div>
            </div>

            <div className="border-b border-black/[.07] py-8"><h2 className="text-xl font-semibold">À propos</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-ink/55">{brunch.description}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-sage px-3 py-2 text-xs font-semibold text-moss">{brunch.kosherType}</span>{brunch.certification && <span className="rounded-full bg-white px-3 py-2 text-xs">✡ {brunch.certification}</span>}{brunch.price && <span className="rounded-full bg-white px-3 py-2 text-xs">{brunch.price}</span>}</div></div>

            <div className="border-b border-black/[.07] py-8"><h2 className="text-xl font-semibold">Services</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{services.map(([label, active, Icon]) => <div key={label} className={`flex items-center gap-3 rounded-2xl p-4 ${active ? "bg-white" : "bg-black/[.025] text-ink/25"}`}><span className="grid size-10 place-items-center rounded-xl bg-cream"><Icon size={17} /></span><span className="text-sm font-medium">{label}</span>{active && <Check size={15} className="ml-auto text-moss" />}</div>)}</div></div>

            <div className="border-b border-black/[.07] py-8"><h2 className="text-xl font-semibold">Confort</h2><div className="mt-5 flex flex-wrap gap-2">{amenities.map(([label, active]) => <span key={label} className={`rounded-full px-3 py-2 text-xs ${active ? "bg-white text-ink" : "bg-black/[.025] text-ink/25"}`}>{active && "✓ "}{label}</span>)}</div></div>

            <div className="py-8"><h2 className="text-xl font-semibold">Horaires</h2><div className="mt-5 overflow-hidden rounded-2xl bg-white">{Object.entries(brunch.hours).map(([day, hours]) => <div key={day} className="flex justify-between border-b border-black/[.055] px-5 py-4 text-sm last:border-0"><span className="capitalize text-ink/55">{day}</span><span className="font-medium">{hours || "Non renseigné"}</span></div>)}</div></div>
          </div>

          <aside className="sticky top-24 space-y-4">
            <div className="rounded-[1.75rem] bg-white p-5 shadow-soft"><div className="flex items-center justify-between gap-3"><CustomerRating rating={brunch.rating} reviewCount={brunch.reviewCount} /><RecommendationBadge rating={brunch.rating} reviewCount={brunch.reviewCount} /></div><div className="mt-5 grid gap-2">{brunch.phone && <a href={`tel:${brunch.phone.replace(/\s/g, "")}`} className="flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-xs font-semibold text-white"><Phone size={14} /> Appeler</a>}<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(brunch.address || brunch.name)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-cream py-3 text-xs font-semibold"><Navigation size={14} /> Itinéraire</a></div><div className="mt-3 flex justify-center gap-1">{[Globe2, Instagram, Share2, Heart, Send].map((Icon, index) => <button key={index} className="grid size-9 place-items-center rounded-full text-ink/35 hover:bg-cream" aria-label={["Site internet", "Instagram", "Partager", "Favoris", "Donner un avis"][index]}><Icon size={15} /></button>)}</div></div>
            <div className="relative h-72 overflow-hidden rounded-[1.75rem] bg-[#dfe6df]"><div className="absolute inset-0 opacity-45" style={{ backgroundImage: "linear-gradient(35deg,transparent 46%,#fff 47%,#fff 51%,transparent 52%),linear-gradient(108deg,transparent 47%,#fff 48%,#fff 51%,transparent 52%)", backgroundSize: "90px 75px" }} /><span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-moss text-white shadow-xl"><MapPin size={19} /></span><span className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/90 p-3 text-xs font-medium shadow-sm backdrop-blur">{brunch.address || "Adresse en cours de vérification"}</span></div>
          </aside>
        </div>
      </section>
    </>
  );
}
