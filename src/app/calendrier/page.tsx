import { CalendarView } from "@/components/CalendarView";

export const metadata = { title: "Calendrier · LesTakam" };

/** Rendu à chaque ouverture, pour que la journée de départ soit toujours la bonne. */
export const dynamic = "force-dynamic";

export default function CalendarPage() {
  return <CalendarView initialIso={new Date().toISOString()} />;
}
