import type { Metadata } from "next";
import { Suspense } from "react";
import { Compass, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { categories, categoryBySlug } from "@/data/categories";
import { categoryCards } from "@/data/mock";
import { GenericSubrubricGrid } from "@/components/ui/subrubric-grids";
import { SubrubricEstablishmentResults } from "@/components/ui/subrubric-establishment-results";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";
import { CategorySearchRedirect } from "@/components/search/category-search-redirect";

type Props = { params: Promise<{ category: string }> };

const dedicatedCategoryPages = new Set(["food", "shopping", "vin-spiritueux", "mikve"]);

export function generateStaticParams() {
  return categories
    .filter(({ slug }) => !dedicatedCategoryPages.has(slug))
    .map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = categoryBySlug[slug];
  return category
    ? buildPageMetadata({
        title: `${category.label} — Liberty`,
        description: category.description,
        path: `/${category.slug}`,
        image: category.image,
        imageAlt: category.label,
      })
    : {};
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = categoryBySlug[slug];
  if (!category) notFound();
  const Icon = category.icon;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Accueil", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: category.label, item: absoluteUrl(`/${category.slug}`) },
          ],
        }}
      />
      <section className="page-shell pt-8 sm:pt-12">
        <div className="relative overflow-hidden rounded-4xl px-6 py-16 sm:px-12 lg:px-16 lg:py-24" style={{ background: category.softColor }}>
          <div className="absolute -right-20 -top-32 size-96 rounded-full opacity-15 blur-3xl" style={{ background: category.color }} />
          <div className="relative max-w-3xl"><span className="mb-7 grid size-14 place-items-center rounded-2xl bg-white/70 shadow-sm" style={{ color: category.color }}><Icon size={25} /></span><p className="mb-4 text-xs font-semibold uppercase tracking-[.22em]" style={{ color: category.color }}>{category.eyebrow}</p><h1 className="text-5xl font-semibold tracking-[-.055em] sm:text-7xl">{category.label}</h1><p className="mt-6 max-w-2xl text-base leading-7 text-ink/60 sm:text-lg">{category.description}</p><CategorySearchRedirect label={category.label} /></div>
        </div>
      </section>

      <section className="page-shell py-20">
        <p className="eyebrow">Explorer</p><h2 className="section-title">Que recherchez-vous ?</h2>
        <GenericSubrubricGrid rubricSlug={category.slug} />
        <Suspense fallback={null}>
          <SubrubricEstablishmentResults rubricSlug={category.slug} />
        </Suspense>
      </section>

      <section className="page-shell py-8">
        <div className="mb-8 flex items-end justify-between"><div><p className="eyebrow">Pour vous</p><h2 className="section-title">Nos recommandations</h2></div></div>
        <div className="grid gap-5 md:grid-cols-3">{categoryCards.map((card, index) => <article key={card.title} className="relative flex min-h-80 flex-col justify-end overflow-hidden rounded-4xl p-7 text-white" style={{ background: card.tone }}><span className="absolute right-6 top-6 grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur">{index === 0 ? <Compass size={18} /> : <MapPin size={18} />}</span><p className="text-xs font-semibold uppercase tracking-[.18em] text-white/55">{category.label}</p><h3 className="mt-2 text-2xl font-semibold tracking-tight">{card.title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-white/65">{card.subtitle}</p></article>)}</div>
      </section>
    </>
  );
}
