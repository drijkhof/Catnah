import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { CONE_SIZE, createRandom } from '../art';

/**
 * The volcano behind the level: cones on the skyline with lava running down
 * them, embers drifting up, and a red wash along the bottom of the screen.
 *
 * Lit from below rather than above. Everywhere else in the game the light comes
 * from the sky; here the brightest thing is the ground, which is also the thing
 * that kills you.
 */
export class VolcanoBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number) {
    scene.add
      .image(0, 0, 'volcano-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    const random = createRandom(6621);

    for (const [key, spacing, factor, depth, scale] of [
      ['cone-far', 230, 0.22, -80, 0.9],
      ['cone-near', 330, 0.45, -70, 1.3],
    ] as const) {
      for (let x = -spacing; x < levelWidth + spacing; x += spacing) {
        scene.add
          .image(x + (random() - 0.5) * spacing * 0.4, groundLine + 20, key)
          .setOrigin(0.5, 1)
          .setDisplaySize(CONE_SIZE.width * scale, CONE_SIZE.height * scale)
          .setScrollFactor(factor)
          .setDepth(depth);
      }
    }

    // Embers rising, each on its own slow loop.
    for (let i = 0; i < 22; i += 1) {
      const ember = scene.add
        .image(random() * GAME_WIDTH, GAME_HEIGHT * (0.5 + random() * 0.5), 'ember')
        .setScrollFactor(0.1)
        .setDepth(-60)
        .setAlpha(0.3 + random() * 0.5)
        .setBlendMode(Phaser.BlendModes.ADD);

      scene.tweens.add({
        targets: ember,
        y: `-=${120 + random() * 140}`,
        alpha: 0,
        duration: 4000 + random() * 5000,
        repeat: -1,
        delay: random() * 4000,
        ease: 'Sine.easeOut',
      });
    }

    // The glow the lava throws up onto everything.
    scene.add
      .rectangle(0, GAME_HEIGHT, GAME_WIDTH, 150, 0xe8622a, 0.14)
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(-95);
  }
}
