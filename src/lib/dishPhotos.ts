/**
 * Vraies photos de plats servis, via TheMealDB (base de recettes gratuite,
 * sans clé d'accès, photos dressées à l'assiette) — bien plus appétissantes
 * que l'image d'un article Wikipédia, qui montre souvent l'ingrédient cru.
 * Wikipédia ne sert plus qu'en dernier recours.
 */

import { findDishImage } from "./tak";

const MEALDB = "https://www.themealdb.com/api/json/v1/1";

interface MealDbMeal {
  strMeal: string;
  strMealThumb: string;
}

async function mealDb(path: string): Promise<MealDbMeal[]> {
  try {
    const response = await fetch(`${MEALDB}/${path}`, {
      signal: AbortSignal.timeout(5000),
      // Les mêmes recherches reviennent souvent : inutile de reposer la question chaque fois.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { meals?: MealDbMeal[] | null };
    return Array.isArray(data.meals) ? data.meals : [];
  } catch {
    return [];
  }
}

/** Petit hachage stable : un même plat garde la même photo d'une visite à l'autre. */
function pick<T>(items: T[], seed: string): T {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return items[hash % items.length];
}

/**
 * Photo d'un plat. `englishName` (ex. « pumpkin soup ») et `mainIngredient`
 * (ex. « chicken ») sont en anglais, la langue de TheMealDB.
 */
export async function findDishPhoto(input: {
  plat: string;
  englishName?: string | null;
  mainIngredient?: string | null;
}): Promise<string | null> {
  // 1. Le plat exact dans TheMealDB : une vraie photo dressée, du bon plat.
  const name = input.englishName?.trim();
  if (name) {
    const exact = await mealDb(`search.php?s=${encodeURIComponent(name)}`);
    if (exact.length > 0) return `${exact[0].strMealThumb}/medium`;
  }
  // 2. L'article Wikipédia du plat (poulet DG, ndolé… y sont bien illustrés).
  const wiki = await findDishImage(input.plat);
  if (wiki) return wiki;
  // 3. En dernier recours, un plat servi avec le même ingrédient principal.
  const ingredient = input.mainIngredient?.trim().toLowerCase().replace(/\s+/g, "_");
  if (ingredient) {
    const byIngredient = await mealDb(`filter.php?i=${encodeURIComponent(ingredient)}`);
    if (byIngredient.length > 0) return `${pick(byIngredient, input.plat).strMealThumb}/medium`;
  }
  return null;
}
