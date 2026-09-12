"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInScreen } from "./SignInScreen";
import { TakWidget } from "./TakWidget";
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
  { href: "/repas", label: "Repas", emoji: "🍽️", secondary: true },
  { href: "/recettes", label: "Recettes", emoji: "📖", secondary: true },
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
  const [moreOpen, setMoreOpen] = useState(false);

  // Change de page : referme le tiroir « Plus » plutôt que de le laisser
  // ouvert par-dessus l'écran suivant (cliquer un lien du tiroir le ferme
  // déjà explicitement ; ceci couvre aussi une navigation par ailleurs,
  // ex. le bouton précédent du téléphone).
  const [pathnameAtOpen, setPathnameAtOpen] = useState(pathname);
  if (pathname !== pathnameAtOpen) {
    setPathnameAtOpen(pathname);
    if (moreOpen) setMoreOpen(false);
  }

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
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-label="Plus de pages : Repas, Recettes, Listes, Réglages"
          className={`flex min-w-16 flex-col items-center gap-0.5 rounded-2xl px-3 py-2 text-[11px] font-bold ${
            SECONDARY_ITEMS.some((item) => isActive(pathname, item.href))
              ? "bg-sage-soft text-ink"
              : "text-ink-soft"
          }`}
        >
          <span className="text-xl" aria-hidden>
            ⋯
          </span>
          Plus
        </button>
      </nav>

      {moreOpen ? <MoreSheet pathname={pathname} onClose={() => setMoreOpen(false)} /> : null}

      <TakWidget />
    </div>
  );
}

const SECONDARY_ITEMS = NAV_ITEMS.filter((item) => item.secondary);

/**
 * Tiroir mobile pour les pages qui n'ont pas leur place dans la barre du
 * bas (5 entrées maximum) : Repas, Recettes, Listes, Réglages restent
 * sinon injoignables sur téléphone, la barre latérale qui les liste étant
 * réservée à la tablette et à l'ordinateur.
 */
function MoreSheet({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-30 flex items-end bg-ink/30 backdrop-blur-sm md:hidden"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Autres pages"
        className="w-full rounded-t-card bg-cream p-5 pb-8 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-extrabold text-ink">Plus</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-bold text-ink-soft"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {SECONDARY_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1.5 rounded-3xl px-2 py-4 text-xs font-bold ${
                  active ? "bg-sage-soft text-ink" : "bg-white text-ink-soft"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  {item.emoji}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
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
