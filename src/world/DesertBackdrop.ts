import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { PYRAMID_SIZES, createRandom } from '../art';

/**
 * The desert behind the level: a hard pale sky, a white sun high and to the
 * right, two ranks of pyramids sliding past at different speeds, and a band
 * of heat shimmer along their feet.
 *
 * Lit from the right and from above, harshly: each pyramid's sunlit face is
 * nearly the colour of the sky at the horizon, and the only dark things are
 * the shadow faces. Nothing moves but the shimmer -- a desert is still.
 */
export class DesertBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number) {
    scene.add
      .image(0, 0, 'desert-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    // The forest's sun, higher and whiter here.
    const sun = scene.add
      .image(GAME_WIDTH * 0.78, GAME_HEIGHT * 0.14, 'sun')
      .setScrollFactor(0.03)
      .setDepth(-95)
      .setScale(0.9)
      .setTint(0xfff6d8)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: sun,
      scale: { from: 0.9, to: 0.95 },
      duration: 5000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const random = createRandom(4321);

    // Pyramids, far and near. Sparse: a skyline with a pyramid every few
    // hundred pixels, some of them small and some of them the real thing,
    // never flipped, because the sun is always on the same side.
    for (const [rank, spacing, factor, depth, lift] of [
      ['far', 520, 0.18, -80, 26],
      ['near', 760, 0.4, -70, 12],
    ] as const) {
      const size = PYRAMID_SIZES[rank];
      for (let x = -spacing; x < levelWidth / factor + spacing; x += spacing) {
        const scale = 0.55 + random() * 0.6;
        scene.add
          .image(x + (random() - 0.5) * spacing * 0.5, groundLine + lift, `pyramid-${rank}-${random() < 0.5 ? 'a' : 'b'}`)
          .setOrigin(0.5, 1)
          .setDisplaySize(size.width * scale, size.height * scale)
          .setScrollFactor(factor, 1)
          .setDepth(depth);
      }
    }

    // Heat shimmer: the swamp's mist, sand-coloured and barely there,
    // drifting along the dunes' feet.
    const shimmer = scene.add
      .tileSprite(0, groundLine + 6, GAME_WIDTH, 40, 'mist')
      .setOrigin(0, 0.5)
      .setScrollFactor(0, 1)
      .setDepth(-65)
      .setTint(0xffe9b0)
      .setAlpha(0.45);
    scene.tweens.add({
      targets: shimmer,
      tilePositionX: 240,
      duration: 14000,
      repeat: -1,
      ease: 'Linear',
    });
  }
}
