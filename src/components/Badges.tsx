/**
 * Petites illustrations de la gamification de Khloé, dessinées aux couleurs
 * de l'application : le badge de niveau (une étoile qui porte le numéro) et
 * la flamme de la série de jours d'affilée.
 */

export function LevelBadge({ level, className = "h-14 w-14" }: { level: number; className?: string }) {
  return (
    <svg viewBox="0 0 56 56" aria-hidden className={className}>
      <circle cx="28" cy="28" r="27" fill="var(--color-lilac-soft)" />
      <path
        d="M28 7.5 33.6 19l12.7 1.8-9.2 8.9 2.2 12.6L28 36.3l-11.3 6 2.2-12.6-9.2-8.9L22.4 19Z"
        fill="var(--color-sun)"
        stroke="oklch(0.62 0.13 75)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="28"
        y="31.5"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill="var(--color-ink)"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {level}
      </text>
    </svg>
  );
}

export function StreakFlame({ lit = true, className = "h-14 w-14" }: { lit?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 56 56" aria-hidden className={className}>
      <circle cx="28" cy="28" r="27" fill={lit ? "var(--color-coral-soft)" : "var(--color-cream-deep)"} />
      <path
        d="M28 9c2 7 11 11 11 22a11 11 0 0 1-22 0c0-5 2.5-8.5 5-11 0 4 1.5 6 3.5 7 0-7 1-12.5 2.5-18Z"
        fill={lit ? "var(--color-coral)" : "var(--color-ink-faint)"}
      />
      <path
        d="M28 26c1 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 0 1-11 0c0-3 1.5-4.5 3-6 0 2 1 3 2 3.5 0-3.3.3-5.5.5-8Z"
        fill={lit ? "var(--color-sun)" : "var(--color-cream)"}
      />
    </svg>
  );
}
