import type { SeedMovement } from "./types";

export const SEED_MOVEMENTS: SeedMovement[] = [
  // ── Push-up progression ──────────────────────────────────────────────────
  {
    name: "Wall Push-Ups",
    description: "Push-ups performed against a wall, great for beginners.",
    family: "push",
  },
  {
    name: "Incline Push-Ups",
    description: "Push-ups with hands on an elevated surface.",
    family: "push",
  },
  {
    name: "Knee Push-Ups",
    description: "Push-ups from the knees instead of toes.",
    family: "push",
  },
  { name: "Push-Ups", description: "Standard push-ups from the toes.", family: "push" },
  {
    name: "Diamond Push-Ups",
    description: "Push-ups with hands close together forming a diamond shape.",
    coachingCues: "Tricep accessory — controlled pace.",
    family: "push",
  },
  {
    name: "Archer Push-Ups",
    description: "Wide push-ups shifting weight to one arm.",
    family: "push",
    prepTags: ["heavy-push"],
  },
  {
    name: "Wide Push-Ups",
    description: "Push-ups with hands placed wider than shoulders for pec emphasis.",
    coachingCues:
      "Hands ~1.5x shoulder width. Elbows out at ~60°, lower until chest is 2-3 inches off floor. Maintain plank line — no hip sag.",
    family: "push",
  },
  {
    name: "Incline Pseudo Planche Push-Ups",
    description:
      "Pseudo planche push-ups performed with hands elevated on a chair, bench, or paralettes to reduce shoulder load.",
    coachingCues:
      "Same form as floor PPU — hands turned back, near hips, body leaned forward. The elevation reduces percentage of bodyweight on the arms. Lower the surface over time to progress toward floor PPU.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Pseudo Planche Push-Ups",
    description: "Push-ups with hands turned back near the waist.",
    coachingCues:
      "Only do this if your planche lean felt solid today. 3 sec descent, full reset between reps. Skip on bad days.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "One Arm Push-Ups",
    description: "Push-ups performed with a single arm.",
    family: "push",
    prepTags: ["heavy-push"],
  },

  // ── Pull-up / hanging progression ────────────────────────────────────────
  {
    name: "Dead Hang",
    description: "Passive hang from a bar to build grip strength.",
    coachingCues: "Grip and shoulder health. Relax then re-engage.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Active Hang",
    description: "Hang from a bar with scapulae depressed and retracted.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Scapular Pulls",
    description:
      "Hang from the bar and pull shoulder blades down and together.",
    coachingCues:
      "Dead hang → depress scapulae to lift body slightly. Arms stay straight. Tempo: 2s pull-down, 2s lower. Slow is the work.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Negative Pull-Ups",
    description: "Jump to the top and slowly lower yourself.",
    coachingCues: "6–8 sec descent. Full dead hang reset between reps.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Band-Assisted Pull-Ups",
    description: "Pull-ups with a resistance band for assistance.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Pull-Ups",
    description: "Standard pull-ups with palms facing away.",
    coachingCues:
      "Heavy day (Pull A): pronated grip, 5×2 straight sets, full rest, clean & explosive concentric. Volume day (Pull B): supinated / chin-up grip, 3×3 cluster (2+1 or 2+2+2 with 20s inside), controlled. Grip variation distributes load on the medial vs lateral epicondyle.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "L-Sit Pull-Ups",
    description: "Pull-ups while holding an L-sit position.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Archer Pull-Ups",
    description: "Wide-grip pull-ups shifting weight to one arm.",
    family: "pull",
    prepTags: ["grip"],
  },

  // ── Dip progression ──────────────────────────────────────────────────────
  {
    name: "Parallel Bar Support Hold",
    description: "Hold yourself up on parallel bars with arms locked.",
    family: "push",
  },
  { name: "Negative Dips", description: "Lower yourself slowly on dip bars.", family: "push" },
  {
    name: "Band-Assisted Dips",
    description: "Dips with a resistance band for assistance.",
    family: "push",
  },
  {
    name: "Dips",
    description: "Standard parallel bar dips.",
    coachingCues: "3 sec negative on the way down.",
    family: "push",
  },
  {
    name: "Ring Dips",
    description: "Dips performed on gymnastic rings.",
    family: "push",
    prepTags: ["heavy-push"],
  },
  {
    name: "Weighted Dips",
    description: "Dips with additional weight attached.",
    family: "push",
    prepTags: ["heavy-push"],
  },

  // ── Handstand progression ─────────────────────────────────────────────────
  {
    name: "Wall Handstand Hold",
    description: "Hold a handstand position against a wall.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Pike Push-Ups",
    description: "Push-ups in a pike position to target shoulders.",
    coachingCues: "Hips high, head between arms at the bottom.",
    family: "push",
    prepTags: ["overhead"],
  },
  {
    name: "Elevated Pike Push-Ups",
    description: "Pike push-ups with feet on an elevated surface.",
    family: "push",
    prepTags: ["overhead"],
  },
  {
    name: "Wall Handstand Push-Ups",
    description: "Handstand push-ups against a wall.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead", "heavy-push"],
  },
  {
    name: "Deficit Wall Handstand Push-Ups",
    description:
      "Wall handstand push-ups with hands elevated on blocks or paralettes, deeper range of motion.",
    coachingCues:
      "Hands on raised surface (3-6 inches initially), lower head below hand level. Increase deficit gradually. Trains end-range strength needed for freestanding HSPU.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead", "heavy-push"],
  },
  {
    name: "Freestanding Handstand Hold",
    description:
      "Hold a freestanding handstand without wall support — pre-requisite for freestanding HSPU.",
    coachingCues:
      "Balance is the limiter, not strength. Build toward 30s+ before attempting freestanding HSPU. Fingertip pressure adjustments steer balance.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Freestanding Handstand Push-Ups",
    description: "Handstand push-ups without wall support.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead", "heavy-push"],
  },

  // ── L-sit progression ─────────────────────────────────────────────────────
  {
    name: "Tucked L-Sit",
    description: "L-sit with knees tucked on the floor or parallettes.",
    family: "core",
  },
  { name: "One Leg L-Sit", description: "L-sit with one leg extended.", family: "core" },
  { name: "L-Sit", description: "Full L-sit hold with both legs extended.", family: "core" },

  // ── Leg / lower-body progression ──────────────────────────────────────────
  {
    name: "Assisted Squats",
    description: "Squats while holding onto a support.",
    family: "legs",
  },
  {
    name: "Bodyweight Squats",
    description: "Standard squats with no added weight.",
    family: "legs",
  },
  {
    name: "Bulgarian Split Squats",
    description: "Single-leg squat with rear foot elevated.",
    family: "legs",
  },
  {
    name: "Shrimp Squats",
    description: "Single-leg squat holding the back foot.",
    family: "legs",
  },
  {
    name: "Pistol Squats",
    description: "Full single-leg squat with the other leg extended.",
    family: "legs",
  },

  // ── Hanging core ──────────────────────────────────────────────────────────
  {
    name: "Knee Raises",
    description: "Hang from a bar and raise knees to chest.",
    family: "core",
    prepTags: ["grip"],
  },
  {
    name: "Leg Raises",
    description: "Hang from a bar and raise straight legs.",
    coachingCues:
      "Controlled. No swinging. Tuck version is OK if straight legs are too hard.",
    family: "core",
    prepTags: ["grip"],
  },
  {
    name: "Toes to Bar",
    description: "Hang from a bar and bring toes to touch the bar.",
    family: "core",
    prepTags: ["grip"],
  },
  {
    name: "Windshield Wipers",
    description: "Hang and rotate extended legs side to side.",
    family: "core",
    prepTags: ["grip"],
  },

  // ── Floor core / isometrics ───────────────────────────────────────────────
  { name: "Plank", description: "Standard forearm plank hold.", family: "core" },
  { name: "Side Plank", description: "Plank on one forearm, body sideways.", family: "core" },
  {
    name: "Hollow Body Hold",
    description: "Lie on back with arms and legs extended off the ground.",
    coachingCues:
      "Lower back pressed to floor, arms overhead. Foundation for planche.",
    family: "core",
  },
  {
    name: "Superman Hold",
    description: "Lie face down and lift arms and legs off the ground.",
    family: "core",
  },

  // ── Cardio / full-body ────────────────────────────────────────────────────
  { name: "Jumping Jacks", description: "Classic cardio warm-up exercise.", family: "legs" },
  {
    name: "Burpees",
    description: "Full body exercise combining squat, plank, and jump.",
    family: "legs",
  },
  {
    name: "Mountain Climbers",
    description: "Plank position alternating knee drives.",
    family: "core",
  },
  { name: "Box Jumps", description: "Jump onto an elevated surface.", family: "legs" },

  // ── Horizontal pull ───────────────────────────────────────────────────────
  {
    name: "Inverted Rows",
    previousNames: ["Australian Pull-Ups"],
    description: "Horizontal body row under a low bar.",
    coachingCues:
      "Bar at hip height, heels on floor, body straight. Lower bar = harder. Squeeze shoulder blades at top. Heavy day (Pull A) = pronated. Volume day (Pull B) = supinated grip for biceps + elbow-load variation.",
    family: "pull",
    prepTags: ["grip"],
  },

  // ── Planche progression ───────────────────────────────────────────────────
  // All planche/hand-balancing exercises are wrist-loaded by definition.
  {
    name: "Frog Stand",
    description:
      "Crow pose: bent-arm balance with knees resting on triceps near the elbows.",
    coachingCues:
      "Hands shoulder-width, fingers spread and gripping floor. Knees press into triceps near the elbows (not upper arm). Shift weight forward until feet float. Look slightly forward, not straight down. Wrist warm-up first — non-negotiable.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Tuck Planche Negatives",
    description:
      "Kick or push up to a brief tuck planche position, then lower with control.",
    coachingCues:
      "From frog stand or floor, transition to tuck planche briefly. Hold what you can (even 1s). Lower under control — the eccentric is the work. 3-5 reps.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Tuck Planche",
    description: "Planche position with knees tucked to chest.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Advanced Tuck Planche",
    description: "Planche with hips higher and knees slightly extended.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Straddle Planche",
    description: "Planche with legs spread apart.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Full Planche",
    description: "Horizontal hold with body fully extended.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Planche Leans",
    description:
      "Lean forward in a planche position on the floor, shifting weight onto hands.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Planche Lean Hold",
    description: "Hold the forward-leaning planche position isometrically.",
    coachingCues:
      "Hands rotated out, arms straight, lean forward, protract scapulae.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Pseudo Push-Up Hold",
    description: "Hold the bottom or top position of a pseudo planche push-up.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Knee Archer Push-Ups",
    description:
      "Archer push-ups performed from the knees, shifting weight to one arm per rep.",
    family: "push",
  },
  {
    name: "Slow Motion Push-Ups",
    description:
      "Push-ups performed at an extremely slow tempo for time under tension.",
    coachingCues:
      "Target ~30s per rep: 20-25s descent (slowest in the bottom third where you're weakest), 1-2s pause at the bottom, 5-10s push. Hold the plank line — if hips sag, cut the descent short rather than break form.",
    family: "push",
  },

  // ── Lever / skill progression ─────────────────────────────────────────────
  {
    name: "Skin the Cat",
    description: "Hang and rotate body through arms on rings or bar.",
    family: "pull",
    prepTags: ["scap-pull", "grip"],
  },
  {
    name: "Back Lever",
    description: "Hang inverted with body horizontal behind the bar.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Front Lever Tuck Hold",
    description: "Inverted horizontal hold with knees tucked.",
    coachingCues:
      "Hang from bar/rings, pull shoulder blades down and back, lift knees to chest, lean back until body is parallel to floor. Knees stay tight to chest. Dosing: strength day (Pull A) ~80% of best hold, volume day (Pull B) ~60–70% of best — never max out unless on Test Day.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Advanced Tuck Front Lever",
    description:
      "Front lever tuck hold with knees moved slightly forward of the chest (less compact, more leverage).",
    coachingCues:
      "From tuck hold, push knees forward of the chest 3-6 inches. Hips stay open at ~90° (don't extend yet). Same horizontal body line.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Straddle Front Lever",
    description:
      "Front lever with legs extended out wide to the sides for reduced lever arm.",
    coachingCues:
      "From advanced tuck, extend legs out into a wide straddle. The wider the straddle, the easier. Hips fully open, body parallel to floor.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "One-Leg Front Lever",
    description:
      "Front lever with one leg extended and the other tucked, an asymmetric bridge to full lever.",
    coachingCues:
      "From straddle, bring one leg in to a tuck while the other extends. Train both sides equally. The extended leg is the load-bearing variable.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Front Lever",
    description: "Horizontal hold facing up with body fully extended.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Muscle-Up",
    description: "Pull-up transitioning above the bar into a dip.",
    // Dominant demand is the pull phase; the push phase above the bar is secondary.
    family: "pull",
    prepTags: ["grip", "heavy-push"],
  },

  // ── Warm-up pre-block movements (generated by warmup-engine) ────────────
  // These are used exclusively by the auto-generated warm-up pre-block.
  // No progressions or workouts reference them directly; they appear only
  // when warmupEnabled=true on the SessionPreviewScreen.
  {
    name: "Wrist Rocks",
    description: "Gentle rocking weight-shifts onto the palms to warm up wrist extensors.",
    coachingCues:
      "On all fours, rock forward onto fingers then press fully onto open palms. Keep elbows soft. 10 slow reps — stop at any sharp pain.",
    family: "push",
  },
  {
    name: "Wrist Push-Up Lean",
    description: "Loaded wrist extension hold — hands on floor, lean weight onto fingertips/palms to prepare wrists for pressing.",
    coachingCues:
      "Hands flat on floor, fingers pointing forward. Slowly shift bodyweight forward over the hands until you feel light stretch across the wrists. Hold 2–3s, release. 8 reps.",
    family: "push",
  },
  {
    name: "Band Dislocates",
    description: "Overhead shoulder mobility drill using a band or stick: arms rotate from front to behind-body.",
    coachingCues:
      "Hold a band (or broomstick) wider than shoulder width. Keeping arms straight, rotate overhead and behind until the band touches your lower back, then return. Widen the grip if you feel pinching. 10 slow reps.",
    family: "push",
  },
  {
    name: "Deep Squat Hold",
    description: "Passive squat hold at end-range for ankle, hip, and thoracic mobility.",
    coachingCues:
      "Feet shoulder-width, toes ~30° out. Squat to the bottom, heels flat on the floor (use a small wedge if needed). Elbows inside the knees, chest up. Breathe and relax deeper each exhale. 30s.",
    family: "legs",
  },
  {
    name: "Leg Swings",
    description: "Dynamic hip-flexor and adductor warm-up — forward/back and side-to-side leg swings.",
    coachingCues:
      "Hold a wall or bar for balance. Swing one leg forward and back with control, gradually increasing range. Then swing side to side. 10 reps per direction per side.",
    family: "legs",
  },

  // ── Dedicated warm-up / mobility drills ──────────────────────────────────
  // These exist ONLY to be assembled into the execution-time warm-up block by
  // src/lib/warmup-engine.ts. They are intentionally NOT used as training
  // movements in any workout, so the warm-up never duplicates the session.
  {
    name: "Arm Circles",
    description: "Shoulder warm-up — controlled forward and backward arm circles.",
    coachingCues:
      "Stand tall, arms out to the sides. Make small circles growing to large, forward then backward. ~10 each direction.",
    family: "push",
  },
  {
    name: "Scapular Shrugs",
    description: "Scapular elevation/depression to wake up the traps before pulling.",
    coachingCues:
      "Standing or in a light hang, shrug the shoulders up toward the ears then pull them down — movement comes from the shoulder blades, arms stay straight.",
    family: "pull",
  },
  {
    name: "Wrist Circles",
    description: "Wrist mobility — slow circles in both directions to prep for loading.",
    coachingCues:
      "Interlace fingers or extend hands; rotate the wrists through their full range, ~10 circles each way. Add gentle finger extensions.",
    family: "push",
  },
  {
    name: "Hip Circles",
    description: "Hip-mobility warm-up — circle the knee to open the hip joint.",
    coachingCues:
      "Standing on one leg (hold support), lift the other knee and draw big circles with it, opening the hip. ~10 each direction per side.",
    family: "legs",
  },
  {
    name: "Ankle Rocks",
    description: "Ankle dorsiflexion mobility to prep deep squatting.",
    coachingCues:
      "In a half-kneel or standing lunge, drive the knee forward over the toes keeping the heel down, then rock back. ~10 per side.",
    family: "legs",
  },
  {
    name: "Cat-Cow",
    description: "Spinal mobility — alternate flexion and extension of the spine.",
    coachingCues:
      "On all fours, round the back toward the ceiling (cat), then drop the belly and lift the chest (cow). Move slowly with the breath, ~10 cycles.",
    family: "core",
  },
  {
    name: "Bird Dog",
    description: "Light core-and-hip activation with anti-rotation demand.",
    coachingCues:
      "On all fours, extend the opposite arm and leg until level with the torso, keep hips square, pause, return. Slow and controlled, ~8 per side.",
    family: "core",
  },

  // ── Warm-up / mobility / accessory ───────────────────────────────────────
  {
    name: "Wrist Mobility Routine",
    description: "Wrist warmup routine to prepare for push work.",
    coachingCues:
      "Circles, prayer stretch forward & back, compression on floor. Never skip this.",
    // This IS the wrist warm-up — no prepTags of its own.
    family: "push",
  },
  {
    name: "L-Sit Hang on Parallettes",
    description: "L-sit hold on parallettes with feet supported on the floor.",
    coachingCues:
      "Push bars down hard, shoulders away from ears. Straight arms!",
    // Parallette support puts the wrist in the same loaded extension as planche.
    family: "core",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Seated Single Leg Raise",
    description: "Seated single-leg raise on the floor for hip-flexor strength.",
    coachingCues:
      "Sit on floor, hands beside hips. Lift one leg at a time. Trains hip flexors for L-sit.",
    family: "core",
  },
  {
    name: "Pike Compression",
    description: "Seated pike compression stretch for hamstring flexibility.",
    coachingCues:
      "Legs straight in front. Pulse chest toward thighs (back stays straight). Go to your end range.",
    family: "legs",
  },
  {
    name: "Arch Body Hold",
    description: "Posterior chain isometric hold (replaces Superman).",
    coachingCues: "Face down, lift arms and legs off floor. Hold tension.",
    family: "core",
  },
  {
    name: "Chin-Up Hold",
    description: "Isometric chin-up hold at 90° elbow bend.",
    coachingCues:
      "Keep elbows at exactly 90°. Hold as long as possible (~15–20 sec).",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Hip Flexor Stretch",
    description: "Kneeling hip flexor stretch.",
    coachingCues: "Keep torso upright. Gentle hold, no bouncing.",
    family: "legs",
  },
  {
    name: "Seated Forward Fold",
    description: "Seated forward fold for hamstring and posterior-chain mobility.",
    coachingCues:
      "Straight legs, hinge at hip with a STRAIGHT back. Chest toward thighs.",
    family: "legs",
  },
  {
    name: "Band Pull-Aparts",
    description: "Resistance-band pull-apart for shoulder health.",
    coachingCues:
      "Hold band at shoulder width, pull apart out to sides. Keep this light — recovery, not training.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Chest & Shoulder Stretch",
    description: "Chest and shoulder mobility stretch.",
    coachingCues:
      "Doorframe stretch or behind-back clasp. Helps with dip and planche range.",
    family: "push",
  },

  // ── Posterior-chain / lower-body accessories ──────────────────────────────
  {
    name: "Calf Raises",
    description: "Standing calf raises for ankle and lower-leg strength.",
    coachingCues:
      "Full range — pause at the top, slow on the way down. Single-leg version is harder.",
    family: "legs",
  },
  {
    name: "Single-Leg Glute Bridge",
    description:
      "Single-leg hip bridge from the floor for glute and posterior-chain strength.",
    coachingCues:
      "Lie on back, one foot flat on floor, other leg straight. Drive hips up by squeezing the glute hard, then lower under control. Posterior chain = planche line support.",
    family: "legs",
    prepTags: ["hinge"],
  },
  {
    name: "Nordic Hamstring Curl",
    description:
      "Kneeling eccentric hamstring curl, body lowering forward under control.",
    coachingCues:
      "Anchor feet (couch, partner, band). Lower forward as slow as possible (5–8 sec). Catch with hands. Brutal but bulletproofs hamstrings.",
    family: "legs",
    prepTags: ["hinge"],
  },

  // ── v2 additions (workout-improvements.md) ────────────────────────────────
  {
    name: "Wall Slides",
    description:
      "Standing posterior-shoulder / scapular activation drill — arms slide up and down a wall maintaining contact with elbows and wrists.",
    coachingCues:
      "Back flat against wall, arms in goalpost position. Slide hands up keeping elbows and back of wrists touching the wall. Activates lower traps + posterior delts before forward-loaded push work.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Knuckle Push-Up Hold",
    description:
      "Isometric push-up hold supported on the knuckles (closed fists) rather than the palms.",
    coachingCues:
      "Hold the top of the push-up on knuckles. Wrists straight (forearm-to-hand line). Progressive wrist conditioning that doesn't extend the wrist under load. Build to 60s before adding floor PPP volume.",
    // Reduces wrist extension load; not in the planche/HS/hand-balancing class.
    family: "push",
  },
  {
    name: "Fingertip Push-Up Hold",
    description:
      "Isometric push-up hold supported on the fingertips.",
    coachingCues:
      "Hold the top of the push-up balanced on the fingertips. Fingers spread, knuckles slightly bent. Trains forearm flexors and grip — antagonist to the wrist-extension load planche puts on. Start 10–15s, build slowly.",
    family: "push",
    prepTags: ["grip"],
  },
  {
    name: "Scapular Push-Ups",
    description:
      "Plank-position isolation drill — protract and retract the scapulae without bending the elbows.",
    coachingCues:
      "Plank position, arms straight throughout. Drop the chest slightly (scapulae retract), then push the floor away (scapulae protract). Slow and deliberate — 2s up, 2s down. Directly trains serratus anterior for planche.",
    family: "push",
  },
  {
    name: "Banded Good Morning",
    description:
      "Standing hip hinge with a band looped under the feet and over the shoulders — bilateral hip-dominant strength.",
    coachingCues:
      "Band under both feet, looped behind neck. Slight knee bend, hinge at the hips with a flat back. Drive hips back, then squeeze glutes to stand. Bilateral hip-dom complement to single-leg work.",
    family: "legs",
    prepTags: ["hinge"],
  },
  {
    name: "Hip Thrust",
    description:
      "Bilateral hip thrust with shoulders on a bench, hips driven up. Add load via plate, dumbbell, or barbell on the hips.",
    coachingCues:
      "Shoulder blades on bench, feet flat shoulder-width, knees at ~90° at top. Drive through heels; squeeze glutes hard at the top. Posterior chain — directly supports planche line and front lever.",
    family: "legs",
    prepTags: ["hinge"],
  },
  {
    name: "Banded Biceps Curl",
    description:
      "Standing biceps curl using a resistance band anchored under the feet.",
    coachingCues:
      "Stand on band, elbows pinned to sides. Curl up, controlled descent. Direct elbow flexor work accelerates pull-up max for novices stuck under 8 reps.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Cable Biceps Curl",
    description:
      "Gym cable curl — biceps isolation with constant tension throughout the range.",
    coachingCues:
      "Standing or seated. Elbows pinned. Full ROM, controlled descent. Use when at the gym — constant cable tension is biceps-superior to free-weight curls.",
    family: "pull",
    prepTags: ["grip"],
  },

  // ── Chin-up family ────────────────────────────────────────────────────────
  // Supinated grip — bridges Inverted Rows → Pull-Ups in the Pull-Up
  // Progression. Biceps contribute more on supinated grip, so most lifters
  // hit a chin-up weeks before their first pronated pull-up.
  {
    name: "Negative Chin-Ups",
    description:
      "Eccentric-only chin-up: jump or step to the top, lower slowly under control.",
    coachingCues:
      "Supinated grip (palms toward you). Start at the top with chin over the bar, lower over 4–5 seconds. Full dead hang at the bottom, reset, then jump back up. The slow descent IS the load — don't drop the last inches.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Band-Assisted Chin-Ups",
    description:
      "Full-ROM chin-ups with a loop band around the bar, foot or knee in the band for assistance.",
    coachingCues:
      "Supinated grip. Use the thinnest band that lets you complete clean reps — too much assistance and you're not loading the pull. Drive elbows down and back, chin over bar at the top, full extension at the bottom. Tempo: 2–3s descent, controlled concentric.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Chin-Ups",
    description: "Pull-ups with palms facing you (supinated grip).",
    coachingCues:
      "Palms toward you, hands ~shoulder-width. Drive elbows straight down, squeeze biceps and lats. Chin over the bar at the top. Tempo: 2–3s descent, dead hang at the bottom between reps.",
    family: "pull",
    prepTags: ["grip"],
  },

  // ── Gym pulling equipment (Isa's program) ────────────────────────────────
  {
    name: "Lat Pulldown",
    description:
      "Cable lat pulldown — seated, pull a bar down to the chest. Loadable concentric pull strength.",
    coachingCues:
      "Supinated or neutral grip for chin-up training, pronated when training pull-up. Pin the shoulders down first (lower traps), then pull elbows to the ribs. Bar to upper chest, controlled return. App tracks reps only — track the stack weight yourself.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Assisted Pull-Up Machine",
    description:
      "Machine-assisted pull-up — kneel or stand on a counterweighted platform that subtracts from your bodyweight.",
    coachingCues:
      "Set the assist as light as you can while keeping form clean. Full extension at the bottom, chin over the bar at the top. Reduce assistance gradually over weeks — when you can do 3×6 with the minimum stack, you're ready for unassisted negatives or band-assist.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Dumbbell Row",
    description:
      "Single-arm bent-over row with a dumbbell, knee and hand on a bench.",
    coachingCues:
      "Flat back, free hand and knee on the bench. Neutral grip (palm facing the bench). Pull the dumbbell to the hip — elbow drives back, not flared out. Squeeze the lat at the top, lower under control. Let the curl train biceps; this trains lats.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Dumbbell Biceps Curl",
    description:
      "Standing biceps curl with dumbbells — free-weight elbow flexor work.",
    coachingCues:
      "Elbows pinned to sides, full ROM. Supinate (rotate palm up) on the way up. Controlled descent — the eccentric matters. Direct biceps work accelerates the first pull-up for novices.",
    family: "pull",
    prepTags: ["grip"],
  },

  // ── Rear-delt / external-rotation antagonist ──────────────────────────────
  {
    name: "Face Pull",
    description:
      "Rear-delt + external-rotation pull toward the forehead, elbows high. Done on a cable machine (rope at face height) OR a resistance band anchored at face height (door anchor, pull-up bar, fixed pole).",
    coachingCues:
      "Anchor at face height (or slightly above). Pull toward your forehead, elbows high and wide, hands ending at the ears — like drawing a bow split into a V around your face. Squeeze rear delts + lower traps at the end. Light load, slow tempo (2s pull, 2s return). If elbows drop, the load is too heavy — back off. App tracks reps only; mentally track stack weight or band thickness session-to-session.",
    family: "pull",
    prepTags: ["scap-pull"],
  },

  // ── Atlas spec additions — Push family ───────────────────────────────────
  {
    name: "Box Headstand Push-Up",
    description: "Feet elevated on a box, pike press to floor — loads overhead position.",
    coachingCues: "Vertical torso, controlled descent, elbows in.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Wall HSPU Eccentric",
    description: "Slow negative wall handstand push-up — 5–10 s descent.",
    coachingCues: "Lower over 5–10 s, controlled all the way to the floor.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Freestanding Headstand Push-Up",
    description: "Headstand push-up without wall — balance and press combined.",
    coachingCues: "Balance on head and hands, press to lockout. No wall.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Rings Wide Push-Up",
    description: "Push-up on gymnastic rings, wide grip.",
    coachingCues: "Stabilize rings, no shrug, rigid hollow body.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Rings Push-Up",
    description: "Standard push-up on gymnastic rings.",
    coachingCues: "Rings stacked under shoulders, control the wobble.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "RTO Push-Up",
    description: "Rings push-up with rings turned out at lockout.",
    coachingCues: "Turn rings out hard at the top, elbows locked.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "RTO Archer Push-Up",
    description: "RTO push-up with one arm extended straight — loads one side.",
    coachingCues: "Load one side, assisting arm stays straight, turn out at top.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "RTO 40° Lean PPPU",
    description: "RTO pseudo-planche push-up with 40° forward lean.",
    coachingCues: "Lean 40° forward, pause at top and bottom, RTO.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "RTO 60° Lean PPPU",
    description: "RTO pseudo-planche push-up with 60° forward lean — builds straddle planche.",
    coachingCues: "Lean 60° forward, protract hard, RTO throughout.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "RTO Maltese Push-Up",
    description: "RTO push-up toward maltese position — extreme protraction.",
    coachingCues: "Extreme protraction, hands wide, RTO.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Wall PPPU",
    description: "Pseudo-planche push-up with feet on a wall.",
    coachingCues: "Wall reduces effectiveness ~30% — still useful as volume load.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Rings Wall PPPU",
    description: "Wall pseudo-planche push-up performed on rings.",
    coachingCues: "Skip if rings can't mount near wall. RTO at top.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Wall Maltese Push-Up",
    description: "Wall PPPU with hands widened toward maltese position.",
    coachingCues: "Widen hands progressively.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Rings Wall Maltese Push-Up",
    description: "Rings wall maltese push-up — elite-only.",
    coachingCues: "Extreme protraction on rings. Elite gate.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Hands-Elevated One-Arm Push-Up",
    description: "One-arm push-up with hands raised on a surface to reduce load.",
    coachingCues: "Wide base, brace hard, lower elevation over time.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Straddle One-Arm Push-Up",
    description: "One-arm push-up with legs straddled wide.",
    coachingCues: "Counter-rotate hips to stay square. Wide leg base.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Rings Straddle One-Arm Push-Up",
    description: "One-arm push-up on rings with straddle leg position.",
    coachingCues: "Elite ring stability required. Straddle wide.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Rings Straight-Body One-Arm Push-Up",
    description: "Full one-arm push-up on rings, feet together.",
    coachingCues: "No hip twist. Add weight after owning bodyweight version.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "PB Jumping Dips",
    description: "Assisted dip on parallel bars — jump up to top, support, lower with control.",
    coachingCues: "Jump to support position, lower under control to armpits.",
    family: "push",
  },
  {
    name: "L-Sit Dip",
    description: "Parallel bar dip holding L-sit — legs parallel throughout.",
    coachingCues: "Legs ≥90° the entire set. Do not let them drop.",
    family: "push",
  },
  {
    name: "45° Forward-Lean Dip",
    description: "Parallel bar dip with 45° forward lean — chest low, shoulder dominant.",
    coachingCues: "Lean forward 45°, chest toward the bar.",
    family: "push",
    prepTags: ["heavy-push"],
  },
  {
    name: "One-Arm Dip (facing wall)",
    description: "Single-arm parallel bar dip facing a wall for balance.",
    coachingCues: "Face wall to prevent forward rotation. One arm only.",
    family: "push",
    prepTags: ["heavy-push"],
  },
  {
    name: "One-Arm Dip (parallel to wall)",
    description: "Single-arm dip parallel to a wall — elite pressing.",
    coachingCues: "Side-on to wall. Full ROM, controlled.",
    family: "push",
    prepTags: ["heavy-push"],
  },
  {
    name: "Rings Support Hold",
    description: "Static support hold on rings — 30 s target.",
    coachingCues: "Arms locked, still rings, shoulders depressed.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "RTO Support Hold",
    description: "Rings support hold with rings turned out — 60 s target.",
    coachingCues: "Turn rings out as far as possible. Required before ring dip eccentrics.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Rings Dip Eccentric",
    description: "Slow negative rings dip — 6–10 s descent.",
    coachingCues: "Lower over 6–10 s, full ROM, catch at bottom.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Rings L-Sit Dip",
    description: "Full rings dip holding L-sit position throughout.",
    coachingCues: "Legs at 90°+ the entire rep.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Rings Wide Dip",
    description: "Wide-elbow rings dip — pass-through range of motion.",
    coachingCues: "Elbows flare wide, deep pass-through.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "RTO 45° Past-Parallel Dip",
    description: "RTO rings dip, descending 45° past parallel.",
    coachingCues: "Turned-out grip, deep descent, 45° below parallel.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "RTO 75° Past-Parallel Dip",
    description: "RTO rings dip, descending 75° past parallel.",
    coachingCues: "Very deep. Iron Cross prereq.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "RTO 90° Past-Parallel Dip",
    description: "RTO rings dip, descending 90° past parallel — 2×BW dip benchmark.",
    coachingCues: "Full depth, turned out. Extreme strength.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Maltese Lean",
    description: "Progressively wider-hand ring lean — straight arms, protracted scapulae.",
    coachingCues: "Lean body forward, hands wide. Straight arms throughout.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Tuck Maltese",
    description: "Tuck-body maltese hold — straight arms, rings at hip plane.",
    coachingCues: "Straight arms, tuck body, rings beside hips.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Straddle Maltese",
    description: "Straddle maltese hold — straight arms, legs wide.",
    coachingCues: "Wide straddle reduces lever. Straight arms.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Full Maltese",
    description: "Full-body maltese hold — OG2 L17; elite.",
    coachingCues: "Toes pointed, body parallel, straight arms. Years of prerequisite work.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Straight-Arm Frog Stand",
    description: "Frog stand with arms fully extended — zero elbow bend.",
    coachingCues: "Lock elbows completely. Harder than bent-arm frog stand.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Half-Lay Planche",
    description: "Planche with one leg extended and one tucked — optional intermediate.",
    coachingCues: "Train both sides. Extended leg is the load variable.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Rings Frog Stand",
    description: "Frog stand on gymnastic rings — +2 levels vs floor.",
    coachingCues: "Bent arms, knees on triceps, rings add instability.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Rings Tuck Planche",
    description: "Tuck planche on rings with RTO — rings turned out ≥45°.",
    coachingCues: "RTO ≥45°, straight arms, knees tucked.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Rings Straddle Planche",
    description: "Straddle planche on rings — CoP B.",
    coachingCues: "Straight arms, wide straddle, RTO.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Rings Full Planche",
    description: "Full planche on rings — CoP C; elite.",
    coachingCues: "Full extension, toes pointed, RTO.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Tuck Planche Push-Up",
    description: "Push-up in tuck planche position — pause at top isometric.",
    coachingCues: "Maintain tuck planche throughout. Pause at top.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Advanced Tuck Planche Push-Up",
    description: "Push-up in advanced tuck planche — flat back, knees slightly extended.",
    coachingCues: "Flat back, knees 3–6 inches forward of chest.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Straddle Planche Push-Up",
    description: "Push-up in straddle planche — lock elbows at top.",
    coachingCues: "Lock elbows fully at the top. Wide straddle throughout.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Full Planche Push-Up",
    description: "Push-up in full planche — ~6–8 in range of motion.",
    coachingCues: "Very limited ROM. Full body extension maintained.",
    family: "push",
    prepTags: ["wrist-loaded", "heavy-push"],
  },
  {
    name: "Wall Straddle Press Eccentric",
    description: "Slow negative straddle press to handstand at a wall — 5–8 s descent.",
    coachingCues: "Hardest L5 skill. 5–8 s controlled descent from HS.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Elevated Straddle Press to Handstand",
    description: "Straddle press to handstand from an elevated platform — lower block over time.",
    coachingCues: "Press from a box or block. Lower the surface progressively.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Straddle Press to Handstand",
    description: "Straight-arm straddle press to handstand from the floor.",
    coachingCues: "Compress, lift hips, straddle wide, press to full lockout.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "L-Sit Straddle Press to Handstand",
    description: "Straddle press to handstand starting from L-sit — advanced compression.",
    coachingCues: "Start in L-sit, straddle and press without touching down.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Pike Press to Handstand",
    description: "Straight-arm pike press to handstand — advanced compression.",
    coachingCues: "Legs together in pike. Maximum hip flexion and shoulder elevation.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Bent-Arm Press to Handstand",
    description: "Bent-arm press to handstand — elbows never exceed 90°.",
    coachingCues: "Keep elbows bent through the press. Control descent.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },

  // ── Atlas spec additions — Pull family ───────────────────────────────────
  {
    name: "Jumping Pull-Up",
    description: "Assisted pull-up using a jump — 5 s eccentric phase.",
    coachingCues: "Jump to top, lower over 5 s. Full hang reset each rep.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Pullover",
    description: "Bar pullover to support — pull from hang to support position.",
    coachingCues: "Pull hips over the bar, finish in front support. CoP A.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Kipping Pull-Up",
    description: "Hip-driven kipping pull-up — prerequisite is strict pull-up.",
    coachingCues: "Hip drive initiates the pull. Own strict pull-ups first.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Rings L-Sit Pull-Up",
    description: "Pull-up on rings while holding L-sit position.",
    coachingCues: "Ring stability + hip flexor endurance. Legs parallel.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Rings Wide Grip Pull-Up",
    description: "Wide-grip pull-up on rings — contraindicated with subluxation history.",
    coachingCues: "Widen grip progressively. Avoid if shoulder subluxation history.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Rings Archer Pull-Up",
    description: "Rings pull-up with one arm extended — first phase of one-arm progression.",
    coachingCues: "Assisting arm stays straight. Increase load side progressively.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "OAC Eccentric",
    description: "One-arm chin eccentric — 6–10 s negative. Prereqs: strict pull-ups.",
    coachingCues: "One hand, supinated, lower over 6–10 s. Spot or jump to top.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "One-Arm Chin-Up",
    description: "Single-arm chin-up — chin above bar; ≈80–90% BW pull equivalent.",
    coachingCues: "Full ROM. Supinated grip. No body swing.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "OAC +15 lb",
    description: "One-arm chin-up with 15 lb added load.",
    coachingCues: "Same form as bodyweight OAC. Add load via belt or vest.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Typewriter Pull-Up",
    description: "Pull-up sliding side-to-side at the top — chin over bar throughout.",
    coachingCues: "Get chin over bar, slide laterally while keeping chin above bar.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Ring Row Eccentric",
    description: "Slow-negative ring row — regress via stance angle or band.",
    coachingCues: "Lower over 5–8 s. Can use band for more assistance.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Ring Row",
    description: "Horizontal row on gymnastic rings — elbows ~30°, pull to chest.",
    coachingCues: "Elbows ~30° from body, squeeze shoulder blades at top.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Wide Ring Row",
    description: "Ring row with wide elbow flare — elbows 60–90°.",
    coachingCues: "Elbows 60–90° out, pull to chest.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Archer Ring Row",
    description: "Ring row with one side loaded — assisting arm stays straight.",
    coachingCues: "Straight assisting arm. Load load-side progressively.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "One-Arm Row",
    description: "Single-arm ring row — final rung; add vest after owning.",
    coachingCues: "Full ROM, single arm, controlled.",
    family: "pull",
    prepTags: ["scap-pull", "grip"],
  },
  {
    name: "German Hang",
    description: "Deep shoulder-extension hang from rings — safety/mobility gate.",
    coachingCues: "Elevate feet to reduce load. Supinated grip. Build shoulder extension.",
    family: "pull",
    prepTags: ["scap-pull", "grip"],
  },
  {
    name: "Tuck Back Lever",
    description: "Tucked back-lever hold — hips at shoulder height, supinated grip.",
    coachingCues: "Hips at shoulder plane, knees tight to chest. Supinated.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Advanced Tuck Back Lever",
    description: "Flat-back tuck back lever — 90° at hip then knee.",
    coachingCues: "Open hips to ~90° while keeping back flat. Supinated.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Straddle Back Lever",
    description: "Straddle back-lever hold — supinated grip, legs wide.",
    coachingCues: "Wide straddle reduces lever arm. Supinated grip.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Half-Lay Back Lever",
    description: "One leg extended back lever — asymmetric bridge to full.",
    coachingCues: "Train both sides. Extended leg increases difficulty.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Back Lever Pullout",
    description: "Concentric pullout from back lever position.",
    coachingCues: "From full back lever, pull concentric to support.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Front Lever Pull to Inverted Hang",
    description: "Straight-arm pull from front lever to inverted hang — concentric phase.",
    coachingCues: "Pull from FL position straight-arm up to inverted. Control descent.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Tuck Front Lever Row",
    description: "Row in tuck front lever position — 4–5 sets, hold top 5–10 s.",
    coachingCues: "Pull to tuck FL, hold 5–10 s at top.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Straddle Front Lever Row",
    description: "Row in straddle front lever — straight-arm pull.",
    coachingCues: "Straight-arm row into straddle FL position.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Full Front Lever Row",
    description: "Row in full front lever — ROM only 6–8 in.",
    coachingCues: "Very limited ROM. Full body extension throughout.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Iron Cross (assisted)",
    description: "Band/pulley-assisted iron cross — elbows locked; prereqs mandatory.",
    coachingCues: "Elbows fully locked. Use assistance to maintain position.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Iron Cross",
    description: "Full iron cross hold — CoP B; distal-biceps load risk.",
    coachingCues: "Elbows locked, body vertical, arms horizontal. Years of prep.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Iron Cross to Back Lever",
    description: "Concentric transition from iron cross to back lever — CoP B.",
    coachingCues: "From cross, rotate to back lever. Controlled.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Iron Cross Pullout",
    description: "Concentric pullout from iron cross — CoP C.",
    coachingCues: "From cross, pull to support. Elite.",
    family: "pull",
    prepTags: ["scap-pull"],
  },
  {
    name: "Muscle-Up Negative",
    description: "Reverse-technique muscle-up descent — control the transition.",
    coachingCues: "From support, lower through transition to hang. Control every phase.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Kipping Muscle-Up",
    description: "Kipping or assisted muscle-up — hip drive or band spotter.",
    coachingCues: "Hip drive through kip. Own strict pull-ups first.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Bar Muscle-Up",
    description: "Strict bar muscle-up — false grip then transition.",
    coachingCues: "False grip, pull to chest, transition over bar.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "L-Sit Muscle-Up",
    description: "Muscle-up holding L-sit throughout — rivals full front lever difficulty.",
    coachingCues: "Legs parallel throughout pull and transition.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "False-Grip Hang",
    description: "Hang with wrists over the bar or ring — build to ~30 s.",
    coachingCues: "Wrists folded over the ring. Forearm pain is normal early on. Build slowly.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Chest-to-Bar Pull-Up",
    description: "Pull-up with sternum touching the bar — own the full ROM.",
    coachingCues: "Pull until sternum touches bar, not just chin.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Weighted Pull-Up",
    description: "Pull-up with added weight — strength/PR axis.",
    coachingCues: "Full ROM. Add weight via belt or vest.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Weighted Pull-Up +25% BW",
    description: "Pull-up with load equal to 25% of bodyweight.",
    coachingCues: "Full ROM, controlled descent.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Weighted Pull-Up +50% BW",
    description: "Pull-up with load equal to 50% of bodyweight — ≈ straddle FL / full back lever anchor.",
    coachingCues: "Full ROM, controlled. Benchmark for lever prerequisites.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Weighted Pull-Up +70% BW",
    description: "Pull-up with 70–80% bodyweight added — ≈ full front lever anchor.",
    coachingCues: "Strict form. Full ROM.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Weighted Pull-Up +90% BW",
    description: "Pull-up with 90% bodyweight added — ≈ OAC territory.",
    coachingCues: "Near double-bodyweight total. Elite strength.",
    family: "pull",
    prepTags: ["grip"],
  },

  // ── Atlas spec additions — Legs family ───────────────────────────────────
  {
    name: "Full Squat",
    description: "Deep bodyweight squat, thighs to calves.",
    coachingCues: "Full depth, heels flat, chest tall.",
    family: "legs",
  },
  {
    name: "Cossack Squat",
    description: "Lateral deep squat — pistol prep and hip mobility.",
    coachingCues: "Shift weight to one side, other leg straight. Alternate sides.",
    family: "legs",
  },
  {
    name: "Weighted Pistol Squat 1.2x BW",
    description: "Pistol squat with load equal to 1.2× bodyweight total.",
    coachingCues: "Add weight via vest, dumbbell, or belt.",
    family: "legs",
  },
  {
    name: "Weighted Pistol Squat 1.5x BW",
    description: "Pistol squat with 1.5× bodyweight total — ≈ 2× BW back squat.",
    coachingCues: "Heavy single-leg strength.",
    family: "legs",
  },
  {
    name: "Weighted Pistol Squat 2.0x BW",
    description: "Pistol squat with 2.0× bodyweight total.",
    coachingCues: "Elite single-leg load.",
    family: "legs",
  },
  {
    name: "Romanian Deadlift",
    description: "Hip hinge with load — neutral spine, hamstring emphasis.",
    coachingCues: "Neutral spine, push hips back, slight knee bend.",
    family: "legs",
    prepTags: ["hinge"],
  },
  {
    name: "Single-Leg RDL",
    description: "One-leg hip hinge — balance and hamstring load.",
    coachingCues: "Balance on one leg, hinge at hip, neutral spine.",
    family: "legs",
    prepTags: ["hinge"],
  },
  {
    name: "Swiss-Ball Leg Curl",
    description: "Hamstring curl using a Swiss ball — full ROM control.",
    coachingCues: "Hips up, curl ball toward glutes, extend back out.",
    family: "legs",
    prepTags: ["hinge"],
  },
  {
    name: "Nordic Hamstring Curl (assisted)",
    description: "Band or partner-assisted Nordic curl — reduce assist over time.",
    coachingCues: "Use band or partner to reduce load. Control the descent.",
    family: "legs",
    prepTags: ["hinge"],
  },

  // ── Atlas spec additions — Core family ───────────────────────────────────
  {
    name: "One-Arm One-Leg Plank",
    description: "Diagonal plank on one arm and opposite leg — build to 60 s.",
    coachingCues: "Opposite arm and leg. Hips square. No rotation.",
    family: "core",
  },
  {
    name: "Knees Ab Wheel",
    description: "Ab-wheel rollout from knees — 3×10 before advancing.",
    coachingCues: "Roll out until arms are overhead, pull back. No lower-back sag.",
    family: "core",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Ab Wheel Eccentric",
    description: "Slow rollout from knees, drop to floor near-collapse — the eccentric is the load.",
    coachingCues: "Roll out slow, touch floor with control. Pull back or reset from floor.",
    family: "core",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Full Ab Wheel",
    description: "Standing ab-wheel rollout from feet — no lower-back sag.",
    coachingCues: "Start standing, roll out to full extension. No sag.",
    family: "core",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Ab Wheel +20 lb",
    description: "Standing ab-wheel rollout with 20 lb added load.",
    coachingCues: "Wear vest or use plate. Same form as full ab wheel.",
    family: "core",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "One-Arm Ab Wheel",
    description: "Single-arm ab-wheel rollout — elite anti-extension.",
    coachingCues: "One arm only. Anti-rotation demand is extreme.",
    family: "core",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Tuck Dragon Flag",
    description: "Tucked dragon flag — entry rung for the dragon flag progression.",
    coachingCues: "Shoulders anchored, body tucked. Straighten progressively.",
    family: "core",
  },
  {
    name: "Dragon Flag",
    description: "Straight-body reverse crunch — shoulders anchored, rigid body.",
    coachingCues: "Shoulders stay on bench. Rigid body from shoulders to feet.",
    family: "core",
  },
  {
    name: "Straddle L-Sit",
    description: "L-sit with legs straddled wide — reduces hip flexor demand.",
    coachingCues: "Wide straddle, depress shoulders, straight arms.",
    family: "core",
  },
  {
    name: "RTO L-Sit",
    description: "L-sit on rings turned out — +1 level vs bar L-sit.",
    coachingCues: "Turn rings out, legs parallel, shoulder depression.",
    family: "core",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "45° V-Sit",
    description: "V-sit with legs at ~45° — Phase II compression.",
    coachingCues: "Hips below shoulders. Press down hard, lift legs.",
    family: "core",
  },
  {
    name: "90° V-Sit",
    description: "V-sit with legs near vertical — Phase III compression.",
    coachingCues: "Hips approximately at shoulder level. Maximum compression.",
    family: "core",
  },
  {
    name: "Full V-Sit",
    description: "High V-sit with legs 150°+ — Phase IV compression.",
    coachingCues: "Hips above shoulders. Extreme hip flexor + compression strength.",
    family: "core",
  },
  {
    name: "Manna",
    description: "Manna hold — hips well above shoulders; CoP C.",
    coachingCues: "Hips far above shoulders, legs elevated. Flexibility-gated.",
    family: "core",
  },
  {
    name: "Compression Drill",
    description: "Seated press-down and knee-lift — hands beside hips moving toward feet.",
    coachingCues: "Sit, press palms down, lift knees. Work hands progressively toward feet.",
    family: "core",
  },

  // ── Atlas spec additions — Skill / balance family ────────────────────────
  {
    name: "One-Arm Handstand",
    description: "Single-arm freestanding handstand — years; strict prerequisites.",
    coachingCues: "Lean 15–20° toward planted arm. Fingertip control. Positional.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Rings Handstand",
    description: "Handstand on gymnastic rings — roll-out ≥10× first.",
    coachingCues: "Must own ring rollouts before attempting. Extreme stability demand.",
    family: "push",
    prepTags: ["wrist-loaded", "overhead"],
  },
  {
    name: "Two-Arm Elbow Lever",
    description: "Both elbows on abdomen, body held horizontal — ~120° elbow angle.",
    coachingCues: "Elbows at ~120°, dig into abdomen, lean forward until parallel.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "One-Arm Elbow Lever",
    description: "Single-arm elbow lever — lean 15–20° toward planted arm.",
    coachingCues: "One elbow on abdomen. Lean toward that side to balance.",
    family: "push",
    prepTags: ["wrist-loaded"],
  },
  {
    name: "Tuck Human Flag",
    description: "Tucked human flag hold — often skipped to straddle.",
    coachingCues: "One arm push, one arm pull. Tuck body. Often skip to straddle.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Straddle Human Flag",
    description: "Straddle human flag hold — 30–45° arm angle.",
    coachingCues: "Arms at 30–45°. Wide straddle reduces lever arm.",
    family: "pull",
    prepTags: ["grip"],
  },
  {
    name: "Full Human Flag",
    description: "Full-body horizontal flag — one arm push, one arm pull.",
    coachingCues: "One push + one pull. Body parallel to ground.",
    family: "pull",
    prepTags: ["grip"],
  },
];
