import type { VisualStyleId, VoicePreset } from "./schema";

export interface VisualStyle {
  id: VisualStyleId;
  label: string;
  description: string;
  background: string;
  backgroundAccentGradient: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  fontFamily: string;
  headlineWeight: number;
  badgeStyle: "pill" | "tag" | "ticker";
  llmToneHint: string;
}

export const VISUAL_STYLES: Record<VisualStyleId, VisualStyle> = {
  "dark-cyber": {
    id: "dark-cyber",
    label: "Dark Cyber",
    description: "Fond sombre, néons, typographie technique — pour la tech et les données.",
    background: "#05060a",
    backgroundAccentGradient: "radial-gradient(circle at 50% 0%, rgba(0,255,200,0.18), transparent 55%)",
    surface: "rgba(15, 18, 28, 0.72)",
    textPrimary: "#eafffb",
    textSecondary: "#7be7d4",
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    headlineWeight: 800,
    badgeStyle: "tag",
    llmToneHint: "ton incisif, vocabulaire tech, phrases courtes façon alerte système",
  },
  "clean-corporate": {
    id: "clean-corporate",
    label: "Clean Corporate",
    description: "Fond clair, sobre, typographie sans-serif — pour la finance et l'entreprise.",
    background: "#f4f5f7",
    backgroundAccentGradient: "linear-gradient(180deg, rgba(15,23,42,0.04), transparent 40%)",
    surface: "#ffffff",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    headlineWeight: 700,
    badgeStyle: "pill",
    llmToneHint: "ton factuel et posé, vocabulaire professionnel, pas d'exagération",
  },
  "breaking-news": {
    id: "breaking-news",
    label: "Breaking News",
    description: "Rouge/bleu nuit, bandeau d'alerte — pour l'actualité chaude.",
    background: "#0a0e1a",
    backgroundAccentGradient: "linear-gradient(160deg, rgba(200,16,32,0.35), transparent 55%)",
    surface: "rgba(10, 14, 26, 0.85)",
    textPrimary: "#ffffff",
    textSecondary: "#ffd7d7",
    fontFamily: "'Archivo Black', 'Arial Black', sans-serif",
    headlineWeight: 900,
    badgeStyle: "ticker",
    llmToneHint: "ton urgent façon flash info, phrases nominales percutantes",
  },
};

export interface VoiceOption {
  id: VoicePreset;
  label: string;
  description: string;
  elevenLabsVoiceIdEnvVar: "ELEVENLABS_VOICE_ID_MALE" | "ELEVENLABS_VOICE_ID_FEMALE";
}

export const VOICE_OPTIONS: Record<VoicePreset, VoiceOption> = {
  "male-dynamic": {
    id: "male-dynamic",
    label: "Homme — ton dynamique",
    description: "Voix masculine énergique, adaptée aux formats courts.",
    elevenLabsVoiceIdEnvVar: "ELEVENLABS_VOICE_ID_MALE",
  },
  "female-dynamic": {
    id: "female-dynamic",
    label: "Femme — ton dynamique",
    description: "Voix féminine énergique, adaptée aux formats courts.",
    elevenLabsVoiceIdEnvVar: "ELEVENLABS_VOICE_ID_FEMALE",
  },
};
