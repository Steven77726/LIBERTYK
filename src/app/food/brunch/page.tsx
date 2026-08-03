import type { Metadata } from "next";
import { BrunchExplorer } from "@/components/brunch/brunch-explorer";
import { brunches } from "@/data/brunches";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Brunch casher à Paris",
  description: "Découvrez les meilleures adresses de brunch casher à Paris, avec recherche, filtres, horaires, services et avis.",
  path: "/food/brunch",
  image: "/images/food/brunch-marceau.jpg",
  imageAlt: "Brunch casher à Paris",
});

export default function BrunchPage() {
  return <BrunchExplorer initialBrunches={brunches} />;
}
