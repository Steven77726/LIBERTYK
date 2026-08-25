import { Suspense } from "react";
import { RuntimeRubricPage } from "@/components/ui/runtime-rubric-page";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Rubrique — Liberty K",
  description: "Découvrez les rubriques publiées sur Liberty K.",
  path: "/rubrique",
});

export default function RubriquePage() {
  return (
    <Suspense fallback={<section className="page-shell py-16 text-sm text-ink/45">Chargement de la rubrique…</section>}>
      <RuntimeRubricPage />
    </Suspense>
  );
}
