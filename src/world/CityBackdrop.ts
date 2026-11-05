import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE } from '../config';
import type { ParsedLevel } from '../level/Level';
import { KEEP_LIVE } from './BakeScenery';
import { LAMP_GLOW, LAMP_SIZE, SKYLINE_SIZES, createRandom } from '../art';

/**
 * The town at night: a dark sky with stars, the moon, two ranks of gables
 * with a lit window here and there going past at different speeds, and
 * street lamps along the pavement wherever there is room between the
 * houses. The ranks stand on the ground line, so they stay rooted however
 * high the cat climbs (see `world/CLAUDE.md` on vertical scroll factors).
 * The rain is not here: it is weather, in front of everything, built by
 * the scene (`objects/Rain.ts`).
 */
export class CityBackdrop {
  constructor(scene: Phaser.Scene, level: ParsedLevel, levelWidth: number, groundLine: number) {
    scene.add.image(0, 0, 'city-sky').setOrigin(0, 0).setScrollFactor(0).setDepth(-100);

    const moon = scene.add
      .image(GAME_WIDTH * 0.76, GAME_HEIGHT * 0.18, 'moon')
      .setScrollFactor(0.03)
      .setDepth(-95)
      .setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({
      targets: moon,
      alpha: { from: 0.85, to: 1 },
      duration: 5200,
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

    this.addLamps(scene, level, groundLine);
  }

  /**
   * A lamp every few tiles along the street, where the pavement and three
   * tiles of air above it are clear -- between houses, never in one or
   * under its arches. In front of the houses and behind the cat; the post
   * is baked with the scenery, the glow stays live so it can be added on.
   */
  private addLamps(scene: Phaser.Scene, level: ParsedLevel, groundLine: number): void {
    const taken = new Set([
      ...level.solids.map((solid) => `${Math.floor(solid.x / TILE)},${Math.floor(solid.y / TILE)}`),
      ...level.climbZones.map((zone) => `${zone.x / TILE},${zone.y / TILE}`),
    ]);
    const street = groundLine / TILE - 1;
    const columns = Math.floor(level.widthInPixels / TILE);
    let last = -100;
    for (let column = 3; column < columns - 2; column += 1) {
      let clear = true;
      for (let row = street - 3; row <= street; row += 1) {
        if (taken.has(`${column},${row}`)) {
          clear = false;
        }
      }
      if (!clear || column - last < 9) {
        continue;
      }
      last = column;
      const x = column * TILE + TILE / 2;
      scene.add
        .image(x, groundLine + 2, 'street-lamp')
        .setOrigin(0.5, 1)
        .setDepth(-0.2);
      scene.add
        .image(x, groundLine + 2 - LAMP_SIZE.height + 6, 'lamp-glow')
        .setDepth(-0.15)
        .setAlpha(0.6)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setData(KEEP_LIVE, true);
      // The pool of light it throws on the wet pavement.
      scene.add
        .image(x, groundLine + 1, 'lamp-glow')
        .setDisplaySize(LAMP_GLOW * 0.9, 10)
        .setDepth(-0.15)
        .setAlpha(0.6)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setData(KEEP_LIVE, true);
    }
  }
}
