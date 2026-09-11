"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "./Card";
import { useEvents } from "@/lib/useEvents";
import { useMeals } from "@/lib/useMeals";
import { useShoppingList } from "@/lib/useShoppingList";
import { useRitualStatus } from "@/lib/useRitualStatus";
import { formatLongDate, todayKey } from "@/lib/dates";
import { useNow } from "@/lib/useNow";
import type { TakAction } from "@/lib/tak";

interface TakViewProps {
  initialIso: string;
}

interface TakResponse {
  ok: boolean;
  action?: TakAction;
  summary?: string;
  recette?: string;
  youtubeUrl?: string;
  error?: string;
}

interface HistoryEntry {
  id: string;
  heard: string;
  message: string;
  kind: "info" | "success" | "error";
}

/** Reconnaissance vocale du navigateur, sans dépendance externe. */
function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Sous-ensemble de l'API Web Speech utilisé ici. */
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

function newHistoryId(): string {
  return `tak-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TakView({ initialIso }: TakViewProps) {
  const now = useNow(initialIso, 60_000);
  const today = todayKey(now);

  const { addEvent } = useEvents();
  const { addMeal } = useMeals();
  const { addItem } = useShoppingList();
  const { markValidated } = useRitualStatus(today);

  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<{ action: TakAction; summary: string; heard: string } | null>(
    null,
  );
  const [recipe, setRecipe] = useState<{ plat: string; recette: string; youtubeUrl: string } | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    // La détection dépend de `window` : elle ne peut se faire qu'une fois
    // monté côté client, et depuis un callback pour ne pas re-render
    // pendant l'effet lui-même.
    const timer = window.setTimeout(() => setSupported(getSpeechRecognition() !== null), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function pushHistory(heard: string, message: string, kind: HistoryEntry["kind"]) {
    setHistory((current) => [{ id: newHistoryId(), heard, message, kind }, ...current].slice(0, 8));
  }

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setLoading(true);
      setPending(null);
      setRecipe(null);
      try {
        const response = await fetch("/api/tak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, today, weekday: formatLongDate(today) }),
        });
        const data = (await response.json()) as TakResponse;

        if (!data.ok || !data.action) {
          pushHistory(trimmed, data.error ?? "Je n'ai pas compris cette demande.", "error");
          setDraft("");
          return;
        }

        if (data.action.action === "incompris") {
          pushHistory(trimmed, data.action.raison, "info");
          setDraft("");
          return;
        }

        if (data.action.action === "chercher_recette" && data.recette && data.youtubeUrl) {
          setRecipe({ plat: data.action.plat, recette: data.recette, youtubeUrl: data.youtubeUrl });
          pushHistory(trimmed, data.summary ?? "Recette trouvée.", "success");
          setDraft("");
          return;
        }

        setPending({ action: data.action, summary: data.summary ?? "", heard: trimmed });
      } catch {
        pushHistory(trimmed, "Tak n'a pas pu joindre le serveur.", "error");
        setDraft("");
      } finally {
        setLoading(false);
      }
    },
    [today],
  );

  function toggleListening() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0]?.transcript ?? "";
      }
      setDraft(text);
      const last = event.results[event.results.length - 1];
      if (last?.isFinal) {
        void ask(text);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    setDraft("");
    recognition.start();
  }

  function confirmPending() {
    if (!pending) return;
    const { action } = pending;

    switch (action.action) {
      case "ajouter_evenement":
        addEvent({
          title: action.titre,
          date: action.date,
          startTime: action.heureDebut,
          endTime: action.heureFin,
          location: action.lieu,
          category: action.categorie,
          memberIds: action.personnes,
          repeatsWeekly: action.repeteChaqueSemaine,
          notes: action.note,
        });
        pushHistory(pending.heard, `« ${action.titre} » a été ajouté au calendrier.`, "success");
        break;
      case "planifier_repas":
        addMeal({ title: action.titre, date: action.date, moment: action.moment, emoji: "🍽️" });
        pushHistory(pending.heard, `« ${action.titre} » a été ajouté au menu.`, "success");
        break;
      case "ajouter_article":
        addItem({ label: action.label, quantity: action.quantite, aisle: action.rayon });
        pushHistory(pending.heard, `« ${action.label} » a été ajouté à la liste de courses.`, "success");
        break;
      case "valider_rituel": {
        const ok = markValidated(action.ritualId);
        pushHistory(
          pending.heard,
          ok ? "Rituel validé, bravo Khloé ! ⭐" : "Ce rituel n'a pas été retrouvé.",
          ok ? "success" : "error",
        );
        break;
      }
    }
    setPending(null);
    setDraft("");
  }

  function cancelPending() {
    setPending(null);
    setDraft("");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4 pb-28 sm:p-6 md:pb-6 lg:p-8">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
          L&apos;assistant de la famille
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">💬 Tak</h1>
      </header>

      <Card className="flex flex-col items-center gap-4 text-center">
        <button
          type="button"
          onClick={toggleListening}
          disabled={!supported || loading}
          aria-pressed={listening}
          className={`flex h-24 w-24 items-center justify-center rounded-full text-4xl transition-colors disabled:opacity-40 ${
            listening ? "bg-terracotta text-white animate-pulse" : "bg-sage text-white hover:brightness-95"
          }`}
        >
          🎙️
        </button>
        <p className="text-sm font-bold text-ink-soft">
          {!supported
            ? "La reconnaissance vocale n'est pas disponible sur ce navigateur."
            : loading
              ? "Tak réfléchit…"
              : listening
                ? "Je t'écoute…"
                : "Appuie et parle. Par exemple : « ajoute du lait à la liste de courses »."}
        </p>
        {draft ? (
          <p className="rounded-3xl bg-cream-deep px-4 py-2 text-sm font-semibold text-ink">
            « {draft} »
          </p>
        ) : null}

        <form
          onSubmit={(formEvent) => {
            formEvent.preventDefault();
            void ask(draft);
          }}
          className="flex w-full gap-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(changeEvent) => setDraft(changeEvent.target.value)}
            placeholder="…ou écris ta demande ici"
            className="min-h-12 w-full flex-1 rounded-pill border border-line bg-white px-4 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-sage focus:ring-2 focus:ring-sage-soft"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            className="min-h-12 shrink-0 rounded-pill bg-sage px-5 text-sm font-extrabold text-white disabled:opacity-40"
          >
            Envoyer
          </button>
        </form>
      </Card>

      {pending ? (
        <Card className="border-2 border-sage bg-sage-soft/40">
          <CardTitle eyebrow="Tak a compris" title={pending.summary} />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmPending}
              className="min-h-12 flex-1 rounded-pill bg-sage px-6 text-sm font-extrabold text-white hover:brightness-95"
            >
              Confirmer
            </button>
            <button
              type="button"
              onClick={cancelPending}
              className="min-h-12 rounded-pill bg-white px-6 text-sm font-extrabold text-ink-soft hover:bg-cream-deep"
            >
              Annuler
            </button>
          </div>
        </Card>
      ) : null}

      {recipe ? (
        <Card>
          <CardTitle eyebrow="Recette" title={recipe.plat} />
          <p className="whitespace-pre-line text-sm font-semibold text-ink-soft">{recipe.recette}</p>
          <a
            href={recipe.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-pill bg-terracotta px-5 text-sm font-extrabold text-white hover:brightness-95"
          >
            ▶️ Voir des vidéos sur YouTube
          </a>
        </Card>
      ) : null}

      {history.length > 0 ? (
        <Card>
          <CardTitle title="Dernières demandes" />
          <ul className="flex flex-col gap-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className={`rounded-3xl px-4 py-3 text-sm font-semibold ${
                  entry.kind === "success"
                    ? "bg-sage-soft text-ink"
                    : entry.kind === "error"
                      ? "bg-rose-soft text-ink"
                      : "bg-cream-deep text-ink-soft"
                }`}
              >
                <span className="block text-xs font-bold text-ink-faint">« {entry.heard} »</span>
                {entry.message}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
