import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SKYLINE_SIZES, createRandom } from '../art';

/**
 * The town behind the street: the forest's morning sky and sun, and two
 * ranks of gables going past at different speeds -- a far, pale one with a
 * church tower in it, and a nearer one with some colour and windows. Both
 * stand on the ground line, so they stay rooted however high the cat
 * climbs (see `world/CLAUDE.md` on vertical scroll factors).
 */
export class CityBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number) {
    scene.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0).setDepth(-100);

    const sun = scene.add
      .image(GAME_WIDTH * 0.24, GAME_HEIGHT * 0.15, 'sun')
      .setScrollFactor(0.04)
      .setDepth(-95)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: sun,
      scale: { from: 1, to: 1.05 },
      duration: 4400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const random = createRandom(2711);
    for (const [rank, factor, depth, sink] of [
      ['far', 0.2, -80, 10],
      ['near', 0.45, -70, 4],
    ] as const) {
      const { width } = SKYLINE_SIZES[rank];
      for (let x = -width; x < levelWidth * factor + GAME_WIDTH + width; x += width) {
        scene.add
          .image(x, groundLine + sink, `skyline-${rank}-${random() < 0.5 ? 'a' : 'b'}`)
          .setOrigin(0, 1)
          .setScrollFactor(factor, 1)
          .setDepth(depth);
      }
    }

    // Haze between the ranks, as in the forest, so the far town sits back.
    scene.add
      .image(0, groundLine + 6, 'fog')
      .setOrigin(0, 1)
      .setScrollFactor(0, 1)
      .setDepth(-76)
      .setAlpha(0.6);
  }
}
