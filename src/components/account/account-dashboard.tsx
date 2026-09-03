"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Heart,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserRound,
  X,
} from "lucide-react";
import {
  getCurrentUser,
  loginWithEmail,
  logoutUser,
  registerWithEmail,
  updateProfile,
  authStateChangedEvent,
  type LibertyUser,
} from "@/lib/auth/auth-service";
import {
  favoritesChangedEvent,
  listFavorites,
  toggleFavorite,
  type FavoriteRecord,
} from "@/lib/favorites/favorites-service";
import { assetPath } from "@/lib/assets";
import { POPULAR_CITIES } from "@/lib/hebcal";

export function AccountDashboard({
  initialAuthMode = "login",
}: {
  initialAuthMode?: "login" | "register";
} = {}) {
  const [currentUser, setCurrentUser] = useState<LibertyUser | null>(null);
  const [activeTab, setActiveTab] = useState<"favorites" | "profile" | "preferences" | "security">("favorites");

  // Auth form states (Email + Password only)
  const [authMode, setAuthMode] = useState<"login" | "register">(initialAuthMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Profile Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("Paris");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const profileMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Favorites in Account
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Initialisation et synchronisation de l'utilisateur
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

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("mode") || params.get("signup");
      if (mode === "register" || mode === "signup" || mode === "true") {
        setAuthMode("register");
      }
    }

    window.addEventListener(authStateChangedEvent, syncUser);

    return () => {
      window.removeEventListener(authStateChangedEvent, syncUser);
      if (profileMessageTimer.current) clearTimeout(profileMessageTimer.current);
    };
  }, []);

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
  }, [currentUser]);

  // =========================================================================
  // ACTIONS D'AUTHENTIFICATION EMAIL & MOT DE PASSE SÉCURISÉES
  // =========================================================================

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setSuccessMessage("");
    setSubmitting(true);

    const res = await loginWithEmail(email, password);
    setSubmitting(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
    } else {
      setFieldError(res.error || "Email ou mot de passe incorrect.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError("");
    setSuccessMessage("");
    setSubmitting(true);

    const res = await registerWithEmail({
      email,
      password,
      firstName: regFirstName,
      lastName: regLastName,
      city: selectedCity,
    });
    setSubmitting(false);

    if (res.success && res.user) {
      setSuccessMessage(res.message || "Félicitations ! Votre compte est créé sur Liberty K.");
      setCurrentUser(res.user);
    } else {
      setFieldError(res.error || "Impossible de créer votre compte.");
    }
  };

  // Enregistrement du Profil
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

  // Déconnexion
  const handleSignOut = async () => {
    await logoutUser();
    setEmail("");
    setPassword("");
    setFieldError("");
    setSuccessMessage("");
    setFavorites([]);
  };

  const handleRemoveFavorite = async (item: FavoriteRecord) => {
    await toggleFavorite(item.establishmentId);
    refreshFavorites();
  };

  // =========================================================================
  // ÉCRAN 1 : FORMULAIRE DE CONNEXION SÉCURISÉ & DIRECT (EMAIL + MOT DE PASSE)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="text-center sm:text-left">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f6ecd9] text-[#8f6424] shadow-2xs">
            <Lock size={22} />
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {authMode === "login" ? "Connexion à mon compte" : "Créer mon compte"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">
            {authMode === "login"
              ? "Connectez-vous simplement et en toute sécurité avec votre adresse email et mot de passe."
              : "Créez votre compte en quelques secondes pour sauvegarder vos favoris et accéder à tous les services Libertyk."}
          </p>
        </div>

        {/* Onglets Connexion / Inscription */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-cream p-1.5 text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setAuthMode("login");
              setFieldError("");
              setSuccessMessage("");
            }}
            className={`rounded-xl py-3 transition ${
              authMode === "login" ? "bg-white text-ink shadow-xs" : "text-ink/50 hover:text-ink"
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("register");
              setFieldError("");
              setSuccessMessage("");
            }}
            className={`rounded-xl py-3 transition ${
              authMode === "register" ? "bg-white text-ink shadow-xs" : "text-ink/50 hover:text-ink"
            }`}
          >
            Créer un compte
          </button>
        </div>

        {/* FORMULAIRE DE CONNEXION */}
        {authMode === "login" && (
          <form
            onSubmit={handleLoginSubmit}
            className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs"
          >
            <div>
              <label className="text-xs font-bold text-ink/60">Adresse Email</label>
              <div className="mt-1.5 flex items-center rounded-2xl bg-cream px-4 py-3.5 focus-within:ring-2 focus-within:ring-ink/10">
                <Mail size={16} className="text-ink/40" />
                <input
                  type="email"
                  required
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

            <div>
              <label className="text-xs font-bold text-ink/60">Mot de passe</label>
              <div className="mt-1.5 flex items-center rounded-2xl bg-cream px-4 py-3.5 focus-within:ring-2 focus-within:ring-ink/10">
                <Lock size={16} className="text-ink/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="ml-3 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                />
              </div>
            </div>

            {fieldError && <p className="text-center text-xs font-semibold text-rose-600 animate-in fade-in">{fieldError}</p>}
            {successMessage && <p className="text-center text-xs font-semibold text-moss animate-in fade-in">{successMessage}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss disabled:opacity-60"
            >
              <Lock size={14} />
              {submitting ? "Connexion en cours…" : "Se connecter"}
            </button>

            <p className="text-center text-xs text-ink/50 pt-1">
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setFieldError("");
                }}
                className="font-bold text-moss underline"
              >
                Créer un compte
              </button>
            </p>
          </form>
        )}

        {/* FORMULAIRE DE CRÉATION DE COMPTE */}
        {authMode === "register" && (
          <form
            onSubmit={handleRegisterSubmit}
            className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-ink/60">Prénom</label>
                <div className="mt-1.5 flex items-center rounded-2xl bg-cream px-4 py-3 focus-within:ring-2 focus-within:ring-ink/10">
                  <User size={15} className="text-ink/40" />
                  <input
                    type="text"
                    required
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    placeholder="Prénom"
                    className="ml-2 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-ink/60">Nom</label>
                <div className="mt-1.5 flex items-center rounded-2xl bg-cream px-4 py-3 focus-within:ring-2 focus-within:ring-ink/10">
                  <input
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Nom"
                    className="w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-ink/60">Adresse Email</label>
              <div className="mt-1.5 flex items-center rounded-2xl bg-cream px-4 py-3 focus-within:ring-2 focus-within:ring-ink/10">
                <Mail size={16} className="text-ink/40" />
                <input
                  type="email"
                  required
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

            <div>
              <label className="text-xs font-bold text-ink/60">Mot de passe (min. 6 caractères)</label>
              <div className="mt-1.5 flex items-center rounded-2xl bg-cream px-4 py-3 focus-within:ring-2 focus-within:ring-ink/10">
                <Lock size={16} className="text-ink/40" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="ml-3 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                />
              </div>
            </div>

            {fieldError && <p className="text-center text-xs font-semibold text-rose-600 animate-in fade-in">{fieldError}</p>}
            {successMessage && <p className="text-center text-xs font-semibold text-moss animate-in fade-in">{successMessage}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss disabled:opacity-60"
            >
              <ShieldCheck size={16} />
              {submitting ? "Création du compte…" : "Créer mon compte"}
            </button>

            <p className="text-center text-xs text-ink/50 pt-1">
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setFieldError("");
                }}
                className="font-bold text-moss underline"
              >
                Se connecter
              </button>
            </p>
          </form>
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
                Compte Membre Vérifié
              </span>
            </div>
            <p className="text-xs text-ink/50">{currentUser.email}</p>
            <p className="mt-0.5 text-[11px] text-ink/40">
              Connexion sécurisée Email • Ville : {currentUser.city || "Paris"}
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
      {/* ONGLET 1 : MES FAVORIS ENREGISTRÉS                                         */}
      {/* ========================================================================= */}
      {activeTab === "favorites" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink">Mes Adresses Préférées</h3>
              <p className="text-xs text-ink/50">
                Vos favoris sont sauvegardés sur votre compte et synchronisés.
              </p>
            </div>
            <Link
              href="/food/restaurants"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-moss hover:underline"
            >
              Découvrir plus d&apos;adresses <ChevronRight size={14} />
            </Link>
          </div>

          {loadingFavorites ? (
            <div className="grid min-h-60 place-items-center rounded-3xl bg-white p-8 shadow-xs">
              <p className="text-xs font-semibold text-ink/40">Chargement de vos favoris…</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center shadow-xs">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f6ecd9] text-[#8f6424]">
                  <Heart size={20} />
                </span>
                <h4 className="mt-3 text-base font-bold text-ink">Aucun favori enregistré</h4>
                <p className="mt-1 text-xs text-ink/50 leading-relaxed">
                  Naviguez sur le site et cliquez sur le cœur ❤️ d&apos;un restaurant, salon de thé ou boutique pour l&apos;ajouter ici.
                </p>
                <Link
                  href="/food/restaurants"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-bold text-white transition hover:bg-moss"
                >
                  Explorer les restaurants cachers
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-3xl border border-black/5 bg-white p-4 shadow-xs transition hover:shadow-md"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-cream">
                    <img
                      src={assetPath(item.image)}
                      alt={item.title}
                      className="size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFavorite(item)}
                      title="Retirer des favoris"
                      className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/90 text-rose-600 shadow-sm transition hover:bg-rose-600 hover:text-white"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-moss">
                      {item.subcategory || item.category}
                    </span>
                    <h4 className="mt-0.5 text-sm font-bold text-ink line-clamp-1">{item.title}</h4>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink/50">
                      <MapPin size={11} /> {item.city || "Paris"}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
                    <Link
                      href={item.href}
                      className="text-xs font-bold text-ink hover:text-moss inline-flex items-center gap-1"
                    >
                      Consulter la fiche <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : MON PROFIL                                                      */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xs sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-ink">Informations Personnelles</h3>
            <p className="text-xs text-ink/50">
              Gérez vos coordonnées pour personnaliser votre expérience sur Libertyk.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-ink/60">Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1.5 w-full rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-ink outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink/60">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1.5 w-full rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-ink outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink/60">Adresse Email</label>
              <input
                type="email"
                disabled
                value={currentUser.email}
                className="mt-1.5 w-full rounded-2xl bg-black/5 px-4 py-3 text-xs font-medium text-ink/50 outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink/60">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="mt-1.5 w-full rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-ink outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-ink/60">Ville Principale (pour horaires Chabbat & Fêtes)</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="mt-1.5 w-full rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-ink outline-none"
              >
                {POPULAR_CITIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {profileMessage && (
            <p className="rounded-xl bg-emerald-50 p-3 text-center text-xs font-bold text-moss">
              {profileMessage}
            </p>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={savingProfile}
              onClick={handleSaveProfile}
              className="flex items-center gap-2 rounded-2xl bg-ink px-6 py-3 text-xs font-bold text-white transition hover:bg-moss disabled:opacity-60"
            >
              <Check size={14} /> {savingProfile ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : PRÉFÉRENCES & CHABBAT                                          */}
      {/* ========================================================================= */}
      {activeTab === "preferences" && (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xs sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-ink">Alertes & Notifications</h3>
            <p className="text-xs text-ink/50">
              Paramétrez la réception des horaires d&apos;entrée et de sortie de Chabbat et des fêtes juives.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                title: "Horaires de Chabbat par email",
                desc: "Recevez les horaires d&apos;allumage des bougies et de Havdala chaque vendredi matin.",
              },
              {
                title: "Alertes Fêtes & Yom Tov",
                desc: "Notifications 48h avant chaque fête (Roch Hachana, Kippour, Souccot, Pessa&apos;h...).",
              },
              {
                title: "Nouveaux restaurants cachers",
                desc: "Soyez informé(e) des nouvelles ouvertures cachers dans votre ville.",
              },
            ].map((pref, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-cream/40 p-4"
              >
                <div>
                  <h4 className="text-xs font-bold text-ink">{pref.title}</h4>
                  <p className="text-[11px] text-ink/50 mt-0.5">{pref.desc}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="size-4 rounded text-moss focus:ring-moss"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 4 : SÉCURITÉ & DONNÉES                                              */}
      {/* ========================================================================= */}
      {activeTab === "security" && (
        <div className="rounded-3xl border border-black/5 bg-white p-6 shadow-xs sm:p-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-ink">Sécurité & Confidentialité</h3>
            <p className="text-xs text-ink/50">
              Vos données sont protégées et chiffrées selon les standards de sécurité les plus stricts.
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50/70 p-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-moss shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-moss">Connexion Email Sécurisée</h4>
              <p className="text-[11px] text-ink/65 mt-0.5 leading-relaxed">
                Votre compte est protégé par votre mot de passe chiffré. Vos favoris et données personnelles sont strictement confidentiels.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-black/5 flex justify-between items-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/50 px-5 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
            >
              <LogOut size={14} /> Se déconnecter de tous les appareils
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
