import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { STALACTITE_SIZE, STALAGMITE_SIZE, createRandom } from '../art';

/**
 * The cave behind the level: a dark wall, stalactites hanging from the roof,
 * and a scattering of crystals that are the only thing giving off any light.
 *
 * There is no sun and nothing distant to see, so the depth here comes from the
 * stalactites moving at two different rates rather than from a horizon.
 */
export class CaveBackdrop {
  constructor(scene: Phaser.Scene, levelWidth: number, levelHeight: number) {
    scene.add
      .image(0, 0, 'cave-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    const random = createRandom(4711);

    for (const [spacing, factor, depth, scale] of [
      [110, 0.3, -80, 0.8],
      [150, 0.6, -70, 1.2],
    ] as const) {
      for (let x = -spacing; x < levelWidth + spacing; x += spacing) {
        const key = random() < 0.5 ? 'stalactite-a' : 'stalactite-b';
        const jitter = (random() - 0.5) * spacing * 0.6;

        scene.add
          .image(x + jitter, 40 + (random() - 0.5) * 40, key)
          .setOrigin(0.5, 0)
          .setDisplaySize(
            STALACTITE_SIZE.width * scale,
            STALACTITE_SIZE.height * scale * (0.7 + random() * 0.7),
          )
          .setScrollFactor(factor)
          .setDepth(depth);
      }
    }

    // The cave is solid rock with tunnels cut through it, so there is no single
    // floor to stand things on. Stalagmites and crystals are scattered through
    // the whole depth instead, and show wherever a chamber has been carved out.
    for (let x = 0; x < levelWidth; x += 70) {
      const y = 40 + random() * (levelHeight - 60);

      if (random() < 0.4) {
        const scale = 0.6 + random() * 0.7;

        scene.add
          .image(x + (random() - 0.5) * 50, y, random() < 0.5 ? 'stalagmite-a' : 'stalagmite-b')
          .setOrigin(0.5, 1)
          .setDisplaySize(STALAGMITE_SIZE.width * scale, STALAGMITE_SIZE.height * scale)
          .setScrollFactor(0.85)
          .setDepth(-12);
      }

      if (random() < 0.55) {
        scene.add
          .image(x + (random() - 0.5) * 60, y + 20, 'crystal')
          .setOrigin(0.5, 1)
          .setScrollFactor(0.85)
          .setDepth(-11)
          .setBlendMode(Phaser.BlendModes.ADD);
      }
    }

    // A soft pool of light near the floor, so the level does not read as a
    // silhouette against nothing.
    scene.add
      .rectangle(0, GAME_HEIGHT, GAME_WIDTH, 120, 0x4f7f86, 0.12)
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(-95);
  }
}
