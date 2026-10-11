"use client";

import { useEffect, useRef, useState } from "react";
import { useStars } from "@/lib/useStars";
import { useRewardGoals } from "@/lib/useRewardGoals";
import { goalsToUnlock } from "@/lib/rewards";
import { todayKey } from "@/lib/dates";
import { memberById } from "@/lib/family";
import type { RewardGoal } from "@/lib/types";

const CONFETTI_COLORS = ["#f2c14e", "#e8603f", "#1f6b45", "#7ba7d9", "#e58fa4", "#a585d0"];

/**
 * Fête l'objectif atteint, quelle que soit la page ouverte : c'est souvent
 * en validant un rituel que Khloé franchit un palier, pas depuis la page
 * Récompenses. Débloque l'objectif dans le stockage, puis affiche un
 * grand « Bravo Khloé » avec des confettis.
 */
export function RewardCelebration() {
  const { total } = useStars();
  const { goals, markAchieved } = useRewardGoals();
  const [celebrating, setCelebrating] = useState<RewardGoal | null>(null);
  // Évite de fêter deux fois le même objectif le temps que le stockage
  // renvoie la date de déblocage.
  const celebrated = useRef(new Set<string>());

  useEffect(() => {
    const toUnlock = goalsToUnlock(goals, total).filter((goal) => !celebrated.current.has(goal.id));
    if (toUnlock.length === 0) return;
    const today = todayKey(new Date());
    for (const goal of toUnlock) {
      celebrated.current.add(goal.id);
      markAchieved(goal.id, today);
    }
    // Le palier le plus élevé franchi : c'est celui qui mérite la fête.
    const best = [...toUnlock].sort((a, b) => b.starsRequired - a.starsRequired)[0];
    const timer = window.setTimeout(() => setCelebrating(best), 0);
    return () => window.clearTimeout(timer);
  }, [goals, total, markAchieved]);

  if (!celebrating) return null;
  return <CelebrationOverlay goal={celebrating} onClose={() => setCelebrating(null)} />;
}

function CelebrationOverlay({ goal, onClose }: { goal: RewardGoal; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firstName = memberById(goal.memberId)?.firstName ?? "Khloé";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);

    // Deux salves, depuis les coins bas, puis une pluie depuis le haut.
    const pieces = Array.from({ length: 220 }, (_, index) => {
      const fromLeft = index % 2 === 0;
      const burst = index < 140;
      return {
        x: burst ? (fromLeft ? 0 : width) : Math.random() * width,
        y: burst ? height * 0.85 : -20 - Math.random() * height * 0.5,
        vx: burst ? (fromLeft ? 1 : -1) * (4 + Math.random() * 9) : (Math.random() - 0.5) * 2,
        vy: burst ? -(10 + Math.random() * 12) : 2 + Math.random() * 3,
        size: 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      };
    });

    let frame = 0;
    const start = performance.now();
    function draw(now: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      for (const piece of pieces) {
        piece.vy += 0.25;
        piece.vx *= 0.99;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rotation);
        context.fillStyle = piece.color;
        context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
        context.restore();
      }
      if (now - start < 6000) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, width, height);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 h-full w-full" />
      <div
        className="animate-pop-in relative w-full max-w-md rounded-3xl bg-cream px-6 py-8 text-center"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-sun-soft text-7xl" aria-hidden>
          {goal.emoji}
        </p>
        <h2 id="celebration-title" className="mt-4 font-display text-4xl font-medium text-ink">
          Bravo {firstName} !
        </h2>
        <p className="mt-3 text-lg font-medium text-ink">
          Tu as gagné : {goal.label}
        </p>
        <p className="mt-1 text-base font-medium text-ink-soft">
          {goal.starsRequired} étoiles récoltées. Continue tes efforts !
        </p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="mt-6 inline-flex min-h-14 items-center btn-pop btn-pop-coral px-8 text-base font-semibold"
        >
          Youpi !
        </button>
      </div>
    </div>
  );
}
