/**
 * Every tunable number the game reads lives here, so balancing does not mean
 * hunting through scene code.
 */

/**
 * The screen is a phone rather than a laptop.
 *
 * The *smaller* of the two viewport dimensions, so the answer does not change
 * when the phone is turned. A phone in landscape is around 390 tall; the
 * narrowest laptop is far above 500.
 *
 * This is the one place in the game allowed to ask about the screen. It is read
 * once, at load, to pick a resolution -- gameplay code works in game pixels and
 * never asks again. See CLAUDE.md.
 */
function isPhoneSized(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // `?phone` forces it, so the phone view can be looked at on a laptop without
  // reaching for a phone. Harmless in the built game: it changes nothing but
  // how much of the level fits on the screen.
  if (window.location.search.includes('phone')) {
    return true;
  }

  return Math.min(window.innerWidth, window.innerHeight) < 500;
}

/**
 * The shape of the screen, as a landscape ratio.
 *
 * Taken from the longer side over the shorter one, so the answer is the same
 * whichever way the phone happens to be held when the page loads -- a game that
 * booted in portrait would otherwise pick a tall, narrow canvas and keep it.
 *
 * Clamped: 16:9 at the narrowest, because that is what every level was laid out
 * against, and 21:9 at the widest, because past that the cat is a speck in the
 * middle of a lot of scenery.
 */
function screenAspect(): number {
  if (typeof window === 'undefined') {
    return 16 / 9;
  }

  const long = Math.max(window.innerWidth, window.innerHeight);
  const short = Math.min(window.innerWidth, window.innerHeight);

  return Math.min(21 / 9, Math.max(16 / 9, long / Math.max(1, short)));
}

/**
 * The game is rendered at a fixed logical resolution and then scaled to fill
 * whatever screen it lands on (see `Phaser.Scale.FIT` in main.ts). Gameplay
 * therefore behaves identically everywhere -- only the number of physical
 * pixels per game pixel changes.
 *
 * The **height** is the fixed part: 252 game pixels on a phone, 360 on a
 * laptop. The width is then whatever the screen's own shape asks for, rounded
 * to a whole number of 16px tiles.
 *
 * That is what gets rid of the bars. `FIT` letterboxes whatever it is given, so
 * a canvas fixed at 16:9 on a phone that is 20:9 leaves a black stripe down
 * each side. Matching the canvas to the screen means there is nothing left to
 * letterbox, and a wider phone simply sees a little more of the level.
 *
 * A phone gets a **smaller** logical resolution than a laptop, not a bigger
 * one: `FIT` scales whatever it is given up to the screen, so fewer game pixels
 * means each is drawn larger. At 360 tall a 16px tile lands in about 17
 * physical pixels on a phone, which is a postage stamp; at 252 it is nearer 25.
 */
function pickResolution(): { width: number; height: number } {
  const height = isPhoneSized() ? 252 : 360;
  const tiles = Math.round((height * screenAspect()) / 16);

  return { width: tiles * 16, height };
}

const RESOLUTION = pickResolution();

export const GAME_WIDTH = RESOLUTION.width;
export const GAME_HEIGHT = RESOLUTION.height;

/** Size of one level grid cell, in game pixels. */
export const TILE = 16;

/**
 * How far from the cat a creature goes on living, in game pixels.
 *
 * Nothing on the far side of a 248-tile swamp should be pacing, hunting or
 * scurrying: it costs a frame's work for something nobody can see, and -- far
 * worse -- the sound of it carries the whole way, so a level full of rats
 * sounds like every rat in it at once.
 *
 * **A screen and a half, measured from the cat.** Half a screen of that is what
 * is actually on screen, so everything wakes a full screen before it can be
 * seen. That is the whole point of the number: a creature caught standing still
 * and then starting to walk is worse than one that was never running, and the
 * only way to never see that is to wake them well outside the frame.
 *
 * It is stated in screens rather than pixels so a phone and a laptop get the
 * same rule. They already see nearly the same amount of world -- 640 game
 * pixels across on a laptop against about 544 on a phone -- so this is the same
 * distance either way, to within a tile or two.
 */
