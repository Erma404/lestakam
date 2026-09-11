import { TakView } from "@/components/TakView";

export const metadata = { title: "Tak · LesTakam" };

export const dynamic = "force-dynamic";

export default function TakPage() {
  return <TakView initialIso={new Date().toISOString()} />;
}
