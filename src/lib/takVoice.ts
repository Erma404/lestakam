/**
 * La voix de Tak : d'abord la voix ElevenLabs (naturelle), lue par
 * `/api/tak/voix` ; si elle n'est pas disponible (clé absente, quota épuisé,
 * hors connexion), la synthèse vocale du téléphone prend le relais.
 *
 * Sur iPhone, le son doit d'abord être « débloqué » par un toucher de
 * l'utilisateur (`unlockVoice`), sinon la réponse arrivée plus tard reste
 * muette : on fait jouer un silence au même lecteur pendant ce toucher.
 */

/** Un court silence (WAV généré à la volée), pour débloquer le lecteur audio. */
function silence(): string {
  const samples = 800; // 0,1 s à 8 kHz, 8 bits mono
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) =>
    [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  write(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  write(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

let player: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let generation = 0;

function audioPlayer(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!player) {
    player = new Audio();
    player.preload = "auto";
  }
  return player;
}

function synth(): SpeechSynthesis | null {
  return typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
}

export function voiceSupported(): boolean {
  return typeof window !== "undefined" && (synth() !== null || "Audio" in window);
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
  const audio = audioPlayer();
  if (audio && audio.paused) {
    audio.src = silence();
    void audio.play().catch(() => undefined);
  }
  const speech = synth();
  if (!speech) return;
  const silent = new SpeechSynthesisUtterance(" ");
  silent.volume = 0;
  speech.speak(silent);
}

export function stopSpeaking(): void {
  generation += 1;
  synth()?.cancel();
  player?.pause();
}

/**
 * Lit la réponse avec la voix ElevenLabs, ou à défaut celle du téléphone.
 * `accessToken` : jeton de connexion, la voix étant réservée à la famille.
 */
export async function speak(text: string, onEnd?: () => void, accessToken?: string): Promise<void> {
  const spoken = speakableText(text);
  if (!spoken) {
    onEnd?.();
    return;
  }
  stopSpeaking();
  const ticket = generation;
  const audio = audioPlayer();
  try {
    if (!audio) throw new Error("pas de lecteur audio");
    const response = await fetch("/api/tak/voix", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({ text: spoken }),
    });
    if (!response.ok) throw new Error(`voix ${response.status}`);
    const blob = await response.blob();
    // Une nouvelle question a été posée entre-temps : on se tait.
    if (ticket !== generation) return;
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(blob);
    audio.src = currentUrl;
    audio.onended = () => onEnd?.();
    audio.onerror = () => onEnd?.();
    await audio.play();
  } catch (error) {
    console.warn("Voix de Tak : repli sur la voix de l'appareil", error);
    if (ticket !== generation) return;
    speakWithDevice(spoken, onEnd);
  }
}

function speakWithDevice(text: string, onEnd?: () => void): void {
  const speech = synth();
  if (!speech) {
    onEnd?.();
    return;
  }
  speech.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
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
