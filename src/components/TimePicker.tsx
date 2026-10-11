"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, "0"));

interface TimePickerProps {
  /** Heure au format HH:MM, ou chaîne vide si aucune. */
  value: string;
  onChange: (value: string) => void;
  /** Identifiant du libellé du champ, pour les lecteurs d'écran. */
  labelId?: string;
  /** Heure mise en avant à l'ouverture si le champ est vide, ex. « 19 ». */
  suggestedHour?: string;
}

/**
 * Même geste que le sélecteur natif — deux colonnes qui défilent, heures et
 * minutes, ouvertes sous le champ — mais aux couleurs de l'application :
 * le sélecteur du navigateur (bleu vif, police système) ne se laisse pas
 * habiller.
 */
export function TimePicker({ value, onChange, labelId, suggestedHour }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const [hour, minute] = value ? value.split(":") : [null, null];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // Ne referme que le sélecteur, pas le formulaire autour.
        event.stopPropagation();
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  // À l'ouverture, l'heure choisie (ou suggérée) s'affiche en haut de chaque colonne.
  useEffect(() => {
    if (!open) return;
    // Champ vide : on part de l'heure qu'il est, comme le sélecteur natif.
    const focusHour = hour ?? suggestedHour ?? String(new Date().getHours()).padStart(2, "0");
    for (const [column, item] of [
      [hoursRef.current, focusHour],
      [minutesRef.current, minute ?? "00"],
    ] as const) {
      const target = item ? column?.querySelector<HTMLElement>(`[data-value="${item}"]`) : null;
      if (column && target) column.scrollTop = target.offsetTop - 6;
    }
    // Uniquement à l'ouverture : suivre chaque choix ferait sauter la colonne sous le doigt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function pickHour(next: string) {
    onChange(`${next}:${minute ?? "00"}`);
  }

  function pickMinute(next: string) {
    onChange(`${hour ?? suggestedHour ?? "12"}:${next}`);
    setOpen(false);
  }

  function renderColumn(
    items: string[],
    selected: string | null,
    onPick: (item: string) => void,
    ref: React.RefObject<HTMLDivElement | null>,
    label: string,
  ) {
    return (
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        className="scrollbar-soft flex max-h-64 snap-y flex-col gap-1 overflow-y-auto overscroll-contain p-1.5"
      >
        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <button
              key={item}
              type="button"
              role="option"
              data-value={item}
              aria-selected={isSelected}
              onClick={() => onPick(item)}
              className={`min-h-11 shrink-0 snap-start rounded-2xl text-base font-semibold tabular-nums transition-colors ${
                isSelected ? "bg-sage text-white" : "text-ink hover:bg-sage-soft"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={`${baseId}-trigger`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={labelId ? `${labelId} ${baseId}-trigger` : undefined}
        className={`flex min-h-14 w-full items-center justify-between gap-2 rounded-3xl border bg-surface px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sage-soft ${
          open ? "border-sage ring-2 ring-sage-soft" : "border-line"
        }`}
      >
        <span className={`text-base font-medium tabular-nums ${value ? "text-ink" : "text-ink-faint"}`}>
          {value || "--:--"}
        </span>
        <Icon name="clock" className="h-5 w-5 text-coral" />
      </button>

      {open ? (
        <div className="animate-pop-in absolute left-0 top-full z-20 mt-2 flex w-full min-w-44 flex-col overflow-hidden rounded-3xl border border-line bg-cream">
          <div className="grid grid-cols-2 divide-x divide-line">
            {renderColumn(HOURS, hour ?? null, pickHour, hoursRef, "Heures")}
            {renderColumn(MINUTES, minute ?? null, pickMinute, minutesRef, "Minutes")}
          </div>
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="min-h-11 border-t border-line text-sm font-medium text-ink-soft hover:bg-cream-deep"
            >
              Sans heure
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
