"use client";

import Link from "next/link";
import { Apple, ArrowRight, Bell, Bookmark, Clock3, Heart, LockKeyhole, Mail, UserRound } from "lucide-react";
import { AgentProfiles } from "@/components/ai/agent-profiles";
import { useLibertyUser, usePlatformCounters } from "@/lib/client-state";

const accountStats = [
  { label: "Favoris", key: "favorites", icon: Bookmark },
  { label: "Likes", key: "likes", icon: Heart },
  { label: "Avis publiés", key: "reviews", icon: Clock3 },
  { label: "Notifications", key: "reservations", icon: Bell },
] as const;

export function AccountExperience() {
  const { user, signedIn, signIn, signOut } = useLibertyUser();
  const counters = usePlatformCounters();

  if (signedIn) {
    return (
      <section className="page-shell py-10 sm:py-16">
        <div className="mb-7 rounded-[2rem] bg-ink p-7 text-white sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-white/40">Votre espace Liberty</p>
          <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-.055em]">Bonjour {user?.name}.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Vos agents IA, favoris, likes, historique, préférences et notifications seront centralisés ici.</p>
            </div>
            <button onClick={signOut} className="w-fit rounded-xl bg-white px-4 py-3 text-xs font-semibold text-ink">Se déconnecter</button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accountStats.map(({ label, key, icon: Icon }) => (
            <article key={label} className="rounded-3xl bg-white p-5 shadow-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-sage text-moss"><Icon size={18} /></span>
              <p className="mt-5 text-2xl font-semibold">{counters[key]}</p>
              <p className="mt-1 text-xs text-ink/40">{label}</p>
            </article>
          ))}
        </div>

        <div className="mt-6">
          <AgentProfiles />
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell py-10 sm:py-16">
      <div className="grid min-h-[650px] overflow-hidden rounded-4xl bg-white shadow-soft lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="relative"><p className="text-xs font-semibold uppercase tracking-[.2em] text-white/50">Votre espace Liberty</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em]">Gardez le meilleur<br />à portée de main.</h1><div className="mt-8 grid gap-3 text-sm text-white/65"><p className="flex items-center gap-3"><Heart size={17} /> Likes et favoris protégés</p><p className="flex items-center gap-3"><Bookmark size={17} /> Agents IA et historique personnel</p></div></div>
        </div>
        <div className="flex items-center justify-center p-7 sm:p-14">
          <div className="w-full max-w-md"><span className="grid size-12 place-items-center rounded-2xl bg-sage text-moss"><UserRound size={22} /></span><h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">Ravi de vous revoir.</h2><p className="mt-3 text-sm leading-6 text-ink/50">Connectez-vous pour retrouver vos agents IA, favoris, likes, historique, préférences et notifications.</p>
            <div className="mt-8 grid gap-3">
              <button onClick={() => signIn("google")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold">G Continuer avec Google</button>
              <button onClick={() => signIn("apple")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold"><Apple size={17} /> Continuer avec Apple</button>
            </div>
            <form className="mt-6 space-y-4">
              <label className="block"><span className="mb-2 block text-sm font-medium">Adresse e-mail</span><span className="flex items-center gap-3 rounded-2xl border border-black/10 px-4"><Mail size={17} className="text-ink/30" /><input type="email" placeholder="vous@exemple.fr" className="w-full bg-transparent py-4 text-sm outline-none" /></span></label>
              <label className="block"><span className="mb-2 flex justify-between text-sm font-medium">Mot de passe <Link href="#" className="text-moss">Mot de passe oublié ?</Link></span><span className="flex items-center gap-3 rounded-2xl border border-black/10 px-4"><LockKeyhole size={17} className="text-ink/30" /><input type="password" placeholder="••••••••" className="w-full bg-transparent py-4 text-sm outline-none" /></span></label>
              <button onClick={() => signIn("classic")} type="button" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-sm font-semibold text-white">Se connecter <ArrowRight size={17} /></button>
            </form>
            <p className="mt-8 rounded-2xl bg-cream p-4 text-center text-xs leading-5 text-ink/45">Mode démonstration — l’architecture est prête pour Supabase Auth.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
