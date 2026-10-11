/**
 * Recettes et idées de plats, générées côté serveur (AI Gateway) — partagé
 * par Tak et la page Recettes.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { recipeSchema, youtubeSearchUrl } from "./tak";
import { findDishPhoto } from "./dishPhotos";
import { CRAVINGS, dishIdeaSchema, type Craving, type DishIdea } from "./recipeIdeas";

export { CRAVINGS, type Craving, type DishIdea };

/** Seul modèle autorisé au palier gratuit d'AI Gateway (voir api/tak). */
export const RECIPE_MODEL = "openai/gpt-5.4-nano";

export interface Nutrition {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  fibres: number;
}

export interface FullRecipe {
  plat: string;
  portions?: number;
  /** Estimation par portion, calculée par l'IA à partir des quantités. */
  nutrition?: Nutrition;
  ingredients: string[];
  etapes: string[];
  imageUrl: string | null;
  youtubeUrl: string;
}

/** Recette complète d'un plat : ingrédients, étapes, photo et lien vidéo. */
export async function buildRecipe(plat: string): Promise<FullRecipe> {
  const { object: recipe } = await generateObject({
    model: RECIPE_MODEL,
    schema: recipeSchema.extend({
      nomAnglais: z.string().describe("Nom du plat en anglais, court, pour trouver une photo"),
      ingredientAnglais: z.string().describe("Ingrédient principal en anglais, un mot"),
    }),
    system:
      "Tu donnes une recette simple et familiale, en français, pour une famille avec un " +
      "jeune enfant, pour 3 portions (2 adultes et une enfant de 5 ans). Des ingrédients " +
      "courants avec leurs quantités, une préparation qui reste accessible. " +
      "Respecte la recette traditionnelle du plat demandé (ex. le poulet DG se fait avec " +
      "des plantains mûrs).",
    prompt: `Recette : ${plat}`,
  });
  const imageUrl = await findDishPhoto({
    plat,
    englishName: recipe.nomAnglais,
    mainIngredient: recipe.ingredientAnglais,
  });
  return {
    plat,
    portions: recipe.portions,
    nutrition: recipe.nutrition,
    ingredients: recipe.ingredients,
    etapes: recipe.etapes,
    imageUrl,
    youtubeUrl: youtubeSearchUrl(plat),
  };
}

/** Nom du mois, pour des idées de saison. */
function monthName(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date(`${date}T12:00:00`));
}

/** Six idées de plats de saison, adaptées à une famille avec une enfant de 5 ans. */
export async function suggestDishes(input: {
  today: string;
  craving: Craving;
  /** Ingrédients que la famille a sous la main, optionnel. */
  ingredients?: string;
  /** Plats déjà proposés, à ne pas répéter quand on demande « d'autres idées ». */
  exclude?: string[];
  /** Météo du jour en clair, ex. « 12° à 17°, pluie ». */
  weather?: string;
}): Promise<DishIdea[]> {
  const { object } = await generateObject({
    model: RECIPE_MODEL,
    schema: z.object({ idees: z.array(dishIdeaSchema) }),
    system:
      "Tu proposes des idées de plats faits maison à une famille (deux parents et leur fille de " +
      "5 ans) qui vit en région parisienne. Des plats variés et concrets, avec des produits de " +
      "saison faciles à trouver en supermarché, que l'enfant aura envie de manger. Réponds en " +
      "français, sans répéter deux fois le même type de plat.",
    prompt: [
      `Nous sommes en ${monthName(input.today)}.`,
      input.weather ? `Météo du jour : ${input.weather}.` : "",
      `Propose exactement 6 idées de plats ${CRAVINGS[input.craving].hint}.`,
      input.ingredients?.trim()
        ? `Chaque plat doit utiliser surtout ces ingrédients, déjà à la maison : ${input.ingredients.trim()}.`
        : "",
      input.exclude?.length ? `Ne propose aucun de ces plats : ${input.exclude.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
  const ideas = object.idees.slice(0, 6);
  const photos = await Promise.all(
    ideas.map((idea) =>
      findDishPhoto({ plat: idea.plat, englishName: idea.nomAnglais, mainIngredient: idea.ingredientAnglais }),
    ),
  );
  return ideas.map((idea, index) => ({ ...idea, imageUrl: photos[index] }));
}
