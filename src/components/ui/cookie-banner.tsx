"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export const COOKIE_CONSENT_KEY = "liberty-cookie-consent-v1";
export const OPEN_COOKIE_PREFERENCES_EVENT = "liberty-open-cookie-preferences";

export function openCookiePreferences() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
  }
}

type CookieSettings = {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
};

const defaultSettings: CookieSettings = {
  essential: true,
  preferences: true,
  analytics: false,
};

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>(defaultSettings);

  useEffect(() => {
    // Vérifier si un consentement a déjà été enregistré
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!saved) {
      // Petite temporisation pour un affichage fluide
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        setSettings(JSON.parse(saved));
      } catch {
        // Fallback
      }
    }

    // Écouter l'événement pour ré-ouvrir depuis le footer
    const handleOpenModal = () => {
      setIsModalOpen(true);
    };

    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenModal);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, handleOpenModal);
  }, []);

  const handleAcceptAll = () => {
    const full: CookieSettings = {
      essential: true,
      preferences: true,
      analytics: true,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(full));
    setSettings(full);
    setIsOpen(false);
    setIsModalOpen(false);
  };

  const handleRejectAll = () => {
    const min: CookieSettings = {
      essential: true,
      preferences: false,
      analytics: false,
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(min));
    setSettings(min);
    setIsOpen(false);
    setIsModalOpen(false);
  };

  const handleSaveCustom = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(settings));
    setIsOpen(false);
    setIsModalOpen(false);
  };

  return (
    <>
      {/* BANNIÈRE EN BAS D'ÉCRAN (PREMIÈRE VISITE) */}
      {isOpen && !isModalOpen && (
        <div className="fixed bottom-4 inset-x-4 z-[90] sm:bottom-6 sm:right-6 sm:left-auto sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-[2rem] border border-black/10 bg-white/95 p-6 shadow-2xl backdrop-blur-md text-ink">
            <div className="flex items-start gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f6ecd9] text-[#8f6424] shadow-2xs">
                <Cookie size={22} />
              </span>
              <div className="space-y-1">
                <h3 className="text-sm font-bold tracking-tight text-ink">
                  Respect de votre vie privée
                </h3>
                <p className="text-xs leading-relaxed text-ink/65">
                  Libertyk utilise des cookies pour assurer le bon fonctionnement de la plateforme, sécuriser votre compte et mémoriser vos favoris conformément au RGPD.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="rounded-xl bg-ink py-2.5 px-3 text-xs font-bold text-white shadow-xs transition hover:bg-moss"
                >
                  Tout accepter
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="rounded-xl border border-black/10 bg-cream py-2.5 px-3 text-xs font-bold text-ink transition hover:bg-white"
                >
                  Continuer sans accepter
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-ink/50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="font-semibold text-moss underline hover:text-ink transition"
                >
                  Personnaliser les choix
                </button>
                <Link href="/confidentialite" className="hover:underline">
                  Politique de confidentialité
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE PARAMÉTRAGE AVANCÉ DES COOKIES (CNIL / RGPD) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-black/10 bg-white p-6 sm:p-8 shadow-2xl text-ink max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-cream text-ink/50 transition hover:bg-black/10 hover:text-ink"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            {/* En-tête */}
            <div className="text-center sm:text-left pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-moss text-[11px] font-bold">
                <ShieldCheck size={14} /> Centre de Préférences Cookies
              </div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
                Gestion des traceurs & cookies
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">
                Vous pouvez activer ou désactiver les différentes finalités de traitement ci-dessous. Vos préférences sont conservées pour une durée de 13 mois.
              </p>
            </div>

            {/* Liste des finalités */}
            <div className="my-6 space-y-3 overflow-y-auto pr-1">
              {/* 1. Essentiels */}
              <div className="rounded-2xl border border-black/5 bg-cream/40 p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-ink">Cookies strictement nécessaires</h4>
                    <span className="rounded-md bg-moss/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-moss">
                      Toujours actif
                    </span>
                  </div>
                  <p className="text-[11px] text-ink/60 leading-relaxed">
                    Indispensables au fonctionnement du site, à l&apos;authentification de votre compte sécurisé, à la sécurité et à la mémorisation de votre session.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked
                  className="size-4 shrink-0 rounded text-moss opacity-60 cursor-not-allowed mt-1"
                />
              </div>

              {/* 2. Préférences & Favoris */}
              <div className="rounded-2xl border border-black/5 bg-cream/40 p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-ink">Préférences & Favoris</h4>
                  <p className="text-[11px] text-ink/60 leading-relaxed">
                    Permet de sauvegarder vos filtres de recherche, votre ville favorite pour les horaires de Chabbat et la liste de vos restaurants préférés.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.preferences}
                  onChange={(e) => setSettings({ ...settings, preferences: e.target.checked })}
                  className="size-4 shrink-0 rounded text-moss focus:ring-moss cursor-pointer mt-1"
                />
              </div>

              {/* 3. Mesure d'audience */}
              <div className="rounded-2xl border border-black/5 bg-cream/40 p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-ink">Mesure d&apos;audience anonymisée</h4>
                  <p className="text-[11px] text-ink/60 leading-relaxed">
                    Nous aide à mesurer l&apos;affluence, détecter les ralentissements et améliorer l&apos;ergonomie générale sans traçage nominatif.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.analytics}
                  onChange={(e) => setSettings({ ...settings, analytics: e.target.checked })}
                  className="size-4 shrink-0 rounded text-moss focus:ring-moss cursor-pointer mt-1"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-black/5 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 rounded-2xl bg-ink py-3 text-xs font-bold text-white shadow-md transition hover:bg-moss text-center"
              >
                Enregistrer mes choix
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-2xl border border-black/10 bg-cream py-3 px-4 text-xs font-bold text-ink transition hover:bg-white text-center"
              >
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
