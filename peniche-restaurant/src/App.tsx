import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Experience } from './components/Experience';
import { MenuSection } from './components/MenuSection';
import { TastingMenuSection } from './components/TastingMenuSection';
import { AccessSection } from './components/AccessSection';
import { Footer } from './components/Footer';
import { ReservationModal } from './components/ReservationModal';
import type { MenuItem } from './data/restaurantData';

export function App() {
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [selectedDishes, setSelectedDishes] = useState<MenuItem[]>([]);
  const [tastingMenuPreference, setTastingMenuPreference] = useState<string>('');

  const toggleDishSelection = (dish: MenuItem) => {
    setSelectedDishes((prev) => {
      const exists = prev.some((d) => d.id === dish.id);
      if (exists) {
        return prev.filter((d) => d.id !== dish.id);
      } else {
        return [...prev, dish];
      }
    });
  };

  const handleOpenReservationWithMenu = (menuName: string) => {
    setTastingMenuPreference(menuName);
    setIsReservationOpen(true);
  };

  const handleOpenReservation = () => {
    setIsReservationOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-slate-100 selection:bg-gold-500/30 selection:text-gold-200">
      {/* Navigation */}
      <Navbar onOpenReservation={handleOpenReservation} />

      {/* Main Content */}
      <main>
        <Hero onOpenReservation={handleOpenReservation} />
        <Experience onOpenReservation={handleOpenReservation} />
        <MenuSection
          selectedDishes={selectedDishes}
          onToggleDishSelection={toggleDishSelection}
          onOpenReservation={handleOpenReservation}
        />
        <TastingMenuSection
          onOpenReservationWithMenu={handleOpenReservationWithMenu}
        />
        <AccessSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Concierge & Reservation Modal */}
      <ReservationModal
        isOpen={isReservationOpen}
        onClose={() => setIsReservationOpen(false)}
        selectedDishes={selectedDishes}
        initialMenuPreference={tastingMenuPreference}
      />
    </div>
  );
}

export default App;
