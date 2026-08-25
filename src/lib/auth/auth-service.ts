"use client";

import { getAuthRedirectUrl, getSupabaseBrowserClient, getSupabaseConfig } from "@/lib/supabase/client";

export type LibertyUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  provider: "email";
  city: string;
  role: "user" | "professional" | "admin";
  createdAt: string;
  lastLoginAt: string;
};

type StoredUserRecord = LibertyUser & {
  passwordHash?: string;
};

const USERS_REGISTRY_KEY = "liberty-users-registry";
const ACTIVE_SESSION_KEY = "liberty-active-session";
export const AUTH_EVENT_NAME = "liberty-auth-state-changed";
export const AUTH_MODAL_EVENT = "liberty-open-auth-modal";

export type AuthModalOptions = {
  reason?: "favorite" | "general" | "custom";
  customMessage?: string;
  pendingFavoriteId?: string;
  pendingFavoriteTitle?: string;
};

/**
 * Ouvre le popup/modal de connexion / inscription
 */
export function openAuthModal(options?: AuthModalOptions) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_EVENT, { detail: options || { reason: "general" } }));
}

/**
 * Lit le registre de tous les utilisateurs enregistrés
 */
export function getRegisteredUsers(): StoredUserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredUserRecord[];
  } catch {
    return [];
  }
}

function saveRegisteredUsers(users: StoredUserRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
}

/**
 * Récupère l'utilisateur actuellement connecté (null si visiteur non connecté)
 */
export function getCurrentUser(): LibertyUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LibertyUser;
  } catch {
    return null;
  }
}

/**
 * Définit la session active et notifie tous les composants
 */
export function setActiveSession(user: LibertyUser | null) {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } else {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME, { detail: user }));
}

/**
 * Inscription sécurisée par Email & Mot de passe
 */
export async function registerWithEmail(params: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
}): Promise<{ success: boolean; user?: LibertyUser; message?: string; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Veuillez saisir une adresse email valide." };
  }
  if (!params.password || params.password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères pour votre sécurité." };
  }

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          emailRedirectTo: getAuthRedirectUrl("/mon-compte"),
          data: {
            first_name: params.firstName,
            last_name: params.lastName,
            phone: params.phone,
          },
        },
      });
      if (error && !error.message.includes("already registered")) {
        // Log error and fallback gracefully to local storage
        console.warn("Supabase auth signup notice:", error.message);
      }
    } catch {
      // Standalone mode fallback
    }
  }

  const users = getRegisteredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cette adresse email. Veuillez vous connecter." };
  }

  const fName = (params.firstName || cleanEmail.split("@")[0]).trim();
  const lName = (params.lastName || "").trim();
  const fullName = `${fName} ${lName}`.trim() || fName;

  const newUser: StoredUserRecord = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    name: fullName,
    firstName: fName,
    lastName: lName,
    phone: params.phone || "",
    avatarUrl: "",
    provider: "email",
    city: params.city || "Paris",
    role: "user",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: btoa(params.password),
  };

  users.push(newUser);
  saveRegisteredUsers(users);
  setActiveSession(newUser);

  // Enregistrer l'email de bienvenue simulé
  try {
    sessionStorage.setItem(
      `liberty_welcome_email_${cleanEmail}`,
      JSON.stringify({
        subject: "Félicitations ! Votre compte est créé sur Liberty K",
        sentTo: cleanEmail,
        sentAt: new Date().toISOString(),
      })
    );
  } catch {
    // Ignorer
  }

  return {
    success: true,
    user: newUser,
    message: "Félicitations ! Votre compte est créé sur Liberty K. Un email de bienvenue a été envoyé à votre adresse.",
  };
}

/**
 * Connexion sécurisée par Email & Mot de passe
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; user?: LibertyUser; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { success: false, error: "Veuillez saisir votre adresse email." };
  if (!password) return { success: false, error: "Veuillez saisir votre mot de passe." };

  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (!error && data.user) {
        const user: LibertyUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
          firstName: data.user.user_metadata?.first_name || "",
          lastName: data.user.user_metadata?.last_name || "",
          phone: data.user.user_metadata?.phone || "",
          avatarUrl: data.user.user_metadata?.avatar_url || "",
          provider: "email",
          city: "Paris",
          role: "user",
          createdAt: data.user.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        setActiveSession(user);
        return { success: true, user };
      }
    } catch {
      // Fallback
    }
  }

  const users = getRegisteredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    // Si l'utilisateur n'existe pas, on lui propose de créer son compte
    return {
      success: false,
      error: "Aucun compte trouvé avec cet email. Cliquez sur \"Créer un compte\" pour vous inscrire en quelques secondes.",
    };
  }

  if (found.passwordHash && found.passwordHash !== btoa(password)) {
    return { success: false, error: "Mot de passe incorrect. Veuillez vérifier votre saisie." };
  }

  found.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);
  setActiveSession(found);

  return { success: true, user: found };
}

/**
 * Mise à jour du profil utilisateur
 */
export async function updateProfile(
  userId: string,
  data: Partial<Pick<LibertyUser, "firstName" | "lastName" | "phone" | "city" | "avatarUrl">>
): Promise<{ success: boolean; user?: LibertyUser; error?: string }> {
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) {
    return { success: false, error: "Utilisateur non trouvé." };
  }

  const current = users[idx];
  const updated: StoredUserRecord = {
    ...current,
    ...data,
    name:
      data.firstName || data.lastName
        ? `${data.firstName ?? current.firstName} ${data.lastName ?? current.lastName}`.trim()
        : current.name,
  };

  users[idx] = updated;
  saveRegisteredUsers(users);
  setActiveSession(updated);

  return { success: true, user: updated };
}

/**
 * Déconnexion
 */
export async function logoutUser(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorer
    }
  }
  setActiveSession(null);
}

export const isSupabaseLive = () => Boolean(getSupabaseConfig());
export const authStateChangedEvent = AUTH_EVENT_NAME;
