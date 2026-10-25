import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./VideoComposition";
import { sampleProject } from "./sample-data";
import { totalDurationInFrames } from "./types";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoProject"
        component={VideoComposition}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        durationInFrames={totalDurationInFrames(sampleProject)}
        defaultProps={sampleProject}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: totalDurationInFrames(props),
        })}
      />
    </>
  );
};
