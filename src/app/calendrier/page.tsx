import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Calendrier · LesTakam" };

export default function CalendarPage() {
  return (
    <ComingSoon
      emoji="🗓️"
      title="Calendrier"
      description="La vue complète du calendrier familial"
      planned={[
        "Ajouter, modifier et supprimer un événement",
        "Activités qui se répètent chaque semaine, comme la natation",
        "Filtrer par membre de la famille",
        "Connexion optionnelle à un calendrier Google ou Apple",
      ]}
    />
  );
}
