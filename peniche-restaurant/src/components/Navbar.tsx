import { useState, useEffect } from 'react';
import { Menu, X, Compass, CalendarCheck } from 'lucide-react';
import { AudioAmbience } from './AudioAmbience';

interface NavbarProps {
  onOpenReservation: () => void;
}

export const Navbar = ({ onOpenReservation }: NavbarProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: "L'Expérience", href: '#experience' },
    { label: 'La Carte', href: '#carte' },
    { label: 'Dégustation', href: '#degustation' },
    { label: 'Les Salons', href: '#salons' },
    { label: 'Accès & Quai', href: '#acces' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#08090C]/90 backdrop-blur-md border-b border-gold-500/20 py-3 shadow-2xl shadow-black/80'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Crest */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border border-gold-500/40 flex items-center justify-center bg-obsidian-900/80 group-hover:border-gold-400 group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] transition-all duration-300">
              <Compass className="w-5 h-5 text-gold-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.2em] text-white group-hover:text-gold-300 transition-colors">
                L'ÉCRIN D'O
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-gold-400/80 font-medium">
                Péniche Gastronomique • Paris
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-[0.2em] text-slate-300 hover:text-gold-300 transition-colors duration-200 relative py-1 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-px bg-gradient-to-r from-gold-400 to-gold-200 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right Actions: Audio Ambience + Reservation CTA */}
          <div className="hidden sm:flex items-center gap-4">
            <AudioAmbience />

            <button
              onClick={onOpenReservation}
              className="relative group overflow-hidden px-5 py-2.5 rounded-full border border-gold-500/50 bg-gradient-to-r from-gold-500/10 to-gold-600/20 text-gold-200 hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.35)] hover:border-gold-400"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-gold-500 to-gold-300 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em]">
                <CalendarCheck className="w-3.5 h-3.5 text-gold-400 group-hover:text-white transition-colors" />
                <span>Réserver une Table</span>
              </div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <AudioAmbience />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gold-400 hover:text-white border border-gold-500/20 rounded-lg bg-obsidian-900/60"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#08090C]/98 backdrop-blur-2xl flex flex-col pt-24 px-6 pb-10 justify-between lg:hidden animate-in fade-in duration-300">
          <div className="flex flex-col gap-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold-500/70 border-b border-white/10 pb-3">
              Navigation Prestige
            </p>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-2xl text-slate-200 hover:text-gold-300 transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-xs text-gold-500/40">✦</span>
              </a>
            ))}
          </div>

          <div className="pt-8 border-t border-gold-500/20 flex flex-col gap-4">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReservation();
              }}
              className="w-full py-4 rounded-xl border border-gold-500 bg-gold-500/20 text-gold-200 font-medium tracking-[0.2em] uppercase text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
            >
              <CalendarCheck className="w-4 h-4 text-gold-400" />
              Réserver une Table
            </button>
            <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest">
              Port de Debilly • Face à la Tour Eiffel
            </p>
          </div>
        </div>
      )}
    </>
  );
};
