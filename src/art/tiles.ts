import Phaser from 'phaser';
import { TILE } from '../config';
import { bakeTexture } from './canvas';

/** Height of the solid wooden part of a branch, in game pixels. */
export const BRANCH_THICKNESS = 8;

/** Height of the leaves that hang below a branch. Purely decorative. */
export const BRANCH_LEAF_DROP = 11;

/**
 * The two decorative leaf masses, neither of which collides with anything.
 *
 * `foliage-back` goes *behind* everything -- four tiles wide, so a handful of
 * them make one full crown rather than a row of shrubs, and a trunk and its
 * branches are seen against leaves rather than against the sky. `foliage-near`
 * goes in *front* of the cat, and
 * its height is the point of it: a standing cat is 18 pixels and this is 13, so
 * a cat behind one is hidden to the shoulders with its ears and tail still out.
 * Tall enough to hide in, short enough that you can always see where you are.
 */
export const FOLIAGE_BACK_SIZE = { width: 64, height: 54 };
export const FOLIAGE_NEAR_SIZE = { width: 28, height: 13 };

/** A darker version of a palette colour, for shading leaves against leaves. */
function shade(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).darken(amount).color;
}

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
  carLight: number;
  houseWall: number;
  houseWallDark: number;
  houseRoof: number;
  houseRoofDark: number;
  houseWindow: number;
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

  /**
   * The top of a column that is bolted to a wall.
   *
   * Only the city has anything to say here: a drainpipe ends in a hopper under
   * the gutter, not in a lamp. Everywhere else a column against a wall looks
   * exactly like one standing on its own.
   */
  bakeTexture(scene, key('trunk-head'), TILE, TILE, (g) => {
    drawColumn(g);

    if (palette.columnStyle !== 'pipe') {
      g.fillStyle(palette.leaf, 1);
      g.fillCircle(3, 3, 4);
      g.fillCircle(13, 4, 4);
      g.fillStyle(palette.leafLight, 1);
      g.fillCircle(8, 1, 3);
      return;
    }

    g.fillStyle(palette.trunkDark, 1);
    g.fillRect(2, 0, 12, 6);
    g.fillStyle(palette.trunk, 1);
    g.fillRect(3, 1, 10, 4);
    g.fillStyle(palette.trunkLight, 1);
    g.fillRect(4, 1, 8, 1);
  });

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

  /**
   * The two leaf masses. Scenery only: `GameScene` places them, nothing
   * collides with them, and they exist to break up the grid the level is
   * actually built on.
   *
   * Both are drawn as overlapping circles at a size no tile boundary lines up
   * with, which is the whole trick -- a 34px clump straddling a 16px grid is
   * what stops the eye reading the tiles underneath.
   */
  bakeTexture(
    scene,
    key('foliage-back'),
    FOLIAGE_BACK_SIZE.width,
    FOLIAGE_BACK_SIZE.height,
    (g) => {
      const { width, height } = FOLIAGE_BACK_SIZE;

      // Darker than any leaf in front of it: this is the shadowed inside of
      // the canopy, and it has to read as *behind* rather than as more of the
      // same green.
      g.fillStyle(shade(palette.leaf, 40), 1);
      g.fillCircle(width * 0.22, height * 0.54, height * 0.36);
      g.fillCircle(width * 0.5, height * 0.46, height * 0.46);
      g.fillCircle(width * 0.78, height * 0.56, height * 0.38);
      g.fillCircle(width * 0.36, height * 0.72, height * 0.34);
      g.fillCircle(width * 0.64, height * 0.74, height * 0.32);
      g.fillCircle(width * 0.5, height * 0.24, height * 0.3);

      g.fillStyle(shade(palette.leaf, 24), 1);
      g.fillCircle(width * 0.38, height * 0.42, height * 0.26);
      g.fillCircle(width * 0.62, height * 0.56, height * 0.24);
      g.fillCircle(width * 0.5, height * 0.3, height * 0.18);
    },
  );

  bakeTexture(
    scene,
    key('foliage-near'),
    FOLIAGE_NEAR_SIZE.width,
    FOLIAGE_NEAR_SIZE.height,
    (g) => {
      const { width, height } = FOLIAGE_NEAR_SIZE;

      // Lit from the front, so it sits clearly nearer than the back clump.
      g.fillStyle(palette.leaf, 1);
      g.fillCircle(width * 0.22, height * 0.72, height * 0.5);
      g.fillCircle(width * 0.5, height * 0.62, height * 0.56);
      g.fillCircle(width * 0.78, height * 0.74, height * 0.48);

      g.fillStyle(palette.leafLight, 1);
      g.fillCircle(width * 0.36, height * 0.5, height * 0.3);
      g.fillCircle(width * 0.68, height * 0.56, height * 0.26);

      // A few blades standing proud of the mass, so the top edge is a plant
      // and not the top of a circle.
      g.fillStyle(palette.leaf, 1);
      g.fillRect(width * 0.3, 0, 2, height * 0.5);
      g.fillRect(width * 0.55, height * 0.12, 2, height * 0.4);
      g.fillRect(width * 0.82, height * 0.2, 2, height * 0.35);
    },
  );

  /**
   * Thorns: the one hazard that is neither alive nor a liquid.
   *
   * What they are made of follows the place, the same way a column does. Reeds
   * where there are leaves, stalagmites where there is rock, a spiked railing
   * where there are girders -- one shape, three materials, and in every case
   * something you would not put a paw on.
   *
   * They are drawn as four spikes of different heights. Even spikes read as a
   * comb, and a comb reads as decoration.
   */
  bakeTexture(scene, key('thorns'), TILE, TILE, (g) => {
    const spikes = [
      { x: 1, width: 4, height: 11 },
      { x: 5, width: 3, height: 15 },
      { x: 8, width: 4, height: 9 },
      { x: 12, width: 3, height: 13 },
    ];

    // Dark body, pale point. A hazard has to read at a glance and from across
    // a bank, and the thing that does that is the silhouette, not the colour --
    // reeds drawn in the same green as the grass they stand in are scenery.
    const body =
      palette.platformStyle === 'shelf'
        ? palette.rockDark
        : palette.platformStyle === 'girder'
          ? palette.trunkDark
          : shade(palette.leaf, 58);
    const tip =
      palette.platformStyle === 'shelf'
        ? palette.rockLight
        : palette.platformStyle === 'girder'
          ? palette.rockLight
          : palette.leafLight;

    for (const spike of spikes) {
      const top = TILE - spike.height;

      g.fillStyle(body, 1);
      g.fillTriangle(
        spike.x, TILE,
        spike.x + spike.width, TILE,
        spike.x + spike.width / 2, top,
      );

      // A lit point, so the top of each one is the part the eye lands on.
      g.fillStyle(tip, 1);
      g.fillRect(spike.x + spike.width / 2 - 1, top, 2, 3);
    }
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

  // --- houses -------------------------------------------------------------
  // A house is not a block of flats, and in a city made only of flats every
  // building is the same building. Plastered wall under a tiled roof, with the
  // roof drawn on whichever tile happens to be the top of its column -- so a
  // stepped roof line comes out as a pitched roof.
  /** Plain plastered wall. Most of a house is this. */
  const plaster = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(palette.houseWall, 1);
    g.fillRect(0, 0, TILE, TILE);

    // Render, in patches rather than lines: plaster is not brick.
    g.fillStyle(palette.houseWallDark, 0.35);
    g.fillRect(2, 3, 4, 2);
    g.fillRect(9, 8, 5, 2);
    g.fillRect(4, 12, 3, 2);
  };

  bakeTexture(scene, key('house-fill'), TILE, TILE, plaster);

  bakeTexture(scene, key('house-window'), TILE, TILE, (g) => {
    plaster(g);

    // A shuttered window with a rounded head, because a square hole in a wall
    // is a hole and a rounded one is a window.
    g.fillStyle(palette.houseWallDark, 1);
    g.fillRect(3, 5, 10, 8);
    g.fillCircle(8, 5, 5);

    g.fillStyle(palette.houseWindow, 1);
    g.fillRect(4, 5, 8, 6);
    g.fillCircle(8, 5, 4);

    // Glazing bars.
    g.fillStyle(palette.houseWallDark, 1);
    g.fillRect(7, 2, 2, 9);
    g.fillRect(4, 6, 8, 1);

    // A sill under it.
    g.fillRect(2, 11, 12, 2);
  });

  bakeTexture(scene, key('house-top'), TILE, TILE, (g) => {
    g.fillStyle(palette.houseWall, 1);
    g.fillRect(0, 6, TILE, TILE - 6);

    // Pantiles: a scalloped course, which is what makes a roof read as a roof.
    g.fillStyle(palette.houseRoofDark, 1);
    g.fillRect(0, 0, TILE, 7);
    g.fillStyle(palette.houseRoof, 1);
    g.fillRect(0, 1, TILE, 4);

    for (let x = 1; x < TILE; x += 4) {
      g.fillStyle(palette.houseRoofDark, 1);
      g.fillRect(x, 1, 1, 4);
      g.fillStyle(0xffffff, 0.14);
      g.fillCircle(x + 2, 3, 1.6);
    }

    // The eaves, overhanging a little.
    g.fillStyle(palette.houseRoofDark, 1);
    g.fillRect(0, 5, TILE, 2);
  });

  // --- parked cars -------------------------------------------------------
  // A car is two tiles tall and five long, with the cabin over the middle
  // three: a low bonnet, a raised cabin, a low boot. It faces left.
  //
  // Each tile is drawn for the place it holds in that shape, and every drawing
  // starts at the top of its tile, because the top of the tile is what the cat
  // actually stands on.
  const TYRE = 0x15161a;
  const HUB = 0x9aa3ad;
  const CHROME = 0xb9c4cf;
  const SHADOW = 0x000000;

  /** A wheel in its arch, sat on the road. */
  const wheel = (g: Phaser.GameObjects.Graphics, x: number): void => {
    g.fillStyle(TYRE, 1);
    g.fillCircle(x, TILE - 5, 5);
    g.fillStyle(HUB, 1);
    g.fillCircle(x, TILE - 5, 2);
    g.fillStyle(TYRE, 1);
    g.fillRect(x - 1, TILE - 6, 2, 2);
  };

  /** The dark under-body and the shadow it throws on the road. */
  const underneath = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(palette.carTrim, 1);
    g.fillRect(0, TILE - 8, TILE, 3);
    g.fillStyle(SHADOW, 0.25);
    g.fillRect(0, TILE - 1, TILE, 1);
  };

  /** The chrome rubbing strip that runs the whole length of the car. */
  const trimLine = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(CHROME, 1);
    g.fillRect(0, TILE - 10, TILE, 1);
  };

  bakeTexture(scene, key('car-nose'), TILE, TILE, (g) => {
    g.fillStyle(palette.carBody, 1);
    // The bonnet drops away towards the front.
    g.fillRect(4, 2, TILE - 4, TILE - 8);
    g.fillRect(2, 4, TILE - 2, TILE - 10);
    g.fillRect(1, 5, TILE - 1, TILE - 11);

    // A lit edge along the top of the bonnet.
    g.fillStyle(0xffffff, 0.22);
    g.fillRect(5, 2, TILE - 6, 1);

    // Headlight and a sliver of grille under it.
    g.fillStyle(palette.carLight, 1);
    g.fillRect(1, 5, 3, 3);
    g.fillStyle(palette.carTrim, 1);
    g.fillRect(1, 9, 5, 1);

    trimLine(g);
    underneath(g);

    // Chrome bumper, wrapped round the nose.
    g.fillStyle(CHROME, 1);
    g.fillRect(0, TILE - 7, 6, 2);

    wheel(g, 11);
  });

  bakeTexture(scene, key('car-sill'), TILE, TILE, (g) => {
    g.fillStyle(palette.carBody, 1);
    g.fillRect(0, 1, TILE, TILE - 7);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(0, 1, TILE, 1);
    trimLine(g);
    underneath(g);
  });

  bakeTexture(scene, key('car-door'), TILE, TILE, (g) => {
    g.fillStyle(palette.carBody, 1);
    g.fillRect(0, 0, TILE, TILE - 6);

    // A shut line and a handle, which is all it takes to read as a door.
    g.fillStyle(palette.carTrim, 1);
    g.fillRect(2, 0, 1, TILE - 9);
    g.fillStyle(CHROME, 1);
    g.fillRect(8, 2, 4, 1);

    g.fillStyle(0xffffff, 0.16);
    g.fillRect(0, 0, TILE, 1);

    trimLine(g);
    underneath(g);
  });

  bakeTexture(scene, key('car-tail'), TILE, TILE, (g) => {
    g.fillStyle(palette.carBody, 1);
    g.fillRect(0, 1, TILE - 2, TILE - 7);
    g.fillRect(0, 3, TILE - 1, TILE - 9);

    g.fillStyle(0xffffff, 0.2);
    g.fillRect(0, 1, TILE - 3, 1);

    // Tail light, and a number plate on the back.
    g.fillStyle(0xd0463a, 1);
    g.fillRect(TILE - 4, 4, 3, 3);
    g.fillStyle(0xe8e2cf, 1);
    g.fillRect(TILE - 6, 8, 5, 2);

    trimLine(g);
    underneath(g);

    g.fillStyle(CHROME, 1);
    g.fillRect(TILE - 6, TILE - 7, 6, 2);

    wheel(g, 5);
  });

  /** The upper row: the cabin, which is roof, glass and pillars. */
  const roof = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(palette.carBody, 1);
    g.fillRect(0, 0, TILE, 4);
    g.fillStyle(0xffffff, 0.22);
    g.fillRect(0, 0, TILE, 1);
    g.fillStyle(CHROME, 1);
    g.fillRect(0, 4, TILE, 1);
  };

  /** Where the cabin meets the body, at the bottom of the upper tile. */
  const waist = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(palette.carBody, 1);
    g.fillRect(0, TILE - 3, TILE, 3);
    g.fillStyle(CHROME, 1);
    g.fillRect(0, TILE - 3, TILE, 1);
  };

  bakeTexture(scene, key('car-windscreen'), TILE, TILE, (g) => {
    roof(g);

    // The A-pillar, and glass raked forward off it.
    g.fillStyle(palette.carBody, 1);
    g.fillRect(0, 0, 3, TILE);

    g.fillStyle(palette.carGlass, 1);
    g.fillTriangle(3, 5, TILE, 5, TILE, TILE - 3);
    g.fillRect(3, 5, TILE - 3, 3);

    // A highlight across the glass, and a wing mirror on the pillar.
    g.fillStyle(0xffffff, 0.25);
    g.fillRect(5, 6, TILE - 7, 1);
    g.fillStyle(palette.carTrim, 1);
    g.fillRect(0, 8, 2, 2);

    waist(g);
  });

  bakeTexture(scene, key('car-roof'), TILE, TILE, (g) => {
    roof(g);

    g.fillStyle(palette.carGlass, 1);
    g.fillRect(0, 5, TILE, TILE - 8);

    // The B-pillar between the two side windows.
    g.fillStyle(palette.carBody, 1);
    g.fillRect(7, 5, 2, TILE - 8);

    g.fillStyle(0xffffff, 0.22);
    g.fillRect(1, 6, 5, 1);
    g.fillRect(10, 6, 5, 1);

    waist(g);
  });

  bakeTexture(scene, key('car-rear-window'), TILE, TILE, (g) => {
    roof(g);

    g.fillStyle(palette.carBody, 1);
    g.fillRect(TILE - 3, 0, 3, TILE);

    g.fillStyle(palette.carGlass, 1);
    g.fillTriangle(0, 5, TILE - 3, 5, TILE - 3, TILE - 3);
    g.fillRect(0, 5, TILE - 3, 3);

    g.fillStyle(0xffffff, 0.25);
    g.fillRect(1, 6, TILE - 7, 1);

    waist(g);
  });

  // --- lava ---------------------------------------------------------------
  bakeTexture(scene, key('lava'), TILE, TILE, (g) => {
    g.fillStyle(palette.lavaDeep, 1);
    g.fillRect(0, 0, TILE, TILE);

    g.fillStyle(palette.lava, 1);
    g.fillRect(2, 3, 6, 2);
    g.fillRect(9, 9, 5, 2);
  });

  /**
   * The surface, in four frames that cycle.
   *
   * Lava that sits still is a floor painted orange. What makes it read as
   * molten is that the crust keeps breaking: each frame moves the bright
   * patches and the dark skin about, and the scene runs the tiles out of step
   * with each other so the whole lake churns rather than pulsing as one.
   */
  const BOIL_FRAMES = 4;

  for (let frame = 0; frame < BOIL_FRAMES; frame += 1) {
    bakeTexture(scene, key(`lava-surface-${frame}`), TILE, TILE, (g) => {
      g.fillStyle(palette.lava, 1);
      g.fillRect(0, 0, TILE, TILE);

      // The bright crust along the top, so the line not to touch is
      // unmistakable. It boils unevenly: the lit run shifts each frame.
      g.fillStyle(palette.lavaBright, 1);
      g.fillRect(0, 0, TILE, 3);
      g.fillRect((frame * 5) % TILE, 3, 5, 1);
      g.fillRect((frame * 7 + 9) % TILE, 3, 3, 1);

      // Bubbles rising through it, each frame a little further up and a little
      // bigger, so a tile left running looks like it is coming to the boil.
      g.fillStyle(palette.lavaBright, 0.9);
      g.fillCircle(4 + frame, 11 - frame * 2, 1 + frame * 0.4);
      g.fillCircle(12 - frame, 13 - frame, 1 + frame * 0.3);

      // And the dark skin between them.
      g.fillStyle(palette.lavaDeep, 1);
      g.fillRect((frame * 3 + 4) % (TILE - 5), 8, 5, 1);
    });
  }

  /** A gobbet of lava, for the ones that jump out. */
  bakeTexture(scene, key('lava-blob'), 6, 6, (g) => {
    g.fillStyle(palette.lavaBright, 1);
    g.fillCircle(3, 3, 3);
    g.fillStyle(palette.lava, 1);
    g.fillCircle(3.6, 3.6, 2);
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
