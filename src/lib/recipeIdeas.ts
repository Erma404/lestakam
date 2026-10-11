/**
 * Envies et format des idées de plats — partagé entre la page Recettes
 * (navigateur) et le serveur, sans rien tirer du SDK d'IA côté navigateur.
 */

import { z } from "zod";

/** Les envies proposées en filtre sur la page Recettes. */
export const CRAVINGS = {
  surprise: { label: "Surprise", hint: "variés, de tous les jours" },
  rapide: { label: "Rapide", hint: "prêts en 30 minutes maximum, un soir de semaine" },
  reconfortant: { label: "Réconfortant", hint: "plats chauds et réconfortants de saison" },
  leger: { label: "Léger", hint: "légers, avec des légumes" },
  vegetarien: { label: "Végétarien", hint: "végétariens, sans viande ni poisson" },
  monde: { label: "Du monde", hint: "de cuisines du monde (Afrique, Asie, Méditerranée…)" },
  weekend: { label: "Week-end", hint: "à cuisiner ensemble le week-end, avec Khloé" },
} as const;

export type Craving = keyof typeof CRAVINGS;

export const dishIdeaSchema = z.object({
  plat: z.string().describe("Nom court du plat, ex. « Gratin de courge et pommes de terre »"),
  description: z.string().describe("Une phrase appétissante, 15 mots maximum"),
  duree: z.string().describe("Temps total, ex. « 30 min » ou « 1 h 15 »"),
  nomAnglais: z
    .string()
    .describe("Nom du plat en anglais, court et courant, ex. « pumpkin soup », pour trouver une photo"),
  ingredientAnglais: z.string().describe("Ingrédient principal en anglais, un mot, ex. « chicken »"),
});

/** Une idée de plat telle qu'affichée, avec sa photo. */
export type DishIdea = z.infer<typeof dishIdeaSchema> & { imageUrl?: string | null };


const WIKI = "https://upload.wikimedia.org/wikipedia/commons/thumb/";

function idea(plat: string, description: string, duree: string, imageUrl: string): DishIdea {
  return { plat, description, duree, imageUrl, nomAnglais: "", ingredientAnglais: "" };
}

/**
 * Idées toujours disponibles, pour que la page ne soit jamais vide si
 * l'IA ne répond pas (crédit du mois épuisé, réseau…).
 */
export const FALLBACK_IDEAS: DishIdea[] = [
  idea("Croque-monsieur et salade", "Le dîner express des soirs pressés.", "15 min", `${WIKI}d/db/Sandwich-Mixto.jpg/500px-Sandwich-Mixto.jpg`),
  idea("Lasagnes à la bolognaise", "À préparer à l'avance, encore meilleures réchauffées.", "1 h 30", `${WIKI}b/ba/Lasagne_-_stonesoup.jpg/500px-Lasagne_-_stonesoup.jpg`),
  idea("Poulet DG", "Poulet, plantains mûrs et légumes sautés, en sauce.", "1 h", `${WIKI}e/ed/Poulet_D.G_du_Chef_Alex_Bella_Ola.jpeg/500px-Poulet_D.G_du_Chef_Alex_Bella_Ola.jpeg`),
  idea("Ndolé", "Feuilles amères, arachides et viande, plat de fête.", "2 h", `${WIKI}9/91/Ndol%C3%A8_%C3%A0_la_viande%2C_morue_et_crevettes.jpg/500px-Ndol%C3%A8_%C3%A0_la_viande%2C_morue_et_crevettes.jpg`),
  idea("Pizza maison à garnir ensemble", "Chacun choisit sa garniture, Khloé comprise.", "45 min", `${WIKI}c/c8/Pizza_Margherita_stu_spivack.jpg/500px-Pizza_Margherita_stu_spivack.jpg`),
  idea("Omelette aux pommes de terre", "Généreuse et dorée, prête en un rien de temps.", "25 min", "https://upload.wikimedia.org/wikipedia/commons/5/5b/Tortilla-de-patatas.jpg"),
  idea("Soupe de potiron", "Douce et veloutée, parfaite les soirs d'automne.", "40 min", `${WIKI}f/fa/Pumpkin_Cream_Soup.jpg/500px-Pumpkin_Cream_Soup.jpg`),
  idea("Poulet rôti et pommes de terre", "Un plat du dimanche simple, tout au four.", "1 h 15", `${WIKI}d/d9/Max%27s_Roasted_Chicken_-_Evan_Swigart.jpg/500px-Max%27s_Roasted_Chicken_-_Evan_Swigart.jpg`),
  idea("Gratin de pâtes", "Fondant et gratiné, le classique qui plaît à tout le monde.", "35 min", `${WIKI}f/f9/Pasta_al_Forno_01.jpg/500px-Pasta_al_Forno_01.jpg`),
  idea("Hachis parmentier", "Purée maison et viande hachée, gratiné au four.", "50 min", "https://www.themealdb.com/images/media/meals/w8umt11583268117.jpg/medium"),
  idea("Gratin de poisson", "Poisson fondant sous une purée dorée.", "45 min", "https://www.themealdb.com/images/media/meals/ysxwuq1487323065.jpg/medium"),
];

/** Six idées de secours, différentes de celles déjà affichées si possible. */
export function fallbackIdeas(exclude: string[] = []): DishIdea[] {
  const fresh = FALLBACK_IDEAS.filter((idea) => !exclude.includes(idea.plat));
  const pool = fresh.length >= 6 ? fresh : FALLBACK_IDEAS;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, 6);
}
