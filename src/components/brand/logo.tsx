import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Liberty, accueil">
      <span className={`grid size-9 place-items-center rounded-xl text-lg font-semibold transition-transform group-hover:-rotate-3 ${light ? "bg-white text-moss" : "bg-moss text-white"}`}>ל</span>
      <span className={`text-xl font-semibold tracking-[-0.04em] ${light ? "text-white" : "text-ink"}`}>liberty<span className="text-gold">.</span></span>
    </Link>
  );
}
