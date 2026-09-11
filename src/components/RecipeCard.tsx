export interface Recipe {
  plat: string;
  ingredients: string[];
  etapes: string[];
  imageUrl: string | null;
  youtubeUrl: string;
}

/** Carte illustrée d'une recette trouvée (par Tak ou par la recherche sur la page Repas). */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-[0_3px_0_var(--color-line)]">
      {recipe.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- image externe (Wikimedia), domaine non prévisible
        <img src={recipe.imageUrl} alt={recipe.plat} className="h-40 w-full object-cover sm:h-48" />
      ) : (
        <div className="flex h-28 items-center justify-center bg-sun-soft text-6xl" aria-hidden>
          🍽️
        </div>
      )}
      <div className="p-4 sm:p-5">
        <p className="mb-3 font-display text-xl font-bold text-ink">{recipe.plat}</p>

        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
          Ingrédients
        </p>
        <ul className="mb-3 flex flex-col gap-1">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-start gap-2 text-sm font-semibold text-ink-soft">
              <span aria-hidden>•</span>
              {ingredient}
            </li>
          ))}
        </ul>

        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
          Étapes
        </p>
        <ol className="mb-4 flex flex-col gap-1.5">
          {recipe.etapes.map((etape, index) => (
            <li key={index} className="flex items-start gap-2 text-sm font-semibold text-ink-soft">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-deep text-[10px] font-extrabold text-ink">
                {index + 1}
              </span>
              {etape}
            </li>
          ))}
        </ol>

        {recipe.youtubeUrl ? (
          <a
            href={recipe.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-pop btn-pop-terracotta inline-flex min-h-10 items-center gap-2 px-4 text-xs"
          >
            ▶️ Vidéos sur YouTube
          </a>
        ) : null}
      </div>
    </div>
  );
}
