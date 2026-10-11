"use client";

import { useState } from "react";
import { memberById } from "@/lib/family";
import { Avatar } from "./Avatar";
import { CardLink } from "./Card";
import { Icon } from "./Icon";
import { currentMoment, formatLongDate, todayKey } from "@/lib/dates";
import { useNow } from "@/lib/useNow";
import { useRituals } from "@/lib/useRituals";
import { useRitualStatus } from "@/lib/useRitualStatus";
import { useRewardGoals } from "@/lib/useRewardGoals";
import { useStars } from "@/lib/useStars";
import { nextGoal as pickNextGoal } from "@/lib/rewards";
import { currentStreak, levelFor } from "@/lib/gamification";
import type { MomentOfDay, Ritual } from "@/lib/types";

const MOMENTS: { id: MomentOfDay; label: string; tile: string }[] = [
  { id: "matin", label: "Le matin", tile: "bg-sun-soft" },
  { id: "apres-midi", label: "L'après-midi", tile: "bg-sky-soft" },
  { id: "soir", label: "Le soir", tile: "bg-lilac-soft" },
];

interface RitualsBoardProps {
  /** Heure calculée par le serveur, utilisée pour le premier affichage. */
  initialIso: string;
}

/**
 * Les rituels de Khloé : de grandes vignettes illustrées (elle commence
 * tout juste à lire), un appui pour valider, un « +1 étoile » qui s'envole,
 * et son niveau, sa série et sa prochaine récompense toujours en vue.
 */
