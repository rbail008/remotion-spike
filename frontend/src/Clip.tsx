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
  showSubtitles?: boolean;
  captionsAreAbsolute?: boolean;
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
      {plan.showSubtitles !== false && (
        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            padding: 48,
            color: "white",
            fontSize: 48,
            textAlign: "center",
            textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            whiteSpace: "pre-wrap",
          }}
        >
          <CaptionNow
            captions={plan.captions}
            fps={fps}
            startMs={plan.captionsAreAbsolute ? plan.startMs : 0}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const CaptionNow: React.FC<{
  captions: Caption[];
  fps: number;
  startMs?: number;
}> = ({ captions, fps, startMs = 0 }) => {
  const frame = useCurrentFrame();
  const nowMs = (frame / fps) * 1000;
  const active = captions.find(
    (c) => nowMs + startMs >= c.startMs && nowMs + startMs <= c.endMs
  );
  return <div>{active?.text ?? ""}</div>;
};
