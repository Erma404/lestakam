import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Réglages · LesTakam" };

export default function SettingsPage() {
  return (
    <ComingSoon
      emoji="⚙️"
      title="Réglages"
      description="La configuration du foyer"
      planned={[
        "Photos et préférences de chaque membre de la famille",
        "Localisation utilisée pour la météo",
        "Choix du modèle d'intelligence artificielle de Tak",
        "Gestion des appareils autorisés",
      ]}
    />
  );
}
