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

  // ───── Warm-up pre-block movements ─────
  {
    slug: "wrist-rocks",
    pose: "on all fours with hands flat on the floor, rocking body weight forward onto the palms with wrists extended and elbows slightly bent, fingers spread wide, knees on floor, side profile view",
  },
  {
    slug: "wrist-push-up-lean",
    pose: "in a push-up plank position with hands flat on the floor fingers pointing forward, shifting body weight forward over the hands so the wrists are fully extended, arms straight, on toes, side profile view",
  },
  {
    slug: "band-dislocates",
    pose: "standing upright holding a resistance band stretched wide overhead with both arms straight, rotating the band rearward so it passes behind the body, arms fully extended forming a large arc, front view",
  },
  {
    slug: "deep-squat-hold",
    pose: "in the bottom of a deep squat with heels flat on the floor, knees wide and tracking over the toes, chest upright, elbows pressed inside the knees with hands together in front, hips below parallel, front three-quarter view",
  },
  {
    slug: "leg-swings",
    pose: "standing on one leg beside a vertical support bar holding it with one hand, the free leg swung forward parallel to the floor with the knee straight, a dynamic hip-flexor stretch, side profile view",
  },
  {
    slug: "wrist-circles",
    pose: "standing upright with both arms extended forward at shoulder height, fingers interlaced, rotating the wrists in a circle, a gentle wrist mobility drill, front three-quarter view",
  },
  {
    slug: "scapular-shrugs",
    pose: "hanging from a pull-up bar with both arms straight and relaxed, shoulders shrugged down and away from the ears by squeezing the shoulder blades, body still, arms remaining straight, front view",
  },
  {
    slug: "arm-circles",
    pose: "standing upright with both arms extended straight out to the sides at shoulder height, tracing large circles, a dynamic shoulder warm-up, front view",
  },
  {
    slug: "wall-slides",
    pose: "standing with back flat against a wall, both arms raised in a goalpost position with elbows and backs of the wrists touching the wall, sliding the arms upward overhead while keeping contact, front view",
  },
  {
    slug: "hip-circles",
    pose: "standing on one leg beside a support, the other knee lifted to hip height and drawn outward in a wide circle to open the hip joint, a dynamic mobility drill, front three-quarter view",
  },
  {
    slug: "ankle-rocks",
    pose: "in a half-kneeling lunge with the front foot flat on the floor, driving the front knee forward past the toes while keeping the heel down, an ankle dorsiflexion mobility drill, side profile view",
  },
  {
    slug: "cat-cow",
    pose: "on all fours with hands under shoulders and knees under hips, the spine rounded upward toward the ceiling in the cat position, head dropped, a spinal mobility drill, side profile view",
  },
  {
    slug: "bird-dog",
    pose: "on all fours with hands under shoulders and knees under hips, extending the opposite arm forward and leg backward until both are level with the flat back, hips square, a core stability drill, side profile view",
  },

  // ───── Push-up variants (additional) ─────
  {
    slug: "wide-push-ups",
    pose: "performing a wide push-up at the bottom position, hands placed roughly 1.5× shoulder width on the floor with elbows flaring to about 60°, chest 2-3 inches from the floor, body straight from head to heels on toes, side profile view",
  },
  {
    slug: "incline-pseudo-planche-push-ups",
    pose: "performing an incline pseudo-planche push-up, hands flat on a sturdy elevated bench with fingers pointing backward toward the hips, shoulders leaned forward over the hands, body straight on toes, elbows bent at the bottom position, side profile view",
  },

  // ───── Handstand / overhead (additional) ─────
  {
    slug: "deficit-wall-handstand-push-ups",
    pose: "performing a deficit wall handstand push-up at the bottom, body fully inverted with heels touching a wall, both hands flat on two raised parallettes or blocks so the head descends below hand level, elbows bent and head just below block height, side profile view",
  },
  {
    slug: "freestanding-handstand-hold",
    pose: "holding a freestanding handstand without wall support, body fully inverted in a straight vertical line, arms locked straight, hands flat on the floor shoulder-width apart, legs together and pointed straight up, fingertips pressing the floor for balance, side profile view",
  },

  // ───── Planche family (additional) ─────
  {
    slug: "frog-stand",
    pose: "performing a frog stand balance, both hands flat on the floor shoulder-width apart with fingers spread, knees resting on the backs of the triceps near the elbows, feet lifted off the floor, body crouched and balanced on the hands only, looking slightly forward, three-quarter front view",
  },
  {
    slug: "tuck-planche-negatives",
    pose: "performing the controlled descent of a tuck planche negative, body in a tuck planche with knees pulled tight to the chest, hips above shoulder level, arms straight, slowly lowering back toward the floor under control, side profile view",
  },
  {
    slug: "straight-arm-frog-stand",
    pose: "performing a straight-arm frog stand, both hands flat on the floor shoulder-width apart with arms fully locked straight, knees resting on the upper arms near the elbows, feet lifted off the floor, body balanced on straight arms only, three-quarter front view",
  },
  {
    slug: "half-lay-planche",
    pose: "performing a half-lay planche on the floor, hands flat on the floor with arms locked straight, body held horizontally off the floor, one leg fully extended straight back and the other knee tucked toward the chest, side profile view",
  },
  {
    slug: "rings-frog-stand",
    pose: "performing a frog stand on gymnastic rings hanging low, both hands gripping the rings with arms slightly bent, knees resting on the backs of the triceps, feet lifted off the floor, body balanced on the rings, three-quarter front view",
  },
  {
    slug: "rings-tuck-planche",
    pose: "performing a tuck planche on gymnastic rings, both hands gripping the rings with arms locked straight and rings turned out at least 45°, entire body lifted off the floor with knees tucked tightly to the chest, hips above hand level, side profile view",
  },
  {
    slug: "rings-straddle-planche",
    pose: "performing a straddle planche on gymnastic rings, both hands gripping the rings with arms locked straight and rings turned out, body held horizontally off the floor parallel to the ground, legs straight and spread wide in a straddle, side profile view",
  },
  {
    slug: "rings-full-planche",
    pose: "performing a full planche on gymnastic rings, both hands gripping the rings with arms locked straight and rings turned out, body held perfectly horizontal and straight parallel to the floor, legs together and toes pointed, side profile view",
  },
  {
    slug: "tuck-planche-push-up",
    pose: "performing a tuck planche push-up, body maintained in a tuck planche throughout with knees tucked to chest and body lifted horizontal, arms at the bottom of a press with elbows slightly bent, side profile view",
  },
  {
    slug: "advanced-tuck-planche-push-up",
    pose: "performing an advanced tuck planche push-up, body in a flat-back tuck planche position with knees 3–6 inches forward of the chest, back parallel to the floor, arms at the bottom of a press with elbows slightly bent, side profile view",
  },
  {
    slug: "straddle-planche-push-up",
    pose: "performing a straddle planche push-up, body held horizontally off the floor with legs spread wide in a straddle, arms locked straight at the top of the push-up, hands on the floor with fingers pointing slightly back, side profile view",
  },
  {
    slug: "full-planche-push-up",
    pose: "performing a full planche push-up, body held fully horizontal and straight parallel to the floor with legs together, arms at the bottom of the press with elbows slightly bent, the body maintained flat throughout, side profile view",
  },

  // ───── Maltese family ─────
  {
    slug: "maltese-lean",
    pose: "performing a maltese lean on gymnastic rings, standing upright between two rings with both hands gripping the rings at hip height, arms extended out wider than shoulder width with a strong forward lean, scapulae protracted, body straight, front view",
  },
  {
    slug: "tuck-maltese",
    pose: "performing a tuck maltese hold on gymnastic rings, both hands gripping the rings with arms locked fully straight and extended wide to the sides at hip level, entire body lifted off the floor with knees tucked tightly to the chest, side profile view",
  },
  {
    slug: "straddle-maltese",
    pose: "performing a straddle maltese hold on gymnastic rings, both hands gripping the rings with arms locked fully straight and extended wide to the sides, body held horizontally parallel to the floor, legs spread wide apart in a straddle, front view",
  },
  {
    slug: "full-maltese",
    pose: "performing a full maltese hold on gymnastic rings, both hands gripping the rings with arms locked fully straight and extended wide to the sides at hip level, body held perfectly horizontal and straight parallel to the floor, legs together and toes pointed, front view",
  },

  // ───── Dip variants ─────
  {
    slug: "pb-jumping-dips",
    pose: "performing a parallel bar jumping dip, body between two parallel bars having jumped to the support position with arms locked straight, beginning the controlled descent with elbows starting to bend, legs hanging below, side profile view",
  },
  {
    slug: "l-sit-dip",
    pose: "performing a parallel bar L-sit dip at the bottom position, body between two parallel bars with elbows bent at 90°, both legs held straight out in front parallel to the floor in an L shape throughout the dip, side profile view",
  },
  {
    slug: "45-forward-lean-dip",
    pose: "performing a 45° forward-lean dip at the bottom position, body between two parallel bars leaning 45° forward with chest angled toward the bars, elbows bent with shoulders below bar height, legs hanging straight, side profile view",
  },
  {
    slug: "one-arm-dip-facing-wall",
    pose: "performing a one-arm dip on a single parallel bar while facing a wall for stability, one hand gripping the bar with that elbow bent at the bottom of the dip, the other arm touching the wall lightly for balance, side profile view",
  },
  {
    slug: "one-arm-dip-parallel-to-wall",
    pose: "performing a one-arm dip on a single bar while standing parallel to a wall, one hand gripping the bar with that elbow bent at the bottom of the dip, body side-on to the wall, side profile view",
  },
  {
    slug: "rings-support-hold",
    pose: "performing a static support hold on gymnastic rings, both hands gripping the rings with arms locked fully straight, body upright with rings beside the hips, legs hanging straight below, front view",
  },
  {
    slug: "rto-support-hold",
    pose: "performing an RTO rings support hold, both hands gripping gymnastic rings with arms locked fully straight and rings turned out as far as possible, body upright between the rings, legs hanging straight below, front view",
  },
  {
    slug: "rings-dip-eccentric",
    pose: "performing the slow eccentric phase of a rings dip, body between two gymnastic rings lowering under control, elbows bent past 90° at the lowest point, rings held steady at the sides, side profile view",
  },
  {
    slug: "rings-l-sit-dip",
    pose: "performing a rings L-sit dip, body between gymnastic rings with elbows bent at the bottom of the dip, both legs held straight out in front parallel to the floor in an L shape throughout, rings beside the hips, side profile view",
  },
  {
    slug: "rings-wide-dip",
    pose: "performing a wide rings dip, body between two gymnastic rings with elbows flaring wide to the sides in a deep pass-through descent, rings at hip level, side profile view",
  },
  {
    slug: "rto-45-past-parallel-dip",
    pose: "performing an RTO rings dip at 45° past parallel, body between gymnastic rings with rings turned out and elbows bent to 45° below the horizontal, a deep descent with rings at hip level, side profile view",
  },
  {
    slug: "rto-75-past-parallel-dip",
    pose: "performing an RTO rings dip at 75° past parallel, body between gymnastic rings with rings turned out and shoulders descending very deep below the rings to 75° past horizontal, rings at hip level, side profile view",
  },
  {
    slug: "rto-90-past-parallel-dip",
    pose: "performing an RTO rings dip at full 90° past parallel, body between gymnastic rings with rings turned out and shoulders at the lowest possible point fully 90° below horizontal, rings at hip level, side profile view",
  },

  // ───── RTO push-up variants ─────
  {
    slug: "rings-wide-push-up",
    pose: "performing a wide push-up on gymnastic rings, hands gripping two rings set wider than shoulder width, body in push-up position at the bottom with elbows bent, body straight on toes, side profile view",
  },
  {
    slug: "rings-push-up",
    pose: "performing a push-up on gymnastic rings, hands gripping two rings stacked under the shoulders, body in push-up position at the bottom with elbows bent, body straight on toes, rings stabilized, side profile view",
  },
  {
    slug: "rto-push-up",
    pose: "performing an RTO push-up on gymnastic rings at the top lockout, both hands gripping the rings with arms locked straight and rings turned fully out, body in a rigid push-up plank on toes, side profile view",
  },
  {
    slug: "rto-archer-push-up",
    pose: "performing an RTO archer push-up on gymnastic rings, body lowered to one side with that elbow bent while the other arm stays straight along the ring strap, rings turned out at the top, body on toes, three-quarter front view",
  },
  {
    slug: "rto-40-lean-pppu",
    pose: "performing an RTO pseudo-planche push-up with a 40° forward lean on gymnastic rings, body leaning 40° forward over the rings, rings turned out, hands near the hips, at the top lockout with arms straight, body rigid on toes, side profile view",
  },
  {
    slug: "rto-60-lean-pppu",
    pose: "performing an RTO pseudo-planche push-up with a 60° forward lean on gymnastic rings, body leaning 60° forward so the shoulders are well ahead of the rings, rings turned out and hands near the hips, body rigid on toes at the top lockout, side profile view",
  },
  {
    slug: "rto-maltese-push-up",
    pose: "performing an RTO maltese push-up on gymnastic rings, body in a push-up plank with hands at extreme protraction and rings turned out, scapulae maximally protracted forward, at the top lockout on toes, side profile view",
  },
  {
    slug: "wall-pppu",
    pose: "performing a pseudo-planche push-up with feet on a wall, body inverted at an incline with feet flat against a wall and hands on the floor with fingers pointing backward toward the hips, shoulders leaning forward, elbows slightly bent, side profile view",
  },
  {
    slug: "rings-wall-pppu",
    pose: "performing a pseudo-planche push-up on gymnastic rings with feet on a wall, body inclined with feet flat against the wall and hands gripping rings positioned near the hips, elbows slightly bent at the bottom, side profile view",
  },
  {
    slug: "wall-maltese-push-up",
    pose: "performing a wall pseudo-planche push-up with hands widened toward maltese position, feet on a wall, body inclined with hands on the floor at a very wide placement near the hips, scapulae protracted, at the bottom of a press, side profile view",
  },
  {
    slug: "rings-wall-maltese-push-up",
    pose: "performing a rings wall maltese push-up, feet on a wall, body inclined with hands gripping rings at a very wide maltese hand position near the hips, rings turned out, at the bottom of a press, side profile view",
  },

  // ───── One-arm push-up variants ─────
  {
    slug: "hands-elevated-one-arm-push-up",
    pose: "performing a one-arm push-up with the single hand on an elevated surface such as a bench, the other arm tucked behind the back, feet wide apart for stability, body straight and inclined, elbow bent at the bottom position, side profile view",
  },
  {
    slug: "straddle-one-arm-push-up",
    pose: "performing a one-arm push-up with legs spread very wide apart on the floor, one hand flat on the floor under the chest, the other arm tucked behind the back, body straight, elbow bent at the bottom position, front three-quarter view",
  },
  {
    slug: "rings-straddle-one-arm-push-up",
    pose: "performing a one-arm push-up on a single gymnastic ring with legs spread wide in a straddle, one hand gripping the ring at the bottom of the press, the other arm held out to the side for balance, body straight, three-quarter front view",
  },
  {
    slug: "rings-straight-body-one-arm-push-up",
    pose: "performing a one-arm push-up on a gymnastic ring with feet together, one hand gripping the ring at the bottom of the press, the other arm held at the side, body perfectly straight from head to heels, side profile view",
  },

  // ───── Knuckle / fingertip holds ─────
  {
    slug: "knuckle-push-up-hold",
    pose: "holding the top position of a push-up supported on closed fists (knuckles) with wrists straight, arms locked straight, body in a rigid plank position on toes, the forearm-to-hand line perfectly straight, side profile view",
  },
  {
    slug: "fingertip-push-up-hold",
    pose: "holding the top position of a push-up balanced on the fingertips, fingers spread wide with knuckles slightly bent, arms locked straight supporting the body in a rigid plank on toes, side profile view",
  },
  {
    slug: "scapular-push-ups",
    pose: "performing a scapular push-up in a straight-arm plank, body in a push-up plank on toes with arms fully locked straight throughout, the chest lowering slightly as the shoulder blades retract then the floor pushed away as the scapulae protract, side profile view",
  },

  // ───── Lever family (additional) ─────
  {
    slug: "advanced-tuck-front-lever",
    pose: "performing an advanced tuck front lever, hands gripping a horizontal bar overhead with arms locked straight, body inverted and lifted to horizontal facing the ceiling, knees pushed 3–6 inches forward of the chest with hips open at ~90°, side profile view",
  },
  {
    slug: "straddle-front-lever",
    pose: "performing a straddle front lever, hands gripping a horizontal bar overhead with arms locked straight, body held perfectly horizontal facing the ceiling, legs straight and spread wide apart in a straddle, side profile view",
  },
  {
    slug: "one-leg-front-lever",
    pose: "performing a one-leg front lever, hands gripping a horizontal bar overhead with arms locked straight, body held horizontal facing the ceiling, one leg extended fully straight back while the other knee is tucked toward the chest, side profile view",
  },
  {
    slug: "tuck-back-lever",
    pose: "performing a tuck back lever, hands gripping a horizontal bar overhead with arms locked straight and a supinated grip, body inverted and pulled to horizontal facing the floor, knees tucked tightly to the chest, side profile view",
  },
  {
    slug: "advanced-tuck-back-lever",
    pose: "performing an advanced tuck back lever, hands gripping a horizontal bar with a supinated grip and arms locked straight, body horizontal facing the floor, hips opened to approximately 90° while keeping the back flat, side profile view",
  },
  {
    slug: "straddle-back-lever",
    pose: "performing a straddle back lever, hands gripping a horizontal bar with a supinated grip and arms locked straight, body held perfectly horizontal facing the floor, legs straight and spread wide apart in a straddle, side profile view",
  },
  {
    slug: "half-lay-back-lever",
    pose: "performing a half-lay back lever, hands gripping a horizontal bar with a supinated grip and arms locked straight, body horizontal facing the floor, one leg extended fully straight and the other knee tucked toward the chest, side profile view",
  },
  {
    slug: "back-lever-pullout",
    pose: "performing a back lever pullout, holding a full back lever position with body horizontal facing the floor and arms straight, beginning the concentric pull upward toward the support position, side profile view",
  },
  {
    slug: "front-lever-pull-to-inverted-hang",
    pose: "performing a straight-arm pull from a front lever toward an inverted hang, starting from the front lever position with body horizontal facing the ceiling, arms locked straight, body beginning to rotate upward to vertical, side profile view",
  },
  {
    slug: "tuck-front-lever-row",
    pose: "performing a tuck front lever row, hands gripping a horizontal bar with arms pulled in so the body reaches tuck front lever, body horizontal facing the ceiling with knees tucked to chest, pausing at the top, side profile view",
  },
  {
    slug: "straddle-front-lever-row",
    pose: "performing a straddle front lever row, hands gripping a horizontal bar pulling the body to straddle front lever position, body horizontal facing the ceiling with legs spread wide in a straddle and arms straight, side profile view",
  },
  {
    slug: "full-front-lever-row",
    pose: "performing a full front lever row, hands gripping a horizontal bar with the body held fully horizontal facing the ceiling, legs together and body perfectly straight, arms pulled to the minimal range of this elite hold, side profile view",
  },
  {
    slug: "iron-cross-assisted",
    pose: "performing a band-assisted iron cross on gymnastic rings, body hanging vertically between two rings with arms extended horizontally outward to each side at shoulder height, elbows fully locked, a resistance band providing upward assistance, front view",
  },
  {
    slug: "iron-cross",
    pose: "performing a full iron cross on gymnastic rings, body hanging vertically upright between two rings with arms extended perfectly horizontal outward to each side at shoulder height, elbows locked straight, front view",
  },
  {
    slug: "iron-cross-to-back-lever",
    pose: "performing the transition from an iron cross to a back lever, body rotating from the vertical iron cross position with arms extended wide toward the horizontal back lever position facing the floor, mid-rotation with arms still extended, side profile view",
  },
  {
    slug: "iron-cross-pullout",
    pose: "performing an iron cross pullout, holding the iron cross with arms extended horizontal and body vertical, beginning the concentric pull upward toward the support position above the rings, front view",
  },

  // ───── Muscle-up variants ─────
  {
    slug: "muscle-up-negative",
    pose: "performing the descent phase of a muscle-up negative, body above a horizontal bar in the support position, arms beginning to bend as the body lowers through the transition point at chest level, front view",
  },
  {
    slug: "kipping-muscle-up",
    pose: "performing a kipping muscle-up at the explosive hip-drive phase, body hanging from a horizontal bar with hips swung forward and upward, generating the kip momentum to rise above the bar, side profile view",
  },
  {
    slug: "bar-muscle-up",
    pose: "performing a strict bar muscle-up at the transition phase, body pulling over a horizontal bar using a false grip, chest at bar level with elbows just clearing the bar and arms beginning to extend into the support dip, side profile view",
  },
  {
    slug: "l-sit-muscle-up",
    pose: "performing an L-sit muscle-up, pulling above a horizontal bar with both legs held straight out in front parallel to the floor in an L-sit position throughout the pull and transition, side profile view",
  },

  // ───── Pull-up variants ─────
  {
    slug: "jumping-pull-up",
    pose: "performing the eccentric phase of a jumping pull-up, starting at the top with chin above a pull-up bar after jumping up, now lowering slowly over 5 seconds with elbows bent, both hands gripping the bar overhead, front view",
  },
  {
    slug: "pullover",
    pose: "performing a bar pullover at the peak, both hands gripping a horizontal bar with the body swinging hips upward over the bar until the hips clear it and the body transitions to a front support position above the bar, side profile view",
  },
  {
    slug: "kipping-pull-up",
    pose: "performing a kipping pull-up at the hip-drive phase, both hands gripping a horizontal bar with palms facing away, body swinging in a hollow-to-arch kip with hips driving forward and upward just before the pull, side profile view",
  },
  {
    slug: "rings-l-sit-pull-up",
    pose: "performing a pull-up on gymnastic rings while holding an L-sit, both hands gripping the rings at the top of the pull with chin near the rings, both legs held straight out in front parallel to the floor in an L shape, side profile view",
  },
  {
    slug: "rings-wide-grip-pull-up",
    pose: "performing a wide-grip pull-up on gymnastic rings, both hands gripping rings set very wide apart with palms facing away, body pulled up to chin level with rings, elbows bent wide, body hanging straight below, front view",
  },
  {
    slug: "rings-archer-pull-up",
    pose: "performing a rings archer pull-up, both hands gripping gymnastic rings, body pulled up and shifted toward one ring with that elbow fully bent while the other arm stays straight along the strap, front view",
  },
  {
    slug: "oac-eccentric",
    pose: "performing the eccentric phase of a one-arm chin-up, one hand gripping a horizontal bar with a supinated grip, the body at the top with chin near the bar, slowly lowering over 6–10 seconds with one elbow bent, the other arm hanging free at the side, front view",
  },
  {
    slug: "one-arm-chin-up",
    pose: "performing a one-arm chin-up at the top position, one hand gripping a horizontal bar with a supinated grip, chin just above the bar, single elbow fully bent and pulled down toward the ribs, the other arm hanging free at the side, front view",
  },
  {
    slug: "oac-15-lb",
    pose: "performing a one-arm chin-up at the top position with a weight belt around the waist, one hand gripping a horizontal bar with a supinated grip, chin above the bar, single elbow fully bent, additional weight plate hanging from the belt, front view",
  },
  {
    slug: "typewriter-pull-up",
    pose: "performing a typewriter pull-up, both hands gripping a horizontal bar with chin held above bar height, body sliding laterally so one elbow is fully bent pulling toward one side while the other arm extends straighter, front view",
  },
  {
    slug: "false-grip-hang",
    pose: "performing a false-grip hang from a gymnastic ring, one wrist folded over the top of the ring so the ring rests in the crook of the wrist, arm hanging straight below the ring, a grip conditioning drill, front three-quarter view",
  },
  {
    slug: "chest-to-bar-pull-up",
    pose: "performing a chest-to-bar pull-up at the top position, both hands gripping a horizontal bar with palms facing away, the sternum touching the bar, elbows bent and pulled down wide, body hanging straight below, front view",
  },
  {
    slug: "weighted-pull-up",
    pose: "performing a weighted pull-up at the top position, both hands gripping a horizontal bar with palms facing away, chin above the bar, elbows fully bent, a weight plate hanging from a dip belt around the waist, front view",
  },
  {
    slug: "weighted-pull-up-25-bw",
    pose: "performing a weighted pull-up at the top position, both hands gripping a horizontal bar, chin above the bar, a weight equal to 25% of bodyweight hanging from a dip belt around the waist, front view",
  },
  {
    slug: "weighted-pull-up-50-bw",
    pose: "performing a weighted pull-up at the top position, both hands gripping a horizontal bar, chin above the bar, a weight equal to 50% of bodyweight hanging from a dip belt around the waist, front view",
  },
  {
    slug: "weighted-pull-up-70-bw",
    pose: "performing a weighted pull-up at the top position, both hands gripping a horizontal bar, chin above the bar, a heavy weight equal to 70% of bodyweight hanging from a dip belt around the waist, front view",
  },
  {
    slug: "weighted-pull-up-90-bw",
    pose: "performing a weighted pull-up at the top position, both hands gripping a horizontal bar, chin above the bar, an extreme weight equal to 90% of bodyweight hanging from a dip belt around the waist, front view",
  },

  // ───── Ring rows ─────
  {
    slug: "ring-row-eccentric",
    pose: "performing the slow eccentric phase of a ring row, body straight at a reclined angle under two gymnastic rings, both hands gripping the rings at chest level at the top, slowly lowering the body away from the rings with elbows extending, side profile view",
  },
  {
    slug: "ring-row",
    pose: "performing a ring row at the top, body straight at a reclined angle under two gymnastic rings hanging from above, both hands gripping the rings pulled to the chest with elbows bent and drawn back, heels on the floor, side profile view",
  },
  {
    slug: "wide-ring-row",
    pose: "performing a wide ring row at the top, body reclined straight under gymnastic rings, both hands gripping the rings pulled to the chest with elbows flared 60–90° wide to the sides, heels on the floor, side profile view",
  },
  {
    slug: "archer-ring-row",
    pose: "performing an archer ring row at the top, body reclined under gymnastic rings, pulling toward one side with that elbow bent to the chest while the other arm stays straight along the ring strap, body straight, side profile view",
  },
  {
    slug: "one-arm-row",
    pose: "performing a one-arm ring row at the top, body reclined at an angle under a single gymnastic ring, one hand gripping the ring pulled to the chest with elbow bent back, the other arm held at the side, heels on the floor, body straight, side profile view",
  },

  // ───── German hang / shoulder extension ─────
  {
    slug: "german-hang",
    pose: "performing a german hang from gymnastic rings with feet elevated, both hands gripping the rings with a supinated grip, body inverted and arched backward so the arms are extended behind the body in deep shoulder extension, a shoulder mobility hold, side profile view",
  },

  // ───── Handstand press family ─────
  {
    slug: "box-headstand-push-up",
    pose: "performing a box headstand push-up, feet elevated on a sturdy box behind the body, body in a pike position with hips high, head lowered between the hands with elbows bent at the bottom of a press, hands on the floor in front, side profile view",
  },
  {
    slug: "wall-hspu-eccentric",
    pose: "performing the slow eccentric descent of a wall handstand push-up, body fully inverted with heels against a wall, hands flat on the floor, elbows bent midway through a 5–10 second controlled lowering, side profile view",
  },
  {
    slug: "freestanding-headstand-push-up",
    pose: "performing a freestanding headstand push-up at the top position, body balanced upside down in a headstand with no wall support, both hands and the crown of the head forming a triangle on the floor, arms locked straight at full press, side profile view",
  },
  {
    slug: "wall-straddle-press-eccentric",
    pose: "performing the eccentric phase of a straddle press to handstand at a wall, body inverted in a handstand with heels against the wall, slowly lowering in a straddle press descent with legs spreading wide as the hips descend, side profile view",
  },
  {
    slug: "elevated-straddle-press-to-handstand",
    pose: "performing a straddle press to handstand from an elevated box, both hands on a raised platform with legs straddled wide pressing from the floor upward through the straddle press motion to a handstand, mid-press with hips ascending, side profile view",
  },
  {
    slug: "straddle-press-to-handstand",
    pose: "performing a straddle press to handstand from the floor, both hands flat on the floor with legs straddled wide, body mid-press with hips rising and legs lifting off the floor into the pressing motion toward a handstand, side profile view",
  },
  {
    slug: "l-sit-straddle-press-to-handstand",
    pose: "performing a straddle press to handstand starting from an L-sit, hands on parallettes with legs starting parallel then straddling wide as the hips rise in the press toward a handstand, mid-press phase, side profile view",
  },
  {
    slug: "pike-press-to-handstand",
    pose: "performing a pike press to handstand, both hands flat on the floor with legs together in a tight pike position, body mid-press with hips elevated and legs beginning to rise overhead in the pressing motion toward a handstand, side profile view",
  },
  {
    slug: "bent-arm-press-to-handstand",
    pose: "performing a bent-arm press to handstand midway, both hands on the floor with elbows bent no more than 90°, body rising from a pike or straddle position toward the inverted handstand with hips above the hands, side profile view",
  },

  // ───── Biceps / pulling accessories ─────
  {
    slug: "banded-biceps-curl",
    pose: "performing a standing banded biceps curl, both feet standing on a resistance band, both elbows pinned to the sides, curling the band upward with palms facing up at the top of the curl with biceps contracted, front view",
  },
  {
    slug: "cable-biceps-curl",
    pose: "performing a standing cable biceps curl at a gym cable machine, standing facing the pulley with elbows pinned to the sides, one or both arms curling the cable attachment upward to the top of the curl with palms facing up, front view",
  },

  // ───── Hip hinge / posterior chain ─────
  {
    slug: "banded-good-morning",
    pose: "performing a banded good morning, standing upright with a resistance band looped under both feet and over the shoulders behind the neck, hinging forward at the hips with a flat back and slight knee bend until the torso is near horizontal, side profile view",
  },
  {
    slug: "hip-thrust",
    pose: "performing a hip thrust at the top position, shoulders resting on a horizontal bench behind the body, feet flat on the floor with knees bent to 90°, hips driven fully up so the body forms a straight line from shoulders to knees, glutes squeezed hard at the top, side profile view",
  },
  {
    slug: "romanian-deadlift",
    pose: "performing a Romanian deadlift at mid-range, standing with a barbell or dumbbells held in both hands, hinging forward at the hips with a flat back and slight knee bend, the weight lowering along the legs, torso at approximately 45° to the floor, side profile view",
  },
  {
    slug: "single-leg-rdl",
    pose: "performing a single-leg Romanian deadlift at mid-range, balancing on one leg, the free leg extending straight back behind the body, torso hinging forward with a flat back so the body approaches horizontal, arms holding a weight straight down, side profile view",
  },
  {
    slug: "swiss-ball-leg-curl",
    pose: "performing a Swiss ball leg curl, lying on the back on the floor with heels on top of a large exercise ball, hips lifted off the floor, curling the ball toward the glutes with knees bending and heels pressing the ball, side profile view",
  },
  {
    slug: "nordic-hamstring-curl-assisted",
    pose: "performing a band-assisted Nordic hamstring curl, kneeling on a soft pad with feet anchored under a fixed support and a resistance band providing upward assistance, body lowering forward under control from vertical toward horizontal, side profile view",
  },

  // ───── Leg / squat variants ─────
  {
    slug: "full-squat",
    pose: "performing a deep full squat at the bottom, thighs below parallel with calves, heels flat on the floor, knees tracking over toes, torso upright with arms extended forward for balance, side profile view",
  },
  {
    slug: "cossack-squat",
    pose: "performing a cossack squat at the bottom, weight shifted to one side with that knee bent deeply and thigh near horizontal, the other leg extended straight out to the side with the foot flat on the floor, torso upright, three-quarter front view",
  },
  {
    slug: "weighted-pistol-squat-1-2x-bw",
    pose: "performing a pistol squat at the bottom position holding a dumbbell or weight vest adding 20% extra load, balancing on one leg in a deep one-leg squat below parallel, the other leg extended straight forward, arms holding the weight in front, side profile view",
  },
  {
    slug: "weighted-pistol-squat-1-5x-bw",
    pose: "performing a pistol squat at the bottom position with significant added weight on a weight vest or dumbbell, balancing on one leg below parallel, the other leg extended straight forward, side profile view",
  },
  {
    slug: "weighted-pistol-squat-2-0x-bw",
    pose: "performing a pistol squat at the bottom position with heavy added weight, balancing on one leg in a full deep one-leg squat, the other leg straight forward, a heavy dumbbell or loaded vest visible, side profile view",
  },

  // ───── Core (additional) ─────
  {
    slug: "one-arm-one-leg-plank",
    pose: "performing a diagonal plank on one forearm and the opposite leg, body held straight and rigid with one forearm on the floor and the diagonally opposite foot on the floor, the other arm extended straight forward and the other leg extended straight back, hips square, side profile view",
  },
  {
    slug: "knees-ab-wheel",
    pose: "performing an ab-wheel rollout from the knees, kneeling on the floor with both hands gripping an ab wheel, rolling the wheel forward until the arms are fully extended overhead and the body is almost flat, no lower-back sag, side profile view",
  },
  {
    slug: "ab-wheel-eccentric",
    pose: "performing a slow ab-wheel eccentric rollout, kneeling on the floor with hands gripping an ab wheel, rolling forward slowly with control until the body is nearly flat with arms fully extended, side profile view",
  },
  {
    slug: "full-ab-wheel",
    pose: "performing a standing ab-wheel rollout at the fully extended position, starting from standing with both hands gripping an ab wheel and rolling out until the body is fully horizontal and extended flat above the floor with arms straight overhead, side profile view",
  },
  {
    slug: "ab-wheel-20-lb",
    pose: "performing a standing ab-wheel rollout at the fully extended position while wearing a 20 lb weighted vest, body horizontal with arms straight overhead gripping the ab wheel, side profile view",
  },
  {
    slug: "one-arm-ab-wheel",
    pose: "performing a one-arm ab-wheel rollout, kneeling on the floor with a single hand gripping an ab wheel and the other arm held behind the back, rolling the wheel forward until the single arm is extended overhead, side profile view",
  },
  {
    slug: "tuck-dragon-flag",
    pose: "performing a tuck dragon flag, lying on a bench with shoulders anchored by hands gripping above the head, body raised off the bench with knees tucked tightly to the chest, hips above the bench, side profile view",
  },
  {
    slug: "dragon-flag",
    pose: "performing a dragon flag at the lowered position, lying on a bench with shoulders anchored, body held rigid and straight in one line from shoulders to feet, slowly lowering so the straight body is just above the bench parallel to it, side profile view",
  },
  {
    slug: "straddle-l-sit",
    pose: "seated and supporting the whole body on two parallettes, one hand on each parallette beside the hips with arms locked straight, hips lifted off the floor, both legs straight and raised to horizontal in a wide V-shape, a gymnastic L-sit hold, viewed from a high front three-quarter angle",
  },
  {
    slug: "rto-l-sit",
    pose: "performing an L-sit on gymnastic rings with rings turned out, both hands gripping the rings at hip level with arms locked straight and rings rotated outward, body pressed up with both legs extended straight forward in an L shape, front view",
  },
  {
    slug: "45-v-sit",
    pose: "performing a 45° V-sit hold, sitting on the floor with hands beside the hips and arms locked straight pressing the body up, both legs extended straight forward and elevated to approximately 45° above horizontal forming a V shape with the torso, side profile view",
  },
  {
    slug: "90-v-sit",
    pose: "performing a 90° V-sit hold, sitting on the floor with hands beside the hips and arms locked straight, both legs extended straight and raised to near-vertical at approximately 90° from the torso, body compressed into a tight V shape, side profile view",
  },
  {
    slug: "full-v-sit",
    pose: "performing a full V-sit hold, sitting on the floor with hands beside the hips and arms locked straight, both legs extended straight and raised past vertical at 150° or more from horizontal, hips elevated above shoulders, extreme hip flexion, side profile view",
  },
  {
    slug: "manna",
    pose: "performing a manna hold on the floor, hands flat on the floor with arms locked straight, hips lifted well above shoulder height and legs angled overhead past vertical, body in a deep pike compression with extreme hip-above-shoulder elevation, side profile view",
  },
  {
    slug: "compression-drill",
    pose: "performing a seated compression drill, sitting on the floor with both hands flat on the floor beside the hips pressing down, knees bent and lifting toward the chest as the hands press toward the feet, a hip-flexor and compression strength drill, side profile view",
  },

  // ───── Handstand and skill holds ─────
  {
    slug: "one-arm-handstand",
    pose: "performing a one-arm freestanding handstand, body fully inverted upside down balanced on a single hand flat on the floor with the arm locked straight, the other arm held at the side for micro-balance, body in a straight vertical line, front view",
  },
  {
    slug: "rings-handstand",
    pose: "performing a handstand on gymnastic rings, body fully inverted upside down with both hands gripping the rings, arms locked straight, body in a straight vertical line, the rings held steady, front view",
  },
  {
    slug: "two-arm-elbow-lever",
    pose: "performing a two-arm elbow lever, both palms flat on the floor with elbows bent at approximately 120° and digging into the abdomen, body leaning forward until it is held perfectly horizontal parallel to the floor, legs straight, side profile view",
  },
  {
    slug: "one-arm-elbow-lever",
    pose: "performing a one-arm elbow lever, one palm flat on the floor with that elbow bent and digging into the abdomen, body leaning toward the planted arm until it is held approximately horizontal parallel to the floor, legs straight, side profile view",
  },

  // ───── Human Flag family ─────
  {
    slug: "tuck-human-flag",
    pose: "performing a tuck human flag on a vertical pole, one hand gripping the pole higher and pushing, the other hand lower and pulling, body held sideways off the pole with knees tucked tightly to the chest, front view",
  },
  {
    slug: "straddle-human-flag",
    pose: "performing a straddle human flag on a vertical pole, one hand pushing high on the pole and the other pulling lower, body held sideways and approximately horizontal off the pole, legs spread wide in a straddle, front view",
  },
  {
    slug: "full-human-flag",
    pose: "performing a full human flag on a vertical pole, one hand pushing high on the pole and the other pulling at a lower position, body held perfectly horizontal and straight sideways off the pole, legs together and straight, front view",
  },
];
