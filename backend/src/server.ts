import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { renderClipToFile } from "./render.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

type ClipRow = {
  id: string;
  status: "queued" | "rendering" | "completed" | "failed";
  filePath?: string;
  url?: string;
  error?: string;
  plan: any;
};
const clips = new Map<string, ClipRow>();

const OUT_DIR = path.join(dirname(__dirname), "out");
fs.mkdirSync(OUT_DIR, { recursive: true });
app.use("/media", express.static(OUT_DIR));

const PUBLIC_DIR = path.join(dirname(__dirname), "public");
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
app.use("/public", express.static(PUBLIC_DIR));

app.post("/api/render", async (req, res) => {
  try {
    const plan = req.body;
    const id = crypto.randomUUID();
    const outPath = path.join(OUT_DIR, `${id}.mp4`);
    const row: ClipRow = { id, status: "queued", plan };
    clips.set(id, row);

    (async () => {
      try {
        row.status = "rendering";
        await renderClipToFile(plan, outPath);
        row.status = "completed";
        row.filePath = outPath;
        row.url = `/media/${id}.mp4`;
      } catch (e: any) {
        row.status = "failed";
        row.error = String(e?.message || e);
        console.error("Render error:", e);
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
  console.log(`Public files served at http://localhost:${PORT}/public/...`);
});