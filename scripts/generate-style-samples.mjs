#!/usr/bin/env node
// Generates a small set of exercise images in multiple candidate styles
// so we can pick one before committing to the full ~72-image batch.
//
// Usage: node scripts/generate-style-samples.mjs
// Output: public/exercises/_styles/{styleId}/{exerciseSlug}.png

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "public", "exercises", "_styles");

const envContents = await readFile(join(REPO_ROOT, ".env"), "utf8");
const OPENAI_API_KEY = envContents.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing from .env");

// 5 exercises spanning the difficulty / movement-type spectrum
const TEST_EXERCISES = [
  {
    slug: "push-ups",
    description:
      "a person performing a standard push-up at the bottom position, body straight from head to heels, elbows bent ~90 degrees, hands flat on floor shoulder-width apart, side profile view",
  },
  {
    slug: "dips",
    description:
      "a person performing parallel bar dips at the bottom position, body upright between two parallel bars, elbows bent, legs hanging straight, side profile view",
  },
  {
    slug: "tuck-planche",
    description:
      "a person performing a tuck planche hold on the floor, hands flat on floor, body lifted off ground with knees tucked to chest, arms locked straight, body horizontal in the air, side profile view",
  },
  {
    slug: "dead-hang",
    description:
      "a person performing a dead hang from a horizontal pull-up bar, body relaxed, arms straight overhead gripping the bar, legs hanging straight, front view",
  },
  {
    slug: "hip-flexor-stretch",
    description:
      "a person performing a kneeling hip flexor stretch, one knee on floor, other foot forward in lunge position, torso upright, arms relaxed, side profile view",
  },
];

const STYLES = {
  "a-lineart": {
    label: "A · White line art on dark",
    prompt: (desc) =>
      `Clean white line drawing on solid dark navy background (#0a0a14). Subject: ${desc}. Minimal flat line art style, no shading or fill, only thin clean white outlines (1.5px equivalent stroke weight). Single athletic male figure shown clearly. Anatomically accurate calisthenics/gymnastics pose. Centered composition with generous margin. No text, no labels, no equipment beyond what the exercise requires.`,
  },
  "b-silhouette": {
    label: "B · Solid silhouette pictogram",
    prompt: (desc) =>
      `Solid white silhouette pictogram on dark navy background (#0a0a14). Subject: ${desc}. Minimal app-icon style, single flat white shape with no internal detail (like an iOS workout app icon). Anatomically accurate calisthenics pose, clean geometry. Centered composition with generous margin. No text, no labels.`,
  },
  "c-lowpoly": {
    label: "C · Soft 3D low-poly figure",
    prompt: (desc) =>
      `Stylized low-poly 3D character on dark navy background (#0a0a14). Subject: ${desc}. Modern fitness app illustration style. Athletic build, soft muted greys with subtle cyan/teal rim light. Clean faceted geometry, no facial features. Anatomically accurate calisthenics pose. Centered composition. No text, no labels.`,
  },
};

async function generateImage(prompt) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "medium",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("no b64_json in response");
  return Buffer.from(b64, "base64");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const tasks = [];
  for (const [styleId, style] of Object.entries(STYLES)) {
    for (const ex of TEST_EXERCISES) {
      tasks.push({ styleId, style, ex });
    }
  }
  console.log(`Generating ${tasks.length} images (${Object.keys(STYLES).length} styles × ${TEST_EXERCISES.length} exercises)...\n`);

  let done = 0;
  await Promise.all(
    tasks.map(async ({ styleId, style, ex }) => {
      const destDir = join(OUT_DIR, styleId);
      const destPath = join(destDir, `${ex.slug}.png`);
      try {
        const buf = await generateImage(style.prompt(ex.description));
        await mkdir(destDir, { recursive: true });
        await writeFile(destPath, buf);
        done++;
        console.log(`  ✓ [${done}/${tasks.length}] ${styleId} / ${ex.slug} (${(buf.length / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.error(`  ✗ ${styleId} / ${ex.slug}: ${e.message}`);
      }
    }),
  );

  console.log("\nDone. Open public/exercises/_styles/ to compare.");
  for (const [id, style] of Object.entries(STYLES)) {
    console.log(`  ${id}: ${style.label}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
