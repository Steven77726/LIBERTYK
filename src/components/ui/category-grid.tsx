"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Store } from "lucide-react";
import { categories } from "@/data/categories";
import { assetPath } from "@/lib/assets";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminRubricPreview = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  image: string;
  imageAlt?: string;
  showOnHome?: boolean;
  order: number;
  status: "Publié" | "Brouillon" | "Masqué";
};

type AdminStatePreview = {
  rubrics?: AdminRubricPreview[];
};

const ADMIN_STORAGE_KEY = "liberty-admin-dashboard-v1";
const ADMIN_STATE_KEY = "admin_state";

export function CategoryGrid() {
  const [adminRubrics, setAdminRubrics] = useState<AdminRubricPreview[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadRubrics() {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data } = await supabase.from("app_settings").select("value").eq("key", ADMIN_STATE_KEY).maybeSingle();
        const remoteRubrics = (data?.value as AdminStatePreview | undefined)?.rubrics;
        if (mounted && remoteRubrics?.length) {
          setAdminRubrics(remoteRubrics);
          return;
        }
      }
      try {
        const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as AdminStatePreview;
        if (mounted) setAdminRubrics(parsed.rubrics ?? null);
      } catch {
        if (mounted) setAdminRubrics(null);
      }
    }
    void loadRubrics();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const refresh = () => {
      try {
        const raw = window.localStorage.getItem(ADMIN_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as AdminStatePreview;
        setAdminRubrics(parsed.rubrics ?? null);
      } catch {
        setAdminRubrics(null);
      }
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, []);

  const cards = useMemo(() => {
    if (!adminRubrics?.length) {
      return categories.map((category) => ({
        slug: category.slug,
        label: category.label,
        description: category.description,
        image: category.image,
        imageAlt: category.label,
        icon: category.icon,
        softColor: category.softColor,
      }));
    }
    return adminRubrics
      .filter((rubric) => rubric.status === "Publié" && rubric.showOnHome !== false)
      .sort((a, b) => a.order - b.order)
      .map((rubric) => {
        const fallback = categories.find((category) => category.slug === (rubric.slug ?? rubric.id));
        return {
          slug: rubric.slug ?? rubric.id,
          label: rubric.name,
          description: rubric.description,
          image: rubric.image || fallback?.image || "/images/food/restaurants-khan.jpg",
          imageAlt: rubric.imageAlt ?? rubric.name,
          icon: fallback?.icon ?? Store,
          softColor: fallback?.softColor ?? "#e2eae4",
        };
      });
  }, [adminRubrics]);

  return (
    <section className="page-shell py-8 sm:py-10">
      <div className="mb-5 max-w-3xl"><p className="eyebrow">Tous vos univers</p><h2 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Tout ce qui compte. <span className="text-ink/28">Au même endroit.</span></h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ slug, label, description, image, imageAlt, icon: Icon, softColor }) => (
          <Link key={slug} href={`/${slug}`} className="liberty-premium-card group relative min-h-[205px] overflow-hidden rounded-[1.35rem] bg-ink text-white shadow-[0_14px_38px_rgba(27,35,30,.10)] ring-1 ring-white/10 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(27,35,30,.22)]">
            <img src={assetPath(image)} alt={imageAlt ?? ""} className="liberty-image-grade absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.055]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,.20),transparent_28%),linear-gradient(to_top,rgba(0,0,0,.91),rgba(0,0,0,.38)_48%,rgba(0,0,0,.05))]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-70" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="grid size-8 place-items-center rounded-xl border border-white/20 bg-white/15 shadow-[0_10px_28px_rgba(0,0,0,.18)] backdrop-blur-xl transition duration-300 group-hover:scale-105" style={{ color: softColor }}><Icon size={15} strokeWidth={2.2} /></span>
                <span className="grid size-8 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 shadow-[0_12px_28px_rgba(0,0,0,.22)] transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={14} /></span>
              </div>
              <h3 className="text-xl font-semibold tracking-[-.045em] drop-shadow-[0_8px_24px_rgba(0,0,0,.28)]">{label}</h3>
              <p className="mt-1 max-w-md text-[11px] leading-4 text-white/68 transition duration-300 group-hover:text-white/78">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
