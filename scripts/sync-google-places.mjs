/**
 * Script d'automatisation Google Places / Google Business pour Liberty
 * Usage:
 *   GOOGLE_PLACES_API_KEY="AIzaSy..." node scripts/sync-google-places.mjs
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

async function syncEstablishment(name, address) {
  if (!API_KEY) {
    console.log(`[SIMULATION] Clé API non fournie. Synchronisation simulée pour : ${name}`);
    return {
      name,
      rating: 4.8,
      reviewsCount: 150,
      status: "OK (Simulé)",
    };
  }

  try {
    const query = encodeURIComponent(`${name} ${address || "Paris"}`);
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&language=fr&key=${API_KEY}`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      console.warn(`[WARN] Aucun résultat Google trouvé pour : ${name}`);
      return null;
    }

    const place = data.results[0];
    const placeId = place.place_id;

    // Récupérer les détails complets (Photos, Horaires, Avis)
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos,reviews,opening_hours,geometry&language=fr&key=${API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const detailsData = await detailsRes.json();
    const details = detailsData.result || {};

    const photos = (details.photos || []).slice(0, 5).map(
      (p) => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${p.photo_reference}&key=${API_KEY}`
    );

    return {
      name: details.name || name,
      address: details.formatted_address || place.formatted_address,
      phone: details.formatted_phone_number || "",
      website: details.website || "",
      rating: details.rating || place.rating,
      userRatingsTotal: details.user_ratings_total || place.user_ratings_total,
      latitude: details.geometry?.location?.lat,
      longitude: details.geometry?.location?.lng,
      photos,
      hours: details.opening_hours?.weekday_text || [],
      reviewsCount: details.reviews?.length || 0,
      status: "OK",
    };
  } catch (err) {
    console.error(`[ERROR] Erreur lors de la synchronisation de ${name}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("🚀 Démarrage du job de synchronisation Google Places pour Liberty...");
  
  const demoEstablishments = [
    { name: "Le Marceau 17e", address: "75 Avenue Niel, 75017 Paris" },
    { name: "Bloomy Brunch", address: "189 Rue de Charonne, 75011 Paris" },
    { name: "David Abitbol — Trompe-l'œil", address: "Paris" },
  ];

  for (const item of demoEstablishments) {
    console.log(`\n🔍 Synchronisation de : ${item.name}...`);
    const result = await syncEstablishment(item.name, item.address);
    console.log(" Résultat :", JSON.stringify(result, null, 2));
  }

  console.log("\n✅ Job de synchronisation terminé avec succès !");
}

main();
