"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const SAFE_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

function getSafeImageExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (SAFE_IMAGE_EXTENSIONS.has(fromName)) return fromName;
  const fromMime = file.type.split("/").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (SAFE_IMAGE_EXTENSIONS.has(fromMime)) return fromMime;
  return "jpg";
}

function getUploadErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message;
  return "Erreur Supabase Storage inconnue.";
}

/**
 * Upload d'image vers Supabase Storage.
 *
 * Important : ne jamais retourner de data: URL ou blob: URL comme fallback.
 * Ces URL temporaires peuvent saturer localStorage et provoquer un crash client
 * complet sur GitHub Pages après un upload échoué.
 */
export async function uploadLibertyImage(file: File, folder = "admin"): Promise<{ url: string; error: string }> {
  if (!file.type.startsWith("image/")) {
    return { url: "", error: "Le fichier sélectionné n’est pas une image." };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { url: "", error: "Image trop lourde : utilisez une image de moins de 8 Mo." };
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { url: "", error: "Connexion Supabase requise pour envoyer une image." };
  }

  const extension = getSafeImageExtension(file);
  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "admin";
  const uploadPath = `${safeFolder}/${crypto.randomUUID()}.${extension}`;
  
  const { error } = await supabase.storage.from("liberty-images").upload(uploadPath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || `image/${extension}`,
  });

  if (error) {
    return { url: "", error: `Upload image impossible : ${getUploadErrorMessage(error)}` };
  }

  const { data } = supabase.storage.from("liberty-images").getPublicUrl(uploadPath);
  const cacheBustedUrl = `${data.publicUrl}?v=${Date.now()}`;
  return { url: cacheBustedUrl, error: "" };
}