export const AWAKE_RANGE = { x: GAME_WIDTH * 1.5, y: GAME_HEIGHT * 1.5 };

/**
 * How far a sound made by something in the world carries, in game pixels.
 *
 * Deliberately **tighter than `AWAKE_RANGE`**, and the two are not the same
 * question. A creature has to start moving well before you could see it, or you
 * catch it standing still; a creature has to stop being *heard* as soon as it
 * stops being near, or a long level is a wall of noise.
 *
 * One screen, so something just off the edge is still audible -- which is
 * right, because it is about to be on the edge.
 */
export const EARSHOT = { x: GAME_WIDTH, y: GAME_HEIGHT };

/**
 * The cat.
 *
 * A cat is wider than it is tall, and gets flatter still when it sneaks, so
 * the two poses use different body sizes. The sprite origin is bottom-centre
 * (see Player) which keeps the paws planted when the pose swaps.
 */
export const CAT = {
  /**
   * Standing pose, in game pixels.
   *
   * 18 is taller than one tile on purpose: it means a one-tile gap under an
   * overhang cannot be walked through, only sneaked through, so the level
   * grid alone can create a sneaking passage with no special markup.
   */
  width: 22,
  height: 18,

  /**
   * Collision width, narrower than the drawing.
   *
   * A one-tile gap is 16px, and a cat as wide as it looks simply bridges one
   * instead of dropping through. Narrowing the body is the usual answer: the
   * cat still *looks* 22 wide, and a gap you can see through is a gap you can
   * fall through.
   */
  bodyWidth: 13,
  sneakBodyWidth: 18,

  /** Sneaking pose: longer and much flatter, like a cat about to pounce. */
  sneakWidth: 26,
  sneakHeight: 9,

  /** Horizontal run speed, px/sec. */
  speed: 190,
  /** How fast the cat reaches full speed on the ground, px/sec^2. */
  accel: 2200,
  /** Ground friction when no direction is held, px/sec^2. */
  friction: 2400,
  /** Reduced control while airborne, as a fraction of `accel`. */
  airControl: 0.55,

  /** Sneaking movement speed, as a fraction of `speed`. A slow, low stalk. */
  sneakSpeedMultiplier: 0.42,

  gravity: 1500,
  /** Upward velocity applied on jump, px/sec. Negative is up. */
  jumpVelocity: -520,
  /** Cap on falling speed so long drops stay readable, px/sec. */
  maxFallSpeed: 600,

  /**
   * Extra downward acceleration applied while the cat is still rising and the
   * jump button has been let go, px/sec^2. This is what makes a jump
   * variable-height.
   *
   * Deliberately a heavier gravity rather than an instant cut to the velocity.
   * Cutting stops the climb dead the moment the button comes up, which feels
   * like the jump was snatched away; weighing it down instead lets the cat coast
   * on a little and settle into the fall.
   */
  jumpReleaseGravity: 2600,

  /**
   * Grace window after walking off a ledge during which a jump still counts.
   * Without it, players who jump a frame or two late feel cheated.
   */
  coyoteTimeMs: 90,

  /**
   * There is no jump buffer. A jump happens on the press or not at all.
   */

  /**
   * Fall speed while pressing against a wall in mid-air, px/sec.
   *
   * Far slower than a free fall (600). Without this the cat drops past a rock
   * face too fast to react, and wall jumping becomes a reflex test rather than
   * a move.
   */
  wallSlideSpeed: 95,

  /**
   * How long a wall stays available to jump from after the cat stops touching
   * it, ms.
   *
   * Without this, a wall jump demands you keep pressing *into* the wall, since
   * pressing away breaks the contact the jump was looking for -- leaving a
   * single frame to press jump in. Pressing away from the wall and jumping is
   * what players actually do, and it is also how they say where they want to
   * go, so the wall is remembered for a moment after it is let go of.
   */
  wallCoyoteMs: 130,

  /**
   * How fast the cat swims up or down, px/sec.
   *
   * A swimming cat is neutrally buoyant: it holds its depth with nothing
   * pressed, and climb and sneak move it up and down. Water is a place to move
   * about in rather than something to struggle out of.
   */
  swimVerticalSpeed: 95,

  /** Horizontal speed in water, as a fraction of `speed`. */
  swimSpeedMultiplier: 0.55,

  /** Upward velocity of one swimming stroke, px/sec. */
  swimStrokeVelocity: -280,

  /**
   * How fast a stroke bleeds off, px/sec^2.
   *
   * Without this a stroke lasts exactly one frame: the next frame writes the
   * steady swimming speed straight over it, and the burst that was meant to
   * carry the cat up out of a pool never happens.
   */
  swimDrag: 900,

  /**
   * How fast the cat sinks until it is under the surface, px/sec.
   *
   * A cat in water is *in* it, not on it. Neutral buoyancy holds whatever depth
   * it is at, which on entering a pool meant floating with only its paws wet --
   * skating across the top of the water. It now sinks until its back is under
   * the surface, and holds depth from there.
   *
   * Slow on purpose: dropping into a pool should settle, not plunge.
   */
  sinkSpeed: 70,

  /**
   * Grace window after letting go of a column, ms.
   *
   * Longer than the ledge coyote time on purpose. Stepping off a ledge is
   * something you see coming; letting go of a rope is not, and there is no edge
   * to read. A short window here is what made jumping off one feel like being
   * stuck to it.
   */
  climbReleaseCoyoteMs: 160,

  /** Speed of climbing a trunk, px/sec. The same going up and coming down. */
  climbSpeed: 95,

  /**
   * Speed of moving sideways while holding on, px/sec.
   *
   * Climbing is not pinned to the middle of a column. Ropes hung side by side
   * make a wall to be crossed as well as climbed, and a cat that snapped to the
   * nearest one could only ever go up and down.
   */
  climbHorizontalSpeed: 74,

  /**
   * How long after stepping off a trunk the cat cannot catch it again, ms.
   *
   * Letting go leaves the cat falling while still overlapping the trunk, and
   * catching a trunk while falling is exactly what the automatic grip does --
   * so without this pause, stepping off re-grabs on the very next frame and the
   * cat can never leave.
   */
  climbCooldownMs: 260,
} as const;

