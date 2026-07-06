import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink, Grape, MapPin, Wine } from "lucide-react";
import { notFound } from "next/navigation";
import { wineActivities, wineActivityBySlug } from "@/data/wine-activities";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { assetPath } from "@/lib/assets";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return wineActivities.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const activity = wineActivityBySlug[(await params).slug];
  return activity ? { title: activity.title, description: activity.description } : {};
}

export default async function WineActivityPage({ params }: Props) {
  const activity = wineActivityBySlug[(await params).slug];
  if (!activity) notFound();
  return (
    <section className="page-shell py-8 sm:py-12">
      <Link href="/vin-spiritueux" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-ink/50 hover:text-ink"><ArrowLeft size={14} /> Vin & Spiritueux</Link>
      <div className="overflow-hidden rounded-[2.25rem] bg-white shadow-soft">
        <div className="relative min-h-[430px] sm:min-h-[560px]">
          <img src={assetPath(activity.image)} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: activity.imagePosition }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-12">
            <span className="mb-5 grid size-12 place-items-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur"><Wine size={21} /></span>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">{activity.type}</p>
            <div className="mt-3"><RecommendationBadge rating={activity.rating} reviewCount={activity.reviewCount} /></div>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">{activity.title}</h1>
            {activity.address && <p className="mt-4 flex items-center gap-2 text-sm text-white/60"><MapPin size={15} />{activity.address}</p>}
            <div className="mt-3"><CustomerRating rating={activity.rating} reviewCount={activity.reviewCount} light /></div>
          </div>
        </div>
        <div className="grid gap-10 p-7 sm:p-12 lg:grid-cols-[1fr_300px]">
          <div><h2 className="text-2xl font-semibold tracking-tight">L’expérience</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-ink/55">{activity.description}</p><div className="mt-6 flex flex-wrap gap-2">{activity.tags.map((tag) => <span key={tag} className="rounded-full bg-cream px-3 py-2 text-xs">{tag}</span>)}</div></div>
          <div className="rounded-2xl bg-cream p-5"><Grape size={20} className="text-[#773b45]" /><p className="mt-4 text-sm font-semibold">Envie d’en savoir plus ?</p>{activity.website ? <a href={activity.website} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-ink py-3 text-xs font-semibold text-white">{activity.action} <ExternalLink size={13} /></a> : <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3 text-xs font-semibold text-white">{activity.action} <ArrowRight size={13} /></button>}</div>
        </div>
      </div>
    </section>
  );
}
