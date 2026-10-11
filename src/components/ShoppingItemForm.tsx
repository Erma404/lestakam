"use client";

import { Icon } from "./Icon";
import { useEffect, useId, useRef, useState } from "react";
import type { ShoppingItem } from "@/lib/types";
import type { NewShoppingItem } from "@/lib/useShoppingList";

interface ShoppingItemFormProps {
  /** Article à modifier ; absent pour une création rapide. */
  item?: ShoppingItem;
  onSave: (values: NewShoppingItem) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ShoppingItemForm({ item, onSave, onDelete, onClose }: ShoppingItemFormProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const [label, setLabel] = useState(item?.label ?? "");
  const [quantity, setQuantity] = useState(item?.quantity ?? "");
  const [aisle, setAisle] = useState(item?.aisle ?? "");
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

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    if (!label.trim()) {
      setError("Donnez un nom à cet article.");
      return;
    }

    onSave({
      label: label.trim(),
      quantity: quantity.trim() || undefined,
      aisle: aisle.trim() || undefined,
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
            {item ? "Modifier l'article" : "Nouvel article"}
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
              placeholder="Lait"
              className={inputClass}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quantité (optionnel)">
              <input
                type="text"
                value={quantity}
                onChange={(changeEvent) => setQuantity(changeEvent.target.value)}
                placeholder="2 L"
                className={inputClass}
              />
            </Field>
            <Field label="Rayon (optionnel)">
              <input
                type="text"
                value={aisle}
                onChange={(changeEvent) => setAisle(changeEvent.target.value)}
                placeholder="Frais"
                className={inputClass}
              />
            </Field>
          </div>

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
                    Retirer « {item?.label} » de la liste ?
                  </p>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="min-h-11 btn-pop btn-pop-coral px-5 text-sm font-semibold "
                  >
                    Oui, retirer
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
                  Retirer cet article
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
