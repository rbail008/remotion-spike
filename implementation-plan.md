Absolutely—here’s a tiny, **copy-pasteable MVP** you can run locally:

- **Backend:** a Node/Express service that uses Remotion to render a clip from a given `RenderPlan` and serves the MP4 over HTTP.
- **Frontend:** a minimal Vite + React app that **previews** the same plan with `<Player>` and can **trigger** the backend render + show the finished URL.
- **No shared package:** we’ll **duplicate the same `Clip` component** (one in the backend Remotion project, one in the frontend) to keep it simple.

---

# 0) Project layout

```
mvp/
  backend/
    package.json
    tsconfig.json
    src/
      server.ts             # Express API + static server
      render.ts             # Remotion render function
      remotion/
        index.ts            # registerRoot
        RemotionRoot.tsx    # Composition registration
        Clip.tsx            # SAME code as frontend’s Clip
    out/                    # rendered mp4 goes here (gitignored)
    public/                 # static files (optional)
  frontend/
    index.html
    package.json
    vite.config.ts
    src/
      main.tsx
      App.tsx
      Clip.tsx              # SAME code as backend’s Clip
```

---

# 1) The shared idea: `RenderPlan` (JSON props)

```ts
// Use this shape in requests and in <Player>:
type Caption = { text: string; startMs: number; endMs: number };

type RenderPlan = {
  videoUrl: string; // local file path or http(s)
  startMs: number; // where to start in the source
  durationMs: number; // clip length
  captions: Caption[]; // optional
  fps?: number; // defaults to 30
  width?: number; // defaults to 1080
  height?: number; // defaults to 1920
};
```

---

# 2) Backend

## 2.1 Install

```bash
cd mvp/backend
npm init -y
npm i express cors @remotion/bundler @remotion/renderer
npm i -D typescript ts-node ts-node-dev @types/node @types/express
npx tsc --init
```

Set `"module": "ESNext"`, `"esModuleInterop": true` in `tsconfig.json`.

Add scripts to **backend/package.json**:

```json
{
  "type": "module",
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts"
  }
}
```

## 2.2 Minimal Remotion composition (duplicated later in FE)

**backend/src/remotion/Clip.tsx**

```tsx
import React from "react";
import { AbsoluteFill, Sequence, Video } from "remotion";

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
      {/* ultra-basic captions */}
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

// tiny helper
import { useCurrentFrame } from "remotion";
const CaptionNow: React.FC<{ captions: Caption[]; fps: number }> = ({
  captions,
  fps,
}) => {
  const frame = useCurrentFrame();
  const nowMs = (frame / fps) * 1000;
  const active = captions.find((c) => nowMs >= c.startMs && nowMs <= c.endMs);
  return <div>{active?.text ?? ""}</div>;
};
```

**backend/src/remotion/RemotionRoot.tsx**

```tsx
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
    durationInFrames={30 * 30} // default; overridden below
    defaultProps={{
      videoUrl: "",
      startMs: 0,
      durationMs: 30000,
      captions: [],
    }}
    // Make duration/size dynamic from input props
    calculateMetadata={async ({ props }) => {
      const fps = props.fps ?? 30;
      return {
        durationInFrames: Math.floor((props.durationMs / 1000) * fps),
        width: props.width ?? 1080,
        height: props.height ?? 1920,
        fps,
        props, // (optional) echo back normalized props
      };
    }}
  />
);
```

**backend/src/remotion/index.ts**

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./RemotionRoot";
registerRoot(RemotionRoot);
```

## 2.3 Render helper

**backend/src/render.ts**

```ts
import path from "path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";

export async function renderClipToFile(plan: any, outPath: string) {
  const entry = path.join(process.cwd(), "src", "remotion", "index.ts");
  const serveUrl = await bundle({ entryPoint: entry });

  const composition = await selectComposition({
    serveUrl,
    id: "PodcastClip",
    inputProps: plan,
  });

  await renderMedia({
    serveUrl,
    composition,
    inputProps: plan,
    codec: "h264",
    outputLocation: outPath,
  });

  return outPath;
}
```

## 2.4 Express server

**backend/src/server.ts**

```ts
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { renderClipToFile } from "./render.js";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory “DB” for MVP
type ClipRow = {
  id: string;
  status: "queued" | "rendering" | "completed" | "failed";
  filePath?: string;
  url?: string;
  error?: string;
  plan: any;
};
const clips = new Map<string, ClipRow>();

// Static hosting of rendered files
const OUT_DIR = path.join(process.cwd(), "out");
fs.mkdirSync(OUT_DIR, { recursive: true });
app.use("/media", express.static(OUT_DIR));

