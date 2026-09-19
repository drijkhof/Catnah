import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { DEAD_TREE_SIZE, createRandom } from '../art';

/**
 * The swamp behind the level: a sickly overcast sky, dead trees hung with moss,
 * reeds along the waterline, and mist drifting across it all.
 *
 * The forest gets its depth from haze lightening the distance. Here the haze is
 * the point rather than the trick: the mist sits in front as well as behind, so
 * the place feels closed in instead of open.
 */
export class SwampBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, groundLine: number) {
    scene.add
      .image(0, 0, 'swamp-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    const random = createRandom(2024);

    for (const [key, spacing, factor, depth, scale] of [
      ['dead-tree-far', 92, 0.25, -80, 0.8],
      ['dead-tree-near', 140, 0.5, -70, 1.15],
    ] as const) {
      for (let x = -spacing; x < levelWidth + spacing; x += spacing) {
        const jitter = (random() - 0.5) * spacing * 0.5;

        scene.add
          .image(x + jitter, groundLine + 14, key)
          .setOrigin(0.5, 1)
          .setDisplaySize(
            DEAD_TREE_SIZE.width * scale,
            DEAD_TREE_SIZE.height * scale * (0.7 + random() * 0.6),
          )
          .setScrollFactor(factor)
          .setDepth(depth);
      }
    }

    // Reeds stand in the water the cat wades through, so they scroll with it.
    for (let x = 0; x < levelWidth; x += 46) {
      if (random() < 0.4) {
        continue;
      }

      scene.add
        .image(x + (random() - 0.5) * 30, groundLine + 4, 'reed')
        .setOrigin(0.5, 1)
        .setDepth(random() < 0.3 ? 40 : -10);
    }

    // Two bands of mist, drifting at different speeds so the air moves.
    for (const [y, depth, duration, alpha] of [
      [GAME_HEIGHT * 0.62, -60, 26000, 0.9],
      [GAME_HEIGHT * 0.86, 45, 17000, 0.7],
    ] as const) {
      const mist = scene.add
        .tileSprite(0, y, GAME_WIDTH, 40, 'mist')
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(alpha);

      scene.tweens.add({
        targets: mist,
        tilePositionX: 240,
        duration,
        repeat: -1,
        ease: 'Linear',
      });
    }
  }
}
