"use client";

import { createBrowserClient } from "@supabase/ssr";

const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseConfig(): { url: string; key: string } | null {
  if (envSupabaseUrl && envSupabaseAnonKey) {
    return { url: envSupabaseUrl, key: envSupabaseAnonKey };
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
  // Legacy helper kept for compatibility with older Admin settings screens.
  // Production runtime must use only the build-time public environment variables
  // to avoid writing Admin changes to a stale or wrong Supabase project.
  localStorage.setItem("liberty_supabase_url", url.trim());
  localStorage.setItem("liberty_supabase_anon_key", anonKey.trim());
}

export function getAuthRedirectUrl(path = "/mon-compte") {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${window.location.pathname.startsWith("/LIBERTYK") ? "/LIBERTYK" : ""}${path}`;
  }
  return `https://steven77726.github.io/LIBERTYK${path}`;
}
