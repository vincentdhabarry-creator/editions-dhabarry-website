import { VOICE_OPTIONS } from "./styles";
import type { VoicePreset } from "./schema";

export interface WordTiming {
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export interface SceneVoiceover {
  audioBase64: string;
  mimeType: "audio/mpeg";
  words: WordTiming[];
  durationSeconds: number;
}

interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface ElevenLabsWithTimestampsResponse {
  audio_base64: string;
  alignment: ElevenLabsAlignment;
}

/**
 * Regroupe l'alignement caractère-par-caractère renvoyé par ElevenLabs en timestamps mot-à-mot,
 * utilisés par les sous-titres animés Remotion (un mot mis en évidence à la fois).
 */
export function charactersToWordTimings(alignment: ElevenLabsAlignment): WordTiming[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  const words: WordTiming[] = [];

  let current = "";
  let wordStart: number | null = null;
  let wordEnd = 0;

  const flush = () => {
    if (current.trim().length > 0 && wordStart !== null) {
      words.push({ text: current, startSeconds: wordStart, endSeconds: wordEnd });
    }
    current = "";
    wordStart = null;
  };

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i]!;
    if (/\s/.test(char)) {
      flush();
      continue;
    }
    if (wordStart === null) {
      wordStart = character_start_times_seconds[i]!;
    }
    wordEnd = character_end_times_seconds[i]!;
    current += char;
  }
  flush();

  return words;
}

function resolveVoiceId(voice: VoicePreset): string {
  const envVar = VOICE_OPTIONS[voice].elevenLabsVoiceIdEnvVar;
  const voiceId = process.env[envVar];
  if (!voiceId) {
    throw new Error(`Variable d'environnement manquante: ${envVar}`);
  }
  return voiceId;
}

/**
 * Étape C du pipeline : synthétise la voix off d'une scène et renvoie l'audio (base64) ainsi que
 * les timestamps mot-à-mot nécessaires à la synchronisation des sous-titres animés.
 */
export async function synthesizeSceneVoiceover(
  text: string,
  voice: VoicePreset,
): Promise<SceneVoiceover> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Variable d'environnement manquante: ELEVENLABS_API_KEY");
  }
  const voiceId = resolveVoiceId(voice);

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Échec de l'appel ElevenLabs (${res.status}): ${body}`);
  }

  const data = (await res.json()) as ElevenLabsWithTimestampsResponse;
  const words = charactersToWordTimings(data.alignment);
  const lastEnd = data.alignment.character_end_times_seconds.at(-1) ?? 0;

  return {
    audioBase64: data.audio_base64,
    mimeType: "audio/mpeg",
    words,
    durationSeconds: lastEnd,
  };
}
