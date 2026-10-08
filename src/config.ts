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
/**
 * `?touch` shows the on-screen touch controls on a laptop, driven by the mouse,
 * and with them the phone-sized view they were laid out for. A test aid for
 * looking at the controls without a phone.
 */
export const TOUCH_PREVIEW =
  typeof window !== 'undefined' && window.location.search.includes('touch');

function isPhoneSized(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // `?phone` forces it, so the phone view can be looked at on a laptop without
  // reaching for a phone. Harmless in the built game: it changes nothing but
  // how much of the level fits on the screen.
  if (window.location.search.includes('phone') || TOUCH_PREVIEW) {
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
 * The darkness inside the ground -- see `world/GroundShade.ts`.
 *
 * A surface is lit; a tile in, the ground is a mass. `start` and `full` are
 * distances from the nearest air in pixels: nothing is darkened closer than
 * `start`, and from `full` on the ground is as dark as it gets, `max`. The
 * colour comes from each theme's palette.
 */
/**
 * How far below the bank a pool's surface is drawn, px. The grass on the bank
 * always stands above the water. The swimmable zone is not lowered.
 */
export const WATER_DROP = 3;

export const GROUND_SHADE = {
  start: 6,
  full: 44,
  // The fade finishes: deep ground is a flat tone, with no texture left in
  // it, and void (`_`) is that same tone, so the two never show a seam. The
  // tone itself is each theme's `shade`, chosen to be exactly as dark as the
  // old 0.8 over earth was -- nothing got darker when this went to 1.
  max: 1,
} as const;

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

  /** Frames per second for the walk, climb and swim cycles. */
  animFrameRate: 8,

  /**
   * Frames per second of the sneak cycle. Faster than `animFrameRate`, not
   * slower: the paws only shift a pixel per frame, so at the walk's pace or
   * below the stalk read as a stutter. Settled by eye in play.
   */
  sneakAnimFrameRate: 12,

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
   * Downward pull while swimming, only a fraction of ordinary gravity
   * (1500), px/sec^2.
   *
   * A swimming cat is not perfectly neutrally buoyant after all: left alone
   * it now drifts slowly toward the bottom rather than hanging at a fixed
   * depth forever, capped at `sinkSpeed` so it settles rather than free-falls.
   * A tenth of ordinary gravity reads as a slow sink rather than a fall.
   */
  swimGravity: 150,

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
 * The score is time, and lower is better: every second in a level counts,
 * and every death adds a minute on top. Shown once, on the victory screen.
 */
export const SCORE = {
  /** What a death costs, ms. */
  deathPenaltyMs: 60_000,
} as const;

/**
 * The most heart slots a run can ever hold, however many spare hearts and
 * hundred-charm bonuses it finds. Seven is more than double the start:
 * enough that finding every spare heart in the game (there are three) still
 * feels like it is going somewhere, not so much that the row of hearts stops
 * fitting the corner of the screen it lives in.
 */
export const MAX_LIVES = 7;

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
  /**
   * How far the surface stands *above* its own cell, px. Lava is not water:
   * it does not sit in its basin but heaps up over it, so a lake level with
   * the land stands proud of it, and spills over the edges (see `lipWidth`).
   * The rectangle that kills rises with it.
   */
  rise: 3,
  /**
   * How far a tongue of lava creeps onto a ground tile beside the surface,
   * px, and how thick it lies on it.
   */
  lipWidth: 4,
  lipThickness: 5,
  /**
   * How far from a bank the raised crust stops killing, px. One pixel: a
   * body exactly on the edge lives, a body over it does not. A toe's width
   * and a body's width were both tried and were too kind.
   */
  bankMercy: 1,

  /** How long one frame of a pool's boil lasts, ms. Eight frames make a cycle. */
  boilFrameMs: 180,
  /** Average time between wisps of heat lifting off the surface, ms, across the lake. */
  wispEveryMs: 260,
  /** How long a wisp lives, ms, and how fast it rises, px/sec. */
  wispLifeMs: 1800,
  wispRise: 22,

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
export type GroundEnemyKind = 'hedgehog' | 'rat' | 'camel';

/**
 * A hedgehog ambles; a rat scurries. That is the whole difference, besides
 * what they look like.
 */
export const GROUND_ENEMIES: Record<GroundEnemyKind, { speed: number }> = {
  hedgehog: { speed: 42 },
  rat: { speed: 78 },
  // A camel ambles, slowly, hurts nobody, and the cat can stand on its back
  // and be carried along.
  camel: { speed: 20 },
};

/**
 * The worms of the desert. Each lives under the sand with a mound for a
 * hole, and now and then comes up out of it to **look about** -- without
 * warning, on its own clock. A cat within `huntRange` when it looks is
 * seen: it watches the cat, goes back down, and the hunt under the sand,
 * the churn and the lunge follow. Touching the part that is out kills.
 */
export const WORM = {
  /** How tall it stands for the look, px. */
  height: 30,
  /** How long it stays under between looks, ms, least and most. */
  hiddenMinMs: 1800,
  hiddenMaxMs: 3600,
  /** The look: how long the rise, the looking about and the sink take, ms. */
  riseMs: 320,
  lookMs: 900,
  sinkMs: 450,
  /** How far it leans toward the cat while looking, degrees from upright. */
  lookLean: 25,
  /**
   * Worms are afraid of camels: with one this near its mound, px, a worm
   * stays under the sand, and one that is up goes down at once. Riding a
   * camel is the safe way over the mounds.
   */
  fearRange: 40,
  /**
   * The lunge. A cat this near the mound, px, is prey: the worm comes out
   * *at* it -- fast, further than it stands on its own, leaning toward the
   * cat by up to `maxLean` degrees from upright and following it while it
   * rises -- snaps, and sinks. Then it needs `lungeCooldownMs` under the
   * sand before it can lunge again, which is the gap to run through.
   */
  senseRange: 48,
  lungeHeight: 44,
  lungeMs: 170,
  snapMs: 260,
  maxLean: 70,
  lungeCooldownMs: 1100,
  /**
   * The hunt. A cat within `huntRange`, px, of a hidden worm is followed:
   * the worm travels under the sand toward it at `travelSpeed`, px/s, its
   * mound moving with it as the ripple, as far as the sand goes (see
   * `Mound`). Slower than the cat runs, so it can be outrun; it closes on a
   * cat that stops. Before a lunge the ground ruffles for `shiverMs`: the
   * warning, sized so that a cat standing right on top of the worm, which
   * is the worst case, can see it, turn and run clear of the lunge -- about
   * 50px at the cat's 190px/s is 265ms, and a player needs a moment to see
   * it first.
   */
  huntRange: 150,
  travelSpeed: 55,
  shiverMs: 550,
} as const;

/** A cactus: one tile wide, two tall, deadly to touch from any side. */
export const CACTUS = {
  /** The part that kills, inset from the tile's sides, px. */
  inset: 4,
} as const;

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
 * The evil lord beetle: a hunter, not a gatekeeper. It flies at you.
 *
 * Near the cat it *stalks* -- hangs a little way off and above, building up
 * to the next attack -- then *charges*: it locks where the cat is at that
 * moment and accelerates at it in a straight line, past the point and
 * through, then brakes, finds a new spot near the cat, and does it again.
 * Every charge shortens the next rest, down to a floor.
 */
export const BOSS = {
  /** How far from its lair it will roam, px, either side. */
  reach: 210,
  /** How far from the lair the cat has to be, px, to be its business at all. */
  engageRange: 330,
  /** The least daylight it keeps under its body, px, so it never scrapes the floor. */
  guardClearance: 36,

  /** Stalking: how fast it moves to its station, px/sec, and how quickly it turns, per second. */
  stalkSpeed: 190,
  stalkRate: 5,
  /** The station: this far to the side of the cat and this far above its head, px. */
  standoff: 96,
  hoverAbove: 64,

  /** The charge: how hard it accelerates, px/sec^2, and how fast it goes at most, px/sec. */
  chargeAccel: 1100,
  chargeSpeed: 470,
  /** The speed a charge starts from: it does not launch from a standstill. */
  chargeStartSpeed: 80,
  /** How far past the locked point it carries on, px, and the longest a charge lasts, ms. */
  overshoot: 14,
  chargeTimeoutMs: 1100,
  /** How long it takes to shed the charge's speed afterwards, ms. */
  recoverMs: 420,

  /** Rest between charges, ms: the first one, the floor, and how much each charge shortens the next. */
  restMs: 1100,
  minRestMs: 450,
  furyStep: 0.85,
  /** Grace before the first charge when the cat arrives, ms, on top of the rest. */
  approachGraceMs: 900,

  /** How often the wings are heard while it is flying at someone, ms. */
  wingBuzzMs: 420,

  /** The spots on its back, which are its lives: one per sting on the thorns. */
  spots: 4,
  /** After a sting it cannot be stung again for this long, ms, so one patch takes one spot. */
  stingCooldownMs: 900,
  /** How hard a sting throws it back, px/sec. */
  stingKnockback: 260,
  /** How long its dying fall lasts before it is gone, ms. */
  deathMs: 1400,
} as const;

/** The crow, which circles its nest and comes at the cat. */
/**
 * A checkpoint star. Touch one and dying puts you back there instead of at
 * the level's start -- which is itself the first checkpoint, before any other
 * is reached.
 */
export const CHECKPOINT = {
  /** Point-to-point radius of the drawn star, px. */
  size: 15,
  /** How long one full turn takes, ms. Slow: this is a shimmer, not a blur. */
  spinMs: 3200,
  /** How long the blue washes over the gold and back, ms. */
  colourMs: 1400,
} as const;

/**
 * The way out of a level: a wormhole standing on the ground where the `E`
 * tile is, its foot sunk a little into the earth.
 *
 * Wider than a tile on purpose -- a 16px doorway next to a 22px cat read as a
 * cupboard -- and it is not touched but *entered*: the cat's centre has to be
 * inside the hole before anything happens, so brushing the rim on the way
 * past does nothing, and neither does jumping over it.
 */
export const EXIT = {
  /** The disc as shown, px. Round, so it can simply be turned. */
  diameter: 32,
  /** How much of the bottom of the disc is below ground and never seen, px. */
  sink: 6,
  /**
   * Radius of the hole the cat's centre must be inside, px. Under half a cat,
   * so it is in the hole and not just leaning on it.
   */
  openingRadius: 8,
  /** One full turn, ms. */
  spinMs: 3600,
  /** How far the disc swells and shrinks either way while it spins, as a fraction. */
  warp: 0.08,
  /** One swell-and-shrink, ms. */
  warpMs: 900,
  /**
   * Where the picture starts to fade towards its rim, as a fraction of its
   * radius: untouched inside this, eased to fully transparent at the edge.
   */
  fadeFrom: 0.45,
  /** The picture's alpha while it stands there; the world shows through a little. */
  alpha: 0.8,
  /**
   * In front of the backdrop -- the cave wall, the leaf masses behind the
   * trees, the sky -- and behind everything else: ground, rock, branches,
   * boulders, bushes, creatures, the cat. The baked scenery is split into
   * two layers for exactly this (see `world/BakeScenery.ts`), and this sits
   * between them.
   */
  depth: -10,
  /** How long the cat takes to be drawn into the centre, ms. */
  drawInMs: 420,
  /** In a level with a beetle, how long the portals take to appear once it is dead, ms. */
  openMs: 700,
  /**
   * How long the fade to black takes once the cat is in, ms. The same 650 as
   * the pause after a death before the respawn, so leaving and dying take
   * the same breath.
   */
  fadeMs: 650,
  /** How long the next level takes to come up out of black, ms. */
  fadeInMs: 650,
  /**
   * On arrival a portal stands where the cat appears, fully opaque while the
   * screen is still black, and fades to nothing over this, ms.
   */
  arriveMs: 650,
  /**
   * Depth of the black a level fades out into and comes up out of; the
   * arrival portal sits just above it. Under the HUD (1000), so the hearts
   * stay put through both fades; the level name sits one under the black
   * and goes with its level.
   */
  fadeDepth: 999,
} as const;

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
  /** A `flyby` crow: speed along its sweep, px/sec. */
  flybySpeed: 70,
  /** A `flyby` crow: how far it rises and falls on the way, px. */
  flybyBob: 10,
  /** A `flyby` crow: how long one rise and fall takes, ms. */
  flybyBobPeriodMs: 1900,
  /** A `flyby` crow: how far past each end of its sweep it goes before turning, px. */
  flybyOvershoot: 40,
} as const;

/**
 * Level 1: a sunlit forest.
 *
 * Kept as one palette so the generated placeholder art already reads as a
 * single scene, and so real art has a colour reference to match.
 */
/** The on-screen stick and jump zone, in game pixels. */
export const TOUCH = {
  /** Radius of the stick's base, how far the knob can travel. */
  stickRadius: 44,
  /** Fraction of the radius the thumb must leave the centre before left or right count. */
  stickDeadZone: 0.28,
  /** Up and down ask for more, so a thumb drifting while running does not climb. */
  stickVerticalDeadZone: 0.45,
  /** The stick answers to any touch in this left share of the screen's width... */
  stickZoneWidth: 0.4,
  /** ...and the jump button to the same share on the right, both below this share of its height. */
  zoneTop: 0.3,
} as const;

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
  treeFar: 0x8fb5a0,
  treeFarTrunk: 0x7ea08c,
  treeMid: 0x5a8a6c,
  treeMidTrunk: 0x4b715a,

  // Haze along the floor between the ranks of trees, and the canopy hanging
  // over the top of the screen. Both are what make the forest deep: the haze
  // pushes the far trees back, the canopy closes the space in from above.
  fog: 0xdbe8c6,
  canopy: 0x2a5236,
  canopyDark: 0x1b3c27,

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

  // The desert's own: a camel, a worm, a cactus, and the sand they stand in.
  camelBody: 0xc9a062,
  camelDark: 0x9c7a44,
  camelLight: 0xe3c488,
  wormBody: 0xb86a4a,
  wormDark: 0x7d4430,
  wormBelly: 0xe0a080,
  wormMouth: 0x2a1410,
  cactus: 0x4f8a3c,
  cactusDark: 0x35612a,
  cactusSpine: 0xe8e4c0,
  sandMound: 0xd8b874,
  sandMoundDark: 0xb8964e,
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

  // The checkpoint star. Gold and blue rather than shades of one colour,
  // because the whole point is a shimmer you cannot mistake for anything else
  // in the level -- most of what is on screen is green, brown or grey.
  checkpointGold: 0xffcf4d,
  checkpointGoldLight: 0xfff0b0,
  checkpointBlue: 0x4fb8ff,
  checkpointBlueLight: 0xc3e9ff,

  // A little heart, brighter and pinker than the big ones in the corner so the
  // two are never confused: those are lives, these are what buys one.
  charm: 0xff5d7a,
  charmLight: 0xffa8ba,
  charmShine: 0xffffff,

  uiButton: 0xffffff,
} as const;
