import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchResultsPage } from "@/components/search/search-results-page";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Résultats de recherche · Liberty",
  description: "Découvrez tous les restaurants, brunchs, traiteurs, boutiques et adresses casher correspondant à votre recherche.",
  path: "/recherche",
});

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f9f6] py-24 text-center">
          <div className="mx-auto size-10 animate-spin rounded-full border-4 border-moss/20 border-t-moss" />
          <p className="mt-4 text-sm font-semibold text-ink/60">Chargement de la recherche…</p>
        </div>
      }
    >
      <SearchResultsPage />
    </Suspense>
  );
}
