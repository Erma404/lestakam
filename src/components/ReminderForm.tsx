"use client";

import { Icon } from "./Icon";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { MEMBERS } from "@/lib/family";
import { accentClasses } from "@/lib/accents";
import type { MemberId, Reminder } from "@/lib/types";
import type { NewReminder } from "@/lib/useReminders";

interface ReminderFormProps {
  /** Rappel à modifier ; absent pour une création. */
  reminder?: Reminder;
  onSave: (values: NewReminder) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ReminderForm({ reminder, onSave, onDelete, onClose }: ReminderFormProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState(reminder?.label ?? "");
  const [dueDate, setDueDate] = useState(reminder?.dueDate ?? "");
  const [memberIds, setMemberIds] = useState<MemberId[]>(reminder?.memberIds ?? []);
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

  function toggleMember(id: MemberId) {
    setMemberIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    if (!label.trim()) {
      setError("Donnez un nom à ce rappel.");
      return;
    }

    onSave({
      label: label.trim(),
      dueDate: dueDate || undefined,
      memberIds,
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
        className="w-full max-w-md overflow-y-auto rounded-t-card bg-cream p-5 sm:rounded-card sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-ink">
            {reminder ? "Modifier le rappel" : "Nouveau rappel"}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Quoi ?">
            <input
              type="text"
              value={label}
              onChange={(changeEvent) => setLabel(changeEvent.target.value)}
              placeholder="Régler la cantine du mois"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Avant quand ? (optionnel)">
            <input
              type="date"
              value={dueDate}
              onChange={(changeEvent) => setDueDate(changeEvent.target.value)}
              className={inputClass}
            />
          </Field>

          <Group label="Qui s'en occupe ? (optionnel)">
            <div className="flex flex-wrap gap-2">
              {MEMBERS.map((member) => {
                const selected = memberIds.includes(member.id);
                const accent = accentClasses(member.accent);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    aria-pressed={selected}
                    className={`flex min-h-14 items-center gap-2 rounded-pill border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                      selected
                        ? `${accent.soft} border-ink-faint text-ink`
                        : "border-line bg-surface text-ink-soft"
                    }`}
                  >
                    <Avatar member={member} size="sm" />
                    {member.firstName}
                  </button>
                );
              })}
            </div>
          </Group>

          {error ? (
            <p role="alert" className="rounded-3xl bg-rose-soft px-4 py-3 text-sm font-medium text-ink">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              className="min-h-14 flex-1 btn-pop btn-pop-coral px-6 text-base font-semibold "
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-14 rounded-pill bg-surface px-6 text-base font-semibold text-ink-soft hover:bg-cream-deep"
            >
              Annuler
            </button>
          </div>

          {onDelete ? (
            <div className="border-t border-line pt-4">
              {confirmingDelete ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="flex-1 text-sm font-medium text-ink">
                    Supprimer « {reminder?.label} » définitivement ?
                  </p>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="min-h-11 btn-pop btn-pop-coral px-5 text-sm font-semibold "
                  >
                    Oui, supprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="min-h-11 rounded-pill bg-surface px-5 text-sm font-semibold text-ink-soft"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="min-h-11 rounded-pill px-4 text-sm font-semibold text-terracotta hover:bg-terracotta-soft"
                >
                  Supprimer ce rappel
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
  "min-h-14 w-full rounded-3xl bg-surface px-4 py-3 text-base font-medium text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-coral/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs font-medium text-ink-faint">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}
