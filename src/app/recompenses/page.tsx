import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Récompenses · LesTakam" };

export default function RewardsPage() {
  return (
    <ComingSoon
      emoji="⭐"
      title="Récompenses"
      description="Les étoiles et les objectifs de Khloé"
      planned={[
        "Compteur d'étoiles de la semaine et du mois",
        "Jauge de progression vers la prochaine récompense",
        "Objectifs personnalisables par les parents",
        "Historique des récompenses débloquées",
      ]}
    />
  );
}
