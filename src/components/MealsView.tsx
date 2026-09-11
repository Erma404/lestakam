"use client";

import { useMemo, useState } from "react";
import { Card } from "./Card";
import { MealForm } from "./MealForm";
import { MEAL_MOMENT_LABEL, MEAL_MOMENTS, mealFor, mealsForDay } from "@/lib/meals";
import { useMeals, type NewMeal } from "@/lib/useMeals";
import { useShoppingList } from "@/lib/useShoppingList";
import { useNow } from "@/lib/useNow";
import { addDays, formatLongDate, formatRelativeDay, todayKey } from "@/lib/dates";
import type { Meal } from "@/lib/types";

/** Une semaine de menus à la fois. */
const HORIZON = 7;

interface MealsViewProps {
  initialIso: string;
}

export function MealsView({ initialIso }: MealsViewProps) {
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);

  const { meals, addMeal, updateMeal, deleteMeal } = useMeals();
  const { addItem } = useShoppingList();

  const [editing, setEditing] = useState<Meal | null>(null);
  const [creating, setCreating] = useState<{ date: string; moment: Meal["moment"] } | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const week = useMemo(
    () => Array.from({ length: HORIZON }, (_, index) => addDays(today, index)),
    [today],
  );

  function announce(message: string) {
    setConfirmation(message);
    window.setTimeout(() => setConfirmation(null), 4000);
  }

  function handleSave(values: NewMeal) {
    if (editing) {
      updateMeal(editing.id, values);
      announce(`« ${values.title} » a été modifié.`);
    } else {
      addMeal(values);
      announce(`« ${values.title} » a été ajouté au menu.`);
    }
    setEditing(null);
    setCreating(null);
  }

  function handleDelete() {
    if (!editing) return;
    deleteMeal(editing.id);
    announce(`« ${editing.title} » a été retiré du menu.`);
    setEditing(null);
  }

  function sendToShoppingList(meal: Meal) {
    addItem({ label: meal.title, fromMealId: meal.id });
    announce(`« ${meal.title} » a été ajouté à la liste de courses.`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          Les 7 prochains jours
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          🍽️ Repas
        </h1>
      </header>

      {confirmation ? (
        <p role="status" className="rounded-card bg-sage-soft px-5 py-3 text-sm font-bold text-ink">
          {confirmation}
        </p>
      ) : null}

      {week.map((date) => {
        const dayMeals = mealsForDay(meals, date);
        return (
          <Card key={date}>
            <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-ink">
                {formatRelativeDay(date, today)}
              </h2>
              <p className="text-xs font-semibold text-ink-faint">{formatLongDate(date)}</p>
            </header>

            <div className="grid gap-3 sm:grid-cols-2">
              {MEAL_MOMENTS.map((moment) => {
                const meal = mealFor(dayMeals, date, moment);
                return (
                  <div key={moment} className="flex flex-col gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                      {MEAL_MOMENT_LABEL[moment]}
                    </p>
                    {meal ? (
                      <div className="rounded-3xl border border-line bg-white px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setEditing(meal)}
                          className="flex w-full items-center gap-3 text-left"
                        >
                          <span className="text-2xl" aria-hidden>
                            {meal.emoji}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-extrabold text-ink">
                              {meal.title}
                            </span>
                            {meal.notes ? (
                              <span className="block truncate text-xs font-semibold text-ink-faint">
                                {meal.notes}
                              </span>
                            ) : null}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => sendToShoppingList(meal)}
                          className="mt-2 min-h-9 w-full rounded-pill bg-cream-deep px-3 text-xs font-bold text-ink-soft hover:bg-cream"
                        >
                          🛒 Ajouter à la liste de courses
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCreating({ date, moment })}
                        className="min-h-14 w-full rounded-3xl border-2 border-dashed border-line text-sm font-bold text-ink-soft hover:bg-cream-deep/60"
                      >
                        ＋ Planifier
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {editing || creating ? (
        <MealForm
          meal={editing ?? undefined}
          defaultDate={editing?.date ?? creating?.date ?? today}
          defaultMoment={editing?.moment ?? creating?.moment}
          onSave={handleSave}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => {
            setEditing(null);
            setCreating(null);
          }}
        />
      ) : null}
    </div>
  );
}
