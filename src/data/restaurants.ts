import { normalizeRestaurantRow } from "@/lib/restaurant-import";

const importedRows = [
  // PARIS INTRA-MUROS (1er au 20e)
  ["Khan", "124 Avenue de Villiers, Paris", "75017", 17, "01 42 27 18 19", "Grill, viande grillée, déjeuner, dîner", "Israélien, Marocain", "Viande", "Beth Din de Paris", 4.9, 412, 48.8835, 2.3015, "12:00–15:00, 19:30–23:00"],
  ["Kavod", "26 Rue Jean Mermoz, Paris", "75008", 8, "01 42 25 65 26", "Gastronomique, Viande maturée", "Français", "Viande", "Beth Din de Paris", 4.8, 380, 48.8705, 2.3101, "12:00–14:30, 19:30–23:00"],
  ["Chez Isaac", "52 Rue Volta, Paris", "75003", 3, "01 42 71 19 09", "Cuisine israélienne", "Israélien", "Viande", "Beth Din de Paris", 4.7, 290, 48.8652, 2.3589, "12:00–15:00, 19:00–22:30"],
  ["L'As du Fallafel", "34 Rue des Rosiers, Paris", "75004", 4, "01 48 87 63 60", "Falafel, Shawarma, Pita", "Israélien", "Viande", "Beth Din de Paris", 4.6, 14500, 48.8574, 2.3592, "11:00–23:00"],
  ["Pâtisserie Korcarz", "29 Rue des Rosiers, Paris", "75004", 4, "01 42 77 39 43", "Pâtisserie d'Europe de l'Est, Bagel", "Ashkénaze", "Parvé", "Beth Din de Paris", 4.7, 750, 48.8576, 2.3595, "08:00–19:30"],
  ["Maison Sacha Finkelsztajn", "27 Rue des Rosiers, Paris", "75004", 4, "01 42 72 78 91", "Boulangerie yiddish, Vatrouchka", "Ashkénaze", "Parvé", "Beth Din de Paris", 4.6, 1200, 48.8577, 2.3594, "10:00–19:00"],
  ["Marceau Café", "66 Rue de Vaugirard, Paris", "75006", 6, "01 45 48 32 14", "Café, Brunch, Viennoiseries", "Français", "Lait", "Beth Din de Paris", 4.8, 340, 48.8488, 2.3305, "08:30–18:30"],
  ["Douieb", "11 bis Rue Geoffroy-Marie, Paris", "75009", 9, "01 47 70 86 09", "Sandwicherie tunisienne, Casse-croûte", "Tunisien", "Viande", "Beth Din de Paris", 4.7, 480, 48.8741, 2.3442, "11:30–15:30, 18:30–21:30"],
  ["Novela", "8 Boulevard de Magenta, Paris", "75010", 10, "01 40 05 54 83", "Cuisine israélienne, Pita", "Israélien", "Viande", "Beth Din de Paris", 4.6, 210, 48.8702, 2.3608, "11:30–15:00, 18:30–22:30"],
  ["La Mina", "45 Rue de Montreuil, Paris", "75011", 11, "01 73 71 47 15", "Cuisine israélienne, Grillades", "Israélien, Marocain", "Viande", "Beth Din de Paris", 4.7, 340, 48.8512, 2.3882, "12:00–15:00, 19:30–23:00"],
  ["Bloomy Brunch", "189 Rue de Charonne, Paris", "75011", 11, "01 43 70 88 99", "Brunch, Avocado toast, Poke bowl", "Américain", "Lait", "Beth Din de Paris", 4.9, 380, 48.8569, 2.3912, "09:30–17:00"],
  ["Chez René et Gabin", "232 Boulevard Voltaire, Paris", "75011", 11, "01 43 73 60 76", "Casse-croûte tunisien, Fricassé", "Tunisien", "Viande", "Beth Din de Paris", 4.7, 890, 48.8529, 2.3921, "11:00–23:30"],
  ["Tikoun Olam", "136 Avenue Daumesnil, Paris", "75012", 12, "01 43 43 04 22", "Gastronomique, Viande maturée", "Français", "Viande", "Beth Din de Paris", 4.8, 260, 48.8415, 2.3892, "12:00–15:00, 19:30–23:00"],
  ["Chlew", "66 Avenue Victor Hugo, Paris", "75116", 16, "01 75 43 99 99", "Sandwicherie, Charcuterie fine", "Ashkénaze, Français", "Viande", "Beth Din de Paris", 4.7, 520, 48.8698, 2.2842, "11:30–23:00"],
  ["Sushi West", "147 Rue de la Pompe, Paris", "75116", 16, "01 45 53 11 11", "Sushi, Maki, Chirashi, Poke bowl", "Japonais", "Parvé", "Beth Din de Paris", 4.6, 450, 48.8681, 2.2789, "11:30–15:00, 18:30–23:00"],
  ["Benson Kfé", "261 Boulevard Pereire, Paris", "75017", 17, "01 45 74 60 52", "Française, Américaine, Burgers", "Français, Américain", "Viande", "Beth Din de Paris", 4.6, 430, 48.8821, 2.2965, "12:00–15:00, 19:30–23:00"],
  ["Chez Franck", "46 Rue Bayen, Paris", "75017", 17, "01 45 72 11 74", "Cuisine française, Grillades", "Français", "Viande", "Beth Din de Paris", 4.7, 310, 48.8812, 2.2934, "12:00–15:00, 19:30–23:00"],
  ["Restaurant Doron Niel", "73 Avenue Niel, Paris", "75017", 17, "01 44 40 28 15", "Grillades, Brochettes, Pita", "Israélien", "Viande", "Beth Din de Paris", 4.6, 390, 48.8841, 2.2982, "12:00–15:00, 19:30–23:00"],
  ["Flavio", "11 Rue Cardinet, Paris", "75017", 17, "01 45 74 68 11", "Italien, Pizzas au feu de bois, Pâtes", "Italien", "Lait", "Beth Din de Paris", 4.8, 450, 48.8856, 2.3082, "11:30–15:00, 18:30–23:00"],
  ["Gabrielli", "12 Rue d'Héliopolis, Paris", "75017", 17, "01 44 09 00 08", "Italien, Grillades, Risotto", "Italien", "Viande", "Beth Din de Paris", 4.7, 380, 48.8849, 2.2995, "12:00–15:00, 19:30–23:00"],
  ["Gilda Paris 17", "78 Avenue des Ternes, Paris", "75017", 17, "01 53 43 07 48", "Orientale, Tunisienne, Grillades", "Marocain, Tunisien", "Viande", "Beth Din de Paris", 4.6, 290, 48.8789, 2.2891, "12:00–15:00, 19:30–23:00"],
  ["Maison Gabriel", "124 Avenue de Villiers, Paris", "75017", 17, "09 81 11 86 85", "Gastronomique française", "Français", "Viande", "Beth Din de Paris", 4.9, 490, 48.8837, 2.3018, "12:00–15:00, 19:30–23:30"],
  ["La Fille du Boucher", "20 Rue Cardinet, Paris", "75017", 17, "01 42 67 14 19", "Burgers gourmets, Grillades", "Américain", "Viande", "Beth Din de Paris", 4.7, 620, 48.8859, 2.3089, "12:00–15:00, 19:30–23:00"],
  ["Safrane", "1 bis Rue des Colonels Renard, Paris", "75017", 17, "01 58 62 13 59", "Cuisine indienne, Tandoori", "Indien", "Viande", "Beth Din de Paris", 4.6, 220, 48.8778, 2.2902, "12:00–15:00, 19:30–23:00"],
  ["Pâtisserie Boaz", "38 Rue de Tocqueville, Paris", "75017", 17, "01 42 27 50 50", "Pâtisserie fine, Gâteaux, Viennoiserie", "Français", "Lait", "Beth Din de Paris", 4.8, 320, 48.8851, 2.3112, "07:30–19:30"],
  ["Saïko", "4 Rue Armand Carrel, Paris", "75019", 19, "01 45 00 66 66", "Asiatique, Sushi d'exception", "Japonais", "Parvé", "Beth Din de Paris", 4.8, 370, 48.8824, 2.3789, "11:30–15:00, 18:30–23:00"],
  ["Dav and Jo Guichi", "49 Quai de la Seine, Paris", "75019", 19, "01 40 05 13 50", "Grillades, Burgers, Terrasse canal", "Français", "Viande", "Beth Din de Paris", 4.7, 440, 48.8858, 2.3721, "12:00–15:00, 19:00–23:00"],
  ["Aux Délices d'Avraham", "87 Avenue Secrétan, Paris", "75019", 19, "06 34 11 87 60", "Sandwicherie, Asiatique, Japonaise", "Japonais", "Parvé", "Beth Din de Paris", 4.6, 210, 48.8809, 2.3745, "11:30–15:00, 18:30–22:30"],
  ["Chez Rafou", "91 Avenue Secrétan, Paris", "75019", 19, "07 51 32 78 00", "Orientale, Tunisienne, Grillades", "Tunisien", "Viande", "Beth Din de Paris", 4.6, 310, 48.8812, 2.3749, "11:30–23:00"],

  // ÎLE-DE-FRANCE (92, 93, 94, 95)
  ["Afrika", "46 Rue Marjolin, Levallois-Perret", "92300", 92, "07 66 41 55 68", "Cuisine africaine, Yassa, Mafé, Thieb, Allokos", "Africain", "Viande", "Loubavitch (Chabad)", 4.9, 280, 48.8951, 2.2882, "12:00–14:30, 19:30–22:30"],
  ["Chez Dan Boulogne", "110 Route de la Reine, Boulogne-Billancourt", "92100", 92, "01 46 05 12 12", "Burgers artisanaux, Grillades", "Américain", "Viande", "Beth Din de Paris", 4.7, 380, 48.8378, 2.2412, "12:00–15:00, 19:30–23:00"],
  ["Pâtisserie Shana", "18 Rue de l'Hôtel de Ville, Neuilly-sur-Seine", "92200", 92, "01 47 45 22 33", "Pâtisserie haut de gamme, Brunch", "Français", "Lait", "Beth Din de Paris", 4.8, 290, 48.8841, 2.2689, "08:00–19:30"],
  ["Le K Levallois", "55 Rue Aristide Briand, Levallois-Perret", "92300", 92, "01 47 37 40 40", "Bistrot gourmet, Viandes nobles", "Français", "Viande", "Beth Din de Paris", 4.7, 320, 48.8932, 2.2865, "12:00–14:30, 19:30–23:00"],
  ["Boucherie Kosher des Ternes", "34 Avenue Achille Peretti, Neuilly-sur-Seine", "92200", 92, "01 46 24 18 18", "Boucherie fine, Rôtisserie, Traiteur", "Français", "Viande", "Beth Din de Paris", 4.9, 310, 48.8839, 2.2712, "08:00–19:30"],
  ["Traiteur Ohayon", "22 Avenue du Général de Gaulle, Saint-Mandé", "94160", 94, "01 43 28 55 66", "Traiteur réceptions, Plats de chabbat", "Marocain, Français", "Viande", "Beth Din de Paris", 4.9, 240, 48.8421, 2.4189, "09:00–19:30"],
  ["Pizza Dina", "47 Rue de la République, Saint-Mandé", "94160", 94, "01 43 98 12 12", "Pizzeria artisanale, Calzone, Pâtes", "Italien", "Lait", "Beth Din de Paris", 4.7, 390, 48.8435, 2.4201, "11:30–15:00, 18:30–23:00"],
  ["Boulangerie Dan", "14 Avenue de Paris, Vincennes", "94300", 94, "01 43 28 10 10", "Pains spéciaux, Hallot, Viennoiserie", "Français", "Parvé", "Beth Din de Paris", 4.8, 310, 48.8472, 2.4351, "07:00–19:30"],
  ["Chez Yoni Grillades", "14 Boulevard Henri Barbusse, Sarcelles", "95200", 95, "01 39 90 25 25", "Grillades orientales, Shawarma", "Marocain, Tunisien", "Viande", "Beth Din de Paris", 4.7, 460, 48.9781, 2.3789, "11:30–23:00"],

  // MARSEILLE & PACA
  ["Le Maïmonide", "22 Rue Breteuil, Marseille", "13006", 13, "04 91 33 25 60", "Méditerranéenne, Couscous, Grillades", "Marocain", "Viande", "Beth Din de Marseille", 4.8, 340, 43.2912, 5.3789, "12:00–14:30, 19:30–22:30"],
  ["Chez Michel Kosher", "155 Avenue du Prado, Marseille", "13008", 13, "04 91 79 30 30", "Grillades au feu de bois, Burgers", "Français", "Viande", "Beth Din de Marseille", 4.7, 410, 43.2789, 5.3856, "12:00–15:00, 19:30–23:00"],
  ["Pizza Bella Kosher", "38 Rue Edmond Rostand, Marseille", "13006", 13, "04 91 37 12 12", "Pizzas au feu de bois, Salades", "Italien", "Lait", "Beth Din de Marseille", 4.7, 380, 43.2878, 5.3802, "11:30–14:30, 18:30–23:00"],
  ["Pâtisserie Haïm", "82 Rue de Rome, Marseille", "13006", 13, "04 91 54 20 20", "Pâtisserie fine, Macarons, Gâteaux", "Tunisien, Français", "Parvé", "Beth Din de Marseille", 4.9, 420, 43.2921, 5.3792, "07:30–19:30"],
  ["Aix Kosher Grill", "14 Rue Mignet, Aix-en-Provence", "13100", 13, "04 42 21 34 34", "Grillades, Burgers provençaux", "Français", "Viande", "Beth Din de Marseille", 4.7, 190, 43.5298, 5.4489, "12:00–14:30, 19:00–22:30"],

  // NICE & CANNES (06)
  ["Le Shaloma", "44 Rue de France, Nice", "06000", 6, "04 93 88 56 78", "Méditerranéenne, Plats traditionnels", "Tunisien, Marocain", "Viande", "Consistoire de France", 4.7, 380, 43.6965, 7.2589, "12:00–15:00, 19:30–23:00"],
  ["Le Tovel", "12 Rue Gounod, Nice", "06000", 6, "04 93 87 23 23", "Pizzas fines, Pâtes fraîches", "Italien", "Lait", "Consistoire de France", 4.7, 340, 43.6998, 7.2562, "11:30–14:30, 18:30–22:30"],
  ["Rouvi Kosher Cannes", "22 Rue Commandant Vidal, Cannes", "06400", 6, "04 93 38 12 12", "Gastronomie casher, Viandes d'exception", "Français", "Viande", "Loubavitch (Chabad)", 4.9, 420, 43.5532, 7.0245, "12:00–15:00, 19:30–23:30"],

  // LYON & RHÔNE-ALPES (69)
  ["Le King David", "34 Rue Masséna, Lyon", "69006", 69, "04 78 89 22 22", "Gastronomie lyonnaise, Grillades", "Français", "Viande", "Beth Din de Lyon", 4.8, 370, 45.7689, 4.8562, "12:00–14:30, 19:30–22:30"],
  ["Pâtisserie Schuler", "114 Cours Émile Zola, Villeurbanne", "69100", 69, "04 78 84 75 75", "Pâtisserie fine, Brioches, Gâteaux", "Ashkénaze, Français", "Parvé", "Beth Din de Lyon", 4.9, 460, 45.7701, 4.8712, "07:00–19:30"],
  ["Pizza Lyon Kosher", "56 Rue de France, Villeurbanne", "69100", 69, "04 72 65 30 30", "Pizzeria artisanale, Calzone", "Italien", "Lait", "Beth Din de Lyon", 4.7, 310, 45.7681, 4.8802, "11:30–14:30, 18:30–23:00"],

  // STRASBOURG & ALSACE (67)
  ["Le Cèdre d'Alsace", "1 Rue Thiergarten, Strasbourg", "67000", 67, "03 88 22 15 15", "Traditionnelle alsacienne et orientale", "Ashkénaze, Français", "Viande", "Beth Din de Strasbourg", 4.8, 310, 48.5841, 7.7389, "12:00–14:30, 19:00–22:30"],
  ["Boulangerie Pâtisserie Gross", "18 Rue Sainte-Hélène, Strasbourg", "67000", 67, "03 88 32 40 40", "Pâtisseries alsaciennes, Kouglof", "Ashkénaze, Français", "Parvé", "Beth Din de Strasbourg", 4.9, 530, 48.5823, 7.7441, "07:00–19:00"],

  // TOULOUSE (31)
  ["Le Shalom Toulouse", "15 Rue Riquet, Toulouse", "31000", 31, "05 61 62 45 45", "Grillades au feu de bois, Sud-ouest", "Tunisien, Français", "Viande", "Consistoire de France", 4.8, 290, 43.6045, 1.4532, "12:00–14:30, 19:30–22:30"],
  ["Boulangerie Pâtisserie Guez", "2 Place Saint-Étienne, Toulouse", "31000", 31, "05 61 52 80 80", "Pains artisanaux, Gâteaux traditionnels", "Tunisien, Français", "Parvé", "Consistoire de France", 4.8, 340, 43.5998, 1.4489, "07:30–19:30"],
].map(([name, address, postalCode, arrondissement, phone, specialty, cuisine, kosherType, certification, rating, reviewCount, lat, lng, hoursSchedule]) => {
  const schedule = hoursSchedule || "12:00–15:00, 19:30–23:00";
  return {
    Nom: name,
    "Adresse complète": address,
    "Code postal": postalCode,
    Arrondissement: arrondissement,
    Téléphone: phone,
    Spécialité: specialty,
    Cuisine: cuisine,
    "Type (Viande/Lait/Parvé)": kosherType || "Viande",
    Certification: certification || "Beth Din de Paris",
    Rating: rating || 4.7,
    ReviewCount: reviewCount || 250,
    Latitude: lat || 48.8566,
    Longitude: lng || 2.3522,
    "Horaires lundi": schedule,
    "Horaires mardi": schedule,
    "Horaires mercredi": schedule,
    "Horaires jeudi": schedule,
    "Horaires vendredi": "11:30–14:30",
    "Horaires samedi": "Fermé",
    "Horaires dimanche": schedule,
  };
});

export const restaurants = importedRows.map((row, index) => {
  const restaurant = normalizeRestaurantRow(row, index);
  if (restaurant.name === "Khan") {
    return {
      ...restaurant,
      type: "Viande" as const,
      certification: "À compléter",
      image: "/images/food/restaurants-khan.jpg",
      services: { ...restaurant.services, dineIn: true, takeaway: true, delivery: true },
      amenities: { ...restaurant.amenities, familyFriendly: true },
    };
  }
  return restaurant;
});
