import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";
import { speakableText } from "@/lib/takVoice";

export const runtime = "nodejs";

/**
 * Voix de Tak : « Sarah », voix de base d'ElevenLabs (utilisable par l'API avec
 * un compte gratuit). Les voix de la bibliothèque, comme 0xHziZolI8Tp6rLtUqh2,
 * exigent un compte payant. `ELEVENLABS_VOICE_ID` permet d'en changer sans code.
 */
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
const MODEL_ID = "eleven_multilingual_v2";
/** Une réponse de Tak se lit en quelques phrases : au-delà, on coupe. */
const MAX_LENGTH = 700;

/**
 * Lit une réponse de Tak avec la voix ElevenLabs. Réservé aux membres
 * connectés : le quota de voix est celui de la famille. En cas de souci
 * (clé absente, quota épuisé), le téléphone reprend sa propre voix.
 */
export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return Response.json({ error: "Voix non configurée" }, { status: 503 });

  if (isSupabaseConfigured) {
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
    if (!data.user) return Response.json({ error: "Connexion requise" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof body?.text === "string" ? speakableText(body.text).slice(0, MAX_LENGTH) : "";
  if (!text) return Response.json({ error: "Rien à lire" }, { status: 400 });

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_64`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
      }),
    },
  );
  if (!response.ok || !response.body) {
    console.error("Voix ElevenLabs indisponible :", response.status, await response.text().catch(() => ""));
    return Response.json({ error: "Voix indisponible" }, { status: 502 });
  }
  return new Response(response.body, {
    headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
  });
}
