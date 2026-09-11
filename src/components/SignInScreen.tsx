"use client";

import { useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

type Status = "saisie-email" | "envoi" | "saisie-code" | "verification" | "erreur";

/** Délai au-delà duquel on cesse d'attendre le serveur, en millisecondes. */
const TIMEOUT_MS = 15_000;

/**
 * Le Wi-Fi de la maison peut être capricieux : plutôt que de laisser
 * tourner indéfiniment, on abandonne au bout d'un délai raisonnable.
 */
async function withTimeout<T>(promise: Promise<T>): Promise<T | "delai-depasse"> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"delai-depasse">((resolve) => {
    timer = setTimeout(() => resolve("delai-depasse"), TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Connexion par code reçu par e-mail : aucun mot de passe à créer, ni à
 * retenir. Un code plutôt qu'un lien cliquable, parce que les messageries
 * et antivirus ouvrent parfois les liens tout seuls pour les vérifier —
 * ce qui grille le lien avant même que la personne ait cliqué dessus.
 */
export function SignInScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("saisie-email");
  const [message, setMessage] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  async function handleSendCode(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("erreur");
      setMessage("La base de données n'est pas encore configurée.");
      return;
    }

    setStatus("envoi");
    setMessage(null);

    const result = await withTimeout(
      supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      }),
    );

    if (result === "delai-depasse") {
      setStatus("saisie-email");
      setMessage(
        "Le serveur met trop de temps à répondre. Vérifiez la connexion internet, puis réessayez.",
      );
      return;
    }

    if (result.error) {
      setStatus("saisie-email");
      setMessage(
        "L'envoi n'a pas fonctionné. Vérifiez l'adresse e-mail et réessayez dans un instant.",
      );
      return;
    }

    setStatus("saisie-code");
    setCode("");
    window.setTimeout(() => codeInputRef.current?.focus(), 0);
  }

  async function handleVerifyCode(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    setStatus("verification");
    setMessage(null);

    const result = await withTimeout(
      supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      }),
    );

    if (result === "delai-depasse") {
      setStatus("saisie-code");
      setMessage(
        "Le serveur met trop de temps à répondre. Vérifiez la connexion internet, puis réessayez.",
      );
      return;
    }

    if (result.error) {
      setStatus("saisie-code");
      setMessage("Ce code n'est plus valable. Vérifiez-le, ou demandez-en un nouveau.");
      return;
    }

    // La connexion se propage toute seule : SessionProvider écoute les
    // changements de session et affiche l'application dès qu'elle arrive.
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-card border border-line bg-white/80 p-6 shadow-[0_2px_12px_rgba(47,42,36,0.05)] sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-4xl" aria-hidden>
            🏠
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">LesTakam</h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Le tableau de bord de la famille
          </p>
        </div>

        {status === "saisie-code" || status === "verification" ? (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <div className="rounded-card bg-sage-soft px-5 py-4 text-center">
              <p className="text-2xl" aria-hidden>
                📬
              </p>
              <p className="mt-1 text-sm font-bold text-ink">
                Un code a été envoyé à <strong>{email}</strong>
              </p>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Code reçu par e-mail
              </span>
              <input
                ref={codeInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(changeEvent) => setCode(changeEvent.target.value)}
                required
                maxLength={8}
                placeholder="123456"
                className="min-h-16 w-full rounded-3xl border border-line bg-white px-4 py-3 text-center text-3xl font-extrabold tracking-[0.3em] text-ink outline-none placeholder:text-ink-faint focus:border-sage focus:ring-2 focus:ring-sage-soft"
              />
            </label>

            {message ? (
              <p role="alert" className="rounded-3xl bg-rose-soft px-4 py-3 text-sm font-bold text-ink">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "verification"}
              className="min-h-14 btn-pop btn-pop-sage px-6 text-base font-extrabold  disabled:opacity-60"
            >
              {status === "verification" ? "Vérification…" : "Se connecter"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStatus("saisie-email");
                setMessage(null);
                setCode("");
              }}
              className="min-h-11 rounded-pill bg-white px-5 text-sm font-extrabold text-ink-soft"
            >
              Utiliser une autre adresse
            </button>
          </form>
        ) : (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Votre adresse e-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(changeEvent) => setEmail(changeEvent.target.value)}
                required
                autoComplete="email"
                placeholder="prenom@exemple.fr"
                className="min-h-14 w-full rounded-3xl border border-line bg-white px-4 py-3 text-base font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-sage focus:ring-2 focus:ring-sage-soft"
              />
            </label>

            <p className="text-xs font-semibold text-ink-soft">
              Nous vous enverrons un code à saisir. Aucun mot de passe n&apos;est nécessaire.
            </p>

            {message ? (
              <p role="alert" className="rounded-3xl bg-rose-soft px-4 py-3 text-sm font-bold text-ink">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "envoi"}
              className="min-h-14 btn-pop btn-pop-sage px-6 text-base font-extrabold  disabled:opacity-60"
            >
              {status === "envoi" ? "Envoi en cours…" : "Recevoir mon code de connexion"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
