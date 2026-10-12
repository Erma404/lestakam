"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { CardLink } from "./Card";
import { Icon } from "./Icon";
import { LevelBadge, StreakFlame } from "./Badges";
import { memberById } from "@/lib/family";
import { currentMoment } from "@/lib/dates";
import { nextGoal, rewardCycle } from "@/lib/rewards";
import { useRituals } from "@/lib/useRituals";
import { useRitualStatus } from "@/lib/useRitualStatus";
import { useRewardGoals } from "@/lib/useRewardGoals";
import { useStars } from "@/lib/useStars";
import { currentStreak, levelFor } from "@/lib/gamification";
import type { MomentOfDay } from "@/lib/types";

const MOMENT_LABEL: Record<MomentOfDay, string> = {
  matin: "ce matin",
  "apres-midi": "cet après-midi",
  soir: "ce soir",
};

/**
 * Le score de Khloé sur l'accueil : ses étoiles, sa prochaine récompense et
 * les rituels du moment, validables d'un appui depuis la tablette de la
 * cuisine — sans passer par la page Rituels.
 */
export function KhloeScore({ today, now }: { today: string; now: Date }) {
  const khloe = memberById("khloe");
  const { rituals } = useRituals(today);
  const { statuses, starsEarned, tap } = useRitualStatus(today);
  const { goals } = useRewardGoals();
  const { entries } = useStars();
  // Le « +1 » qui s'envole au-dessus du rituel tout juste validé.
  const [burst, setBurst] = useState<{ id: string; stars: number; key: number } | null>(null);

  const moment = currentMoment(now);
  const momentRituals = rituals.filter((ritual) => ritual.moment === moment);
  const starsToday = rituals
    .filter((ritual) => statuses[ritual.id] === "valide")
    .reduce((total, ritual) => total + ritual.stars, 0);
  const starsPossible = rituals.reduce((total, ritual) => total + ritual.stars, 0);

  const goal = nextGoal(goals);
  // La progression vers les récompenses repart à 0 à chaque tour (voir rewardCycle).
  const cycle = rewardCycle(goals, starsEarned);
  const remaining = goal ? Math.max(goal.starsRequired - cycle.stars, 0) : 0;
  const level = levelFor(starsEarned);
  const streak = currentStreak(entries, today);
  const perfectDay = starsPossible > 0 && starsToday === starsPossible;

  function validate(ritual: (typeof rituals)[number]) {
    if (statuses[ritual.id] !== "valide") setBurst((current) => ({ id: ritual.id, stars: ritual.stars, key: (current?.key ?? 0) + 1 }));
    tap(ritual);
  }

  const percent = goal ? Math.min(Math.round((cycle.stars / goal.starsRequired) * 100), 100) : 100;

  return (
    <section className="rounded-card bg-surface p-5 sm:p-6" aria-labelledby="score-khloe">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {khloe ? <Avatar member={khloe} size="md" /> : null}
          <div>
            <p className="text-sm text-ink-soft">Les étoiles de Khloé</p>
            <h2 id="score-khloe" className="font-display text-2xl font-medium text-ink">
              {starsToday} <span className="text-base text-ink-soft">/ {starsPossible} aujourd&apos;hui</span>
            </h2>
          </div>
        </div>
        <CardLink href="/recompenses">Récompenses</CardLink>
      </header>

      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-2xl bg-lilac-soft px-3 py-3">
          <LevelBadge level={level.number} className="h-14 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-soft">Niveau {level.number}</p>
            <p className="text-base font-medium text-ink">{level.name}</p>
            {level.span ? (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-surface" aria-hidden>
                <div
                  className="h-full rounded-pill bg-lilac transition-[width] duration-500"
                  style={{ width: `${Math.round((level.progress / level.span) * 100)}%` }}
                />
              </div>
            ) : null}
            {level.nextName && level.span ? (
              <p className="mt-1 text-xs text-ink-soft">
                {level.span - level.progress} étoiles avant « {level.nextName} »
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-coral-soft px-3 py-3">
          <StreakFlame lit={streak > 0} className="h-14 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-soft">Série en cours</p>
            <p className="text-base font-medium text-ink">
              {streak} jour{streak > 1 ? "s" : ""} d&apos;affilée
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {streak === 0 ? "Un rituel aujourd'hui pour l'allumer !" : "Ne la laisse pas s'éteindre !"}
            </p>
          </div>
        </div>
      </div>

      {perfectDay ? (
        <p role="status" className="animate-pop-in mb-4 rounded-2xl bg-sage px-4 py-3 text-base font-medium text-white">
          Journée parfaite ! Tous les rituels sont faits, bravo Khloé.
        </p>
      ) : null}

      {goal ? (
        <div className="rounded-2xl bg-sun-soft p-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <p className="text-base font-medium text-ink">{goal.label}</p>
            <p className="shrink-0 text-sm text-ink-soft tabular-nums">
              {cycle.stars} / {goal.starsRequired}
            </p>
          </div>
          <div
            className="h-3 overflow-hidden rounded-pill bg-surface"
            role="progressbar"
            aria-valuenow={cycle.stars}
            aria-valuemin={0}
            aria-valuemax={goal.starsRequired}
            aria-label={`Progression vers ${goal.label}`}
          >
            <div className="h-full rounded-pill bg-sun transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            {remaining === 0
              ? "Objectif atteint, bravo Khloé !"
              : `Encore ${remaining} étoile${remaining > 1 ? "s" : ""} pour y arriver.`}
          </p>
        </div>
      ) : null}

      {momentRituals.length > 0 ? (
        <div className="mt-5">
          <div className="mb-2 flex items-end justify-between gap-3">
            <h3 className="text-base font-medium text-ink">À faire {MOMENT_LABEL[moment]}</h3>
            <CardLink href="/rituels">Tous les rituels</CardLink>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {momentRituals.map((ritual) => {
              const done = statuses[ritual.id] === "valide";
              return (
                <li key={ritual.id} className="relative">
                  {burst?.id === ritual.id ? (
                    <span
                      key={burst.key}
                      aria-hidden
                      onAnimationEnd={() => setBurst(null)}
                      className="animate-star-burst pointer-events-none absolute right-4 top-0 z-10 rounded-pill bg-sun px-2.5 py-0.5 text-sm font-semibold text-ink"
                    >
                      +{burst.stars} étoile{burst.stars > 1 ? "s" : ""}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => validate(ritual)}
                    aria-pressed={done}
                    className={`tile-pop flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-left transition-colors ${
                      done ? "bg-sage-soft" : "bg-cream hover:bg-cream-deep"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        done ? "border-sage bg-sage text-white" : "border-line text-transparent"
                      }`}
                    >
                      <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />
                    </span>
                    <span className={`min-w-0 flex-1 text-base ${done ? "text-ink-soft" : "text-ink"}`}>
                      {ritual.label}
                    </span>
                    <span className="shrink-0 text-sm text-ink-soft tabular-nums">+{ritual.stars}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
