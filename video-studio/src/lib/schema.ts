import { z } from "zod";

/**
 * Contrat de données produit par le LLM Script & Storyboard Generator (étape B du pipeline).
 * Voir le cahier des charges — cette forme est celle envoyée telle quelle au moteur Remotion.
 */
export const SCENE_TYPES = [
  "hook_headline",
  "stat_counter",
  "comparison_bars",
  "bullet_points",
] as const;

export type SceneType = (typeof SCENE_TYPES)[number];

export interface Scene {
  id: string;
  type: SceneType;
  voiceoverScript: string;
  visualData: {
    badge?: string;
    headline?: string;
    subheadline?: string;
    metricNumber?: number;
    metricUnit?: string;
    chartItems?: { label: string; value: number }[];
    bulletPoints?: string[];
  };
}

export interface VideoProject {
  title: string;
  themeColor: string;
  scenes: Scene[];
}

export const visualDataSchema = z.object({
  // `.nullish()` accepte à la fois `null` (sortie stricte du LLM) et une clé absente (cas des
  // objets sérialisés côté client où `undefined` est simplement omis par `JSON.stringify`).
  badge: z.string().nullish(),
  headline: z.string().nullish(),
  subheadline: z.string().nullish(),
  metricNumber: z.number().nullish(),
  metricUnit: z.string().nullish(),
  chartItems: z.array(z.object({ label: z.string(), value: z.number() })).nullish(),
  bulletPoints: z.array(z.string()).nullish(),
});

export const sceneSchema = z.object({
  id: z.string(),
  type: z.enum(SCENE_TYPES),
  voiceoverScript: z.string().min(1),
  visualData: visualDataSchema,
});

export const videoProjectSchema = z.object({
  title: z.string().min(1),
  themeColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "themeColor doit être un hex CSS, ex: #ff3b30"),
  scenes: z.array(sceneSchema).min(1).max(8),
});

/**
 * JSON Schema (draft-2020-12 subset compatible OpenAI/OpenRouter "strict" structured outputs
 * et Anthropic tool `input_schema`). Tous les champs optionnels du storyboard sont modélisés en
 * nullable + requis, car le mode strict d'OpenAI interdit les propriétés réellement optionnelles.
 */
export const videoProjectJsonSchema = {
  name: "video_project",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["title", "themeColor", "scenes"],
    properties: {
      title: { type: "string", description: "Titre court de la vidéo." },
      themeColor: {
        type: "string",
        description: "Couleur d'accent au format hex CSS, ex: #ff3b30.",
        pattern: "^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$",
      },
      scenes: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "type", "voiceoverScript", "visualData"],
          properties: {
            id: { type: "string", description: "Identifiant court unique, ex: scene-1." },
            type: {
              type: "string",
              enum: SCENE_TYPES as unknown as string[],
            },
            voiceoverScript: {
              type: "string",
              description:
                "Texte exact à synthétiser en voix off pour cette scène, en français, phrases courtes et percutantes.",
            },
            visualData: {
              type: "object",
              additionalProperties: false,
              required: [
                "badge",
                "headline",
                "subheadline",
                "metricNumber",
                "metricUnit",
                "chartItems",
                "bulletPoints",
              ],
              properties: {
                badge: { type: ["string", "null"], description: "Court label en haut de scène, ex: BREAKING." },
                headline: { type: ["string", "null"] },
                subheadline: { type: ["string", "null"] },
                metricNumber: {
                  type: ["number", "null"],
                  description: "Requis pour le type stat_counter.",
                },
                metricUnit: { type: ["string", "null"], description: "Ex: %, M, Mds €." },
                chartItems: {
                  type: ["array", "null"],
                  description: "Requis pour le type comparison_bars.",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["label", "value"],
                    properties: {
                      label: { type: "string" },
                      value: { type: "number" },
                    },
                  },
                },
                bulletPoints: {
                  type: ["array", "null"],
                  description: "Requis pour le type bullet_points, 3 à 5 items courts.",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

/**
 * Le schéma JSON strict représente les champs optionnels de `visualData` en `nullable` (requis
 * par le mode "strict" des structured outputs). Cette fonction les remet en `undefined` pour
 * coller exactement à l'interface `VideoProject` du cahier des charges.
 */
export function normalizeVideoProject(parsed: z.infer<typeof videoProjectSchema>): VideoProject {
  return {
    title: parsed.title,
    themeColor: parsed.themeColor,
    scenes: parsed.scenes.map((scene) => ({
      id: scene.id,
      type: scene.type,
      voiceoverScript: scene.voiceoverScript,
      visualData: {
        badge: scene.visualData.badge ?? undefined,
        headline: scene.visualData.headline ?? undefined,
        subheadline: scene.visualData.subheadline ?? undefined,
        metricNumber: scene.visualData.metricNumber ?? undefined,
        metricUnit: scene.visualData.metricUnit ?? undefined,
        chartItems: scene.visualData.chartItems ?? undefined,
        bulletPoints: scene.visualData.bulletPoints ?? undefined,
      },
    })),
  };
}

export const VISUAL_STYLE_IDS = ["dark-cyber", "clean-corporate", "breaking-news"] as const;
export type VisualStyleId = (typeof VISUAL_STYLE_IDS)[number];

export type VoicePreset = "male-dynamic" | "female-dynamic";

export interface GenerateScriptRequest {
  sourceText: string;
  visualStyle: VisualStyleId;
  voice: VoicePreset;
}
