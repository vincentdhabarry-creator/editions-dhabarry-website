import { staticFile } from "remotion";
import type { RenderProject } from "./types";

const SILENCE = staticFile("audio/silence.wav");

/**
 * Projet de démonstration utilisé par Remotion Studio et par le rendu de test (`npm run
 * remotion:render`) tant qu'aucun storyboard réel (LLM + ElevenLabs) n'a été généré.
 */
export const sampleProject: RenderProject = {
  title: "Le marché du livre numérique explose",
  themeColor: "#ff3b30",
  styleId: "breaking-news",
  fps: 30,
  scenes: [
    {
      id: "scene-1",
      type: "hook_headline",
      voiceoverScript: "Le livre numérique vient de battre un record historique.",
      visualData: {
        badge: "BREAKING",
        headline: "Le livre numérique explose",
        subheadline: "Un record historique vient de tomber en France.",
      },
      durationInFrames: 120,
      audioSrc: SILENCE,
      words: [
        { text: "Le", startFrame: 4, endFrame: 12 },
        { text: "livre", startFrame: 12, endFrame: 28 },
        { text: "numérique", startFrame: 28, endFrame: 52 },
        { text: "vient", startFrame: 52, endFrame: 64 },
        { text: "de", startFrame: 64, endFrame: 70 },
        { text: "battre", startFrame: 70, endFrame: 86 },
        { text: "un", startFrame: 86, endFrame: 92 },
        { text: "record", startFrame: 92, endFrame: 108 },
        { text: "historique.", startFrame: 108, endFrame: 118 },
      ],
    },
    {
      id: "scene-2",
      type: "stat_counter",
      voiceoverScript: "Trente-quatre pour cent des Français ont lu un ebook cette année.",
      visualData: {
        badge: "CHIFFRE CLÉ",
        headline: "des Français ont lu un ebook cette année",
        metricNumber: 34,
        metricUnit: "%",
      },
      durationInFrames: 130,
      audioSrc: SILENCE,
      words: [
        { text: "Trente-quatre", startFrame: 4, endFrame: 30 },
        { text: "pour", startFrame: 30, endFrame: 40 },
        { text: "cent", startFrame: 40, endFrame: 52 },
        { text: "des", startFrame: 52, endFrame: 60 },
        { text: "Français", startFrame: 60, endFrame: 82 },
        { text: "ont", startFrame: 82, endFrame: 90 },
        { text: "lu", startFrame: 90, endFrame: 98 },
        { text: "un", startFrame: 98, endFrame: 104 },
        { text: "ebook", startFrame: 104, endFrame: 118 },
        { text: "cette", startFrame: 118, endFrame: 126 },
        { text: "année.", startFrame: 126, endFrame: 128 },
      ],
    },
    {
      id: "scene-3",
      type: "comparison_bars",
      voiceoverScript: "Les éditions Dhabarry dominent trois segments du marché.",
      visualData: {
        badge: "PARTS DE MARCHÉ",
        headline: "Trois segments dominés",
        chartItems: [
          { label: "Essais", value: 42 },
          { label: "Développement perso", value: 65 },
          { label: "Fiction", value: 28 },
        ],
      },
      durationInFrames: 140,
      audioSrc: SILENCE,
      words: [
        { text: "Les", startFrame: 4, endFrame: 12 },
        { text: "éditions", startFrame: 12, endFrame: 30 },
        { text: "Dhabarry", startFrame: 30, endFrame: 50 },
        { text: "dominent", startFrame: 50, endFrame: 70 },
        { text: "trois", startFrame: 70, endFrame: 84 },
        { text: "segments", startFrame: 84, endFrame: 104 },
        { text: "du", startFrame: 104, endFrame: 112 },
        { text: "marché.", startFrame: 112, endFrame: 128 },
      ],
    },
    {
      id: "scene-4",
      type: "bullet_points",
      voiceoverScript: "Trois raisons à ce succès : le prix, l'accessibilité et la qualité éditoriale.",
      visualData: {
        badge: "POURQUOI",
        headline: "Trois raisons à ce succès",
        bulletPoints: ["Un prix plus accessible", "Disponible en un clic", "Une qualité éditoriale exigeante"],
      },
      durationInFrames: 150,
      audioSrc: SILENCE,
      words: [
        { text: "Trois", startFrame: 4, endFrame: 18 },
        { text: "raisons", startFrame: 18, endFrame: 36 },
        { text: "à", startFrame: 36, endFrame: 40 },
        { text: "ce", startFrame: 40, endFrame: 48 },
        { text: "succès.", startFrame: 48, endFrame: 64 },
      ],
    },
  ],
};
