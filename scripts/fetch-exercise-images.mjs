#!/usr/bin/env node
// Fetches images for seeded movements from the wger.de open exercise database.
// Saves to public/exercises/{slug}.{ext} and prints a coverage report.
// Usage: node scripts/fetch-exercise-images.mjs

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "public", "exercises");

const SEED_MOVEMENTS = [
  "Wall Push-Ups", "Incline Push-Ups", "Knee Push-Ups", "Push-Ups",
  "Diamond Push-Ups", "Archer Push-Ups", "Pseudo Planche Push-Ups",
  "One Arm Push-Ups", "Dead Hang", "Active Hang", "Scapular Pulls",
  "Negative Pull-Ups", "Band-Assisted Pull-Ups", "Pull-Ups", "L-Sit Pull-Ups",
  "Archer Pull-Ups", "Parallel Bar Support Hold", "Negative Dips",
  "Band-Assisted Dips", "Dips", "Ring Dips", "Weighted Dips",
  "Wall Handstand Hold", "Pike Push-Ups", "Elevated Pike Push-Ups",
  "Wall Handstand Push-Ups", "Freestanding Handstand Push-Ups",
  "Tucked L-Sit", "One Leg L-Sit", "L-Sit", "Assisted Squats",
  "Bodyweight Squats", "Bulgarian Split Squats", "Shrimp Squats",
  "Pistol Squats", "Knee Raises", "Leg Raises", "Toes to Bar",
  "Windshield Wipers", "Plank", "Side Plank", "Hollow Body Hold",
  "Superman Hold", "Jumping Jacks", "Burpees", "Mountain Climbers",
  "Box Jumps", "Inverted Rows", "Tuck Planche", "Advanced Tuck Planche",
  "Straddle Planche", "Full Planche", "Planche Leans", "Planche Lean Hold",
  "Pseudo Push-Up Hold", "Knee Archer Push-Ups", "Slow Motion Push-Ups",
  "Skin the Cat", "Back Lever", "Front Lever Tuck Hold", "Front Lever",
  "Muscle-Up", "Wrist Mobility Routine", "L-Sit Hang on Parallettes",
  "Seated Single Leg Raise", "Pike Compression", "Arch Body Hold",
  "Chin-Up Hold", "Hip Flexor Stretch", "Seated Forward Fold",
  "Band Pull-Aparts", "Chest & Shoulder Stretch",
  "Calf Raises", "Single-Leg Glute Bridge", "Nordic Hamstring Curl",
];

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[-–_/&,.()]/g, " ")
    .replace(/\bpush[\s-]?up(s)?\b/g, "pushup$1")
    .replace(/\bpull[\s-]?up(s)?\b/g, "pullup$1")
    .replace(/\bchin[\s-]?up(s)?\b/g, "chinup$1")
    .replace(/\bsit[\s-]?up(s)?\b/g, "situp$1")
    .replace(/\bl[\s-]?sit\b/g, "lsit")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchAllExercises() {
  const all = [];
  let url = "https://wger.de/api/v2/exerciseinfo/?language=2&limit=100";
  while (url) {
    process.stdout.write(`  fetching ${url.split("?")[1]}...\r`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`wger ${res.status}: ${url}`);
    const data = await res.json();
    all.push(...data.results);
    url = data.next;
  }
  process.stdout.write(`  fetched ${all.length} exercises${" ".repeat(40)}\n`);
  return all;
}

function buildIndex(exercises) {
  const index = new Map(); // normalized name → exercise
  for (const ex of exercises) {
    for (const t of ex.translations || []) {
      if (t.language !== 2) continue;
      if (t.name) {
        const key = normalize(t.name);
        if (!index.has(key) || (ex.images?.length && !index.get(key).images?.length)) {
          index.set(key, ex);
        }
      }
      for (const a of t.aliases || []) {
        const key = normalize(a.alias);
        if (!index.has(key) || (ex.images?.length && !index.get(key).images?.length)) {
          index.set(key, ex);
        }
      }
    }
  }
  return index;
}

function findMatch(name, index) {
  const target = normalize(name);
  // 1. exact
  if (index.has(target)) return { exercise: index.get(target), how: "exact" };
  // 2. contains either direction
  let best = null;
  let bestScore = 0;
  for (const [key, ex] of index) {
    if (key === target) continue;
    let score = 0;
    if (key.includes(target)) score = target.length / key.length;
    else if (target.includes(key)) score = (key.length / target.length) * 0.9;
    else {
      // token overlap
      const a = new Set(target.split(" "));
      const b = new Set(key.split(" "));
      const overlap = [...a].filter((t) => b.has(t)).length;
      score = overlap / Math.max(a.size, b.size) * 0.7;
    }
    // prefer exercises with images
    if (ex.images?.length) score *= 1.2;
    if (score > bestScore) {
      bestScore = score;
      best = { exercise: ex, how: `fuzzy(${score.toFixed(2)})`, matchedKey: key };
    }
  }
  return bestScore >= 0.5 ? best : null;
}

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(dirname(destPath), { recursive: true });
  await writeFile(destPath, buf);
  return buf.length;
}

async function main() {
  console.log("Fetching wger exercise database...");
  const exercises = await fetchAllExercises();
  const index = buildIndex(exercises);
  console.log(`Built index of ${index.size} unique names/aliases\n`);

  const results = { matched: [], noImage: [], unmatched: [] };

  for (const name of SEED_MOVEMENTS) {
    const match = findMatch(name, index);
    if (!match) {
      results.unmatched.push(name);
      continue;
    }
    const img = (match.exercise.images || []).find((i) => i.is_main) ||
                (match.exercise.images || [])[0];
    if (!img) {
      results.noImage.push({ name, matchedAs: match.matchedKey || "?", how: match.how });
      continue;
    }
    const ext = extname(new URL(img.image).pathname).toLowerCase() || ".jpg";
    const destPath = join(OUT_DIR, `${slug(name)}${ext}`);
    if (existsSync(destPath)) {
      results.matched.push({ name, file: `${slug(name)}${ext}`, how: match.how, cached: true });
      continue;
    }
    try {
      const bytes = await download(img.image, destPath);
      results.matched.push({
        name,
        file: `${slug(name)}${ext}`,
        how: match.how,
        matchedAs: match.matchedKey,
        bytes,
      });
      process.stdout.write(`  ✓ ${name} → ${slug(name)}${ext}\n`);
    } catch (e) {
      results.unmatched.push(`${name} (download failed: ${e.message})`);
    }
  }

  console.log("\n=== COVERAGE REPORT ===");
  console.log(`Total seeded movements: ${SEED_MOVEMENTS.length}`);
  console.log(`Matched with image:     ${results.matched.length}`);
  console.log(`Matched no image:       ${results.noImage.length}`);
  console.log(`Unmatched:              ${results.unmatched.length}`);
  console.log(`Match rate:             ${((results.matched.length / SEED_MOVEMENTS.length) * 100).toFixed(0)}%`);

  if (results.noImage.length) {
    console.log("\n--- Matched but no image ---");
    for (const r of results.noImage) {
      console.log(`  ${r.name}  ←  ${r.matchedAs} (${r.how})`);
    }
  }
  if (results.unmatched.length) {
    console.log("\n--- Not matched at all ---");
    for (const n of results.unmatched) console.log(`  ${n}`);
  }
  console.log("\n--- Fuzzy matches (verify these!) ---");
  for (const r of results.matched.filter((r) => r.how && r.how.startsWith("fuzzy"))) {
    console.log(`  ${r.name}  ←  ${r.matchedAs} (${r.how})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
