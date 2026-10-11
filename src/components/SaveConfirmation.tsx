"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";

/** Durée d'affichage avant fermeture automatique. */
const AUTO_CLOSE_MS = 2500;

interface Confirmation {
  /** « deleted » pour une suppression, sinon une coche verte. */
  kind?: "saved" | "deleted";
  title: string;
  detail?: string;
}

/**
 * Fenêtre de confirmation après un ajout, une modification ou une
 * suppression : bien visible au centre de l'écran (un bandeau en haut de
 * page passait inaperçu une fois le formulaire refermé), et qui se referme
 * toute seule.
 *
 * `confirm({ title: "Ajouté au calendrier", detail: "Natation" })`
 */
export function useSaveConfirmation() {
  const [current, setCurrent] = useState<Confirmation | null>(null);

  const confirm = useCallback((confirmation: Confirmation) => setCurrent(confirmation), []);

  const dialog = current ? (
    <SaveConfirmationDialog confirmation={current} onClose={() => setCurrent(null)} />
  ) : null;

  return { confirm, dialog };
}

function SaveConfirmationDialog({
  confirmation,
  onClose,
}: {
  confirmation: Confirmation;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, AUTO_CLOSE_MS);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" || event.key === "Enter") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [confirmation, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
      onClick={onClose}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="save-confirmation-title"
        className="animate-pop-in flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl bg-cream px-6 py-7 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            confirmation.kind === "deleted" ? "bg-cream-deep text-ink-soft" : "bg-sage text-white"
          }`}
        >
          <Icon name={confirmation.kind === "deleted" ? "close" : "check"} className="h-8 w-8" strokeWidth={2.4} />
        </span>
        <div>
          <h2 id="save-confirmation-title" className="text-xl font-semibold text-ink">
            {confirmation.title}
          </h2>
          {confirmation.detail ? (
            <p className="mt-1 break-words text-sm font-medium text-ink-soft">{confirmation.detail}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-1 inline-flex min-h-11 items-center btn-pop btn-pop-coral px-8 text-sm font-semibold"
        >
          OK
        </button>
      </div>
    </div>
  );
}
