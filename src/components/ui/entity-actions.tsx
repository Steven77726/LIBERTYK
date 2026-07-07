"use client";

import { Copy, Heart, Instagram, MessageCircle, Send, Share2, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import {
  getLikes,
  getReviewForEntity,
  publishReview,
  toggleLike,
  trackEvent,
  type LibertyReview,
} from "@/lib/client-store";

type EntityActionTarget = {
  id: string;
  title: string;
  url?: string;
  text?: string;
};

function getAbsoluteUrl(path?: string) {
  if (typeof window === "undefined") return path ?? "";
  if (!path) return window.location.href;
  return new URL(path, window.location.origin).toString();
}

export function LikeButton({ entity, className = "" }: { entity: EntityActionTarget; className?: string }) {
  const [likes, setLikes] = useState<string[]>([]);

  useEffect(() => setLikes(getLikes()), []);

  const liked = likes.includes(entity.id);
  return (
    <button
      onClick={() => setLikes(toggleLike(entity.id, entity.title))}
      className={className || `grid size-10 place-items-center rounded-full transition ${liked ? "bg-[#a54b4b] text-white" : "bg-white/90 text-ink hover:bg-cream"}`}
      aria-label={liked ? "Retirer le like" : "Aimer"}
      title={liked ? "Aimé" : "Aimer"}
    >
      <Heart size={17} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}

export function ShareButton({ entity, compact = false }: { entity: EntityActionTarget; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => getAbsoluteUrl(entity.url), [entity.url, open]);
  const text = encodeURIComponent(entity.text ?? `Découvre ${entity.title} sur Liberty`);

  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    trackEvent("share_copy_link", entity.title, entity.id);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={compact ? "grid size-8 place-items-center rounded-full text-ink/35 transition hover:bg-cream hover:text-ink" : "flex items-center justify-center gap-2 rounded-xl bg-cream px-4 py-3 text-xs font-semibold"}
        aria-label="Partager"
      >
        <Share2 size={compact ? 14 : 15} /> {!compact && "Partager"}
      </button>
      <EntityDrawer open={open} onClose={() => setOpen(false)} title={`Partager ${entity.title}`}>
        <div className="space-y-4 p-6">
          <p className="text-sm leading-6 text-ink/55">Partage disponible via WhatsApp, Instagram ou copie du lien.</p>
          <a
            href={`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent("share_whatsapp", entity.title, entity.id)}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent("share_instagram", entity.title, entity.id)}
            className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-semibold"
          >
            <Instagram size={18} /> Instagram
          </a>
          <button onClick={copy} className="flex w-full items-center gap-3 rounded-2xl bg-ink p-4 text-left text-sm font-semibold text-white">
            <Copy size={18} /> {copied ? "Lien copié" : "Copier le lien"}
          </button>
        </div>
      </EntityDrawer>
    </>
  );
}

export function ReviewButton({ entity, compact = false }: { entity: EntityActionTarget; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [review, setReview] = useState<LibertyReview | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) setReview(getReviewForEntity(entity.id));
  }, [open, entity.id]);

  const submit = () => {
    const result = publishReview(entity.id, text, entity.title);
    if (result.ok) {
      setReview(result.review);
      setMessage("Avis publié. Il ne peut plus être modifié.");
      setText("");
    } else if (result.reason === "exists") {
      setReview(getReviewForEntity(entity.id));
      setMessage("Vous avez déjà publié un avis pour cette fiche.");
    } else if (result.reason === "empty") {
      setMessage("Écrivez un avis avant de publier.");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={compact ? "grid size-8 place-items-center rounded-full text-ink/35 transition hover:bg-cream hover:text-ink" : "flex items-center justify-center gap-2 rounded-xl bg-cream px-4 py-3 text-xs font-semibold"}
        aria-label="Donner un avis"
      >
        {compact ? <Send size={14} /> : <><Star size={15} /> Donner un avis</>}
      </button>
      <EntityDrawer open={open} onClose={() => setOpen(false)} title={`Avis · ${entity.title}`}>
        <div className="space-y-5 p-6">
          {review ? (
            <div className="rounded-3xl bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-ink/35">Votre avis publié</p>
              <p className="mt-3 text-sm leading-6 text-ink/70">“{review.text}”</p>
              <p className="mt-3 text-xs text-ink/35">Un seul avis par fiche. Modification désactivée.</p>
            </div>
          ) : (
            <>
              <p className="text-sm leading-6 text-ink/55">Un seul avis par fiche, 149 caractères maximum. Une fois publié, il ne peut plus être modifié.</p>
              <label className="block">
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value.slice(0, 149))}
                  maxLength={149}
                  className="min-h-32 w-full rounded-3xl border border-black/10 bg-white p-4 text-sm outline-none focus:border-ink/30"
                  placeholder="Votre avis en quelques mots…"
                />
                <span className="mt-2 block text-right text-xs text-ink/35">{text.length}/149</span>
              </label>
              <button onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-sm font-semibold text-white">
                Publier mon avis
              </button>
            </>
          )}
          {message && <p className="rounded-2xl bg-cream p-4 text-sm text-ink/55">{message}</p>}
        </div>
      </EntityDrawer>
    </>
  );
}

export function EntityActions({ entity }: { entity: EntityActionTarget }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <LikeButton entity={entity} className="flex items-center justify-center gap-2 rounded-xl bg-cream px-4 py-3 text-xs font-semibold" />
      <ShareButton entity={entity} />
      <ReviewButton entity={entity} />
    </div>
  );
}
