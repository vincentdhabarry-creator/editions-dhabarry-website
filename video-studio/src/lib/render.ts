import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import type { VideoProject } from "./schema";
import type { VisualStyleId, VoicePreset } from "./schema";
import { synthesizeSceneVoiceover } from "./tts";
import type { RenderProject, RenderScene } from "@/remotion/types";

const FPS = 30;
const TRAILING_BUFFER_FRAMES = 18;
const MIN_SCENE_DURATION_FRAMES = 60;

let bundlePromise: Promise<string> | null = null;

/** Bundle le projet Remotion une seule fois par process serveur, puis réutilise le résultat. */
function getServeUrl(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(process.cwd(), "src", "remotion", "index.ts"),
      onProgress: () => {},
      // Le bundler de Remotion n'utilise pas tsconfig.json : on répète ici l'alias "@/*"
      // défini côté Next.js (tsconfig.json -> paths), utilisé par src/remotion pour importer
      // depuis src/lib.
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            "@": path.join(process.cwd(), "src"),
          },
        },
      }),
    });
  }
  return bundlePromise;
}

async function buildRenderScene(
  scene: VideoProject["scenes"][number],
  voice: VoicePreset,
): Promise<RenderScene> {
  const voiceover = await synthesizeSceneVoiceover(scene.voiceoverScript, voice);

  const durationInFrames = Math.max(
    MIN_SCENE_DURATION_FRAMES,
    Math.ceil(voiceover.durationSeconds * FPS) + TRAILING_BUFFER_FRAMES,
  );

  return {
    ...scene,
    durationInFrames,
    audioSrc: `data:${voiceover.mimeType};base64,${voiceover.audioBase64}`,
    words: voiceover.words.map((word) => ({
      text: word.text,
      startFrame: Math.round(word.startSeconds * FPS),
      endFrame: Math.max(Math.round(word.endSeconds * FPS), Math.round(word.startSeconds * FPS) + 1),
    })),
  };
}

/**
 * Étape C+D du pipeline : synthétise la voix off de chaque scène (ElevenLabs), assemble le
 * `RenderProject` prêt pour Remotion (durées de scène et timestamps de mots en frames).
 */
export async function buildRenderProject(
  project: VideoProject,
  styleId: VisualStyleId,
  voice: VoicePreset,
): Promise<RenderProject> {
  const scenes = await Promise.all(project.scenes.map((scene) => buildRenderScene(scene, voice)));
  return {
    title: project.title,
    themeColor: project.themeColor,
    styleId,
    fps: FPS,
    scenes,
  };
}

export interface RenderResult {
  outputPath: string;
  publicUrl: string;
}

/**
 * Étape E du pipeline : rendu serveur de la vidéo finale via l'API Node.js de Remotion
 * (`bundle()` + `selectComposition()` + `renderMedia()`), export en MP4 H.264 1080x1920.
 */
export async function renderVideoProject(renderProject: RenderProject): Promise<RenderResult> {
  const serveUrl = await getServeUrl();

  const composition = await selectComposition({
    serveUrl,
    id: "VideoProject",
    inputProps: renderProject,
  });

  const outputDir = path.join(process.cwd(), "public", "renders");
  await fs.mkdir(outputDir, { recursive: true });

  const fileName = `${randomUUID()}.mp4`;
  const outputPath = path.join(outputDir, fileName);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: renderProject,
  });

  return { outputPath, publicUrl: `/renders/${fileName}` };
}
