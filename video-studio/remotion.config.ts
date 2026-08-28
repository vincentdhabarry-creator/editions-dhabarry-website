import path from "node:path";
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");

// Le bundler de Remotion n'utilise pas tsconfig.json : on répète ici l'alias "@/*"
// défini côté Next.js (tsconfig.json -> paths) pour que src/remotion puisse importer
// depuis src/lib.
Config.overrideWebpackConfig((currentConfiguration) => ({
  ...currentConfiguration,
  resolve: {
    ...currentConfiguration.resolve,
    alias: {
      ...currentConfiguration.resolve?.alias,
      "@": path.join(process.cwd(), "src"),
    },
  },
}));

// Permet de pointer vers un Chromium déjà installé sur la machine de rendu (utile en CI /
// environnements sans accès réseau pour télécharger le Chromium géré par Remotion).
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
