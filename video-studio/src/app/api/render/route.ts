import { NextResponse } from "next/server";
import { normalizeRenderProject, renderProjectSchema } from "@/remotion/types";
import { renderVideoProject } from "@/lib/render";

export const runtime = "nodejs";
export const maxDuration = 300;

interface RenderBody {
  renderProject?: unknown;
}

export async function POST(request: Request) {
  let body: RenderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const parsed = renderProjectSchema.safeParse(body.renderProject);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `renderProject invalide: ${parsed.error.message}` },
      { status: 400 },
    );
  }

  try {
    const result = await renderVideoProject(normalizeRenderProject(parsed.data));
    return NextResponse.json({ url: result.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
