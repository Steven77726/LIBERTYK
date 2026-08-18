import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localSubrubrics } from "@/data/subrubrics";
import { SubrubricPageView } from "@/components/ui/subrubric-page-view";
import { buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ subrubric: string }> };

const dedicatedFoodSubrubrics = new Set(["restaurants", "brunch"]);

function findSubrubric(slug: string) {
  return localSubrubrics.find((item) => item.rubricId === "food" && item.slug === slug && !dedicatedFoodSubrubrics.has(item.slug));
}

export function generateStaticParams() {
  return localSubrubrics
    .filter((item) => item.rubricId === "food" && !dedicatedFoodSubrubrics.has(item.slug))
    .map((item) => ({ subrubric: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = findSubrubric((await params).subrubric);
  return item
    ? buildPageMetadata({
        title: `${item.name} — Food`,
        description: item.description,
        path: `/food/${item.slug}`,
        image: item.image,
        imageAlt: item.imageAlt,
      })
    : {};
}

export default async function FoodSubrubricPage({ params }: Props) {
  const item = findSubrubric((await params).subrubric);
  if (!item) notFound();

  return (
    <SubrubricPageView
      rubricSlug="food"
      subrubricSlug={item.slug}
      fallbackTitle={item.name}
      fallbackDescription={item.description}
      fallbackImage={item.image}
    />
  );
}
