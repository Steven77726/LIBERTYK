"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  Bell,
  Bot,
  Brain,
  ChevronLeft,
  Clock3,
  Heart,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Wine,
  X,
} from "lucide-react";
import { EntityDrawer } from "@/components/ui/entity-drawer";
import { withBasePath } from "@/lib/paths";

type Agent = {
  id: "batata" | "tsadik" | "favoris";
  name: string;
  text: string;
  image: string;
  icon: typeof Bot;
};

type CustomProfile = {
  name: string;
  theme: string;
  image?: string;
};

const agents: Agent[] = [
  { id: "batata", name: "Batata", text: "L'agent IA qui retient toutes mes envies resto !", image: withBasePath("/images/agents/batata-clean.png"), icon: Bot },
  { id: "tsadik", name: "TSADIK", text: "L'agent IA spécialisé dans les vins et spiritueux casher.", image: withBasePath("/images/agents/tsadik-clean.png"), icon: Wine },
  { id: "favoris", name: "Mes Favoris", text: "Retrouvez tous vos coups de cœur au même endroit.", image: withBasePath("/images/agents/mes-favoris-clean.png"), icon: Heart },
];

const themes = [
  "🍽 Food & Restaurants",
  "🍷 Vin & Spiritueux",
  "✈️ Voyages",
  "🎉 Sorties",
  "💍 Mariage",
  "🕍 Religion & Traditions",
  "🏋️ Sport",
  "🛍 Shopping",
  "👶 Enfants",
  "🚗 Chauffeurs",
  "📅 Calendrier juif",
  "💰 Bons plans",
  "🍰 Pâtisseries",
];

const searchExamples = {
  batata: ["Brunch casher Paris 17", "Restaurant bassari 17", "Traiteur Chabbat Paris", "Pizza casher livraison", "Meilleur burger casher", "Glaces casher Paris"],
  tsadik: ["Calendrier juif 2025", "Horaires Chabbat Paris", "Mikvé homme Paris", "Cours de Torah Paris", "Synagogue Paris 17", "Cours du Rav Gobert"],
  favoris: ["Restaurant préféré", "Voyage favori", "Boutique préférée", "Événement favori", "Vin préféré", "Service favori"],
};

