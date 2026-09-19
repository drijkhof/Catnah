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
   * Releasing the jump button early cuts the remaining upward velocity by this
   * factor, which is what makes a jump feel variable-height.
   */
  jumpCutMultiplier: 0.45,

  /**
   * Grace window after walking off a ledge during which a jump still counts.
   * Without it, players who jump a frame or two late feel cheated.
   */
  coyoteTimeMs: 90,

  /**
   * Grace window before landing during which a jump press is remembered and
   * fires the instant the cat touches ground.
   */
  jumpBufferMs: 120,

  /**
   * Fall speed while pressing against a wall in mid-air, px/sec.
   *
   * Far slower than a free fall (600). Without this the cat drops past a rock
   * face too fast to react, and wall jumping becomes a reflex test rather than
   * a move.
   */
  wallSlideSpeed: 95,

  /**
   * Sideways shove away from the wall on a wall jump, px/sec.
   *
   * Tuned against the cost of coming back. Every push has to be paid for by
   * steering back into the wall, and that return costs height; at 250 it cost
   * more height than a wall jump gained, so a lone wall could not be climbed at
   * all -- the cat got exactly one jump and sank. At 150 a cycle nets upward.
   */
  wallJumpPushX: 150,

  /** Upward velocity on a wall jump, px/sec. A little weaker than off the ground. */
  wallJumpVelocityY: -470,

  /**
   * How long horizontal input is ignored after a wall jump, ms.
   *
   * Without it, a player holding "towards the wall" -- which is exactly what
   * they were holding to cling to it -- cancels their own shove and slides
   * straight back down the same face.
   *
   * Kept short for the same reason the push is gentle: every locked frame is a
   * frame of falling away from the wall.
   */
  wallJumpLockMs: 100,

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

  /** Speed of climbing a trunk, px/sec. The same going up and coming down. */
  climbSpeed: 95,

  /**
   * How firmly the cat is drawn to the middle of a trunk while climbing, as a
   * velocity per pixel of offset. Enough to centre it without a visible snap.
   */
  climbCentringPull: 7,

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

  berry: 0xe0463d,
  berryLight: 0xff8175,

  uiButton: 0xffffff,
} as const;
