"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Heart,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  RefreshCw,
  Send,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  User,
  UserRound,
  X,
} from "lucide-react";
import {
  getCurrentUser,
  initiateOfficialOAuth,
  logoutUser,
  sendEmailOtp,
  updateProfile,
  verifyEmailOtp,
  authStateChangedEvent,
  isSupabaseLive,
  type LibertyUser,
} from "@/lib/auth/auth-service";
import {
  favoritesChangedEvent,
  listFavorites,
  toggleFavorite,
  type FavoriteRecord,
} from "@/lib/favorites/favorites-service";
import { setCustomSupabaseCredentials, getSupabaseConfig } from "@/lib/supabase/client";
import { assetPath } from "@/lib/assets";
import { POPULAR_CITIES } from "@/lib/hebcal";

export function AccountDashboard() {
  const [currentUser, setCurrentUser] = useState<LibertyUser | null>(null);
  const [activeTab, setActiveTab] = useState<"favorites" | "profile" | "preferences" | "security">("favorites");

  // Email OTP Authentication Step
  // 'input_email' -> 'input_code'
  const [authStep, setAuthStep] = useState<"input_email" | "input_code">("input_email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Profile Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("Paris");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const profileMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Supabase Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customKey, setCustomKey] = useState("");

  // Favorites in Account
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Initialisation et écoute des changements d'authentification
  useEffect(() => {
    const syncUser = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setPhone(user.phone || "");
        setSelectedCity(user.city || "Paris");
      }
    };

    syncUser();
    window.addEventListener(authStateChangedEvent, syncUser);

    const cfg = getSupabaseConfig();
    if (cfg) {
      setCustomUrl(cfg.url);
      setCustomKey(cfg.key);
    }

    return () => {
      window.removeEventListener(authStateChangedEvent, syncUser);
      if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    };
  }, []);

  // Timer pour le renvoi d'email OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Charger les favoris
  const refreshFavorites = async () => {
    try {
      const list = await listFavorites();
      setFavorites(list);
    } catch {
      // Fallback
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    refreshFavorites();
    window.addEventListener(favoritesChangedEvent, refreshFavorites);
    return () => {
      window.removeEventListener(favoritesChangedEvent, refreshFavorites);
    };
  }, []);

  // =========================================================================
  // ACTIONS D'AUTHENTIFICATION OFFICIELLE
  // =========================================================================

  // 1. Google OAuth Officiel
  const handleGoogleOAuth = async () => {
    setSubmitting(true);
    setFieldError("");
    setMessage("");

    const res = await initiateOfficialOAuth("google");
    setSubmitting(false);

    if (!res.success) {
      if (!isSupabaseLive()) {
        setShowConfigModal(true);
      } else {
        setFieldError(res.error || "Erreur de connexion avec Google.");
      }
    }
  };

  // 2. Apple OAuth Officiel
  const handleAppleOAuth = async () => {
    setSubmitting(true);
    setFieldError("");
    setMessage("");

    const res = await initiateOfficialOAuth("apple");
    setSubmitting(false);

    if (!res.success) {
      if (!isSupabaseLive()) {
        setShowConfigModal(true);
      } else {
        setFieldError(res.error || "Erreur de connexion avec Apple.");
      }
    }
  };

  // 3. Envoi du Code de Sécurité par Email (Gmail, etc.)
  const handleSendOtpEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setFieldError("Veuillez renseigner une adresse email valide (ex: contact@gmail.com).");
      return;
    }

    setSubmitting(true);
    setFieldError("");
    setMessage("");

    const res = await sendEmailOtp(cleanEmail);
    setSubmitting(false);

    if (res.success) {
      setMessage(res.message);
      setAuthStep("input_code");
      setCountdown(60);
    } else {
      setFieldError(res.error || "Impossible d'envoyer l'email de vérification.");
    }
  };

  // 4. Validation du Code Reçu par Email
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = otpCode.trim();
    if (!cleanToken) {
      setFieldError("Veuillez saisir le code de sécurité à 6 chiffres reçu dans vos emails.");
      return;
    }

    setSubmitting(true);
    setFieldError("");

    const res = await verifyEmailOtp(email, cleanToken);
    setSubmitting(false);

    if (res.success) {
      setMessage("Authentification réussie !");
      setAuthStep("input_email");
      setOtpCode("");
    } else {
      setFieldError(res.error || "Code invalide. Veuillez réessayer.");
    }
  };

  // 5. Enregistrement du Profil
  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSavingProfile(true);
    setProfileMessage("");

    const res = await updateProfile(currentUser.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      city: selectedCity,
    });

    setSavingProfile(false);
    if (res.success) {
      setProfileMessage("Vos informations ont bien été mises à jour !");
      if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
      profileMessageTimer.current = setTimeout(() => setProfileMessage(""), 4000);
    }
  };

  // 6. Déconnexion
  const handleSignOut = async () => {
    await logoutUser();
    setEmail("");
    setOtpCode("");
    setAuthStep("input_email");
    setMessage("");
    setFieldError("");
  };

  const handleRemoveFavorite = async (item: FavoriteRecord) => {
    await toggleFavorite(item.establishmentId);
    refreshFavorites();
  };

  const handleSaveCustomSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) {
      alert("Veuillez renseigner l'URL Supabase et la clé Anon.");
      return;
    }
    setCustomSupabaseCredentials(customUrl, customKey);
  };

  // =========================================================================
  // ÉCRAN 1 : FORMULAIRE DE SÉCURITÉ OFFICIEL (EMAIL OTP & GOOGLE OAUTH)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="text-center sm:text-left">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f6ecd9] text-[#8f6424] shadow-2xs">
            <Lock size={22} />
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Connexion Sécurisée Liberty
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            Conformément aux protocoles de sécurité officiels, connectez-vous directement via Google ou recevez un code de vérification sécurisé sur votre adresse Gmail/Email.
          </p>
        </div>

        {/* Boutons d'authentification OAuth officiels */}
        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-3.5 px-4 text-xs font-bold text-ink shadow-2xs transition hover:border-[#4285F4] hover:bg-[#4285F4]/5 hover:shadow-sm"
          >
            <svg className="size-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continuer avec Google (Gmail)
          </button>

          <button
            type="button"
            onClick={handleAppleOAuth}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-black/10 bg-white py-3.5 px-4 text-xs font-bold text-ink shadow-2xs transition hover:border-ink hover:bg-black/5"
          >
            <svg className="size-4 shrink-0 fill-current text-ink" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.57-11.05-20.73-14.25-33.48-3.2-12.75-4.81-24.3-4.81-34.64 0-14.88 3.72-27.18 11.16-36.9 7.44-9.72 17.08-14.69 28.92-14.9 5.37 0 11.16 1.34 17.38 4.02 6.22 2.68 10.23 4.08 12.03 4.2 1.68-.22 5.92-1.63 12.74-4.2 6.81-2.58 12.69-3.77 17.65-3.58 12.83.66 22.86 5.32 30.08 13.98-10.97 6.64-16.32 15.75-16.06 27.34.22 9.07 3.74 16.63 10.56 22.68 6.82 6.05 14.89 9.38 24.2 9.99-2.23 6.94-4.89 13.88-7.97 20.82zM119.22 31.85c0-7.39 2.68-14.28 8.04-20.67 5.36-6.39 12.03-10.36 20.02-11.18.22 1.12.34 2.18.34 3.19 0 7.39-2.73 14.37-8.19 20.93-5.46 6.56-12.19 10.45-20.21 11.66-.22-1.34-.34-2.65-.34-3.93z" />
            </svg>
            Continuer avec Apple
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-black/10" />
          <span className="absolute bg-white px-3 text-xs font-semibold text-ink/40">
            ou par code de vérification par email
          </span>
        </div>

        {/* ÉTAPE 1 : ENTRER L'EMAIL POUR RECEVOIR LE CODE */}
        {authStep === "input_email" && (
          <form
            onSubmit={handleSendOtpEmail}
            className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 shadow-xs"
          >
            <div>
              <label className="text-xs font-bold text-ink/60">Votre adresse Email (Gmail, etc.)</label>
              <div className="mt-1.5 flex items-center rounded-2xl bg-cream px-4 py-3">
                <Mail size={16} className="text-ink/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldError("");
                  }}
                  placeholder="ex: votre-adresse@gmail.com"
                  autoComplete="email"
                  className="ml-3 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                />
              </div>
            </div>

            {fieldError && <p className="text-center text-xs font-semibold text-rose-600">{fieldError}</p>}
            {message && <p className="text-center text-xs font-semibold text-moss">{message}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss disabled:opacity-60"
            >
              <Send size={14} />
              {submitting ? "Envoi du code sécurisé…" : "M'envoyer mon code de connexion par email"}
            </button>

            <p className="text-center text-[11px] text-ink/45">
              🔒 Un email contenant votre code de vérification à 6 chiffres vous sera instantanément envoyé.
            </p>
          </form>
        )}

        {/* ÉTAPE 2 : SAISIR LE CODE DE SÉCURITÉ REÇU DANS GMAIL */}
        {authStep === "input_code" && (
          <form
            onSubmit={handleVerifyOtp}
            className="space-y-5 rounded-3xl border border-black/10 bg-white p-6 shadow-xs"
          >
            <div className="text-center">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-moss">
                <KeyRound size={18} />
              </span>
              <h3 className="mt-2 text-base font-bold text-ink">Code de vérification envoyé</h3>
              <p className="mt-1 text-xs text-ink/60">
                Veuillez saisir le code à 6 chiffres envoyé à <strong className="text-ink">{email}</strong>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-center block text-xs font-bold text-ink/60">Code de sécurité à 6 chiffres</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setFieldError("");
                }}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.4em] font-mono text-xl font-bold rounded-2xl bg-cream py-3.5 text-ink outline-none focus:bg-white focus:ring-2 focus:ring-moss/20"
              />
            </div>

            {fieldError && <p className="text-center text-xs font-semibold text-rose-600">{fieldError}</p>}
            {message && <p className="text-center text-xs font-semibold text-moss">{message}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss disabled:opacity-60"
            >
              <Check size={16} />
              {submitting ? "Vérification du code…" : "Valider mon identité et me connecter"}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthStep("input_email");
                  setFieldError("");
                  setMessage("");
                }}
                className="font-semibold text-ink/50 hover:text-ink"
              >
                ← Changer d&apos;email
              </button>

              <button
                type="button"
                onClick={handleSendOtpEmail}
                disabled={countdown > 0}
                className="font-bold text-moss hover:underline disabled:opacity-40"
              >
                {countdown > 0 ? `Renvoyer (${countdown}s)` : "Renvoyer le code"}
              </button>
            </div>
          </form>
        )}

        {/* Bouton discret pour configurer Supabase si besoin */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/40 hover:text-ink"
          >
            <Settings size={13} />
            {isSupabaseLive() ? "Backend Supabase connecté" : "Paramètres de connexion Supabase & Google"}
          </button>
        </div>

        {/* MODALE DE CONFIGURATION SUPABASE & GOOGLE */}
        {showConfigModal && (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowConfigModal(false);
            }}
          >
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="absolute right-5 top-5 grid size-8 place-items-center rounded-full bg-cream text-ink/50 hover:bg-ink hover:text-white"
              >
                <X size={15} />
              </button>

              <h3 className="text-lg font-bold text-ink">Connexion Projet Supabase</h3>
              <p className="mt-1 text-xs text-ink/60">
                Pour router automatiquement vos redirections Google OAuth et envoyer les emails officiels via votre propre serveur :
              </p>

              <form onSubmit={handleSaveCustomSupabase} className="mt-5 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-ink/50">URL du projet Supabase</label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full rounded-2xl bg-cream px-4 py-2.5 text-xs font-medium text-ink outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-ink/50">Clé Publique Anon Key</label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="w-full rounded-2xl bg-cream px-4 py-2.5 text-xs font-medium text-ink outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-xs font-bold text-white shadow-md hover:bg-moss"
                >
                  Enregistrer et connecter
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // ÉCRAN 2 : ESPACE UTILISATEUR CONNECTÉ (AVEC REPERTOIRE DE FAVORIS)
  // =========================================================================
  return (
    <div className="w-full space-y-8">
      {/* En-tête Profil Utilisateur */}
      <div className="flex flex-col gap-6 rounded-[2.5rem] border border-black/[.06] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="size-16 rounded-2xl object-cover shadow-sm"
              />
            ) : (
              <div className="grid size-16 place-items-center rounded-2xl bg-[#f6ecd9] text-xl font-bold text-[#8f6424] shadow-2xs">
                {currentUser.firstName?.[0] || currentUser.name?.[0] || "U"}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-emerald-500 text-[10px] text-white shadow-2xs">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-ink sm:text-2xl">{currentUser.name}</h2>
              <span className="rounded-full bg-[#f6ecd9] px-2.5 py-0.5 text-[10px] font-bold text-[#8f6424]">
                Membre Privilège Vérifié
              </span>
            </div>
            <p className="text-xs text-ink/50">{currentUser.email}</p>
            <p className="mt-0.5 text-[11px] text-ink/40">
              Session sécurisée • Ville : {currentUser.city || "Paris"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-2xl border border-black/10 bg-cream px-5 py-2.5 text-xs font-bold text-ink/75 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={14} /> Se déconnecter
        </button>
      </div>

      {/* Barre d'onglets */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-4">
        {[
          { id: "favorites", label: `Mes Favoris (${favorites.length})`, icon: Heart },
          { id: "profile", label: "Mon Profil", icon: User },
          { id: "preferences", label: "Mes Alertes & Chabbat", icon: Bell },
          { id: "security", label: "Sécurité & Données", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                isActive
                  ? "bg-ink text-white shadow-xs"
                  : "bg-white border border-black/5 text-ink/60 hover:bg-cream hover:text-ink"
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : RÉPERTOIRE DES FAVORIS */}
      {/* ========================================================================= */}
      {activeTab === "favorites" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-ink">Mes Adresses & Coups de Cœur</h3>
              <p className="text-xs text-ink/50">
                Vos sélections enregistrées pour un accès instantané sur tous vos appareils.
              </p>
            </div>
            <Link
              href="/mes-favoris"
              className="flex items-center gap-1.5 rounded-2xl bg-cream px-4 py-2 text-xs font-bold text-ink hover:bg-ink hover:text-white transition"
            >
              Voir la page complète <ChevronRight size={14} />
            </Link>
          </div>

          {loadingFavorites ? (
            <div className="grid min-h-40 place-items-center rounded-3xl bg-white p-8 text-center text-xs text-ink/40">
              Chargement de vos favoris…
            </div>
          ) : favorites.length === 0 ? (
            <div className="grid min-h-60 place-items-center rounded-3xl border border-dashed border-black/10 bg-white/60 p-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f6ecd9] text-[#8f6424]">
                  <Heart size={22} />
                </span>
                <p className="mt-4 text-base font-bold text-ink">Aucun favori enregistré pour le moment</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-ink/50">
                  Parcourez nos restaurants, boutiques et activités et cliquez sur le cœur pour les garder à portée de main.
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-moss transition"
                >
                  <Sparkles size={14} /> Explorer le Guide Liberty
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((fav) => (
                <article
                  key={fav.establishmentId}
                  className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xs transition hover:shadow-md"
                >
                  <Link href={fav.href} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden bg-cream">
                      <img
                        src={assetPath(fav.image)}
                        alt=""
                        className="size-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-rose-500 shadow-2xs">
                        <Heart size={14} fill="currentColor" />
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8f6424]">
                        {fav.category} {fav.subcategory ? `· ${fav.subcategory}` : ""}
                      </p>
                      <h4 className="mt-1 truncate text-base font-bold text-ink">{fav.title}</h4>
                      <p className="truncate text-xs text-ink/45">{fav.city || "Paris"}</p>
                    </div>
                  </Link>
                  <div className="flex items-center justify-between border-t border-black/5 p-3">
                    <Link
                      href={fav.href}
                      className="rounded-xl bg-ink px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-moss"
                    >
                      Consulter
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(fav)}
                      className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={13} /> Retirer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : MON PROFIL & COORDONNÉES */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="max-w-2xl rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-ink">Informations Personnelles</h3>
            <p className="text-xs text-ink/50">Mettez à jour vos coordonnées pour vos réservations et vos préférences.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink/60">Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-ink outline-none focus:bg-white focus:ring-2 focus:ring-moss/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-ink/60">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-ink outline-none focus:bg-white focus:ring-2 focus:ring-moss/20"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-ink/60">Adresse Email</label>
              <input
                type="email"
                value={currentUser.email}
                readOnly
                className="w-full rounded-2xl bg-cream/50 px-4 py-3 text-xs font-medium text-ink/50 outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-ink/60">Téléphone (SMS & Réservations)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 00 00 00 00"
                className="w-full rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-ink outline-none focus:bg-white focus:ring-2 focus:ring-moss/20"
              />
            </div>
          </div>

          {profileMessage && (
            <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              <Check size={15} /> {profileMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss disabled:opacity-60"
          >
            {savingProfile ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : MES ALERTES & CHABBAT */}
      {/* ========================================================================= */}
      {activeTab === "preferences" && (
        <div className="max-w-2xl rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-ink">Préférences du Calendrier Hébraïque</h3>
            <p className="text-xs text-ink/50">Choisissez votre ville par défaut pour les horaires de Chabbat et fêtes.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-ink/60 flex items-center gap-1.5">
              <MapPin size={14} className="text-moss" /> Ville par défaut
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-xs font-bold text-ink shadow-2xs outline-none"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name} ({c.country})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl bg-[#f6ecd9] p-4 text-xs text-[#8f6424]">
            💡 Les rappels de Chabbat seront automatiquement synchronisés 15 minutes avant l&apos;allumage des bougies pour cette ville.
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="rounded-2xl bg-ink px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-moss"
          >
            Mémoriser ma ville préférée
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 4 : SÉCURITÉ DU COMPTE */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="max-w-2xl rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-ink">Sécurité & Confidentialité</h3>
            <p className="text-xs text-ink/50">Votre session est chiffrée et protégée conformément aux normes RGPD et PKCE.</p>
          </div>

          <div className="space-y-3 rounded-2xl bg-cream/70 p-4 text-xs text-ink/75">
            <p className="flex items-center gap-2 font-bold text-ink">
              <Lock size={14} className="text-moss" /> Statut de sécurité : Authentifié & Chiffré
            </p>
            <p>Type d&apos;authentification : OTP Email / OAuth Vérifié</p>
            <p>Adresse vérifiée : {currentUser.email}</p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-2xl bg-rose-50 px-5 py-3 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
            >
              Fermer ma session active
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
