"use client";

import { useMemo, useState } from "react";
import { Copy, Heart, Instagram, MessageCircle, Send, Star } from "lucide-react";
import { useEntityReview, useLibertyUser, useStoredList } from "@/lib/client-state";

type EntityEngagementProps = {
  entityId: string;
  title: string;
  url?: string;
  compact?: boolean;
};

function currentUrl(fallback?: string) {
  if (typeof window === "undefined") return fallback ?? "/";
  if (!fallback) return window.location.href;
  if (fallback.startsWith("http")) return fallback;
  return `${window.location.origin}${fallback}`;
}

export function EntityEngagement({ entityId, title, url, compact = false }: EntityEngagementProps) {
  const { user, signedIn, signIn } = useLibertyUser();
  const likes = useStoredList("liberty-liked-entities");
  const favorites = useStoredList("liberty-favorite-entities");
  const { review, publish } = useEntityReview(entityId);
  const [message, setMessage] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const shareUrl = useMemo(() => currentUrl(url), [url]);

  const requireLogin = () => {
    setMessage("Connectez-vous pour aimer ce contenu.");
    return false;
  };

  const toggleLike = () => {
    if (!signedIn) return requireLogin();
    likes.toggle(entityId);
    setMessage(likes.has(entityId) ? "Like retiré." : "Contenu aimé.");
    return true;
  };

  const toggleFavorite = () => {
    if (!signedIn) {
      setMessage("Connectez-vous pour enregistrer ce contenu dans vos favoris.");
      return;
    }
    favorites.toggle(entityId);
    setMessage(favorites.has(entityId) ? "Favori retiré." : "Ajouté à vos favoris.");
  };

  const copyLink = async () => {
    await navigator.clipboard?.writeText(shareUrl);
    setMessage("Lien copié.");
    setShareOpen(false);
  };

  const submitReview = () => {
    if (!signedIn || !user) {
      setMessage("Connectez-vous pour publier un avis.");
      return;
    }
    const text = reviewText.trim();
    if (!text) return;
    const ok = publish(text, rating, user.id);
    setMessage(ok ? "Avis publié. Il ne pourra plus être modifié." : "Vous avez déjà publié un avis pour cette fiche.");
    if (ok) setReviewText("");
  };

  return (
    <div className={`rounded-[1.5rem] bg-white p-4 ${compact ? "space-y-3" : "space-y-4"}`}>
      <div className="grid grid-cols-3 gap-2">
        <button onClick={toggleLike} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-semibold transition ${likes.has(entityId) ? "bg-[#a54b4b] text-white" : "bg-cream text-ink"}`}>
          <Heart size={14} fill={likes.has(entityId) ? "currentColor" : "none"} /> Like
        </button>
        <button onClick={toggleFavorite} className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-semibold transition ${favorites.has(entityId) ? "bg-ink text-white" : "bg-cream text-ink"}`}>
          <Star size={14} fill={favorites.has(entityId) ? "currentColor" : "none"} /> Favori
        </button>
        <button onClick={() => setShareOpen((open) => !open)} className="flex items-center justify-center gap-1.5 rounded-xl bg-cream px-3 py-3 text-xs font-semibold">
          <Send size={14} /> Partager
        </button>
      </div>

      {shareOpen && (
        <div className="grid gap-2 rounded-2xl border border-black/[.06] bg-cream p-2 text-xs">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 font-semibold"><MessageCircle size={14} /> WhatsApp</a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 font-semibold"><Instagram size={14} /> Instagram</a>
          <button onClick={copyLink} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-left font-semibold"><Copy size={14} /> Copier le lien</button>
        </div>
      )}

      <div className="border-t border-black/[.06] pt-4">
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Avis</p>
        {review ? (
          <div className="mt-3 rounded-2xl bg-cream p-3">
            <p className="text-xs text-gold">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">{review.text}</p>
            <p className="mt-2 text-[10px] text-ink/35">Avis publié — non modifiable.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} onClick={() => setRating(value)} className={`text-sm ${value <= rating ? "text-gold" : "text-ink/20"}`}>★</button>
              ))}
            </div>
            <textarea value={reviewText} onChange={(event) => setReviewText(event.target.value.slice(0, 149))} maxLength={149} placeholder="Votre avis en 149 caractères maximum…" className="min-h-20 w-full resize-none rounded-2xl border border-black/[.08] bg-cream p-3 text-sm outline-none focus:border-ink/20" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] text-ink/35">{reviewText.length}/149</span>
              <button onClick={submitReview} className="rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white">Publier</button>
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className="rounded-2xl bg-[#fff8e6] p-3 text-xs leading-5 text-ink/65">
          {message}
          {!signedIn && <button onClick={() => signIn("classic")} className="ml-2 font-semibold text-moss">Connexion démo</button>}
        </div>
      )}
    </div>
  );
}
