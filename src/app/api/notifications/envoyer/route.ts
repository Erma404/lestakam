import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { PushSubscription } from "web-push";
import { currentTime, todayKey } from "@/lib/dates";
import { planNotifications } from "@/lib/notifications";
import { pushConfigured, sendPush } from "@/lib/pushServer";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";
import type { CalendarEvent, Reminder } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HouseholdBatch {
  household_id: string;
  events: CalendarEvent[];
  reminders: Reminder[];
  subscriptions: PushSubscription[];
  sent: string[];
}

function authorized(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Appelée toutes les 5 minutes par le planificateur de Supabase (pg_cron) :
 * envoie, à chaque appareil du foyer, les rappels dus à cette heure-ci.
 * Les données passent par des fonctions de la base protégées par le même
 * mot de passe ; aucune clé « service_role » n'est utilisée.
 */
export async function POST(request: Request) {
  const secret = process.env.NOTIFICATIONS_SECRET ?? "";
  if (secret.length < 32 || !authorized(request, secret)) {
    return Response.json({ error: "Accès refusé" }, { status: 401 });
  }
  if (!pushConfigured() || !isSupabaseConfigured) {
    return Response.json({ error: "Notifications non configurées" }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.rpc("notifications_a_preparer", { secret });
  if (error) {
    console.error("Lecture des rappels impossible :", error);
    return Response.json({ error: "Lecture impossible" }, { status: 500 });
  }

  const now = new Date();
  const today = todayKey(now);
  const time = currentTime(now);
  let sentCount = 0;

  for (const household of (data ?? []) as HouseholdBatch[]) {
    const planned = planNotifications(
      household.events ?? [],
      household.reminders ?? [],
      today,
      time,
      new Set(household.sent ?? []),
    );
    for (const notification of planned) {
      // Noté avant l'envoi : un passage suivant ne la renverra pas, même
      // si un appareil répond lentement.
      await supabase.rpc("notification_envoyee", {
        secret,
        foyer: household.household_id,
        cle: notification.key,
      });
      for (const subscription of household.subscriptions ?? []) {
        const result = await sendPush(subscription, { ...notification, tag: notification.key });
        if (result === "sent") sentCount += 1;
        if (result === "expired") {
          await supabase.rpc("abonnement_perime", { secret, adresse: subscription.endpoint });
        }
      }
    }
  }

  return Response.json({ ok: true, sent: sentCount, at: `${today} ${time}` });
}
