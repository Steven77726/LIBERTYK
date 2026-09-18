import { useState, useMemo } from 'react';
import { MENU_ITEMS } from '../data/restaurantData';
import type { MenuItem } from '../data/restaurantData';
import { Search, Wine, Sparkles, Utensils, Heart, Check, X, Info } from 'lucide-react';

interface MenuSectionProps {
  selectedDishes: MenuItem[];
  onToggleDishSelection: (dish: MenuItem) => void;
  onOpenReservation: () => void;
}

export const MenuSection = ({
  selectedDishes,
  onToggleDishSelection,
  onOpenReservation,
}: MenuSectionProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalDish, setModalDish] = useState<MenuItem | null>(null);

  const categories = [
    { id: 'all', label: 'Toute la Carte' },
    { id: 'entrees', label: 'Entrées Sublimes' },
    { id: 'plats', label: 'Plats d’Auteur' },
    { id: 'desserts', label: 'Desserts Signatures' },
    { id: 'vins', label: 'Grands Crus' },
    { id: 'cocktails', label: 'Cocktails d’Auteur' },
  ];

  const dietaryFilters = [
    { id: 'all', label: 'Tous' },
    { id: 'Signature du Chef', label: 'Signatures du Chef' },
    { id: 'Pêche Durable', label: 'Pêche Sauvage & Côtière' },
    { id: 'Sans Gluten', label: 'Sans Gluten' },
    { id: 'Végétarien', label: 'Végétarien' },
  ];

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.pairing && item.pairing.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesDiet = true;
      if (dietaryFilter !== 'all') {
        if (dietaryFilter === 'Signature du Chef') {
          matchesDiet = item.badge?.toLowerCase().includes('signature') ?? false;
        } else {
          matchesDiet = item.dietary?.includes(dietaryFilter) ?? false;
        }
      }

      return matchesCategory && matchesSearch && matchesDiet;
    });
  }, [activeCategory, dietaryFilter, searchQuery]);

  const isDishSelected = (id: string) => selectedDishes.some((d) => d.id === id);

  return (
    <section id="carte" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-[#07080B] scroll-mt-10">
      {/* Decorative ambient subtle lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      <div className="max-w-7xl mx-auto">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400 mb-3">
            <Utensils className="w-3.5 h-3.5" />
            La Carte Gastronomique
            <Utensils className="w-3.5 h-3.5" />
          </div>
          <h2 className="font-serif text-4xl sm:text-6xl text-white font-normal mb-5">
            Créations de Haute Cuisine
          </h2>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-5" />
          <p className="text-slate-300 text-sm sm:text-base font-light">
            Une symphonie d’ingrédients nobles, façonnés chaque jour selon les arrivages des côtes bretonnes et les plus beaux terroirs français.
          </p>
        </div>

        {/* Selected Dishes Banner (if any) */}
        {selectedDishes.length > 0 && (
          <div className="mb-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gold-500/15 via-obsidian-900/90 to-gold-500/15 border border-gold-500/40 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center border border-gold-400">
                <Heart className="w-5 h-5 text-gold-400 fill-gold-400" />
              </div>
              <div>
                <p className="text-sm font-serif text-white">
                  Votre sélection gourmande ({selectedDishes.length} plat{selectedDishes.length > 1 ? 's' : ''})
                </p>
                <p className="text-xs text-gold-300/80 font-light">
                  Vos choix seront attachés à votre demande de réservation.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenReservation}
              className="px-6 py-2.5 rounded-full bg-gold-500 text-obsidian-950 font-semibold text-xs tracking-wider uppercase hover:bg-gold-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]"
            >
              Finaliser avec ces Choix
            </button>
          </div>
        )}

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-full text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all duration-300 border ${
                  activeCategory === cat.id
                    ? 'bg-gold-500 text-obsidian-950 border-gold-400 font-semibold shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                    : 'bg-obsidian-900/70 text-slate-400 border-white/10 hover:border-gold-500/30 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gold-400/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un ingrédient, truffe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-obsidian-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dietary secondary pills */}
        <div className="flex flex-wrap items-center gap-2 mb-12">
          <span className="text-xs text-gold-400/70 font-cinzel mr-2">Filtre :</span>
          {dietaryFilters.map((df) => (
            <button
              key={df.id}
              onClick={() => setDietaryFilter(df.id)}
              className={`px-3 py-1 rounded-md text-[11px] font-light transition-all ${
                dietaryFilter === df.id
                  ? 'bg-gold-500/20 text-gold-200 border border-gold-500/50'
                  : 'bg-obsidian-900/40 text-slate-400 border border-white/5 hover:border-gold-500/20 hover:text-slate-200'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* Dishes Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 border border-white/5 rounded-2xl bg-obsidian-900/40">
            <Sparkles className="w-8 h-8 text-gold-500/40 mx-auto mb-3" />
            <p className="text-slate-300 font-serif text-lg">Aucun plat ne correspond à vos critères.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setDietaryFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-full border border-gold-500/30 text-xs text-gold-300 hover:bg-gold-500/10"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((dish) => {
              const selected = isDishSelected(dish.id);
              return (
                <div
                  key={dish.id}
                  className={`group rounded-2xl overflow-hidden bg-obsidian-900/50 border transition-all duration-500 flex flex-col justify-between hover:-translate-y-1 ${
                    dish.highlight
                      ? 'border-gold-500/40 shadow-[0_0_25px_rgba(212,175,55,0.08)]'
                      : 'border-white/10 hover:border-gold-500/30'
                  }`}
                >
                  <div>
                    {/* Dish Image Container */}
                    <div className="relative h-56 overflow-hidden bg-obsidian-950">
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-transparent to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        {dish.badge ? (
                          <span className="px-3 py-1 rounded-full bg-obsidian-950/90 backdrop-blur-md border border-gold-500/50 text-gold-300 text-[10px] font-semibold tracking-wider uppercase">
                            {dish.badge}
                          </span>
                        ) : <span />}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleDishSelection(dish);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            selected
                              ? 'bg-gold-500 text-obsidian-950 shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                              : 'bg-obsidian-950/70 text-slate-400 hover:text-gold-300 hover:bg-obsidian-950'
                          }`}
                          title={selected ? 'Retirer de ma sélection' : 'Pré-sélectionner ce plat'}
                        >
                          {selected ? <Check className="w-4 h-4 stroke-[3]" /> : <Heart className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Price Pill */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-obsidian-950/90 backdrop-blur-md border border-gold-500/30">
                        <span className="text-gold-300 font-serif font-semibold text-lg">
                          {dish.price} €
                        </span>
                      </div>
                    </div>

                    {/* Dish Details */}
                    <div className="p-6">
                      {dish.subtitle && (
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gold-400/90 font-medium mb-1 font-cinzel">
                          {dish.subtitle}
                        </p>
                      )}

                      <h3 className="font-serif text-xl sm:text-2xl text-white font-medium mb-3 group-hover:text-gold-200 transition-colors">
                        {dish.name}
                      </h3>

                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light mb-4 line-clamp-3">
                        {dish.description}
                      </p>

                      {/* Dietary Pills */}
                      {dish.dietary && dish.dietary.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {dish.dietary.map((d, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[10px] tracking-wider uppercase"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer of Card: Pairing + Quick View */}
                  <div className="p-6 pt-0 border-t border-white/5 flex flex-col gap-3">
                    {dish.pairing && (
                      <div className="flex items-start gap-2 text-xs text-gold-300/80 bg-gold-500/5 p-2.5 rounded-lg border border-gold-500/10">
                        <Wine className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
                        <span className="italic font-serif">Accord conseillé : {dish.pairing}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => setModalDish(dish)}
                        className="text-xs text-slate-400 hover:text-gold-300 inline-flex items-center gap-1 transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        Détails & Inspiration
                      </button>

                      <button
                        onClick={() => onToggleDishSelection(dish)}
                        className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                          selected ? 'text-gold-400' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {selected ? 'Sélectionné ✓' : '+ Choisir'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Dish Details */}
      {modalDish && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-xl w-full rounded-3xl overflow-hidden bg-obsidian-900 border border-gold-500/40 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setModalDish(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-obsidian-950/80 border border-white/20 text-white hover:text-gold-400 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-64 sm:h-72 overflow-hidden relative">
              <img
                src={modalDish.image}
                alt={modalDish.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-900 via-transparent to-transparent" />
              {modalDish.badge && (
                <div className="absolute bottom-4 left-6 px-3 py-1 rounded-full bg-obsidian-950/90 border border-gold-500/40 text-gold-300 text-xs font-semibold tracking-wider uppercase">
                  {modalDish.badge}
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-cinzel">
                  {modalDish.subtitle || 'Haute Gastronomie'}
                </span>
                <span className="font-serif text-2xl text-gold-300 font-semibold">
                  {modalDish.price} €
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal mb-4">
                {modalDish.name}
              </h3>

              <p className="text-slate-300 text-sm leading-relaxed mb-6 font-light">
                {modalDish.description}
              </p>

              {modalDish.pairing && (
                <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/20 mb-6 flex items-center gap-3">
                  <Wine className="w-5 h-5 text-gold-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gold-300 uppercase tracking-wider font-cinzel">
                      Accord Vigneron Conseillé
                    </p>
                    <p className="text-sm font-serif text-white italic">
                      {modalDish.pairing}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => {
                    onToggleDishSelection(modalDish);
                    setModalDish(null);
                  }}
                  className={`flex-1 py-3 rounded-full text-xs uppercase tracking-widest font-semibold transition-all ${
                    isDishSelected(modalDish.id)
                      ? 'bg-rose-950 text-rose-200 border border-rose-700'
                      : 'bg-gold-500 hover:bg-gold-400 text-obsidian-950'
                  }`}
                >
                  {isDishSelected(modalDish.id) ? 'Retirer de mes souhaits' : 'Ajouter à mes souhaits'}
                </button>

                <button
                  onClick={() => {
                    setModalDish(null);
                    onOpenReservation();
                  }}
                  className="px-6 py-3 rounded-full border border-gold-500/40 text-gold-200 hover:text-white text-xs uppercase tracking-widest hover:border-gold-300"
                >
                  Réserver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
