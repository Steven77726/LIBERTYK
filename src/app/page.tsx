import Link from "next/link";
import {
  ArrowRight, Sparkles,
} from "lucide-react";
import { CategoryGrid } from "@/components/ui/category-grid";
import { AiSearch } from "@/components/search/ai-search";

export default function HomePage() {
  return (
    <>
      <section id="recherche" className="page-shell pt-4 sm:pt-5">
        <div className="liberty-hero-shell relative overflow-hidden rounded-[2rem] border border-white/[.08] bg-[radial-gradient(circle_at_50%_-18%,#31493d_0%,#111815_42%,#08100d_100%)] px-5 py-7 text-white sm:px-10 sm:py-8 lg:px-16 lg:py-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
            <div className="liberty-hero-aurora absolute left-1/2 top-[-44%] h-[680px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#8fa98d66_0%,#52776133_36%,transparent_68%)] blur-[105px]" />
            <div className="absolute -bottom-52 -right-32 size-[500px] rounded-full bg-[#d5bb7d]/18 blur-[105px]" />
            <div className="absolute -left-40 bottom-[-18rem] size-[520px] rounded-full bg-[#eff7ed]/[.08] blur-[110px]" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,rgba(255,255,255,.055)_38%,transparent_58%)]" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-5xl text-center">
            <h1 className="text-[clamp(2rem,4vw,3.7rem)] font-semibold leading-[.92] tracking-[-.065em]">
              Demandez.{" "}
              <span className="bg-gradient-to-r from-white/45 via-white via-45% to-[#e7d39a] bg-clip-text text-transparent drop-shadow-[0_12px_45px_rgba(255,255,255,.12)]">Liberty trouve.</span>
            </h1>

            <AiSearch />
          </div>
        </div>
      </section>

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
