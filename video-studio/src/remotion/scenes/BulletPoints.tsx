import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { VisualStyle } from "@/lib/styles";
import type { RenderScene } from "../types";
import { Badge } from "../components/Badge";
import { useEnter } from "../components/motion";

const STAGGER_FRAMES = 8;

export const BulletPoints: React.FC<{ scene: RenderScene; style: VisualStyle; themeColor: string }> = ({
  scene,
  style,
  themeColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = useEnter(0);
  const { badge, headline, bulletPoints } = scene.visualData;
  const items = bulletPoints ?? [];

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
        gap: 22,
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
            marginBottom: 8,
          }}
        >
          {headline}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {items.map((point, index) => {
          const delay = 8 + index * STAGGER_FRAMES;
          const progress = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 14, stiffness: 160 },
          });
          const opacity = interpolate(progress, [0, 1], [0, 1]);
          const translateX = interpolate(progress, [0, 1], [-50, 0]);
          return (
            <div
              key={point}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 20,
                opacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: themeColor,
                  marginTop: 12,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 40, fontWeight: 600, color: style.textPrimary, lineHeight: 1.3 }}>
                {point}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
