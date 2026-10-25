import { z } from "zod";
import { normalizeVideoProject, sceneSchema, VISUAL_STYLE_IDS } from "@/lib/schema";
import type { Scene, VideoProject, VisualStyleId } from "@/lib/schema";

export interface RenderWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

export interface RenderScene extends Scene {
  /** Durée de la scène en frames, dérivée de la durée de l'audio de la voix off. */
  durationInFrames: number;
  /** URL ou chemin (staticFile/dataURI) de l'audio de la voix off de la scène. */
  audioSrc: string;
  /** Timestamps mot-à-mot (en frames) pour les sous-titres animés. */
  words: RenderWord[];
}

export interface RenderProject extends Omit<VideoProject, "scenes"> {
  styleId: VisualStyleId;
  fps: number;
  scenes: RenderScene[];
  // Index signature requise par les props de <Composition>/<Player> de Remotion, qui
  // attendent un type assignable à Record<string, unknown>.
  [key: string]: unknown;
}

export function totalDurationInFrames(project: Pick<RenderProject, "scenes">): number {
  return project.scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0);
}

const renderWordSchema = z.object({
  text: z.string(),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().nonnegative(),
});

const renderSceneSchema = sceneSchema.extend({
  durationInFrames: z.number().int().positive(),
  audioSrc: z.string().min(1),
  words: z.array(renderWordSchema),
});

/** Valide un `RenderProject` renvoyé par `/api/generate-voiceover` avant de déclencher le rendu. */
export const renderProjectSchema = z.object({
  title: z.string().min(1),
  themeColor: z.string(),
  styleId: z.enum(VISUAL_STYLE_IDS),
  fps: z.number().int().positive(),
  scenes: z.array(renderSceneSchema).min(1),
});

/** Remet les champs `visualData` nullish issus du parsing zod en `undefined`, comme pour `VideoProject`. */
export function normalizeRenderProject(parsed: z.infer<typeof renderProjectSchema>): RenderProject {
  const base = normalizeVideoProject(parsed);
  return {
    title: base.title,
    themeColor: base.themeColor,
    styleId: parsed.styleId,
    fps: parsed.fps,
    scenes: base.scenes.map((scene, index) => ({
      ...scene,
      durationInFrames: parsed.scenes[index]!.durationInFrames,
      audioSrc: parsed.scenes[index]!.audioSrc,
      words: parsed.scenes[index]!.words,
    })),
  };
}
