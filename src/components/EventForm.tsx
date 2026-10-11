"use client";

import { Icon } from "./Icon";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "./Avatar";
import { MEMBERS } from "@/lib/family";
import { CATEGORY_LABEL, accentClasses } from "@/lib/accents";
import type { CalendarEvent, EventCategory, MemberId } from "@/lib/types";
import type { NewEvent } from "@/lib/useEvents";
import { mapsUrl } from "@/lib/events";
import { TimePicker } from "./TimePicker";

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
  const [skipSchoolHolidays, setSkipSchoolHolidays] = useState(event?.skipSchoolHolidays ?? false);
  const [repeatDays, setRepeatDays] = useState<number[]>(event?.repeatDays ?? []);
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
      skipSchoolHolidays: repeatsWeekly && skipSchoolHolidays ? true : undefined,
      repeatDays: repeatsWeekly && repeatDays.length > 0 ? [...repeatDays].sort() : undefined,
      notes: notes.trim() || undefined,
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
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-card bg-cream p-5 sm:rounded-card sm:p-6"
      >
        <header className="mb-5 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-2xl font-semibold tracking-tight text-ink">
            {event ? "Modifier l'événement" : "Nouvel événement"}
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
            <TimeField label="De (optionnel)">
              {(labelId) => <TimePicker value={startTime} onChange={setStartTime} labelId={labelId} />}
            </TimeField>
            <TimeField label="À (optionnel)">
              {(labelId) => (
                <TimePicker
                  value={endTime}
                  onChange={setEndTime}
                  labelId={labelId}
                  suggestedHour={
                    startTime
                      ? String((Number(startTime.slice(0, 2)) + 1) % 24).padStart(2, "0")
                      : undefined
                  }
                />
              )}
            </TimeField>
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

          <Group label="Type">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  aria-pressed={category === value}
                  className={`min-h-11 rounded-pill border-2 px-4 text-sm font-medium ${
                    category === value
                      ? "border-ink-faint bg-surface text-ink"
                      : "border-line bg-surface text-ink-soft"
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
              placeholder="Centre aquatique olympique, Saint-Denis"
              className={inputClass}
            />
          </Field>
          {location.trim() ? (
            <a
              href={mapsUrl(location)}
              target="_blank"
              rel="noopener noreferrer"
              className="-mt-2 inline-flex min-h-11 items-center gap-2 self-start rounded-pill bg-coral-soft px-4 text-sm font-medium text-ink hover:brightness-97"
            >
              <Icon name="pin" className="h-4 w-4 text-coral" /> Voir sur Google Maps
            </a>
          ) : null}

          <label className="flex min-h-14 items-center gap-3 rounded-card bg-surface px-4 py-3">
            <input
              type="checkbox"
              checked={repeatsWeekly}
              onChange={(changeEvent) => setRepeatsWeekly(changeEvent.target.checked)}
              className="h-6 w-6 shrink-0 accent-[#7fa87f]"
            />
            <span className="text-sm font-medium text-ink">
              Chaque semaine, le même jour
              <span className="block text-xs font-medium text-ink-faint">
                Par exemple la natation tous les samedis.
              </span>
            </span>
          </label>

          {repeatsWeekly ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium text-ink">Quels jours ?</legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(({ day, short, long }) => {
                  const effective = repeatDays.length > 0 ? repeatDays : [new Date(`${date}T12:00:00`).getDay()];
                  const selected = effective.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={selected}
                      aria-label={long}
                      onClick={() =>
                        setRepeatDays(
                          selected ? effective.filter((item) => item !== day) : [...effective, day],
                        )
                      }
                      className={`h-11 w-11 rounded-full text-sm font-medium transition-colors ${
                        selected ? "bg-forest text-white" : "bg-cream text-ink hover:bg-cream-deep"
                      }`}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {repeatsWeekly ? (
            <label className="flex min-h-14 items-center gap-3 rounded-card bg-surface px-4 py-3">
              <input
                type="checkbox"
                checked={skipSchoolHolidays}
                onChange={(changeEvent) => setSkipSchoolHolidays(changeEvent.target.checked)}
                className="h-6 w-6 shrink-0 accent-[#7fa87f]"
              />
              <span className="text-sm font-medium text-ink">
                Sauf vacances scolaires et jours fériés
                <span className="block text-xs font-medium text-ink-faint">
                  Zone C : l&apos;activité disparaît du calendrier pendant les vacances.
                </span>
              </span>
            </label>
          ) : null}

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
                    Supprimer « {event?.title} » définitivement ?
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

/**
 * Même présentation qu'un champ, sans balise <label> : le sélecteur d'heure
 * contient plusieurs boutons, qu'un <label> détournerait vers le premier.
 */
function TimeField({
  label,
  children,
}: {
  label: string;
  children: (labelId: string) => React.ReactNode;
}) {
  const labelId = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-xs font-medium text-ink-faint">
        {label}
      </span>
      {children(labelId)}
    </div>
  );
}

/** Même présentation qu'un champ, pour un groupe de boutons de choix. */
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
