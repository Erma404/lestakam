"use client";

import { useState } from "react";
import { RecipeCard, type Recipe } from "./RecipeCard";
import { formatLongDate, todayKey } from "@/lib/dates";
import type { TakAction } from "@/lib/tak";

interface TakResponse {
  ok: boolean;
  action?: TakAction;
  summary?: string;
  ingredients?: string[];
  etapes?: string[];
  imageUrl?: string | null;
  youtubeUrl?: string;
  error?: string;
}

/**
 * Point d'entrée visible pour chercher une recette (ingrédients, étapes,
 * photo, lien YouTube), sans passer par Tak — utilise la même recherche,
 * demandée en langage naturel derrière le rideau.
 */
export function RecipeSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function search(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    const plat = query.trim();
    if (!plat) return;

    setLoading(true);
    setError(null);
    setRecipe(null);
    try {
      const today = todayKey();
      const response = await fetch("/api/tak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `trouve moi la recette de ${plat}`,
          today,
          weekday: formatLongDate(today),
        }),
      });
      const data = (await response.json()) as TakResponse;

      if (!data.ok || data.action?.action !== "chercher_recette" || !data.ingredients || !data.etapes) {
        setError(data.error ?? "Aucune recette trouvée pour cette recherche.");
        return;
      }

      setRecipe({
        plat: data.action.plat,
        ingredients: data.ingredients,
        etapes: data.etapes,
        imageUrl: data.imageUrl ?? null,
        youtubeUrl: data.youtubeUrl ?? "",
      });
    } catch {
      setError("La recherche n'a pas pu joindre le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-card bg-lilac-soft/70 p-5 shadow-[0_3px_0_var(--color-line)] sm:p-6">
      <h2 className="mb-3 font-display text-xl font-bold text-ink sm:text-2xl">
        🔎 Chercher une recette
      </h2>
      <form onSubmit={search} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(changeEvent) => setQuery(changeEvent.target.value)}
          placeholder="Gratin aux pommes, tarte tatin…"
          className="min-h-12 w-full flex-1 rounded-pill border border-line bg-white px-4 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-lilac focus:ring-2 focus:ring-lilac-soft"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-pop btn-pop-lilac min-h-12 shrink-0 px-5 text-sm disabled:pointer-events-none disabled:opacity-40"
        >
          {loading ? "…" : "Chercher"}
        </button>
      </form>

      {error ? (
        <p role="status" className="mt-3 rounded-3xl bg-white/70 px-4 py-3 text-sm font-semibold text-ink-soft">
          {error}
        </p>
      ) : null}

      {recipe ? (
        <div className="mt-4">
          <RecipeCard recipe={recipe} />
        </div>
      ) : null}
    </section>
  );
}
