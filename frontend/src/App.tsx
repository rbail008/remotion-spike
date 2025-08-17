import { useEffect, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { Clip, RenderPlan } from "./Clip";

const BACKEND = "http://localhost:4000";

export default function App() {
  const [plan, setPlan] = useState<RenderPlan>({
    videoUrl:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    startMs: 25000,
    durationMs: 30000,
    captions: [
      { text: "Hello!", startMs: 0, endMs: 2000 },
      { text: "This is a demo.", startMs: 2000, endMs: 5000 },
      { text: "Remotion MVP", startMs: 5000, endMs: 8000 },
    ],
    fps: 30,
    width: 1080,
    height: 1920,
    showSubtitles: true,
  });

  const fps = plan.fps ?? 30;
  const durationInFrames = Math.floor((plan.durationMs / 1000) * fps);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const timerRef = useRef<number | null>(null);

  const compositionWidth = plan.width ?? 1080;
  const compositionHeight = plan.height ?? 1920;

  useEffect(() => {
    if (!renderId) return;
    const tick = async () => {
      const res = await fetch(`${BACKEND}/api/clips/${renderId}`);
      const json = await res.json();
      setStatus(json);
      if (json.status === "completed" || json.status === "failed") {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    tick();
    const id = window.setInterval(tick, 1500);
    timerRef.current = id as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [renderId]);

  const startRender = async () => {
    const res = await fetch(`${BACKEND}/api/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(plan),
    });
    const json = await res.json();
    setRenderId(json.id);
    setStatus({ status: json.status });
  };

  return (
    <div
      style={{ display: "grid", gap: 16, padding: 24, fontFamily: "system-ui" }}
    >
      <h1>Clip MVP</h1>

      <div style={{ display: "grid", gap: 8 }}>
        <label>Video URL</label>
        <input
          value={plan.videoUrl}
          onChange={(e) => setPlan({ ...plan, videoUrl: e.target.value })}
          style={{ padding: 8, fontSize: 16 }}
        />
        <label>Start (ms)</label>
        <input
          type="number"
          value={plan.startMs}
          onChange={(e) =>
            setPlan({ ...plan, startMs: Number(e.target.value) })
          }
          style={{ padding: 8, fontSize: 16 }}
        />
        <label>Duration (ms)</label>
        <input
          type="number"
          value={plan.durationMs}
          onChange={(e) =>
            setPlan({ ...plan, durationMs: Number(e.target.value) })
          }
          style={{ padding: 8, fontSize: 16 }}
        />
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <input
            type="checkbox"
            checked={plan.showSubtitles !== false}
            onChange={(e) =>
              setPlan({ ...plan, showSubtitles: e.target.checked })
            }
          />
          Show subtitles
        </label>

        <details style={{ marginTop: 8 }}>
          <summary>Load captions from SRT (optional)</summary>
          <input
            type="file"
            accept=".srt"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const mod = await import("@remotion/captions");
                const { captions } = mod.parseSrt({ input: text });
                const normalized = captions.map((c: any) => ({
                  text: c.text,
                  startMs: c.startMs,
                  endMs: c.endMs,
                }));
                setPlan({
                  ...plan,
                  captions: normalized,
                  captionsAreAbsolute: true,
                });
              } catch (err) {
                alert(
                  "Failed to parse SRT: " + String((err as any)?.message || err)
                );
              }
            }}
          />
        </details>
      </div>

      <button
        onClick={startRender}
        style={{
          padding: "12px 24px",
          fontSize: 18,
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        Render on Backend
      </button>

      <div>
        <strong>Status:</strong> {status?.status ?? "idle"}
        {status?.status === "completed" && (
          <>
            {" "}
            -{" "}
            <a
              href={`${BACKEND}${status.url}`}
              target="_blank"
              rel="noreferrer"
            >
              Download / View MP4
            </a>
          </>
        )}
        {status?.status === "failed" && <pre>{String(status.error)}</pre>}
      </div>

      <h2>Preview (local, same props)</h2>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Player
          component={Clip}
          inputProps={plan}
          durationInFrames={durationInFrames}
          compositionWidth={compositionWidth}
          compositionHeight={compositionHeight}
          fps={fps}
          controls
          style={{
            width: "100%",
            maxWidth: 540,
            aspectRatio: `${compositionWidth} / ${compositionHeight}`,
          }}
        />
      </div>
    </div>
  );
}
