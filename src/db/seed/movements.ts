import type { SeedMovement } from "./types";

export const SEED_MOVEMENTS: SeedMovement[] = [
  {
    name: "Wall Push-Ups",
    description: "Push-ups performed against a wall, great for beginners.",
  },
  {
    name: "Incline Push-Ups",
    description: "Push-ups with hands on an elevated surface.",
  },
  {
    name: "Knee Push-Ups",
    description: "Push-ups from the knees instead of toes.",
  },
  { name: "Push-Ups", description: "Standard push-ups from the toes." },
  {
    name: "Diamond Push-Ups",
    description: "Push-ups with hands close together forming a diamond shape.",
    coachingCues: "Tricep accessory — controlled pace.",
  },
  {
    name: "Archer Push-Ups",
    description: "Wide push-ups shifting weight to one arm.",
  },
  {
    name: "Wide Push-Ups",
    description: "Push-ups with hands placed wider than shoulders for pec emphasis.",
    coachingCues:
      "Hands ~1.5x shoulder width. Elbows out at ~60°, lower until chest is 2-3 inches off floor. Maintain plank line — no hip sag.",
  },
  {
    name: "Pseudo Planche Push-Ups",
    description: "Push-ups with hands turned back near the waist.",
    coachingCues:
      "Only do this if your planche lean felt solid today. 3 sec descent, full reset between reps. Skip on bad days.",
  },
  {
    name: "One Arm Push-Ups",
    description: "Push-ups performed with a single arm.",
  },

  {
    name: "Dead Hang",
    description: "Passive hang from a bar to build grip strength.",
    coachingCues: "Grip and shoulder health. Relax then re-engage.",
  },
  {
    name: "Active Hang",
    description: "Hang from a bar with scapulae depressed and retracted.",
  },
  {
    name: "Scapular Pulls",
    description:
      "Hang from the bar and pull shoulder blades down and together.",
    coachingCues:
      "Dead hang → depress scapulae to lift body slightly. Arms stay straight.",
  },
  {
    name: "Negative Pull-Ups",
    description: "Jump to the top and slowly lower yourself.",
    coachingCues: "6–8 sec descent. Full dead hang reset between reps.",
  },
  {
    name: "Band-Assisted Pull-Ups",
    description: "Pull-ups with a resistance band for assistance.",
  },
  {
    name: "Pull-Ups",
    description: "Standard pull-ups with palms facing away.",
    coachingCues:
      "Heavy day = straight sets, 2 reps, full rest, clean & explosive. Volume day = cluster (2+2+2, 20s rest between clusters).",
  },
  {
    name: "L-Sit Pull-Ups",
    description: "Pull-ups while holding an L-sit position.",
  },
  {
    name: "Archer Pull-Ups",
    description: "Wide-grip pull-ups shifting weight to one arm.",
  },

  {
    name: "Parallel Bar Support Hold",
    description: "Hold yourself up on parallel bars with arms locked.",
  },
  { name: "Negative Dips", description: "Lower yourself slowly on dip bars." },
  {
    name: "Band-Assisted Dips",
    description: "Dips with a resistance band for assistance.",
  },
  {
    name: "Dips",
    description: "Standard parallel bar dips.",
    coachingCues: "3 sec negative on the way down.",
  },
  { name: "Ring Dips", description: "Dips performed on gymnastic rings." },
  {
    name: "Weighted Dips",
    description: "Dips with additional weight attached.",
  },

  {
    name: "Wall Handstand Hold",
    description: "Hold a handstand position against a wall.",
  },
  {
    name: "Pike Push-Ups",
    description: "Push-ups in a pike position to target shoulders.",
    coachingCues: "Hips high, head between arms at the bottom.",
  },
  {
    name: "Elevated Pike Push-Ups",
    description: "Pike push-ups with feet on an elevated surface.",
  },
  {
    name: "Wall Handstand Push-Ups",
    description: "Handstand push-ups against a wall.",
  },
  {
    name: "Freestanding Handstand Push-Ups",
    description: "Handstand push-ups without wall support.",
  },

  {
    name: "Tucked L-Sit",
    description: "L-sit with knees tucked on the floor or parallettes.",
  },
  { name: "One Leg L-Sit", description: "L-sit with one leg extended." },
  { name: "L-Sit", description: "Full L-sit hold with both legs extended." },

  {
    name: "Assisted Squats",
    description: "Squats while holding onto a support.",
  },
  {
    name: "Bodyweight Squats",
    description: "Standard squats with no added weight.",
  },
  {
    name: "Bulgarian Split Squats",
    description: "Single-leg squat with rear foot elevated.",
  },
  {
    name: "Shrimp Squats",
    description: "Single-leg squat holding the back foot.",
  },
  {
    name: "Pistol Squats",
    description: "Full single-leg squat with the other leg extended.",
  },

  {
    name: "Knee Raises",
    description: "Hang from a bar and raise knees to chest.",
  },
  {
    name: "Leg Raises",
    description: "Hang from a bar and raise straight legs.",
    coachingCues:
      "Controlled. No swinging. Tuck version is OK if straight legs are too hard.",
  },
  {
    name: "Toes to Bar",
    description: "Hang from a bar and bring toes to touch the bar.",
  },
  {
    name: "Windshield Wipers",
    description: "Hang and rotate extended legs side to side.",
  },

  { name: "Plank", description: "Standard forearm plank hold." },
  { name: "Side Plank", description: "Plank on one forearm, body sideways." },
  {
    name: "Hollow Body Hold",
    description: "Lie on back with arms and legs extended off the ground.",
    coachingCues:
      "Lower back pressed to floor, arms overhead. Foundation for planche.",
  },
  {
    name: "Superman Hold",
    description: "Lie face down and lift arms and legs off the ground.",
  },

  { name: "Jumping Jacks", description: "Classic cardio warm-up exercise." },
  {
    name: "Burpees",
    description: "Full body exercise combining squat, plank, and jump.",
  },
  {
    name: "Mountain Climbers",
    description: "Plank position alternating knee drives.",
  },
  { name: "Box Jumps", description: "Jump onto an elevated surface." },
  {
    name: "Inverted Rows",
    previousNames: ["Australian Pull-Ups"],
    description: "Horizontal body row under a low bar.",
    coachingCues:
      "Bar at hip height, heels on floor, body straight. Lower bar = harder. Squeeze shoulder blades at top.",
  },
  {
    name: "Frog Stand",
    description:
      "Crow pose: bent-arm balance with knees resting on triceps near the elbows.",
    coachingCues:
      "Hands shoulder-width, fingers spread and gripping floor. Knees press into triceps near the elbows (not upper arm). Shift weight forward until feet float. Look slightly forward, not straight down. Wrist warm-up first — non-negotiable.",
  },
  {
    name: "Tuck Planche Negatives",
    description:
      "Kick or push up to a brief tuck planche position, then lower with control.",
    coachingCues:
      "From frog stand or floor, transition to tuck planche briefly. Hold what you can (even 1s). Lower under control — the eccentric is the work. 3-5 reps.",
  },
  {
    name: "Tuck Planche",
    description: "Planche position with knees tucked to chest.",
  },
  {
    name: "Advanced Tuck Planche",
    description: "Planche with hips higher and knees slightly extended.",
  },
  { name: "Straddle Planche", description: "Planche with legs spread apart." },
  {
    name: "Full Planche",
    description: "Horizontal hold with body fully extended.",
  },
  {
    name: "Planche Leans",
    description:
      "Lean forward in a planche position on the floor, shifting weight onto hands.",
  },
  {
    name: "Planche Lean Hold",
    description: "Hold the forward-leaning planche position isometrically.",
    coachingCues:
      "Hands rotated out, arms straight, lean forward, protract scapulae.",
  },
  {
    name: "Pseudo Push-Up Hold",
    description: "Hold the bottom or top position of a pseudo planche push-up.",
  },
  {
    name: "Knee Archer Push-Ups",
    description:
      "Archer push-ups performed from the knees, shifting weight to one arm per rep.",
  },
  {
    name: "Slow Motion Push-Ups",
    description:
      "Push-ups performed at an extremely slow tempo for time under tension.",
    coachingCues:
      "Target ~30s per rep: 20-25s descent (slowest in the bottom third where you're weakest), 1-2s pause at the bottom, 5-10s push. Hold the plank line — if hips sag, cut the descent short rather than break form.",
  },
  {
    name: "Skin the Cat",
    description: "Hang and rotate body through arms on rings or bar.",
  },
  {
    name: "Back Lever",
    description: "Hang inverted with body horizontal behind the bar.",
  },
  {
    name: "Front Lever Tuck Hold",
    description: "Inverted horizontal hold with knees tucked.",
  },
  {
    name: "Front Lever",
    description: "Horizontal hold facing up with body fully extended.",
  },
  {
    name: "Muscle-Up",
    description: "Pull-up transitioning above the bar into a dip.",
  },

  {
    name: "Wrist Mobility Routine",
    description: "Wrist warmup routine to prepare for push work.",
    coachingCues:
      "Circles, prayer stretch forward & back, compression on floor. Never skip this.",
  },
  {
    name: "L-Sit Hang on Parallettes",
    description: "L-sit hold on parallettes with feet supported on the floor.",
    coachingCues:
      "Push bars down hard, shoulders away from ears. Straight arms!",
  },
  {
    name: "Seated Single Leg Raise",
    description: "Seated single-leg raise on the floor for hip-flexor strength.",
    coachingCues:
      "Sit on floor, hands beside hips. Lift one leg at a time. Trains hip flexors for L-sit.",
  },
  {
    name: "Pike Compression",
    description: "Seated pike compression stretch for hamstring flexibility.",
    coachingCues:
      "Legs straight in front. Pulse chest toward thighs (back stays straight). Go to your end range.",
  },
  {
    name: "Arch Body Hold",
    description: "Posterior chain isometric hold (replaces Superman).",
    coachingCues: "Face down, lift arms and legs off floor. Hold tension.",
  },
  {
    name: "Chin-Up Hold",
    description: "Isometric chin-up hold at 90° elbow bend.",
    coachingCues:
      "Keep elbows at exactly 90°. Hold as long as possible (~15–20 sec).",
  },
  {
    name: "Hip Flexor Stretch",
    description: "Kneeling hip flexor stretch.",
    coachingCues: "Keep torso upright. Gentle hold, no bouncing.",
  },
  {
    name: "Seated Forward Fold",
    description: "Seated forward fold for hamstring and posterior-chain mobility.",
    coachingCues:
      "Straight legs, hinge at hip with a STRAIGHT back. Chest toward thighs.",
  },
  {
    name: "Band Pull-Aparts",
    description: "Resistance-band pull-apart for shoulder health.",
    coachingCues:
      "Hold band at shoulder width, pull apart out to sides. Keep this light — recovery, not training.",
  },
  {
    name: "Chest & Shoulder Stretch",
    description: "Chest and shoulder mobility stretch.",
    coachingCues:
      "Doorframe stretch or behind-back clasp. Helps with dip and planche range.",
  },

  {
    name: "Calf Raises",
    description: "Standing calf raises for ankle and lower-leg strength.",
    coachingCues:
      "Full range — pause at the top, slow on the way down. Single-leg version is harder.",
  },
  {
    name: "Single-Leg Glute Bridge",
    description:
      "Single-leg hip bridge from the floor for glute and posterior-chain strength.",
    coachingCues:
      "Lie on back, one foot flat on floor, other leg straight. Drive hips up by squeezing the glute hard, then lower under control. Posterior chain = planche line support.",
  },
  {
    name: "Nordic Hamstring Curl",
    description:
      "Kneeling eccentric hamstring curl, body lowering forward under control.",
    coachingCues:
      "Anchor feet (couch, partner, band). Lower forward as slow as possible (5–8 sec). Catch with hands. Brutal but bulletproofs hamstrings.",
  },
];
