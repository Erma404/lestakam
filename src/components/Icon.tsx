/**
 * Icônes au trait, dessinées sur une grille de 24 px avec un trait de 1,8 px
 * à bouts ronds — un seul jeu cohérent pour la navigation et les actions,
 * à la place des emojis décoratifs.
 */

const PATHS = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9v10.5h12V9" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
      <path d="M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01" />
    </>
  ),
  rituals: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  star: <path d="m12 4 2.4 5 5.4.7-4 3.8 1 5.4L12 16.3 7.2 19l1-5.4-4-3.8 5.4-.7z" />,
  recipes: (
    <>
      <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 1 5 16z" />
      <path d="M5 16a3.5 3.5 0 0 1 3.5-3.5H19" />
      <path d="M9.5 8.5h5" />
    </>
  ),
  cart: (
    <>
      <path d="M3.5 4.5h2.2l2 10.5h10.1l1.9-7.5H6.6" />
      <circle cx="9" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18" cy="12" r="1.2" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  close: <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />,
  pin: (
    <>
      <path d="M12 20.5s-6.5-5.6-6.5-10.7a6.5 6.5 0 0 1 13 0c0 5.1-6.5 10.7-6.5 10.7z" />
      <circle cx="12" cy="9.8" r="2.3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  check: <path d="m6 12.5 4 4 8-9" />,
  arrowRight: <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />,
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </>
  ),
  volume: (
    <>
      <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "h-6 w-6",
  strokeWidth = 1.8,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/**
 * Tak, le renard de la famille, dessiné aux couleurs de l'application :
 * tête corail, museau crème, yeux et truffe à l'encre.
 */
export function TakFace({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path d="M8 6 20 16H28L40 6 41 26C41 36 33 43 24 43S7 36 7 26Z" fill="var(--color-coral)" />
      <path d="M11 11 17 16 12 21ZM37 11 31 16 36 21Z" fill="oklch(0.45 0.12 33)" />
      <path d="M24 43C17 43 12 38 11.5 31 16 31 20 34 24 34S32 31 36.5 31C36 38 31 43 24 43Z" fill="var(--color-cream)" />
      <circle cx="17.5" cy="25" r="2.2" fill="var(--color-ink)" />
      <circle cx="30.5" cy="25" r="2.2" fill="var(--color-ink)" />
      <ellipse cx="24" cy="34" rx="2.6" ry="1.9" fill="var(--color-ink)" />
    </svg>
  );
}
