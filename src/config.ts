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

export const PLAYER = {
  width: 12,
  height: 22,

  /** Horizontal run speed, px/sec. */
  speed: 190,
  /** How fast the player reaches full speed on the ground, px/sec^2. */
  accel: 2200,
  /** Ground friction when no direction is held, px/sec^2. */
  friction: 2400,
  /** Reduced control while airborne, as a fraction of `accel`. */
  airControl: 0.55,

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
   * fires the instant the player touches ground.
   */
  jumpBufferMs: 120,
} as const;

/** Palette, kept here so placeholder art and real art stay visually consistent. */
export const COLORS = {
  sky: 0x1b2838,
  ground: 0x4a6b4f,
  groundTop: 0x6bab6b,
  player: 0xe8d8a0,
  coin: 0xf2c14e,
  uiButton: 0xffffff,
} as const;
