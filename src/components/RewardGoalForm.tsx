"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { RewardGoal } from "@/lib/types";
import type { NewRewardGoal } from "@/lib/useRewardGoals";

const EMOJI_CHOICES = ["🛝", "🍿", "🎁", "🎨", "🚲", "🍦", "🏊", "🎡", "📚", "🧸"];

interface RewardGoalFormProps {
  /** Objectif à modifier ; absent pour une création. */
  goal?: RewardGoal;
  memberId: string;
  onSave: (values: NewRewardGoal) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function RewardGoalForm({ goal, memberId, onSave, onDelete, onClose }: RewardGoalFormProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState(goal?.label ?? "");
  const [emoji, setEmoji] = useState(goal?.emoji ?? EMOJI_CHOICES[0]);
  const [starsRequired, setStarsRequired] = useState(String(goal?.starsRequired ?? 20));
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

    if (!label.trim()) {
      setError("Donnez un nom à cette récompense.");
      return;
    }
    const stars = Number(starsRequired);
    if (!Number.isFinite(stars) || stars <= 0) {
      setError("Le nombre d'étoiles doit être supérieur à zéro.");
      return;
    }

    onSave({
      memberId,
      label: label.trim(),
      emoji,
      starsRequired: Math.round(stars),
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
        className="w-full max-w-md overflow-y-auto rounded-t-card bg-cream p-5 shadow-xl sm:rounded-card sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-extrabold tracking-tight text-ink">
            {goal ? "Modifier l'objectif" : "Nouvel objectif"}
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
          <Field label="Quelle récompense ?">
            <input
              type="text"
              value={label}
              onChange={(changeEvent) => setLabel(changeEvent.target.value)}
              placeholder="Après-midi au parc"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Étoiles nécessaires">
            <input
              type="number"
              min={1}
              value={starsRequired}
              onChange={(changeEvent) => setStarsRequired(changeEvent.target.value)}
              className={inputClass}
              required
            />
          </Field>

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
                    emoji === value ? "border-ink-faint bg-white" : "border-line bg-white/60"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </Group>

          {error ? (
            <p role="alert" className="rounded-3xl bg-rose-soft px-4 py-3 text-sm font-bold text-ink">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              className="min-h-14 flex-1 btn-pop btn-pop-sage px-6 text-base font-extrabold "
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
                    Supprimer « {goal?.label} » définitivement ?
                  </p>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="min-h-11 btn-pop btn-pop-terracotta px-5 text-sm font-extrabold "
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
                  Supprimer cet objectif
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
