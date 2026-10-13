"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { toShoppingCandidate } from "@/lib/ingredients";
import type { NewShoppingItem } from "@/lib/useShoppingList";

/**
 * Choix des ingrédients à acheter : tout ce qu'il faut est coché, sauf ce
 * qu'on a en général au placard (sel, huile, épices…) et le facultatif.
 * On ajoute à la liste des produits (« Haricots rouges, 1 boîte »), pas des
 * lignes de recette (« 1 c. à c. de paprika »).
 */
export function IngredientPicker({
  ingredients,
  onAdd,
}: {
  ingredients: string[];
  onAdd: (items: NewShoppingItem[]) => void;
}) {
  const candidates = useMemo(() => ingredients.map(toShoppingCandidate), [ingredients]);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(candidates.flatMap((candidate, index) => (candidate.pantry || candidate.optional ? [] : [index]))),
  );

  const toBuy = candidates.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => !candidate.pantry);
  const pantry = candidates.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => candidate.pantry);

  function toggle(index: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function add() {
    onAdd(
      [...selected]
        .sort((a, b) => a - b)
        .map((index) => candidates[index])
        .map(({ label, quantity }) => ({ label, quantity })),
    );
  }

  function row({ candidate, index }: { candidate: (typeof candidates)[number]; index: number }) {
    const checked = selected.has(index);
    return (
      <li key={index}>
        <button
          type="button"
          onClick={() => toggle(index)}
          aria-pressed={checked}
          className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-cream"
        >
          <span
            aria-hidden
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
              checked ? "bg-forest text-white" : "border-2 border-line bg-surface"
            }`}
          >
            {checked ? <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-base font-medium text-ink">{candidate.label}</span>
            {candidate.quantity ? <span className="ml-2 text-sm text-ink-soft">{candidate.quantity}</span> : null}
            {candidate.optional ? <span className="ml-2 text-xs text-ink-faint">facultatif</span> : null}
          </span>
        </button>
      </li>
    );
  }

  return (
    <section className="rounded-card bg-surface p-5 sm:p-6" aria-labelledby="ingredients-courses">
      <h2 id="ingredients-courses" className="font-display text-xl font-medium text-ink">
        Qu&apos;est-ce qu&apos;il faut acheter ?
      </h2>
      <p className="mt-1 text-sm text-ink-soft">Touchez un ingrédient pour l&apos;ajouter ou le retirer.</p>

      {toBuy.length > 0 ? <ul className="mt-4 flex flex-col">{toBuy.map(row)}</ul> : null}

      {pantry.length > 0 ? (
        <>
          <h3 className="mt-5 text-sm font-medium text-ink-soft">Sûrement déjà au placard</h3>
          <ul className="mt-1 flex flex-col">{pantry.map(row)}</ul>
        </>
      ) : null}

      <button
        type="button"
        onClick={add}
        disabled={selected.size === 0}
        className="btn-pop btn-pop-coral mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 text-base disabled:opacity-50 sm:w-auto"
      >
        <Icon name="cart" className="h-5 w-5" />
        {selected.size === 0
          ? "Aucun ingrédient choisi"
          : `Ajouter ${selected.size} article${selected.size > 1 ? "s" : ""} à la liste`}
      </button>
    </section>
  );
}
