import { Star } from "lucide-react";

export function isCustomerRecommended(rating?: number | null, reviewCount = 0) {
  return rating != null && rating >= 4.5 && reviewCount > 10;
}

export function RecommendationBadge({ rating, reviewCount }: { rating?: number | null; reviewCount?: number }) {
  if (!isCustomerRecommended(rating, reviewCount)) return null;
  return <span className="rounded-full bg-[#e5d4a8] px-3 py-1.5 text-[10px] font-semibold text-[#5d4a20] shadow-sm">Recommandation client</span>;
}

export function CustomerRating({ rating, reviewCount = 0, light = false, compact = false }: { rating?: number | null; reviewCount?: number; light?: boolean; compact?: boolean }) {
  if (rating == null || reviewCount === 0) {
    return <p className={`${compact ? "text-[10px]" : "text-xs"} ${light ? "text-white/45" : "text-ink/38"}`}>Aucun avis pour le moment</p>;
  }
  const rounded = Math.round(rating);
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-[10px]" : "text-xs"}`}>
      <span className="flex gap-0.5 text-[#c49a4a]" aria-label={`${rating} sur 5`}>
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={compact ? 11 : 13} fill={index < rounded ? "currentColor" : "none"} />)}
      </span>
      <span className={light ? "text-white/70" : "text-ink/58"}>{rating.toFixed(1).replace(".", ",")}/5 — {reviewCount} avis</span>
    </div>
  );
}
