"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Page d'arrivée du lien reçu par e-mail. Elle finalise la connexion
 * puis renvoie aussitôt vers le tableau de bord.
 */
export default function SignInReturnPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function finish() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        if (active) setFailed(true);
        return;
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setFailed(true);
          return;
        }
      } else {
        // Certains liens transmettent directement la session dans l'adresse.
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (!data.session) {
          setFailed(true);
          return;
        }
      }

      router.replace("/");
    }

    finish();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      {failed ? (
        <div className="max-w-sm rounded-card border border-line bg-white/80 p-6">
          <p className="text-3xl" aria-hidden>
            🔁
          </p>
          <h1 className="mt-2 text-xl font-extrabold text-ink">Ce lien n&apos;est plus valable</h1>
          <p className="mt-1 text-sm font-semibold text-ink-soft">
            Les liens de connexion expirent au bout d&apos;un moment, et ne servent qu&apos;une
            fois. Demandez-en simplement un nouveau.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex min-h-11 items-center rounded-pill bg-sage px-5 text-sm font-extrabold text-white"
          >
            Recevoir un nouveau lien
          </Link>
        </div>
      ) : (
        <p className="text-base font-bold text-ink-soft">Connexion en cours…</p>
      )}
    </main>
  );
}
