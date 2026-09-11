"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RecipeCard, type Recipe } from "./RecipeCard";
import { useEvents } from "@/lib/useEvents";
import { useMeals } from "@/lib/useMeals";
import { useShoppingList } from "@/lib/useShoppingList";
import { useRitualStatus } from "@/lib/useRitualStatus";
import { formatLongDate, todayKey } from "@/lib/dates";
import type { TakAction } from "@/lib/tak";

interface TakResponse {
  ok: boolean;
  action?: TakAction;
  summary?: string;
  ingredients?: string[];
  etapes?: string[];
  imageUrl?: string | null;
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

/**
 * Tak, l'assistant de la famille : une bulle flottante présente sur tous
 * les écrans plutôt qu'un onglet à part — pour qu'on puisse lui parler
 * depuis n'importe où dans l'appli, sans jamais changer de page.
 */
export function TakWidget() {
  const today = todayKey();

  const { addEvent } = useEvents();
  const { addMeal } = useMeals();
  const { addItem } = useShoppingList();
  const { markValidated } = useRitualStatus(today);

  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<{ action: TakAction; summary: string; heard: string } | null>(
    null,
  );
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSupported(getSpeechRecognition() !== null), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function pushHistory(heard: string, message: string, kind: HistoryEntry["kind"]) {
    setHistory((current) => [{ id: newHistoryId(), heard, message, kind }, ...current].slice(0, 5));
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

        if (data.action.action === "chercher_recette" && data.ingredients && data.etapes) {
          setRecipe({
            plat: data.action.plat,
            ingredients: data.ingredients,
            etapes: data.etapes,
            imageUrl: data.imageUrl ?? null,
            youtubeUrl: data.youtubeUrl ?? "",
          });
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
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Fermer Tak" : "Ouvrir Tak, l'assistant de la famille"}
        className={`fixed bottom-20 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6 ${
          open ? "bg-ink text-white" : "bg-sun text-ink"
        }`}
      >
        {open ? "✕" : <span className={listening ? "animate-bounce" : ""}>🦊</span>}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Tak, l'assistant de la famille"
          className="fixed inset-x-0 bottom-0 z-40 flex max-h-[85vh] flex-col overflow-hidden rounded-t-card bg-cream shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-96 sm:rounded-card"
        >
          <header className="flex items-center gap-3 border-b border-line bg-sun-soft px-5 py-4">
            <span className="text-3xl" aria-hidden>
              🦊
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Salut, c&apos;est Tak !</h2>
              <p className="truncate text-xs font-semibold text-ink-soft">
                Dis-moi ce qu&apos;il faut faire, je m&apos;en occupe.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer Tak"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-ink-soft hover:bg-white"
            >
              ✕
            </button>
          </header>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex flex-col items-center gap-3 rounded-card bg-white/70 p-4 text-center">
              <button
                type="button"
                onClick={toggleListening}
                disabled={!supported || loading}
                aria-pressed={listening}
                className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl transition-colors disabled:opacity-40 ${
                  listening
                    ? "bg-terracotta text-white animate-pulse"
                    : "bg-sage "
                }`}
              >
                🎙️
              </button>
              <p className="text-xs font-bold text-ink-soft">
                {!supported
                  ? "Micro non disponible ici — écris ta demande."
                  : loading
                    ? "Tak réfléchit…"
                    : listening
                      ? "Je t'écoute…"
                      : "Appuie et parle, ou écris ci-dessous."}
              </p>
              {draft ? (
                <p className="rounded-3xl bg-cream-deep px-3 py-1.5 text-xs font-semibold text-ink">
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
                  placeholder="Ajoute du lait à la liste…"
                  className="min-h-11 w-full flex-1 rounded-pill border border-line bg-white px-4 text-sm font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-sage focus:ring-2 focus:ring-sage-soft"
                />
                <button
                  type="submit"
                  disabled={loading || !draft.trim()}
                  className="min-h-11 shrink-0 btn-pop btn-pop-sage px-4 text-sm font-extrabold text-white disabled:opacity-40"
                >
                  Go
                </button>
              </form>
            </div>

            {pending ? (
              <div className="rounded-card border-2 border-sage bg-sage-soft/40 p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                  Tak a compris
                </p>
                <p className="mb-3 text-sm font-extrabold text-ink">{pending.summary}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmPending}
                    className="min-h-11 flex-1 btn-pop btn-pop-sage px-4 text-sm font-extrabold "
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={cancelPending}
                    className="min-h-11 rounded-pill bg-white px-4 text-sm font-extrabold text-ink-soft hover:bg-cream-deep"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : null}

            {recipe ? <RecipeCard recipe={recipe} /> : null}

            {history.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className={`rounded-3xl px-3 py-2 text-xs font-semibold ${
                      entry.kind === "success"
                        ? "bg-sage-soft text-ink"
                        : entry.kind === "error"
                          ? "bg-rose-soft text-ink"
                          : "bg-cream-deep text-ink-soft"
                    }`}
                  >
                    <span className="block text-[10px] font-bold text-ink-faint">« {entry.heard} »</span>
                    {entry.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
