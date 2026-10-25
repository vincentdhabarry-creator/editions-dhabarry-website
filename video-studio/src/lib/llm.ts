import { normalizeVideoProject, videoProjectJsonSchema, videoProjectSchema, type VideoProject } from "./schema";
import { VISUAL_STYLES, VOICE_OPTIONS } from "./styles";
import type { GenerateScriptRequest } from "./schema";

const SYSTEM_PROMPT = `Tu es le moteur "Script & Storyboard Generator" d'une application de création de vidéos
verticales (TikTok/Reels/Shorts) à partir d'actualités ou de statistiques.

Ta tâche : décomposer le texte source fourni par l'utilisateur en une suite de 3 à 8 scènes courtes,
puis produire UNIQUEMENT un objet JSON strictement conforme au schéma fourni (aucun texte hors JSON).

Règles impératives :
- "voiceoverScript" est le texte EXACT qui sera synthétisé en voix off : français, phrases courtes,
  rythmées, sans jargon markdown, sans emoji, sans guillemets inutiles. 1 à 3 phrases par scène maximum.
- La première scène est TOUJOURS de type "hook_headline" : elle doit accrocher en une phrase choc.
- Utilise "stat_counter" pour mettre en avant UN chiffre clé (visualData.metricNumber + metricUnit).
- Utilise "comparison_bars" pour comparer 2 à 5 valeurs (visualData.chartItems).
- Utilise "bullet_points" pour lister 3 à 5 informations courtes (visualData.bulletPoints).
- Ne remplis que les champs de "visualData" pertinents pour le "type" de la scène ; laisse les autres à null.
- "themeColor" est une couleur hex CSS cohérente avec le style visuel demandé.
- N'invente pas de chiffres qui ne sont pas déductibles du texte source ; reformule fidèlement.`;

function buildUserPrompt(req: GenerateScriptRequest): string {
  const style = VISUAL_STYLES[req.visualStyle];
  const voice = VOICE_OPTIONS[req.voice];
  return `Style visuel choisi : ${style.label} — ${style.llmToneHint}.
Voix choisie pour la narration : ${voice.label}.

Texte source (article, dépêche ou statistiques brutes) :
"""
${req.sourceText.trim()}
"""

Produis le storyboard JSON pour ce texte, dans le style demandé.`;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${name}`);
  }
  return value;
}

async function callOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  req: GenerateScriptRequest,
): Promise<unknown> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: videoProjectJsonSchema,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Échec de l'appel LLM (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const content = data.choices[0]?.message.content;
  if (!content) {
    throw new Error("Réponse LLM vide.");
  }
  return JSON.parse(content);
}

async function callAnthropic(apiKey: string, model: string, req: GenerateScriptRequest): Promise<unknown> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(req) }],
      tools: [
        {
          name: "emit_video_project",
          description: "Émet le storyboard JSON de la vidéo.",
          input_schema: videoProjectJsonSchema.schema,
        },
      ],
      tool_choice: { type: "tool", name: "emit_video_project" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Échec de l'appel LLM (${res.status}): ${body}`);
  }

  const data = (await res.json()) as {
    content: { type: string; input?: unknown }[];
  };
  const toolUse = data.content.find((block) => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("Le LLM n'a pas retourné d'appel d'outil.");
  }
  return toolUse.input;
}

/**
 * Étape B du pipeline : génère le storyboard JSON strict à partir du texte source,
 * en interrogeant le fournisseur LLM configuré via LLM_PROVIDER.
 */
export async function generateVideoProject(req: GenerateScriptRequest): Promise<VideoProject> {
  const provider = (process.env.LLM_PROVIDER || "openai").toLowerCase();
  const model = process.env.LLM_MODEL || "gpt-4o-2024-08-06";

  let raw: unknown;
  switch (provider) {
    case "openai":
      raw = await callOpenAiCompatible("https://api.openai.com/v1", getEnv("OPENAI_API_KEY"), model, req);
      break;
    case "openrouter":
      raw = await callOpenAiCompatible(
        "https://openrouter.ai/api/v1",
        getEnv("OPENROUTER_API_KEY"),
        model,
        req,
      );
      break;
    case "anthropic":
      raw = await callAnthropic(getEnv("ANTHROPIC_API_KEY"), model, req);
      break;
    default:
      throw new Error(`LLM_PROVIDER inconnu: "${provider}" (attendu: openai | anthropic | openrouter)`);
  }

  const parsed = videoProjectSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Le JSON retourné par le LLM ne respecte pas le schéma: ${parsed.error.message}`);
  }

  return normalizeVideoProject(parsed.data);
}
