"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAuthRedirectUrl, getSupabaseBrowserClient, isAppleAuthEnabled, isGoogleAuthEnabled, isSupabaseConfigured } from "@/lib/supabase/client";
import { mergeSavedEntities } from "@/lib/client-store";
import { mergeLocalFavorites } from "@/lib/favorites/favorites-service";
import { fetchUserSavedEntities } from "@/lib/supabase/sync";

type LibertyRole = "admin" | "professional" | "user";
export type LibertyProfile = {
  id: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  phone: string;
  auth_provider: string;
  status: "active" | "suspended";
  role: LibertyRole;
  created_at: string;
  last_sign_in_at: string | null;
};

type SupabaseAuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: LibertyProfile | null;
  profileLoadError: string;
  role: LibertyRole;
  isAdmin: boolean;
  isProfessional: boolean;
  googleAuthEnabled: boolean;
  appleAuthEnabled: boolean;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithApple: () => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string; confirmationRequired?: boolean }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (profile: Partial<Pick<LibertyProfile, "first_name" | "last_name" | "avatar_url" | "phone">>) => Promise<{ error?: string; profile?: LibertyProfile }>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null);

function mirrorSupabaseUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem("liberty-demo-user");
    return;
  }
  window.localStorage.setItem("liberty-demo-user", JSON.stringify({
    id: user.id,
    name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur Liberty",
    email: user.email ?? "",
    provider: "classic",
    createdAt: user.created_at ?? new Date().toISOString(),
  }));
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<LibertyRole>("user");
  const [profile, setProfile] = useState<LibertyProfile | null>(null);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const loadProfileForSession = async (currentSession: Session | null) => {
    const supabase = getSupabaseBrowserClient();
    setSession(currentSession);
    mirrorSupabaseUser(currentSession?.user ?? null);
    if (!supabase || !currentSession?.user) {
      setRole("user");
      setProfile(null);
      setProfileLoadError("");
      setLoading(false);
      return;
    }
    const user = currentSession.user;
    const provider = user.app_metadata?.provider ?? "email";
    const fallbackProfile = {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Utilisateur Liberty",
      first_name: user.user_metadata?.given_name ?? "",
      last_name: user.user_metadata?.family_name ?? "",
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "",
      auth_provider: provider,
      last_sign_in_at: new Date().toISOString(),
    };
    const { data: existingProfile, error: readError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (readError) {
      setProfileLoadError("Impossible de charger vos informations.");
      setLoading(false);
      return;
    }
    if (!existingProfile) {
      const { error: insertError } = await supabase.from("profiles").insert(fallbackProfile);
      if (insertError) {
        setProfileLoadError("Impossible de charger vos informations.");
        setLoading(false);
        return;
      }
    } else {
      const { error: touchError } = await supabase.from("profiles").update({
        email: user.email ?? existingProfile.email,
        auth_provider: provider,
        last_sign_in_at: new Date().toISOString(),
      }).eq("id", user.id);
      if (touchError) {
        setProfileLoadError("Impossible de charger vos informations.");
        setLoading(false);
        return;
      }
    }
    const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (profileError) {
      setProfileLoadError("Impossible de charger vos informations.");
      setLoading(false);
      return;
    }
    setProfileLoadError("");
    if (data?.status === "suspended") {
      setProfile(data as LibertyProfile);
      setRole("user");
      setLoading(false);
      await supabase.auth.signOut();
      mirrorSupabaseUser(null);
      return;
    }
    setProfile((data as LibertyProfile | null) ?? null);
    setRole((data?.role as LibertyRole | undefined) ?? "user");
    await mergeLocalFavorites();
    const saved = await fetchUserSavedEntities();
    mergeSavedEntities([], saved.likes);
    setLoading(false);
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadProfile = async (currentSession: Session | null) => {
      if (!mounted) return;
      await loadProfileForSession(currentSession);
    };

    supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => loadProfile(nextSession));

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<SupabaseAuthContextValue>(() => {
    const supabase = getSupabaseBrowserClient();
    return {
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      profileLoadError,
      role,
      isAdmin: role === "admin",
      isProfessional: role === "professional" || role === "admin",
      googleAuthEnabled: isGoogleAuthEnabled,
      appleAuthEnabled: isAppleAuthEnabled,
      signInWithGoogle: async () => {
        if (!supabase) return { error: "Supabase Auth n’est pas configuré." };
        if (!isGoogleAuthEnabled) return { error: "Google Auth n’est pas encore activé dans la configuration Liberty." };
        const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getAuthRedirectUrl("/mon-compte") } });
        return { error: error?.message };
      },
      signInWithApple: async () => {
        if (!supabase) return { error: "Supabase Auth n’est pas configuré." };
        if (!isAppleAuthEnabled) return { error: "Apple Auth n’est pas encore activé dans la configuration Liberty." };
        const { error } = await supabase.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: getAuthRedirectUrl("/mon-compte") } });
        return { error: error?.message };
      },
      signInWithEmail: async (email, password) => {
        if (!supabase) return { error: "Supabase Auth n’est pas configuré." };
        try {
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
          return { error: error?.message };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Erreur de connexion Supabase." };
        }
      },
      signUpWithEmail: async (email, password) => {
        if (!supabase) return { error: "Supabase Auth n’est pas configuré." };
        try {
          const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { emailRedirectTo: getAuthRedirectUrl("/mon-compte") } });
          return { error: error?.message, confirmationRequired: Boolean(data.user && !data.session) };
        } catch (error) {
          return { error: error instanceof Error ? error.message : "Erreur de création du compte Supabase." };
        }
      },
      resetPassword: async (email) => {
        const { error } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: getAuthRedirectUrl("/mon-compte") });
        return { error: error?.message };
      },
      updatePassword: async (password) => {
        const { error } = await supabase!.auth.updateUser({ password });
        return { error: error?.message };
      },
      updateProfile: async (nextProfile) => {
        if (!session?.user) return { error: "Utilisateur non connecté." };
        const fullName = [nextProfile.first_name ?? profile?.first_name, nextProfile.last_name ?? profile?.last_name].filter(Boolean).join(" ").trim();
        const { data, error } = await supabase!.from("profiles").update({
          ...nextProfile,
          full_name: fullName || profile?.full_name,
          updated_at: new Date().toISOString(),
        }).eq("id", session.user.id).select("*").single();
        if (!error && data) {
          const nextStoredProfile = data as LibertyProfile;
          setProfile(nextStoredProfile);
          setRole(nextStoredProfile.role ?? "user");
          setProfileLoadError("");
          return { profile: nextStoredProfile };
        }
        return { error: error?.message };
      },
      refreshProfile: async () => {
        await loadProfileForSession(session);
      },
      signOut: async () => {
        mirrorSupabaseUser(null);
        await supabase?.auth.signOut();
      },
    };
  }, [loading, profile, profileLoadError, role, session]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  return context;
}
