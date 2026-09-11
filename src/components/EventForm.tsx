"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { MEMBERS } from "@/lib/family";
import { CATEGORY_LABEL, accentClasses } from "@/lib/accents";
import type { CalendarEvent, EventCategory, MemberId } from "@/lib/types";
import type { NewEvent } from "@/lib/useEvents";

const CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];

interface EventFormProps {
  /** Événement à modifier ; absent pour une création. */
  event?: CalendarEvent;
  /** Date pré-remplie à la création. */
  defaultDate: string;
  /** Heure de début pré-remplie à la création, ex. quand on clique dans la grille. */
  defaultStartTime?: string;
  onSave: (values: NewEvent) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function EventForm({
  event,
  defaultDate,
  defaultStartTime,
  onSave,
  onDelete,
  onClose,
}: EventFormProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(event?.startTime ?? defaultStartTime ?? "");
  const [endTime, setEndTime] = useState(event?.endTime ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [category, setCategory] = useState<EventCategory>(event?.category ?? "activite");
  const [memberIds, setMemberIds] = useState<MemberId[]>(event?.memberIds ?? []);
  const [repeatsWeekly, setRepeatsWeekly] = useState(event?.repeatsWeekly ?? false);
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();

    // Empêche la page de défiler derrière le formulaire sur téléphone.
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

    if (!title.trim()) {
      setError("Donnez un nom à cet événement.");
      return;
    }
    if (memberIds.length === 0) {
      setError("Indiquez au moins une personne concernée.");
      return;
    }
    if (startTime && endTime && endTime < startTime) {
      setError("L'heure de fin doit venir après l'heure de début.");
      return;
    }

    onSave({
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location.trim() || undefined,
      category,
      memberIds,
      repeatsWeekly,
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
            {event ? "Modifier l'événement" : "Nouvel événement"}
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
              placeholder="Cours de natation"
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="De (optionnel)">
              <input
                type="time"
                value={startTime}
                onChange={(changeEvent) => setStartTime(changeEvent.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="À (optionnel)">
              <input
                type="time"
                value={endTime}
                onChange={(changeEvent) => setEndTime(changeEvent.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Group label="Qui est concerné ?">
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
                    className={`flex min-h-14 items-center gap-2 rounded-pill border-2 px-3 py-2 text-sm font-extrabold transition-colors ${
                      selected
                        ? `${accent.soft} border-ink-faint text-ink`
                        : "border-line bg-white text-ink-soft"
                    }`}
                  >
                    <Avatar member={member} size="sm" />
                    {member.firstName}
                  </button>
                );
              })}
            </div>
          </Group>

          <Group label="Type">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  aria-pressed={category === value}
                  className={`min-h-11 rounded-pill border-2 px-4 text-sm font-bold ${
                    category === value
                      ? "border-ink-faint bg-white text-ink"
                      : "border-line bg-white/60 text-ink-soft"
                  }`}
                >
                  {CATEGORY_LABEL[value]}
                </button>
              ))}
            </div>
          </Group>

          <Field label="Où ? (optionnel)">
            <input
              type="text"
              value={location}
              onChange={(changeEvent) => setLocation(changeEvent.target.value)}
              placeholder="Piscine municipale"
              className={inputClass}
            />
          </Field>

          <label className="flex min-h-14 items-center gap-3 rounded-card border border-line bg-white px-4 py-3">
            <input
              type="checkbox"
              checked={repeatsWeekly}
              onChange={(changeEvent) => setRepeatsWeekly(changeEvent.target.checked)}
              className="h-6 w-6 shrink-0 accent-[#7fa87f]"
            />
            <span className="text-sm font-bold text-ink">
              Chaque semaine, le même jour
              <span className="block text-xs font-semibold text-ink-faint">
                Par exemple la natation tous les samedis.
              </span>
            </span>
          </label>

          <Field label="Note (optionnel)">
            <textarea
              value={notes}
              onChange={(changeEvent) => setNotes(changeEvent.target.value)}
              rows={2}
              placeholder="Penser au bonnet de bain"
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
                    Supprimer « {event?.title} » définitivement ?
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
                  Supprimer cet événement
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

/** Même présentation qu'un champ, pour un groupe de boutons de choix. */
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
