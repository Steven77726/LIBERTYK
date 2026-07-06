import Link from "next/link";

export default function NotFound() {
  return <section className="page-shell grid min-h-[60vh] place-items-center py-20 text-center"><div><p className="eyebrow">Erreur 404</p><h1 className="text-5xl font-semibold tracking-[-.05em]">Cette page s'est égarée.</h1><p className="mt-4 text-ink/50">Revenons à l'essentiel.</p><Link href="/" className="mt-8 inline-block rounded-2xl bg-ink px-6 py-3.5 text-sm font-semibold text-white">Retour à l'accueil</Link></div></section>;
}
