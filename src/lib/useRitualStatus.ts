"use client";

import { useCallback } from "react";
import { useStoredState } from "./localStore";
import { useStars } from "./useStars";
import { RITUALS } from "./family";
import type { Ritual, RitualState } from "./types";

export type RitualStatusMap = Record<string, RitualState>;

const EMPTY_STATUSES: RitualStatusMap = {};

/**
 * Le suivi des rituels de Khloé pour une journée donnée, et le journal
 * d'étoiles qui va avec. Utilisé à la fois par le tableau des rituels et
 * par Tak, pour qu'une validation dite à l'oral compte de la même façon
 * qu'une validation faite du bout du doigt.
 */
export function useRitualStatus(today: string) {
  const [statuses, setStatuses] = useStoredState<RitualStatusMap>(`rituels:${today}`, EMPTY_STATUSES);
  const { total: starsEarned, logStar, unlogStar } = useStars();

  /** Coche ou décoche un rituel ; passe par « à valider » s'il faut l'accord d'un parent. */
  const toggle = useCallback(
    (ritual: Ritual) => {
      const state = statuses[ritual.id];
      if (state === undefined) {
        const nextState: RitualState = ritual.needsParentApproval ? "coche" : "valide";
        setStatuses((current) => ({ ...current, [ritual.id]: nextState }));
        if (nextState === "valide") logStar(ritual.id, today, ritual.stars);
      } else {
        setStatuses((current) => {
          const next = { ...current };
          delete next[ritual.id];
          return next;
        });
        if (state === "valide") unlogStar(ritual.id, today);
      }
    },
    [statuses, setStatuses, logStar, unlogStar, today],
  );

  /** Un parent confirme un rituel déjà coché par Khloé. */
  const approve = useCallback(
    (ritual: Ritual) => {
      setStatuses((current) => ({ ...current, [ritual.id]: "valide" }));
      logStar(ritual.id, today, ritual.stars);
    },
    [setStatuses, logStar, today],
  );

  /**
   * Valide directement un rituel par son identifiant, sans passer par l'état
   * intermédiaire « à valider ». Utilisé par Tak : dire qu'un rituel est fait
   * équivaut à ce qu'un parent le confirme lui-même.
   * Ne fait rien si le rituel est introuvable ; ne compte pas deux fois une
   * étoile déjà gagnée aujourd'hui.
   */
  const markValidated = useCallback(
    (ritualId: string): boolean => {
      const ritual = RITUALS.find((item) => item.id === ritualId);
      if (!ritual) return false;
      if (statuses[ritualId] === "valide") return true;
      setStatuses((current) => ({ ...current, [ritualId]: "valide" }));
      logStar(ritual.id, today, ritual.stars);
      return true;
    },
    [statuses, setStatuses, logStar, today],
  );

  return { statuses, starsEarned, toggle, approve, markValidated };
}
