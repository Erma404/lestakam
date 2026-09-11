import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Listes · LesTakam" };

export default function ListsPage() {
  return (
    <ComingSoon
      emoji="🛒"
      title="Listes"
      description="La liste de courses partagée"
      planned={[
        "Cocher les articles depuis le téléphone pendant les courses",
        "Liste partagée entre Stéphane et Ernestine, mise à jour en direct",
        "Articles regroupés par rayon",
      ]}
    />
  );
}
