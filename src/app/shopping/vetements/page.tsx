import type { Metadata } from "next";
import { Shirt } from "lucide-react";
import { AzamraCard } from "@/components/shops/azamra-card";

export const metadata: Metadata = { title: "Vêtements" };

export default function ClothesPage() {
  return (
    <section className="page-shell py-8 sm:py-12">
      <div className="rounded-[2rem] bg-[#202320] px-7 py-12 text-white sm:px-12"><Shirt size={23} /><p className="mt-6 text-xs font-semibold uppercase tracking-[.18em] text-white/40">Shopping</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">Vêtements</h1></div>
      <div className="mt-10 max-w-xl">
        <AzamraCard />
      </div>
    </section>
  );
}
