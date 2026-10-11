/**
 * Envies et format des idées de plats — partagé entre la page Recettes
 * (navigateur) et le serveur, sans rien tirer du SDK d'IA côté navigateur.
 */

import { z } from "zod";

/** Les envies proposées en filtre sur la page Recettes. */
export const CRAVINGS = {
  surprise: { emoji: "🎲", label: "Surprise", hint: "variés, de tous les jours" },
  rapide: { emoji: "⚡", label: "Rapide", hint: "prêts en 30 minutes maximum, un soir de semaine" },
  reconfortant: { emoji: "🍲", label: "Réconfortant", hint: "plats chauds et réconfortants de saison" },
  leger: { emoji: "🥗", label: "Léger", hint: "légers, avec des légumes" },
  vegetarien: { emoji: "🌱", label: "Végétarien", hint: "végétariens, sans viande ni poisson" },
  monde: { emoji: "🌍", label: "Du monde", hint: "de cuisines du monde (Afrique, Asie, Méditerranée…)" },
  weekend: { emoji: "👩🏾‍🍳", label: "Week-end", hint: "à cuisiner ensemble le week-end, avec Khloé" },
} as const;

export type Craving = keyof typeof CRAVINGS;

export const dishIdeaSchema = z.object({
  plat: z.string().describe("Nom court du plat, ex. « Gratin de courge et pommes de terre »"),
  emoji: z.string().describe("Un seul emoji qui représente le plat"),
  description: z.string().describe("Une phrase appétissante, 15 mots maximum"),
  duree: z.string().describe("Temps total, ex. « 30 min » ou « 1 h 15 »"),
});

export type DishIdea = z.infer<typeof dishIdeaSchema>;

/**
 * Idées toujours disponibles, pour que la page ne soit jamais vide si
 * l'IA ne répond pas (crédit du mois épuisé, réseau…).
 */
export const FALLBACK_IDEAS: DishIdea[] = [
  { plat: "Gratin de pâtes au jambon", emoji: "🧀", description: "Fondant et gratiné, le classique qui plaît à tout le monde.", duree: "35 min" },
  { plat: "Poulet rôti et pommes de terre", emoji: "🍗", description: "Un plat du dimanche simple, tout au four.", duree: "1 h 15" },
  { plat: "Soupe de potiron", emoji: "🎃", description: "Douce et veloutée, parfaite les soirs d'automne.", duree: "40 min" },
  { plat: "Poulet DG", emoji: "🍌", description: "Poulet, plantains mûrs et légumes sautés, en sauce.", duree: "1 h" },
  { plat: "Hachis parmentier", emoji: "🥔", description: "Purée maison et viande hachée, gratiné au four.", duree: "50 min" },
  { plat: "Riz sauté aux légumes et œuf", emoji: "🍚", description: "Rapide, coloré, idéal pour finir les restes.", duree: "20 min" },
  { plat: "Croque-monsieur et salade", emoji: "🥪", description: "Le dîner express des soirs pressés.", duree: "15 min" },
  { plat: "Lasagnes à la bolognaise", emoji: "🍝", description: "À préparer à l'avance, encore meilleures réchauffées.", duree: "1 h 30" },
  { plat: "Poisson pané maison et purée", emoji: "🐟", description: "Du vrai poisson croustillant que les enfants adorent.", duree: "30 min" },
  { plat: "Pizza maison à garnir ensemble", emoji: "🍕", description: "Chacun choisit sa garniture, Khloé comprise.", duree: "45 min" },
  { plat: "Ndolé", emoji: "🥬", description: "Feuilles amères, arachides et viande, plat de fête.", duree: "2 h" },
  { plat: "Omelette aux pommes de terre", emoji: "🍳", description: "Généreuse et dorée, prête en un rien de temps.", duree: "25 min" },
];

/** Six idées de secours, différentes de celles déjà affichées si possible. */
export function fallbackIdeas(exclude: string[] = []): DishIdea[] {
  const fresh = FALLBACK_IDEAS.filter((idea) => !exclude.includes(idea.plat));
  const pool = fresh.length >= 6 ? fresh : FALLBACK_IDEAS;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
}
