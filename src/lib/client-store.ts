import { syncAnalyticsEvent, syncFavorite, syncLike, syncReview } from "@/lib/supabase/sync";

export type LibertyUser = {
  id: string;
  name: string;
  email: string;
  provider: "google" | "apple" | "classic";
  createdAt: string;
};

export type LibertyReview = {
  entityId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
};

export type LibertyEvent = {
  id: string;
  type: string;
  entityId?: string;
  label?: string;
  createdAt: string;
};

const USER_KEY = "liberty-demo-user";
const LIKES_KEY = "liberty-likes";
const FAVORITES_KEY = "liberty-favorites";
const REVIEWS_KEY = "liberty-reviews";
const EVENTS_KEY = "liberty-analytics-events";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCurrentUser() {
  return safeRead<LibertyUser | null>(USER_KEY, null);
}

export function createDemoUser(provider: LibertyUser["provider"] = "classic", email = "demo@liberty.local") {
  const user: LibertyUser = {
    id: "demo-user",
    name: "Utilisateur Liberty",
    email,
    provider,
    createdAt: new Date().toISOString(),
  };
  safeWrite(USER_KEY, user);
  trackEvent("user_login", "Mon compte");
  return user;
}

export function clearDemoUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
  trackEvent("user_logout", "Mon compte");
}

export function requireUser(message = "Connectez-vous pour aimer ce contenu.") {
  const user = getCurrentUser();
  if (user) return user;
  if (typeof window !== "undefined") window.alert(message);
  return null;
}

export function getLikes() {
  return safeRead<string[]>(LIKES_KEY, []);
}

export function toggleLike(entityId: string, label?: string) {
  const user = requireUser("Connectez-vous pour aimer ce contenu.");
  if (!user) return getLikes();
  const current = getLikes();
  const next = current.includes(entityId) ? current.filter((id) => id !== entityId) : [entityId, ...current];
  safeWrite(LIKES_KEY, next);
  trackEvent(next.includes(entityId) ? "like_added" : "like_removed", label, entityId);
  void syncLike(entityId, label, next.includes(entityId));
  return next;
}

export function getFavorites() {
  return safeRead<string[]>(FAVORITES_KEY, []);
}

export function mergeSavedEntities(nextFavorites: string[], nextLikes: string[]) {
  safeWrite(FAVORITES_KEY, [...new Set([...getFavorites(), ...nextFavorites])]);
  safeWrite(LIKES_KEY, [...new Set([...getLikes(), ...nextLikes])]);
}

export function toggleFavorite(entityId: string, label?: string) {
  const user = requireUser("Connectez-vous pour enregistrer ce contenu.");
  if (!user) return getFavorites();
  const current = getFavorites();
  const next = current.includes(entityId) ? current.filter((id) => id !== entityId) : [entityId, ...current];
  safeWrite(FAVORITES_KEY, next);
  trackEvent(next.includes(entityId) ? "favorite_added" : "favorite_removed", label, entityId);
  void syncFavorite(entityId, label, next.includes(entityId));
  return next;
}

export function removeSavedEntity(entityId: string, label?: string) {
  const likes = getLikes().filter((id) => id !== entityId);
  const favorites = getFavorites().filter((id) => id !== entityId);
  safeWrite(LIKES_KEY, likes);
  safeWrite(FAVORITES_KEY, favorites);
  trackEvent("favorite_removed", label, entityId);
  void syncFavorite(entityId, label, false);
  void syncLike(entityId, label, false);
  return [...new Set([...favorites, ...likes])];
}

export function getReviews() {
  return safeRead<LibertyReview[]>(REVIEWS_KEY, []);
}

export function getReviewForEntity(entityId: string, userId = getCurrentUser()?.id) {
  if (!userId) return null;
  return getReviews().find((review) => review.entityId === entityId && review.userId === userId) ?? null;
}

export function publishReview(entityId: string, text: string, label?: string) {
  const user = requireUser("Connectez-vous pour donner un avis.");
  if (!user) return { ok: false as const, reason: "auth" };
  const cleanText = text.trim().slice(0, 149);
  if (!cleanText) return { ok: false as const, reason: "empty" };
  if (getReviewForEntity(entityId, user.id)) return { ok: false as const, reason: "exists" };
  const review: LibertyReview = { entityId, userId: user.id, userName: user.name, text: cleanText, createdAt: new Date().toISOString() };
  safeWrite(REVIEWS_KEY, [review, ...getReviews()]);
  trackEvent("review_published", label, entityId);
  void syncReview(entityId, cleanText, label);
  return { ok: true as const, review };
}

export function trackEvent(type: string, label?: string, entityId?: string) {
  const event: LibertyEvent = { id: crypto.randomUUID(), type, label, entityId, createdAt: new Date().toISOString() };
  safeWrite(EVENTS_KEY, [event, ...safeRead<LibertyEvent[]>(EVENTS_KEY, [])].slice(0, 500));
  void syncAnalyticsEvent(type, label, entityId);
}

export function getAnalyticsEvents() {
  return safeRead<LibertyEvent[]>(EVENTS_KEY, []);
}
