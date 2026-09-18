import React, { useState } from 'react';
import { X, Calendar, Users, Clock, Compass, CheckCircle2, Heart } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantData';
import type { MenuItem } from '../data/restaurantData';
import confetti from 'canvas-confetti';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDishes: MenuItem[];
  initialMenuPreference?: string;
}

export const ReservationModal = ({
  isOpen,
  onClose,
  selectedDishes,
  initialMenuPreference,
}: ReservationModalProps) => {
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Form state
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('20:00');
  const [guests, setGuests] = useState('2');
  const [deck, setDeck] = useState(RESTAURANT_INFO.decks[0].name);
  const [occasion, setOccasion] = useState('Dîner Romantique');
  const [tastingMenu, setTastingMenu] = useState(initialMenuPreference || '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');

    // Launch celebratory champagne gold confetti
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#FFF0D0', '#A88424', '#F3E5AB'],
      });
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setStep('form');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-gradient-to-b from-obsidian-900 via-obsidian-950 to-obsidian-900 border border-gold-500/40 p-6 sm:p-10 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-obsidian-950/80 border border-white/10 text-slate-300 hover:text-gold-300 hover:border-gold-500/40 flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-gold-400 mb-2">
                <Compass className="w-3.5 h-3.5" />
                Service Conciergerie Privée
              </div>
              <h3 className="font-serif text-3xl sm:text-4xl text-white font-normal">
                Réserver une Table d'Exception
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-light">
                {RESTAURANT_INFO.name} • {RESTAURANT_INFO.address}
              </p>
            </div>

            {/* Selected dishes recap (if any) */}
            {selectedDishes.length > 0 && (
              <div className="mb-6 p-3.5 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center gap-3">
                <Heart className="w-4 h-4 text-gold-400 fill-gold-400 flex-shrink-0" />
                <p className="text-xs text-gold-200">
                  <span className="font-semibold">{selectedDishes.length} plat{selectedDishes.length > 1 ? 's' : ''} pré-sélectionné{selectedDishes.length > 1 ? 's' : ''} :</span>{' '}
                  {selectedDishes.map((d) => d.name).join(', ')}
                </p>
              </div>
            )}

            <div className="space-y-5 text-left">
              {/* Row 1: Date, Guests, Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gold-400 inline mr-1" />
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-gold-400 inline mr-1" />
                    Convives
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} personne{num > 1 ? 's' : ''}
                      </option>
                    ))}
                    <option value="12+">Table Prestige (12+ personnes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-gold-400 inline mr-1" />
                    Heure
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                  >
                    <optgroup label="Dîner Lumières (Soir)">
                      <option value="19:30">19h30 — Premier Service</option>
                      <option value="20:00">20h00 — Ambiance Scintillante</option>
                      <option value="20:30">20h30 — Dîner Croisière</option>
                      <option value="21:00">21h00 — Nocturne Paris</option>
                      <option value="21:30">21h30 — Escale Tardive</option>
                    </optgroup>
                    <optgroup label="Déjeuner au Fil de l'Eau (Midi)">
                      <option value="12:00">12h00 — Déjeuner Panoramique</option>
                      <option value="12:30">12h30 — Plein Jour</option>
                      <option value="13:00">13h00 — Écrin d'O</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Row 2: Deck Preference & Occasion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                    Emplacement Souhaité
                  </label>
                  <select
                    value={deck}
                    onChange={(e) => setDeck(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                  >
                    {RESTAURANT_INFO.decks.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.tag})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                    Occasion Spéciale
                  </label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                  >
                    <option value="Dîner Romantique">Dîner Romantique / En Amoureux</option>
                    <option value="Anniversaire">Anniversaire & Célébration</option>
                    <option value="Repas d'Affaires VIP">Repas d'Affaires / VIP</option>
                    <option value="Demande en Mariage">Demande en Mariage</option>
                    <option value="Découverte Gastronomique">Dégustation Gastronomique</option>
                  </select>
                </div>
              </div>

              {/* Menu preference if any */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                  Formule Gourmande Envisagée
                </label>
                <select
                  value={tastingMenu}
                  onChange={(e) => setTastingMenu(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                >
                  <option value="">Choix libre sur place (À la carte)</option>
                  <option value="Menu Sillage Nocturne (5 temps - 145€)">
                    Menu Sillage Nocturne (5 temps — 145 €)
                  </option>
                  <option value="Menu Impérial de la Seine (7 temps - 195€)">
                    Menu Impérial de la Seine (7 temps — 195 €)
                  </option>
                </select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                    Nom & Prénom
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Alexandre de Montmirail"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+33 6 12 34 56 78"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                  Adresse Email pour confirmation
                </label>
                <input
                  type="email"
                  required
                  placeholder="contact@domaine.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-300 mb-1 font-medium">
                  Demandes Particulières, Allergies ou Table Souhaitée
                </label>
                <textarea
                  rows={2}
                  placeholder="Allergies, table au plus près de la baie vitrée, champagne d'accueil..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full mt-2 py-4 rounded-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 text-obsidian-950 font-bold text-xs uppercase tracking-[0.2em] hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all"
              >
                Confirmer ma Demande de Réservation
              </button>

              <p className="text-center text-[10px] text-slate-500 italic">
                Tenue élégante exigée • Service voiturier gracieux disponible au Port de Debilly.
              </p>
            </div>
          </form>
        ) : (
          /* Success Screen */
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-400 flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(212,175,55,0.4)]">
              <CheckCircle2 className="w-8 h-8 text-gold-400" />
            </div>

            <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-cinzel">
              Demande Enregistrée
            </span>
            <h3 className="font-serif text-3xl sm:text-4xl text-white font-normal mt-2 mb-4">
              Votre Escale au Cœur de Paris est Préparée
            </h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto mb-8 font-light leading-relaxed">
              Monsieur/Madame <span className="text-gold-200 font-medium">{fullName}</span>, notre maître d’hôtel prend en compte vos préférences pour le{' '}
              <span className="text-gold-200 font-medium">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span> à{' '}
              <span className="text-gold-200 font-medium">{time}</span> pour <span className="text-gold-200 font-medium">{guests} convive(s)</span>.
            </p>

            {/* Receipt / Booking Card */}
            <div className="p-6 rounded-2xl bg-obsidian-900/80 border border-gold-500/30 text-left max-w-md mx-auto mb-8 space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Emplacement :</span>
                <span className="text-white font-serif">{deck}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Occasion :</span>
                <span className="text-white">{occasion}</span>
              </div>
              {tastingMenu && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-400">Formule :</span>
                  <span className="text-gold-300">{tastingMenu}</span>
                </div>
              )}
              {selectedDishes.length > 0 && (
                <div className="border-b border-white/5 pb-2">
                  <span className="text-slate-400 block mb-1">Sélection de plats :</span>
                  <span className="text-slate-200 italic">{selectedDishes.map((d) => d.name).join(' • ')}</span>
                </div>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Contact :</span>
                <span className="text-slate-200">{phone}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={handleReset}
                className="px-8 py-3 rounded-full bg-gold-500 text-obsidian-950 font-semibold text-xs tracking-wider uppercase hover:bg-gold-400 transition-colors"
              >
                Retourner à la Navigation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
