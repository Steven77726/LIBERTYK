"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles, Store } from "lucide-react";
import { GenericSubrubricGrid } from "@/components/ui/subrubric-grids";
import { SubrubricPageView } from "@/components/ui/subrubric-page-view";
import { assetPath } from "@/lib/assets";
import { categoryBySlug } from "@/data/categories";
import { listPublishedRubrics, type RubricRecord } from "@/lib/supabase/rubrics-repository";
import { listPublishedSubrubrics, type SubrubricRecord } from "@/lib/supabase/subrubrics-repository";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";

function readableTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function RuntimeRubricPage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") ?? "";
  const subrubricSlug = searchParams.get("subrubric") ?? "";
  const [rubric, setRubric] = useState<RubricRecord | null>(null);
  const [subrubrics, setSubrubrics] = useState<SubrubricRecord[]>([]);
  const [establishments, setEstablishments] = useState<EstablishmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadRubric() {
      setLoading(true);
      setError("");
      try {
        const rubrics = await listPublishedRubrics();
        const foundRubric = (rubrics ?? []).find((item) => item.slug === slug || item.id === slug) ?? null;
        if (!mounted) return;
        setRubric(foundRubric);

        if (!foundRubric) {
          setSubrubrics([]);
          setEstablishments([]);
          setError(slug ? "Cette rubrique n’est pas publiée ou n’existe plus." : "Rubrique introuvable.");
          return;
        }

        if (foundRubric.isDormant) {
          setSubrubrics([]);
          setEstablishments([]);
          return;
        }

        const [remoteSubrubrics, remoteEstablishments] = await Promise.all([
          listPublishedSubrubrics(foundRubric.slug ?? foundRubric.id).catch(() => []),
          listPublishedEstablishments({ rubricSlug: foundRubric.slug ?? foundRubric.id }).catch(() => []),
        ]);
        if (!mounted) return;
        setSubrubrics(remoteSubrubrics ?? []);
        setEstablishments(remoteEstablishments ?? []);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger la rubrique.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadRubric();

    const refresh = () => void loadRubric();
    window.addEventListener("liberty-admin-published", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("liberty-admin-published", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [slug]);

  const effectiveSlug = rubric?.slug ?? slug;
  const fallbackCategory = categoryBySlug[effectiveSlug];
  const Icon = fallbackCategory?.icon ?? Store;

  const subtitle = useMemo(() => {
    if (loading) return "Chargement…";
    const total = subrubrics.length + establishments.length;
    return `${total} élément${total > 1 ? "s" : ""} publié${total > 1 ? "s" : ""}`;
  }, [establishments.length, loading, subrubrics.length]);

  if (rubric?.isDormant) {
    return (
      <section className="page-shell py-16 sm:py-24 text-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm backdrop-blur">
          <span className="inline-block rounded-full border border-amber-500/30 bg-amber-50 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-800 uppercase">
            Bientôt disponible
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{rubric.name}</h1>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            Cette rubrique Liberty K sera prochainement disponible.
          </p>
          <div className="mt-6">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-moss">
              <ArrowLeft size={14} /> Retour à l’accueil
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (subrubricSlug && effectiveSlug) {
    return <SubrubricPageView rubricSlug={effectiveSlug} subrubricSlug={subrubricSlug} fallbackTitle={readableTitle(subrubricSlug)} fallbackImage={rubric?.image} />;
  }

  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-ink/50 transition hover:text-ink">
          <ArrowLeft size={14} /> Retour à l’accueil
        </Link>

        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream shadow-sm" style={{ color: fallbackCategory?.color ?? "#9b6b2d" }}>
              <Icon size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">Rubrique</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">{rubric?.name ?? readableTitle(slug)}</h1>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ink/50">{rubric?.description ?? "Les contenus publiés apparaîtront ici automatiquement."}</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">{subtitle}</span>
        </div>
      </section>

      {rubric?.image && (
        <section className="page-shell pt-6">
          <img src={assetPath(rubric.image)} alt={rubric.imageAlt ?? rubric.name} className="h-44 w-full rounded-[1.75rem] object-cover opacity-90 shadow-sm sm:h-56" />
        </section>
      )}

      <section className="page-shell py-10 sm:py-14">
        {error && (
          <div className="rounded-[2rem] bg-white px-6 py-12 text-center shadow-soft">
            <Sparkles size={24} className="mx-auto text-ink/20" />
            <p className="mt-4 text-sm font-semibold">{error}</p>
          </div>
        )}

        {!error && (
          <>
            <p className="eyebrow">Explorer</p>
            <h2 className="section-title">Que recherchez-vous ?</h2>
            <GenericSubrubricGrid rubricSlug={effectiveSlug} />
          </>
        )}
      </section>
    </>
  );
}
