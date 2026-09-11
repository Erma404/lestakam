"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "./Card";
import { ProgressBar } from "./RitualsBoard";
import { RewardGoalForm } from "./RewardGoalForm";
import { memberById } from "@/lib/family";
import { useStars } from "@/lib/useStars";
import { useRewardGoals } from "@/lib/useRewardGoals";
import { achievedGoals, goalsToUnlock, nextGoal, starsThisMonth, starsThisWeek } from "@/lib/rewards";
import { formatLongDate, todayKey } from "@/lib/dates";
import { useNow } from "@/lib/useNow";
import type { RewardGoal } from "@/lib/types";

interface RewardsBoardProps {
  initialIso: string;
}

export function RewardsBoard({ initialIso }: RewardsBoardProps) {
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);

  const { entries, total, resetToDemo: resetStars } = useStars();
  const { goals, addGoal, updateGoal, deleteGoal, markAchieved } = useRewardGoals();

  const [editing, setEditing] = useState<RewardGoal | null>(null);
  const [creating, setCreating] = useState(false);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  // Débloque automatiquement tout objectif dont le seuil vient d'être atteint.
  useEffect(() => {
    const toUnlock = goalsToUnlock(goals, total);
    if (toUnlock.length === 0) return;
    for (const goal of toUnlock) {
      markAchieved(goal.id, today);
    }
    // Décalé d'un tick : on notifie le système externe (le stockage des
    // objectifs) depuis le corps de l'effet, et on ne met à jour l'état
    // local du bandeau que depuis un callback, une fois cela fait.
    const label = toUnlock[0].label;
    const showTimer = window.setTimeout(() => setUnlocked(label), 0);
    const hideTimer = window.setTimeout(() => setUnlocked(null), 5000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
    // `goals` change à chaque rendu tant que `markAchieved` n'a pas encore écrit :
    // seul le total d'étoiles doit déclencher cette vérification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const upcoming = nextGoal(goals);
  const unlockedGoals = achievedGoals(goals);
  const khloe = memberById("khloe");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            {khloe?.firstName ?? "Khloé"} · {formatLongDate(today)}
          </p>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            ⭐ Récompenses
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex min-h-14 items-center gap-2 btn-pop btn-pop-sage px-6 text-base font-extrabold "
        >
          <span aria-hidden>＋</span> Objectif
        </button>
      </header>

      {unlocked ? (
        <p role="status" className="rounded-card bg-sun-soft px-5 py-3 text-sm font-bold text-ink">
          🎉 Nouvelle récompense débloquée : {unlocked} !
        </p>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <Counter label="Cette semaine" value={starsThisWeek(entries, today)} />
        <Counter label="Ce mois-ci" value={starsThisMonth(entries, today)} />
        <Counter label="Depuis le début" value={total} />
      </div>

      {upcoming ? (
        <Card className="bg-white/70">
          <CardTitle eyebrow="Prochain objectif" title={`${upcoming.emoji} ${upcoming.label}`} />
          <ProgressBar value={total} max={upcoming.starsRequired} />
          <p className="mt-2 text-sm font-semibold text-ink-soft">
            Encore {Math.max(upcoming.starsRequired - total, 0)} étoiles pour débloquer cette
            récompense.
          </p>
        </Card>
      ) : null}

      <Card>
        <CardTitle title="Tous les objectifs" />
        {goals.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm font-semibold text-ink-soft">
            Aucun objectif pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {goals.map((goal) => (
              <li key={goal.id}>
                <button
                  type="button"
                  onClick={() => setEditing(goal)}
                  className={`flex w-full items-center gap-3 rounded-3xl px-4 py-3 text-left ${
                    goal.achievedOn ? "bg-sage-soft" : "bg-white border border-line"
                  }`}
                >
                  <span className="text-2xl" aria-hidden>
                    {goal.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-extrabold text-ink">
                      {goal.label}
                    </span>
                    <span className="block text-xs font-semibold text-ink-soft">
                      {goal.starsRequired} ⭐
                      {goal.achievedOn ? ` · débloqué le ${formatLongDate(goal.achievedOn)}` : ""}
                    </span>
                  </span>
                  {goal.achievedOn ? (
                    <span aria-hidden className="text-xl">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {unlockedGoals.length > 0 ? (
        <Card>
          <CardTitle eyebrow="Historique" title="Récompenses débloquées" />
          <ul className="flex flex-col gap-2">
            {unlockedGoals.map((goal) => (
              <li
                key={goal.id}
                className="flex items-center gap-3 rounded-3xl bg-cream-deep/60 px-4 py-3 text-sm font-bold text-ink"
              >
                <span aria-hidden>{goal.emoji}</span>
                {goal.label}
                <span className="ml-auto text-xs font-semibold text-ink-faint">
                  {formatLongDate(goal.achievedOn ?? today)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {confirmingReset ? (
        <p className="flex flex-wrap items-center gap-3 text-sm font-bold text-ink">
          Remettre le compteur d&apos;étoiles à zéro ?
          <button
            type="button"
            onClick={() => {
              resetStars();
              setConfirmingReset(false);
            }}
            className="min-h-9 btn-pop btn-pop-terracotta px-4 text-xs font-extrabold "
          >
            Oui, remettre à zéro
          </button>
          <button
            type="button"
            onClick={() => setConfirmingReset(false)}
            className="min-h-9 rounded-pill bg-white px-4 text-xs font-extrabold text-ink-soft"
          >
            Non
          </button>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingReset(true)}
          className="self-start text-xs font-bold text-ink-faint underline hover:text-ink-soft"
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
            } else {
              addGoal(values);
            }
            setEditing(null);
            setCreating(false);
          }}
          onDelete={
            editing
              ? () => {
                  deleteGoal(editing.id);
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
    </div>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-white/80 border border-line px-3 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-faint">{label}</p>
      <p className="text-2xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
