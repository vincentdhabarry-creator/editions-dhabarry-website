import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Entrée standard (translation + fondu) utilisée par les éléments de motion design des scènes. */
export function useEnter(delayFrames = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delayFrames);
  const progress = spring({ frame: localFrame, fps, config: { damping: 14, stiffness: 140, mass: 0.6 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [40, 0]);
  return { opacity, translateY, progress };
}
