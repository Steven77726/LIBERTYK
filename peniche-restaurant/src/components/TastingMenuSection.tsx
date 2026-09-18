import { useState } from 'react';
import { TASTING_MENUS } from '../data/restaurantData';
import { Wine, Sparkles, Award } from 'lucide-react';

interface TastingMenuProps {
  onOpenReservationWithMenu: (menuName: string) => void;
}

export const TastingMenuSection = ({ onOpenReservationWithMenu }: TastingMenuProps) => {
  const [activeMenuIndex, setActiveMenuIndex] = useState(0);
  const currentMenu = TASTING_MENUS[activeMenuIndex];

  return (
    <section id="degustation" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[#090B0F] overflow-hidden">
      {/* Subtle gold lines & backdrop glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold-400/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400 mb-3">
            <Award className="w-3.5 h-3.5" />
            Les Menus Dégustation
            <Award className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-serif text-4xl sm:text-6xl text-white font-normal mb-5">
            Odyssées Culinaires au Long Cours
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-5" />
          <p className="text-slate-300 text-sm sm:text-base font-light">
            Une succession d’accords raffinés pensée comme un voyage nocturne sur la Seine, sublimée par notre Chef Sommelier.
          </p>
        </div>

        {/* Menu Selectors */}
        <div className="flex justify-center gap-4 mb-12">
          {TASTING_MENUS.map((menu, idx) => (
            <button
              key={menu.id}
              onClick={() => setActiveMenuIndex(idx)}
              className={`px-6 py-3.5 rounded-full text-xs font-medium tracking-[0.2em] uppercase transition-all duration-300 border flex items-center gap-2 ${
                activeMenuIndex === idx
                  ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-obsidian-950 font-bold border-gold-400 shadow-[0_0_25px_rgba(212,175,55,0.35)]'
                  : 'bg-obsidian-900/90 text-slate-300 border-white/10 hover:border-gold-500/40 hover:text-white'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeMenuIndex === idx ? 'text-obsidian-950' : 'text-gold-400'}`} />
              <span>{menu.name}</span>
              <span className="opacity-70">({menu.courses} Temps)</span>
            </button>
          ))}
        </div>

        {/* Active Tasting Menu Detailed Display */}
        <div className="relative rounded-3xl border border-gold-500/30 bg-gradient-to-b from-obsidian-900/90 via-obsidian-950 to-obsidian-900/95 p-8 sm:p-14 backdrop-blur-2xl shadow-2xl">
          {/* Header of the Card */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gold-500/20 pb-8 mb-10 gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-cinzel">
                Menu Signature en {currentMenu.courses} Services
              </span>
              <h3 className="font-serif text-3xl sm:text-5xl text-white font-normal mt-2 mb-2">
                {currentMenu.name}
              </h3>
              <p className="text-slate-300 text-sm font-light max-w-xl">
                {currentMenu.description}
              </p>
            </div>

            <div className="text-right flex flex-col items-start md:items-end bg-obsidian-900/60 p-4 rounded-2xl border border-gold-500/20">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-4xl sm:text-5xl font-bold text-gold-300">
                  {currentMenu.price} €
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-widest font-light">
                  / convive
                </span>
              </div>
              {currentMenu.winePairingPrice && (
                <div className="flex items-center gap-1.5 text-xs text-gold-400 mt-1">
                  <Wine className="w-3.5 h-3.5" />
                  <span>Accord Mets & Vins Rares : +{currentMenu.winePairingPrice} €</span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline of courses */}
          <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-2 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-gold-400 before:via-gold-500/30 before:to-transparent">
            {currentMenu.steps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Node dot */}
                <div className="absolute -left-6 sm:-left-10 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-gold-400 bg-obsidian-950 flex items-center justify-center group-hover:bg-gold-400 transition-colors shadow-[0_0_10px_rgba(212,175,55,0.5)]" />

                <div className="bg-obsidian-900/40 border border-white/5 group-hover:border-gold-500/25 p-5 rounded-2xl transition-all duration-300">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-gold-400 font-cinzel">
                    {step.courseName}
                  </span>
                  <h4 className="font-serif text-lg sm:text-xl text-white font-medium mt-1 mb-2">
                    {step.dish}
                  </h4>
                  {step.wine && (
                    <div className="flex items-center gap-2 text-xs text-gold-300/80 italic font-serif pt-1 border-t border-white/5">
                      <Wine className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                      <span>Flacon associé : {step.wine}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Action */}
          <div className="mt-12 pt-8 border-t border-gold-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs text-slate-400 italic">
              * Ce menu est servi pour l'ensemble des convives de la table afin de garantir une harmonie de service.
            </p>

            <button
              onClick={() => onOpenReservationWithMenu(currentMenu.name)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-semibold text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_25px_rgba(212,175,55,0.35)]"
            >
              Réserver ce Menu ({currentMenu.name})
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
