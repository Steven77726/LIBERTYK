import Link from "next/link";
import {
  ArrowRight, Bot, Check, ChevronRight, Sparkles,
} from "lucide-react";
import { CategoryGrid } from "@/components/ui/category-grid";
import { AiSearch } from "@/components/search/ai-search";

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

      <section className="page-shell py-8 sm:py-10">
        <div className="mb-4 max-w-3xl">
          <p className="eyebrow">Une intelligence à vous</p>
          <h2 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Créez votre Agent IA.</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-ink/48 sm:text-sm">Un assistant personnel qui apprend vos préférences et transforme chacune de vos envies en recommandations vraiment utiles.</p>
        </div>

        <div className="group relative overflow-hidden rounded-[2rem] bg-[#dfe9e2] p-5 sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-28 -top-40 size-[520px] rounded-full bg-white/60 blur-[80px]" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-ink text-white shadow-xl shadow-moss/15"><Bot size={18} /></span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-moss"><Sparkles size={10} /> Bientôt disponible</span>
              </div>
              <h3 className="mt-3 max-w-xl text-2xl font-semibold leading-[1.05] tracking-[-.045em] sm:text-3xl">Votre agent IA qui retient vos envies préférées.</h3>
              <p className="mt-2 max-w-xl text-xs leading-5 text-ink/55">Donnez-lui un nom, indiquez-lui ce que vous aimez et laissez-le préparer vos sorties, vos voyages ou votre quotidien.</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink/65">
                {["Comprend vos habitudes", "Respecte vos exigences", "Anticipe vos prochaines envies"].map((item) => <p key={item} className="flex items-center gap-1.5"><span className="grid size-4 place-items-center rounded-full bg-white/75 text-moss"><Check size={9} /></span>{item}</p>)}
              </div>
              <button className="mt-4 flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-xl">
                Créer mon Agent IA <ArrowRight size={14} />
              </button>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div className="absolute -inset-3 rounded-[2rem] border border-white/45 bg-white/20 blur-sm" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_55px_rgba(37,65,50,.13)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-black/[.06] pb-3">
                  <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-xl bg-ink text-white"><Bot size={14} /></span><div><p className="text-xs font-semibold">Mon Agent Liberty</p><p className="text-[9px] text-ink/40">Votre assistant personnel</p></div></div>
                  <span className="flex items-center gap-1 rounded-full bg-sage px-2 py-1 text-[8px] font-semibold text-moss"><span className="size-1 rounded-full bg-moss" /> Actif</span>
                </div>
                <div className="space-y-2 py-3">
                  <div className="mr-8 rounded-xl rounded-tl-sm bg-cream p-2.5 text-[10px] leading-4 text-ink/60">Bonjour Steven. J'ai trouvé trois nouvelles adresses qui correspondent à vos préférences.</div>
                  <div className="ml-8 rounded-xl rounded-tr-sm bg-ink p-2.5 text-[10px] leading-4 text-white/75">Trouve-moi un restaurant viande élégant à Paris pour jeudi soir.</div>
                  <div className="mr-8 rounded-xl rounded-tl-sm bg-cream p-2.5">
                    <p className="text-[10px] leading-4 text-ink/60">Avec plaisir. Je vérifie vos critères habituels…</p>
                    <div className="mt-1.5 flex gap-1"><span className="size-1 animate-pulse rounded-full bg-moss/50" /><span className="size-1 animate-pulse rounded-full bg-moss/50 [animation-delay:150ms]" /><span className="size-1 animate-pulse rounded-full bg-moss/50 [animation-delay:300ms]" /></div>
                  </div>
                </div>
                <div className="flex items-center rounded-xl border border-black/[.07] bg-white px-3 py-2 text-[10px] text-ink/30">Écrivez à votre agent…<ChevronRight className="ml-auto text-ink" size={13} /></div>
              </div>
            </div>
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
