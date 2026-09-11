"use client";

import { useState } from "react";
import { Avatar } from "./Avatar";
import { Card, CardTitle } from "./Card";
import { MEMBERS } from "@/lib/family";
import { useSession } from "@/lib/supabase/session";
import { useEvents } from "@/lib/useEvents";
import { useMeals } from "@/lib/useMeals";
import { useShoppingList } from "@/lib/useShoppingList";
import { useRewardGoals } from "@/lib/useRewardGoals";
import { useStars } from "@/lib/useStars";

const WARMTH_LABEL: Record<string, string> = {
  frileux: "Frileux",
  normal: "Normal",
  chaud: "A souvent chaud",
};

export function SettingsView() {
  const { configured, session, member, signOut } = useSession();
  const events = useEvents();
  const meals = useMeals();
  const shopping = useShoppingList();
  const rewardGoals = useRewardGoals();
  const stars = useStars();

  const [confirming, setConfirming] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function announce(message: string) {
    setDone(message);
    window.setTimeout(() => setDone(null), 4000);
  }

  const resets: { id: string; label: string; run: () => void }[] = [
    { id: "calendrier", label: "Calendrier", run: events.resetToDemo },
    { id: "repas", label: "Repas", run: meals.resetToDemo },
    { id: "courses", label: "Liste de courses", run: shopping.resetToDemo },
    { id: "objectifs", label: "Objectifs de récompense", run: rewardGoals.resetToDemo },
    { id: "etoiles", label: "Compteur d'étoiles", run: stars.resetToDemo },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          La configuration du foyer
        </p>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          ⚙️ Réglages
        </h1>
      </header>

      {done ? (
        <p role="status" className="rounded-card bg-sage-soft px-5 py-3 text-sm font-bold text-ink">
          {done}
        </p>
      ) : null}

      <Card>
        <CardTitle
          eyebrow="Connexion"
          title={configured ? "Base de données partagée" : "Mode local"}
        />
        {configured ? (
          <>
            <p className="text-sm font-semibold text-ink-soft">
              Connecté en tant que {member?.first_name ?? session?.user.email}.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 min-h-11 rounded-pill bg-white px-5 text-sm font-extrabold text-terracotta hover:bg-terracotta-soft"
            >
              Se déconnecter
            </button>
          </>
        ) : (
          <p className="text-sm font-semibold text-ink-soft">
            Les données restent sur cet appareil et ne sont pas encore partagées entre la
            tablette et les téléphones. Voir le fichier README du projet pour connecter la base.
          </p>
        )}
      </Card>

      <Card>
        <CardTitle eyebrow="Le foyer" title="Membres de la famille" />
        <ul className="flex flex-col gap-3">
          {MEMBERS.map((familyMember) => (
            <li key={familyMember.id} className="flex items-center gap-3">
              <Avatar member={familyMember} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-ink">{familyMember.firstName}</p>
                <p className="text-xs font-semibold text-ink-faint">
                  {familyMember.role === "parent" ? "Parent" : "Enfant"} ·{" "}
                  {WARMTH_LABEL[familyMember.warmthPreference]}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-semibold text-ink-faint">
          Photos et préférences détaillées : bientôt disponible.
        </p>
      </Card>

      <Card>
        <CardTitle eyebrow="Données" title="Revenir aux exemples de départ" />
        <p className="mb-3 text-sm font-semibold text-ink-soft">
          Remet une rubrique telle qu&apos;elle était à l&apos;installation. Ce qui a été ajouté ou
          modifié sur cet appareil sera perdu.
        </p>
        <ul className="flex flex-col gap-2">
          {resets.map((reset) => (
            <li key={reset.id} className="flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-ink">{reset.label}</span>
              {confirming === reset.id ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      reset.run();
                      setConfirming(null);
                      announce(`« ${reset.label} » a été remis à zéro.`);
                    }}
                    className="min-h-9 btn-pop btn-pop-terracotta px-4 text-xs font-extrabold "
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="min-h-9 rounded-pill bg-cream-deep px-4 text-xs font-extrabold text-ink-soft"
                  >
                    Annuler
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(reset.id)}
                  className="min-h-9 rounded-pill px-4 text-xs font-extrabold text-ink-soft hover:bg-cream-deep"
                >
                  Réinitialiser
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
