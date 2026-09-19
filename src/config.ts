/**
 * Every tunable number the game reads lives here, so balancing does not mean
 * hunting through scene code.
 */

/**
 * The game is rendered at a fixed logical resolution and then scaled to fill
 * whatever screen it lands on (see `Phaser.Scale.FIT` in main.ts). Gameplay
 * therefore behaves identically on a laptop and a phone -- only the number of
 * physical pixels per game pixel changes.
 */
export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

/** Size of one level grid cell, in game pixels. */
export const TILE = 16;

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

/** The crow, which circles its nest and comes at the cat. */
export const CROW = {
  /** Radius of its patrol circle around the nest, px. */
  circleRadius: 70,
  /** Angular speed of that circle, radians/sec. */
  circleSpeed: 1.5,
  /**
   * How close the cat has to come before it attacks, px.
   *
   * Kept tight because the crow guards the star, and the star is the one thing
   * the level requires: a wide range turns the whole top of the tree into a
   * gauntlet with no way through.
   */
  attackRange: 120,
  /** How far the cat has to get before it gives up, px. Wider, to stop flicker. */
  releaseRange: 200,
  /** Speed of an attack run, px/sec. Slower than the cat can fall away. */
  attackSpeed: 150,
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

  ratBody: 0x5f5a55,
  ratBelly: 0x8a837c,
  ratTail: 0xc09a94,

  hedgehogBody: 0x8a6a4a,
  hedgehogSpine: 0x4a3524,
  hedgehogFace: 0xc9a582,

  piranhaBody: 0x4c6b58,
  piranhaBelly: 0xc2705a,

  crowBody: 0x1e1f26,
  crowSheen: 0x3b3f4d,
  crowBeak: 0xc8a13c,

  star: 0xf6c645,
  starGlow: 0xfff3b0,

  berry: 0xe0463d,
  berryLight: 0xff8175,

  uiButton: 0xffffff,
} as const;