/**
 * How many tries a level gives you.
 *
 * Counted per level rather than across the whole game: running out sends you
 * back to the start of the level you are on, never to an earlier one. Losing an
 * hour to a bad jump is not a lesson, it is a reason to stop playing.
 */
export const LIVES = 3;

/**
 * How many little hearts buy a life.
 *
 * Counted across the whole run, not per level -- no level has a hundred of
 * them in it, and a target you can only ever get most of the way to is not a
 * target. Collecting everything in two or three levels earns one.
 */
export const CHARMS_PER_LIFE = 100;

/**
 * The most little hearts any one level may hold.
 *
 * Fewer than it takes to buy a life, on purpose: a life is always at least two
 * levels of collecting, so it is a reward for playing well over a stretch of
 * the game rather than for combing one room.
 */
export const MAX_CHARMS_PER_LEVEL = 60;

/**
 * The lava lake, which is alive.
 *
 * It boils, it throws heat, and every so often a gobbet of it jumps out and
 * falls back. None of it is a new way to die -- touching lava already kills --
 * it is there so the lake reads as molten rather than as an orange floor.
 */
export const LAVA = {
  /** How long one frame of the boil lasts, ms. Four frames make a cycle. */
  boilFrameMs: 180,

  /** How high the heat haze stands over the surface, px. */
  hazeHeight: 26,

  /** How long one breath of the haze takes, ms. */
  hazeBreathMs: 1600,

  /** Average time between gobbets, ms, across the whole lake. */
  spitEveryMs: 620,

  /** How hard one is thrown, px/sec. Randomised between the two. */
  spitSpeedMin: 170,
  spitSpeedMax: 330,

  /** How far sideways it drifts while it is up, px/sec. */
  spitDrift: 40,

  /** How long one lives before it is gone, ms. */
  spitLifeMs: 1400,
} as const;

