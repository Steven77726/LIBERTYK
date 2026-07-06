import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bookmark, Heart, LockKeyhole, Mail, UserRound } from "lucide-react";

export const metadata: Metadata = { title: "Mon compte" };

export default function AccountPage() {
  return (
    <section className="page-shell py-10 sm:py-16">
      <div className="grid min-h-[650px] overflow-hidden rounded-4xl bg-white shadow-soft lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="relative"><p className="text-xs font-semibold uppercase tracking-[.2em] text-white/50">Votre espace Liberty</p><h1 className="mt-4 text-4xl font-semibold tracking-[-.04em]">Gardez le meilleur<br />à portée de main.</h1><div className="mt-8 grid gap-3 text-sm text-white/65"><p className="flex items-center gap-3"><Heart size={17} /> Enregistrez vos adresses préférées</p><p className="flex items-center gap-3"><Bookmark size={17} /> Retrouvez toutes vos sélections</p></div></div>
        </div>
        <div className="flex items-center justify-center p-7 sm:p-14">
          <div className="w-full max-w-md"><span className="grid size-12 place-items-center rounded-2xl bg-sage text-moss"><UserRound size={22} /></span><h2 className="mt-7 text-3xl font-semibold tracking-[-.04em]">Ravi de vous revoir.</h2><p className="mt-3 text-sm leading-6 text-ink/50">Connectez-vous pour retrouver votre univers personnel.</p>
            <form className="mt-9 space-y-5">
              <label className="block"><span className="mb-2 block text-sm font-medium">Adresse e-mail</span><span className="flex items-center gap-3 rounded-2xl border border-black/10 px-4"><Mail size={17} className="text-ink/30" /><input type="email" placeholder="vous@exemple.fr" className="w-full bg-transparent py-4 text-sm outline-none" /></span></label>
              <label className="block"><span className="mb-2 flex justify-between text-sm font-medium">Mot de passe <Link href="#" className="text-moss">Mot de passe oublié ?</Link></span><span className="flex items-center gap-3 rounded-2xl border border-black/10 px-4"><LockKeyhole size={17} className="text-ink/30" /><input type="password" placeholder="••••••••" className="w-full bg-transparent py-4 text-sm outline-none" /></span></label>
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-sm font-semibold text-white">Se connecter <ArrowRight size={17} /></button>
            </form>
            <p className="mt-7 text-center text-sm text-ink/45">Nouveau sur Liberty ? <Link href="#" className="font-semibold text-ink">Créer un compte</Link></p>
            <p className="mt-8 rounded-2xl bg-cream p-4 text-center text-xs leading-5 text-ink/45">Mode démonstration — aucune donnée n'est enregistrée.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
