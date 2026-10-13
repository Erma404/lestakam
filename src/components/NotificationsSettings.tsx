"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardTitle } from "./Card";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useHouseholdShared } from "@/lib/supabase/household";
import { useSession } from "@/lib/supabase/session";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Status =
  | "chargement"
  | "non-supporte"
  | "a-installer" // iPhone / iPad : seulement depuis l'app de l'écran d'accueil
  | "refuse"
  | "inactif"
  | "actif";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index);
  return bytes;
}

function isAppleMobile(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Active les rappels sur l'appareil en main (chaque téléphone et la tablette
 * s'activent séparément) : la veille à 19h, une heure avant un rendez-vous,
 * et les « À ne pas oublier » du jour à 8h.
 */
export function NotificationsSettings() {
  const { session } = useSession();
  const { shared, khloe, actingMember } = useHouseholdShared();
  const [status, setStatus] = useState<Status>("chargement");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function detect(): Promise<Status> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return isAppleMobile() && !isInstalled() ? "a-installer" : "non-supporte";
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const existing = await registration.pushManager.getSubscription();
      if (!cancelled) setSubscription(existing);
      if (Notification.permission === "denied") return "refuse";
      return existing ? "actif" : "inactif";
    }
    detect()
      .then((next) => {
        if (!cancelled) setStatus(next);
      })
      .catch(() => {
        if (!cancelled) setStatus("non-supporte");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!khloe) return;
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "refuse" : "inactif");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const created =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const json = created.toJSON();
      const { error } = (await getSupabaseClient()
        ?.from("push_subscriptions")
        .upsert({
          endpoint: created.endpoint,
          household_id: khloe.household_id,
          member_id: actingMember?.id ?? null,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        })) ?? { error: null };
      if (error) throw error;
      setSubscription(created);
      setStatus("actif");
      setMessage("Notifications activées sur cet appareil.");
    } catch (error) {
      console.error("Activation des notifications impossible :", error);
      setMessage("L'activation n'a pas abouti. Réessayez dans un instant.");
    } finally {
      setBusy(false);
    }
  }, [khloe, actingMember]);

  const disable = useCallback(async () => {
    if (!subscription) return;
    setBusy(true);
    setMessage(null);
    await getSupabaseClient()
      ?.from("push_subscriptions")
      .delete()
      .eq("endpoint", subscription.endpoint)
      .then(({ error }) => {
        if (error) console.error("Désinscription impossible :", error);
      });
    await subscription.unsubscribe().catch(() => undefined);
    setSubscription(null);
    setStatus("inactif");
    setBusy(false);
    setMessage("Notifications coupées sur cet appareil.");
  }, [subscription]);

  const test = useCallback(async () => {
    if (!subscription || !session) return;
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/notifications/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    }).catch(() => null);
    setBusy(false);
    setMessage(response?.ok ? "Notification d'essai envoyée." : "L'essai n'est pas parti. Réessayez dans un instant.");
  }, [subscription, session]);

  return (
    <Card>
      <CardTitle eyebrow="Rappels" title="Notifications" />
      <ul className="mb-4 flex flex-col gap-1.5 text-sm text-ink-soft">
        <li>La veille à 19h : les rendez-vous du lendemain.</li>
        <li>Une heure avant chaque rendez-vous (sauf l&apos;école).</li>
        <li>À 8h : les « À ne pas oublier » du jour.</li>
      </ul>

      {!VAPID_PUBLIC_KEY ? (
        <p className="rounded-3xl bg-cream-deep px-4 py-3 text-sm font-medium text-ink">
          Les notifications ne sont pas encore configurées sur le serveur.
        </p>
      ) : !shared ? (
        <p className="rounded-3xl bg-cream-deep px-4 py-3 text-sm font-medium text-ink">
          Connectez-vous avec votre compte parent pour recevoir les rappels.
        </p>
      ) : status === "chargement" ? null : status === "a-installer" ? (
        <div className="rounded-3xl bg-sun-soft px-4 py-3 text-sm font-medium text-ink">
          <p>Sur iPhone et iPad, les notifications passent par l&apos;app de l&apos;écran d&apos;accueil :</p>
          <ol className="mt-2 list-decimal pl-5">
            <li>Dans Safari, touchez le bouton Partager.</li>
            <li>Choisissez « Sur l&apos;écran d&apos;accueil ».</li>
            <li>Ouvrez LesTakam depuis l&apos;écran d&apos;accueil, puis revenez ici.</li>
          </ol>
        </div>
      ) : status === "non-supporte" ? (
        <p className="rounded-3xl bg-cream-deep px-4 py-3 text-sm font-medium text-ink">
          Ce navigateur ne permet pas les notifications.
        </p>
      ) : status === "refuse" ? (
        <p className="rounded-3xl bg-cream-deep px-4 py-3 text-sm font-medium text-ink">
          Les notifications ont été refusées pour LesTakam. Réautorisez-les dans les réglages de
          l&apos;appareil, puis revenez ici.
        </p>
      ) : status === "actif" ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1 text-sm font-medium text-forest">Activées sur cet appareil.</p>
          <button
            type="button"
            onClick={() => void test()}
            disabled={busy}
            className="btn-pop btn-pop-coral min-h-11 px-5 text-sm disabled:opacity-60"
          >
            Envoyer un essai
          </button>
          <button
            type="button"
            onClick={() => void disable()}
            disabled={busy}
            className="min-h-11 rounded-pill bg-surface px-5 text-sm font-medium text-ink-soft hover:bg-cream-deep"
          >
            Couper
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => void enable()}
          disabled={busy}
          className="btn-pop btn-pop-coral min-h-12 px-6 text-base disabled:opacity-60"
        >
          Activer sur cet appareil
        </button>
      )}

      {message ? (
        <p role="status" className="mt-3 text-sm font-medium text-ink-soft">
          {message}
        </p>
      ) : null}
    </Card>
  );
}