/** Things that pace the floor. */
export type GroundEnemyKind = 'hedgehog' | 'rat';

/**
 * A hedgehog ambles; a rat scurries. That is the whole difference, besides
 * what they look like.
 */
export const GROUND_ENEMIES: Record<GroundEnemyKind, { speed: number }> = {
  hedgehog: { speed: 42 },
  rat: { speed: 78 },
};

/**
 * A rat is afraid of you, until it cannot be.
 *
 * It paces like anything else until the cat is close, then turns and **runs**.
 * Cornered -- a wall in front of it, or the end of its ledge -- it stops
 * running and **leaps at your face**, which is the only attack in the game that
 * comes from something trying to get away.
 */
export const RAT = {
  /** How close the cat has to be before it bolts, px. */
  fleeRange: 108,

  /** How much faster it runs away than it walks. */
  fleeSpeedMultiplier: 1.55,

  /** How long it will stay cornered before it jumps, ms. */
  cornerPatienceMs: 260,

  /** The leap: up, and towards the cat. */
  leapVelocity: -330,
  leapSpeed: 150,

  /** How long after a leap before it can do it again, ms. */
  leapCooldownMs: 1400,
} as const;

/**
 * A hedgehog stops to eat.
 *
 * Not on a fixed beat: a creature that pauses every four seconds exactly is a
 * metronome, and one that pauses *about* every four seconds is an animal. The
 * pause is also the only thing that makes a hedgehog readable -- while it is
 * eating it is not coming towards you, and you can walk past it.
 */
export const GRAZING = {
  /** Shortest and longest wait before it stops again, ms. */
  everyMinMs: 3200,
  everyMaxMs: 7000,

  /** How long it stands there eating, ms. */
  forMinMs: 900,
  forMaxMs: 1800,

  /** How often it takes a bite while it is down there, ms. */
  biteEveryMs: 260,
} as const;

/** The piranha, which patrols its pool, chases, and leaps out of it. */
export const PIRANHA = {
  /** How far below the surface it prefers to swim, px. */
  lurkDepth: 14,
  /** Speed while patrolling its own pool, px/sec. */
  swimSpeed: 48,
  /** Speed while chasing a cat that is in the water with it, px/sec. */
  chaseSpeed: 92,
  /** How close a swimming cat has to be before it gives chase, px. */
  chaseRange: 180,
  /** How sharply it turns towards where it is going, per second. */
  turnRate: 3.2,
  /** Upward velocity of a leap, px/sec. */
  leapVelocity: -495,
  /** Time between leaps, ms. Fixed, so the rhythm can be learnt. */
  intervalMs: 2200,
} as const;

/**
 * The spiders in the cave.
 *
 * A spider owns the ceiling the way a hedgehog owns the floor, and it is the
 * first thing in the game that attacks from above without flying. It walks
 * upside down until a cat passes under it, then drops the length of its thread
 * and climbs back.
 *
 * The drop is meant to be survivable by a cat that is moving and fatal to one
 * that stops underneath to look at it.
 */
