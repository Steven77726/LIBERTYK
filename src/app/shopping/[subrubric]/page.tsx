import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localSubrubrics } from "@/data/subrubrics";
import { SubrubricPageView } from "@/components/ui/subrubric-page-view";
import { buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ subrubric: string }> };

function findSubrubric(slug: string) {
  return localSubrubrics.find((item) => item.rubricId === "shopping" && item.slug === slug);
}

export function generateStaticParams() {
  return localSubrubrics
    .filter((item) => item.rubricId === "shopping")
    .map((item) => ({ subrubric: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = findSubrubric((await params).subrubric);
  return item
    ? buildPageMetadata({
        title: `${item.name} — Shopping`,
        description: item.description,
        path: `/shopping/${item.slug}`,
        image: item.image,
        imageAlt: item.imageAlt,
      })
    : {};
}

export default async function ShoppingSubrubricPage({ params }: Props) {
  const item = findSubrubric((await params).subrubric);
  if (!item) notFound();

  return (
    <SubrubricPageView
      rubricSlug="shopping"
      subrubricSlug={item.slug}
      fallbackTitle={item.name}
      fallbackDescription={item.description}
      fallbackImage={item.image}
    />
  );
}
