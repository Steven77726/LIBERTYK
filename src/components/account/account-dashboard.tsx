"use client";

import { useEffect, useState } from "react";
import { Apple, Bell, BrainCircuit, Clock3, Heart, Mail, Sparkles, UserRound } from "lucide-react";
import {
  clearDemoUser,
  createDemoUser,
  getAiProfiles,
  getAnalyticsEvents,
  getCurrentUser,
  getFavorites,
  getLikes,
  saveAiProfiles,
  type LibertyAiProfile,
  type LibertyUser,
} from "@/lib/client-store";

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

export function AccountDashboard() {
  const [user, setUser] = useState<LibertyUser | null>(null);
  const [profiles, setProfiles] = useState<LibertyAiProfile[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [events, setEvents] = useState(0);

  const refresh = () => {
    setUser(getCurrentUser());
    setProfiles(getAiProfiles());
    setLikes(getLikes());
    setFavorites(getFavorites());
    setEvents(getAnalyticsEvents().length);
  };

  useEffect(refresh, []);

  const login = (provider: "google" | "apple" | "classic") => {
    createDemoUser(provider, provider === "classic" ? "demo@liberty.local" : `${provider}@liberty.local`);
    refresh();
  };

  const updateProfile = (id: string, patch: Partial<LibertyAiProfile>) => {
    const next = profiles.map((profile) => profile.id === id ? { ...profile, ...patch } : profile);
    setProfiles(next);
    saveAiProfiles(next);
  };

  if (!user) {
    return (
      <div className="w-full max-w-md">
        <span className="grid size-12 place-items-center rounded-2xl bg-sage text-moss"><UserRound size={22} /></span>
        <h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">Ravi de vous revoir.</h2>
        <p className="mt-3 text-sm leading-6 text-ink/50">Connectez-vous pour activer vos likes, avis, profils IA, historique et recommandations personnalisées.</p>
        <div className="mt-8 grid gap-3">
          <button onClick={() => login("google")} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold"><Sparkles size={17} /> Continuer avec Google</button>
          <button onClick={() => login("apple")} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold"><Apple size={17} /> Continuer avec Apple</button>
          <button onClick={() => login("classic")} className="flex items-center justify-center gap-3 rounded-2xl bg-ink py-4 text-sm font-semibold text-white"><Mail size={17} /> Compte classique</button>
        </div>
        <p className="mt-8 rounded-2xl bg-cream p-4 text-center text-xs leading-5 text-ink/45">Mode démonstration local. Les données sont conservées dans ce navigateur, puis pourront être branchées à Supabase.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-moss/60">Compte actif</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">{user.name}</h2>
          <p className="mt-2 text-sm text-ink/45">{user.email} · {user.provider}</p>
        </div>
        <button onClick={() => { clearDemoUser(); refresh(); }} className="rounded-xl bg-cream px-4 py-3 text-xs font-semibold">Se déconnecter</button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {[{ label: "Likes", value: likes.length, icon: Heart }, { label: "Favoris", value: favorites.length, icon: Sparkles }, { label: "Historique", value: events, icon: Clock3 }, { label: "Notifications", value: profiles.reduce((sum, p) => sum + p.notifications.length, 0), icon: Bell }].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-3xl bg-cream p-4">
            <Icon size={17} className="text-moss" />
            <p className="mt-4 text-2xl font-semibold">{value}</p>
            <p className="text-xs text-ink/40">{label}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-sage text-moss"><BrainCircuit size={18} /></span>
          <div>
            <h3 className="font-semibold">Vos profils IA indépendants</h3>
            <p className="text-xs text-ink/42">Chaque profil possède son nom, son thème, sa mémoire, ses préférences et ses futures notifications.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {profiles.map((profile) => (
            <article key={profile.id} className="rounded-3xl border border-black/[.06] bg-cream p-4">
              <input value={profile.name} onChange={(event) => updateProfile(profile.id, { name: event.target.value })} className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold outline-none" />
              <select value={profile.theme} onChange={(event) => updateProfile(profile.id, { theme: event.target.value })} className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-xs outline-none">
                {themes.map((theme) => <option key={theme}>{theme}</option>)}
              </select>
              <div className="mt-4 text-xs text-ink/45">
                <p>Mémoire : {profile.memory.length} recherche{profile.memory.length > 1 ? "s" : ""}</p>
                <p>Préférences : {profile.preferences.join(", ") || "à apprendre"}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
