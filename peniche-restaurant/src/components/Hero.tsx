import { ArrowDown, Sparkles, MapPin } from 'lucide-react';

interface HeroProps {
  onOpenReservation: () => void;
}

export const Hero = ({ onOpenReservation }: HeroProps) => {
  const scrollToMenu = () => {
    const el = document.getElementById('carte');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background imagery with dark moody night river styling */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85"
          alt="Paris Seine de nuit"
          className="w-full h-full object-cover object-center brightness-[0.22] contrast-[1.1] scale-105 transform duration-1000 ease-out"
        />
        {/* Dark luxury gradients and vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080B] via-[#07080B]/65 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#07080B]/70 to-[#07080B]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07080B] to-transparent" />
      </div>

      {/* Subtle floating gold lights / luminous reflections */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gold-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[250px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Location & Status Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-gold-500/30 bg-obsidian-900/80 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(212,175,55,0.12)]">
          <MapPin className="w-3.5 h-3.5 text-gold-400" />
          <span className="text-[11px] font-medium tracking-[0.25em] text-gold-200 uppercase">
            Port de Debilly • Face à la Tour Eiffel
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Crest Subtitle */}
        <div className="flex items-center gap-4 text-gold-400/80 mb-3">
          <div className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-gold-400" />
          <div className="flex items-center gap-1.5 text-xs sm:text-sm tracking-[0.4em] uppercase font-cinzel text-gold-300">
            <Sparkles className="w-3.5 h-3.5 text-gold-400 inline" />
            Haute Gastronomie au Fil de l'Eau
            <Sparkles className="w-3.5 h-3.5 text-gold-400 inline" />
          </div>
          <div className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent via-gold-500/50 to-gold-400" />
        </div>

        {/* Main Title */}
        <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-normal tracking-tight text-white mb-6 drop-shadow-2xl">
          L'Écrin <span className="italic font-light text-gold-gradient">d'O</span>
        </h1>

        {/* Baseline text */}
        <p className="max-w-2xl text-slate-300 text-base sm:text-lg md:text-xl font-light leading-relaxed mb-10 tracking-wide">
          Une halte intemporelle sur la Seine où s’entremêlent l’élégance de la haute cuisine française, 
          les lumières tamisées du fleuve et le scintillement majestueux de la Dame de Fer.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto mb-14">
          <button
            onClick={onOpenReservation}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-obsidian-950 font-semibold text-xs sm:text-sm tracking-[0.2em] uppercase hover:brightness-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            <span>Réserver Votre Table</span>
            <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <button
            onClick={scrollToMenu}
            className="w-full sm:w-auto px-8 py-4 rounded-full border border-gold-500/40 bg-obsidian-900/60 backdrop-blur-md text-gold-200 hover:text-white hover:border-gold-300 text-xs sm:text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            Découvrir la Carte
          </button>
        </div>

        {/* Floating Key Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 w-full max-w-3xl pt-8 border-t border-white/10 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-serif text-gold-300 font-semibold mb-1">
              360° Panoramique
            </span>
            <span className="text-xs text-slate-400 tracking-wider uppercase">
              Verrière face Tour Eiffel
            </span>
          </div>
          <div className="flex flex-col items-center border-y sm:border-y-0 sm:border-x border-white/10 py-3 sm:py-0">
            <span className="text-xl sm:text-2xl font-serif text-gold-300 font-semibold mb-1">
              Haute Table
            </span>
            <span className="text-xs text-slate-400 tracking-wider uppercase">
              Produits nobles & de saison
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-2xl font-serif text-gold-300 font-semibold mb-1">
              400+ Références
            </span>
            <span className="text-xs text-slate-400 tracking-wider uppercase">
              Grands Crus & Champagnes
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Indicator */}
      <button
        onClick={scrollToMenu}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-gold-400/60 hover:text-gold-300 transition-colors group cursor-pointer"
        aria-label="Faire défiler"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Défiler</span>
        <ArrowDown className="w-4 h-4 animate-bounce group-hover:text-gold-400" />
      </button>
    </section>
  );
};
