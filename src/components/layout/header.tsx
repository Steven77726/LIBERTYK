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
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-cream/90 backdrop-blur-xl">
        <div className="page-shell flex h-20 items-center justify-between gap-6">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {categories.slice(0, 7).map((item) => (
              <Link key={item.slug} href={`/${item.slug}`} className={cn("rounded-full px-3 py-2 text-sm font-medium text-ink/65 transition hover:bg-white hover:text-ink", pathname === `/${item.slug}` && "bg-white text-ink shadow-sm")}>
                {item.shortLabel ?? item.label}
              </Link>
            ))}
            <button onClick={() => setOpen(true)} className="rounded-full px-3 py-2 text-sm font-medium text-ink/65 hover:bg-white hover:text-ink">Plus</button>
          </nav>
          <div className="flex items-center gap-2">
            <button className="hidden size-10 place-items-center rounded-full border border-black/10 bg-white text-ink transition hover:border-black/20 sm:grid" aria-label="Rechercher"><Search size={18} /></button>
            <Link href="/mon-compte" className="hidden items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-moss sm:flex"><UserRound size={16} /> Mon compte</Link>
            <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full border border-black/10 bg-white lg:hidden" aria-label="Ouvrir le menu"><Menu size={20} /></button>
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
