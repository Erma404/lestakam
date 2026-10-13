"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IngredientPicker } from "./IngredientPicker";
import { RecipeCard, type Recipe } from "./RecipeCard";
import { useSaveConfirmation } from "./SaveConfirmation";
import { Icon } from "./Icon";
import { useShoppingList, type NewShoppingItem } from "@/lib/useShoppingList";
import { useWeather } from "@/lib/useWeather";
import { startOfWeek, todayKey } from "@/lib/dates";
import { describeWeather } from "@/lib/weather";
import { CRAVINGS, fallbackIdeas, type Craving, type DishIdea } from "@/lib/recipeIdeas";

const CRAVING_IDS = Object.keys(CRAVINGS) as Craving[];

/**
 * Les idées de la semaine : gardées du lundi au dimanche, renouvelées
 * chaque lundi sans reprendre les plats de la semaine précédente.
 */
const IDEAS_CACHE_KEY = "recettes:idees-semaine";

interface CachedIdeas {
  /** Lundi de la semaine concernée, AAAA-MM-JJ. */
  week: string;
  craving: Craving;
  ideas: DishIdea[];
}

function readCache(): CachedIdeas | null {
  try {
    const raw = window.localStorage.getItem(IDEAS_CACHE_KEY);
    const cached = raw ? (JSON.parse(raw) as CachedIdeas) : null;
    return cached && cached.ideas.length > 0 ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(value: CachedIdeas) {
  try {
    window.localStorage.setItem(IDEAS_CACHE_KEY, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée…) : les idées seront simplement redemandées.
  }
}

/**
 * Page Recettes : des idées de plats de saison proposées d'emblée, filtrables
 * par envie ou par ce qu'il reste dans le frigo, puis la recette complète
 * d'un simple appui — avec l'envoi des ingrédients vers la liste de courses.
 */
export function RecipesView() {
  const today = todayKey();
  const week = startOfWeek(today);
  const { forecast } = useWeather();
  const { addItems } = useShoppingList();
  const { confirm, dialog: confirmationDialog } = useSaveConfirmation();

  const [craving, setCraving] = useState<Craving>("surprise");
  const [fridge, setFridge] = useState("");
  const [ideas, setIdeas] = useState<DishIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState<string | null>(null);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const recipeRef = useRef<HTMLDivElement>(null);

  const todayWeather = forecast?.days.find((day) => day.date === today);
  const weather = todayWeather
    ? `${Math.round(todayWeather.minTemp)}° à ${Math.round(todayWeather.maxTemp)}°, ${describeWeather(todayWeather.weatherCode).label.toLowerCase()}`
    : undefined;

  const loadIdeas = useCallback(
    async (options: { craving: Craving; ingredients?: string; exclude?: string[] }) => {
      setIdeasLoading(true);
      setIdeasError(null);
      try {
        const response = await fetch("/api/recettes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "idees", today, weather, ...options }),
          // Au-delà, les idées de secours s'affichent plutôt qu'un chargement sans fin.
          signal: AbortSignal.timeout(25_000),
        });
        const data = (await response.json()) as { ok: boolean; ideas?: DishIdea[]; error?: string };
        if (!data.ok || !data.ideas?.length) {
          // Jamais de page vide : des idées classiques en attendant.
          setIdeas(fallbackIdeas(options.exclude));
          setIdeasError("Idées du moment indisponibles : voici quelques classiques en attendant.");
          return;
        }
        setIdeas(data.ideas);
        if (!options.ingredients) writeCache({ week, craving: options.craving, ideas: data.ideas });
      } catch {
        setIdeas(fallbackIdeas(options.exclude));
        setIdeasError("Idées du moment indisponibles : voici quelques classiques en attendant.");
      } finally {
        setIdeasLoading(false);
      }
    },
    [today, week, weather],
  );

  // Dès l'arrivée sur la page : les idées de la semaine, ou de nouvelles le lundi.
  useEffect(() => {
    const cached = readCache();
    const timer = window.setTimeout(() => {
      if (cached && cached.week === week) {
        setCraving(cached.craving);
        setIdeas(cached.ideas);
      } else {
        void loadIdeas({ craving: "surprise", exclude: cached?.ideas.map((idea) => idea.plat) });
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // Une seule fois par visite : la météo arrive ensuite et ne doit pas tout relancer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseCraving(next: Craving) {
    setCraving(next);
    setFridge("");
    void loadIdeas({ craving: next });
  }

  function searchFridge(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!fridge.trim()) return;
    void loadIdeas({ craving, ingredients: fridge });
  }

  async function openRecipe(plat: string) {
    const name = plat.trim();
    if (!name) return;
    setRecipeLoading(name);
    setRecipeError(null);
    setRecipe(null);
    window.setTimeout(() => recipeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    try {
      const response = await fetch("/api/recettes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "recette", plat: name }),
      });
      const data = (await response.json()) as { ok: boolean; recipe?: Recipe; error?: string };
      if (!data.ok || !data.recipe) {
        setRecipeError(data.error ?? "Aucune recette trouvée pour ce plat.");
        return;
      }
      setRecipe(data.recipe);
    } catch {
      setRecipeError("La recette n'a pas pu être chargée.");
    } finally {
      setRecipeLoading(null);
    }
  }

  function addIngredientsToList(items: NewShoppingItem[]) {
    if (!recipe) return;
    addItems(items);
    confirm({
      title: "Ajouté à la liste",
      detail: `${items.length} article${items.length > 1 ? "s" : ""} pour « ${recipe.plat} »`,
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header>
        <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">Qu&apos;est-ce qu&apos;on mange ?</h1>
        <p className="mt-1 text-base text-ink-soft">Les idées de la semaine, renouvelées chaque lundi.</p>
      </header>

      <form onSubmit={searchFridge} className="relative">
        <input
          type="text"
          value={fridge}
          onChange={(changeEvent) => setFridge(changeEvent.target.value)}
          placeholder="J'ai dans le frigo : poulet, courgettes, riz…"
          aria-label="Ingrédients à utiliser"
          className="min-h-14 w-full rounded-pill bg-surface pl-12 pr-32 text-base text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-coral/40"
        />
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-coral" />
        <button
          type="submit"
          disabled={ideasLoading || !fridge.trim()}
          className="btn-pop btn-pop-coral absolute right-1.5 top-1/2 min-h-11 -translate-y-1/2 px-5 text-sm disabled:pointer-events-none disabled:opacity-40"
        >
          Inspire-moi
        </button>
      </form>

      <div className="scrollbar-soft -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Envie du jour">
        {CRAVING_IDS.map((id) => {
          const selected = id === craving && !fridge;
          return (
            <button
              key={id}
              type="button"
              onClick={() => chooseCraving(id)}
              aria-pressed={selected}
              disabled={ideasLoading}
              className={`min-h-11 shrink-0 rounded-pill px-4 text-sm font-medium transition-colors disabled:opacity-60 ${
                selected ? "bg-forest text-white" : "bg-surface text-ink hover:bg-cream-deep"
              }`}
            >
              {CRAVINGS[id].label}
            </button>
          );
        })}
      </div>

      <section aria-labelledby="idees-titre" className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 id="idees-titre" className="font-display text-xl font-medium text-ink">
            {ideasLoading ? "Je cherche des idées…" : `${ideas.length} idées cette semaine`}
          </h2>
          <button
            type="button"
            onClick={() =>
              void loadIdeas({ craving, ingredients: fridge || undefined, exclude: ideas.map((idea) => idea.plat) })
            }
            disabled={ideasLoading}
            className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-coral hover:underline disabled:opacity-40"
          >
            D&apos;autres idées <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>

        {ideasError ? <p role="status" className="text-sm text-ink-soft">{ideasError}</p> : null}

        <ul className="grid gap-x-6 rounded-card bg-surface px-4 sm:grid-cols-2 sm:px-6" aria-busy={ideasLoading}>
          {ideasLoading
            ? Array.from({ length: 6 }, (_, index) => (
                <li key={index} aria-hidden className="flex items-center gap-4 border-b border-dashed border-line py-4">
                  <span className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-cream-deep" />
                  <span className="flex flex-1 flex-col gap-2">
                    <span className="h-4 w-3/4 animate-pulse rounded-pill bg-cream-deep" />
                    <span className="h-3 w-1/2 animate-pulse rounded-pill bg-cream-deep" />
                  </span>
                </li>
              ))
            : ideas.map((idea) => (
                <li key={idea.plat} className="border-b border-dashed border-line">
                  <button
                    type="button"
                    onClick={() => void openRecipe(idea.plat)}
                    disabled={recipeLoading !== null}
                    className="tile-pop flex w-full items-center gap-4 py-4 text-left disabled:opacity-60"
                  >
                    <DishPhoto src={idea.imageUrl} alt={idea.plat} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-medium leading-snug text-ink">{idea.plat}</span>
                      <span className="mt-1 block text-sm leading-snug text-ink-soft">{idea.description}</span>
                      <span className="mt-2 inline-flex items-center gap-1 text-sm text-ink-soft">
                        <Icon name="clock" className="h-4 w-4 text-coral" />
                        {idea.duree}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
        </ul>
      </section>

      <div ref={recipeRef} className="scroll-mt-4 flex flex-col gap-3">
        {recipeLoading ? (
          <p role="status" className="rounded-card bg-surface px-5 py-4 text-sm font-medium text-ink-soft">
            Je prépare la recette de « {recipeLoading} »…
          </p>
        ) : null}
        {recipeError ? (
          <p role="status" className="rounded-card bg-coral-soft px-5 py-4 text-sm font-medium text-ink">
            {recipeError}
          </p>
        ) : null}
        {recipe ? (
          <>
            <RecipeCard recipe={recipe} />
            <IngredientPicker key={recipe.plat} ingredients={recipe.ingredients} onAdd={addIngredientsToList} />
          </>
        ) : null}
      </div>

      <section className="rounded-card bg-surface p-5 sm:p-6">
        <h2 className="mb-3 font-display text-xl font-medium text-ink">Une recette précise ?</h2>
        <form
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            void openRecipe(query);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(changeEvent) => setQuery(changeEvent.target.value)}
            placeholder="Gratin aux pommes, poulet DG, tarte tatin…"
            aria-label="Plat à chercher"
            className="min-h-12 w-full flex-1 rounded-pill bg-surface px-4 text-sm font-medium text-ink outline-none placeholder:text-ink-faint focus:border-coral focus:ring-2 focus:ring-coral/30"
          />
          <button
            type="submit"
            disabled={recipeLoading !== null || !query.trim()}
            className="btn-pop btn-pop-coral min-h-12 shrink-0 px-5 text-sm disabled:pointer-events-none disabled:opacity-40"
          >
            Chercher
          </button>
        </form>
      </section>

      {confirmationDialog}
    </div>
  );
}

/** Photo ronde du plat, façon assiette vue du dessus ; un aplat neutre si aucune photo. */
function DishPhoto({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <span aria-hidden className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-cream-deep text-ink-faint">
        <Icon name="recipes" className="h-8 w-8" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- photos externes (TheMealDB, Wikimedia)
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-24 w-24 shrink-0 rounded-full bg-cream-deep object-cover"
    />
  );
}
