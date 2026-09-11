"use client";

import { RecipeSearch } from "./RecipeSearch";

/** Page dédiée à la recherche de recettes : ingrédients, étapes, photo, vidéo. */
export function RecipesView() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          Ingrédients · étapes · photo · vidéo
        </p>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">📖 Recettes</h1>
      </header>

      <RecipeSearch />
    </div>
  );
}
