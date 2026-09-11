import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Tak · LesTakam" };

export default function TakPage() {
  return (
    <ComingSoon
      emoji="💬"
      title="Tak"
      description="Votre assistant familial, à la voix comme au clavier"
      planned={[
        "Discussion écrite avec un ton chaleureux",
        "Commande vocale, par exemple « ajoute le cours de natation de Khloé samedi à 10h »",
        "Confirmation demandée avant toute modification du calendrier",
        "Choix du modèle d'intelligence artificielle dans les réglages",
      ]}
    />
  );
}
