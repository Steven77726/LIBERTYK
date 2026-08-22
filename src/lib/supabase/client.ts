"use client";

import { createBrowserClient } from "@supabase/ssr";

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseConfig(): { url: string; key: string } | null {
  if (envSupabaseUrl && envSupabaseAnonKey) {
    return { url: envSupabaseUrl, key: envSupabaseAnonKey };
  }
  if (typeof window !== "undefined") {
    try {
      const storedUrl = localStorage.getItem("liberty_supabase_url");
      const storedKey = localStorage.getItem("liberty_supabase_anon_key");
      if (storedUrl && storedKey) {
        return { url: storedUrl, key: storedKey };
      }
    } catch {
      // Ignorer
    }
  }
  return null;
}

export const isSupabaseConfigured = Boolean(getSupabaseConfig());
export const isGoogleAuthEnabled = true;
export const isAppleAuthEnabled = true;

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(config.url, config.key);
  }
  return browserClient;
}

export function setCustomSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("liberty_supabase_url", url.trim());
  localStorage.setItem("liberty_supabase_anon_key", anonKey.trim());
  browserClient = null;
  window.location.reload();
}

export function getAuthRedirectUrl(path = "/mon-compte") {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${window.location.pathname.startsWith("/LIBERTYK") ? "/LIBERTYK" : ""}${path}`;
  }
  return `https://steven77726.github.io/LIBERTYK${path}`;
}
