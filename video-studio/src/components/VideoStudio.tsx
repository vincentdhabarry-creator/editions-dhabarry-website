"use client";

import React, { useMemo, useState } from "react";
import { Player } from "@remotion/player";
import { Loader2, Mic, RotateCcw, Sparkles, Video, Download } from "lucide-react";
import { VISUAL_STYLES, VOICE_OPTIONS } from "@/lib/styles";
import type { VisualStyleId, VoicePreset, VideoProject } from "@/lib/schema";
import type { RenderProject } from "@/remotion/types";
import { totalDurationInFrames } from "@/remotion/types";
import { VideoComposition } from "@/remotion/VideoComposition";

type Step = "form" | "script" | "preview" | "done";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data as T;
}

export default function VideoStudio() {
  const [step, setStep] = useState<Step>("form");
  const [sourceText, setSourceText] = useState("");
  const [visualStyle, setVisualStyle] = useState<VisualStyleId>("breaking-news");
  const [voice, setVoice] = useState<VoicePreset>("female-dynamic");

  const [project, setProject] = useState<VideoProject | null>(null);
  const [renderProject, setRenderProject] = useState<RenderProject | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationInFrames = useMemo(
    () => (renderProject ? totalDurationInFrames(renderProject) : 1),
    [renderProject],
  );

  async function handleGenerateScript(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { project } = await postJson<{ project: VideoProject }>("/api/generate-script", {
        sourceText,
        visualStyle,
        voice,
      });
      setProject(project);
      setStep("script");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateVoiceover() {
    if (!project) return;
    setError(null);
    setLoading(true);
    try {
      const { renderProject } = await postJson<{ renderProject: RenderProject }>(
        "/api/generate-voiceover",
        { project, visualStyle, voice },
      );
      setRenderProject(renderProject);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRender() {
    if (!renderProject) return;
    setError(null);
    setLoading(true);
    try {
      const { url } = await postJson<{ url: string }>("/api/render", { renderProject });
      setVideoUrl(url);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep("form");
    setProject(null);
    setRenderProject(null);
    setVideoUrl(null);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-white/50">Video Studio</p>
        <h1 className="mt-2 text-3xl font-bold">Actu &amp; stats en vidéo verticale</h1>
        <p className="mt-2 text-white/60">
          Collez un texte ou des statistiques, choisissez un style et une voix : l&apos;IA génère le
          script, la narration et le montage au format 1080×1920.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleGenerateScript} className="space-y-8">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Article, dépêche ou statistiques
            </label>
            <textarea
              required
              minLength={20}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={8}
              placeholder="Collez votre texte ici…"
              className="w-full rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Style graphique</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {Object.values(VISUAL_STYLES).map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setVisualStyle(s.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    visualStyle === s.id
                      ? "border-white bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <div className="font-semibold">{s.label}</div>
                  <div className="mt-1 text-xs text-white/50">{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">Voix</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Object.values(VOICE_OPTIONS).map((v) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setVoice(v.id)}
                  className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                    voice === v.id
                      ? "border-white bg-white/10"
                      : "border-white/10 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <Mic size={18} className="shrink-0 text-white/60" />
                  <div>
                    <div className="font-semibold">{v.label}</div>
                    <div className="text-xs text-white/50">{v.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            Générer le script
          </button>
        </form>
      )}

      {step === "script" && project && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">{project.title}</h2>
            <p className="text-sm text-white/50">{project.scenes.length} scènes générées</p>
          </div>
          <div className="space-y-3">
            {project.scenes.map((scene, i) => (
              <div key={scene.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
                  <span>
                    Scène {i + 1} · {scene.type}
                  </span>
                </div>
                {scene.visualData.badge && (
                  <div className="text-xs font-bold" style={{ color: project.themeColor }}>
                    {scene.visualData.badge}
                  </div>
                )}
                {scene.visualData.headline && (
                  <div className="text-lg font-semibold">{scene.visualData.headline}</div>
                )}
                {scene.visualData.subheadline && (
                  <div className="text-sm text-white/60">{scene.visualData.subheadline}</div>
                )}
                {scene.visualData.metricNumber != null && (
                  <div className="text-sm text-white/60">
                    {scene.visualData.metricNumber}
                    {scene.visualData.metricUnit}
                  </div>
                )}
                {scene.visualData.chartItems && (
                  <ul className="text-sm text-white/60">
                    {scene.visualData.chartItems.map((item) => (
                      <li key={item.label}>
                        {item.label}: {item.value}
                      </li>
                    ))}
                  </ul>
                )}
                {scene.visualData.bulletPoints && (
                  <ul className="list-disc pl-5 text-sm text-white/60">
                    {scene.visualData.bulletPoints.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 border-t border-white/10 pt-2 text-sm italic text-white/40">
                  &ldquo;{scene.voiceoverScript}&rdquo;
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white/70 hover:text-white"
            >
              <RotateCcw size={16} /> Recommencer
            </button>
            <button
              onClick={handleGenerateVoiceover}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Mic size={18} />}
              Générer la voix off &amp; prévisualiser
            </button>
          </div>
        </div>
      )}

      {step === "preview" && renderProject && (
        <div className="space-y-6">
          <div className="mx-auto w-[320px] overflow-hidden rounded-2xl border border-white/10">
            <Player
              component={VideoComposition}
              inputProps={renderProject}
              durationInFrames={durationInFrames}
              fps={renderProject.fps}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%" }}
              controls
              loop
            />
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white/70 hover:text-white"
            >
              <RotateCcw size={16} /> Recommencer
            </button>
            <button
              onClick={handleRender}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />}
              Exporter la vidéo (MP4)
            </button>
          </div>
        </div>
      )}

      {step === "done" && videoUrl && (
        <div className="space-y-6 text-center">
          <video
            src={videoUrl}
            controls
            className="mx-auto w-[320px] rounded-2xl border border-white/10"
          />
          <div className="flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white/70 hover:text-white"
            >
              <RotateCcw size={16} /> Nouvelle vidéo
            </button>
            <a
              href={videoUrl}
              download
              className="flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-black transition hover:bg-white/90"
            >
              <Download size={18} /> Télécharger
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
