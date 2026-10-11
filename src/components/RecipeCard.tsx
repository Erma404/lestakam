export interface Recipe {
  plat: string;
  portions?: number;
  /** Estimation par portion. */
  nutrition?: {
    calories: number;
    proteines: number;
    glucides: number;
    lipides: number;
    fibres: number;
  };
  ingredients: string[];
  etapes: string[];
  imageUrl: string | null;
  youtubeUrl: string;
}

/** Carte illustrée d'une recette trouvée (par Tak ou depuis la page Recettes). */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="overflow-hidden rounded-card bg-surface">
      {recipe.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- image externe (Wikimedia), domaine non prévisible
        <img src={recipe.imageUrl} alt={recipe.plat} className="h-56 w-full object-cover sm:h-72" />
      ) : (
        <div className="h-28 bg-cream-deep" aria-hidden />
      )}
      <div className="p-4 sm:p-5">
        <p className="font-display text-2xl font-medium text-ink">{recipe.plat}</p>
        {recipe.portions ? (
          <p className="text-sm text-ink-soft">Pour {recipe.portions} personnes</p>
        ) : null}

        {recipe.nutrition ? (
          <section aria-label="Valeurs nutritionnelles" className="mt-4">
            <dl className="grid grid-cols-5 divide-x divide-line rounded-2xl bg-cream py-3 text-center">
              <NutritionValue label="Calories" value={`${Math.round(recipe.nutrition.calories)}`} unit="kcal" />
              <NutritionValue label="Protéines" value={`${Math.round(recipe.nutrition.proteines)}`} unit="g" />
              <NutritionValue label="Glucides" value={`${Math.round(recipe.nutrition.glucides)}`} unit="g" />
              <NutritionValue label="Lipides" value={`${Math.round(recipe.nutrition.lipides)}`} unit="g" />
              <NutritionValue label="Fibres" value={`${Math.round(recipe.nutrition.fibres)}`} unit="g" />
            </dl>
            <p className="mt-1.5 text-xs text-ink-faint">Par portion adulte, valeurs estimées.</p>
          </section>
        ) : null}

        <p className="mb-1.5 mt-5 text-sm font-medium text-ink">Ingrédients</p>
        <ul className="mb-3 flex flex-col gap-1">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-start gap-2 text-sm font-medium text-ink-soft">
              <span aria-hidden>•</span>
              {ingredient}
            </li>
          ))}
        </ul>

        <p className="mb-1.5 text-sm font-medium text-ink">Étapes</p>
        <ol className="mb-4 flex flex-col gap-1.5">
          {recipe.etapes.map((etape, index) => (
            <li key={index} className="flex items-start gap-2 text-sm font-medium text-ink-soft">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-deep text-xs font-semibold text-ink">
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
            className="btn-pop btn-pop-coral inline-flex min-h-10 items-center gap-2 px-4 text-xs"
          >
            Voir des vidéos sur YouTube
          </a>
        ) : null}
      </div>
    </div>
  );
}

function NutritionValue({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="px-1">
      <dd className="text-lg font-medium leading-tight text-ink tabular-nums">
        {value}
        <span className="ml-0.5 text-xs text-ink-soft">{unit}</span>
      </dd>
      <dt className="text-xs text-ink-soft">{label}</dt>
    </div>
  );
}
