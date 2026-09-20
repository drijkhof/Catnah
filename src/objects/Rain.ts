import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

/** How many drops are in the air at once. */
const DROPS = 130;

/** How fast they fall and how far they lean, px/sec. */
const FALL_MIN = 520;
const FALL_MAX = 860;
const LEAN = -90;

/** How long a streak is drawn, as a fraction of a second of its own travel. */
const STREAK = 0.022;

/**
 * Rain, over the whole viewport.
 *
 * **Screen space, not world space.** Rain is between the player and the game,
 * not somewhere in the level, so it is pinned with `setScrollFactor(0)` and
 * every drop wraps around the viewport rather than around the world. A world's
 * worth of rain for a 450-tile city would be thousands of drops, almost all of
 * them off screen.
 *
 * It is **one `Graphics` redrawn each frame** rather than 130 sprites. Drawing
 * 130 short lines is one draw call; 130 sprites is 130 objects for the scene to
 * carry, sort and cull, for something nothing ever interacts with.
 *
 * Nothing collides with it and nothing reacts to it. It is weather.
 */
export class Rain {
  private readonly graphics: Phaser.GameObjects.Graphics;

  /** Each drop: where it is, and how fast it is going. */
  private readonly drops: Array<{ x: number; y: number; speed: number }> = [];

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add
      .graphics()
      .setScrollFactor(0)
      // In front of the level and behind the HUD, which sits at 1000.
      .setDepth(500);

    for (let i = 0; i < DROPS; i += 1) {
      this.drops.push({
        x: Math.random() * (GAME_WIDTH + 120) - 60,
        y: Math.random() * GAME_HEIGHT,
        speed: FALL_MIN + Math.random() * (FALL_MAX - FALL_MIN),
      });
    }
  }

  step(delta: number): void {
    const dt = delta / 1000;

    this.graphics.clear();

    for (const drop of this.drops) {
      drop.y += drop.speed * dt;
      drop.x += LEAN * dt;

      // Wrapped rather than respawned at the top: a drop that reappears at a
      // new x every time makes the rain flicker between columns.
      if (drop.y > GAME_HEIGHT) {
        drop.y -= GAME_HEIGHT + 20;
        drop.x += GAME_HEIGHT * (LEAN / drop.speed);
      }

      if (drop.x < -60) {
        drop.x += GAME_WIDTH + 120;
      }

      // Faster drops are drawn longer and slightly brighter, which is the whole
      // of the depth in it: the near ones fall harder.
      const length = drop.speed * STREAK;
      const bright = 0.1 + (drop.speed - FALL_MIN) / (FALL_MAX - FALL_MIN) * 0.22;

      this.graphics.lineStyle(1, 0xbcd6e8, bright);
      this.graphics.lineBetween(
        drop.x,
        drop.y,
        drop.x + LEAN * STREAK,
        drop.y + length,
      );
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
