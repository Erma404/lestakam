import { Dashboard } from "@/components/Dashboard";

/** Rendu à chaque ouverture, pour que la date de départ soit toujours la bonne. */
export const dynamic = "force-dynamic";

export default function HomePage() {
  // Le tableau de bord prend ensuite le relais côté navigateur : l'heure,
  // la date et la météo se rafraîchissent sans rechargement de la page.
  return <Dashboard initialIso={new Date().toISOString()} />;
}
