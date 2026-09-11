"use client";

import { useMemo } from "react";
import { Avatar } from "./Avatar";
import { Card, CardTitle } from "./Card";
import { RITUALS, REWARD_GOALS, memberById } from "@/lib/family";
import { useStoredState } from "@/lib/localStore";
import { currentMoment, formatLongDate, todayKey } from "@/lib/dates";
import { useNow } from "@/lib/useNow";
import type { MomentOfDay, RitualState } from "@/lib/types";

const MOMENTS: { id: MomentOfDay; label: string; emoji: string; tone: string }[] = [
  { id: "matin", label: "Matin", emoji: "🌅", tone: "bg-sun-soft" },
  { id: "apres-midi", label: "Après-midi", emoji: "☀️", tone: "bg-sage-soft" },
  { id: "soir", label: "Soir", emoji: "🌙", tone: "bg-lilac-soft" },
];

type StatusMap = Record<string, RitualState>;

const EMPTY_STATUSES: StatusMap = {};

interface RitualsBoardProps {
  /** Heure calculée par le serveur, utilisée pour le premier affichage. */
  initialIso: string;
  /** Mode enfant : grandes cases, pas de validation parentale possible. */
  childMode?: boolean;
}

export function RitualsBoard({ initialIso, childMode = false }: RitualsBoardProps) {
  // Les rituels repartent d'eux-mêmes à zéro au passage de minuit.
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);
  const currentSlot = currentMoment(now);

  const [statuses, setStatuses] = useStoredState<StatusMap>(`rituels:${today}`, EMPTY_STATUSES);
  const khloe = memberById("khloe");

  const rituals = useMemo(() => RITUALS.filter((ritual) => ritual.memberId === "khloe"), []);

  const starsEarned = rituals
    .filter((ritual) => statuses[ritual.id] === "valide")
    .reduce((total, ritual) => total + ritual.stars, 0);

  const starsPossible = rituals.reduce((total, ritual) => total + ritual.stars, 0);
  const doneCount = rituals.filter((ritual) => statuses[ritual.id] !== undefined).length;

  function toggleChecked(ritualId: string, needsApproval: boolean) {
    setStatuses((current) => {
      const next = { ...current };
      const state = next[ritualId];
      if (state === undefined) {
        next[ritualId] = needsApproval ? "coche" : "valide";
      } else {
        delete next[ritualId];
      }
      return next;
    });
  }

  function approve(ritualId: string) {
    setStatuses((current) => ({ ...current, [ritualId]: "valide" }));
  }

  const nextGoal = REWARD_GOALS.find((goal) => goal.starsRequired > starsEarned) ?? REWARD_GOALS[0];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {khloe ? <Avatar member={khloe} size="lg" /> : null}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
              Rituels du jour
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Les journées de Khloé
            </h1>
            <p className="text-sm font-semibold text-ink-soft">{formatLongDate(today)}</p>
          </div>
        </div>
        <div className="rounded-card bg-sun-soft px-5 py-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Étoiles gagnées
          </p>
          <p className="text-3xl font-extrabold text-ink">
            {starsEarned}
            <span className="text-base font-bold text-ink-faint"> / {starsPossible}</span>
          </p>
        </div>
      </header>

      <Card className="bg-white/70">
        <CardTitle
          eyebrow="Progression"
          title={`Objectif : ${nextGoal.emoji} ${nextGoal.label}`}
          action={
            <span className="rounded-pill bg-cream-deep px-4 py-2 text-xs font-bold text-ink-soft">
              {doneCount} / {rituals.length} rituels touchés
            </span>
          }
        />
        <ProgressBar value={starsEarned} max={nextGoal.starsRequired} />
        <p className="mt-2 text-sm font-semibold text-ink-soft">
          Encore {Math.max(nextGoal.starsRequired - starsEarned, 0)} étoiles pour débloquer cette
          récompense.
        </p>
      </Card>

      {MOMENTS.map((moment) => {
        const list = rituals.filter((ritual) => ritual.moment === moment.id);
        const isNow = moment.id === currentSlot;
        return (
          <Card key={moment.id} className={isNow ? "ring-2 ring-sage" : undefined}>
            <CardTitle
              eyebrow={isNow ? "C'est le moment" : undefined}
              title={`${moment.emoji} ${moment.label}`}
            />
            <ul className={`grid gap-3 ${childMode ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
              {list.map((ritual) => {
                const state = statuses[ritual.id];
                const checked = state !== undefined;
                const approved = state === "valide";
                return (
                  <li key={ritual.id}>
                    <div
                      className={`flex items-center gap-3 rounded-card border px-4 py-3 transition-colors ${
                        approved
                          ? "border-sage bg-sage-soft"
                          : checked
                            ? "border-sun bg-sun-soft"
                            : "border-line bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleChecked(ritual.id, ritual.needsParentApproval)}
                        aria-pressed={checked}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="text-3xl" aria-hidden>
                          {ritual.emoji}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-base font-extrabold text-ink">
                            {ritual.label}
                          </span>
                          <span className="block text-xs font-semibold text-ink-soft">
                            {ritual.time ? `${ritual.time} · ` : ""}
                            {ritual.stars} ⭐
                            {approved
                              ? " · validé"
                              : checked
                                ? " · en attente d'un parent"
                                : ""}
                          </span>
                        </span>
                      </button>

                      {checked && !approved && !childMode ? (
                        <button
                          type="button"
                          onClick={() => approve(ritual.id)}
                          className="inline-flex min-h-11 shrink-0 items-center rounded-pill bg-sage px-4 text-xs font-extrabold text-white"
                        >
                          Valider
                        </button>
                      ) : (
                        <span
                          aria-hidden
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${
                            approved ? "bg-sage text-white" : "bg-cream-deep text-ink-faint"
                          }`}
                        >
                          {approved ? "✓" : checked ? "⏳" : ""}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div
      className="h-5 w-full overflow-hidden rounded-pill bg-cream-deep"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="Progression vers la récompense"
    >
      <div
        className="h-full rounded-pill bg-sun transition-[width] duration-500"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
