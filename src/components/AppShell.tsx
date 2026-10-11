"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInScreen } from "./SignInScreen";
import { TakWidget } from "./TakWidget";
import { RewardCelebration } from "./RewardCelebration";
import { Icon, type IconName } from "./Icon";
import { useSession } from "@/lib/supabase/session";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  /** Masqué dans la barre du bas sur téléphone, pour garder 5 entrées maximum. */
  secondary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Accueil", icon: "home" },
  { href: "/calendrier", label: "Calendrier", icon: "calendar" },
  { href: "/rituels", label: "Rituels", icon: "rituals" },
  { href: "/recompenses", label: "Récompenses", icon: "star" },
  { href: "/recettes", label: "Recettes", icon: "recipes", secondary: true },
  { href: "/listes", label: "Listes", icon: "cart", secondary: true },
  { href: "/reglages", label: "Réglages", icon: "settings", secondary: true },
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
          <p className="text-base font-medium text-ink-soft">Ouverture de LesTakam…</p>
        </main>
      );
    }
    if (!session) {
      return <SignInScreen />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Barre latérale vert forêt : tablette de la cuisine et ordinateur */}
      <nav
        aria-label="Navigation principale"
        className="sticky top-0 hidden h-screen shrink-0 flex-col gap-1 bg-forest px-3 py-6 md:flex md:w-28 lg:w-32"
      >
        <p className="mb-4 text-center text-lg font-semibold tracking-tight text-white">Takam</p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-xs font-medium transition-colors ${
                active ? "bg-surface text-forest" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={item.icon} className="h-6 w-6" />
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
        className="fixed inset-x-0 bottom-0 z-20 flex justify-around rounded-t-card bg-forest px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
      >
        {NAV_ITEMS.filter((item) => !item.secondary).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-xs font-medium ${
                active ? "bg-surface text-forest" : "text-white/80"
              }`}
            >
              <Icon name={item.icon} className="h-6 w-6" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-label="Plus de pages : Recettes, Listes, Réglages"
          className={`flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-1.5 text-xs font-medium ${
            SECONDARY_ITEMS.some((item) => isActive(pathname, item.href))
              ? "bg-surface text-forest"
              : "text-white/80"
          }`}
        >
          <Icon name="more" className="h-6 w-6" />
          Plus
        </button>
      </nav>

      {moreOpen ? <MoreSheet pathname={pathname} onClose={() => setMoreOpen(false)} /> : null}

      <TakWidget />
      <RewardCelebration />
    </div>
  );
}

const SECONDARY_ITEMS = NAV_ITEMS.filter((item) => item.secondary);

/**
 * Tiroir mobile pour les pages qui n'ont pas leur place dans la barre du
 * bas (5 entrées maximum) : Recettes, Listes, Réglages restent
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
      className="fixed inset-0 z-30 flex items-end bg-ink/30 md:hidden"
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Autres pages"
        className="w-full rounded-t-card bg-cream p-5 pb-8"
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Plus</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-soft"
          >
            <Icon name="close" className="h-5 w-5" />
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
                className={`flex flex-col items-center gap-1.5 rounded-3xl bg-surface px-2 py-4 text-xs font-medium ${
                  active ? "text-coral" : "text-ink-soft"
                }`}
              >
                <Icon name={item.icon} className="h-6 w-6" />
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
    <p className="border-b border-line bg-sun-soft px-4 py-2 text-center text-xs font-medium text-ink-soft">
      Mode local : les données restent sur cet appareil et ne sont pas encore partagées.
    </p>
  );
}
