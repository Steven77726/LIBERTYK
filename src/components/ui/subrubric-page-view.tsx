"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { categoryBySlug } from "@/data/categories";
import { localEstablishments } from "@/data/establishments";
import { listPublishedEstablishments, type EstablishmentRecord } from "@/lib/supabase/establishments-repository";
import { listPublishedSubrubrics, type SubrubricRecord } from "@/lib/supabase/subrubrics-repository";
import { listPublishedRubrics } from "@/lib/supabase/rubrics-repository";
import { UniversalEstablishmentCard } from "@/components/ui/universal-establishment-card";
import { sortFichesByDistance } from "@/lib/geo/distance";

type Props = {
  rubricSlug: string;
  subrubricSlug: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  fallbackImage?: string;
};

function readableTitle(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SubrubricPageView({
  rubricSlug,
  subrubricSlug,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
}: Props) {
  const rubric = categoryBySlug[rubricSlug];
  const [subrubric, setSubrubric] = useState<SubrubricRecord | null>(null);
  const [items, setItems] = useState<EstablishmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isParentDormant, setIsParentDormant] = useState(false);
  const [parentRubricName, setParentRubricName] = useState("");

  const title = subrubric?.name || fallbackTitle || readableTitle(subrubricSlug);
  const description = subrubric?.description || fallbackDescription || `Les fiches publiées dans ${title}.`;
  const backLabel = rubric?.label || readableTitle(rubricSlug);
  const Icon = rubric?.icon ?? Sparkles;
  const backHref = rubric ? `/${rubricSlug}` : `/rubrique?slug=${encodeURIComponent(rubricSlug)}`;

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [remoteRubrics, remoteSubrubrics, establishments] = await Promise.all([
          listPublishedRubrics().catch(() => []),
          listPublishedSubrubrics(rubricSlug).catch(() => []),
          listPublishedEstablishments({ rubricSlug, subrubricSlug }).catch(() => null),
        ]);
        if (!mounted) return;

        const foundParent = (remoteRubrics ?? []).find((r) => r.slug === rubricSlug || r.id === rubricSlug);
        if (foundParent?.isDormant) {
          setIsParentDormant(true);
          setParentRubricName(foundParent.name || rubric?.label || readableTitle(rubricSlug));
          setItems([]);
          setLoading(false);
          return;
        }

        let foundSubrubric = (remoteSubrubrics ?? []).find((item) => item.slug === subrubricSlug) ?? null;

        // Si non trouvée dans Supabase, chercher dans le cache local admin
        if (!foundSubrubric && typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
            if (raw) {
              const parsed = JSON.parse(raw);
              type LocalSub = { id: string; rubricId: string; slug?: string; name: string; description?: string; photo?: string; image?: string; imageAlt?: string; order?: number };
              const subs = (parsed?.subrubrics as LocalSub[]) ?? [];
              const matched = subs.find(
                (s) => (s.rubricId === rubricSlug || s.rubricId === `rubric-${rubricSlug}`) && (s.slug === subrubricSlug || (subrubricSlug.startsWith("deco") && (s.slug || "").includes("deco")))
              );
              if (matched) {
                foundSubrubric = {
                  id: matched.id,
                  rubricId: rubricSlug,
                  slug: matched.slug,
                  name: matched.name,
                  description: matched.description || "",
                  photo: matched.photo || matched.image || fallbackImage || "",
                  imageAlt: matched.imageAlt || matched.name,
                  showPublicly: true,
                  order: matched.order || 1,
                  status: "Publié",
                };
              }
            }
          } catch {
            // ignore
          }
        }

        setSubrubric(foundSubrubric);

        // 1. Initial matching fallback items
        const target = subrubricSlug.toLowerCase();
        const matchesSubrubric = (est: EstablishmentRecord) => {
          if (est.rubricId !== rubricSlug && est.rubricId !== `${rubricSlug}`) return false;
          if (est.status === "Masqué") return false;
          const subId = (est.subrubricId || "").toLowerCase();
          return (
            subId === target ||
            subId === `${rubricSlug}-${target}` ||
            (target.startsWith("deco") && subId.includes("deco")) ||
            (target.startsWith("decor") && subId.includes("decor")) ||
            (target === "mode" && (subId.includes("mode") || subId.includes("vetement"))) ||
            (target === "vetements" && (subId.includes("mode") || subId.includes("vetement")))
          );
        };

        const itemMap = new Map<string, EstablishmentRecord>();
        (localEstablishments as EstablishmentRecord[]).filter(matchesSubrubric).forEach((item) => {
          itemMap.set(item.id, item);
        });

        // 2. Merge local admin cache
        if (typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem("liberty-admin-dashboard-v1");
            if (raw) {
              const parsed = JSON.parse(raw);
              const rawEsts = (parsed?.establishments as EstablishmentRecord[]) ?? [];
              rawEsts.filter(matchesSubrubric).forEach((est) => {
                const matchKey = Array.from(itemMap.keys()).find((k) => {
                  const existing = itemMap.get(k);
                  return (
                    k === est.id ||
                    existing?.slug === est.slug ||
                    (existing?.name && est.name && existing.name.toLowerCase() === est.name.toLowerCase())
                  );
                });
                if (matchKey) {
                  itemMap.set(matchKey, { ...itemMap.get(matchKey)!, ...est });
                } else {
                  itemMap.set(est.id, est);
                }
              });
            }
          } catch {
            // ignore
          }
        }

        // 3. Merge Supabase
        if (establishments && establishments.length > 0) {
          establishments.forEach((est) => {
            const matchKey = Array.from(itemMap.keys()).find((k) => {
              const existing = itemMap.get(k);
              return (
                k === est.id ||
                existing?.slug === est.slug ||
                (existing?.name && est.name && existing.name.toLowerCase() === est.name.toLowerCase())
              );
            });
            if (matchKey) {
              itemMap.set(matchKey, { ...itemMap.get(matchKey)!, ...est });
            } else {
              itemMap.set(est.id, est);
            }
          });
        }

        setItems(Array.from(itemMap.values()));
      } catch (loadError) {
        if (!mounted) return;
        setItems([]);
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger cette sous-rubrique.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    const refresh = () => void load();
    window.addEventListener("liberty-admin-published", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("liberty-admin-published", refresh);
    };
  }, [rubricSlug, subrubricSlug, fallbackImage, rubric?.label]);

  // Tri automatique des fiches par distance dès que la position GPS est obtenue
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setItems((current) => sortFichesByDistance(current, userLat, userLng));
      },
      (error) => {
        console.warn("Géolocalisation refusée ou indisponible", error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  const countLabel = useMemo(() => {
    if (loading) return "Chargement…";
    return `${items.length} fiche${items.length > 1 ? "s" : ""}`;
  }, [items.length, loading]);

  if (isParentDormant) {
    return (
      <section className="page-shell py-16 sm:py-24 text-center">
        <div className="mx-auto max-w-lg rounded-3xl border border-black/10 bg-white/90 p-8 shadow-sm backdrop-blur">
          <span className="inline-block rounded-full border border-amber-500/30 bg-amber-50 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-800 uppercase">
            Bientôt disponible
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{parentRubricName || backLabel}</h1>
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

  return (
    <>
      <section className="page-shell pt-8 sm:pt-12">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-ink/50 transition hover:text-ink">
          <ArrowLeft size={14} /> Retour à {backLabel}
        </Link>
        <div className="relative flex flex-col gap-4 overflow-hidden rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream shadow-sm" style={{ color: rubric?.color ?? "#9b6b2d" }}>
              <Icon size={25} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">{backLabel} · Sous-rubrique</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">{title}</h1>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ink/50">{description}</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">{countLabel}</span>
        </div>
      </section>

      <section className="page-shell py-10 sm:py-14">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{title}</p>
            <h2 className="section-title">Les adresses</h2>
          </div>
          <p className="text-xs font-medium text-ink/40">{countLabel}</p>
        </div>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-[2rem] bg-white px-6 py-14 text-center shadow-soft">
            <Sparkles size={24} className="mx-auto text-ink/20" />
            <p className="mt-4 text-sm font-semibold">Aucune fiche publiée pour le moment.</p>
            <p className="mt-1 text-xs text-ink/40">Les futures adresses apparaîtront ici automatiquement.</p>
          </div>
        )}

        {items.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, index) => (
              <UniversalEstablishmentCard
                key={item.id}
                establishment={item}
                priorityImage={index < 3}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
