"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { categories } from "@/data/categories";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={cn("sticky top-0 z-50 transition-all duration-500", scrolled ? "py-2" : "py-0")}>
        <div className={cn("mx-auto max-w-[1440px] px-4 transition-all duration-500 sm:px-6 lg:px-8", scrolled ? "pt-1" : "pt-0")}>
          <div className={cn(
            "flex items-center justify-between gap-6 border border-black/[.045] bg-cream/82 px-4 backdrop-blur-2xl transition-all duration-500 sm:px-5",
            scrolled
              ? "h-16 rounded-[1.35rem] shadow-[0_18px_55px_rgba(27,35,30,.12)]"
              : "h-20 rounded-none border-x-0 border-t-0 shadow-none",
          )}>
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {categories.slice(0, 7).map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className={cn(
                  "relative rounded-full px-3 py-2 text-[13px] font-semibold text-ink/56 transition duration-300 hover:bg-white/70 hover:text-ink",
                  pathname === `/${item.slug}` && "bg-white text-ink shadow-[0_10px_28px_rgba(27,35,30,.08)]",
                )}
              >
                {item.shortLabel ?? item.label}
                {pathname === `/${item.slug}` && <span className="absolute inset-x-4 -bottom-px h-px rounded-full bg-gradient-to-r from-transparent via-[#c99b42] to-transparent" />}
              </Link>
            ))}
            <button onClick={() => setOpen(true)} className="rounded-full px-3 py-2 text-[13px] font-semibold text-ink/56 transition duration-300 hover:bg-white/70 hover:text-ink">Plus</button>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/#recherche" className="hidden size-10 place-items-center rounded-full border border-black/[.08] bg-white/75 text-ink shadow-[0_10px_24px_rgba(27,35,30,.06)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c99b42]/35 hover:bg-white sm:grid" aria-label="Rechercher"><Search size={17} /></Link>
            <Link href="/mon-compte" className="hidden items-center gap-2 rounded-full bg-[linear-gradient(135deg,#101a15,#2a4638)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_34px_rgba(16,26,21,.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(16,26,21,.25)] sm:flex"><UserRound size={15} /> Mon compte</Link>
            <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full border border-black/[.08] bg-white/80 shadow-[0_10px_24px_rgba(27,35,30,.06)] lg:hidden" aria-label="Ouvrir le menu"><Menu size={19} /></button>
          </div>
          </div>
        </div>
      </header>
      <div className={cn("fixed inset-0 z-[60] transition", open ? "visible" : "invisible")}>
        <button onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} aria-label="Fermer le menu" />
        <aside className={cn("absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-cream p-6 transition-transform duration-300 sm:p-10", open ? "translate-x-0" : "translate-x-full")}>
          <div className="mb-10 flex items-center justify-between"><Logo /><button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full bg-white shadow-sm"><X size={20} /></button></div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-ink/40">Explorer les univers</p>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(({ slug, label, icon: Icon, softColor, color }) => (
              <Link key={slug} href={`/${slug}`} className="group flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-3.5 transition hover:-translate-y-0.5 hover:shadow-soft">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: softColor, color }}><Icon size={17} /></span>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-2 border-t border-black/10 pt-6">
            <Link href="/mon-compte" className="rounded-2xl bg-ink px-5 py-4 font-medium text-white">Mon compte</Link>
            <Link href="/admin" className="rounded-2xl bg-white px-5 py-4 font-medium text-ink">Dashboard administrateur</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
