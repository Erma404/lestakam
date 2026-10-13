/**
 * La voix de Tak : synthèse vocale du navigateur, en français, sans
 * service externe. Sur iPhone, la parole doit d'abord être « débloquée »
 * par un toucher de l'utilisateur (`unlockVoice`), sinon la réponse
 * arrivée plus tard reste muette.
 */

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

export function voiceSupported(): boolean {
  return synth() !== null;
}

/** Voix française la plus naturelle disponible sur l'appareil. */
function frenchVoice(): SpeechSynthesisVoice | undefined {
  const voices = synth()?.getVoices() ?? [];
  const french = voices.filter((voice) => voice.lang.toLowerCase().startsWith("fr"));
  const preferred = ["Amélie", "Audrey", "Thomas", "Google français", "Marie"];
  for (const name of preferred) {
    const match = french.find((voice) => voice.name.includes(name));
    if (match) return match;
  }
  return french.find((voice) => voice.lang === "fr-FR") ?? french[0];
}

/** Retire ce qui ne se lit pas à voix haute : emojis, puces, liens. */
export function speakableText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[*_#>`]/g, "")
    .replace(/(\d{1,2}):(\d{2})/g, (_, hours: string, minutes: string) =>
      minutes === "00" ? `${Number(hours)} heures` : `${Number(hours)} heures ${minutes}`,
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function unlockVoice(): void {
  const speech = synth();
  if (!speech) return;
  const silent = new SpeechSynthesisUtterance(" ");
  silent.volume = 0;
  speech.speak(silent);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}

export function speak(text: string, onEnd?: () => void): void {
  const speech = synth();
  const spoken = speakableText(text);
  if (!speech || !spoken) return;
  speech.cancel();
  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.lang = "fr-FR";
  const voice = frenchVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 1.02;
  utterance.pitch = 1.1;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  speech.speak(utterance);
}
