import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { MOON_HILLS_SIZE, PLANET_SIZES, STARFIELD_SIZE, createRandom } from '../art';

/**
 * The moon's sky: black space full of stars in three layers, the Earth
 * hanging in it, Saturn and Mars further off, and two ranks of low grey
 * hills on the horizon, with an American flag planted on them. The stars and planets slide by a little as the cat
 * walks, the far things least; the hills are rooted on the ground line.
 */
export class MoonBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number) {
    scene.add.image(0, 0, 'space-sky').setOrigin(0, 0).setScrollFactor(0).setDepth(-100);

    for (const [key, factor, depth] of [
      ['stars-far', 0.02, -99],
      ['stars-mid', 0.05, -98],
      ['stars-near', 0.1, -97],
    ] as const) {
      scene.add
        .tileSprite(0, 0, Math.max(STARFIELD_SIZE, levelWidth * factor + GAME_WIDTH), GAME_HEIGHT, key)
        .setOrigin(0, 0)
        .setScrollFactor(factor, 0)
        .setDepth(depth);
    }

    // The planets: the Earth big and high, the others smaller and further.
    for (const [name, x, y, scale, factor] of [
      ['saturn', 0.82, 0.16, 0.8, 0.03],
      ['mars', 0.5, 0.1, 0.5, 0.05],
      ['earth', 0.2, 0.2, 0.75, 0.08],
    ] as const) {
      scene.add
        .image(GAME_WIDTH * x, GAME_HEIGHT * y + (name === 'earth' ? PLANET_SIZES.earth * 0.1 : 0), `planet-${name}`)
        .setScale(scale)
        .setScrollFactor(factor, 0)
        .setDepth(-95);
    }

    const random = createRandom(7707);
    for (const [rank, factor, depth, sink] of [
      ['far', 0.2, -80, 14],
      ['near', 0.4, -70, 8],
    ] as const) {
      const { width } = MOON_HILLS_SIZE;
      for (let x = -width; x < levelWidth * factor + GAME_WIDTH + width; x += width) {
        scene.add
          .image(x + Math.floor(random() * 2), groundLine + sink, `moon-hills-${rank}`)
          .setOrigin(0, 1)
          .setScrollFactor(factor, 1)
          .setDepth(depth);
      }
    }

    // A flag on the near hills, early on: someone was here before.
    scene.add
      .image(GAME_WIDTH * 0.62, groundLine + 8 - 30, 'us-flag')
      .setOrigin(0, 1)
      .setScale(0.8)
      .setScrollFactor(0.4, 1)
      .setDepth(-69);
  }
}
