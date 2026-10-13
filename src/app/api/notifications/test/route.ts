import { createClient } from "@supabase/supabase-js";
import type { PushSubscription } from "web-push";
import { pushConfigured, sendPush } from "@/lib/pushServer";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

export const runtime = "nodejs";

function isSubscription(value: unknown): value is PushSubscription {
  const sub = value as PushSubscription | null;
  return (
    typeof sub?.endpoint === "string" &&
    sub.endpoint.startsWith("https://") &&
    typeof sub.keys?.p256dh === "string" &&
    typeof sub.keys?.auth === "string"
  );
}

/** Notification d'essai, envoyée à l'appareil qui la demande (parent connecté). */
export async function POST(request: Request) {
  if (!pushConfigured() || !isSupabaseConfigured) {
    return Response.json({ error: "Notifications non configurées" }, { status: 503 });
  }
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: user } = await supabase.auth.getUser(token);
  if (!token || !user.user) return Response.json({ error: "Connexion requise" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { subscription?: unknown } | null;
  if (!isSubscription(body?.subscription)) {
    return Response.json({ error: "Appareil inconnu" }, { status: 400 });
  }
  const result = await sendPush(body.subscription, {
    title: "Tak est prêt",
    body: "Les rappels de la famille arriveront ici.",
    url: "/reglages",
    tag: "essai",
  });
  return Response.json({ ok: result === "sent" }, { status: result === "sent" ? 200 : 502 });
}
