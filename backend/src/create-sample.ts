import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createSampleVideo() {
  console.log("Creating sample video...");
  
  const plan = {
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    startMs: 0,
    durationMs: 30000,
    captions: [
      { text: "Sample Video", startMs: 0, endMs: 5000 },
      { text: "This is a test", startMs: 5000, endMs: 10000 },
      { text: "Remotion MVP", startMs: 10000, endMs: 15000 },
    ],
    fps: 30,
    width: 1080,
    height: 1920,
  };

  const entry = path.join(__dirname, "remotion", "index.ts");
  const outPath = path.join(dirname(__dirname), "public", "sample-source.mp4");
  
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

  console.log("Sample video created at:", outPath);
}

createSampleVideo().catch(console.error);