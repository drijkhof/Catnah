import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { BUILDING_SIZE, createRandom } from '../art';

/**
 * The city behind the level: a night sky, a moon, and two ranks of buildings
 * with lit windows.
 *
 * The near rank is *darker* than the far one, which is the opposite of the
 * forest. Haze lightens distance outdoors; at night, distance is where the
 * lights are, and the thing close to you is the thing blocking them.
 */
export class CityBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number) {
    scene.add
      .image(0, 0, 'city-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    const moon = scene.add
      .image(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.2, 'moon')
      .setScrollFactor(0.03)
      .setDepth(-95)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: moon,
      alpha: { from: 0.9, to: 1 },
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const random = createRandom(9001);

    for (const [key, spacing, factor, depth, scale] of [
      ['building-far', 84, 0.25, -80, 0.85],
      ['building-near', 128, 0.5, -70, 1.15],
    ] as const) {
      for (let x = -spacing; x < levelWidth + spacing; x += spacing) {
        const jitter = (random() - 0.5) * spacing * 0.4;
        const height = BUILDING_SIZE.height * scale * (0.65 + random() * 0.7);

        scene.add
          .image(x + jitter, groundLine + 18, key)
          .setOrigin(0.5, 1)
          .setDisplaySize(BUILDING_SIZE.width * scale, height)
          .setScrollFactor(factor)
          .setDepth(depth);
      }
    }
  }
}
