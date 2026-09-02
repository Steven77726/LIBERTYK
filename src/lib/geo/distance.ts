/**
 * Utilitaires de géolocalisation & tri des fiches par distance (Formule Haversine)
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

const postalCodeCoordinates: Record<string, Coordinates> = {
  "75001": { latitude: 48.8625, longitude: 2.3364 },
  "75002": { latitude: 48.8679, longitude: 2.3444 },
  "75003": { latitude: 48.8637, longitude: 2.3615 },
  "75004": { latitude: 48.8543, longitude: 2.3576 },
  "75005": { latitude: 48.8449, longitude: 2.3498 },
  "75006": { latitude: 48.8493, longitude: 2.3328 },
  "75007": { latitude: 48.8565, longitude: 2.3126 },
  "75008": { latitude: 48.8744, longitude: 2.3125 },
  "75009": { latitude: 48.8760, longitude: 2.3399 },
  "75010": { latitude: 48.8761, longitude: 2.3601 },
  "75011": { latitude: 48.8594, longitude: 2.3789 },
  "75012": { latitude: 48.8398, longitude: 2.3946 },
  "75013": { latitude: 48.8283, longitude: 2.3623 },
  "75014": { latitude: 48.8295, longitude: 2.3271 },
  "75015": { latitude: 48.8412, longitude: 2.2987 },
  "75016": { latitude: 48.8604, longitude: 2.2743 },
  "75017": { latitude: 48.8835, longitude: 2.3083 },
  "75018": { latitude: 48.8913, longitude: 2.3444 },
  "75019": { latitude: 48.8827, longitude: 2.3824 },
  "75020": { latitude: 48.8632, longitude: 2.3985 },
  "92200": { latitude: 48.8847, longitude: 2.2694 }, // Neuilly
  "92300": { latitude: 48.8932, longitude: 2.2878 }, // Levallois
  "94160": { latitude: 48.8478, longitude: 2.4394 }, // Saint-Mandé
  "94300": { latitude: 48.8475, longitude: 2.4414 }, // Vincennes
  "93100": { latitude: 48.8604, longitude: 2.4431 }, // Montreuil
  "93260": { latitude: 48.8887, longitude: 2.4161 }, // Les Lilas
  "93500": { latitude: 48.8933, longitude: 2.4042 }, // Pantin
  "92100": { latitude: 48.8397, longitude: 2.2400 }, // Boulogne
  "92130": { latitude: 48.8242, longitude: 2.2731 }, // Issy
  "94220": { latitude: 48.8211, longitude: 2.4132 }, // Charenton
  "94700": { latitude: 48.8055, longitude: 2.4300 }, // Maisons-Alfort
  "94000": { latitude: 48.7904, longitude: 2.4556 }, // Créteil
  "95200": { latitude: 48.9744, longitude: 2.3056 }, // Sarcelles
  "95400": { latitude: 48.9917, longitude: 2.3683 }, // Villiers-le-Bel
  "95160": { latitude: 48.9833, longitude: 2.2833 }, // Montmorency
  "95880": { latitude: 48.9667, longitude: 2.3000 }, // Enghien-les-Bains
};

/**
 * Formate un affichage élégant de la distance : "à 350 m" ou "à 1.4 km"
 */
export function formatDistanceLabel(distanceKm?: number): string {
  if (distanceKm === undefined || isNaN(distanceKm) || distanceKm <= 0) return "";
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `à ${meters} m`;
  }
  return `à ${distanceKm.toFixed(1)} km`;
}

/**
 * Calcule la distance en kilomètres entre deux coordonnées géographiques (Haversine)
 */
export function computeDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;
  const R = 6371; // Rayon moyen de la Terre en kilomètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Extrait les coordonnées latitude / longitude d'une entité ou d'une fiche quel que soit son schéma
 */
