import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, categoryBySlug } from "@/data/categories";
import { GenericSubrubricGrid } from "@/components/ui/subrubric-grids";
import { BeautyModule } from "@/components/beauty/beauty-module";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ category: string }> };

const dedicatedCategoryPages = new Set(["food", "shopping", "vin-spiritueux", "mikve", "calendrier-juif"]);

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
        title: `${category.label} — Liberty K`,
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
        <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream shadow-sm" style={{ color: category.color }}><Icon size={22} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">{category.eyebrow}</p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">{category.label}</h1>
              <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-ink/50">{category.description}</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">Rubrique</span>
        </div>
      </section>

      <section className="page-shell py-10 sm:py-14">
        <p className="eyebrow">Explorer</p><h2 className="section-title">Que recherchez-vous ?</h2>
        <GenericSubrubricGrid rubricSlug={category.slug} />
      </section>

      {category.slug === "soins-feminin" && <BeautyModule />}
    </>
  );
}