export function RitualsBoard({ initialIso }: RitualsBoardProps) {
  // Les rituels repartent d'eux-mêmes à zéro au passage de minuit.
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);
  const currentSlot = currentMoment(now);

  const khloe = memberById("khloe");
  const { rituals } = useRituals(today);
  const { statuses, starsEarned, tap } = useRitualStatus(today);
  const { goals } = useRewardGoals();
  const { entries } = useStars();
  const [burst, setBurst] = useState<{ id: string; stars: number; key: number } | null>(null);

  const starsToday = rituals
    .filter((ritual) => statuses[ritual.id] === "valide")
    .reduce((total, ritual) => total + ritual.stars, 0);
  const starsPossible = rituals.reduce((total, ritual) => total + ritual.stars, 0);
  const perfectDay = starsPossible > 0 && starsToday === starsPossible;

  const goal = pickNextGoal(goals);
  const level = levelFor(starsEarned);
  const streak = currentStreak(entries, today);

  function validate(ritual: Ritual) {
    if (statuses[ritual.id] !== "valide") {
      setBurst((current) => ({ id: ritual.id, stars: ritual.stars, key: (current?.key ?? 0) + 1 }));
    }
    tap(ritual);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-28 sm:p-6 md:pb-8 lg:p-8">
      <header className="flex items-center gap-4 pt-2">
        {khloe ? <Avatar member={khloe} size="lg" /> : null}
        <div className="min-w-0">
          <p className="text-base text-ink-soft">{formatLongDate(today)}</p>
          <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">Les rituels de Khloé</h1>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Progression de Khloé">
        <div className="rounded-card bg-sun px-5 py-4">
          <p className="text-sm text-ink">Étoiles aujourd&apos;hui</p>
          <p className="font-display text-4xl font-medium text-ink tabular-nums">
            {starsToday}
            <span className="text-lg"> / {starsPossible}</span>
          </p>
        </div>
        <div className="rounded-card bg-surface px-5 py-4">
          <p className="text-sm text-ink-soft">Niveau {level.number}</p>
          <p className="text-xl font-medium text-ink">{level.name}</p>
          {level.span ? (
            <ProgressBar value={level.progress} max={level.span} tone="bg-lilac" label="Progression vers le niveau suivant" small />
          ) : null}
        </div>
        <div className="rounded-card bg-surface px-5 py-4">
          <p className="text-sm text-ink-soft">Série en cours</p>
          <p className="text-xl font-medium text-ink">
            {streak} jour{streak > 1 ? "s" : ""} d&apos;affilée
          </p>
          <p className="text-sm text-ink-soft">
            {streak === 0 ? "Un rituel pour la lancer !" : "Continue comme ça !"}
          </p>
        </div>
      </section>

      {perfectDay ? (
        <p role="status" className="animate-pop-in rounded-card bg-sage px-5 py-4 text-lg font-medium text-white">
          Journée parfaite ! Tous les rituels sont faits, bravo Khloé.
        </p>
      ) : null}

      {MOMENTS.map((moment) => {
        const list = rituals.filter((ritual) => ritual.moment === moment.id);
        if (list.length === 0) return null;
        const isNow = moment.id === currentSlot;
        const done = list.filter((ritual) => statuses[ritual.id] === "valide").length;
        return (
          <section key={moment.id} aria-labelledby={`moment-${moment.id}`}>
            <div className="mb-3 flex items-center gap-3">
              <h2 id={`moment-${moment.id}`} className="font-display text-xl font-medium text-ink">
                {moment.label}
              </h2>
              {isNow ? (
                <span className="rounded-pill bg-coral px-3 py-1 text-xs font-medium text-white">
                  En ce moment
                </span>
              ) : null}
              <span className="ml-auto text-sm text-ink-soft tabular-nums">
                {done} / {list.length}
              </span>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((ritual) => {
                const state = statuses[ritual.id];
                const approved = state === "valide";
                const pending = state === "coche";
                return (
                  <li key={ritual.id} className="relative">
                    {burst?.id === ritual.id ? (
                      <span
                        key={burst.key}
                        aria-hidden
                        onAnimationEnd={() => setBurst(null)}
                        className="animate-star-burst pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-pill bg-sun px-3 py-1 text-sm font-semibold text-ink"
                      >
                        +{burst.stars} étoile{burst.stars > 1 ? "s" : ""}
                      </span>
                    ) : null}
                    {/* Toute la vignette est la zone d'appui : un geste, un résultat. */}
                    <button
                      type="button"
                      onClick={() => validate(ritual)}
                      aria-pressed={approved}
                      aria-label={`${ritual.label} : ${approved ? "fait, appuyer pour annuler" : "appuyer pour valider"}`}
                      className={`relative flex h-full w-full touch-manipulation select-none flex-col items-center gap-2 rounded-card px-3 pb-4 pt-5 text-center transition-[background-color,transform] duration-150 active:scale-[0.97] ${
                        approved ? "bg-sage-soft" : "bg-surface hover:bg-cream-deep"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-20 w-20 items-center justify-center rounded-full text-5xl leading-none ${moment.tile} ${
                          approved ? "opacity-70" : ""
                        }`}
                      >
                        {ritual.emoji}
                      </span>
                      <span className="text-base font-medium leading-snug text-ink">{ritual.label}</span>
                      <span className="text-sm text-ink-soft">
                        {ritual.time ? `${ritual.time} · ` : ""}+{ritual.stars} étoile{ritual.stars > 1 ? "s" : ""}
                        {pending ? " · à valider" : ""}
                      </span>
                      <span
                        aria-hidden
                        className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                          approved ? "animate-pop-in bg-sage text-white" : "border-2 border-line text-transparent"
                        }`}
                      >
                        <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {goal ? (
        <section className="rounded-card bg-surface p-5 sm:p-6" aria-labelledby="prochaine-recompense">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-sun-soft text-3xl">
                {goal.emoji}
              </span>
              <div>
                <p className="text-sm text-ink-soft">Prochaine récompense</p>
                <h2 id="prochaine-recompense" className="text-xl font-medium text-ink">
                  {goal.label}
                </h2>
              </div>
            </div>
            <CardLink href="/recompenses">Récompenses</CardLink>
          </div>
          <ProgressBar value={starsEarned} max={goal.starsRequired} label={`Progression vers ${goal.label}`} />
          <p className="mt-2 text-sm text-ink-soft">
            {starsEarned} / {goal.starsRequired} étoiles · encore{" "}
            {Math.max(goal.starsRequired - starsEarned, 0)} pour y arriver.
          </p>
        </section>
      ) : null}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  tone = "bg-sun",
  label = "Progression vers la récompense",
  small = false,
}: {
  value: number;
  max: number;
  tone?: string;
  label?: string;
  small?: boolean;
}) {
  const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div
      className={`${small ? "mt-2 h-1.5" : "h-3"} w-full overflow-hidden rounded-pill bg-cream-deep`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div className={`h-full rounded-pill ${tone} transition-[width] duration-500`} style={{ width: `${percent}%` }} />
    </div>
  );
}
