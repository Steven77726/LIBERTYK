"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getAuthRedirectUrl, getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";

type LibertyRole = "admin" | "professional" | "user";

type SupabaseAuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: LibertyRole;
  isAdmin: boolean;
  isProfessional: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
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
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadProfile = async (currentSession: Session | null) => {
      if (!mounted) return;
      setSession(currentSession);
      mirrorSupabaseUser(currentSession?.user ?? null);
      if (!currentSession?.user) {
        setRole("user");
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("profiles").select("role").eq("id", currentSession.user.id).maybeSingle();
      if (!mounted) return;
      setRole((data?.role as LibertyRole | undefined) ?? "user");
      setLoading(false);
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
      role,
      isAdmin: role === "admin",
      isProfessional: role === "professional" || role === "admin",
      signInWithGoogle: async () => {
        await supabase?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getAuthRedirectUrl("/mon-compte") } });
      },
      signInWithApple: async () => {
        await supabase?.auth.signInWithOAuth({ provider: "apple", options: { redirectTo: getAuthRedirectUrl("/mon-compte") } });
      },
      signInWithEmail: async (email, password) => {
        const { error } = await supabase!.auth.signInWithPassword({ email, password });
        return { error: error?.message };
      },
      signUpWithEmail: async (email, password) => {
        const { error } = await supabase!.auth.signUp({ email, password, options: { emailRedirectTo: getAuthRedirectUrl("/mon-compte") } });
        return { error: error?.message };
      },
      signOut: async () => {
        mirrorSupabaseUser(null);
        await supabase?.auth.signOut();
      },
    };
  }, [loading, role, session]);

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  return context;
}
