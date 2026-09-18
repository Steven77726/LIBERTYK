import { Compass, ArrowUp } from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantData';

export const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050608] border-t border-gold-500/20 pt-16 pb-12 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/5">
          {/* Col 1: Brand & Identity */}
          <div className="md:col-span-4 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full border border-gold-500/40 flex items-center justify-center bg-obsidian-900">
                <Compass className="w-5 h-5 text-gold-400" />
              </div>
              <span className="font-cinzel text-xl text-white font-bold tracking-[0.2em]">
                {RESTAURANT_INFO.name}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-6 font-light">
              Haute table suspendue sur la Seine. Une expérience sensorielle inédite au croisement de la grande tradition culinaire et du romantisme parisien.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 hover:border-gold-500/50 flex items-center justify-center text-slate-300 hover:text-gold-300 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/10 hover:border-gold-500/50 flex items-center justify-center text-slate-300 hover:text-gold-300 transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.597 0 9 1.583 9 4.615V8z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Navigation rapide */}
          <div className="md:col-span-3">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-400 font-cinzel mb-4">
              L'Écrin d'O
            </p>
            <ul className="space-y-2.5">
              <li>
                <a href="#experience" className="hover:text-gold-300 transition-colors">
                  L'Expérience à Bord
                </a>
              </li>
              <li>
                <a href="#carte" className="hover:text-gold-300 transition-colors">
                  La Carte Gastronomique
                </a>
              </li>
              <li>
                <a href="#degustation" className="hover:text-gold-300 transition-colors">
                  Menus Sillage & Impérial
                </a>
              </li>
              <li>
                <a href="#salons" className="hover:text-gold-300 transition-colors">
                  Ponts & Salons d'Étrave
                </a>
              </li>
              <li>
                <a href="#acces" className="hover:text-gold-300 transition-colors">
                  Accès Port de Debilly
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Informations */}
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-[0.25em] text-gold-400 font-cinzel mb-4">
              Lettre d'Information Privée
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Recevez en avant-première nos ouvertures de réservations pour les soirées du 14 Juillet, de la Saint-Valentin et du Réveillon de la Saint-Sylvestre.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); alert("Merci. Vous recevrez nos invitations privées."); }} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Votre adresse email..."
                className="flex-1 px-4 py-2.5 rounded-full bg-obsidian-900 border border-white/10 text-white text-xs focus:outline-none focus:border-gold-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-gold-500 text-obsidian-950 font-semibold text-xs tracking-wider uppercase hover:bg-gold-400 transition-colors"
              >
                S'inscrire
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} {RESTAURANT_INFO.name}. Tous droits réservés. Haute Gastronomie & Salons Flottants.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Mentions Légales</span>
            <span className="hover:text-slate-400 cursor-pointer">Politique de Confidentialité</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 text-gold-400 hover:text-gold-300 transition-colors"
            >
              <span>Haut de page</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
