"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Apple, Heart, Mail, UserRound } from "lucide-react";
import { useSupabaseAuth } from "@/components/providers/supabase-auth-provider";

export function AccountDashboard() {
  const auth = useSupabaseAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const profileMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFirstName(auth.profile?.first_name ?? "");
    setLastName(auth.profile?.last_name ?? "");
    setPhone(auth.profile?.phone ?? "");
  }, [auth.profile]);

  useEffect(() => {
    return () => {
      if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    };
  }, []);

  const validateEmailForm = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return "Indiquez votre email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return "Indiquez un email valide.";
    if (!password) return "Indiquez votre mot de passe.";
    if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
    return "";
  };

  const submitEmail = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (submitting) return;
    setMessage("");
    setFieldError("");
    const validationError = validateEmailForm();
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setSubmitting(true);
    if (mode === "signin") {
      const result = await auth.signInWithEmail(email, password);
      setMessage(result.error ?? "Connexion réussie.");
      setSubmitting(false);
      return;
    }
    const result = await auth.signUpWithEmail(email, password);
    setMessage(result.error ?? (result.confirmationRequired ? "Compte créé dans Supabase. Vérifiez votre email pour confirmer l’inscription avant de vous connecter." : "Compte créé et session ouverte."));
    setSubmitting(false);
  };

  const submitOAuth = async (provider: "google" | "apple") => {
    setMessage("");
    const result = provider === "google" ? await auth.signInWithGoogle() : await auth.signInWithApple();
    if (result.error) setMessage(result.error);
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
    if (savingProfile) return;
    setProfileMessage("");
    setProfileError("");
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();
    if (cleanFirstName.length > 80 || cleanLastName.length > 80 || cleanPhone.length > 40) {
      setProfileError("Impossible d’enregistrer vos informations. Réessayez.");
      return;
    }
    setSavingProfile(true);
    const result = await auth.updateProfile({ first_name: cleanFirstName, last_name: cleanLastName, phone: cleanPhone });
    setSavingProfile(false);
    if (result.error) {
      setProfileError(`Impossible d’enregistrer vos informations. Réessayez. ${result.error}`);
      return;
    }
    setFirstName(result.profile?.first_name ?? cleanFirstName);
    setLastName(result.profile?.last_name ?? cleanLastName);
    setPhone(result.profile?.phone ?? cleanPhone);
    setProfileMessage("Vos informations ont bien été enregistrées.");
    if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    profileMessageTimer.current = setTimeout(() => setProfileMessage(""), 4500);
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
          {auth.googleAuthEnabled && <button onClick={() => void submitOAuth("google")} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold">G Continuer avec Google</button>}
          {auth.appleAuthEnabled && <button onClick={() => void submitOAuth("apple")} className="flex items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-4 text-sm font-semibold"><Apple size={17} /> Continuer avec Apple</button>}
          <form onSubmit={submitEmail} className="rounded-3xl border border-black/10 bg-white p-3">
            <div className="grid gap-2">
              <input value={email} onChange={(event) => { setEmail(event.target.value); setFieldError(""); }} type="email" placeholder="Email" autoComplete="email" aria-invalid={Boolean(fieldError)} className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
              <input value={password} onChange={(event) => { setPassword(event.target.value); setFieldError(""); }} type="password" placeholder="Mot de passe" autoComplete={mode === "signin" ? "current-password" : "new-password"} aria-invalid={Boolean(fieldError)} className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"><Mail size={15} /> {submitting ? (mode === "signin" ? "Connexion…" : "Création du compte…") : mode === "signin" ? "Connexion Email" : "Créer mon compte"}</button>
              <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); setFieldError(""); }} className="rounded-2xl border border-black/10 py-3 text-xs font-semibold">{mode === "signin" ? "Créer un compte" : "J’ai déjà un compte"}</button>
            </div>
            <button type="button" onClick={resetPassword} className="mt-3 w-full text-center text-xs font-semibold text-moss">Mot de passe oublié ?</button>
            {fieldError && <p className="mt-3 text-center text-xs text-red-500">{fieldError}</p>}
            {message && <p className="mt-3 text-center text-xs text-ink/45">{message}</p>}
          </form>
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
        {auth.profileLoadError && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">{auth.profileLoadError}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="px-1 text-xs font-semibold text-ink/45">Email</span>
            <input value={auth.user.email ?? ""} readOnly className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/45 outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="px-1 text-xs font-semibold text-ink/45">Prénom</span>
            <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Prénom" autoComplete="given-name" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="px-1 text-xs font-semibold text-ink/45">Nom</span>
            <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nom" autoComplete="family-name" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
          </label>
          <label className="grid gap-2">
            <span className="px-1 text-xs font-semibold text-ink/45">Téléphone</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone optionnel" autoComplete="tel" className="rounded-2xl bg-cream px-4 py-3 text-sm outline-none" />
          </label>
          <button onClick={saveProfile} disabled={savingProfile} className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">{savingProfile ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
        {profileMessage && <p role="status" aria-live="polite" className="mt-4 rounded-2xl bg-sage p-4 text-sm font-medium text-moss">{profileMessage}</p>}
        {profileError && <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">{profileError}</p>}
      </section>
    </div>
  );
}
