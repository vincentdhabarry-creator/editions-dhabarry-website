# Video Studio

Générateur de vidéos verticales (TikTok/Reels/Shorts, 1080×1920, 30 fps) à partir d'un texte
d'actualité ou de statistiques, avec narration IA et sous-titres animés mot-à-mot.

## Pipeline

1. **Formulaire** (`src/components/VideoStudio.tsx`) — texte source, style graphique (Dark
   Cyber / Clean Corporate / Breaking News), voix (homme/femme, ton dynamique).
2. **Script & storyboard** (`POST /api/generate-script`, `src/lib/llm.ts`) — le LLM configuré
   (OpenAI, Anthropic ou OpenRouter, sorties structurées strictes) découpe le texte en 3 à 8
   scènes JSON strictement typées (`src/lib/schema.ts`).
3. **Voix off & synchronisation** (`POST /api/generate-voiceover`, `src/lib/tts.ts`) —
   ElevenLabs synthétise chaque scène et renvoie l'alignement caractère-par-caractère, converti
   en timestamps mot-à-mot pour les sous-titres animés.
4. **Prévisualisation** — le storyboard + la voix off sont injectés dans un `<Player>`
   (`@remotion/player`) côté client, avant tout rendu serveur coûteux.
5. **Rendu final** (`POST /api/render`, `src/lib/render.ts`) — `bundle()` + `selectComposition()`
   + `renderMedia()` (`@remotion/bundler` / `@remotion/renderer`) exportent un MP4 H.264 dans
   `public/renders/`.

## Composition Remotion

`src/remotion/` contient la composition `VideoProject` : un fond par style visuel
(`components/Background.tsx`), une scène par type (`scenes/HookHeadline.tsx`,
`StatCounter.tsx`, `ComparisonBars.tsx`, `BulletPoints.tsx`), et des sous-titres karaoke
synchronisés à l'audio (`components/Captions.tsx`).

`npm run remotion:studio` ouvre Remotion Studio sur un projet de démonstration
(`src/remotion/sample-data.ts`) pour itérer sur le motion design sans dépendre des API externes.

## Configuration

Copier `.env.example` en `.env.local` et renseigner :

- `LLM_PROVIDER` + la clé API du fournisseur choisi (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY` /
  `OPENROUTER_API_KEY`) et `LLM_MODEL`.
- `ELEVENLABS_API_KEY` + les IDs de voix (`ELEVENLABS_VOICE_ID_MALE` / `_FEMALE`).

## Développement

```bash
npm install
npm run dev            # http://localhost:3000
npm run typecheck
npm run lint
npm run build
```

Le rendu vidéo (`renderMedia()`) lance un Chromium headless : sur une machine sans Chromium
préinstallé, Remotion le télécharge automatiquement au premier rendu. Pour pointer vers un
Chromium déjà présent sur la machine (CI, environnements sans accès réseau), définir
`REMOTION_BROWSER_EXECUTABLE` avant `npm run remotion:render` ou `npm run dev`.

## Limites connues

- Le rendu serveur (`renderMedia`, Chromium headless) ne fonctionne pas sur les plateformes
  serverless classiques (ex. Vercel Functions) sans adaptation (`@remotion/lambda` ou un
  serveur Node dédié à durée de vie longue) : ce projet cible un déploiement Node.js
  self-hosted, conformément au cahier des charges.
- `next@14.2.35` conserve 2 vulnérabilités connues (SSRF/DoS dans des fonctionnalités
  dev/proxy avancées de Next.js) uniquement corrigées dans Next 16, une migration majeure hors
  périmètre de cette itération.
