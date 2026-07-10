"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Apple, Bell, Bot, Clock3, Heart, Mail, Sparkles, UserRound } from "lucide-react";
import {
  clearDemoUser,
  createDemoUser,
  getAnalyticsEvents,
  getCurrentUser,
  getFavorites,
  getLikes,
  type LibertyUser,
} from "@/lib/client-store";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";

export function AccountDashboard() {
  const auth = useSupabaseAuth();
  const [user, setUser] = useState<LibertyUser | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [events, setEvents] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const refresh = () => {
    setUser(getCurrentUser());
    setLikes(getLikes());
    setFavorites(getFavorites());
    setEvents(getAnalyticsEvents().length);
  };

  useEffect(refresh, []);
  useEffect(refresh, [auth.user?.id]);

  const login = (provider: "google" | "apple" | "classic") => {
    if (auth.configured) {
      if (provider === "google") void auth.signInWithGoogle();
      if (provider === "apple") void auth.signInWithApple();
      return;
    }
    createDemoUser(provider, provider === "classic" ? "demo@liberty.local" : `${provider}@liberty.local`);
    refresh();
  };

  const submitEmailAuth = async (mode: "signin" | "signup") => {
    if (!auth.configured) {
      login("classic");
      return;
    }
    setAuthMessage("");
    const result = mode === "signin" ? await auth.signInWithEmail(email, password) : await auth.signUpWithEmail(email, password);
    if (result.error) setAuthMessage(result.error);
    else setAuthMessage(mode === "signin" ? "Connexion réussie." : "Compte créé. Vérifiez votre email si Supabase demande une confirmation.");
    refresh();
  };

  if (!user) {
    return (
      <div className="w-full max-w-md">
        <span className="grid size-12 place-items-center rounded-2xl bg-sage text-moss"><UserRound size={22} /></span>
        <h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">Ravi de vous revoir.</h2>
        <p className="mt-3 text-sm leading-6 text-ink/50">Connectez-vous pour activer vos likes, avis, favoris, historique et recommandations Liberty IA.</p>
        <div className="mt-8 grid gap-3">
          <button onClick={() => login("google")} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold"><Sparkles size={17} /> Continuer avec Google</button>
          <button onClick={() => login("apple")} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold"><Apple size={17} /> Continuer avec Apple</button>
          <div className="rounded-3xl border border-black/10 bg-white p-3">
            <div className="grid gap-2">
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Mot de passe" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button onClick={() => submitEmailAuth("signin")} className="flex items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-xs font-semibold text-white"><Mail size={15} /> Connexion Email</button>
              <button onClick={() => submitEmailAuth("signup")} className="rounded-2xl border border-black/10 py-3 text-xs font-semibold">Créer un compte</button>
            </div>
            {authMessage && <p className="mt-3 text-center text-xs text-ink/45">{authMessage}</p>}
          </div>
        </div>
        <p className="mt-8 rounded-2xl bg-cream p-4 text-center text-xs leading-5 text-ink/45">
          {auth.configured ? "Connexion sécurisée Supabase. Vos favoris, likes, avis et paramètres seront synchronisés entre vos appareils." : "Mode local temporaire. Ajoutez les clés Supabase pour activer la synchronisation multi-appareils."}
        </p>
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
        <button onClick={() => { if (auth.configured) void auth.signOut(); clearDemoUser(); refresh(); }} className="rounded-xl bg-cream px-4 py-3 text-xs font-semibold">Se déconnecter</button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {[{ label: "Likes", value: likes.length, icon: Heart }, { label: "Favoris", value: favorites.length + likes.length, icon: Sparkles }, { label: "Historique", value: events, icon: Clock3 }, { label: "Notifications", value: 0, icon: Bell }].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-3xl bg-cream p-4">
            <Icon size={17} className="text-moss" />
            <p className="mt-4 text-2xl font-semibold">{value}</p>
            <p className="text-xs text-ink/40">{label}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-sage text-moss"><Bot size={18} /></span>
          <div>
            <h3 className="font-semibold">Liberty IA</h3>
            <p className="text-xs text-ink/42">Un seul assistant personnel pour comprendre vos recherches, vos favoris et vos habitudes.</p>
          </div>
        </div>
        <div className="mt-5 rounded-3xl border border-black/[.06] bg-cream p-5">
          <p className="text-sm leading-6 text-ink/55">Liberty IA centralise vos envies, vos likes et vos favoris afin de vous proposer progressivement les meilleures adresses et expériences.</p>
          <Link href="/mes-favoris" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-xs font-semibold text-white">Voir Mes Favoris</Link>
        </div>
      </div>
    </div>
  );
}
