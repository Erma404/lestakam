"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RecipeCard, type Recipe } from "./RecipeCard";
import { Icon, TakFace } from "./Icon";
import { useEvents } from "@/lib/useEvents";
import { useShoppingList } from "@/lib/useShoppingList";
import { useRituals } from "@/lib/useRituals";
import { useRitualStatus } from "@/lib/useRitualStatus";
import { useStars } from "@/lib/useStars";
import { useRewardGoals } from "@/lib/useRewardGoals";
import { useWeather } from "@/lib/useWeather";
import { currentTime, formatLongDate, todayKey } from "@/lib/dates";
import { buildTakContext } from "@/lib/takContext";
import { useStoredState } from "@/lib/localStore";
import { useSession } from "@/lib/supabase/session";
import { speak, stopSpeaking, unlockVoice, voiceSupported } from "@/lib/takVoice";
import type { TakAction, TakRitual, TakTurn } from "@/lib/tak";

interface ProposedAction {
  action: TakAction;
  summary: string;
}

interface TakResponse {
  ok: boolean;
  reponse?: string;
  actions?: ProposedAction[];
  recipe?: Recipe;
  error?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  kind?: "error";
  /** Actions proposées par Tak, en attente de confirmation. */
  proposed?: ProposedAction[];
  /** Ce que sont devenues ces actions, une fois la décision prise. */
  outcome?: "confirmed" | "cancelled";
  recipe?: Recipe;
}

const SUGGESTIONS = [
  "Qu'est-ce qu'on a de prévu ce week-end ?",
  "Ajoute du lait, des œufs et du pain",
  "Une idée de sortie avec Khloé s'il fait beau ?",
  "Combien d'étoiles il manque à Khloé ?",
];

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

