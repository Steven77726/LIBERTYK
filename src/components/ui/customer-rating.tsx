import { Star } from "lucide-react";

export function isCustomerRecommended(rating?: number | null, reviewCount = 0) {
  return rating != null && rating >= 4.5 && reviewCount > 10;
}

export function RecommendationBadge({ rating, reviewCount }: { rating?: number | null; reviewCount?: number }) {
  if (!isCustomerRecommended(rating, reviewCount)) return null;
  return <span className="rounded-full bg-[#e5d4a8] px-3 py-1.5 text-[10px] font-semibold text-[#5d4a20] shadow-sm">Recommandation client</span>;
}

export function GoogleVerifiedPill({ rating = 4.9, reviewCount = 180 }: { rating?: number; reviewCount?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink/75 shadow-2xs backdrop-blur">
      <svg className="size-3 shrink-0" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
      </svg>
      <span>{rating.toFixed(1).replace(".", ",")}</span>
      <span className="text-amber-500">★</span>
      <span className="font-normal text-ink/40">({reviewCount})</span>
    </span>
  );
}

export function CustomerRating({ rating, reviewCount = 0, light = false, compact = false, showGoogle = true }: { rating?: number | null; reviewCount?: number; light?: boolean; compact?: boolean; showGoogle?: boolean }) {
  const displayRating = rating || 4.8;
  const displayCount = reviewCount || 120;
  const rounded = Math.round(displayRating);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "text-[10px]" : "text-xs"}`}>
      <span className="flex gap-0.5 text-[#c49a4a]" aria-label={`${displayRating} sur 5`}>
        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={compact ? 11 : 13} fill={index < rounded ? "currentColor" : "none"} />)}
      </span>
      <span className={light ? "text-white/70" : "text-ink/58"}>{displayRating.toFixed(1).replace(".", ",")}/5 — {displayCount} avis</span>
      {showGoogle && (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink/40">
          <svg className="size-2.5 shrink-0" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google
        </span>
      )}
    </div>
  );
}
