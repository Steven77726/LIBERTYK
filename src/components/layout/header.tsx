"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Store, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { categories } from "@/data/categories";
import type { Category } from "@/types/category";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type AdminRubricRecord = {
  id: string;
  slug?: string;
  name?: string;
  status?: Category["status"];
  isDormant?: boolean;
  searchKeywords?: string[];
  order?: number;
};

function resolveActiveCategories(adminRubrics?: AdminRubricRecord[] | null): Category[] {
  const activeList: Category[] = [];

  categories.forEach((baseCategory) => {
    let currentStatus: Category["status"] = baseCategory.status ?? "Publié";
    let isDormant = baseCategory.isDormant === true || baseCategory.status === "En sommeil" || baseCategory.status === "Masqué" || baseCategory.status === "Brouillon";
    let order = baseCategory.order ?? 99;

    if (adminRubrics && adminRubrics.length > 0) {
      const adminMatch = adminRubrics.find(
        (r) => r.slug === baseCategory.slug || r.id === baseCategory.slug || r.name?.toLowerCase() === baseCategory.label?.toLowerCase()
      );
      if (adminMatch) {
        currentStatus = (adminMatch.status as Category["status"]) ?? currentStatus;
        isDormant = adminMatch.isDormant === true || adminMatch.status === "En sommeil" || adminMatch.status === "Masqué" || adminMatch.status === "Brouillon" || Boolean(adminMatch.searchKeywords?.includes("__dormant__"));
        if (adminMatch.order !== undefined) order = adminMatch.order;
      }
    }

    if (!isDormant && currentStatus === "Publié") {
      activeList.push({
        ...baseCategory,
        order,
        status: currentStatus,
        isDormant: false,
      });
    }
  });

  if (adminRubrics && adminRubrics.length > 0) {
    adminRubrics.forEach((r) => {
      const slug = r.slug || r.id;
      const alreadyIncluded = activeList.some((c) => c.slug === slug);
      const isDormant = r.isDormant === true || r.status === "En sommeil" || r.status === "Masqué" || r.status === "Brouillon" || Boolean(r.searchKeywords?.includes("__dormant__"));
      if (!alreadyIncluded && r.status === "Publié" && !isDormant) {
        activeList.push({
          slug,
          label: r.name || slug,
          shortLabel: r.name || slug,
          eyebrow: "Découvrir",
          description: "",
          icon: Store,
          color: "#1f4d3b",
          softColor: "#e2eae4",
          image: "",
          featured: [],
          format: "Carré standard",
          subrubricCount: 0,
          status: "Publié",
          order: r.order ?? 99,
        });
      }
    });
  }

  return activeList.sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeCategories, setActiveCategories] = useState<Category[]>(() => resolveActiveCategories(null));

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const syncActiveCategories = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.rubrics)) {
            setActiveCategories(resolveActiveCategories(parsed.rubrics));
            return;
          }
        }
      } catch {
        // ignore
      }
      setActiveCategories(resolveActiveCategories(null));
    };

    syncActiveCategories();
    window.addEventListener("storage", syncActiveCategories);
    window.addEventListener("liberty-admin-published", syncActiveCategories);

    return () => {
      window.removeEventListener("storage", syncActiveCategories);
      window.removeEventListener("liberty-admin-published", syncActiveCategories);
    };
  }, []);

  const desktopNavItems = useMemo(() => {
    return activeCategories
      .filter((item) => item.slug !== "calendrier-juif")
      .slice(0, 7);
  }, [activeCategories]);

  const isCalendarActive = useMemo(() => {
    return activeCategories.some((item) => item.slug === "calendrier-juif");
  }, [activeCategories]);

  return (
    <>
      <header className={cn("sticky top-0 z-50 transition-all duration-500", scrolled ? "py-2" : "py-0")}>
        <div className={cn("mx-auto max-w-[1440px] px-4 transition-all duration-500 sm:px-6 lg:px-8", scrolled ? "pt-1" : "pt-0")}>
          <div className={cn(
            "flex items-center justify-between gap-6 border border-white/10 bg-[#65040d]/90 px-4 backdrop-blur-2xl transition-all duration-500 sm:px-5",
            scrolled
              ? "h-16 rounded-[1.35rem] shadow-[0_18px_55px_rgba(0,0,0,.35)]"
              : "h-20 rounded-none border-x-0 border-t-0 shadow-none",
          )}>
          <Logo light />
          <nav className="hidden items-center gap-1 lg:flex">
            {desktopNavItems.map((item) => (
              <Link
                key={item.slug}
                href={`/${item.slug}`}
                className={cn(
                  "relative rounded-full px-3 py-2 text-[13px] font-semibold text-white/75 transition duration-300 hover:bg-white/15 hover:text-white",
                  pathname === `/${item.slug}` && "bg-white/20 text-white shadow-[0_10px_28px_rgba(0,0,0,.25)]",
                )}
              >
                {item.shortLabel ?? item.label}
                {pathname === `/${item.slug}` && <span className="absolute inset-x-4 -bottom-px h-px rounded-full bg-gradient-to-r from-transparent via-[#d5bb7d] to-transparent" />}
              </Link>
            ))}
            {isCalendarActive && (
              <Link
                href="/calendrier-juif"
                className={cn(
                  "relative rounded-full px-3 py-2 text-[13px] font-semibold text-white/75 transition duration-300 hover:bg-white/15 hover:text-white",
                  (pathname === "/calendrier-juif" || pathname === "/calendrier") && "bg-white/20 text-white shadow-[0_10px_28px_rgba(0,0,0,.25)]",
                )}
              >
                Calendrier
                {(pathname === "/calendrier-juif" || pathname === "/calendrier") && <span className="absolute inset-x-4 -bottom-px h-px rounded-full bg-gradient-to-r from-transparent via-[#d5bb7d] to-transparent" />}
              </Link>
            )}
            <button onClick={() => setOpen(true)} className="rounded-full px-3 py-2 text-[13px] font-semibold text-white/75 transition duration-300 hover:bg-white/15 hover:text-white cursor-pointer">Plus</button>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/#recherche"
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("liberty:open-search"));
                }
              }}
              className="hidden size-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white shadow-[0_10px_24px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-0.5 hover:border-[#d5bb7d]/50 hover:bg-white/20 sm:grid"
              aria-label="Rechercher (⌘K)"
              title="Rechercher (⌘K)"
            >
              <Search size={17} />
            </Link>
            <Link href="/mon-compte" className="hidden items-center gap-2 rounded-full bg-[linear-gradient(135deg,#350106,#52030a)] border border-white/15 px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,.3)] transition duration-300 hover:-translate-y-0.5 hover:border-white/30 sm:flex"><UserRound size={15} /> Mon compte</Link>
            <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/10 text-white shadow-[0_10px_24px_rgba(0,0,0,.2)] lg:hidden" aria-label="Ouvrir le menu"><Menu size={19} /></button>
          </div>
          </div>
        </div>
      </header>
      <div className={cn("fixed inset-0 z-[60] transition", open ? "visible" : "invisible")}>
        <button onClick={() => setOpen(false)} className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} aria-label="Fermer le menu" />
        <aside className={cn("absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto bg-[#52030a] text-white p-6 transition-transform duration-300 border-l border-white/10 sm:p-10", open ? "translate-x-0" : "translate-x-full")}>
          <div className="mb-10 flex items-center justify-between"><Logo light /><button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full bg-white/15 text-white border border-white/20 shadow-sm cursor-pointer hover:bg-white/25"><X size={20} /></button></div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-white/50">Explorer les univers</p>
          <div className="grid grid-cols-2 gap-2">
            {activeCategories.map(({ slug, label, icon: Icon, softColor, color }) => (
              <Link key={slug} href={`/${slug}`} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-[#420207] p-3.5 transition hover:-translate-y-0.5 hover:border-white/25">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 text-white">{Icon && <Icon size={17} />}</span>
                <span className="text-sm font-medium text-white">{label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 grid gap-2 border-t border-white/10 pt-6">
            <Link href="/mon-compte" className="rounded-2xl bg-white/15 border border-white/20 px-5 py-4 font-medium text-white hover:bg-white/25">Mon compte</Link>
            <Link href="/admin" className="rounded-2xl bg-[#420207] border border-white/15 px-5 py-4 font-medium text-white hover:border-white/30">Dashboard administrateur</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
