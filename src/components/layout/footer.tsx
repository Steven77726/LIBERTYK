import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { categories } from "@/data/categories";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="page-shell grid gap-14 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
            Le guide d&apos;excellence et l&apos;annuaire de référence des établissements cachers en France.
          </p>
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[.18em] text-white/35">Explorer</p>
          <div className="grid grid-cols-1 gap-2 text-sm text-white/65">
            {categories.slice(0, 5).map((item) => (
              <Link key={item.slug} href={`/${item.slug}`} className="hover:text-white transition">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[.18em] text-white/35">Compte & Espace</p>
          <div className="grid gap-2 text-sm text-white/65">
            <Link href="/mes-favoris" className="hover:text-white transition">Mes Favoris</Link>
            <Link href="/mon-compte" className="hover:text-white transition">Mon Compte</Link>
            <Link href="/admin" className="hover:text-white transition">Espace Pro / Admin</Link>
            <div className="mt-3 flex gap-2">
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-white">
                <Instagram size={16} />
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-white/10 text-white">
                <Linkedin size={16} />
              </span>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-4 text-xs uppercase tracking-[.18em] text-white/35">Légal & RGPD</p>
          <div className="grid gap-2 text-sm text-white/65">
            <Link href="/mentions-legales" className="hover:text-white transition">Mentions Légales</Link>
            <Link href="/cgu" className="hover:text-white transition">CGU</Link>
            <Link href="/cgv" className="hover:text-white transition">CGV</Link>
            <Link href="/confidentialite" className="hover:text-white transition">Confidentialité & RGPD</Link>
          </div>
        </div>
      </div>
      <div className="page-shell flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 Libertyk SAS. Tous droits réservés.</span>
        <div className="flex gap-4">
          <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
          <Link href="/cgu" className="hover:text-white">CGU</Link>
          <Link href="/confidentialite" className="hover:text-white">Cookies & RGPD</Link>
        </div>
        <span>Fait avec passion à Paris.</span>
      </div>
    </footer>
  );
}
