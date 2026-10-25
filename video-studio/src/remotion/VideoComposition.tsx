import React from "react";
import { Audio, Sequence } from "remotion";
import { VISUAL_STYLES } from "@/lib/styles";
import type { VisualStyle } from "@/lib/styles";
import type { RenderProject, RenderScene } from "./types";
import { Background } from "./components/Background";
import { Captions } from "./components/Captions";
import { HookHeadline } from "./scenes/HookHeadline";
import { StatCounter } from "./scenes/StatCounter";
import { ComparisonBars } from "./scenes/ComparisonBars";
import { BulletPoints } from "./scenes/BulletPoints";

const SCENE_COMPONENTS = {
  hook_headline: HookHeadline,
  stat_counter: StatCounter,
  comparison_bars: ComparisonBars,
  bullet_points: BulletPoints,
} satisfies Record<RenderScene["type"], React.FC<{ scene: RenderScene; style: VisualStyle; themeColor: string }>>;

export const VideoComposition: React.FC<RenderProject> = ({ scenes, themeColor, styleId }) => {
  const style = VISUAL_STYLES[styleId];
  let cursor = 0;

  return (
    <Background style={style}>
      {scenes.map((scene) => {
        const from = cursor;
        cursor += scene.durationInFrames;
        const SceneComponent = SCENE_COMPONENTS[scene.type];

        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} name={scene.id}>
            <Audio src={scene.audioSrc} />
            <SceneComponent scene={scene} style={style} themeColor={themeColor} />
            <Captions words={scene.words} accentColor={themeColor} textColor={style.textPrimary} />
          </Sequence>
        );
      })}
    </Background>
  );
};
