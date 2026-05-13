#!/usr/bin/env node
// Generates a line-art illustration for every seeded exercise using
// OpenAI gpt-image-1, saving to public/exercises/{slug}.png.
//
// Idempotent: skips slugs that already have a file (delete to regenerate).
// Concurrency-limited so we don't slam the API.
//
// Usage:
//   node scripts/generate-exercise-images.mjs              # all missing
//   node scripts/generate-exercise-images.mjs push-ups dips # only listed

import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { EXERCISES } from "./exercise-descriptions.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "public", "exercises");
const CONCURRENCY = 4;

const envContents = await readFile(join(REPO_ROOT, ".env"), "utf8");
const OPENAI_API_KEY = envContents.match(/OPENAI_API_KEY=(.+)/)?.[1]?.trim();
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY missing from .env");

const STYLE_PROMPT = (pose) =>
  `Clean white line drawing on solid dark navy background (color #0a0a14). Subject: an athletic adult male figure ${pose}. The figure must be shirtless and wearing plain dark short workout shorts, with short hair and no facial features visible. Minimal flat line art illustration style, only thin clean white outlines (~2px stroke), no shading, no fills, no color anywhere other than white lines on the navy background. Anatomically accurate calisthenics pose, body proportions correct. Centered composition with generous margin around the figure. No text, no labels, no background scenery or props beyond what the exercise explicitly requires (bar, parallettes, bench, band, etc.).`;

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
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 400)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error("no b64_json in response");
  return Buffer.from(b64, "base64");
}

async function processOne(ex) {
  const destPath = join(OUT_DIR, `${ex.slug}.png`);
  if (existsSync(destPath)) {
    return { slug: ex.slug, status: "skipped" };
  }
  try {
    const buf = await generateImage(STYLE_PROMPT(ex.pose));
    await writeFile(destPath, buf);
    return { slug: ex.slug, status: "ok", bytes: buf.length };
  } catch (e) {
    return { slug: ex.slug, status: "error", error: e.message };
  }
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      const r = await worker(items[i], i);
      results[i] = r;
      const ok = r.status === "ok" ? "✓" : r.status === "skipped" ? "·" : "✗";
      const detail =
        r.status === "ok"
          ? `${(r.bytes / 1024).toFixed(0)} KB`
          : r.status === "skipped"
          ? "already exists"
          : r.error;
      console.log(`  ${ok} [${i + 1}/${items.length}] ${r.slug}  (${detail})`);
    }
  });
  await Promise.all(workers);
  return results;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const filter = process.argv.slice(2);
  const items = filter.length
    ? EXERCISES.filter((e) => filter.includes(e.slug))
    : EXERCISES;

  if (filter.length && items.length !== filter.length) {
    const missing = filter.filter((s) => !EXERCISES.find((e) => e.slug === s));
    console.warn(`unknown slugs: ${missing.join(", ")}`);
  }

  console.log(`Generating images for ${items.length} exercises (concurrency=${CONCURRENCY})...\n`);
  const start = Date.now();
  const results = await runPool(items, processOne, CONCURRENCY);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error");

  console.log(`\nDone in ${elapsed}s — ok: ${ok}, skipped: ${skipped}, errors: ${errors.length}`);
  if (errors.length) {
    console.log("\nErrors:");
    for (const e of errors) console.log(`  ${e.slug}: ${e.error}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
