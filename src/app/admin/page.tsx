import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowUpRight, Bell, Bot, Bug, CheckCircle2, Clock3, Eye, Heart, LayoutDashboard, LineChart, MessageSquare, PieChart, Search, Send, Settings, Share2, Store, UsersRound } from "lucide-react";

export const metadata: Metadata = { title: "Administration" };

const stats = [
  { label: "Visiteurs", value: "18 420", trend: "+14%", icon: Eye },
  { label: "Utilisateurs inscrits", value: "8 642", trend: "+8%", icon: UsersRound },
  { label: "Temps moyen", value: "4m 12s", trend: "+22s", icon: Clock3 },
  { label: "Taux de validation", value: "94%", trend: "+2,4%", icon: CheckCircle2 },
];

const metrics = [
  ["Pages les plus visitées", "Food, Restaurants, Vin & Spiritueux"],
  ["Restaurants consultés", "Khan, Maison Gabriel, Flavio"],
  ["Voyages consultés", "Marrakech, Pessah, Famille"],
  ["Recherches IA", "bassari 17, vin casher, brunch paris"],
  ["Likes", "128 aujourd’hui"],
  ["Favoris", "76 ajouts"],
  ["Partages", "WhatsApp 42 · Instagram 18 · Liens 31"],
  ["Réservations", "14 demandes simulées"],
  ["Notifications", "36 préparées"],
];

const management = ["Restaurants", "Voyages", "Événements", "Utilisateurs", "Partenaires"];

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
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
              <article className="rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><div><p className="font-semibold">Activité de la plateforme</p><p className="mt-1 text-xs text-ink/40">Aperçu des 7 derniers jours</p></div><span className="text-sm font-semibold text-moss">+18,4%</span></div><div className="mt-10 flex h-52 items-end gap-3">{[38,55,42,70,62,88,76].map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><div className="w-full rounded-t-lg bg-sage transition hover:bg-moss" style={{ height: `${height}%` }} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-ink/30">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => <span key={d}>{d}</span>)}</div></article>
              <article className="rounded-3xl bg-ink p-6 text-white"><p className="text-sm font-semibold">À valider</p><p className="mt-1 text-xs text-white/40">Nouvelles demandes</p><div className="mt-7 space-y-4">{["Maison Lev", "Studio Aleph", "Kosher Travel"].map((name, index) => <div key={name} className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xs">0{index+1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{name}</p><p className="text-[11px] text-white/35">Il y a {index + 1} h</p></div><ArrowUpRight size={16} className="text-white/40" /></div>)}</div><button className="mt-8 w-full rounded-xl bg-white py-3 text-xs font-semibold text-ink">Voir les demandes</button></article>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <article className="rounded-3xl bg-white p-6">
                <div className="flex items-center justify-between"><div><p className="font-semibold">Statistiques détaillées</p><p className="mt-1 text-xs text-ink/40">IA, engagement et contenus</p></div><PieChart className="text-moss" size={20} /></div>
                <div className="mt-5 grid gap-2">
                  {metrics.map(([label, value]) => <div key={label} className="flex justify-between gap-4 rounded-2xl bg-cream px-4 py-3 text-xs"><span className="text-ink/45">{label}</span><span className="max-w-[55%] text-right font-semibold">{value}</span></div>)}
                </div>
              </article>
              <article className="rounded-3xl bg-white p-6">
                <div className="flex items-center justify-between"><div><p className="font-semibold">IA de surveillance</p><p className="mt-1 text-xs text-ink/40">Audit quotidien prévu à 00h — aucune modification automatique en production</p></div><Bot className="text-gold" size={22} /></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Erreurs", "Analyse JS et rendu", Bug],
                    ["Liens cassés", "Contrôle navigation", LineChart],
                    ["Données manquantes", "Adresses, photos, tags", Store],
                    ["Performances", "Pages lentes et assets", Activity],
                    ["Recherches IA", "Intentions fréquentes", Search],
                    ["Rapport quotidien", "Corrections préparées", MessageSquare],
                  ].map(([label, text, Icon]) => <div key={label as string} className="rounded-2xl border border-black/[.06] p-4"><Icon size={17} className="text-moss" /><p className="mt-3 text-sm font-semibold">{label as string}</p><p className="mt-1 text-xs leading-5 text-ink/40">{text as string}</p></div>)}
                </div>
                <div className="mt-5 rounded-2xl bg-[#fff8e6] p-4 text-xs leading-5 text-ink/55">Commande technique prête : <code>npm run monitor:ai</code>. Le rapport prépare les corrections, puis l’administrateur valide avant toute mise en production.</div>
              </article>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <article className="rounded-3xl bg-white p-6"><p className="font-semibold">Engagement</p><div className="mt-5 grid grid-cols-3 gap-3">{[[Heart,"Likes"],[Share2,"Partages"],[Send,"Notifications"]].map(([Icon,label]) => <div key={label as string} className="rounded-2xl bg-cream p-4 text-center"><Icon className="mx-auto text-moss" size={18} /><p className="mt-3 text-xs font-semibold">{label as string}</p></div>)}</div></article>
              <article className="rounded-3xl bg-white p-6"><p className="font-semibold">Gestion future</p><div className="mt-4 flex flex-wrap gap-2">{management.map((item) => <span key={item} className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink/60">{item}</span>)}</div></article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
