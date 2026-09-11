import { RewardsBoard } from "@/components/RewardsBoard";

export const metadata = { title: "Récompenses · LesTakam" };

export const dynamic = "force-dynamic";

export default function RewardsPage() {
  return <RewardsBoard initialIso={new Date().toISOString()} />;
}
