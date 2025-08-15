import React from "react";
import { AbsoluteFill, Sequence, Video, useCurrentFrame } from "remotion";

export type Caption = { text: string; startMs: number; endMs: number };
export type RenderPlan = {
  videoUrl: string;
  startMs: number;
  durationMs: number;
  captions: Caption[];
  fps?: number;
  width?: number;
  height?: number;
};

export const Clip: React.FC<RenderPlan> = (plan) => {
  const fps = plan.fps ?? 30;
  const startFrame = Math.floor((plan.startMs / 1000) * fps);
  const durationInFrames = Math.floor((plan.durationMs / 1000) * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence from={0} durationInFrames={durationInFrames}>
        <Video src={plan.videoUrl} startFrom={startFrame} />
      </Sequence>
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          padding: 48,
          color: "white",
          fontSize: 48,
          textAlign: "center",
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
        }}
      >
        <CaptionNow captions={plan.captions} fps={fps} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CaptionNow: React.FC<{ captions: Caption[]; fps: number }> = ({
  captions,
  fps,
}) => {
  const frame = useCurrentFrame();
  const nowMs = (frame / fps) * 1000;
  const active = captions.find((c) => nowMs >= c.startMs && nowMs <= c.endMs);
  return <div>{active?.text ?? ""}</div>;
};