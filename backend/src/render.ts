import path from "path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function renderClipToFile(plan: any, outPath: string) {
  const entry = path.join(__dirname, "remotion", "index.ts");
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