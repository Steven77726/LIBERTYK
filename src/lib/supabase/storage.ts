"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function uploadLibertyImage(file: File, folder = "admin") {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { url: "", error: "Supabase n’est pas encore configuré." };
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("liberty-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return { url: "", error: error.message };
  const { data } = supabase.storage.from("liberty-images").getPublicUrl(path);
  return { url: data.publicUrl, error: "" };
}
