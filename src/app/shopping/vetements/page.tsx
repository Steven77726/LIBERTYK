import type { Metadata } from "next";
import { Shirt } from "lucide-react";
import { AzamraCard } from "@/components/shops/azamra-card";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Vêtements — Shopping Liberty",
  description: "Découvrez les enseignes de vêtements et boutiques mode de Liberty, dont Azamra.",
  path: "/shopping/vetements",
  image: "/images/shopping/azamra.jpg",
  imageAlt: "Boutique Azamra",
});

export default function ClothesPage() {
  return (
    <section className="page-shell py-8 sm:py-12">
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-black/[.06] bg-white/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream text-moss shadow-sm"><Shirt size={22} /></span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-ink/35">Shopping · Sous-rubrique</p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Vêtements</h1>
          </div>
        </div>
        <span className="w-fit rounded-full bg-cream px-3 py-1.5 text-[11px] font-semibold text-ink/45">Sous-rubrique</span>
      </div>
      <div className="mt-8 max-w-xl">
        <AzamraCard />
      </div>
    </section>
  );
}
