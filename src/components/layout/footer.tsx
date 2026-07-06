import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { categories } from "@/data/categories";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="page-shell grid gap-14 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div><Logo light /><p className="mt-5 max-w-sm text-sm leading-6 text-white/55">Le meilleur de l'univers juif et casher, réuni dans une expérience simple, inspirante et exigeante.</p></div>
        <div><p className="mb-4 text-xs uppercase tracking-[.18em] text-white/35">Explorer</p><div className="grid grid-cols-2 gap-2 text-sm text-white/65">{categories.slice(0, 8).map((item) => <Link key={item.slug} href={`/${item.slug}`} className="hover:text-white">{item.label}</Link>)}</div></div>
        <div><p className="mb-4 text-xs uppercase tracking-[.18em] text-white/35">Liberty</p><div className="grid gap-2 text-sm text-white/65"><Link href="/professionnels">Pour les professionnels</Link><Link href="/mon-compte">Mon compte</Link><Link href="/admin">Administration</Link><div className="mt-4 flex gap-2"><span className="grid size-9 place-items-center rounded-full bg-white/10"><Instagram size={16} /></span><span className="grid size-9 place-items-center rounded-full bg-white/10"><Linkedin size={16} /></span></div></div></div>
      </div>
      <div className="page-shell flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/35 sm:flex-row sm:justify-between"><span>© 2026 Liberty. Tous droits réservés.</span><span>Fait avec attention à Paris.</span></div>
    </footer>
  );
}
