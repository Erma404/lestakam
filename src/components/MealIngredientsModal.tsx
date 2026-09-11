"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatLongDate, todayKey } from "@/lib/dates";
import type { TakAction } from "@/lib/tak";
import type { Meal } from "@/lib/types";

interface TakResponse {
  ok: boolean;
  action?: TakAction;
  ingredients?: string[];
  error?: string;
}

type Status = "loading" | "ready" | "not-found" | "error";

interface MealIngredientsModalProps {
  meal: Meal;
  /** Ajoute les libellés choisis (soit les ingrédients cochés, soit le nom du repas en repli). */
  onAdd: (labels: string[]) => void;
  onClose: () => void;
}

/**
 * Avant d'ajouter un repas planifié à la liste de courses, propose la
 * liste de ses ingrédients (trouvés comme pour une recherche de recette)
 * pour ne cocher que ce qui manque réellement à la maison.
 */
export function MealIngredientsModal({ meal, onAdd, onClose }: MealIngredientsModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Status>("loading");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function loadIngredients() {
      try {
        const today = todayKey();
        const response = await fetch("/api/tak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `trouve moi la recette de ${meal.title}`,
            today,
            weekday: formatLongDate(today),
          }),
        });
        const data = (await response.json()) as TakResponse;
        if (cancelled) return;

        if (!data.ok || data.action?.action !== "chercher_recette" || !data.ingredients?.length) {
          setStatus("not-found");
          return;
        }

        setIngredients(data.ingredients);
        setSelected(new Set(data.ingredients));
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void loadIngredients();
    return () => {
      cancelled = true;
    };
  }, [meal.title]);

  function toggle(ingredient: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(ingredient)) next.delete(ingredient);
      else next.add(ingredient);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => (current.size === ingredients.length ? new Set() : new Set(ingredients)));
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-card bg-cream p-5 shadow-xl sm:rounded-card sm:p-6"
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Liste de courses
            </p>
            <h2 id={titleId} className="truncate font-display text-xl font-bold text-ink sm:text-2xl">
              {meal.emoji} {meal.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-ink-soft hover:bg-cream-deep"
          >
            ✕
          </button>
        </header>

        {status === "loading" ? (
          <p className="rounded-3xl bg-white/70 px-4 py-6 text-center text-sm font-semibold text-ink-soft">
            Tak cherche les ingrédients de cette recette…
          </p>
        ) : null}

        {status === "not-found" || status === "error" ? (
          <div className="flex flex-col gap-3">
            <p className="rounded-3xl bg-white/70 px-4 py-4 text-sm font-semibold text-ink-soft">
              {status === "error"
                ? "Tak n'a pas pu joindre le serveur pour chercher les ingrédients."
                : "Recette introuvable pour ce repas."}{" "}
              On peut ajouter « {meal.title} » directement à la liste, à préciser vous-même.
            </p>
            <button
              type="button"
              onClick={() => onAdd([meal.title])}
              className="btn-pop btn-pop-sage min-h-12 w-full"
            >
              Ajouter « {meal.title} »
            </button>
          </div>
        ) : null}

        {status === "ready" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink-soft">
                Coche ce qu&apos;il te manque à la maison.
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="shrink-0 text-xs font-bold text-ink-soft underline hover:text-ink"
              >
                {selected.size === ingredients.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            <ul className="flex flex-col gap-1.5">
              {ingredients.map((ingredient) => {
                const checked = selected.has(ingredient);
                return (
                  <li key={ingredient}>
                    <button
                      type="button"
                      onClick={() => toggle(ingredient)}
                      aria-pressed={checked}
                      className="flex w-full items-start gap-3 rounded-3xl bg-white/80 px-4 py-2.5 text-left hover:bg-white"
                    >
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-sm ${
                          checked
                            ? "border-sage bg-sage text-white"
                            : "border-line bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="text-sm font-semibold text-ink">{ingredient}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => onAdd([...selected])}
              disabled={selected.size === 0}
              className="btn-pop btn-pop-sage mt-2 min-h-12 w-full disabled:pointer-events-none disabled:opacity-40"
            >
              Ajouter {selected.size > 0 ? `(${selected.size})` : ""} à la liste de courses
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
