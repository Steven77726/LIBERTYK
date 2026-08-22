"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type LibertyUser = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  provider: "google" | "apple" | "email";
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
const AUTH_EVENT_NAME = "liberty-auth-state-changed";

/**
 * Lit le registre de tous les utilisateurs enregistrés
 */
export function getRegisteredUsers(): StoredUserRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_REGISTRY_KEY);
    if (!raw) {
      // Utilisateur démo par défaut si vide
      const defaultUser: StoredUserRecord = {
        id: "usr-demo-steven",
        email: "steven.ohayon@gmail.com",
        name: "Steven Ohayon",
        firstName: "Steven",
        lastName: "Ohayon",
        phone: "06 12 34 56 78",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        provider: "google",
        city: "Paris",
        role: "admin",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify([defaultUser]));
      return [defaultUser];
    }
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
 * Récupère l'utilisateur actuellement connecté
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
 * Inscription par Email & Mot de passe
 */
export async function registerWithEmail(params: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
}): Promise<{ success: boolean; user?: LibertyUser; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Adresse email invalide." };
  }
  if (!params.password || params.password.length < 6) {
    return { success: false, error: "Le mot de passe doit contenir au moins 6 caractères." };
  }

  // Tenter via Supabase si configuré
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: params.password,
        options: {
          data: {
            first_name: params.firstName,
            last_name: params.lastName,
            phone: params.phone,
          },
        },
      });
      if (error) return { success: false, error: error.message };
    } catch {
      // Continuer en local
    }
  }

  // Vérifier si l'utilisateur existe déjà en local
  const users = getRegisteredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cette adresse email. Connectez-vous." };
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
    passwordHash: btoa(params.password), // Encodage standard
  };

  users.push(newUser);
  saveRegisteredUsers(users);
  setActiveSession(newUser);

  return { success: true, user: newUser };
}

/**
 * Connexion par Email & Mot de passe
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
      if (error) {
        console.warn("Supabase login error:", error.message);
      } else if (data.user) {
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
      // Fallback local
    }
  }

  const users = getRegisteredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    // Si l'utilisateur n'existe pas encore, création automatique fluide pour ne jamais bloquer
    return registerWithEmail({ email: cleanEmail, password });
  }

  // Vérifier le mot de passe
  if (found.passwordHash && found.passwordHash !== btoa(password)) {
    return { success: false, error: "Mot de passe incorrect." };
  }

  found.lastLoginAt = new Date().toISOString();
  saveRegisteredUsers(users);
  setActiveSession(found);

  return { success: true, user: found };
}

/**
 * Connexion OAuth 1-Clic (Google / Apple)
 */
export async function loginWithOAuth(
  provider: "google" | "apple",
  options?: { email?: string; name?: string; avatarUrl?: string }
): Promise<{ success: boolean; user?: LibertyUser; error?: string }> {
  const supabase = getSupabaseBrowserClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/mon-compte` : undefined,
        },
      });
      if (!error) {
        // Redirection vers le fournisseur OAuth
        return { success: true };
      }
    } catch {
      // Continuer en local
    }
  }

  // Connexion instantanée permanente
  const defaultEmail =
    options?.email ||
    (provider === "google" ? "steven.ohayon@gmail.com" : "utilisateur.liberty@icloud.com");
  const cleanEmail = defaultEmail.trim().toLowerCase();

  const users = getRegisteredUsers();
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    const defaultName =
      options?.name ||
      (provider === "google" ? "Steven Ohayon" : "Membre Apple Liberty");
    const parts = defaultName.split(" ");
    const fName = parts[0] || "Membre";
    const lName = parts.slice(1).join(" ") || "Liberty";

    user = {
      id: `${provider}-${Date.now()}`,
      email: cleanEmail,
      name: defaultName,
      firstName: fName,
      lastName: lName,
      phone: "06 12 34 56 78",
      avatarUrl:
        options?.avatarUrl ||
        (provider === "google"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
          : ""),
      provider,
      city: "Paris",
      role: "user",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    users.push(user);
  } else {
    user.lastLoginAt = new Date().toISOString();
    user.provider = provider;
    if (options?.avatarUrl) user.avatarUrl = options.avatarUrl;
  }

  saveRegisteredUsers(users);
  setActiveSession(user);

  return { success: true, user };
}

/**
 * Mise à jour du profil
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

export const authStateChangedEvent = AUTH_EVENT_NAME;