export const SPIDER = {
  /** Speed of walking along the ceiling, px/sec. Slower than a hedgehog. */
  walkSpeed: 34,

  /** How close the cat has to pass underneath, horizontally, before it drops. */
  dropRange: 44,

  /** How far it lets itself down, px. Just over three tiles. */
  dropLength: 52,

  /** Speed of the drop, px/sec. Fast: the drop is the attack. */
  dropSpeed: 330,

  /** How long it hangs at the bottom before hauling itself back, ms. */
  hangMs: 550,

  /** Speed of the climb back up, px/sec. Slow, so the ceiling is safe for a while. */
  climbSpeed: 80,

  /** How long after getting home before it will drop again, ms. */
  cooldownMs: 800,

  /**
   * How much bigger the one guarding the cave's spare heart is.
   *
   * Ten times, which at 16x12 makes it 160x120 -- a third of the screen. It is
   * not a harder spider, it is a *much larger* one: everything about it scales,
   * so it walks slower relative to its size, reaches further and takes an age
   * to haul itself back up. There is no beating it, only timing it.
   */
  giantScale: 5,

  /** How much of its normal speed a giant one walks and climbs at. */
  giantSlowness: 0.45,
} as const;

/**
 * The crocodiles in the swamp.
 *
 * A crocodile is a platform with a temper: it floats still enough to land on
 * and then goes under, so the water it lies in is crossed by moving rather than
 * by standing. The whole difficulty of the swamp is in these numbers.
 */
export const CROCODILE = {
  /**
   * How long it takes the weight to register, ms.
   *
   * The pause is the whole move: land, read the next one, go. Sinking on
   * contact would make a crossing a reaction test instead of a rhythm.
   */
  sinkDelayMs: 520,

  /** How far under it goes, px. Deep enough that its back is no longer a floor. */
  sinkDepth: 26,

  /** How fast it goes down, px/sec. */
  sinkSpeed: 52,

  /** How fast it comes back up, px/sec. Slower than it sinks: it is in no hurry. */
  riseSpeed: 30,

  /** How long it stays under before surfacing again, ms. */
  submergedMs: 1600,

  /**
   * How close a swimming cat has to be before it comes for you, px.
   *
   * Every crocodile in the pool within this much opens its mouth and turns
   * round. Only the one that reaches you bites, which is the whole shape of it:
   * three of them set off and one of them gets there.
   */
  noticeRange: 260,

  /** Speed of a crocodile swimming at a cat, px/sec. */
  chaseSpeed: 86,

  /** Speed of swimming back to its place afterwards, px/sec. Unhurried. */
  returnSpeed: 46,

  /** How sharply it turns towards where it is going, per second. */
  turnRate: 2.6,

  /** How far it bobs while afloat, px, and how long one bob takes, ms. */
  bobHeight: 1.5,
  bobPeriodMs: 2600,
} as const;

/**
 * The boss: the evil lord beetle at the end of the volcano.
 *
 * It has no health and cannot be beaten, because nothing in this game can. It
 * is a pattern to be read and slipped past, which is what the rest of the game
 * has taught by the time it appears.
 */
