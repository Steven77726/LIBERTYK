"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Apple, Heart, Mail, UserRound } from "lucide-react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";

export function AccountDashboard() {
  const auth = useSupabaseAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    setFirstName(auth.profile?.first_name ?? "");
    setLastName(auth.profile?.last_name ?? "");
    setPhone(auth.profile?.phone ?? "");
    setAvatarUrl(auth.profile?.avatar_url ?? "");
  }, [auth.profile]);

  const submitEmail = async () => {
    setMessage("");
    const result = mode === "signin" ? await auth.signInWithEmail(email, password) : await auth.signUpWithEmail(email, password);
    setMessage(result.error ?? (mode === "signin" ? "Connexion réussie." : "Compte créé. Vérifiez votre email si Supabase demande une confirmation."));
  };

  const resetPassword = async () => {
    if (!email) {
      setMessage("Indiquez votre email avant de demander la récupération.");
      return;
    }
    const result = await auth.resetPassword(email);
    setMessage(result.error ?? "Email de récupération envoyé.");
  };

  const saveProfile = async () => {
    const result = await auth.updateProfile({ first_name: firstName, last_name: lastName, phone, avatar_url: avatarUrl });
    setMessage(result.error ?? "Profil enregistré.");
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      setMessage("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    const result = await auth.updatePassword(newPassword);
    setMessage(result.error ?? "Mot de passe modifié.");
    if (!result.error) setNewPassword("");
  };

  if (auth.loading) {
    return <div className="rounded-[2rem] bg-white p-8 text-sm text-ink/50 shadow-soft">Chargement du compte…</div>;
  }

  if (!auth.configured) {
    return (
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-soft">
        <span className="grid size-12 place-items-center rounded-2xl bg-sage text-moss"><UserRound size={22} /></span>
        <h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">Connexion indisponible.</h2>
        <p className="mt-3 text-sm leading-6 text-ink/50">Supabase Auth n’est pas encore configuré. Ajoutez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`, puis configurez Google et Apple dans Supabase Auth.</p>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div className="w-full max-w-md">
        <span className="grid size-12 place-items-center rounded-2xl bg-sage text-moss"><UserRound size={22} /></span>
        <h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">{mode === "signin" ? "Connexion" : "Créer un compte"}</h2>
        <p className="mt-3 text-sm leading-6 text-ink/50">Connectez-vous pour retrouver vos favoris et votre compte sur tous vos appareils.</p>
        <div className="mt-8 grid gap-3">
          <button onClick={() => void auth.signInWithGoogle()} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold">G Continuer avec Google</button>
          <button onClick={() => void auth.signInWithApple()} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold"><Apple size={17} /> Continuer avec Apple</button>
          <div className="rounded-3xl border border-black/10 bg-white p-3">
            <div className="grid gap-2">
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Mot de passe" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button onClick={submitEmail} className="flex items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-xs font-semibold text-white"><Mail size={15} /> {mode === "signin" ? "Connexion Email" : "Créer le compte"}</button>
              <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="rounded-2xl border border-black/10 py-3 text-xs font-semibold">{mode === "signin" ? "Créer un compte" : "J’ai déjà un compte"}</button>
            </div>
            <button onClick={resetPassword} className="mt-3 w-full text-center text-xs font-semibold text-moss">Mot de passe oublié ?</button>
            {message && <p className="mt-3 text-center text-xs text-ink/45">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  const displayName = [auth.profile?.first_name, auth.profile?.last_name].filter(Boolean).join(" ") || auth.profile?.full_name || auth.user.email?.split("@")[0] || "Utilisateur Liberty";

  return (
    <div className="w-full space-y-6">
      <section className="rounded-[2rem] bg-white p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {auth.profile?.avatar_url ? <img src={auth.profile.avatar_url} alt="" className="size-16 rounded-full object-cover" /> : <span className="grid size-16 place-items-center rounded-full bg-sage text-moss"><UserRound size={24} /></span>}
            <div>
              <h2 className="text-2xl font-semibold tracking-[-.04em]">{displayName}</h2>
              <p className="mt-1 text-sm text-ink/45">{auth.user.email}</p>
            </div>
          </div>
          <button onClick={() => void auth.signOut()} className="rounded-xl bg-cream px-4 py-3 text-xs font-semibold">Déconnexion</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/mes-favoris" className="flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-4 text-sm font-semibold text-white"><Heart size={16} /> Mes Favoris</Link>
          <a href="#mon-compte" className="flex items-center justify-center gap-2 rounded-xl bg-cream px-4 py-4 text-sm font-semibold"><UserRound size={16} /> Mon Compte</a>
        </div>
      </section>

      <section id="mon-compte" className="rounded-[2rem] bg-white p-6 shadow-soft">
        <h3 className="text-xl font-semibold tracking-[-.03em]">Mon Compte</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="URL photo de profil" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
          <input value={auth.user.email ?? ""} disabled className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/45 outline-none" />
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Prénom" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nom" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone optionnel" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
          <button onClick={saveProfile} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">Enregistrer</button>
        </div>
        <div className="mt-6 rounded-3xl bg-cream p-4">
          <p className="text-sm font-semibold">Changer le mot de passe</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="Nouveau mot de passe" className="rounded-2xl bg-white px-4 py-3 text-sm outline-none" />
            <button onClick={changePassword} className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white">Changer</button>
          </div>
        </div>
        {message && <p className="mt-4 rounded-2xl bg-sage p-4 text-sm text-moss">{message}</p>}
      </section>
    </div>
  );
}
