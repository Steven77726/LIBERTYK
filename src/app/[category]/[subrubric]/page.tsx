import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, categoryBySlug } from "@/data/categories";
import { localSubrubrics } from "@/data/subrubrics";
import { SubrubricPageView } from "@/components/ui/subrubric-page-view";
import { buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ category: string; subrubric: string }> };

const dedicatedCategoryRoutes = new Set(["food", "shopping", "vin-spiritueux", "mikve"]);

function findSubrubric(categorySlug: string, subrubricSlug: string) {
  return localSubrubrics.find((item) => item.rubricId === categorySlug && item.slug === subrubricSlug);
}

export function generateStaticParams() {
  return localSubrubrics
    .filter((item) => !dedicatedCategoryRoutes.has(item.rubricId))
    .map((item) => ({ category: item.rubricId, subrubric: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug, subrubric: subrubricSlug } = await params;
  const category = categoryBySlug[categorySlug];
  const item = findSubrubric(categorySlug, subrubricSlug);
  return category && item
    ? buildPageMetadata({
        title: `${item.name} — ${category.label}`,
        description: item.description,
        path: `/${category.slug}/${item.slug}`,
        image: item.image,
        imageAlt: item.imageAlt,
      })
    : {};
}

export default async function GenericSubrubricPage({ params }: Props) {
  const { category: categorySlug, subrubric: subrubricSlug } = await params;
  const category = categories.find((item) => item.slug === categorySlug);
  const item = findSubrubric(categorySlug, subrubricSlug);
  if (!category || !item) notFound();

  return (
    <SubrubricPageView
      rubricSlug={category.slug}
      subrubricSlug={item.slug}
      fallbackTitle={item.name}
      fallbackDescription={item.description}
      fallbackImage={item.image}
    />
  );
}
