/**
 * Coordonnées du projet Supabase.
 *
 * Elles sont lues dans les variables d'environnement, jamais écrites dans
 * le code : en développement dans le fichier `.env.local` (ignoré par git),
 * et en ligne dans les réglages du projet sur Vercel.
 *
 * Tant qu'elles sont absentes, l'application fonctionne en mode local :
 * les données restent sur l'appareil. Cela permet de la faire tourner
 * avant la connexion de la base, sans jamais afficher d'erreur.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

/**
 * Clé publique, prévue pour être envoyée au navigateur. Ce n'est pas un
 * secret : l'accès aux données est contrôlé par les règles de sécurité
 * définies dans `supabase/01-structure.sql`.
 */
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Vrai lorsque la base de données partagée est configurée. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