export function extractFicheCoordinates(fiche: unknown): Coordinates | null {
  if (!fiche || typeof fiche !== "object") return null;

  const f = fiche as Record<string, unknown>;

  // 1. Champs directs
  const rawLat = f.latitude ?? f.lat;
  const rawLng = f.longitude ?? f.lng ?? f.lon;
  if (rawLat !== undefined && rawLng !== undefined && rawLat !== "" && rawLng !== "") {
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { latitude: lat, longitude: lng };
    }
  }

  // 2. Objet location imbriqué
  if (f.location && typeof f.location === "object") {
    const loc = f.location as Record<string, unknown>;
    const lat = Number(loc.latitude ?? loc.lat);
    const lng = Number(loc.longitude ?? loc.lng ?? loc.lon);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { latitude: lat, longitude: lng };
    }
  }

  // 3. Objet establishment imbriqué
  if (f.establishment && typeof f.establishment === "object") {
    return extractFicheCoordinates(f.establishment);
  }

  // 4. Fallback intelligent par code postal ou arrondissement
  const zip = String(f.postalCode ?? f.zipCode ?? f.zip_code ?? f.code_postal ?? "").trim();
  if (zip && postalCodeCoordinates[zip]) {
    return postalCodeCoordinates[zip];
  }

  const arr = String(f.arrondissement ?? "").replace(/\D/g, "");
  if (arr) {
    const num = Number(arr);
    if (num >= 1 && num <= 20) {
      const parisZip = `750${num < 10 ? "0" : ""}${num}`;
      if (postalCodeCoordinates[parisZip]) return postalCodeCoordinates[parisZip];
    }
  }

  const address = String(f.address ?? f.adresse ?? "");
  const matchZip = address.match(/\b(750\d\d|9[1-5]\d\d\d)\b/);
  if (matchZip && postalCodeCoordinates[matchZip[1]]) {
    return postalCodeCoordinates[matchZip[1]];
  }

  return null;
}

/**
 * Trie un tableau de fiches / établissements par ordre croissant de distance
 * par rapport à la position de l'utilisateur (du plus proche au plus éloigné).
 */
export function sortFichesByDistance<T>(
  fiches: T[],
  userLat: number,
  userLng: number
): (T & { distanceKm?: number })[] {
  if (!Array.isArray(fiches) || isNaN(userLat) || isNaN(userLng)) {
    return fiches as (T & { distanceKm?: number })[];
  }

  const mapped = fiches.map((item) => {
    const coords = extractFicheCoordinates(item);
    if (!coords) {
      return {
        ...item,
        distanceKm: undefined,
      };
    }
    const distanceKm = computeDistanceKm(userLat, userLng, coords.latitude, coords.longitude);
    return {
      ...item,
      distanceKm,
    };
  });

  return mapped.sort((a, b) => {
    const distA = a.distanceKm ?? 999999;
    const distB = b.distanceKm ?? 999999;
    return distA - distB;
  });
}

/**
 * Récupère la position GPS de l'utilisateur de manière asynchrone sécurisée
 */
export async function requestUserCoordinates(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 6000, maximumAge: 300000 }
): Promise<Coordinates | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        resolve({ latitude, longitude });
      },
      (error) => {
        console.warn("Géolocalisation refusée ou indisponible :", error?.message || error);
        resolve(null);
      },
      options
    );
  });
}

/**
 * Récupère la position GPS de l'utilisateur avec callbacks de succès et d'erreur
 */
export function getUserGeolocation(
  onSuccess: (coords: Coordinates) => void,
  onError?: (error: GeolocationPositionError) => void,
  options: PositionOptions = { enableHighAccuracy: true, timeout: 6000, maximumAge: 300000 }
): void {
  if (typeof window === "undefined" || !navigator.geolocation) {
    onError?.({
      code: 2,
      message: "Géolocalisation non supportée par votre navigateur",
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    (error) => {
      console.warn("Géolocalisation refusée ou indisponible", error);
      onError?.(error);
    },
    options
  );
}
