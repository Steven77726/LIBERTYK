import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { CategoryGrid } from "@/components/ui/category-grid";
import { AiSearch } from "@/components/search/ai-search";
import { AgentShowcase } from "@/components/agents/agent-showcase";

export default function HomePage() {
  return (
    <>
      <section className="page-shell pt-4 sm:pt-5">
        <div className="relative rounded-[2rem] bg-[#111815] px-5 py-6 text-white sm:px-10 sm:py-7 lg:px-16 lg:py-8">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
            <div className="absolute left-1/2 top-[-35%] h-[650px] w-[850px] -translate-x-1/2 rounded-full bg-[#527761]/30 blur-[120px]" />
            <div className="absolute -bottom-52 -right-32 size-[460px] rounded-full bg-[#b79d65]/15 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-2.5 flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[.07] px-3 py-1 text-[10px] font-medium text-white/70 backdrop-blur-xl">
              <Sparkles size={11} className="text-[#d5bb7d]" />
              Votre nouveau réflexe casher
            </div>
            <h1 className="text-[clamp(2rem,4vw,3.7rem)] font-semibold leading-[.92] tracking-[-.065em]">
              Demandez.{" "}
              <span className="bg-gradient-to-r from-white/45 via-white to-white/45 bg-clip-text text-transparent">Liberty trouve.</span>
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-xs leading-5 text-white/45">
              Restaurants, voyages, services, culture. Toute la vie juive et casher devient instantanément accessible.
            </p>

            <AiSearch />
          </div>
        </div>
      </section>

      <AgentShowcase />

      <CategoryGrid />

      <section className="page-shell pb-8 sm:pb-10">
        <div className="flex flex-col items-center rounded-[2rem] bg-ink px-6 py-10 text-center text-white sm:py-12">
          <Sparkles size={20} className="mb-4 text-gold" />
          <h2 className="max-w-3xl text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Une seule application.<br /><span className="text-white/35">Tout un monde à découvrir.</span></h2>
          <Link href="/mon-compte" className="mt-5 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-ink">Rejoindre Liberty <ArrowRight size={14} /></Link>
        </div>
      </section>
    </>
  );
}