app.post("/api/render", async (req, res) => {
  try {
    const plan = req.body; // trust for MVP
    const id = crypto.randomUUID();
    const outPath = path.join(OUT_DIR, `${id}.mp4`);
    const row: ClipRow = { id, status: "queued", plan };
    clips.set(id, row);

    // fire-and-forget render (MVP – no queue)
    (async () => {
      try {
        row.status = "rendering";
        await renderClipToFile(plan, outPath);
        row.status = "completed";
        row.filePath = outPath;
        row.url = `/media/${id}.mp4`; // local URL
      } catch (e: any) {
        row.status = "failed";
        row.error = String(e?.message || e);
      }
    })();

    res.json({ id, status: row.status });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/api/clips/:id", (req, res) => {
  const row = clips.get(req.params.id);
  if (!row) return res.status(404).json({ error: "not found" });
  res.json(row);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Backend running http://localhost:${PORT}`);
  console.log(`Rendered files served at http://localhost:${PORT}/media/...`);
});
```

Run it:

```bash
npm run dev
```

> Now you have `POST /api/render` that accepts a plan JSON and returns `{ id }`. Poll `GET /api/clips/:id`. When `status = "completed"`, open `http://localhost:4000/media/<id>.mp4`.

---

# 3) Frontend

## 3.1 Create app

```bash
cd ../frontend
npm create vite@latest . -- --template react-ts
npm i @remotion/player
npm i -D typescript
```

## 3.2 Duplicate the **same** `Clip` component

**frontend/src/Clip.tsx**

```tsx
import React from "react";
import { AbsoluteFill, Sequence, Video } from "remotion";

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

import { useCurrentFrame } from "remotion";
const CaptionNow: React.FC<{ captions: Caption[]; fps: number }> = ({
  captions,
  fps,
}) => {
  const frame = useCurrentFrame();
  const nowMs = (frame / fps) * 1000;
  const active = captions.find((c) => nowMs >= c.startMs && nowMs <= c.endMs);
  return <div>{active?.text ?? ""}</div>;
};
```

## 3.3 Minimal UI: preview + render button

**frontend/src/App.tsx**

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { Clip, RenderPlan } from "./Clip";

const BACKEND = "http://localhost:4000";

export default function App() {
  const [plan, setPlan] = useState<RenderPlan>({
    // For MVP testing, put a local mp4 path or an https URL:
    // e.g., drop a test mp4 in backend/public and serve it from http://localhost:4000/public/sample.mp4
    videoUrl: `${BACKEND}/media/sample-source.mp4`, // replace with a real source URL
    startMs: 0,
    durationMs: 10000,
    captions: [
      { text: "Hello!", startMs: 0, endMs: 2000 },
      { text: "This is a demo.", startMs: 2000, endMs: 5000 },
    ],
    fps: 30,
    width: 1080,
    height: 1920,
  });

  const fps = plan.fps ?? 30;
  const durationInFrames = Math.floor((plan.durationMs / 1000) * fps);
  const [renderId, setRenderId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const timerRef = useRef<number | null>(null);

  const compositionWidth = plan.width ?? 1080;
  const compositionHeight = plan.height ?? 1920;

  // Poll backend for render status
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
        />
        <label>Start (ms)</label>
        <input
          type="number"
          value={plan.startMs}
          onChange={(e) =>
            setPlan({ ...plan, startMs: Number(e.target.value) })
          }
        />
        <label>Duration (ms)</label>
        <input
          type="number"
          value={plan.durationMs}
          onChange={(e) =>
            setPlan({ ...plan, durationMs: Number(e.target.value) })
          }
        />
      </div>

      <button onClick={startRender} style={{ padding: 8 }}>
        Render on Backend
      </button>

      <div>
        <strong>Status:</strong> {status?.status ?? "idle"}
        {status?.status === "completed" && (
          <>
            {" "}
            - <a
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
      <Player
        component={Clip}
        inputProps={plan}
        durationInFrames={durationInFrames}
        compositionWidth={compositionWidth}
        compositionHeight={compositionHeight}
        fps={fps}
        controls
      />
    </div>
  );
}
```

**frontend/src/main.tsx**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

**frontend/index.html** is created by Vite; ensure it has `<div id="root"></div>`.

Run it:

```bash
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

---

# 4) Try it out (local only)

1. Put a test MP4 somewhere accessible:

   - Easiest: drop a source MP4 into `backend/out/sample-source.mp4` and set `videoUrl: http://localhost:4000/media/sample-source.mp4`
   - Or serve a file from elsewhere that’s publicly reachable.

2. In the frontend, set `Video URL` to your file, adjust start/duration, hit **Render on Backend**.

3. Watch **Status** flip to `completed`, then click the **Download / View MP4** link. The **Preview** below should match the final output because both use the **same props** and **same component**.

---

# 5) Notes & next steps

- **No DB yet**: the backend stores job state in memory for MVP. If you restart, jobs are lost. Swap to SQLite or Supabase easily later.
- **Security**: wide-open CORS & no auth for MVP—lock down later.
- **Performance**: single-process renderer for now. You can add a small queue or child process if needed.
- **YouTube ingestion**: for MVP you’re passing a `videoUrl`. When you’re ready, add a step to download the YouTube video to `out/` (or S3) and feed that path/URL to the plan.
- **Captions**: we’re rendering one line at a time; you can style/animate as you like.
- **Exact parity**: if visuals change, copy the updated `Clip.tsx` to both BE and FE to keep them in sync (or later move to a shared package).

If you want, I can bundle this into a single tarball with all files pre-wired (Express + Vite) and a small sample video placeholder so you can run it immediately.
