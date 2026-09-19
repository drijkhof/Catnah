import Phaser from 'phaser';
import { TILE } from '../config';
import { bakeTexture } from './canvas';

/** Height of the solid wooden part of a branch, in game pixels. */
export const BRANCH_THICKNESS = 8;

/** Height of the leaves that hang below a branch. Purely decorative. */
export const BRANCH_LEAF_DROP = 11;

/**
 * The colours a level's tiles are drawn in.
 *
 * Every level uses the same tile *shapes* and differs by palette, which is what
 * lets a cave and a city reuse the whole tile format -- a girder and a branch
 * are the same one-way platform underneath. Character comes from the backdrop.
 */
/** What a climbable column is made of, in this place. */
export type ColumnStyle = 'trunk' | 'liana' | 'rope' | 'pipe' | 'chain';

/** What a one-way platform is made of. */
export type PlatformStyle = 'branch' | 'shelf' | 'girder';

export interface TilePalette {
  columnStyle: ColumnStyle;
  platformStyle: PlatformStyle;
  grass: number;
  grassDark: number;
  dirt: number;
  dirtDark: number;
  rock: number;
  rockDark: number;
  rockLight: number;
  branch: number;
  branchDark: number;
  leaf: number;
  leafLight: number;
  trunk: number;
  trunkDark: number;
  trunkLight: number;
  water: number;
  waterDeep: number;
  waterFoam: number;
  nestStraw: number;
  nestStrawLight: number;
  nestShadow: number;
  carBody: number;
  carGlass: number;
  carTrim: number;
  lava: number;
  lavaDeep: number;
  lavaBright: number;
}

/** Namespaced so three themes can be in memory at once. */
export function tileKey(theme: string, name: string): string {
  return `${theme}:${name}`;
}

/** Width of a climbable column within its tile. */
const TRUNK_WIDTH = 12;

