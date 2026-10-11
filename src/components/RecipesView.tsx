"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RecipeCard, type Recipe } from "./RecipeCard";
import { useSaveConfirmation } from "./SaveConfirmation";
import { useShoppingList } from "@/lib/useShoppingList";
import { useWeather } from "@/lib/useWeather";
import { todayKey } from "@/lib/dates";
import { describeWeather } from "@/lib/weather";
import { CRAVINGS, fallbackIdeas, type Craving, type DishIdea } from "@/lib/recipeIdeas";

const CRAVING_IDS = Object.keys(CRAVINGS) as Craving[];

/** Idées gardées le temps de la journée, pour ne pas tout redemander à chaque visite. */
const IDEAS_CACHE_KEY = "recettes:idees";

interface CachedIdeas {
  date: string;
  craving: Craving;
  ideas: DishIdea[];
}

function readCache(today: string): CachedIdeas | null {
  try {
    const raw = window.localStorage.getItem(IDEAS_CACHE_KEY);
    const cached = raw ? (JSON.parse(raw) as CachedIdeas) : null;
    return cached?.date === today && cached.ideas.length > 0 ? cached : null;
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
        });
        const data = (await response.json()) as { ok: boolean; ideas?: DishIdea[]; error?: string };
        if (!data.ok || !data.ideas?.length) {
          // Jamais de page vide : des idées classiques en attendant.
          setIdeas(fallbackIdeas(options.exclude));
          setIdeasError("Idées du moment indisponibles : voici quelques classiques en attendant.");
          return;
        }
        setIdeas(data.ideas);
        if (!options.ingredients) writeCache({ date: today, craving: options.craving, ideas: data.ideas });
      } catch {
        setIdeas(fallbackIdeas(options.exclude));
        setIdeasError("Idées du moment indisponibles : voici quelques classiques en attendant.");
      } finally {
        setIdeasLoading(false);
      }
    },
    [today, weather],
  );

  // Dès l'arrivée sur la page : les idées du jour (gardées en mémoire), ou de nouvelles.
  useEffect(() => {
    const cached = readCache(today);
    const timer = window.setTimeout(() => {
      if (cached) {
        setCraving(cached.craving);
        setIdeas(cached.ideas);
      } else {
        void loadIdeas({ craving: "surprise" });
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

  function addIngredientsToList() {
    if (!recipe) return;
    addItems(recipe.ingredients.map((label) => ({ label })));
    confirm({
      emoji: "🛒",
      title: "Ajouté à la liste",
      detail: `${recipe.ingredients.length} ingrédients pour « ${recipe.plat} »`,
    });
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          Idées de plats · recettes · courses
        </p>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">📖 Recettes</h1>
      </header>

      <section className="flex flex-col gap-4 rounded-card bg-sun-soft/70 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
              Qu&apos;est-ce qu&apos;on mange ?
            </h2>
            <p className="text-sm font-semibold text-ink-soft">
              Des idées de saison, à choisir selon l&apos;envie du jour.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadIdeas({ craving, ingredients: fridge || undefined, exclude: ideas.map((idea) => idea.plat) })}
            disabled={ideasLoading}
            className="min-h-11 rounded-pill bg-white px-4 text-sm font-extrabold text-ink hover:bg-cream disabled:opacity-40"
          >
            🔄 D&apos;autres idées
          </button>
        </div>

        <div className="scrollbar-soft -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {CRAVING_IDS.map((id) => {
            const selected = id === craving && !fridge;
            return (
              <button
                key={id}
                type="button"
                onClick={() => chooseCraving(id)}
                aria-pressed={selected}
                disabled={ideasLoading}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill px-4 text-sm font-extrabold transition-colors disabled:opacity-60 ${
                  selected ? "bg-ink text-white" : "bg-white text-ink hover:bg-cream"
                }`}
              >
                <span aria-hidden>{CRAVINGS[id].emoji}</span>
                {CRAVINGS[id].label}
              </button>
            );
          })}
        </div>

        <form onSubmit={searchFridge} className="flex gap-2">
          <input
            type="text"
            value={fridge}
            onChange={(changeEvent) => setFridge(changeEvent.target.value)}
            placeholder="J'ai dans le frigo : poulet, courgettes, riz…"
            aria-label="Ingrédients à utiliser"
            className="min-h-12 w-full flex-1 rounded-pill border border-line bg-white px-4 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-sun focus:ring-2 focus:ring-sun-soft"
          />
          <button
            type="submit"
            disabled={ideasLoading || !fridge.trim()}
            className="btn-pop btn-pop-sun min-h-12 shrink-0 px-5 text-sm disabled:pointer-events-none disabled:opacity-40"
          >
            Inspire-moi
          </button>
        </form>

        {ideasError ? (
          <p role="status" className="rounded-3xl bg-white/70 px-4 py-3 text-sm font-semibold text-ink-soft">
            {ideasError}
          </p>
        ) : null}

        <ul className="grid gap-3 sm:grid-cols-2" aria-busy={ideasLoading}>
          {ideasLoading
            ? Array.from({ length: 6 }, (_, index) => (
                <li key={index} aria-hidden className="h-24 animate-pulse rounded-3xl bg-white/60" />
              ))
            : ideas.map((idea) => (
                <li key={idea.plat}>
                  <button
                    type="button"
                    onClick={() => void openRecipe(idea.plat)}
                    disabled={recipeLoading !== null}
                    className="tile-pop flex h-full w-full items-start gap-3 rounded-3xl bg-white p-4 text-left disabled:opacity-60"
                  >
                    <span className="text-4xl leading-none" aria-hidden>
                      {idea.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-extrabold text-ink">{idea.plat}</span>
                      <span className="mt-0.5 block text-sm font-semibold text-ink-soft">
                        {idea.description}
                      </span>
                      <span className="mt-1.5 inline-block rounded-pill bg-cream-deep px-2.5 py-0.5 text-xs font-bold text-ink-soft">
                        ⏱️ {idea.duree}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
        </ul>
      </section>

      <div ref={recipeRef} className="scroll-mt-4 flex flex-col gap-3">
        {recipeLoading ? (
          <p role="status" className="rounded-card bg-white/70 px-5 py-4 text-sm font-bold text-ink-soft">
            👩🏾‍🍳 Je prépare la recette de « {recipeLoading} »…
          </p>
        ) : null}
        {recipeError ? (
          <p role="status" className="rounded-card bg-rose-soft px-5 py-4 text-sm font-semibold text-ink">
            {recipeError}
          </p>
        ) : null}
        {recipe ? (
          <>
            <RecipeCard recipe={recipe} />
            <button
              type="button"
              onClick={addIngredientsToList}
              className="btn-pop btn-pop-sage inline-flex min-h-12 items-center justify-center gap-2 self-start px-5 text-sm"
            >
              🛒 Ajouter les ingrédients à la liste de courses
            </button>
          </>
        ) : null}
      </div>

      <section className="rounded-card bg-lilac-soft/70 p-5 sm:p-6">
        <h2 className="mb-3 font-display text-xl font-bold text-ink sm:text-2xl">
          🔎 Une recette précise ?
        </h2>
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
            className="min-h-12 w-full flex-1 rounded-pill border border-line bg-white px-4 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-lilac focus:ring-2 focus:ring-lilac-soft"
          />
          <button
            type="submit"
            disabled={recipeLoading !== null || !query.trim()}
            className="btn-pop btn-pop-lilac min-h-12 shrink-0 px-5 text-sm disabled:pointer-events-none disabled:opacity-40"
          >
            Chercher
          </button>
        </form>
      </section>

      {confirmationDialog}
    </div>
  );
}
