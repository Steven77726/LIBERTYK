import { useState } from 'react';
import { RESTAURANT_INFO, TESTIMONIALS } from '../data/restaurantData';
import { Sparkles, Eye, ShieldCheck, Waves, Star, Quote } from 'lucide-react';

interface ExperienceProps {
  onOpenReservation: () => void;
}

export const Experience = ({ onOpenReservation }: ExperienceProps) => {
  const [selectedDeck, setSelectedDeck] = useState(RESTAURANT_INFO.decks[0].id);

  const deckImages: Record<string, string> = {
    'panoramique': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    'salon-prive': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80',
    'terrasse-eau': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
  };

  return (
    <section id="experience" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-[#07080B] via-[#0B0D13] to-[#07080B] overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-gold-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-10 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400 mb-3">
            <Waves className="w-3.5 h-3.5" />
            L'Expérience Flottante
            <Waves className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-white font-normal mb-6">
            Une table suspendue sur les reflets de Paris
          </h2>
          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-6" />
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-light">
            Bordée d'acajou, de laiton brossé et de velours sombre, notre péniche d'exception vous convie à un tête-à-tête intime avec la Seine. Chaque service est rythmé par les monuments illuminés et la magie de la nuit parisienne.
          </p>
        </div>

        {/* The 3 Decks / Spaces Showcase */}
        <div id="salons" className="mb-24">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {RESTAURANT_INFO.decks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => setSelectedDeck(deck.id)}
                className={`px-5 py-3 rounded-full text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300 border ${
                  selectedDeck === deck.id
                    ? 'bg-gold-500 text-obsidian-950 border-gold-400 font-semibold shadow-[0_0_20px_rgba(212,175,55,0.35)]'
                    : 'bg-obsidian-900/80 text-slate-300 border-white/10 hover:border-gold-500/40 hover:text-gold-200'
                }`}
              >
                {deck.name}
              </button>
            ))}
          </div>

          {/* Active Deck Card */}
          {(() => {
            const currentDeck = RESTAURANT_INFO.decks.find((d) => d.id === selectedDeck) || RESTAURANT_INFO.decks[0];
            return (
              <div className="relative rounded-3xl overflow-hidden border border-gold-500/25 bg-obsidian-900/60 backdrop-blur-xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 items-center group">
                <div className="lg:col-span-7 h-[380px] sm:h-[480px] overflow-hidden relative">
                  <img
                    src={deckImages[currentDeck.id]}
                    alt={currentDeck.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-obsidian-900" />
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-obsidian-950/80 backdrop-blur-md border border-gold-500/40 text-gold-300 text-[11px] font-medium tracking-widest uppercase">
                    {currentDeck.tag}
                  </div>
                </div>

                <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-center">
                  <span className="text-xs uppercase tracking-[0.3em] text-gold-400/80 mb-2 font-cinzel">
                    Ambiance d'Exception
                  </span>
                  <h3 className="font-serif text-3xl sm:text-4xl text-white mb-4">
                    {currentDeck.name}
                  </h3>
                  <p className="text-slate-300 leading-relaxed text-sm sm:text-base font-light mb-8">
                    {currentDeck.description}
                  </p>

                  <div className="space-y-3 mb-8 text-xs text-slate-300">
                    <div className="flex items-center gap-3">
                      <Eye className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span>Panorama direct sur le Pont Alexandre III et la Tour Eiffel</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span>Service en gants blancs et sommellerie dédiée</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span>Atmosphère musicale feutrée lounge & jazz acoustique</span>
                    </div>
                  </div>

                  <button
                    onClick={onOpenReservation}
                    className="self-start px-6 py-3 rounded-full border border-gold-500 bg-gold-500/10 hover:bg-gold-500 text-gold-200 hover:text-obsidian-950 text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                  >
                    Réserver cet Espace
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Testimonials */}
        <div className="pt-12 border-t border-white/10">
          <div className="text-center mb-10">
            <span className="text-[11px] uppercase tracking-[0.3em] text-gold-400/80 font-cinzel">
              La Presse & La Critique
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 sm:p-8 bg-obsidian-900/40 border border-white/5 hover:border-gold-500/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-gold-400 mb-4">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-gold-400 text-gold-400" />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-gold-500/20 mb-2" />
                  <p className="text-slate-300 text-sm font-serif italic leading-relaxed mb-6">
                    "{item.quote}"
                  </p>
                </div>
                <div className="border-t border-white/5 pt-4">
                  <p className="font-serif text-white text-base">{item.author}</p>
                  <p className="text-xs text-gold-400/80 tracking-wider uppercase">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
