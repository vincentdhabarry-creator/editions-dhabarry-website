import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VisualStyle } from "@/lib/styles";
import type { RenderScene } from "../types";
import { Badge } from "../components/Badge";
import { useEnter } from "../components/motion";

const STAGGER_FRAMES = 6;

export const ComparisonBars: React.FC<{ scene: RenderScene; style: VisualStyle; themeColor: string }> = ({
  scene,
  style,
  themeColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter(0);
  const { badge, headline, chartItems } = scene.visualData;
  const items = chartItems ?? [];
  const maxValue = Math.max(1, ...items.map((item) => item.value));

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
        gap: 24,
        padding: "0 72px",
      }}
    >
      {badge && (
        <div style={{ opacity: enter.opacity, marginBottom: 4 }}>
          <Badge label={badge} style={style} accentColor={themeColor} />
        </div>
      )}
      {headline && (
        <div
          style={{
            opacity: enter.opacity,
            fontSize: 52,
            fontWeight: style.headlineWeight,
            color: style.textPrimary,
            marginBottom: 12,
          }}
        >
          {headline}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {items.map((item, index) => {
          const delay = 8 + index * STAGGER_FRAMES;
          const progress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 16, stiffness: 120 },
          });
          const widthPct = interpolate(progress, [0, 1], [0, (item.value / maxValue) * 100]);
          return (
            <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34 }}>
                <span style={{ color: style.textSecondary, fontWeight: 600 }}>{item.label}</span>
                <span style={{ color: style.textPrimary, fontWeight: 800 }}>
                  {Math.round(item.value * progress).toLocaleString("fr-FR")}
                </span>
              </div>
              <div
                style={{
                  height: 34,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${widthPct}%`,
                    borderRadius: 10,
                    background: themeColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
