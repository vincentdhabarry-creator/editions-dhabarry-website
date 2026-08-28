import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video Studio — Actu & Stats en vidéo verticale",
  description:
    "Transformez un texte d'actualité ou des statistiques en vidéo verticale (TikTok/Reels/Shorts) avec narration IA et sous-titres animés.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
