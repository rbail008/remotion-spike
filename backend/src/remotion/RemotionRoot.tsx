import React from "react";
import { Composition } from "remotion";
import { Clip } from "./Clip";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PodcastClip"
    component={Clip}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30 * 30}
    defaultProps={{
      videoUrl: "",
      startMs: 0,
      durationMs: 30000,
      captions: [],
    }}
    calculateMetadata={async ({ props }) => {
      const fps = props.fps ?? 30;
      return {
        durationInFrames: Math.floor((props.durationMs / 1000) * fps),
        width: props.width ?? 1080,
        height: props.height ?? 1920,
        fps,
        props,
      };
    }}
  />
);