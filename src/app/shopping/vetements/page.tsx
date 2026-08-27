import type { Metadata } from "next";
import { SubrubricPageView } from "@/components/ui/subrubric-page-view";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Vêtements — Shopping Liberty K",
  description: "Découvrez les enseignes de vêtements et boutiques mode de Liberty K, dont Azamra.",
  path: "/shopping/vetements",
  image: "/images/shopping/azamra.jpg",
  imageAlt: "Boutique Azamra",
});

export default function ClothesPage() {
  return (
    <SubrubricPageView
      rubricSlug="shopping"
      subrubricSlug="mode"
      fallbackTitle="Vêtements"
      fallbackDescription="Découvrez les enseignes de vêtements et boutiques mode de Liberty K."
      fallbackImage="/images/shopping/azamra.jpg"
    />
  );
}
