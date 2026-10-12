"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";
import { TimePicker } from "./TimePicker";
import type { MomentOfDay, Ritual } from "@/lib/types";
import type { NewRitual } from "@/lib/useRituals";

/** Vignettes proposées pour un rituel : Khloé commence à lire, l'image l'aide à s'y retrouver. */
const PICTO_CHOICES = [
  "🪥", "🧼", "👗", "🎒", "⏰", "📵", "📚", "📖", "🍎", "🧸",
  "🚿", "🌙", "🛏️", "🥦", "💧", "🎹", "✏️", "🧩", "🐶", "🌱",
];

const MOMENTS: { id: MomentOfDay; label: string }[] = [
  { id: "matin", label: "Matin" },
  { id: "apres-midi", label: "Après-midi" },
  { id: "soir", label: "Soir" },
];

/** Lundi en premier, comme dans un agenda français. */
const WEEKDAYS = [
  { day: 1, short: "L", long: "Lundi" },
  { day: 2, short: "M", long: "Mardi" },
  { day: 3, short: "M", long: "Mercredi" },
  { day: 4, short: "J", long: "Jeudi" },
  { day: 5, short: "V", long: "Vendredi" },
  { day: 6, short: "S", long: "Samedi" },
  { day: 0, short: "D", long: "Dimanche" },
];

const ALL_DAYS = WEEKDAYS.map((item) => item.day);

interface RitualFormProps {
  /** Rituel à modifier ; absent pour une création. */
  ritual?: Ritual;
  onSave: (values: NewRitual) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** Ajout ou modification d'un rituel (ou challenge) de Khloé, depuis les réglages. */
export function RitualForm({ ritual, onSave, onDelete, onClose }: RitualFormProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState(ritual?.label ?? "");
  const [emoji, setEmoji] = useState(ritual?.emoji ?? PICTO_CHOICES[0]);
  const [moment, setMoment] = useState<MomentOfDay>(ritual?.moment ?? "matin");
  const [time, setTime] = useState(ritual?.time ?? "");
  const [days, setDays] = useState<number[]>(ritual?.days?.length ? ritual.days : ALL_DAYS);
  const [stars, setStars] = useState(ritual?.stars ?? 1);
  const [needsParentApproval, setNeedsParentApproval] = useState(ritual?.needsParentApproval ?? true);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pictos = PICTO_CHOICES.includes(emoji) ? PICTO_CHOICES : [emoji, ...PICTO_CHOICES];

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

  function toggleDay(day: number) {
    setDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!label.trim()) {
      setError("Donnez un nom à ce rituel.");
      return;
    }
    if (days.length === 0) {
      setError("Choisissez au moins un jour.");
      return;
    }
    onSave({
      label: label.trim(),
      emoji,
      moment,
      time: time || undefined,
      stars,
      needsParentApproval,
      // Tous les jours cochés : on ne garde pas de liste, le rituel vaut chaque jour.
      days: days.length === 7 ? undefined : [...days].sort(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/30 p-0 sm:items-center sm:p-6"
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
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-card bg-cream p-5 sm:rounded-card sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-medium tracking-tight text-ink">
            {ritual ? "Modifier le rituel" : "Nouveau rituel"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink-soft hover:bg-cream-deep"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Quel rituel ou challenge ?</span>
            <input
              type="text"
              value={label}
              onChange={(changeEvent) => setLabel(changeEvent.target.value)}
              placeholder="Réveil sans écran"
              className={inputClass}
              required
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Image</legend>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
              {pictos.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEmoji(value)}
                  aria-pressed={emoji === value}
                  aria-label={`Choisir l'image ${value}`}
                  className={`flex aspect-square items-center justify-center rounded-2xl text-2xl transition-colors ${
                    emoji === value ? "bg-forest" : "bg-surface hover:bg-cream-deep"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">Quand ?</legend>
            <div className="flex gap-2">
              {MOMENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMoment(item.id)}
                  aria-pressed={moment === item.id}
                  className={`min-h-11 flex-1 rounded-pill text-sm font-medium transition-colors ${
                    moment === item.id ? "bg-forest text-white" : "bg-surface text-ink hover:bg-cream-deep"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div className="flex flex-col gap-1.5">
              <span id={`${titleId}-heure`} className="text-sm font-medium text-ink">
                Heure (optionnel)
              </span>
              <TimePicker value={time} onChange={setTime} labelId={`${titleId}-heure`} />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-ink">Quels jours ?</legend>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map(({ day, short, long }) => {
                  const selected = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      aria-label={long}
                      onClick={() => toggleDay(day)}
                      className={`h-11 w-11 rounded-full text-sm font-medium transition-colors ${
                        selected ? "bg-forest text-white" : "bg-surface text-ink hover:bg-cream-deep"
                      }`}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex gap-3 text-sm">
                <button type="button" onClick={() => setDays([1, 2, 3, 4, 5])} className="font-medium text-coral hover:underline">
                  En semaine
                </button>
                <button type="button" onClick={() => setDays([0, 6])} className="font-medium text-coral hover:underline">
                  Le week-end
                </button>
                <button type="button" onClick={() => setDays(ALL_DAYS)} className="font-medium text-coral hover:underline">
                  Tous les jours
                </button>
              </div>
            </fieldset>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-surface px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">Étoiles gagnées</p>
              <p className="text-xs text-ink-soft">Un vrai challenge mérite plus d&apos;étoiles.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStars((current) => Math.max(1, current - 1))}
                aria-label="Une étoile de moins"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-xl text-ink hover:bg-cream-deep"
              >
                −
              </button>
              <span className="w-8 text-center text-2xl font-medium text-ink tabular-nums" aria-live="polite">
                {stars}
              </span>
              <button
                type="button"
                onClick={() => setStars((current) => Math.min(10, current + 1))}
                aria-label="Une étoile de plus"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-cream text-ink hover:bg-cream-deep"
              >
                <Icon name="plus" className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <label className="flex min-h-14 items-center gap-3 rounded-card bg-surface px-4 py-3">
            <input
              type="checkbox"
              checked={needsParentApproval}
              onChange={(changeEvent) => setNeedsParentApproval(changeEvent.target.checked)}
              className="h-6 w-6 shrink-0 accent-[var(--color-forest)]"
            />
            <span className="text-sm font-medium text-ink">
              Validé par un parent
              <span className="block text-xs font-normal text-ink-soft">
                À cocher pour les challenges que Khloé ne peut pas valider seule.
              </span>
            </span>
          </label>

          {error ? (
            <p role="alert" className="rounded-3xl bg-coral-soft px-4 py-3 text-sm font-medium text-ink">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-pop btn-pop-coral min-h-14 flex-1 px-6 text-base">
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-14 rounded-pill bg-surface px-6 text-base font-medium text-ink-soft hover:bg-cream-deep"
            >
              Annuler
            </button>
          </div>

          {onDelete ? (
            <div className="border-t border-line pt-4">
              {confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="flex-1 text-sm font-medium text-ink">
                    Retirer « {ritual?.label} » des rituels de Khloé ? Les étoiles déjà gagnées restent.
                  </p>
                  <button type="button" onClick={onDelete} className="btn-pop btn-pop-coral min-h-11 px-5 text-sm">
                    Oui, retirer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="min-h-11 rounded-pill bg-surface px-5 text-sm font-medium text-ink-soft"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="min-h-11 rounded-pill px-4 text-sm font-medium text-coral hover:bg-coral-soft"
                >
                  Retirer ce rituel
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
  "min-h-14 w-full rounded-3xl bg-surface px-4 py-3 text-base text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-coral/30";