function newMessageId(): string {
  return `tak-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Tak, l'assistant de la famille : une bulle flottante présente sur tous
 * les écrans plutôt qu'un onglet à part — pour qu'on puisse lui parler
 * depuis n'importe où dans l'appli, sans jamais changer de page.
 */
export function TakWidget() {
  const today = todayKey();

  const { events, addEvent } = useEvents();
  const { items: shoppingItems, addItem } = useShoppingList();
  const { rituals } = useRituals(today);
  const { statuses, markValidated } = useRitualStatus(today);
  const { entries: starEntries } = useStars();
  const { goals } = useRewardGoals();
  const { forecast } = useWeather();

  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Tak lit ses réponses à voix haute ; réglage propre à chaque appareil.
  const [voiceOn, setVoiceOn] = useStoredState<boolean>("tak:voix", true);
  const [canSpeak, setCanSpeak] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSupported(getSpeechRecognition() !== null);
      setCanSpeak(voiceSupported());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Fermer Tak le fait taire.
  useEffect(() => {
    if (open) return;
    stopSpeaking();
    const timer = window.setTimeout(() => setSpeaking(false), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Le dernier message reste visible, comme dans une messagerie.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const ask = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const history: TakTurn[] = messages
        .filter((message) => message.kind !== "error")
        .map((message) => ({ role: message.role, content: message.text }));
      const takRituals: TakRitual[] = rituals.map((ritual) => ({
        id: ritual.id,
        label: ritual.label,
        moment: ritual.moment,
        done: statuses[ritual.id] === "valide",
      }));
      const context = buildTakContext({
        today,
        events,
        shoppingItems,
        starEntries,
        goals,
        forecast,
      });

      stopSpeaking();
      setMessages((current) => [...current, { id: newMessageId(), role: "user", text: trimmed }]);
      setDraft("");
      setLoading(true);
      try {
        const response = await fetch("/api/tak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            today,
            weekday: formatLongDate(today),
            time: currentTime(),
            context,
            rituals: takRituals,
            history,
          }),
        });
        const data = (await response.json()) as TakResponse;

        if (!data.ok || !data.reponse) {
          setMessages((current) => [
            ...current,
            {
              id: newMessageId(),
              role: "assistant",
              text: data.error ?? "Je n'ai pas compris cette demande.",
              kind: "error",
            },
          ]);
          return;
        }

        const reply = data.reponse;
        setMessages((current) => [
          ...current,
          {
            id: newMessageId(),
            role: "assistant",
            text: reply,
            proposed: data.actions && data.actions.length > 0 ? data.actions : undefined,
            recipe: data.recipe,
          },
        ]);
        if (voiceOn) {
          setSpeaking(true);
          void speak(reply, () => setSpeaking(false), session?.access_token);
        }
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: newMessageId(),
            role: "assistant",
            text: "Tak n'a pas pu joindre le serveur.",
            kind: "error",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, rituals, statuses, today, events, shoppingItems, starEntries, goals, forecast, voiceOn, session],
  );

  function toggleListening() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    if (voiceOn) unlockVoice();
    stopSpeaking();
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

  function runAction(action: TakAction): boolean {
    switch (action.action) {
      case "ajouter_evenement":
        addEvent({
          title: action.titre,
          date: action.date,
          endDate: action.dateFin,
          startTime: action.heureDebut,
          endTime: action.heureFin,
          location: action.lieu,
          category: action.categorie,
          memberIds: action.personnes,
          repeatsWeekly: action.repeteChaqueSemaine,
          skipSchoolHolidays: action.horsVacancesScolaires,
          repeatDays: action.joursSemaine,
          notes: action.note,
        });
        return true;
      case "ajouter_article":
        addItem({ label: action.label, quantity: action.quantite, aisle: action.rayon });
        return true;
      case "valider_rituel":
        return markValidated(action.ritualId, rituals);
      default:
        return false;
    }
  }

  function decide(messageId: string, confirmed: boolean) {
    const message = messages.find((item) => item.id === messageId);
    if (!message?.proposed || message.outcome) return;
    let failed = 0;
    if (confirmed) {
      for (const { action } of message.proposed) {
        if (!runAction(action)) failed += 1;
      }
    }
    setMessages((current) => {
      const next = current.map((item) =>
        item.id === messageId ? { ...item, outcome: confirmed ? ("confirmed" as const) : ("cancelled" as const) } : item,
      );
      if (failed > 0) {
        next.push({
          id: newMessageId(),
          role: "assistant",
          text: "Je n'ai pas pu tout faire : un rituel n'a pas été retrouvé.",
          kind: "error",
        });
      }
      return next;
    });
  }

  function removeProposed(messageId: string, index: number) {
    setMessages((current) =>
      current.map((item) => {
        if (item.id !== messageId || !item.proposed) return item;
        const proposed = item.proposed.filter((_, position) => position !== index);
        return proposed.length > 0 ? { ...item, proposed } : { ...item, proposed, outcome: "cancelled" as const };
      }),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? "Fermer Tak" : "Ouvrir Tak, l'assistant de la famille"}
        className={`fixed bottom-24 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full transition-transform active:scale-95 md:bottom-6 md:right-6 ${
          open ? "bg-ink text-white" : "bg-surface"
        }`}
      >
        {open ? (
          <Icon name="close" className="h-6 w-6" />
        ) : (
          <TakFace className={`h-11 w-11 ${listening ? "animate-bounce" : ""}`} />
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Tak, l'assistant de la famille"
          className="fixed inset-x-0 bottom-0 z-40 flex h-[85vh] flex-col overflow-hidden rounded-t-card bg-cream sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[70vh] sm:w-[26rem] sm:rounded-card"
        >
          <header className="flex items-center gap-3 bg-forest px-5 py-4 text-white">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
              <TakFace className="h-9 w-9" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-medium tracking-tight">Salut, c&apos;est Tak !</h2>
              <p className="truncate text-xs text-white/80">
                Pose-moi une question ou demande-moi un coup de main.
              </p>
            </div>
            {canSpeak ? (
              <button
                type="button"
                onClick={() => {
                  if (voiceOn) {
                    stopSpeaking();
                    setSpeaking(false);
                  } else {
                    unlockVoice();
                  }
                  setVoiceOn(!voiceOn);
                }}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? "Couper la voix de Tak" : "Faire parler Tak"}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/25 ${
                  speaking ? "animate-pulse bg-white/30" : "bg-white/15"
                }`}
              >
                <Icon name={voiceOn ? "volume" : "volumeOff"} className="h-5 w-5" />
              </button>
            ) : null}
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="min-h-10 shrink-0 rounded-pill bg-white/15 px-3 text-xs font-medium text-white hover:bg-white/25"
              >
                Nouvelle discussion
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer Tak"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-ink-faint">Par exemple</p>
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void ask(suggestion)}
                    className="min-h-11 rounded-3xl bg-surface px-4 py-2 text-left text-sm font-medium text-ink hover:bg-cream-deep"
                  >
                    « {suggestion} »
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((message) =>
              message.role === "user" ? (
                <p
                  key={message.id}
                  className="ml-8 self-end whitespace-pre-line rounded-3xl rounded-br-md bg-coral px-4 py-2 text-sm text-white"
                >
                  {message.text}
                </p>
              ) : (
                <div key={message.id} className="mr-6 flex flex-col gap-2 self-start">
                  <p
                    className={`whitespace-pre-line rounded-3xl rounded-bl-md px-4 py-2 text-sm font-medium text-ink ${
                      message.kind === "error" ? "bg-coral-soft" : "bg-surface"
                    }`}
                  >
                    {message.text}
                  </p>

                  {message.proposed && message.proposed.length > 0 ? (
                    <div className="rounded-card border-2 border-sage bg-sage-soft/40 p-3">
                      <ul className="mb-3 flex flex-col gap-1.5">
                        {message.proposed.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm font-medium text-ink">
                            <span className="flex-1">{item.summary}</span>
                            {!message.outcome && message.proposed!.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => removeProposed(message.id, index)}
                                aria-label={`Retirer : ${item.summary}`}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-ink-soft hover:bg-cream-deep"
                              >
                                <Icon name="close" className="h-4 w-4" />
                              </button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {message.outcome === "confirmed" ? (
                        <p className="text-xs font-semibold text-sage">C&apos;est fait.</p>
                      ) : message.outcome === "cancelled" ? (
                        <p className="text-xs font-medium text-ink-faint">Annulé.</p>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => decide(message.id, true)}
                            className="min-h-11 flex-1 btn-pop btn-pop-coral px-4 text-sm font-semibold"
                          >
                            {message.proposed.length > 1 ? "Tout confirmer" : "Confirmer"}
                          </button>
                          <button
                            type="button"
                            onClick={() => decide(message.id, false)}
                            className="min-h-11 rounded-pill bg-surface px-4 text-sm font-semibold text-ink-soft hover:bg-cream-deep"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {message.recipe ? <RecipeCard recipe={message.recipe} /> : null}
                </div>
              ),
            )}

            {loading ? (
              <p className="self-start rounded-3xl rounded-bl-md bg-surface px-4 py-2 text-sm font-medium text-ink-faint">
                Tak réfléchit…
              </p>
            ) : null}
          </div>

          <form
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              if (voiceOn) unlockVoice();
              void ask(draft);
            }}
            className="flex items-center gap-2 border-t border-line bg-surface p-3"
          >
            <button
              type="button"
              onClick={toggleListening}
              disabled={!supported || loading}
              aria-pressed={listening}
              aria-label={listening ? "Arrêter l'écoute" : "Parler à Tak"}
              title={supported ? undefined : "Micro non disponible sur ce navigateur"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
                listening ? "animate-pulse bg-coral text-white" : "bg-coral-soft text-coral"
              }`}
            >
              <Icon name="mic" className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={draft}
              onChange={(changeEvent) => setDraft(changeEvent.target.value)}
              placeholder={listening ? "Je t'écoute…" : "Écris à Tak…"}
              aria-label="Message pour Tak"
              className="min-h-11 w-full flex-1 rounded-pill bg-cream px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-coral/30"
            />
            <button
              type="submit"
              disabled={loading || !draft.trim()}
              className="min-h-11 shrink-0 btn-pop btn-pop-coral px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              Envoyer
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