export function generateTileset(
  scene: Phaser.Scene,
  theme: string,
  palette: TilePalette,
): void {
  const key = (name: string) => tileKey(theme, name);

  // --- floor -------------------------------------------------------------
  bakeTexture(scene, key('ground-top'), TILE, TILE, (g) => {
    g.fillStyle(palette.dirt, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.grassDark, 1);
    g.fillRect(0, 0, TILE, 6);

    g.fillStyle(palette.grass, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillRect(2, 3, 2, 3);
    g.fillRect(8, 3, 2, 4);
    g.fillRect(13, 3, 2, 2);

    g.fillStyle(palette.dirtDark, 1);
    g.fillRect(4, 9, 3, 2);
    g.fillRect(11, 12, 3, 2);
  });

  bakeTexture(scene, key('ground-fill'), TILE, TILE, (g) => {
    g.fillStyle(palette.dirt, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.dirtDark, 1);
    g.fillRect(3, 2, 3, 2);
    g.fillRect(10, 6, 4, 2);
    g.fillRect(5, 11, 3, 2);
  });

  // --- rock --------------------------------------------------------------
  bakeTexture(scene, key('rock-top'), TILE, TILE, (g) => {
    g.fillStyle(palette.rock, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.rockLight, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillRect(2, 3, 5, 1);

    g.fillStyle(palette.leaf, 1);
    g.fillRect(9, 0, 5, 2);
    g.fillRect(1, 1, 3, 1);

    g.fillStyle(palette.rockDark, 1);
    g.fillRect(4, 7, 4, 2);
    g.fillRect(11, 10, 3, 2);
  });

  bakeTexture(scene, key('rock-fill'), TILE, TILE, (g) => {
    g.fillStyle(palette.rock, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.rockDark, 1);
    g.fillRect(3, 1, 1, 6);
    g.fillRect(12, 4, 1, 7);
    g.fillRect(7, 9, 3, 2);

    g.fillStyle(palette.rockLight, 1);
    g.fillRect(9, 2, 1, 5);
  });

  // --- climbable columns -------------------------------------------------
  const inset = (TILE - TRUNK_WIDTH) / 2;

  /**
   * Columns differ in shape, not just colour. A drainpipe is not a tree with
   * different paint on it, and this is most of what makes a place feel like
   * itself once you are standing in it.
   */
  const drawColumn = (g: Phaser.GameObjects.Graphics): void => {
    switch (palette.columnStyle) {
      case 'liana': {
        // A thin, wandering stem with leaves along it.
        g.fillStyle(palette.trunk, 1);
        g.fillRect(6, 0, 4, TILE);
        g.fillStyle(palette.trunkDark, 1);
        g.fillRect(7, 0, 1, TILE);
        g.fillStyle(palette.leaf, 1);
        g.fillEllipse(3, 4, 6, 4);
        g.fillEllipse(13, 11, 6, 4);
        g.fillStyle(palette.leafLight, 1);
        g.fillEllipse(12, 10, 3, 2);
        break;
      }

      case 'rope': {
        // A caver's rope: two twisted strands and a knot every so often.
        g.fillStyle(palette.trunkDark, 1);
        g.fillRect(6, 0, 5, TILE);
        g.fillStyle(palette.trunk, 1);
        for (let y = 0; y < TILE; y += 4) {
          g.fillRect(6, y, 5, 2);
          g.fillRect(7, y + 2, 3, 1);
        }
        g.fillStyle(palette.trunkLight, 1);
        g.fillRect(7, 6, 3, 2);
        break;
      }

      case 'chain': {
        // Links, alternating flat and edge-on down the run.
        g.fillStyle(palette.trunkDark, 1);
        for (let y = 0; y < TILE; y += 8) {
          g.fillRect(5, y, 6, 7);
          g.fillRect(7, y + 4, 2, 5);
        }
        g.fillStyle(palette.trunk, 1);
        for (let y = 0; y < TILE; y += 8) {
          g.fillRect(6, y + 1, 4, 2);
          g.fillRect(6, y + 4, 4, 1);
        }
        g.fillStyle(palette.trunkLight, 1);
        g.fillRect(6, 1, 1, 5);
        break;
      }

      case 'pipe': {
        // A drainpipe, with a bracket bolted to the wall.
        g.fillStyle(palette.trunkDark, 1);
        g.fillRect(inset, 0, TRUNK_WIDTH, TILE);
        g.fillStyle(palette.trunk, 1);
        g.fillRect(inset + 1, 0, TRUNK_WIDTH - 3, TILE);
        g.fillStyle(palette.trunkLight, 1);
        g.fillRect(inset + 3, 0, 2, TILE);
        g.fillStyle(palette.trunkDark, 1);
        g.fillRect(inset - 2, 5, TRUNK_WIDTH + 4, 3);
        break;
      }

      default: {
        g.fillStyle(palette.trunk, 1);
        g.fillRect(inset, 0, TRUNK_WIDTH, TILE);
        g.fillStyle(palette.trunkDark, 1);
        g.fillRect(inset + 1, 0, 1, TILE);
        g.fillRect(inset + 7, 0, 2, TILE);
        g.fillStyle(palette.trunkLight, 1);
        g.fillRect(inset + 4, 0, 1, TILE);
        g.fillRect(inset + 10, 0, 1, TILE);
      }
    }
  };

  bakeTexture(scene, key('trunk'), TILE, TILE, drawColumn);

  bakeTexture(scene, key('trunk-top'), TILE, TILE, (g) => {
    drawColumn(g);

    if (palette.columnStyle === 'pipe') {
      // A lamp head, rather than foliage.
      g.fillStyle(palette.branchDark, 1);
      g.fillRect(2, 0, 12, 5);
      g.fillStyle(palette.leafLight, 1);
      g.fillRect(4, 4, 8, 3);
      return;
    }

    if (palette.columnStyle === 'chain') {
      // A ring bolted into the rock above.
      g.fillStyle(palette.rockDark, 1);
      g.fillRect(3, 0, 10, 4);
      g.fillStyle(palette.rockLight, 1);
      g.fillRect(6, 1, 4, 2);
      return;
    }

    if (palette.columnStyle === 'rope') {
      // An anchor bolted into the roof.
      g.fillStyle(palette.rockDark, 1);
      g.fillRect(3, 0, 10, 5);
      g.fillStyle(palette.rockLight, 1);
      g.fillRect(6, 1, 4, 2);
      return;
    }

    g.fillStyle(palette.leaf, 1);
    g.fillCircle(3, 3, 4);
    g.fillCircle(13, 4, 4);
    g.fillStyle(palette.leafLight, 1);
    g.fillCircle(8, 1, 3);
  });

  // --- one-way platforms -------------------------------------------------
  const drawWood = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(palette.branchDark, 1);
    g.fillRect(0, 0, TILE, BRANCH_THICKNESS);

    g.fillStyle(palette.branch, 1);
    g.fillRect(0, 0, TILE, BRANCH_THICKNESS - 3);

    if (palette.platformStyle === 'girder') {
      // An I-beam: a web between two flanges, and a rivet.
      g.fillStyle(palette.branchDark, 1);
      g.fillRect(0, 3, TILE, 2);
      g.fillStyle(palette.leafLight, 1);
      g.fillRect(3, 1, 2, 1);
      g.fillRect(11, 1, 2, 1);
      return;
    }

    if (palette.platformStyle === 'shelf') {
      // Layered rock, bedded flat.
      g.fillStyle(palette.rockLight, 1);
      g.fillRect(0, 0, TILE, 1);
      g.fillStyle(palette.rockDark, 1);
      g.fillRect(2, 4, 7, 1);
      g.fillRect(10, 5, 5, 1);
      return;
    }

    g.fillStyle(palette.branchDark, 1);
    g.fillRect(4, 2, 3, 1);
    g.fillRect(11, 3, 3, 1);
  };

  bakeTexture(scene, key('branch-mid'), TILE, BRANCH_THICKNESS, drawWood);

  bakeTexture(scene, key('branch-left'), TILE, BRANCH_THICKNESS, (g) => {
    drawWood(g);
    g.fillStyle(palette.leaf, 1);
    g.fillCircle(2, 2, 3);
  });

  bakeTexture(scene, key('branch-right'), TILE, BRANCH_THICKNESS, (g) => {
    drawWood(g);
    g.fillStyle(palette.leaf, 1);
    g.fillCircle(TILE - 2, 2, 3);
  });

  bakeTexture(scene, key('branch-leaves'), TILE, BRANCH_LEAF_DROP, (g) => {
    g.fillStyle(palette.leaf, 1);
    g.fillCircle(3, 2, 4);
    g.fillCircle(12, 3, 5);
    g.fillStyle(palette.leafLight, 1);
    g.fillCircle(8, 1, 3);
  });

  bakeTexture(scene, key('bough'), TILE, TILE, (g) => {
    g.fillStyle(palette.branchDark, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.branch, 1);
    g.fillRect(0, 3, TILE, 9);

    g.fillStyle(palette.branchDark, 1);
    g.fillRect(2, 6, 6, 1);
    g.fillRect(10, 9, 5, 1);

    g.fillStyle(palette.leaf, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillStyle(palette.leafLight, 1);
    g.fillRect(3, 0, 4, 1);
    g.fillRect(11, 0, 3, 1);
  });

  /**
   * A nest is drawn in two halves so the cat can sit *inside* it.
   *
   * The back half goes behind the cat and the near rim in front of it, with the
   * ledge it stands on set partway down the tile. Sitting on top of a nest
   * looks like standing on a hat; sitting in one looks like a nest.
   */
  bakeTexture(scene, key('nest'), TILE, TILE, (g) => {
    // Back half: the far rim and the hollow, all behind the cat.
    g.fillStyle(palette.nestShadow, 1);
    g.fillRect(0, 3, TILE, TILE - 3);

    g.fillStyle(palette.nestStraw, 1);
    g.fillRect(0, 1, 5, 5);
    g.fillRect(TILE - 5, 1, 5, 5);
    g.fillRect(0, 4, TILE, 3);

    g.fillStyle(palette.nestStrawLight, 1);
    g.fillRect(1, 3, 5, 1);
    g.fillRect(10, 2, 5, 1);

    // The hollow itself, darker, so there is visibly something to sit in.
    g.fillStyle(palette.nestShadow, 1);
    g.fillRect(4, 4, 8, 4);
  });

  bakeTexture(scene, key('nest-front'), TILE, TILE, (g) => {
    // Near rim: woven straw across the lower half, drawn over the cat.
    g.fillStyle(palette.nestShadow, 1);
    g.fillRect(0, 8, TILE, TILE - 8);

    g.fillStyle(palette.nestStraw, 1);
    g.fillRect(0, 9, TILE, 5);
    g.fillRect(1, 8, TILE - 2, 2);

    g.fillStyle(palette.nestStrawLight, 1);
    g.fillRect(2, 9, 6, 1);
    g.fillRect(9, 11, 5, 1);
    g.fillRect(4, 13, 7, 1);

    g.fillStyle(palette.nestShadow, 1);
    g.fillRect(6, 10, 4, 1);
    g.fillRect(2, 12, 3, 1);
  });

  // --- water -------------------------------------------------------------
  bakeTexture(scene, key('water'), TILE, TILE, (g) => {
    g.fillStyle(palette.water, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.waterDeep, 1);
    g.fillRect(2, 5, 5, 1);
    g.fillRect(9, 11, 4, 1);
  });

  bakeTexture(scene, key('water-bed'), TILE, TILE, (g) => {
    g.fillStyle(palette.waterDeep, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.water, 1);
    g.fillRect(4, 3, 3, 2);
    g.fillRect(10, 9, 4, 2);
  });

  bakeTexture(scene, key('water-surface'), TILE, TILE, (g) => {
    g.fillStyle(palette.water, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.waterFoam, 1);
    g.fillRect(0, 0, TILE, 2);
    g.fillRect(3, 2, 4, 1);
    g.fillRect(11, 2, 3, 1);
  });

  // --- parked cars -------------------------------------------------------
  const drawCar = (g: Phaser.GameObjects.Graphics, part: 'left' | 'mid' | 'right'): void => {
    g.fillStyle(palette.carBody, 1);
    g.fillRect(0, 4, TILE, TILE - 6);

    if (part !== 'mid') {
      g.fillStyle(palette.carBody, 1);
      g.fillRect(part === 'left' ? 2 : 0, 2, TILE - 2, 3);
    }

    // Cabin glass, only across the middle of the car.
    if (part !== 'right') {
      g.fillStyle(palette.carGlass, 1);
      g.fillRect(part === 'left' ? 6 : 0, 3, TILE - 6, 4);
    }

    g.fillStyle(palette.carTrim, 1);
    g.fillRect(0, TILE - 4, TILE, 2);

    // Wheels sit under the ends.
    if (part !== 'mid') {
      g.fillStyle(0x15161a, 1);
      g.fillCircle(part === 'left' ? 5 : 11, TILE - 2, 3);
    }

    if (part === 'right') {
      g.fillStyle(palette.leafLight, 1);
      g.fillRect(TILE - 3, 6, 3, 3);
    }
  };

  for (const part of ['left', 'mid', 'right'] as const) {
    bakeTexture(scene, key(`car-${part}`), TILE, TILE, (g) => drawCar(g, part));
  }

  // --- lava ---------------------------------------------------------------
  bakeTexture(scene, key('lava'), TILE, TILE, (g) => {
    g.fillStyle(palette.lavaDeep, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.lava, 1);
    g.fillRect(2, 3, 6, 2);
    g.fillRect(9, 9, 5, 2);
  });

  bakeTexture(scene, key('lava-surface'), TILE, TILE, (g) => {
    g.fillStyle(palette.lava, 1);
    g.fillRect(0, 0, TILE, TILE);

    // A bright crust along the top, so the line not to touch is unmistakable.
    g.fillStyle(palette.lavaBright, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillRect(2, 3, 5, 1);
    g.fillRect(10, 3, 4, 1);

    g.fillStyle(palette.lavaDeep, 1);
    g.fillRect(4, 8, 5, 1);
  });

  // --- the way out -------------------------------------------------------
  bakeTexture(scene, key('exit'), TILE, TILE * 2, (g) => {
    g.fillStyle(palette.rockDark, 1);
    g.fillRoundedRect(0, 0, TILE, TILE * 2, 5);

    g.fillStyle(palette.waterFoam, 0.85);
    g.fillRoundedRect(2, 3, TILE - 4, TILE * 2 - 5, 4);

    g.fillStyle(palette.leafLight, 1);
    g.fillRect(4, 10, TILE - 8, 2);
    g.fillRect(6, 6, 4, 2);
    g.fillRect(6, 18, 4, 2);
  });
}
