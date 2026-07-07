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

export type LibertyAiProfile = {
  id: string;
  name: string;
  theme: string;
  avatar?: string;
  memory: string[];
  preferences: string[];
  notifications: string[];
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
const AI_PROFILES_KEY = "liberty-ai-profiles";

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
  return next;
}

export function getFavorites() {
  return safeRead<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(entityId: string, label?: string) {
  const user = requireUser("Connectez-vous pour enregistrer ce contenu.");
  if (!user) return getFavorites();
  const current = getFavorites();
  const next = current.includes(entityId) ? current.filter((id) => id !== entityId) : [entityId, ...current];
  safeWrite(FAVORITES_KEY, next);
  trackEvent(next.includes(entityId) ? "favorite_added" : "favorite_removed", label, entityId);
  return next;
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
  return { ok: true as const, review };
}

export function getAiProfiles() {
  return safeRead<LibertyAiProfile[]>(AI_PROFILES_KEY, [
    { id: "batata", name: "BATATA", theme: "🍽 Food & Restaurants", memory: ["Brunch casher Paris 17", "Restaurant bassari 17"], preferences: ["bassari", "Paris 17"], notifications: [] },
    { id: "tsadik", name: "TSADIK", theme: "🍷 Vin & Spiritueux", memory: ["Dégustation de vin sur Paris", "Tequila casher"], preferences: ["vins casher"], notifications: [] },
    { id: "favoris", name: "MES FAVORIS", theme: "💰 Bons plans", memory: ["Restaurant préféré", "Vin préféré"], preferences: ["coups de cœur"], notifications: [] },
  ]);
}

export function saveAiProfiles(profiles: LibertyAiProfile[]) {
  safeWrite(AI_PROFILES_KEY, profiles.slice(0, 5));
  trackEvent("ai_profiles_saved", "Agent IA");
}

export function trackEvent(type: string, label?: string, entityId?: string) {
  const event: LibertyEvent = { id: crypto.randomUUID(), type, label, entityId, createdAt: new Date().toISOString() };
  safeWrite(EVENTS_KEY, [event, ...safeRead<LibertyEvent[]>(EVENTS_KEY, [])].slice(0, 500));
}

export function getAnalyticsEvents() {
  return safeRead<LibertyEvent[]>(EVENTS_KEY, []);
}
