"use client";

import { useState } from "react";
import { Card, CardTitle } from "./Card";
import { Icon } from "./Icon";
import { RitualForm } from "./RitualForm";
import { useSaveConfirmation } from "./SaveConfirmation";
import { todayKey } from "@/lib/dates";
import { useRituals } from "@/lib/useRituals";
import type { MomentOfDay, Ritual } from "@/lib/types";

const MOMENTS: { id: MomentOfDay; label: string }[] = [
  { id: "matin", label: "Le matin" },
  { id: "apres-midi", label: "L'après-midi" },
  { id: "soir", label: "Le soir" },
];

const SHORT_DAY = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

/** « Tous les jours », « En semaine », « Le week-end » ou la liste des jours. */
function daysLabel(days?: number[]): string {
  if (!days || days.length === 0 || days.length === 7) return "Tous les jours";
  const sorted = [...days].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (sorted.join() === "1,2,3,4,5") return "En semaine";
  if (sorted.join() === "6,0") return "Le week-end";
  return sorted.map((day) => SHORT_DAY[day]).join(", ");
}

/**
 * Les rituels et challenges de Khloé, gérés par les parents depuis les
 * réglages : plus besoin de passer par la base de données pour en ajouter.
 */
export function RitualsSettings() {
  const { allRituals, addRitual, updateRitual, removeRitual } = useRituals(todayKey());
  const { confirm, dialog } = useSaveConfirmation();
  const [editing, setEditing] = useState<Ritual | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Card>
      <CardTitle
        eyebrow="Rituels et challenges"
        title="La journée de Khloé"
        action={
          <button type="button" onClick={() => setCreating(true)} className="btn-pop btn-pop-coral min-h-11 px-4 text-sm">
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} /> Ajouter
          </button>
        }
      />

      <div className="flex flex-col gap-5">
        {MOMENTS.map((moment) => {
          const list = allRituals
            .filter((ritual) => ritual.moment === moment.id)
            .sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
          if (list.length === 0) return null;
          return (
            <section key={moment.id}>
              <h3 className="mb-1 text-base font-medium text-ink">{moment.label}</h3>
              <ul className="flex flex-col divide-y divide-dashed divide-line">
                {list.map((ritual) => (
                  <li key={ritual.id}>
                    <button
                      type="button"
                      onClick={() => setEditing(ritual)}
                      className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-cream/60"
                    >
                      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-2xl">
                        {ritual.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base text-ink">{ritual.label}</span>
                        <span className="block text-sm text-ink-soft">
                          {ritual.time ? `${ritual.time} · ` : ""}
                          {daysLabel(ritual.days)}
                          {ritual.needsParentApproval ? " · validé par un parent" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-pill bg-sun-soft px-2.5 py-1 text-sm text-ink tabular-nums">
                        +{ritual.stars}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {editing || creating ? (
        <RitualForm
          ritual={editing ?? undefined}
          onSave={(values) => {
            if (editing) {
              updateRitual(editing.id, values);
              confirm({ title: "Rituel modifié", detail: values.label });
            } else {
              addRitual(values);
              confirm({ title: "Rituel ajouté", detail: values.label });
            }
            setEditing(null);
            setCreating(false);
          }}
          onDelete={
            editing
              ? () => {
                  removeRitual(editing.id);
                  confirm({ kind: "deleted", title: "Rituel retiré", detail: editing.label });
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
      {dialog}
    </Card>
  );
}
