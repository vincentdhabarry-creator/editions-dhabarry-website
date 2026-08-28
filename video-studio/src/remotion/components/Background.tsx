import React from "react";
import { AbsoluteFill } from "remotion";
import type { VisualStyle } from "@/lib/styles";

export const Background: React.FC<{ style: VisualStyle; children: React.ReactNode }> = ({
  style,
  children,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: style.background, fontFamily: style.fontFamily }}>
      <AbsoluteFill style={{ backgroundImage: style.backgroundAccentGradient }} />
      <AbsoluteFill>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
