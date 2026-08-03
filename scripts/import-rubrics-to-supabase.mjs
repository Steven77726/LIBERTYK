#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Variables manquantes : NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(1);
}

function extractField(block, field) {
  const match = block.match(new RegExp(`${field}:\\s*"([^"]*)"`, "m"));
  return match?.[1] ?? "";
}

const source = await readFile(resolve(process.cwd(), "src/data/categories.ts"), "utf8");
const blocks = [...source.matchAll(/\{\s*slug:\s*"[^"]*"[\s\S]*?\}/g)].map((match) => match[0]);

const payload = blocks
  .map((block, index) => {
    const slug = extractField(block, "slug");
    if (!slug) return null;
    return {
      external_id: slug,
      slug,
      name: extractField(block, "label") || slug,
      description: extractField(block, "description"),
      icon: extractField(block, "shortLabel") || extractField(block, "label") || slug,
      image_url: extractField(block, "image"),
      image_alt: extractField(block, "label") || slug,
      show_on_home: true,
      search_keywords: [],
      display_order: index + 1,
      display_format: "Carré standard",
      desktop_columns: 3,
      tablet_columns: 2,
      mobile_columns: 1,
      status: "published",
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };
  })
  .filter(Boolean);

const supabase = createClient(supabaseUrl, supabaseKey);
const { error } = await supabase.from("rubrics").upsert(payload, { onConflict: "external_id" });

if (error) {
  console.error(`Import rubriques échoué : ${error.message}`);
  process.exit(1);
}

console.log(`Import rubriques terminé : ${payload.length} rubrique(s) synchronisée(s).`);
