import { NextResponse } from "next/server";
import { generateVideoProject } from "@/lib/llm";
import { VISUAL_STYLES, VOICE_OPTIONS } from "@/lib/styles";

export const runtime = "nodejs";

interface GenerateScriptBody {
  sourceText?: unknown;
  visualStyle?: unknown;
  voice?: unknown;
}

export async function POST(request: Request) {
  let body: GenerateScriptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const { sourceText, visualStyle, voice } = body;

  if (typeof sourceText !== "string" || sourceText.trim().length < 20) {
    return NextResponse.json(
      { error: "sourceText est requis et doit contenir au moins 20 caractères." },
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
    const project = await generateVideoProject({
      sourceText,
      visualStyle: visualStyle as keyof typeof VISUAL_STYLES,
      voice: voice as keyof typeof VOICE_OPTIONS,
    });
    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
