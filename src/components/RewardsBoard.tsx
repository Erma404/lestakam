"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { useSaveConfirmation } from "./SaveConfirmation";
import { RewardGoalForm } from "./RewardGoalForm";
import { memberById } from "@/lib/family";
import { useStars } from "@/lib/useStars";
import { useRewardGoals } from "@/lib/useRewardGoals";
import { nextGoal, starsThisMonth, starsThisWeek } from "@/lib/rewards";
import { formatLongDate, todayKey } from "@/lib/dates";
import { useNow } from "@/lib/useNow";
import type { RewardGoal } from "@/lib/types";

interface RewardsBoardProps {
  initialIso: string;
}

export function RewardsBoard({ initialIso }: RewardsBoardProps) {
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);

  const { entries, total, resetToDemo: resetStars, shared: starsShared } = useStars();
  const { goals, addGoal, updateGoal, deleteGoal } = useRewardGoals();
  const { confirm, dialog: confirmationDialog } = useSaveConfirmation();

  const [editing, setEditing] = useState<RewardGoal | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const upcoming = nextGoal(goals);
  const khloe = memberById("khloe");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <div>
          <p className="text-base text-ink-soft">{formatLongDate(today)}</p>
          <h1 className="font-display text-3xl font-medium text-ink sm:text-4xl">
            Les récompenses de {khloe?.firstName ?? "Khloé"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="btn-pop btn-pop-coral min-h-12 px-5 text-base"
        >
          <Icon name="plus" className="h-5 w-5" strokeWidth={2.2} /> Objectif
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Counter label="Cette semaine" value={starsThisWeek(entries, today)} highlight />
        <Counter label="Ce mois-ci" value={starsThisMonth(entries, today)} />
        <Counter label="Depuis le début" value={total} />
      </div>

      {upcoming ? (
        <section className="rounded-card bg-sun p-5 sm:p-6" aria-labelledby="objectif-en-cours">
          <div className="flex items-center gap-4">
            <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface text-4xl">
              {upcoming.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-ink">Objectif en cours</p>
              <h2 id="objectif-en-cours" className="font-display text-2xl font-medium text-ink">
                {upcoming.label}
              </h2>
            </div>
          </div>
          <div className="mt-4 h-4 overflow-hidden rounded-pill bg-surface" role="progressbar" aria-valuenow={total} aria-valuemin={0} aria-valuemax={upcoming.starsRequired} aria-label={`Progression vers ${upcoming.label}`}>
            <div className="h-full rounded-pill bg-coral transition-[width] duration-500" style={{ width: `${Math.min(Math.round((total / upcoming.starsRequired) * 100), 100)}%` }} />
          </div>
          <p className="mt-2 text-base text-ink">
            {total} / {upcoming.starsRequired} étoiles · encore{" "}
            {Math.max(upcoming.starsRequired - total, 0)} pour la débloquer
          </p>
        </section>
      ) : null}

      <section aria-labelledby="tous-objectifs">
        <h2 id="tous-objectifs" className="mb-3 font-display text-xl font-medium text-ink">
          Le chemin des récompenses
        </h2>
        {goals.length === 0 ? (
          <p className="rounded-card bg-surface p-5 text-base text-ink-soft">
            Aucun objectif pour le moment. Ajoutez-en un pour motiver Khloé !
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-dashed divide-line rounded-card bg-surface px-4 sm:px-6">
            {[...goals]
              .sort((a, b) => a.starsRequired - b.starsRequired)
              .map((goal) => {
                const unlocked = Boolean(goal.achievedOn);
                const percent = Math.min(Math.round((total / goal.starsRequired) * 100), 100);
                return (
                  <li key={goal.id}>
                    <button
                      type="button"
                      onClick={() => setEditing(goal)}
                      className="flex w-full items-center gap-4 py-4 text-left"
                    >
                      <span
                        aria-hidden
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-3xl ${
                          unlocked ? "bg-sage-soft" : "bg-cream-deep"
                        } ${unlocked || percent >= 100 ? "" : "grayscale-[0.6]"}`}
                      >
                        {goal.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-medium text-ink">{goal.label}</span>
                        {unlocked ? (
                          <span className="block text-sm text-sage">
                            Débloquée le {formatLongDate(goal.achievedOn ?? today)}
                          </span>
                        ) : (
                          <>
                            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-pill bg-cream-deep" aria-hidden>
                              <span className="block h-full rounded-pill bg-sun" style={{ width: `${percent}%` }} />
                            </span>
                            <span className="mt-1 block text-sm text-ink-soft tabular-nums">
                              {Math.min(total, goal.starsRequired)} / {goal.starsRequired} étoiles
                            </span>
                          </>
                        )}
                      </span>
                      {unlocked ? (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-white">
                          <Icon name="check" className="h-4 w-4" strokeWidth={2.6} />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {starsShared ? null : confirmingReset ? (
        <p className="flex flex-wrap items-center gap-3 text-sm font-medium text-ink">
          Remettre le compteur d&apos;étoiles à zéro ?
          <button
            type="button"
            onClick={() => {
              resetStars();
              setConfirmingReset(false);
            }}
            className="min-h-9 btn-pop btn-pop-coral px-4 text-xs font-semibold "
          >
            Oui, remettre à zéro
          </button>
          <button
            type="button"
            onClick={() => setConfirmingReset(false)}
            className="min-h-9 rounded-pill bg-surface px-4 text-xs font-semibold text-ink-soft"
          >
            Non
          </button>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingReset(true)}
          className="self-start text-xs font-medium text-ink-faint underline hover:text-ink-soft"
        >
          Remettre le compteur d&apos;étoiles à zéro
        </button>
      )}

      {editing || creating ? (
        <RewardGoalForm
          goal={editing ?? undefined}
          memberId={editing?.memberId ?? khloe?.id ?? "khloe"}
          onSave={(values) => {
            if (editing) {
              updateGoal(editing.id, values);
              confirm({ title: "Objectif modifié", detail: values.label });
            } else {
              addGoal(values);
              confirm({ title: "Objectif ajouté", detail: values.label });
            }
            setEditing(null);
            setCreating(false);
          }}
          onDelete={
            editing
              ? () => {
                  deleteGoal(editing.id);
                  confirm({ kind: "deleted", title: "Objectif supprimé", detail: editing.label });
                  setEditing(null);
                }
              : undefined
          }
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
        />
      ) : null}

      {confirmationDialog}
    </div>
  );
}

function Counter({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-card px-3 py-4 text-center ${highlight ? "bg-forest text-white" : "bg-surface text-ink"}`}>
      <p className={`text-sm ${highlight ? "text-white/80" : "text-ink-soft"}`}>{label}</p>
      <p className="font-display text-3xl font-medium tabular-nums">{value}</p>
      <p className={`text-xs ${highlight ? "text-white/80" : "text-ink-soft"}`}>étoiles</p>
    </div>
  );
}
