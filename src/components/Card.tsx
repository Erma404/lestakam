interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Surface blanche arrondie, sans bordure ni ombre, posée sur le fond pêche. */
export function Card({ children, className = "" }: CardProps) {
  return <section className={`rounded-card bg-surface p-5 sm:p-6 ${className}`}>{children}</section>;
}

interface CardTitleProps {
  /** Précision discrète au-dessus du titre (jour, lieu…), en casse normale. */
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}

export function CardTitle({ eyebrow, title, action }: CardTitleProps) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? <p className="text-sm font-normal text-ink-soft">{eyebrow}</p> : null}
        <h2 className="font-display text-xl font-medium text-ink sm:text-2xl">{title}</h2>
      </div>
      {action}
    </header>
  );
}

/** Lien d'action secondaire en corail, façon « Voir tout → ». */
export function CardLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-coral hover:underline"
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}
