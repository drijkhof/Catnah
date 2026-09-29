import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import type { ParsedLevel } from '../level/Level';
import { STALACTITE_SIZE, STALAGMITE_SIZE, createRandom } from '../art';

/**
 * The cave behind the level: a dark wall, stalactites hanging from the roof,
 * and a scattering of crystals that are the only thing giving off any light.
 *
 * There is no sun and nothing distant to see, so the depth here comes from the
 * stalactites moving at two different rates rather than from a horizon.
 */
export class CaveBackdrop {
  constructor(scene: Phaser.Scene, level: ParsedLevel, levelWidth: number, levelHeight: number) {
    scene.add
      .image(0, 0, 'cave-sky')
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100);

    // The inside of the cave: a rock wall behind the tunnels, one seamless
    // texture repeated over the whole level. Locked to the world -- there is
    // no horizon in a cave, the wall is the far side of the passage the cat
    // is in -- which also makes it static, so the scenery bake flattens it
    // into the chunks with everything else.
    scene.add
      .tileSprite(0, 0, levelWidth, levelHeight, 'cave-wall')
      .setOrigin(0, 0)
      .setDepth(-90);

    const random = createRandom(4711);

    // Where the rock meets the air: a ceiling is a solid cell with an open
    // one under it, a floor an open cell with a solid one under it. Stone
    // grows from those, not from anywhere on the wall.
    const full = new Set<string>();
    for (const solid of level.solids) {
      if (!solid.isBranch && solid.width === TILE && solid.height === TILE) {
        full.add(`${solid.x / TILE},${solid.y / TILE}`);
      }
    }
    for (const cell of level.voids) {
      full.add(`${cell.x / TILE},${cell.y / TILE}`);
    }
    const columns = Math.ceil(levelWidth / TILE);
    const rows = Math.ceil(levelHeight / TILE);
    const ceilings: Array<[number, number]> = [];
    const floors: Array<[number, number]> = [];

    for (let row = 0; row < rows - 1; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const here = full.has(`${column},${row}`);
        const below = full.has(`${column},${row + 1}`);
        if (here && !below) {
          ceilings.push([column * TILE + TILE / 2, (row + 1) * TILE]);
        } else if (!here && below) {
          floors.push([column * TILE + TILE / 2, (row + 1) * TILE]);
        }
      }
    }

    // Stalactites hang from ceilings, roughly one in five spots, never two
    // side by side. Two sizes, the bigger drawn in front.
    let lastX = -Infinity;
    for (const [x, y] of ceilings) {
      if (x - lastX < TILE * 2 || random() > 0.22) {
        continue;
      }
      lastX = x;
      const big = random() < 0.4;
      const scale = big ? 1.1 : 0.7;
      scene.add
        .image(x + (random() - 0.5) * 6, y - 2, random() < 0.5 ? 'stalactite-a' : 'stalactite-b')
        .setOrigin(0.5, 0)
        .setDisplaySize(
          STALACTITE_SIZE.width * scale,
          STALACTITE_SIZE.height * scale * (0.7 + random() * 0.7),
        )
        .setDepth(big ? -70 : -80);
    }

    // Stalagmites and crystals stand on floors, behind whatever stands there
    // for real.
    lastX = -Infinity;
    for (const [x, y] of floors) {
      if (x - lastX < TILE * 3) {
        continue;
      }
      const roll = random();
      if (roll < 0.14) {
        lastX = x;
        const scale = 0.6 + random() * 0.7;
        scene.add
          .image(x + (random() - 0.5) * 6, y + 2, random() < 0.5 ? 'stalagmite-a' : 'stalagmite-b')
          .setOrigin(0.5, 1)
          .setDisplaySize(STALAGMITE_SIZE.width * scale, STALAGMITE_SIZE.height * scale)
          .setDepth(-12);
      } else if (roll < 0.3) {
        lastX = x;
        scene.add
          .image(x + (random() - 0.5) * 6, y + 1, 'crystal')
          .setOrigin(0.5, 1)
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
