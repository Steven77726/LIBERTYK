import { MapPin, Phone, Mail, Clock, Car, Navigation, Shield } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantData';

export const AccessSection = () => {
  return (
    <section id="acces" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-b from-[#090B0F] via-[#07080B] to-[#050608]">
      <div className="max-w-7xl mx-auto">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400 mb-3 font-cinzel">
            <Navigation className="w-3.5 h-3.5" />
            Amarrage & Accès Privé
          </div>
          <h2 className="font-serif text-4xl sm:text-6xl text-white font-normal mb-5">
            L'Escale Parisienne
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-5" />
          <p className="text-slate-300 text-sm sm:text-base font-light">
            Une situation unique sur la rive droite, amarrée au Port de Debilly face au Trocadéro et à la Tour Eiffel.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left card: Access info */}
          <div className="lg:col-span-5 rounded-3xl bg-obsidian-900/60 border border-gold-500/25 p-8 sm:p-10 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold-400 font-cinzel">
                Informations & Accueil
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-white mt-1 mb-6">
                Le Quai de l'Écrin
              </h3>

              <div className="space-y-6 text-sm text-slate-300">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{RESTAURANT_INFO.address}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{RESTAURANT_INFO.metro}</p>
                    <p className="text-[11px] text-gold-400/80 font-mono mt-1">Coordonnées GPS : 48.8606° N, 2.2976° E</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Car className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Service Voiturier Dédié</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Accueil personnalisé de vos véhicules dès l'entrée du Port de Debilly avec prise en charge sécurisée.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Horaires des Services</p>
                    <div className="text-xs text-slate-400 mt-1 space-y-1">
                      {RESTAURANT_INFO.services.map((s, i) => (
                        <p key={i}><span className="text-gold-200">{s.title} :</span> {s.hours}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Code Vestimentaire & Éthique</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tenue élégante requise. La direction se réserve le droit d’entrée pour préserver la quiétude du lieu.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4">
              <a
                href={`tel:${RESTAURANT_INFO.phone}`}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-full border border-gold-500/40 text-xs uppercase tracking-wider text-gold-200 hover:bg-gold-500/10 hover:border-gold-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-gold-400" />
                {RESTAURANT_INFO.phone}
              </a>
              <a
                href={`mailto:${RESTAURANT_INFO.email}`}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-full border border-white/10 text-xs uppercase tracking-wider text-slate-300 hover:text-white hover:border-white/30 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Conciergerie
              </a>
            </div>
          </div>

          {/* Right card: Map & Visual Presentation */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-gold-500/25 relative min-h-[420px] group shadow-2xl flex flex-col justify-end p-8 sm:p-12">
            <img
              src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80"
              alt="Vue nocturne Tour Eiffel Seine"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.35] contrast-110 group-hover:scale-105 transition-transform duration-1000 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/60 to-transparent" />

            <div className="relative z-10 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-500/50 text-gold-300 text-[10px] tracking-widest uppercase mb-4">
                Privatisation Totale ou Partielle
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl text-white font-normal mb-4">
                Votre Événement Privé Flottant
              </h3>
              <p className="text-slate-300 text-sm font-light leading-relaxed mb-6">
                Pour vos soirées d’entreprise de prestige, lancements de collections, mariages ou dîners confidentiels, privatisez la péniche entière avec formule gastronomique sur-mesure et navigation privatisée.
              </p>
              <a
                href={`mailto:${RESTAURANT_INFO.email}?subject=Demande%20de%20Privatisation%20L'Ecrin%20d'O`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                Demander une Privatisation
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
