import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import type { VisualStyle } from "@/lib/styles";
import type { RenderScene } from "../types";
import { Badge } from "../components/Badge";
import { useEnter } from "../components/motion";

const COUNT_UP_DURATION_FRAMES = 45;

function formatNumber(value: number): string {
  const rounded = Math.abs(value) < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return rounded.toLocaleString("fr-FR");
}

export const StatCounter: React.FC<{ scene: RenderScene; style: VisualStyle; themeColor: string }> = ({
  scene,
  style,
  themeColor,
}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(0);
  const { badge, headline, metricNumber, metricUnit } = scene.visualData;

  const countProgress = interpolate(frame, [8, 8 + COUNT_UP_DURATION_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayValue = metricNumber != null ? metricNumber * countProgress : 0;

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
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "0 72px",
        textAlign: "center",
      }}
    >
      {badge && (
        <div style={{ opacity: enter.opacity }}>
          <Badge label={badge} style={style} accentColor={themeColor} />
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          opacity: enter.opacity,
          transform: `scale(${interpolate(enter.progress, [0, 1], [0.85, 1])})`,
        }}
      >
        <span style={{ fontSize: 168, fontWeight: 900, color: themeColor, fontVariantNumeric: "tabular-nums" }}>
          {formatNumber(displayValue)}
        </span>
        {metricUnit && (
          <span style={{ fontSize: 64, fontWeight: 800, color: style.textPrimary }}>{metricUnit}</span>
        )}
      </div>
      {headline && (
        <div
          style={{
            opacity: enter.opacity,
            fontSize: 46,
            fontWeight: 700,
            color: style.textSecondary,
            maxWidth: 820,
          }}
        >
          {headline}
        </div>
      )}
    </div>
  );
};
