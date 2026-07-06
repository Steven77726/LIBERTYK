"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type LibertyUser = {
  id: string;
  name: string;
  email: string;
  provider: "google" | "apple" | "classic";
};

const userKey = "liberty-demo-user";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("liberty-storage", { detail: { key } }));
}

export function useLibertyUser() {
  const [user, setUser] = useState<LibertyUser | null>(null);

  useEffect(() => {
    const sync = () => setUser(readJson<LibertyUser | null>(userKey, null));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("liberty-storage", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("liberty-storage", sync as EventListener);
    };
  }, []);

  const signIn = useCallback((provider: LibertyUser["provider"] = "classic") => {
    const nextUser: LibertyUser = {
      id: "demo-user-steven",
      name: "Steven",
      email: provider === "apple" ? "steven@icloud.com" : "steven@liberty.demo",
      provider,
    };
    writeJson(userKey, nextUser);
    setUser(nextUser);
  }, []);

  const signOut = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(userKey);
      window.dispatchEvent(new CustomEvent("liberty-storage", { detail: { key: userKey } }));
    }
    setUser(null);
  }, []);

  return { user, signedIn: Boolean(user), signIn, signOut };
}

export function useStoredList(key: string) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    setItems(readJson<string[]>(key, []));
  }, [key]);

  const toggle = useCallback((id: string) => {
    setItems((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
      writeJson(key, next);
      return next;
    });
  }, [key]);

  return { items, toggle, has: useCallback((id: string) => items.includes(id), [items]) };
}

export type LibertyReview = {
  entityId: string;
  text: string;
  rating: number;
  createdAt: string;
  userId: string;
};

export function useEntityReview(entityId: string) {
  const key = "liberty-user-reviews";
  const [reviews, setReviews] = useState<Record<string, LibertyReview>>({});

  useEffect(() => {
    setReviews(readJson<Record<string, LibertyReview>>(key, {}));
  }, []);

  const review = reviews[entityId] ?? null;
  const publish = useCallback((reviewText: string, rating: number, userId: string) => {
    if (reviews[entityId]) return false;
    const next = {
      ...reviews,
      [entityId]: {
        entityId,
        text: reviewText.slice(0, 149),
        rating,
        userId,
        createdAt: new Date().toISOString(),
      },
    };
    setReviews(next);
    writeJson(key, next);
    return true;
  }, [entityId, reviews]);

  return { review, publish };
}

export function usePlatformCounters() {
  const counters = useMemo(() => ({
    likes: readJson<string[]>("liberty-liked-entities", []).length,
    favorites: readJson<string[]>("liberty-favorite-entities", []).length,
    reviews: Object.keys(readJson<Record<string, LibertyReview>>("liberty-user-reviews", {})).length,
    reservations: readJson<unknown[]>("liberty-reservation-notifications", []).length,
  }), []);

  return counters;
}
