import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Repas · LesTakam" };

export default function MealsPage() {
  return (
    <ComingSoon
      emoji="🍽️"
      title="Repas"
      description="Le menu de la semaine"
      planned={[
        "Planifier les repas du midi et du soir",
        "Voir le repas du jour directement sur le tableau de bord",
        "Envoyer les ingrédients vers la liste de courses",
      ]}
    />
  );
}
