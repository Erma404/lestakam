"use client";

import { useRef, useState } from "react";
import { Icon } from "./Icon";

/** Distance (px) au-delà de laquelle le relâchement supprime la ligne. */
const DELETE_THRESHOLD = 110;
/** Mouvement minimal avant de considérer le geste comme un glissement (et non un appui). */
const DRAG_START = 8;

/**
 * Une ligne qu'on fait glisser vers la gauche pour la supprimer, comme dans
 * une messagerie : le fond corail « Supprimer » apparaît sous le doigt, et
 * au-delà du seuil la ligne part. Le défilement vertical reste libre
 * (`touch-action: pan-y`), et un simple appui garde son effet habituel.
 */
export function SwipeToDelete({
  children,
  onDelete,
  label,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  /** Ce qui sera supprimé, pour les lecteurs d'écran. */
  label: string;
}) {
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(false);
  // Pendant le glissement, la ligne suit le doigt sans animation.
  const [isDragging, setIsDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragging = useRef(false);

  function onPointerDown(event: React.PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    dragging.current = false;
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!start.current || start.current.id !== event.pointerId) return;
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    if (!dragging.current) {
      // Un geste surtout vertical, c'est un défilement : on laisse faire.
      if (Math.abs(dy) > Math.abs(dx) || Math.abs(dx) < DRAG_START) return;
      dragging.current = true;
      setIsDragging(true);
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }
    setOffset(Math.min(0, dx));
  }

  function onPointerUp() {
    if (!start.current) return;
    start.current = null;
    setIsDragging(false);
    if (!dragging.current) return;
    if (offset <= -DELETE_THRESHOLD) {
      setLeaving(true);
      setOffset(-window.innerWidth);
      window.setTimeout(onDelete, 180);
    } else {
      setOffset(0);
    }
  }

  // Après un glissement, l'appui qui le termine ne doit pas ouvrir la ligne.
  function onClickCapture(event: React.MouseEvent) {
    if (dragging.current) {
      event.stopPropagation();
      event.preventDefault();
      dragging.current = false;
    }
  }

  const armed = offset <= -DELETE_THRESHOLD;

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className={`absolute inset-0 flex items-center justify-end gap-2 rounded-2xl pr-5 text-sm font-medium text-white transition-colors ${
          armed ? "bg-coral" : "bg-coral/70"
        } ${offset === 0 ? "opacity-0" : "opacity-100"}`}
      >
        <Icon name="close" className="h-5 w-5" />
        Supprimer
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        style={{ transform: `translateX(${offset}px)` }}
        className={`relative touch-pan-y bg-surface ${
          isDragging ? "" : "transition-transform duration-200 ease-out"
        } ${leaving ? "opacity-0" : ""}`}
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
