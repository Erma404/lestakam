import webpush, { type PushSubscription } from "web-push";

export interface PushMessage {
  title: string;
  body: string;
  url: string;
  /** Une notification de même étiquette remplace la précédente. */
  tag?: string;
}

/** Les clés VAPID sont saisies à la main dans Vercel, jamais dans le code. */
export function pushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

let ready = false;
function setup() {
  if (ready) return;
  webpush.setVapidDetails(
    "https://lestakam.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  ready = true;
}

/**
 * Envoie une notification à un appareil. Renvoie « expired » quand
 * l'appareil a retiré l'autorisation (l'abonnement est alors à oublier).
 */
export async function sendPush(
  subscription: PushSubscription,
  message: PushMessage,
): Promise<"sent" | "expired" | "failed"> {
  setup();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(message), { TTL: 60 * 60 });
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "expired";
    console.error("Notification non envoyée :", status, error);
    return "failed";
  }
}
