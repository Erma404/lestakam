"use client";

import { useSession } from "./session";

/**
 * Le foyer partagé, vu à travers Khloé : ses objectifs et ses rituels sont
 * les mêmes pour tout le monde, une fois la base connectée. Tant que ce
 * n'est pas le cas — ou que le foyer de Khloé n'est pas encore créé côté
 * base (`supabase/02-donnees-de-depart.sql` pas encore lancé) — chaque
 * appareil retombe sur sa propre copie locale.
 */
export function useHouseholdShared() {
  const { configured, member, members } = useSession();
  const khloe = members.find((row) => row.first_name === "Khloé") ?? null;

  return {
    shared: configured && khloe !== null && member !== null,
    khloe,
    actingMember: member,
  };
}
