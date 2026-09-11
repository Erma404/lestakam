"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInScreen } from "./SignInScreen";
import { useSession } from "@/lib/supabase/session";

interface NavItem {
  href: string;
  label: string;
  emoji: string;
  /** Masqué dans la barre du bas sur téléphone, pour garder 5 entrées maximum. */
  secondary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", emoji: "🏡" },
  { href: "/calendrier", label: "Calendrier", emoji: "🗓️" },
  { href: "/rituels", label: "Rituels", emoji: "✅" },
  { href: "/recompenses", label: "Récompenses", emoji: "⭐" },
  { href: "/tak", label: "Tak", emoji: "💬" },
  { href: "/repas", label: "Repas", emoji: "🍽️", secondary: true },
  { href: "/listes", label: "Listes", emoji: "🛒", secondary: true },
  { href: "/reglages", label: "Réglages", emoji: "⚙️", secondary: true },
];

/** Pages accessibles sans être connecté. */
const PUBLIC_PATHS = ["/connexion/retour"];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { configured, loading, session } = useSession();

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // La base est connectée : l'application est réservée aux membres du foyer.
  if (configured) {
    if (loading) {
      return (
        <main className="flex min-h-screen items-center justify-center p-6">
          <p className="text-base font-bold text-ink-soft">Ouverture de LesTakam…</p>
        </main>
      );
    }
    if (!session) {
      return <SignInScreen />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barre latérale : tablette de la cuisine et ordinateur */}
      <nav
        aria-label="Navigation principale"
        className="hidden shrink-0 flex-col gap-1 border-r border-line bg-cream-deep/60 px-3 py-6 md:flex md:w-28 lg:w-36"
      >
        <div className="mb-4 px-2 text-center">
          <span className="text-2xl" aria-hidden>
            🏠
          </span>
          <p className="mt-1 text-sm font-extrabold tracking-tight text-ink">LesTakam</p>
        </div>

        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 rounded-3xl px-2 py-3 text-xs font-bold transition-colors ${
                active
                  ? "bg-sage-soft text-ink"
                  : "text-ink-soft hover:bg-cream hover:text-ink"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {item.emoji}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        {!configured ? <LocalModeNotice /> : null}
        <main>{children}</main>
      </div>

      {/* Barre du bas : téléphones des parents */}
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-line bg-cream/95 px-2 py-2 backdrop-blur md:hidden"
      >
        {NAV_ITEMS.filter((item) => !item.secondary).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-16 flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-[11px] font-bold ${
                active ? "bg-sage-soft text-ink" : "text-ink-soft"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {item.emoji}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/** Rappelle que les données ne sont pas encore partagées entre les appareils. */
function LocalModeNotice() {
  return (
    <p className="border-b border-line bg-sun-soft px-4 py-2 text-center text-xs font-bold text-ink-soft">
      Mode local : les données restent sur cet appareil et ne sont pas encore partagées.
    </p>
  );
}
