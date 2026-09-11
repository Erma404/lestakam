"use client";

import { useEffect, useState } from "react";

/**
 * Horloge partagée du tableau de bord. La tablette de la cuisine reste
 * allumée en permanence : l'heure et la date doivent avancer toutes seules,
 * y compris au passage de minuit.
 *
 * @param initialIso heure calculée par le serveur, utilisée pour le premier
 *   affichage afin que la page ne change pas au moment de son activation.
 */
export function useNow(initialIso: string, intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    // Recalage juste après l'affichage, puis rafraîchissement régulier.
    const firstTick = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => {
      clearTimeout(firstTick);
      clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
