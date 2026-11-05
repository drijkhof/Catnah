import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, RAIN } from '../config';
import { createRandom } from '../art';

/**
 * Rain, over the whole viewport.
 *
 * **Screen space, not world space.** Rain is between the player and the game,
 * not somewhere in the level, so it is pinned with `setScrollFactor(0)` and
 * every drop wraps around the viewport rather than around the world.
 *
 * It is **one `Graphics` redrawn each frame** rather than a sprite per drop:
 * a hundred short lines is one draw call, and nothing ever touches a drop.
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
      // In front of the level and behind the HUD.
      .setDepth(RAIN.depth);

    const random = createRandom(6007);
    for (let i = 0; i < RAIN.drops; i += 1) {
      this.drops.push({
        x: random() * (GAME_WIDTH + 120) - 60,
        y: random() * GAME_HEIGHT,
        speed: RAIN.fallMin + random() * (RAIN.fallMax - RAIN.fallMin),
      });
    }
  }

  step(delta: number): void {
    const dt = delta / 1000;
    this.graphics.clear();

    for (const drop of this.drops) {
      drop.y += drop.speed * dt;
      drop.x += RAIN.lean * dt;

      // Wrapped rather than respawned at the top: a drop that reappears at a
      // new x every time makes the rain flicker between columns.
      if (drop.y > GAME_HEIGHT) {
        drop.y -= GAME_HEIGHT + 20;
        drop.x += GAME_HEIGHT * (RAIN.lean / drop.speed);
      }
      if (drop.x < -60) {
        drop.x += GAME_WIDTH + 120;
      }

      // Faster drops are drawn longer and a little brighter, which is the
      // whole of the depth in it: the near ones fall harder.
      const length = drop.speed * RAIN.streak;
      const bright = 0.12 + ((drop.speed - RAIN.fallMin) / (RAIN.fallMax - RAIN.fallMin)) * 0.25;

      this.graphics.lineStyle(1, 0xbcd6e8, bright);
      this.graphics.lineBetween(drop.x, drop.y, drop.x + RAIN.lean * RAIN.streak, drop.y + length);
    }
  }
}
