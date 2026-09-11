import { Card, CardTitle } from "./Card";

interface ComingSoonProps {
  emoji: string;
  title: string;
  description: string;
  /** Ce que cette section fera une fois terminée. */
  planned: string[];
}

/** Page en cours de construction : annonce clairement ce qui arrive. */
export function ComingSoon({ emoji, title, description, planned }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          En cours de construction
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {emoji} {title}
        </h1>
      </header>

      <Card>
        <CardTitle eyebrow="Bientôt disponible" title={description} />
        <ul className="flex flex-col gap-2">
          {planned.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 rounded-3xl bg-cream-deep/60 px-4 py-3 text-sm font-bold text-ink"
            >
              <span aria-hidden>🔜</span>
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
