import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/categories";

export function CategoryGrid() {
  return (
    <section className="page-shell py-8 sm:py-10">
      <div className="mb-5 max-w-3xl"><p className="eyebrow">Tous vos univers</p><h2 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Tout ce qui compte. <span className="text-ink/28">Au même endroit.</span></h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map(({ slug, label, description, image, icon: Icon, softColor }) => (
          <Link key={slug} href={`/${slug}`} className="group relative min-h-[205px] overflow-hidden rounded-2xl bg-ink text-white shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-2xl">
            <img src={image} alt="" className="absolute inset-0 size-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="grid size-8 place-items-center rounded-lg border border-white/20 bg-white/15 backdrop-blur-xl" style={{ color: softColor }}><Icon size={15} /></span>
                <span className="grid size-8 translate-y-2 place-items-center rounded-full bg-white text-ink opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100"><ArrowUpRight size={14} /></span>
              </div>
              <h3 className="text-xl font-semibold tracking-[-.04em]">{label}</h3>
              <p className="mt-1 max-w-md text-[11px] leading-4 text-white/62">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
