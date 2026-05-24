// Canonical pose descriptions for every seeded movement.
// Each description aims at one clear, illustrative pose (typically the
// "working" or "hold" position). Used by image generation scripts.
//
// Slug must match seed.ts name → slug() output:
//   lowercase, & → "and", non-alphanumeric → "-", trim hyphens.

export const EXERCISES = [
  // ───── Push-Up family ─────
  {
    slug: "wall-push-ups",
    pose: "performing a wall push-up, standing facing a wall with both hands flat on the wall at shoulder height, body leaning toward the wall with elbows bent, feet on the floor, body straight from head to heels, side profile view",
  },
  {
    slug: "incline-push-ups",
    pose: "performing an incline push-up, hands flat on a sturdy elevated bench at hip height, feet on the floor, body straight at an angle, elbows bent at the bottom of a push-up, side profile view",
  },
  {
    slug: "knee-push-ups",
    pose: "performing a push-up from the knees, both hands flat on the floor shoulder-width apart, knees on the floor, body straight from knees to head, elbows bent at the bottom position, side profile view",
  },
  {
    slug: "push-ups",
    pose: "performing a standard push-up at the bottom position, body straight from head to heels, elbows bent ~90 degrees and tucked, hands flat on floor shoulder-width apart, on toes, side profile view",
  },
  {
    slug: "diamond-push-ups",
    pose: "performing a diamond push-up at the bottom position, hands together on floor with index fingers and thumbs touching to form a diamond shape directly under the chest, elbows close to body, on toes, body straight, side profile view",
  },
  {
    slug: "archer-push-ups",
    pose: "performing an archer push-up, hands wide apart on the floor, body lowered to one side with that elbow bent while the other arm stays straight to the side, on toes, body straight, front three-quarter view",
  },
  {
    slug: "pseudo-planche-push-ups",
    pose: "performing a pseudo-planche push-up, hands flat on floor with fingers pointing backward toward the hips, hands placed near the waist, shoulders leaning forward over the hands, body straight from head to heels, on toes, side profile view",
  },
  {
    slug: "one-arm-push-ups",
    pose: "performing a one-arm push-up, a single hand flat on the floor under the chest, the other arm tucked behind the back, feet wide apart for balance, body straight, side profile view",
  },

  // ───── Hang / pull-up family ─────
  {
    slug: "dead-hang",
    pose: "performing a dead hang from a horizontal pull-up bar, both arms straight and fully extended overhead, hands gripping the bar shoulder-width with palms facing forward, shoulders relaxed, legs hanging straight, front view",
  },
  {
    slug: "active-hang",
    pose: "performing an active hang from a horizontal pull-up bar, arms straight overhead gripping the bar, shoulders pulled down and back (scapulae depressed and retracted), chest slightly lifted, legs straight, front view",
  },
  {
    slug: "scapular-pulls",
    pose: "performing a scapular pull from a pull-up bar, arms fully straight overhead gripping the bar, shoulders pulled down forcefully so the body rises slightly without arm bend, chest lifted, front view",
  },
  {
    slug: "negative-pull-ups",
    pose: "performing the descent of a negative pull-up, chin near the bar with elbows bent ~90 degrees, body controlled lowering down, palms facing away gripping the bar, front view",
  },
  {
    slug: "band-assisted-pull-ups",
    pose: "performing a band-assisted pull-up, both hands gripping a pull-up bar with palms facing away, one foot resting in a loop of a thick resistance band hanging from the bar, mid-rep with elbows bent, front view",
  },
  {
    slug: "pull-ups",
    pose: "performing a pull-up at the top position, chin above a horizontal bar, both hands gripping the bar shoulder-width with palms facing away, elbows fully bent at the sides, body straight below, front view",
  },
  {
    slug: "l-sit-pull-ups",
    pose: "performing an L-sit pull-up, both hands gripping a pull-up bar with palms facing away, body pulled up so chin is near the bar, legs held straight out in front of the body parallel to the floor in an L-sit shape, side profile view",
  },
  {
    slug: "archer-pull-ups",
    pose: "performing an archer pull-up, hands gripping a wide horizontal bar with palms facing away, body pulled up and shifted toward one hand with that elbow fully bent while the other arm stays straight along the bar, front view",
  },
  {
    slug: "chin-up-hold",
    pose: "performing an isometric chin-up hold at the 90-degree position, hands gripping a horizontal bar with palms facing toward the face (supinated), elbows bent at exactly 90 degrees holding the body steady halfway up, legs straight below, front view",
  },
  {
    slug: "negative-chin-ups",
    pose: "performing the eccentric phase of a chin-up, hands gripping a horizontal bar with palms facing toward the face (supinated grip), at the mid-point of a slow controlled descent with elbows bent at roughly 90 degrees, body vertical and straight, side profile view",
  },
  {
    slug: "band-assisted-chin-ups",
    pose: "performing a band-assisted chin-up at the top position, hands gripping a horizontal bar with palms facing toward the face (supinated grip), one foot tucked inside a loop resistance band that hangs from the center of the bar, chin clearing the bar, body vertical, side profile view",
  },
  {
    slug: "chin-ups",
    pose: "performing a chin-up at the top position, hands gripping a horizontal bar with palms facing toward the face (supinated grip) at about shoulder width, chin over the bar, elbows bent and pulled down toward the ribs, body vertical and straight, side profile view",
  },

  // ───── Dip family ─────
  {
    slug: "parallel-bar-support-hold",
    pose: "performing a parallel bar support hold, arms locked fully straight supporting the body upright between two parallel bars at hip height, shoulders pushed down away from ears, legs hanging straight together below, side profile view",
  },
  {
    slug: "negative-dips",
    pose: "performing the descent phase of a negative dip, body between two parallel bars, elbows bent past 90 degrees with shoulders just above the bars, slow controlled lowering, side profile view",
  },
  {
    slug: "band-assisted-dips",
    pose: "performing a band-assisted dip between two parallel bars, both feet resting in a thick resistance band stretched across both bars, elbows bent at the bottom of the dip, side profile view",
  },
  {
    slug: "dips",
    pose: "performing a parallel bar dip at the bottom position, body upright between two parallel bars at hip height, elbows bent at 90 degrees with shoulders just above the bars, legs hanging straight below, side profile view",
  },
  {
    slug: "ring-dips",
    pose: "performing a dip on two gymnastic rings hanging from above, hands gripping the rings at hip level, elbows bent at the bottom of the dip, rings turned out at the top, legs hanging straight, side profile view",
  },
  {
    slug: "weighted-dips",
    pose: "performing a weighted parallel bar dip, body upright between two parallel bars, elbows bent at the bottom, a heavy weight plate hanging from a dip belt around the waist, side profile view",
  },

  // ───── Handstand / overhead push ─────
  {
    slug: "wall-handstand-hold",
    pose: "performing a wall-supported handstand, body fully inverted upside down with both hands flat on the floor shoulder-width apart, arms locked straight, legs straight up, heels lightly touching a wall behind the body, side profile view",
  },
  {
    slug: "pike-push-ups",
    pose: "performing a pike push-up at the bottom position, body in an inverted V shape with hips high, feet on the floor, hands on the floor in front, head between the arms with elbows bent, side profile view",
  },
  {
    slug: "elevated-pike-push-ups",
    pose: "performing an elevated pike push-up, both feet placed on a sturdy bench behind the body, body folded in an inverted V with hips high, hands on the floor and head lowered between the arms with elbows bent, side profile view",
  },
  {
    slug: "wall-handstand-push-ups",
    pose: "performing a wall handstand push-up at the bottom, body inverted upside down with heels touching a wall, hands flat on the floor, head just above the floor between the arms with elbows bent, side profile view",
  },
  {
    slug: "freestanding-handstand-push-ups",
    pose: "performing a freestanding handstand push-up at the bottom, body inverted upside down in a perfectly straight vertical line without any wall support, hands flat on the floor with elbows bent, head just above floor, side profile view",
  },

  // ───── L-Sit family ─────
  {
    slug: "tucked-l-sit",
    pose: "performing a tucked L-sit on the floor, hands flat on the floor either side of the hips with arms locked straight pressing the body up off the floor, knees tucked tightly to the chest, feet off the floor, side profile view",
  },
  {
    slug: "one-leg-l-sit",
    pose: "performing a one-leg L-sit, hands flat on the floor either side of the hips with arms locked straight pressing the body up, one leg extended straight out in front parallel to the floor, the other knee tucked toward the chest, side profile view",
  },
  {
    slug: "l-sit",
    pose: "performing a full L-sit hold, hands flat on the floor either side of the hips with arms locked straight pressing the body up off the floor, both legs held straight out in front parallel to the floor forming a clear L shape with the torso, side profile view",
  },
  {
    slug: "l-sit-hang-on-parallettes",
    pose: "performing an L-sit on parallettes, both hands gripping two short parallette bars about 15 cm off the floor, arms locked straight pressing the body up, both legs extended straight forward parallel to the floor in an L shape, side profile view",
  },

  // ───── Squat family ─────
  {
    slug: "assisted-squats",
    pose: "performing an assisted squat, lower body in a deep squat position with thighs parallel to floor, torso upright, both hands lightly holding a vertical pole or door frame in front for balance, side profile view",
  },
  {
    slug: "bodyweight-squats",
    pose: "performing a bodyweight squat at the bottom position, thighs parallel to the floor, knees tracking over toes, torso upright with arms extended forward for balance, feet shoulder-width apart, side profile view",
  },
  {
    slug: "bulgarian-split-squats",
    pose: "performing a Bulgarian split squat at the bottom position, rear foot elevated behind on a low bench with the rear knee close to the floor, front leg bent 90 degrees with thigh parallel to floor, torso upright, side profile view",
  },
  {
    slug: "shrimp-squats",
    pose: "performing a shrimp squat at the bottom position, balancing on one leg in a deep squat with the rear knee touching the floor behind, the rear foot lifted and held with both hands behind the back, torso upright, side profile view",
  },
  {
    slug: "pistol-squats",
    pose: "performing a pistol squat at the bottom position, balancing on one leg in a deep one-leg squat with thigh below parallel, the other leg held extended straight out in front parallel to the floor, both arms extended forward for balance, side profile view",
  },

  // ───── Hanging core ─────
  {
    slug: "knee-raises",
    pose: "performing a hanging knee raise, hanging from a horizontal pull-up bar with arms straight overhead, knees raised together toward the chest with thighs parallel to the floor, side profile view",
  },
  {
    slug: "leg-raises",
    pose: "performing a hanging leg raise, hanging from a horizontal pull-up bar with arms straight overhead, both legs raised straight together until parallel to the floor in an L shape, side profile view",
  },
  {
    slug: "toes-to-bar",
    pose: "performing a toes-to-bar, hanging from a horizontal pull-up bar with arms straight overhead, body curled up so both feet rise up to touch the bar between the hands, side profile view",
  },
  {
    slug: "windshield-wipers",
    pose: "performing a hanging windshield wiper, hanging from a horizontal pull-up bar with arms straight overhead, both legs straight raised up overhead at a 90 degree angle to the body and rotated to one side, front view",
  },

  // ───── Floor core ─────
  {
    slug: "plank",
    pose: "performing a forearm plank hold, body face-down and straight from head to heels, supported on both forearms (elbows under shoulders) and both feet on the toes, side profile view",
  },
  {
    slug: "side-plank",
    pose: "performing a side plank hold, body straight sideways supported on one forearm with elbow under shoulder, feet stacked, the free arm extended straight up toward the ceiling, side profile view",
  },
  {
    slug: "hollow-body-hold",
    pose: "performing a hollow body hold, lying face-up on the floor with the lower back pressed flat to the floor, both arms extended straight overhead just off the floor and both legs extended straight just off the floor with the body curved into a shallow banana shape, side profile view",
  },
  {
    slug: "superman-hold",
    pose: "performing a superman hold, lying face-down on the floor with both arms extended straight overhead and both legs straight, with both the arms and legs lifted off the floor while the torso stays on the floor, side profile view",
  },
  {
    slug: "arch-body-hold",
    pose: "performing an arch body hold, lying face-down on the floor with both arms extended overhead and both legs straight, arms and legs both lifted off the floor in a slight reverse-banana arch shape, side profile view",
  },
  {
    slug: "pike-compression",
    pose: "performing seated pike compression, sitting on the floor with both legs straight in front, chest folded over the thighs as far as possible with a straight back, both hands reaching past the feet, side profile view",
  },
  {
    slug: "seated-single-leg-raise",
    pose: "performing a seated single leg raise, sitting upright on the floor with both hands flat on the floor beside the hips for support, one leg lifted straight off the floor as high as possible while the other leg remains straight on the floor, side profile view",
  },

  // ───── Push-Up variants & holds ─────
  {
    slug: "planche-leans",
    pose: "performing a planche lean on the floor, body in a push-up position with arms locked fully straight, hands flat on the floor with fingers pointed back toward the hips, shoulders leaned far forward past the hands, feet on toes, body straight, side profile view",
  },
  {
    slug: "planche-lean-hold",
    pose: "holding a planche lean, body in a push-up position with arms locked fully straight, hands flat on the floor with fingers pointed back toward the hips, shoulders leaned far forward past the hands, feet on toes, body perfectly straight and rigid, side profile view",
  },
  {
    slug: "pseudo-push-up-hold",
    pose: "holding the bottom position of a pseudo-planche push-up, body lowered with elbows bent ~90 degrees and tucked close to the torso, hands flat on the floor with fingers pointed back toward the hips, body straight on toes, side profile view",
  },
  {
    slug: "knee-archer-push-ups",
    pose: "performing an archer push-up from the knees, hands wide apart on the floor, knees on the floor, body lowered to one side with that elbow bent while the other arm stays straight along the floor to the side, three-quarter front view",
  },
  {
    slug: "slow-motion-push-ups",
    pose: "performing a slow-tempo standard push-up at the midpoint of the descent, body straight, elbows bent at 45 degrees, hands flat on floor under shoulders, on toes, side profile view",
  },

  // ───── Skin the Cat / Levers ─────
  {
    slug: "skin-the-cat",
    pose: "performing a skin-the-cat midway, body inverted with both hands gripping a low horizontal bar, knees tucked through the arms, body in a tight tucked rotation underneath the bar, side profile view",
  },
  {
    slug: "back-lever",
    pose: "performing a back lever, hands gripping a horizontal bar overhead with arms straight and behind the body, body inverted and held perfectly horizontal facing the floor with arms extended back, body completely straight, side profile view",
  },
  {
    slug: "front-lever-tuck-hold",
    pose: "performing a tuck front lever, hands gripping a horizontal bar overhead with arms locked straight, body inverted and lifted so the torso is horizontal facing the ceiling, knees pulled tightly to the chest in a tuck, side profile view",
  },
  {
    slug: "front-lever",
    pose: "performing a full front lever, hands gripping a horizontal bar overhead with arms locked straight, body held perfectly straight and horizontal facing the ceiling, legs fully extended, side profile view",
  },

  // ───── Planche family ─────
  {
    slug: "tuck-planche",
    pose: "performing a tuck planche on the floor, hands flat on the floor with arms locked straight, the entire body lifted off the floor with knees tucked tightly to the chest, hips above hand level, body balanced on the hands only, side profile view",
  },
  {
    slug: "advanced-tuck-planche",
    pose: "performing an advanced tuck planche on the floor, hands flat on the floor with arms locked straight, body lifted off the floor with knees tucked but hips opened up so the back is flat and parallel to the floor, side profile view",
  },
  {
    slug: "straddle-planche",
    pose: "performing a straddle planche on the floor, hands flat on the floor with arms locked straight, body lifted horizontally off the floor parallel to the ground, legs straight and spread wide apart in a straddle, side profile view",
  },
  {
    slug: "full-planche",
    pose: "performing a full planche on the floor, hands flat on the floor with arms locked straight, body held perfectly horizontal and straight parallel to the floor, legs straight and together, balanced on hands only, side profile view",
  },

  // ───── Cardio / warm-up ─────
  {
    slug: "jumping-jacks",
    pose: "performing a jumping jack at the open position, feet wide apart on the floor and both arms extended straight up overhead reaching the hands together, body upright facing forward, front view",
  },
  {
    slug: "burpees",
    pose: "performing the bottom plank phase of a burpee, body lowered into a push-up position with chest near the floor, arms bent, body straight, side profile view",
  },
  {
    slug: "mountain-climbers",
    pose: "performing a mountain climber, body in a push-up plank position with arms straight and hands on the floor, one knee driven forward toward the chest while the other leg stays straight back, side profile view",
  },
  {
    slug: "box-jumps",
    pose: "performing a box jump at the take-off, body crouched with knees bent and arms swung back, leaping forward and upward toward a sturdy waist-high box just ahead, side profile view",
  },

  // ───── Inverted Row (formerly Australian Pull-Up) ─────
  {
    slug: "inverted-rows",
    pose: "performing an inverted row, body straight at an angle under a horizontal bar set at hip height, both hands gripping the bar overhand at shoulder width, chest pulled up to the bar, heels on the floor and body straight, side profile view",
  },

  // ───── Muscle-Up ─────
  {
    slug: "muscle-up",
    pose: "performing a bar muscle-up at the transition phase, body partially above a horizontal bar, both hands gripping the bar with the chest at bar level rotating over the top, elbows just starting to extend, front view",
  },

  // ───── Mobility ─────
  {
    slug: "wrist-mobility-routine",
    pose: "performing a kneeling wrist mobility stretch, kneeling on the floor with both palms flat on the floor directly under the shoulders and fingers pointing backward toward the knees, arms locked straight, gently leaning back to stretch the wrists, side profile view",
  },
  {
    slug: "hip-flexor-stretch",
    pose: "performing a kneeling hip flexor stretch, one knee on the floor and the other foot forward in a deep lunge with the front knee bent 90 degrees, torso upright with arms relaxed at the sides, gentle forward pelvic tilt, side profile view",
  },
  {
    slug: "seated-forward-fold",
    pose: "performing a seated forward fold, sitting on the floor with both legs extended straight in front, torso folded forward over the legs with a straight back, both hands reaching forward past the feet, side profile view",
  },
  {
    slug: "band-pull-aparts",
    pose: "performing a band pull-apart, standing upright facing forward, both arms held out straight in front at shoulder height with a horizontal resistance band gripped between the hands and stretched apart wide to the sides, chest open, front view",
  },
  {
    slug: "chest-and-shoulder-stretch",
    pose: "performing a doorway chest and shoulder stretch, standing in a doorway with one bent arm raised so the forearm rests against the door frame at shoulder height, torso rotated gently away from that arm to stretch the chest, side profile view",
  },

  // ───── Legs / posterior chain ─────
  {
    slug: "calf-raises",
    pose: "performing a standing calf raise at the top position, standing upright with both feet flat on the floor and heels lifted high off the floor balancing on the balls of the feet, body straight, arms relaxed at the sides, side profile view",
  },
  {
    slug: "single-leg-glute-bridge",
    pose: "performing a single-leg glute bridge at the top position, lying on the back on the floor with one knee bent and that foot flat on the floor, the other leg extended straight in the air at hip level, hips lifted off the floor in a straight line from shoulders to the lifted knee, arms flat on the floor at the sides, side profile view",
  },
  {
    slug: "nordic-hamstring-curl",
    pose: "performing the lowering phase of a Nordic hamstring curl, kneeling on a soft pad with feet anchored under a fixed support, body lowering forward toward the floor in one straight line from knees to head, arms held in front of the chest ready to catch on the floor, side profile view",
  },

  // ───── Gym equipment (cable, machine, dumbbell) ─────
  {
    slug: "lat-pulldown",
    pose: "performing a cable lat pulldown at a gym machine, seated on the bench with knees secured under the thigh pads, both hands gripping a straight bar attachment at slightly wider than shoulder width with palms facing forward (pronated), the bar pulled down to the upper chest with elbows bent and driven down toward the ribs, torso upright with a slight backward lean, side profile view",
  },
  {
    slug: "assisted-pull-up-machine",
    pose: "performing an assisted pull-up on a counterweighted gym machine, kneeling on the lower counterweighted platform pads with one knee on each pad, both hands gripping the overhead handles with palms facing forward, body at the top of the pull-up with chin near the handles, side profile view",
  },
  {
    slug: "dumbbell-row",
    pose: "performing a single-arm dumbbell row, one knee and one hand resting flat on a horizontal bench for support, opposite foot planted on the floor, free arm holding a dumbbell pulled up toward the hip with the elbow drawn back close to the body, back held flat and parallel to the floor, side profile view",
  },
  {
    slug: "dumbbell-biceps-curl",
    pose: "performing a standing dumbbell biceps curl, standing upright with feet shoulder-width apart and both arms holding dumbbells, one arm at the top of the curl with the elbow pinned to the side and the dumbbell raised near the shoulder with palm facing up, other arm extended straight down at the side holding the other dumbbell, front view",
  },
  {
    slug: "face-pull",
    // Phrase carefully — "face pull" + "pulled to forehead" trips OpenAI's
    // moderation safety filter. Use anatomical language (rear-delt, head
    // height, draw apart) and avoid words that read as violent in isolation.
    pose: "performing a cable rear-deltoid drill at a gym cable machine, athletic figure standing upright facing the cable pulley set at head height, both hands gripping the two ends of a long rope attachment, drawing the rope ends apart and rearward so the elbows finish high and wide at shoulder level with the hands beside the temples, the rope splitting into a wide V shape around the head, slight backward lean for stability, front three-quarter view",
  },
];