function EmptyAvatar({ profile, index, onChange, onRemove }: { profile: CustomProfile; index: number; onChange: (index: number, image: string) => void; onRemove: (index: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const importImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onChange(index, URL.createObjectURL(file));
  };

  return (
    <div className="relative shrink-0 text-center">
      <button type="button" onClick={() => inputRef.current?.click()} className="group relative grid size-16 place-items-center overflow-hidden rounded-xl border border-dashed border-[#c99548]/55 bg-white transition hover:border-[#c99548] hover:bg-[#fffaf1]">
        {profile.image ? <img src={profile.image} alt="" className="size-full object-contain" /> : <span className="flex flex-col items-center gap-1 text-ink/42"><Plus size={20} /><span className="text-[9px] font-semibold">Ajouter une photo</span></span>}
      </button>
      {profile.image && <button type="button" aria-label={`Supprimer la photo de ${profile.name}`} onClick={() => onRemove(index)} className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-ink text-white shadow"><X size={10} /></button>}
      <input ref={inputRef} type="file" accept="image/*" onChange={importImage} className="hidden" />
      <button type="button" className="mt-1.5 inline-flex items-center gap-1 text-[8px] font-semibold text-moss"><Sparkles size={9} /> Avatar IA plus tard</button>
    </div>
  );
}

function MemoryCard({ agent, specialty, searches }: { agent: Agent; specialty: string; searches: string[] }) {
  return (
    <article className="rounded-[1.75rem] border border-black/[.045] bg-white/80 p-4 shadow-[0_14px_45px_rgba(45,36,25,.055)] backdrop-blur sm:p-5">
      <div className="flex items-center justify-between"><ChevronLeft size={18} strokeWidth={1.5} /><MoreHorizontal size={18} /></div>
      <div className="mt-3 flex items-center gap-3">
        <span className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-transparent"><img src={agent.image} alt="" className="size-full object-contain" /></span>
        <div className="min-w-0"><h3 className="truncate text-base font-semibold uppercase">{agent.name}</h3><p className="mt-1 flex items-center gap-1.5 text-[10px] text-ink/48">{specialty} {agent.id !== "favoris" && <Pencil size={10} />}</p></div>
      </div>
      <div className="mt-4 flex items-center rounded-full border border-black/[.07] bg-white px-3 py-2 text-[10px] text-ink/38"><span className="flex-1">Demandez. Liberty trouve.</span><Sparkles size={12} className="text-[#c99548]" /></div>
      <div className="mt-4 flex items-center justify-between"><strong className="text-[11px]">Dernières recherches</strong><span className="grid size-5 place-items-center rounded-full bg-ink text-white"><X size={9} /></span></div>
      <ul className="mt-2">
        {searches.map((search) => <li key={search} className="flex items-center gap-2 border-b border-black/[.06] py-2 text-[10px] last:border-0"><Clock3 size={11} className="shrink-0 text-ink/55" /><span className="min-w-0 flex-1 truncate">{search}</span><X size={9} className="text-ink/55" /></li>)}
      </ul>
      <button type="button" className="mt-3 w-full rounded-full border border-black/[.08] py-2 text-[10px] font-semibold uppercase transition hover:bg-ink hover:text-white">Tout voir</button>
    </article>
  );
}

export function AgentShowcase() {
  const [selected, setSelected] = useState<Agent | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [profiles, setProfiles] = useState<CustomProfile[]>([
    { name: "Profil 3", theme: "✈️ Voyages" },
    { name: "Profil 4", theme: "🕍 Religion & Traditions" },
    { name: "Profil 5", theme: "👶 Enfants" },
  ]);

  const updateProfile = (index: number, patch: Partial<CustomProfile>) => {
    setProfiles((current) => current.map((profile, profileIndex) => profileIndex === index ? { ...profile, ...patch } : profile));
  };

  return (
    <section className="page-shell py-8 sm:py-10">
      <div className="relative overflow-hidden rounded-[2.25rem] bg-[radial-gradient(circle_at_50%_0%,#fff_0%,#fbf8f3_52%,#f7f3ed_100%)] px-4 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto mb-7 max-w-3xl text-center">
        <Sparkles className="mx-auto mb-1 text-[#c99548]" size={23} />
        <h2 className="text-3xl font-semibold tracking-[-.055em] sm:text-4xl">Créez votre Agent IA.</h2>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-ink/55 sm:text-sm">Votre agent IA qui retient vos envies préférées et vous propose le meilleur.</p>
        </div>
        <div className="relative mx-auto grid max-w-3xl grid-cols-4 gap-3 sm:gap-8">
          {agents.map((agent) => {
            return (
              <button key={agent.id} onClick={() => setSelected(agent)} className="group flex min-w-0 flex-col items-center text-center transition duration-300 hover:-translate-y-1">
                <span className="relative h-40 w-full max-w-44 shrink-0 overflow-visible bg-transparent sm:h-52 sm:max-w-52"><img src={agent.image} alt="" className="size-full object-contain transition duration-500 group-hover:scale-105" /></span>
                <strong className="mt-2 max-w-full truncate rounded-full border border-black/[.07] bg-white/65 px-3 py-1 text-[9px] uppercase shadow-sm sm:text-xs">{agent.name}</strong>
                <span className="mt-2 hidden max-w-36 text-[9px] leading-4 text-ink/45 sm:block">{agent.id === "batata" ? "Agent IA spécialisé Food & Restaurants." : agent.id === "tsadik" ? "Agent IA spécialisé Vin & Spiritueux." : "Tous vos contenus enregistrés en favoris."}</span>
              </button>
            );
          })}
          <button onClick={() => setCreatorOpen(true)} className="group flex min-w-0 flex-col items-center text-center transition duration-300 hover:-translate-y-1">
            <span className="grid h-28 w-full max-w-32 place-items-center rounded-[2rem] border border-[#c99548] bg-white/55 text-[#c99548] shadow-[0_8px_28px_rgba(30,45,35,.06)] sm:h-40 sm:max-w-40"><Plus className="transition group-hover:rotate-90 group-hover:scale-110" size={38} strokeWidth={1.5} /></span>
            <strong className="mt-2 rounded-full border border-black/[.07] bg-white/65 px-3 py-1 text-[9px] uppercase shadow-sm sm:text-xs">Ajouter</strong>
          </button>
        </div>
        <div className="relative mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold text-white shadow-lg sm:text-sm"><Sparkles size={14} className="text-[#e0aa54]" /> Créer tes profils intelligents</div>

        <div className="mt-8 overflow-x-auto pb-2">
          <div className="grid min-w-[780px] grid-cols-3 gap-4">
            <MemoryCard agent={agents[0]} specialty="Food & Restaurants" searches={searchExamples.batata} />
            <MemoryCard agent={agents[1]} specialty="Vin & Spiritueux" searches={searchExamples.tsadik} />
            <MemoryCard agent={agents[2]} specialty="Vos coups de cœur" searches={searchExamples.favoris} />
          </div>
        </div>
      </div>

      <EntityDrawer open={creatorOpen} onClose={() => setCreatorOpen(false)} title="Créer jusqu'à 5 profils">
        <div className="p-5 sm:p-7">
          <p className="text-center text-sm leading-6 text-ink/52">Sélectionnez ou créez vos profils IA</p>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {agents.slice(0, 2).map((agent) => (
              <div key={agent.id} className="flex min-w-0 flex-col items-center">
                <span className="h-16 w-full max-w-20 overflow-hidden bg-transparent"><img src={agent.image} alt="" className="size-full object-contain" /></span>
                <span className="mt-2 max-w-full truncate rounded-full border border-black/[.08] px-2 py-1 text-[8px] font-semibold uppercase sm:text-[9px]">{agent.name}</span>
              </div>
            ))}
            {profiles.map((profile, index) => (
              <div key={index} className="flex min-w-0 flex-col items-center">
                <span className="grid h-16 w-full max-w-20 place-items-center overflow-hidden rounded-xl border border-dashed border-[#c99548]/55 bg-white text-[#c99548]">{profile.image ? <img src={profile.image} alt="" className="size-full object-contain" /> : <span className="flex flex-col items-center"><Plus size={20} strokeWidth={1.5} /><small className="mt-1 text-center text-[7px] leading-3 text-ink/55">Ajouter<br />une photo</small></span>}</span>
                <span className="mt-2 max-w-full truncate rounded-full border border-black/[.08] px-2 py-1 text-[8px] font-semibold uppercase sm:text-[9px]">{profile.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-black/[.08] pt-5">
            <h3 className="text-center text-sm font-semibold">Personnalisez chaque profil</h3>
          </div>
          <div className="mt-4 space-y-2.5">
            {agents.slice(0, 2).map((agent, index) => (
              <div key={agent.id} className="rounded-2xl border border-black/[.06] bg-white p-3">
                <div className="grid grid-cols-[2.75rem_minmax(0,.72fr)_minmax(0,1.28fr)] items-center gap-2.5">
                  <span className="h-11 w-12 shrink-0 overflow-hidden bg-transparent"><img src={agent.image} alt="" className="size-full object-contain" /></span>
                  <div className="rounded-xl border border-black/[.07] bg-[#fafafa] px-3 py-2 text-xs font-semibold">{agent.name}</div>
                  <div className="rounded-xl border border-black/[.07] bg-[#fafafa] px-3 py-2 text-xs">{index === 0 ? "🍽 Food & Restaurants" : "🍷 Vin & Spiritueux"}</div>
                </div>
              </div>
            ))}

            {profiles.map((profile, index) => (
              <div key={index} className="rounded-2xl border border-black/[.06] bg-white p-3">
                <div className="grid grid-cols-[4.25rem_minmax(0,.72fr)_minmax(0,1.28fr)] items-start gap-2.5">
                  <EmptyAvatar profile={profile} index={index} onChange={(profileIndex, image) => updateProfile(profileIndex, { image })} onRemove={(profileIndex) => updateProfile(profileIndex, { image: undefined })} />
                  <label className="block min-w-0"><span className="sr-only">Nom du profil</span><input value={profile.name} onChange={(event) => updateProfile(index, { name: event.target.value })} maxLength={30} className="w-full rounded-xl border border-black/[.07] bg-[#fafafa] px-3 py-2.5 text-xs font-semibold outline-none transition focus:border-moss/40" /></label>
                  <label className="block min-w-0"><span className="sr-only">Un seul thème</span><select value={profile.theme} onChange={(event) => updateProfile(index, { theme: event.target.value })} className="w-full rounded-xl border border-black/[.07] bg-[#fafafa] px-3 py-2.5 text-xs outline-none transition focus:border-moss/40"><option value="">Choisir un thème</option>{themes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}</select></label>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="mx-auto mt-5 block w-full max-w-xs rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-black">Valider</button>

          <div className="mt-5 rounded-2xl bg-[#dfe9e2] p-5">
            <div className="flex items-center gap-2 text-moss"><Brain size={17} /><strong className="text-sm">Votre Agent IA apprend à vous connaître</strong></div>
            <p className="mt-2 text-xs leading-5 text-ink/55">Chaque profil mémorise vos recherches, vos préférences et vos habitudes.</p>
            <p className="mt-2 text-xs leading-5 text-ink/55">Plus vous utilisez votre agent IA, plus il comprend vos envies et vous recommande automatiquement les meilleures adresses, événements, voyages, restaurants et services correspondant à votre profil.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-semibold text-moss"><span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1"><Brain size={10} /> Mémoire indépendante</span><span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1"><Sparkles size={10} /> Recommandations</span><span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1"><Bell size={10} /> Notifications</span></div>
          </div>
        </div>
      </EntityDrawer>

      <EntityDrawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? "Agent IA"}>
        {selected && <div><div className="relative h-64 overflow-hidden bg-[#e7eee9]"><img src={selected.image} alt="" className="size-full object-contain" /></div><div className="p-6 sm:p-8"><span className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-moss"><Sparkles size={11} /> Profil intelligent</span><h2 className="mt-5 text-3xl font-semibold tracking-[-.045em]">{selected.name}</h2><p className="mt-3 text-sm leading-6 text-ink/55">{selected.text}</p>{selected.id === "favoris" ? <div className="mt-8 rounded-2xl bg-white p-6 text-center"><Heart className="mx-auto text-[#b05a5a]" size={25} /><p className="mt-3 text-sm font-semibold">Vos coups de cœur apparaîtront ici.</p></div> : <div className="mt-8"><div className="rounded-2xl bg-white p-4 text-sm leading-6 text-ink/55">Bonjour, je suis {selected.name}. Dites-moi ce que vous recherchez aujourd'hui.</div><div className="mt-3 flex items-center rounded-2xl border border-black/[.08] bg-white p-2"><Search size={16} className="ml-2 text-ink/25" /><input placeholder={selected.id === "batata" ? "Une envie resto…" : "Que recherchez-vous ?"} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none" /><button className="grid size-10 place-items-center rounded-xl bg-ink text-white"><Send size={15} /></button></div></div>}</div></div>}
      </EntityDrawer>
    </section>
  );
}
