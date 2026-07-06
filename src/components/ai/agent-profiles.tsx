"use client";

import { useEffect, useState } from "react";
import { Bell, Bot, Brain, Camera, Check, Sparkles } from "lucide-react";

const themes = [
  "🍽 Food & Restaurants",
  "🍷 Vin & Spiritueux",
  "✈️ Voyages",
  "🎉 Sorties",
  "💍 Mariage",
  "🏋️ Sport",
  "🕍 Religion & Traditions",
  "👶 Enfants",
  "🚗 Chauffeurs",
  "🛍 Shopping",
  "🍰 Pâtisseries",
  "📅 Calendrier juif",
  "💰 Bons plans",
];

const defaultProfiles = [
  { id: "batata", name: "BATATA", theme: "🍽 Food & Restaurants", photo: "🍽️", locked: true },
  { id: "tsadik", name: "TSADIK", theme: "🍷 Vin & Spiritueux", photo: "🍷", locked: true },
  { id: "profil-3", name: "Profil 3", theme: "✈️ Voyages", photo: "", locked: false },
  { id: "profil-4", name: "Profil 4", theme: "🕍 Religion & Traditions", photo: "", locked: false },
  { id: "profil-5", name: "Profil 5", theme: "🏋️ Sport", photo: "", locked: false },
];

const capabilities = [
  { title: "Mémoire", text: "Retient recherches et préférences", icon: Bot },
  { title: "Recommandations", text: "Propose adresses, événements et voyages", icon: Sparkles },
  { title: "Notifications", text: "Alerte sur les nouveautés pertinentes", icon: Bell },
];

export function AgentProfiles() {
  const [profiles, setProfiles] = useState(defaultProfiles);

  useEffect(() => {
    const saved = localStorage.getItem("liberty-agent-profiles");
    if (saved) setProfiles(JSON.parse(saved));
  }, []);

  const update = (id: string, patch: Partial<(typeof defaultProfiles)[number]>) => {
    setProfiles((current) => {
      const next = current.map((profile) => profile.id === id ? { ...profile, ...patch } : profile);
      localStorage.setItem("liberty-agent-profiles", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Agent IA personnalisé</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-.04em]">Créer jusqu’à 5 profils indépendants</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/50">Chaque profil possède son nom, sa photo, un seul thème, sa mémoire, son historique, ses recommandations et ses futures notifications.</p>
        </div>
        <span className="hidden size-12 place-items-center rounded-2xl bg-sage text-moss sm:grid"><Brain size={22} /></span>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-5">
        {profiles.map((profile) => (
          <article key={profile.id} className="rounded-[1.4rem] border border-black/[.06] bg-cream p-4">
            <div className="mx-auto grid size-16 place-items-center rounded-full border border-dashed border-gold/50 bg-white text-2xl">
              {profile.photo || <Camera size={20} className="text-gold" />}
            </div>
            <input value={profile.name} disabled={profile.locked} onChange={(event) => update(profile.id, { name: event.target.value })} className="mt-4 w-full rounded-xl border border-black/[.07] bg-white px-3 py-2 text-center text-xs font-semibold outline-none disabled:text-ink" />
            <select value={profile.theme} onChange={(event) => update(profile.id, { theme: event.target.value })} className="mt-2 w-full rounded-xl border border-black/[.07] bg-white px-2 py-2 text-xs outline-none">
              {themes.map((theme) => <option key={theme}>{theme}</option>)}
            </select>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {capabilities.map(({ title, text, icon: Icon }) => (
          <div key={title} className="rounded-2xl bg-ink p-4 text-white">
            <Icon size={18} className="text-gold" />
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs leading-5 text-white/45">{text}</p>
          </div>
        ))}
      </div>

      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-sm font-semibold text-white">
        <Check size={16} /> Valider mes profils IA
      </button>
    </div>
  );
}
