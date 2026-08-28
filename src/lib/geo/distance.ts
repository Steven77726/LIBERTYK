/**
 * Utilitaires de géolocalisation & tri des fiches par distance (Formule Haversine)
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

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