export const BOSS = {
  /**
   * How far either side of its lair it sweeps, px.
   *
   * The whole arena, on purpose. At 150 there were sixty pixels of floor at
   * each end the beetle could not reach, and simply running laps between them
   * survived a full minute.
   */
  sweepRadius: 210,
  /**
   * Speed of holding station, px/sec.
   *
   * Above the cat's 190 on purpose. Below it, a cat that simply ran at the door
   * overtook the beetle and was through in two seconds -- it has to be able to
   * stay in front of you.
   */
  sweepSpeed: 215,

  /**
   * How far in front of the cat it plants itself, px.
   *
   * In front meaning *towards the way out*. It does not patrol a beat and hope
   * you walk under it -- it stands between you and the door, so getting past is
   * something you have to do rather than something that happens.
   */
  guardOffset: 74,

  /**
   * How much of the cat's own speed it allows for when taking station, seconds.
   *
   * Without it the beetle aims at where the cat *is*, which for a cat running
   * at the door is always behind where the cat will be -- it trailed sixty
   * pixels back the whole way and never blocked anything.
   */
  guardLeadSeconds: 0.55,

  /**
   * How fast it hauls itself back up after a dive, px/sec.
   *
   * Slow, and that is the whole fight: while it is down and climbing it is not
   * blocking the way. Bait the drop, then go past it.
   */
  riseSpeed: 150,

  /**
   * How far above the arena floor it holds station, px, measured to the bottom
   * of its body.
   *
   * Fourteen: a standing cat is 18 tall and does not fit, a sneaking one is 9
   * and does. So it is literally in the way, and the way past it at floor level
   * is on your belly -- which is exactly what the game has been teaching since
   * the fallen bough in level one.
   */
  guardClearance: 14,

  /**
   * How hard it corrects sideways on the way down, px/sec.
   *
   * Enough that stepping aside at the last instant does not work, little enough
   * that moving early does. It is trying to land *on* you.
   */
  diveTrack: 60,

  /**
   * How hard the sweep leans towards the cat, per second.
   *
   * This is what stops the arena having a safe corner. It used to patrol a
   * fixed beat, so standing at one end of the lair meant it dived where you
   * were not. It now drifts over you and you have to keep moving.
   */
  stalkRate: 7,

  /** How long it hovers between dives, ms, the first time. */
  restMs: 1500,

  /**
   * How much shorter each rest gets, and the shortest it will ever be, ms.
   *
   * It gets angrier. Standing in the arena working out the pattern is meant to
   * be viable for a while and then stop being viable, so the fight has a clock
   * on it without needing a health bar on either side.
   */
  furyStep: 0.84,
  minRestMs: 620,

  /**
   * Extra pause before the *first* attack after the cat arrives, ms.
   *
   * Without it the beetle could already be halfway through its count when you
   * walked in, and drop the moment you arrived. Being hit by something you have
   * not had a chance to look at yet is not a pattern -- you need to see one
   * sweep before you are asked to read one.
   */
  approachGraceMs: 1400,
  /**
   * Speed of sliding into position above the cat, px/sec.
   *
   * Deliberately slower than the drop. This is the telegraph, and it is the
   * whole of the warning you get: fast enough and the boss is simply on top of
   * you, which is not a pattern, it is a coin toss.
   */
  aimSpeed: 245,

  /** Speed of the drop itself, px/sec. */
  diveSpeed: 430,
  /**
   * How far it drops on a dive, px.
   *
   * Deep enough to reach a cat standing on the arena floor. At 120 the dive
   * bottomed out 27px above the cat's head, so the boss was menacing and
   * completely harmless to anyone who simply stood still.
   */
  diveDepth: 175,
  /**
   * How far ahead of the cat it aims, in seconds of the cat's own movement.
   *
   * Without this, running away from it works forever: the cat is faster than
   * the sweep, so a straight line always outran the drop. Leading the target
   * means running in a straight line is the thing that gets you hit, and you
   * have to turn, stop or jump over it instead.
   */
  leadSeconds: 0.5,

  /** How quickly it turns towards where it is going, per second. */
  turnRate: 3,
} as const;

/** The crow, which circles its nest and comes at the cat. */
export const CROW = {
  /** Radius of its patrol circle around the nest, px. */
  circleRadius: 70,
  /** Angular speed of that circle, radians/sec. */
  circleSpeed: 1.5,
  /**
   * How close the cat has to come before it attacks, px.
   *
   * Back to the wide, fierce original. It was narrowed once because the crow
   * guarded something the level *required*; now it guards a spare heart, which
   * is optional, so it can be as unpleasant as it likes.
   */
  attackRange: 150,
  /** How far the cat has to get before it gives up, px. Wider, to stop flicker. */
  releaseRange: 230,
  /** Speed of an attack run, px/sec. */
  attackSpeed: 180,
  /** How quickly the velocity turns towards where it is heading, per second. */
  turnRate: 2.6,
} as const;

