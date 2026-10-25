import { NextResponse } from "next/server";
import { normalizeVideoProject, videoProjectSchema } from "@/lib/schema";
import { VISUAL_STYLES, VOICE_OPTIONS } from "@/lib/styles";
import { buildRenderProject } from "@/lib/render";

export const runtime = "nodejs";
export const maxDuration = 120;

interface GenerateVoiceoverBody {
  project?: unknown;
  visualStyle?: unknown;
  voice?: unknown;
}

export async function POST(request: Request) {
  let body: GenerateVoiceoverBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const { project, visualStyle, voice } = body;

  const parsedProject = videoProjectSchema.safeParse(project);
  if (!parsedProject.success) {
    return NextResponse.json(
      { error: `project invalide: ${parsedProject.error.message}` },
      { status: 400 },
    );
  }
  if (typeof visualStyle !== "string" || !(visualStyle in VISUAL_STYLES)) {
    return NextResponse.json(
      { error: `visualStyle invalide. Attendu: ${Object.keys(VISUAL_STYLES).join(", ")}` },
      { status: 400 },
    );
  }
  if (typeof voice !== "string" || !(voice in VOICE_OPTIONS)) {
    return NextResponse.json(
      { error: `voice invalide. Attendu: ${Object.keys(VOICE_OPTIONS).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const renderProject = await buildRenderProject(
      normalizeVideoProject(parsedProject.data),
      visualStyle as keyof typeof VISUAL_STYLES,
      voice as keyof typeof VOICE_OPTIONS,
    );
    return NextResponse.json({ renderProject });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
