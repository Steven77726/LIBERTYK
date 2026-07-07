"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, Link2Off, MousePointerClick, Search, Share2, Timer, Wrench } from "lucide-react";
import { getAnalyticsEvents } from "@/lib/client-store";

export function AdminIntelligence() {
  const [events, setEvents] = useState<ReturnType<typeof getAnalyticsEvents>>([]);

  useEffect(() => setEvents(getAnalyticsEvents()), []);

  const stats = useMemo(() => {
    const count = (type: string) => events.filter((event) => event.type === type).length;
    return [
      { label: "Recherches IA", value: count("ai_search"), icon: Search },
      { label: "Likes", value: count("like_added"), icon: MousePointerClick },
      { label: "Partages", value: count("share_whatsapp") + count("share_instagram") + count("share_copy_link"), icon: Share2 },
      { label: "Avis publiés", value: count("review_published"), icon: CheckCircle2 },
    ];
  }, [events]);

  const mostFrequent = useMemo(() => {
    const map = new Map<string, number>();
    events.filter((event) => event.label).forEach((event) => map.set(event.label!, (map.get(event.label!) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [events]);

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.85fr]">
      <article className="rounded-3xl bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Suivi IA & engagement</p>
            <p className="mt-1 text-xs text-ink/40">Données de démonstration collectées localement.</p>
          </div>
          <Bot className="text-moss" size={22} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-cream p-4">
              <Icon size={16} className="text-moss" />
              <p className="mt-4 text-2xl font-semibold">{value}</p>
              <p className="text-[11px] text-ink/40">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-black/[.06] p-4">
          <p className="text-sm font-semibold">Recherches / fiches les plus fréquentes</p>
          <div className="mt-4 space-y-3">
            {(mostFrequent.length ? mostFrequent : [["Aucune donnée collectée pour le moment", 0] as [string, number]]).map(([label, value]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-ink/60">{label}</span>
                <span className="rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold text-moss">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </article>

      <article className="rounded-3xl bg-ink p-6 text-white">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/10"><Wrench size={18} /></span>
          <div>
            <p className="font-semibold">IA de surveillance · 00h00</p>
            <p className="mt-1 text-xs leading-5 text-white/45">Prépare les corrections à valider. Ne modifie jamais automatiquement la production.</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {[
            { label: "Analyse des erreurs", status: "Prêt", icon: AlertTriangle },
            { label: "Contrôle des liens cassés", status: "Planifié", icon: Link2Off },
            { label: "Données manquantes", status: "À surveiller", icon: Search },
            { label: "Performances", status: "Rapport quotidien", icon: Timer },
          ].map(({ label, status, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/8 p-3">
              <Icon size={15} className="text-gold" />
              <span className="min-w-0 flex-1 text-sm">{label}</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/55">{status}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
