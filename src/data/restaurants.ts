import { normalizeRestaurantRow } from "@/lib/restaurant-import";

const importedRows = [
  ["Khan", "Paris 17e", "75017", 17, "", "Grill, viande grillée, déjeuner, dîner", "Israélienne, Orientale"],
  ["Chez Isaac", "52 Rue Volta, Paris", "75003", 3, "01 42 71 19 09", "Cuisine israélienne", "Israélienne"],
  ["Kavod", "26 Rue Jean Mermoz, Paris", "75008", 8, "01 42 25 65 26", "Gastronomique", "Française"],
  ["Douieb", "11 bis Rue Geoffroy-Marie, Paris", "75009", 9, "01 47 70 86 09", "Sandwicherie, Traiteur", "Sandwicherie"],
  ["Novela", "8 Boulevard de Magenta, Paris", "75010", 10, "01 40 05 54 83", "Cuisine israélienne", "Israélienne"],
  ["La Mina", "45 Rue de Montreuil, Paris", "75011", 11, "01 73 71 47 15", "Cuisine israélienne", "Israélienne"],
  ["Tikoun Olam", "136 Avenue Daumesnil, Paris", "75012", 12, "01 43 43 04 22", "Gastronomique", "Française"],
  ["Chlew", "66 Avenue Victor Hugo, Paris", "75116", 16, "01 75 43 99 99", "Sandwicherie, Fast-food", "Fast-food"],
  ["Benson Kfé", "261 Boulevard Pereire, Paris", "75017", 17, "01 45 74 60 52", "Française, Américaine", "Française"],
  ["Chez Franck", "46 Rue Bayen, Paris", "75017", 17, "01 45 72 11 74", "Cuisine française", "Française"],
  ["Restaurant Doron Niel", "73 Avenue Niel, Paris", "75017", 17, "01 44 40 28 15", "Grillades", "Grillades"],
  ["Flavio", "11 Rue Cardinet, Paris", "75017", 17, "01 45 74 68 11", "Italien, Pizzas", "Italienne"],
  ["Gabrielli", "12 Rue d'Héliopolis, Paris", "75017", 17, "01 44 09 00 08", "Italien, Grillades", "Italienne"],
  ["Gilda Paris 17", "78 Avenue des Ternes, Paris", "75017", 17, "01 53 43 07 48", "Orientale, Tunisienne, Grillades", "Orientale"],
  ["Maison Gabriel", "124 Avenue de Villiers, Paris", "75017", 17, "09 81 11 86 85", "Gastronomique française", "Française"],
  ["La Fille du Boucher", "20 Rue Cardinet, Paris", "75017", 17, "01 42 67 14 19", "Burgers, Grillades", "Burgers"],
  ["Safrane", "1 bis Rue des Colonels Renard, Paris", "75017", 17, "01 58 62 13 59", "Cuisine indienne", "Indienne"],
  ["Saïko", "4 Rue Armand Carrel, Paris", "75019", 19, "01 45 00 66 66", "Asiatique, Sushi", "Japonaise"],
  ["Dav and Jo Guichi", "49 Quai de la Seine, Paris", "75019", 19, "01 40 05 13 50", "Grillades, Burgers", "Grillades"],
  ["Aux Délices d'Avraham", "87 Avenue Secrétan, Paris", "75019", 19, "06 34 11 87 60", "Sandwicherie, Asiatique, Japonaise", "Japonaise"],
  ["Chez Rafou", "91 Avenue Secrétan, Paris", "75019", 19, "07 51 32 78 00", "Orientale, Tunisienne, Burgers", "Orientale"],
].map(([name, address, postalCode, arrondissement, phone, specialty, cuisine]) => ({
  Nom: name,
  "Adresse complète": address,
  "Code postal": postalCode,
  Arrondissement: arrondissement,
  Téléphone: phone,
  Spécialité: specialty,
  Cuisine: cuisine,
}));

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
