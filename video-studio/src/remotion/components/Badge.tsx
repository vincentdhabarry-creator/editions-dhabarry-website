import React from "react";
import type { VisualStyle } from "@/lib/styles";

export const Badge: React.FC<{ label: string; style: VisualStyle; accentColor: string }> = ({
  label,
  style,
  accentColor,
}) => {
  const base: React.CSSProperties = {
    display: "inline-block",
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: style.badgeStyle === "pill" ? "#fff" : accentColor,
    padding: "12px 28px",
    borderRadius: style.badgeStyle === "pill" ? 999 : 6,
    background: style.badgeStyle === "pill" ? accentColor : "transparent",
    border: style.badgeStyle === "tag" ? `2px solid ${accentColor}` : "none",
  };

  if (style.badgeStyle === "ticker") {
    return (
      <div
        style={{
          ...base,
          background: accentColor,
          color: "#fff",
          borderRadius: 0,
          clipPath: "polygon(0 0, 100% 0, 96% 100%, 0% 100%)",
        }}
      >
        {label}
      </div>
    );
  }

  return <div style={base}>{label}</div>;
};
