# L'ÉCRIN D'O — Haute Gastronomie & Salons Flottants sur la Seine

Site web vitrine, sombre, immersif et d'une rare élégance pour la péniche restaurant de prestige **L'Écrin d'O**, amarrée au Port de Debilly face à la Tour Eiffel (Paris).

---

## ✨ Points Forts & Fonctionnalités

1. **Design & Esthétique "Dark Luxury & River Reflections"** :
   - Fond noir obsidienne profond (`#07080B`), touches d'or champagne brossé (`#D4AF37`) et reflets d'eau nocturnes.
   - Typographies éditoriales de prestige : *Cinzel*, *Cormorant Garamond* et *Montserrat*.
   - Ambiance sonore aquatique interactive intégrée (Web Audio API - clapotis de la Seine et notes lounge feutrées).

2. **Carte Gastronomique Complète & Dynamique** :
   - Catégories : Entrées Sublimes, Plats d'Auteur, Desserts Signatures, Grands Crus, Cocktails Signatures.
   - Filtres instantanés par préférences : *Signatures du Chef*, *Pêche Sauvage*, *Sans Gluten*, *Végétarien*.
   - Barre de recherche en temps réel par ingrédient (truffe, caviar, bar, homard, etc.).
   - Accords mets & vins recommandés par le Chef Sommelier pour chaque assiette.
   - Modale de visualisation avec détails culinaires et fiches d'inspiration.
   - Système de présélection ("wishlist") synchronisé automatiquement avec le module de réservation.

3. **Menus Dégustation en Plusieurs Temps** :
   - *Menu Sillage Nocturne* (5 services - 145 €)
   - *Menu Impérial de la Seine* (7 services - 195 €)
   - Frise chronologique des plats et flacons d'exception associés.

4. **Les 3 Salons & Ponts de la Péniche** :
   - Pont Supérieur Panoramique (vue 360° sur la Tour Eiffel scintillante).
   - Salon Privé d'Étrave (intimité acajou, cuir capitonné et dorures).
   - Terrasse Flottante Chauffée (au ras de l'eau avec braséros design).

5. **Conciergerie & Module de Réservation Interactif** :
   - Sélection du service (Déjeuner ou Dîner Lumières de Paris).
   - Choix du pont, de l'occasion spéciale et du menu.
   - Récapitulatif instantané avec célébration festive (confettis dorés).

---

## 🚀 Démarrage Rapide

### 1. Depuis le dossier du projet :
```bash
cd peniche-restaurant
npm install
npm run dev
```

Le site s'ouvre sur `http://localhost:5173`.

### 2. Depuis la racine du workspace :
```bash
npm run peniche:dev
```

### 3. Compilation pour la production :
```bash
npm run peniche:build
```
Les fichiers statiques optimisés sont générés dans le dossier `dist/`.

---

## 🛠️ Stack Technique

- **React 19 & TypeScript**
- **Vite 6** (chargement ultra-rapide et HMR instantané)
- **Tailwind CSS** (design system responsive sombre & doré)
- **Lucide Icons**
- **Canvas Confetti**
