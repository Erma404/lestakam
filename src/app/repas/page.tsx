import { MealsView } from "@/components/MealsView";

export const metadata = { title: "Repas · LesTakam" };

/** Rendu à chaque ouverture, pour que la semaine de départ soit toujours la bonne. */
export const dynamic = "force-dynamic";

export default function MealsPage() {
  return <MealsView initialIso={new Date().toISOString()} />;
}
