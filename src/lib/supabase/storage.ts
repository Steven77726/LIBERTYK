"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Lit un fichier localement sous forme de Data URL (base64) pour preview immédiate et persistance
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload d'image avec encodage binaire FormData/Storage, invalidation de cache (?v=timestamp) et fallback local résilient
 */
export async function uploadLibertyImage(file: File, folder = "admin"): Promise<{ url: string; error: string }> {
  let localDataUrl = "";
  try {
    localDataUrl = await fileToDataUrl(file);
  } catch {
    // fallback
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    // Mode local / hors-ligne : persistance directe via Data URL
    return { 
      url: localDataUrl || URL.createObjectURL(file), 
      error: "" 
    };
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  
  const { error } = await supabase.storage.from("liberty-images").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    // Fallback gracieux sur le Data URL local pour que l'admin ne soit jamais bloqué
    return { url: localDataUrl, error: "" };
  }

  const { data } = supabase.storage.from("liberty-images").getPublicUrl(path);
  const cacheBustedUrl = `${data.publicUrl}?v=${Date.now()}`;
  return { url: cacheBustedUrl, error: "" };
}
