import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { RenderWord } from "../types";

const CONTEXT_WORDS = 2;

/**
 * Sous-titres animés mot-à-mot (style karaoke) : le mot en cours de prononciation est mis en
 * évidence, les mots voisins restent visibles en arrière-plan pour donner du contexte.
 */
export const Captions: React.FC<{
  words: RenderWord[];
  accentColor: string;
  textColor: string;
}> = ({ words, accentColor, textColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (words.length === 0) return null;

  let activeIndex = words.findIndex((w) => frame >= w.startFrame && frame < w.endFrame);
  if (activeIndex === -1) {
    activeIndex = words.reduce(
      (best, w, i) => (w.startFrame <= frame ? i : best),
      0,
    );
  }

  const visible = words
    .map((word, index) => ({ word, index }))
    .filter(({ index }) => Math.abs(index - activeIndex) <= CONTEXT_WORDS);

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        bottom: 260,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "0 16px",
        textAlign: "center",
      }}
    >
      {visible.map(({ word, index }) => {
        const isActive = index === activeIndex;
        const distance = index - activeIndex;
        const pop = isActive
          ? spring({
              frame: frame - word.startFrame,
              fps,
              config: { damping: 12, stiffness: 220, mass: 0.5 },
            })
          : 1;
        const scale = isActive ? interpolate(pop, [0, 1], [0.7, 1.08]) : 1;
        const opacity = interpolate(Math.abs(distance), [0, CONTEXT_WORDS], [1, 0.35]);

        return (
          <span
            key={`${index}-${word.text}`}
            style={{
              fontSize: isActive ? 74 : 52,
              fontWeight: isActive ? 900 : 700,
              color: isActive ? accentColor : textColor,
              opacity,
              transform: `scale(${scale})`,
              lineHeight: 1.05,
              textShadow: "0 4px 24px rgba(0,0,0,0.55)",
              transition: "none",
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};
