import { Heart, MapPin } from "lucide-react";
import type { highlights } from "@/data/mock";
import { CustomerRating, RecommendationBadge } from "@/components/ui/customer-rating";
import { assetPath } from "@/lib/assets";

type Place = (typeof highlights)[number];

export function PlaceCard({ place }: { place: Place }) {
  return (
    <article className="group">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sage"><img src={assetPath(place.image)} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute left-4 top-4"><RecommendationBadge rating={place.note} reviewCount={place.reviewCount} /></div><button className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 backdrop-blur"><Heart size={17} /></button><span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold backdrop-blur">{place.category}</span></div>
      <div className="mt-4"><h3 className="font-semibold tracking-tight">{place.title}</h3><p className="mt-1 flex items-center gap-1 text-sm text-ink/45"><MapPin size={13} />{place.place}</p><div className="mt-2"><CustomerRating rating={place.note} reviewCount={place.reviewCount} /></div></div>
    </article>
  );
}
