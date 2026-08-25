import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Scale } from "lucide-react";

export const metadata = {
  title: "Conditions Générales (CGU & CGV) | Libertyk",
  description: "Accès aux Conditions Générales d'Utilisation et Conditions Générales de Vente de Libertyk.",
};

export default function CGUCGVHubPage() {
  return (
    <div className="min-h-screen bg-[#fcfbfa] text-ink pb-24 pt-12">
      <div className="page-shell max-w-4xl mx-auto space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-ink/60 hover:text-ink transition"
        >
          <ArrowLeft size={16} /> Retour à l&apos;accueil
        </Link>

        <div className="rounded-[2.5rem] bg-white border border-black/5 p-8 sm:p-12 shadow-sm space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f6ecd9] text-[#8f6424] text-xs font-extrabold uppercase tracking-wider">
            <Scale size={14} /> Documentation Juridique
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-ink">
            Cadre Contractuel & Juridique
          </h1>
          <p className="text-sm sm:text-base text-ink/65 max-w-2xl leading-relaxed">
            Consultez les conditions contractuelles régissant l&apos;utilisation des services Libertyk pour les particuliers et les professionnels.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Carte CGU */}
          <Link
            href="/cgu"
            className="group rounded-[2.5rem] bg-white border border-black/5 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-ink text-white">
                <FileText size={22} />
              </div>
              <h2 className="text-xl font-extrabold text-ink group-hover:text-moss transition">
                Conditions Générales d&apos;Utilisation (CGU)
              </h2>
              <p className="text-xs text-ink/65 leading-relaxed">
                Règles d&apos;accès à l&apos;annuaire, compte utilisateur, favoris, publication d&apos;avis et clauses de non-responsabilité Cacherout.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-moss">
              Lire les CGU <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Carte CGV */}
          <Link
            href="/cgv"
            className="group rounded-[2.5rem] bg-white border border-black/5 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#f6ecd9] text-[#8f6424]">
                <Scale size={22} />
              </div>
              <h2 className="text-xl font-extrabold text-ink group-hover:text-moss transition">
                Conditions Générales de Vente (CGV)
              </h2>
              <p className="text-xs text-ink/65 leading-relaxed">
                Tarification des professionnels, abonnements de visibilité premium, droit de rétractation et garanties de service.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold text-moss">
              Lire les CGV <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
