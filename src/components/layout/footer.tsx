"use client";

import Link from "next/link";
import { Cookie, Instagram, Linkedin, Mail, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { openCookiePreferences } from "@/components/ui/cookie-banner";

export function Footer() {
  return (
    <footer className="mt-28 border-t border-black/5 bg-[#0f1714] text-white">
      <div className="page-shell grid gap-12 py-16 sm:py-20 md:grid-cols-[2fr_1fr]">
        {/* Colonne 1 : Marque & Mission Slogan */}
        <div className="space-y-5 max-w-xl">
          <Logo light />
          <div className="space-y-2.5 text-xs sm:text-[13px] leading-relaxed text-white/70 font-medium">
            <p>
              <strong className="text-white font-bold">Liberty K</strong>, le guide incontournable des meilleures adresses, expériences et services de la communauté juive en France.
            </p>
            <p className="text-white/60">
              Découvrez une sélection de lieux, de professionnels et de services choisis pour leur qualité et leur savoir-faire.
            </p>
            <p className="text-white/60">
              Trouvez facilement ce qui correspond à vos envies, vos besoins et aux moments qui comptent vraiment pour vous.
            </p>
            <p className="text-[#d5bb7d] font-semibold pt-1">
              Une communauté, mille possibilités, réunies au même endroit pour vous simplifier la vie.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-9 place-items-center rounded-2xl bg-white/10 text-white/80 transition hover:bg-white hover:text-ink shadow-2xs"
              aria-label="Instagram Libertyk"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-9 place-items-center rounded-2xl bg-white/10 text-white/80 transition hover:bg-white hover:text-ink shadow-2xs"
              aria-label="LinkedIn Libertyk"
            >
              <Linkedin size={16} />
            </a>
            <a
              href="mailto:contact@libertyk.com"
              className="grid size-9 place-items-center rounded-2xl bg-white/10 text-white/80 transition hover:bg-white hover:text-ink shadow-2xs"
              aria-label="Contacter le support Libertyk"
            >
              <Mail size={16} />
            </a>
          </div>
        </div>

        {/* Colonne 2 : Légal, Transparence & Cookies */}
        <div className="space-y-4 md:pl-8">
          <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#d5bb7d]">
            Légal & Transparence
          </p>
          <ul className="space-y-3 text-xs font-medium text-white/65">
            <li>
              <Link href="/mentions-legales" className="transition hover:text-white">
                Mentions Légales (LCEN)
              </Link>
            </li>
            <li>
              <Link href="/cgu" className="transition hover:text-white">
                Conditions Générales d&apos;Utilisation (CGU)
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="transition hover:text-white">
                Conditions Générales de Vente (CGV)
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="transition hover:text-white">
                Politique de Confidentialité (RGPD)
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={openCookiePreferences}
                className="flex items-center gap-1.5 text-left text-xs font-medium text-[#d5bb7d] transition hover:text-white underline underline-offset-4"
              >
                <Cookie size={13} /> Gestion des cookies
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Barre inférieure */}
      <div className="border-t border-white/10 bg-black/30 py-6">
        <div className="page-shell flex flex-col gap-4 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>© 2026 Libertyk SAS. Tous droits réservés. Plateforme certifiée conforme RGPD.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/50">
            <Link href="/mentions-legales" className="hover:text-white transition">Mentions Légales</Link>
            <span>•</span>
            <Link href="/cgu" className="hover:text-white transition">CGU</Link>
            <span>•</span>
            <Link href="/cgv" className="hover:text-white transition">CGV</Link>
            <span>•</span>
            <Link href="/confidentialite" className="hover:text-white transition">Confidentialité</Link>
            <span>•</span>
            <button type="button" onClick={openCookiePreferences} className="hover:text-white transition">Cookies</button>
          </div>
          <span className="text-[11px] text-white/30">Fait avec passion à Paris.</span>
        </div>
      </div>
    </footer>
  );
}
