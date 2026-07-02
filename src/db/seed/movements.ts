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
];