/**
 * Level 1: a sunlit forest.
 *
 * Kept as one palette so the generated placeholder art already reads as a
 * single scene, and so real art has a colour reference to match.
 */
export const COLORS = {
  // Sky, from the top of the screen down to the treeline.
  skyTop: 0x5f9fc4,
  skyBottom: 0xe3ecb8,

  // The sun, and the shafts of light coming off it.
  sun: 0xfffbe0,
  sunGlow: 0xffe9a3,
  lightRay: 0xfff4bd,

  // Distant trees are lighter and bluer than near ones: haze in the air makes
  // far away things lose contrast, which is what sells depth.
  treeFar: 0x6e9b86,
  treeFarTrunk: 0x5d7a6b,
  treeMid: 0x477a5f,
  treeMidTrunk: 0x4a3b2c,

  bush: 0x4f8f4a,
  bushDark: 0x3c7038,
  bushLight: 0x6bab5c,

  // The forest floor.
  grass: 0x6fb257,
  grassDark: 0x4f8c3f,
  dirt: 0x6b4f35,
  dirtDark: 0x54402b,

  // Branches, which double as the platforms.
  branch: 0x7d5837,
  branchDark: 0x5c3f27,

  // Standing trunks, darker than a fallen branch so a climbable trunk reads as
  // a different thing from a platform.
  trunk: 0x6a4527,
  trunkDark: 0x4a2f1a,
  trunkLight: 0x8a5f39,
  leaf: 0x5fa049,
  leafLight: 0x7cc25e,

  // The cat: ginger, so it stays readable against all that green.
  cat: 0xe08b4a,
  catDark: 0xb96a2c,
  catLight: 0xf8e4cb,
  catNose: 0xd4645f,

  // Boulders: cool grey against all the warm brown and green, so a climbable
  // rock face never reads as part of a tree.
  rock: 0x8b9199,
  rockDark: 0x666c74,
  rockLight: 0xacb2ba,

  // Water, drawn over the cat rather than behind it, so it swims *in* the pool.
  water: 0x3f86b8,
  waterDeep: 0x2f6a95,
  waterFoam: 0xbfe3f5,

  // Anything that can kill the cat shares one eye colour, so danger reads the
  // same however different the creature is.
  dangerEye: 0xe23b2f,

  bossShell: 0x8e1f1f,
  bossShellDark: 0x5c1212,
  bossSpot: 0x141013,
  bossSpine: 0x2b1f22,
  bossLeg: 0x3a2a2a,

  ratBody: 0x5f5a55,
  ratBelly: 0x8a837c,
  ratTail: 0xc09a94,

  hedgehogBody: 0x8a6a4a,
  hedgehogSpine: 0x4a3524,
  hedgehogFace: 0xc9a582,

  piranhaBody: 0x4c6b58,
  piranhaBelly: 0xc2705a,

  // Warmer and lighter than the swamp water it lies in. The first version was
  // a dark green on dark green and read as a stick.
  crocBack: 0x7a7f3c,
  crocRidge: 0x4a4f22,
  crocBelly: 0xa8ad63,
  crocJaw: 0x5d612b,
  crocMouth: 0x5e2230,
  crocTongue: 0xd4566a,

  // Lighter than a spider ought to be. It hangs in the black of a tunnel
  // mouth, and a properly black spider there is a smudge rather than a threat.
  spiderBody: 0x585066,
  spiderLeg: 0x3e3750,
  spiderMark: 0xd0687e,
  spiderThread: 0xcfd4e0,

  crowBody: 0x1e1f26,
  crowSheen: 0x3b3f4d,
  crowBeak: 0xc8a13c,

  heart: 0xe0333f,
  heartLight: 0xff8a90,

  // A little heart, brighter and pinker than the big ones in the corner so the
  // two are never confused: those are lives, these are what buys one.
  charm: 0xff5d7a,
  charmLight: 0xffa8ba,
  charmShine: 0xffffff,

  uiButton: 0xffffff,
} as const;
