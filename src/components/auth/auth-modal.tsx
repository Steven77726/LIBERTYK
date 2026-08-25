"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Heart, Lock, Mail, ShieldCheck, User, X, ArrowRight } from "lucide-react";
import {
  AUTH_MODAL_EVENT,
  loginWithEmail,
  registerWithEmail,
  type AuthModalOptions,
  type LibertyUser,
} from "@/lib/auth/auth-service";
import { toggleFavorite } from "@/lib/favorites/favorites-service";

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AuthModalOptions>({});
  const [tab, setTab] = useState<"login" | "register">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Success state
  const [successData, setSuccessData] = useState<{ user: LibertyUser; message: string; favoriteAdded?: boolean } | null>(null);

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<AuthModalOptions>;
      setOptions(customEvent.detail || {});
      setTab("login");
      setError("");
      setSuccessData(null);
      setIsOpen(true);
    };

    window.addEventListener(AUTH_MODAL_EVENT, handleOpen);
    return () => window.removeEventListener(AUTH_MODAL_EVENT, handleOpen);
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    setError("");
    setSuccessData(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginWithEmail(email, password);
      if (!res.success || !res.user) {
        setError(res.error || "Identifiants invalides.");
        setLoading(false);
        return;
      }

      let favoriteAdded = false;
      if (options.pendingFavoriteId) {
        try {
          await toggleFavorite(options.pendingFavoriteId);
          favoriteAdded = true;
        } catch {
          // Ignorer
        }
      }

      setSuccessData({
        user: res.user,
        message: `Heureux de vous revoir, ${res.user.firstName || res.user.name} !`,
        favoriteAdded,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await registerWithEmail({
        email,
        password,
        firstName,
        lastName,
      });

      if (!res.success || !res.user) {
        setError(res.error || "Impossible de créer le compte.");
        setLoading(false);
        return;
      }

      let favoriteAdded = false;
      if (options.pendingFavoriteId) {
        try {
          await toggleFavorite(options.pendingFavoriteId);
          favoriteAdded = true;
        } catch {
          // Ignorer
        }
      }

      setSuccessData({
        user: res.user,
        message: "Félicitations ! Votre compte est créé sur Liberty K.",
        favoriteAdded,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-cream text-ink/50 transition hover:bg-black/10 hover:text-ink"
          aria-label="Fermer"
        >
          <X size={18} />
        </button>

        {successData ? (
          <div className="text-center py-4 space-y-4">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-moss shadow-sm">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-ink">{successData.message}</h3>
              <p className="mt-2 text-xs text-ink/65 leading-relaxed">
                Un email de confirmation et de bienvenue a été envoyé à{" "}
                <strong className="text-ink">{successData.user.email}</strong>.
              </p>
            </div>

            {successData.favoriteAdded && options.pendingFavoriteTitle && (
              <div className="rounded-2xl border border-[#a54b4b]/20 bg-[#a54b4b]/5 p-3.5 text-xs font-semibold text-[#a54b4b] flex items-center justify-center gap-2">
                <Heart size={16} fill="currentColor" />
                <span>« {options.pendingFavoriteTitle} » a été ajouté à vos favoris !</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleClose}
                className="w-full rounded-2xl bg-ink py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss"
              >
                Continuer ma navigation
              </button>
              {options.reason === "favorite" && (
                <Link
                  href="/mes-favoris"
                  onClick={handleClose}
                  className="w-full rounded-2xl border border-black/10 bg-cream py-3 text-xs font-bold text-ink transition hover:bg-white flex items-center justify-center gap-1.5"
                >
                  Voir tous mes favoris <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center">
              <span className="mx-auto inline-flex size-12 items-center justify-center rounded-2xl bg-[#f6ecd9] text-[#8f6424] shadow-xs">
                {options.reason === "favorite" ? <Heart size={22} className="text-[#a54b4b]" fill="#a54b4b" /> : <Lock size={22} />}
              </span>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
                {options.reason === "favorite" ? "Enregistrez vos favoris" : "Mon compte Liberty K"}
              </h2>

              <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
                {options.customMessage ||
                  (options.reason === "favorite"
                    ? "Vous n'êtes pas connecté(e). Connectez-vous ou créez votre compte pour enregistrer vos adresses préférées et les retrouver sur tous vos appareils."
                    : "Connectez-vous simplement et en toute sécurité avec votre adresse email et mot de passe.")}
              </p>
            </div>

            {/* Onglets Connexion / Inscription */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-cream p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setError("");
                }}
                className={`rounded-xl py-2.5 transition ${
                  tab === "login" ? "bg-white text-ink shadow-xs" : "text-ink/50 hover:text-ink"
                }`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setError("");
                }}
                className={`rounded-xl py-2.5 transition ${
                  tab === "register" ? "bg-white text-ink shadow-xs" : "text-ink/50 hover:text-ink"
                }`}
              >
                Créer un compte
              </button>
            </div>

            {/* FORMULAIRE DE CONNEXION */}
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Adresse Email</label>
                  <div className="mt-1 flex items-center rounded-xl border border-black/10 bg-cream/50 px-3.5 py-2.5 focus-within:border-ink focus-within:bg-white">
                    <Mail size={15} className="text-ink/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre-email@gmail.com"
                      className="ml-2.5 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Mot de passe</label>
                  <div className="mt-1 flex items-center rounded-xl border border-black/10 bg-cream/50 px-3.5 py-2.5 focus-within:border-ink focus-within:bg-white">
                    <Lock size={15} className="text-ink/40" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="ml-2.5 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                    />
                  </div>
                </div>

                {error && <p className="text-center text-xs font-semibold text-rose-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss disabled:opacity-60"
                >
                  <Lock size={14} />
                  {loading ? "Connexion en cours…" : "Se connecter"}
                </button>

                <p className="text-center text-[11px] text-ink/50 pt-1">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("register");
                      setError("");
                    }}
                    className="font-bold text-moss underline"
                  >
                    Créer mon compte
                  </button>
                </p>
              </form>
            ) : (
              /* FORMULAIRE D'INSCRIPTION */
              <form onSubmit={handleRegister} className="mt-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Prénom</label>
                    <div className="mt-1 flex items-center rounded-xl border border-black/10 bg-cream/50 px-3 py-2.5 focus-within:border-ink focus-within:bg-white">
                      <User size={14} className="text-ink/40" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Prénom"
                        className="ml-2 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Nom</label>
                    <div className="mt-1 flex items-center rounded-xl border border-black/10 bg-cream/50 px-3 py-2.5 focus-within:border-ink focus-within:bg-white">
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Nom"
                        className="w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Adresse Email</label>
                  <div className="mt-1 flex items-center rounded-xl border border-black/10 bg-cream/50 px-3.5 py-2.5 focus-within:border-ink focus-within:bg-white">
                    <Mail size={15} className="text-ink/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre-email@gmail.com"
                      className="ml-2.5 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-ink/50">Mot de passe (min. 6 caractères)</label>
                  <div className="mt-1 flex items-center rounded-xl border border-black/10 bg-cream/50 px-3.5 py-2.5 focus-within:border-ink focus-within:bg-white">
                    <Lock size={15} className="text-ink/40" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="ml-2.5 w-full bg-transparent text-xs font-medium text-ink outline-none placeholder:text-ink/35"
                    />
                  </div>
                </div>

                {error && <p className="text-center text-xs font-semibold text-rose-600">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-moss disabled:opacity-60"
                >
                  <ShieldCheck size={16} />
                  {loading ? "Création du compte…" : "Créer mon compte"}
                </button>

                <p className="text-center text-[11px] text-ink/50 pt-1">
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setTab("login");
                      setError("");
                    }}
                    className="font-bold text-moss underline"
                  >
                    Me connecter
                  </button>
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
