import { RitualsBoard } from "@/components/RitualsBoard";

export const metadata = { title: "Rituels · LesTakam" };

/** Rendu à chaque ouverture, pour que la journée affichée soit toujours la bonne. */
export const dynamic = "force-dynamic";

export default function RitualsPage() {
  return <RitualsBoard initialIso={new Date().toISOString()} />;
}
