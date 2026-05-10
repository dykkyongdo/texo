import { fal } from "@fal-ai/client";
import fs from "fs";
import path from "path";
import "dotenv/config";

fal.config({ credentials: process.env.FAL_KEY });

const PROMPTS = [
  "oversized streetwear hoodie, washed black, small chest logo",
  "techwear jacket, all black, multiple pockets, asymmetric zip",
  "y2k baby tee, pink, vintage graphic across chest",
  "cargo pants, olive green, utility pockets, relaxed fit",
  "varsity jacket, cream and navy, chenille letter patch on chest",
];

const ANGLES = [
  { name: "front", suffix: "front view, full garment, centered" },
  { name: "back",  suffix: "back view, full garment, centered" },
  { name: "side",  suffix: "side view (left profile), full garment, centered" },
  { name: "three_quarter", suffix: "3/4 view from front-right, full garment, centered" },
];

const BASE_SUFFIX = "plain white background, studio photography, ghost mannequin, high detail, e-commerce product shot";

async function generate(prompt, outPath) {
  const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
    input: {
      prompt,
      image_size: "square_hd",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
    },
  });

  const url = result.data.images[0].url;
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  console.log(`saved ${outPath}`);
}

async function main() {
  const outDir = "output";
  fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < PROMPTS.length; i++) {
    const base = PROMPTS[i];
    const slug = `prompt_${i + 1}`;
    const promptDir = path.join(outDir, slug);
    fs.mkdirSync(promptDir, { recursive: true });
    fs.writeFileSync(path.join(promptDir, "prompt.txt"), base);

    // generate all 4 angles in parallel
    await Promise.all(
      ANGLES.map((angle) => {
        const fullPrompt = `${base}, ${angle.suffix}, ${BASE_SUFFIX}`;
        const outPath = path.join(promptDir, `${angle.name}.png`);
        return generate(fullPrompt, outPath);
      })
    );
    console.log(`done with ${slug}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});