import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowUpRight, Bell, CheckCircle2, Clock3, Heart, LayoutDashboard, Search, Settings, Share2, Store, UsersRound } from "lucide-react";
import { AdminIntelligence } from "@/components/admin/admin-intelligence";

export const metadata: Metadata = { title: "Administration" };

const stats = [
  { label: "Visiteurs", value: "12 480", trend: "+18%", icon: Activity },
  { label: "Utilisateurs inscrits", value: "8 642", trend: "+8%", icon: UsersRound },
  { label: "Likes & favoris", value: "3 214", trend: "+14%", icon: Heart },
  { label: "Partages", value: "824", trend: "+21%", icon: Share2 },
  { label: "Demandes de réservation", value: "128", trend: "À traiter", icon: Clock3 },
  { label: "Notifications envoyées", value: "2 906", trend: "+9%", icon: CheckCircle2 },
  { label: "Pages les plus visitées", value: "Food", trend: "Top page", icon: Store },
  { label: "Temps moyen passé", value: "3m42", trend: "+11%", icon: Activity },
];

export default function AdminPage() {
  return (
    <section className="page-shell py-8">
      <div className="overflow-hidden rounded-4xl border border-black/5 bg-[#f2f3ef] shadow-soft">
        <div className="flex min-h-[760px]">
          <aside className="hidden w-64 shrink-0 flex-col bg-ink p-6 text-white lg:flex">
            <Link href="/" className="mb-12 flex items-center gap-3 text-lg font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-white text-moss">ל</span> liberty admin</Link>
            <nav className="space-y-1 text-sm"><Link href="#" className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 font-medium"><LayoutDashboard size={17} /> Vue d'ensemble</Link><Link href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/55"><Store size={17} /> Établissements</Link><Link href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/55"><UsersRound size={17} /> Utilisateurs</Link><Link href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/55"><Activity size={17} /> Activité</Link></nav>
            <Link href="#" className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/55"><Settings size={17} /> Paramètres</Link>
          </aside>
          <div className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">
            <header className="flex items-center justify-between"><div><p className="text-sm text-ink/45">Jeudi 2 juillet 2026</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.04em]">Bonjour, Steven</h1></div><div className="flex gap-2"><button className="grid size-11 place-items-center rounded-full bg-white"><Search size={18} /></button><button className="relative grid size-11 place-items-center rounded-full bg-white"><Bell size={18} /><span className="absolute right-1 top-1 size-2.5 rounded-full border-2 border-white bg-[#c3694f]" /></button></div></header>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, trend, icon: Icon }) => <article key={label} className="rounded-3xl bg-white p-5"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-sage text-moss"><Icon size={18} /></span><span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink/50">{trend}</span></div><p className="mt-6 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-ink/40">{label}</p></article>)}</div>
            <AdminIntelligence />
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
              <article className="rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><div><p className="font-semibold">Activité de la plateforme</p><p className="mt-1 text-xs text-ink/40">Aperçu des 7 derniers jours</p></div><span className="text-sm font-semibold text-moss">+18,4%</span></div><div className="mt-10 flex h-52 items-end gap-3">{[38,55,42,70,62,88,76].map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><div className="w-full rounded-t-lg bg-sage transition hover:bg-moss" style={{ height: `${height}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-ink/30">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => <span key={d}>{d}</span>)}</div></article>
              <article className="rounded-3xl bg-ink p-6 text-white"><p className="text-sm font-semibold">À valider</p><p className="mt-1 text-xs text-white/40">Nouvelles demandes</p><div className="mt-7 space-y-4">{["Maison Lev", "Studio Aleph", "Kosher Travel"].map((name, index) => <div key={name} className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xs">0{index+1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="text-[11px] text-white/35">Il y a {index + 1} h</p></div><ArrowUpRight size={16} className="text-white/40" /></div>)}</div><button className="mt-8 w-full rounded-xl bg-white py-3 text-xs font-semibold text-ink">Voir les demandes</button></article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
