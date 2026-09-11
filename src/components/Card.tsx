interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Carte arrondie, base visuelle de toute l'application. */
export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-card border border-line bg-white/80 p-5 shadow-[0_3px_0_var(--color-line)] sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

interface CardTitleProps {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}

export function CardTitle({ eyebrow, title, action }: CardTitleProps) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      </div>
      {action}
    </header>
  );
}
