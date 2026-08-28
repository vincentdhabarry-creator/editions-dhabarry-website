import React from "react";
import type { VisualStyle } from "@/lib/styles";
import type { RenderScene } from "../types";
import { Badge } from "../components/Badge";
import { useEnter } from "../components/motion";

export const HookHeadline: React.FC<{ scene: RenderScene; style: VisualStyle; themeColor: string }> = ({
  scene,
  style,
  themeColor,
}) => {
  const badge = useEnter(0);
  const headline = useEnter(6);
  const sub = useEnter(14);
  const { badge: badgeText, headline: headlineText, subheadline } = scene.visualData;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "62%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 28,
        padding: "0 72px",
      }}
    >
      {badgeText && (
        <div style={{ opacity: badge.opacity, transform: `translateY(${badge.translateY}px)` }}>
          <Badge label={badgeText} style={style} accentColor={themeColor} />
        </div>
      )}
      {headlineText && (
        <div
          style={{
            opacity: headline.opacity,
            transform: `translateY(${headline.translateY}px)`,
            fontSize: 88,
            fontWeight: style.headlineWeight,
            color: style.textPrimary,
            lineHeight: 1.05,
          }}
        >
          {headlineText}
        </div>
      )}
      {subheadline && (
        <div
          style={{
            opacity: sub.opacity,
            transform: `translateY(${sub.translateY}px)`,
            fontSize: 42,
            fontWeight: 500,
            color: style.textSecondary,
            lineHeight: 1.3,
          }}
        >
          {subheadline}
        </div>
      )}
    </div>
  );
};
