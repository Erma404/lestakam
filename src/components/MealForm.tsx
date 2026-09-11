"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MEAL_MOMENT_LABEL, MEAL_MOMENTS } from "@/lib/meals";
import type { Meal } from "@/lib/types";
import type { NewMeal } from "@/lib/useMeals";

const EMOJI_CHOICES = ["🍗", "🐟", "🥗", "🍝", "🍲", "🥘", "🍕", "🥙", "🍳", "🍽️"];

interface MealFormProps {
  /** Repas à modifier ; absent pour une création. */
  meal?: Meal;
  defaultDate: string;
  defaultMoment?: Meal["moment"];
  onSave: (values: NewMeal) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function MealForm({
  meal,
  defaultDate,
  defaultMoment,
  onSave,
  onDelete,
  onClose,
}: MealFormProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(meal?.title ?? "");
  const [date, setDate] = useState(meal?.date ?? defaultDate);
  const [moment, setMoment] = useState<Meal["moment"]>(meal?.moment ?? defaultMoment ?? "soir");
  const [emoji, setEmoji] = useState(meal?.emoji ?? EMOJI_CHOICES[0]);
  const [notes, setNotes] = useState(meal?.notes ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    if (!title.trim()) {
      setError("Donnez un nom à ce repas.");
      return;
    }

    onSave({
      title: title.trim(),
      date,
      moment,
      emoji,
      notes: notes.trim() || undefined,
    });
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
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-extrabold tracking-tight text-ink">
            {meal ? "Modifier le repas" : "Nouveau repas"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl font-bold text-ink-soft hover:bg-cream-deep"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Quoi ?">
            <input
              type="text"
              value={title}
              onChange={(changeEvent) => setTitle(changeEvent.target.value)}
              placeholder="Gratin de pâtes"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Quel jour ?">
            <input
              type="date"
              value={date}
              onChange={(changeEvent) => setDate(changeEvent.target.value)}
              className={inputClass}
              required
            />
          </Field>

          <Group label="Midi ou soir ?">
            <div className="flex flex-wrap gap-2">
              {MEAL_MOMENTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMoment(value)}
                  aria-pressed={moment === value}
                  className={`min-h-11 rounded-pill border-2 px-4 text-sm font-bold ${
                    moment === value
                      ? "border-ink-faint bg-white text-ink"
                      : "border-line bg-white/60 text-ink-soft"
                  }`}
                >
                  {MEAL_MOMENT_LABEL[value]}
                </button>
              ))}
            </div>
          </Group>

          <Group label="Icône">
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEmoji(value)}
                  aria-pressed={emoji === value}
                  aria-label={`Choisir l'icône ${value}`}
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-2xl ${
                    emoji === value
                      ? "border-ink-faint bg-white"
                      : "border-line bg-white/60"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </Group>

          <Field label="Note (optionnel)">
            <textarea
              value={notes}
              onChange={(changeEvent) => setNotes(changeEvent.target.value)}
              rows={2}
              placeholder="Sans gluten pour Khloé"
              className={`${inputClass} resize-none`}
            />
          </Field>

          {error ? (
            <p role="alert" className="rounded-3xl bg-rose-soft px-4 py-3 text-sm font-bold text-ink">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              className="min-h-14 flex-1 rounded-pill bg-sage px-6 text-base font-extrabold text-white hover:brightness-95"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-14 rounded-pill bg-white px-6 text-base font-extrabold text-ink-soft hover:bg-cream-deep"
            >
              Annuler
            </button>
          </div>

          {onDelete ? (
            <div className="border-t border-line pt-4">
              {confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="flex-1 text-sm font-bold text-ink">
                    Supprimer « {meal?.title} » définitivement ?
                  </p>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="min-h-11 rounded-pill bg-terracotta px-5 text-sm font-extrabold text-white"
                  >
                    Oui, supprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="min-h-11 rounded-pill bg-white px-5 text-sm font-extrabold text-ink-soft"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="min-h-11 rounded-pill px-4 text-sm font-extrabold text-terracotta hover:bg-terracotta-soft"
                >
                  Supprimer ce repas
                </button>
              )}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "min-h-14 w-full rounded-3xl border border-line bg-white px-4 py-3 text-base font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-sage focus:ring-2 focus:ring-sage-soft";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}
