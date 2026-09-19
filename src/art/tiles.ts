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
export interface TilePalette {
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
  const drawColumn = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(palette.trunk, 1);
    g.fillRect(inset, 0, TRUNK_WIDTH, TILE);

    g.fillStyle(palette.trunkDark, 1);
    g.fillRect(inset + 1, 0, 1, TILE);
    g.fillRect(inset + 7, 0, 2, TILE);

    g.fillStyle(palette.trunkLight, 1);
    g.fillRect(inset + 4, 0, 1, TILE);
    g.fillRect(inset + 10, 0, 1, TILE);
  };

  bakeTexture(scene, key('trunk'), TILE, TILE, drawColumn);

  bakeTexture(scene, key('trunk-top'), TILE, TILE, (g) => {
    drawColumn(g);
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

  // A nest is somewhere to stand, so it is drawn as a bowl of woven straw
  // rather than as a bar: a dipped rim, and stems crossing every which way.
  bakeTexture(scene, key('nest'), TILE, TILE, (g) => {
    g.fillStyle(palette.nestShadow, 1);
    g.fillRect(0, 4, TILE, TILE - 4);

    g.fillStyle(palette.nestStraw, 1);
    g.fillRect(0, 2, 4, 4);
    g.fillRect(TILE - 4, 2, 4, 4);
    g.fillRect(0, 6, TILE, 4);

    // Loose stems, angled so the weave does not read as stripes.
    g.fillStyle(palette.nestStrawLight, 1);
    g.fillRect(1, 5, 5, 1);
    g.fillRect(9, 4, 6, 1);
    g.fillRect(3, 9, 7, 1);
    g.fillRect(8, 11, 6, 1);
    g.fillRect(2, 12, 4, 1);

    g.fillStyle(palette.nestShadow, 1);
    g.fillRect(5, 3, 6, 2);
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
