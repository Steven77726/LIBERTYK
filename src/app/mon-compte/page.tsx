import type { Metadata } from "next";
import { Bookmark, Heart } from "lucide-react";
import { AccountDashboard } from "@/components/account/account-dashboard";

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
          <AccountDashboard />
        </div>
      </div>
    </section>
  );
}
