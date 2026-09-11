"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | null = null;

/**
 * Connexion à la base, côté navigateur.
 * Renvoie `null` tant que la base n'est pas configurée : l'appelant
 * bascule alors sur le stockage local de l'appareil.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
