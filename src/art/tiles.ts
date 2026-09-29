import Phaser from 'phaser';
import { TILE } from '../config';
import { bakeTexture, createRandom } from './canvas';

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

/** A lighter version of a palette colour, for the lit edge of a thing. */
function lighten(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).lighten(amount).color;
}

/** How many drawings of each ground and rock tile there are. */
export const TILE_VARIANTS = 3;

/** How far the grass fringe stands up above a ground tile, px. */
export const GRASS_FRINGE_HEIGHT = 5;

/** The blades hanging over an exposed corner of the ground. */
export const GRASS_DROOP = { width: 4, height: 7 };

/** The roots at the foot of a climbable trunk. Wider than the tile. */
export const TRUNK_FOOT = { width: 28, height: 10 };

/** How far a boulder bulges past the cells it collides in, px. */
export const BOULDER_BULGE = { x: 1, y: 2 };

/**
 * One boulder, covering a rectangle of `R` cells. Drawn on demand by the
 * scene at whatever size a cluster turns out to be, and cached by key.
 *
 * A rock is a lump, not masonry: a rounded mass, lit along the top and the
 * left, dark underneath, with a couple of bumps breaking its top line, a
 * crack or two, and moss on its crown. It bulges a pixel past the cells it
 * stands in, which is what stops it reading as a box.
 */
export function bakeBoulder(
  scene: Phaser.Scene,
  key: string,
  cellsWide: number,
  cellsHigh: number,
  palette: TilePalette,
  seed: number,
  mossy = true,
): void {
  const width = cellsWide * TILE + BOULDER_BULGE.x * 2;
  const height = cellsHigh * TILE + BOULDER_BULGE.y;
  const random = createRandom(seed);
  const top = BOULDER_BULGE.y;
  const body = { x: 0, y: top, w: width, h: height - top };
  const radius = Math.min(7, Math.floor(body.h / 2) - 1, Math.floor(body.w / 2) - 1);
  const dark = shade(palette.rock, 26);
  const mid = shade(palette.rock, 8);

  bakeTexture(scene, key, width, height, (g) => {
    // Silhouette, then the lit top and left, then the body, then the dark
    // underside -- each inset from the last so the edges become bands.
    g.fillStyle(dark, 1);
    g.fillRoundedRect(body.x, body.y, body.w, body.h, radius);
    g.fillStyle(palette.rockLight, 1);
    g.fillRoundedRect(body.x + 1, body.y + 1, body.w - 2, body.h - 3, radius);
    g.fillStyle(palette.rock, 1);
    g.fillRoundedRect(body.x + 3, body.y + 3, body.w - 5, body.h - 6, Math.max(2, radius - 2));
    g.fillStyle(mid, 1);
    g.fillEllipse(body.x + body.w * 0.62, body.y + body.h * 0.7, body.w * 0.5, body.h * 0.45);
    g.fillStyle(dark, 1);
    g.fillRoundedRect(body.x + 2, body.y + body.h - 3, body.w - 4, 3, 2);

    // A few bumps along the top, unevenly sized and spaced, so the top line
    // is not a ruler and not a row of scallops either.
    const bumps = Math.max(1, Math.round(cellsWide * 0.7));
    for (let i = 0; i < bumps; i += 1) {
      const bx = body.x + radius + ((i + random()) / bumps) * (body.w - radius * 2);
      const r = 3 + random() * 5;
      const by = body.y + r - 1 - Math.floor(random() * 3);
      g.fillStyle(dark, 1);
      g.fillCircle(bx, by, r + 1);
      g.fillStyle(palette.rockLight, 1);
      g.fillCircle(bx, by, r);
      g.fillStyle(palette.rock, 1);
      g.fillCircle(bx + 1, by + 2, Math.max(1, r - 2));
    }

    // Bumps down the sides too, so a tall rock is not a pillar of tin.
    if (cellsHigh >= 3) {
      const sideBumps = Math.round(cellsHigh * 0.6);
      for (let i = 0; i < sideBumps; i += 1) {
        const onLeft = random() < 0.5;
        const r = 3 + random() * 4;
        const by = body.y + radius + ((i + random()) / sideBumps) * (body.h - radius * 2);
        const bx = onLeft ? body.x + 1 : body.x + body.w - 1;
        g.fillStyle(dark, 1);
        g.fillCircle(bx, by, r + 1);
        g.fillStyle(onLeft ? palette.rockLight : mid, 1);
        g.fillCircle(bx, by, r);
        g.fillStyle(palette.rock, 1);
        g.fillCircle(bx + (onLeft ? 2 : -2), by + 1, Math.max(1, r - 2));
      }

      // Strata: faint dark seams across, unevenly spaced, never full width.
      for (let y = body.y + 10; y < body.y + body.h - 8; y += 9 + Math.floor(random() * 10)) {
        const sx = body.x + 3 + Math.floor(random() * 6);
        const sw = Math.floor(body.w * (0.4 + random() * 0.4));
        g.fillStyle(mid, 1);
        g.fillRect(sx, y, sw, 1);
        g.fillStyle(palette.rockLight, 1);
        g.fillRect(sx + 2, y + 1, Math.max(2, sw - 6), 1);
      }
    }

    // Cracks.
    g.fillStyle(dark, 1);
    const cracks = Math.max(1, Math.round((cellsWide * cellsHigh) / 2));
    for (let i = 0; i < cracks; i += 1) {
      let cx = body.x + 4 + Math.floor(random() * (body.w - 8));
      let cy = body.y + 4 + Math.floor(random() * (body.h - 8));
      const steps = 3 + Math.floor(random() * 4);
      for (let j = 0; j < steps; j += 1) {
        g.fillRect(cx, cy, 1, 2);
        cx += random() < 0.5 ? -1 : 1;
        cy += 2;
      }
    }

    if (!mossy) {
      return;
    }

    if (palette.surfaceStyle === 'dust') {
      // Dust and pebbles on the crown instead of moss.
      for (let x = body.x + radius - 2; x < body.x + body.w - radius + 2; x += 1) {
        const roll = random();
        if (roll < 0.5) {
          g.fillStyle(roll < 0.2 ? palette.rockLight : palette.grass, 1);
          g.fillRect(x, top - 1 + Math.floor(random() * 2), 1, 1 + Math.floor(random() * 2));
        }
      }
      return;
    }

    // Moss on the crown: a band of green along the top that follows the
    // bumps, ragged, standing up a little, with a few drips down the face.
    for (let x = body.x + radius - 2; x < body.x + body.w - radius + 2; x += 1) {
      const roll = random();
      if (roll < 0.8) {
        g.fillStyle(roll < 0.25 ? palette.leafLight : roll < 0.6 ? palette.grass : palette.grassDark, 1);
        g.fillRect(x, Math.floor(random() * 2), 1, 2 + Math.floor(random() * 3));
      }
      if (random() < 0.1) {
        g.fillStyle(palette.grassDark, 1);
        g.fillRect(x, top + 2, 1, 3 + Math.floor(random() * 4));
      }
    }
  });
}

/**
 * Earth: a lit lip just under the surface with a few stones bedded in it,
 * then deeper, darker soil. Only the top third is ever really seen -- the
 * ground shade (`world/GroundShade.ts`) swallows the rest -- so that is where
 * the drawing goes.
 */
function drawEarth(
  g: Phaser.GameObjects.Graphics,
  palette: TilePalette,
  random: () => number,
  surface: boolean,
): void {
  const deep = shade(palette.dirt, 14);
  const lip = lighten(palette.dirt, 10);

  g.fillStyle(palette.dirt, 1);
  g.fillRect(0, 0, TILE, TILE);

  // Only the surface tile is banded -- a lit lip under the grass, darker
  // earth below it. A fill tile is plain earth with stones in it: a band on
  // every fill tile lined up into stripes wherever a wall was several tiles
  // thick and lit, which in a cave is everywhere.
  if (surface) {
    g.fillStyle(deep, 1);
    g.fillRect(0, 11, TILE, TILE);
    g.fillStyle(lip, 1);
    g.fillRect(0, 6, TILE, 2);
  }

  // Stones: rounded lumps with a lit top edge, sitting in the lip.
  const count = surface ? 3 : 2;

  for (let i = 0; i < count; i += 1) {
    const w = 3 + Math.floor(random() * 3);
    const h = 2 + Math.floor(random() * 2);
    const x = Math.floor(random() * (TILE - w));
    const y = surface ? 7 + Math.floor(random() * 5) : 2 + Math.floor(random() * 11);

    g.fillStyle(palette.dirtDark, 1);
    g.fillRect(x, y, w, h);
    g.fillRect(x + 1, y - 1, w - 2, 1);
    g.fillRect(x + 1, y + h, w - 2, 1);
    g.fillStyle(lip, 1);
    g.fillRect(x + 1, y, w - 2, 1);
  }
}

/**
 * Fitted stone: a wall of angular blocks with dark mortar between them.
 *
 * The blocks are the cells of a jittered grid on a torus -- the layout wraps
 * at every edge and is the same for every variant -- so tiles butt together
 * without a seam and the blocks read as running across the wall. Variants
 * differ in tone and cracks only. Each block is lit from the top-left. The
 * top tile has a course of flat, paler cap stones under its dust.
 */
/** Turf: a ragged top, a lit crown, and a dark seam where it meets the soil. */
function drawGrassTop(
  g: Phaser.GameObjects.Graphics,
  palette: TilePalette,
  random: () => number,
): void {
  if (palette.surfaceStyle === 'dust') {
    drawDustTop(g, palette, random);
    return;
  }

  const light = lighten(palette.grass, 16);
  const seam = shade(palette.grassDark, 30);

  g.fillStyle(seam, 1);
  g.fillRect(0, 5, TILE, 1);
  g.fillStyle(palette.grassDark, 1);
  g.fillRect(0, 2, TILE, 3);
  g.fillStyle(palette.grass, 1);
  g.fillRect(0, 0, TILE, 3);

  // Roots of grass dipping into the seam, and a few pale blades on top.
  for (let x = 0; x < TILE; x += 1) {
    if (random() < 0.3) {
      g.fillStyle(palette.grassDark, 1);
      g.fillRect(x, 5, 1, 1);
    }

    if (random() < 0.35) {
      g.fillStyle(light, 1);
      g.fillRect(x, 1, 1, 1);
    }

    if (random() < 0.25) {
      g.fillStyle(palette.grassDark, 1);
      g.fillRect(x, 1, 1, 2);
    }
  }
}

/**
 * Dust: a thin pale band where the rock has been worn, with pebbles lying in
 * it, and a dark seam below. No sun, so nothing grows.
 */
function drawDustTop(
  g: Phaser.GameObjects.Graphics,
  palette: TilePalette,
  random: () => number,
): void {
  g.fillStyle(shade(palette.grassDark, 30), 1);
  g.fillRect(0, 3, TILE, 1);
  g.fillStyle(palette.grassDark, 1);
  g.fillRect(0, 1, TILE, 2);
  g.fillStyle(palette.grass, 1);
  g.fillRect(0, 0, TILE, 1);

  for (let x = 0; x < TILE; x += 1) {
    const roll = random();
    if (roll < 0.18) {
      // A pebble: a lit top over a dark base.
      g.fillStyle(palette.rockLight, 1);
      g.fillRect(x, 0, 2, 1);
      g.fillStyle(palette.rockDark, 1);
      g.fillRect(x, 1, 2, 1);
      x += 1;
    } else if (roll < 0.3) {
      g.fillStyle(palette.grassDark, 1);
      g.fillRect(x, 0, 1, 1);
    }
  }
}

/** The blades above a grass tile. Its bottom row joins the tile's top. */
function drawGrassFringe(
  g: Phaser.GameObjects.Graphics,
  palette: TilePalette,
  random: () => number,
): void {
  if (palette.surfaceStyle === 'dust') {
    // A few pebbles lying on the surface, barely standing above it.
    const bottom = GRASS_FRINGE_HEIGHT;
    for (let x = 0; x < TILE - 1; x += 1) {
      if (random() < 0.12) {
        g.fillStyle(palette.rockLight, 1);
        g.fillRect(x, bottom - 2, 2, 1);
        g.fillStyle(palette.rockDark, 1);
        g.fillRect(x, bottom - 1, 2, 1);
        x += 2;
      }
    }
    return;
  }

  const light = lighten(palette.grass, 16);
  const bottom = GRASS_FRINGE_HEIGHT;

  g.fillStyle(palette.grass, 1);
  g.fillRect(0, bottom - 1, TILE, 1);

  for (let x = 0; x < TILE; x += 1) {
    const roll = random();

    if (roll < 0.45) {
      continue;
    }

    const height = roll < 0.75 ? 2 : roll < 0.92 ? 3 : 5;
    const tone = random() < 0.3 ? palette.grassDark : random() < 0.5 ? light : palette.grass;

    g.fillStyle(tone, 1);
    g.fillRect(x, bottom - height, 1, height);
  }
}

/**
 * Cobblestone: two courses of stones with a lit top-left edge and a dark
 * underside, set in a darker mortar with the corners knocked off.
 */
function drawCobble(
  g: Phaser.GameObjects.Graphics,
  palette: TilePalette,
  random: () => number,
): void {
  const mortar = shade(palette.rock, 32);

  g.fillStyle(mortar, 1);
  g.fillRect(0, 0, TILE, TILE);

  const courses = [
    { y: 0, h: 8 },
    { y: 8, h: 8 },
  ];

  courses.forEach((course, i) => {
    // Each course is split into two stones at a different place, so the
    // joints stagger like laid stone rather than lining up like a grid.
    const split = (i === 0 ? 5 : 9) + Math.floor(random() * 4);
    const stones = [
      { x: 0, w: split },
      { x: split, w: TILE - split },
    ];

    for (const stone of stones) {
      const x = stone.x;
      const y = course.y;
      const w = stone.w;
      const h = course.h;
      const tone = random() < 0.3 ? shade(palette.rock, 8) : palette.rock;

      g.fillStyle(tone, 1);
      g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle(palette.rockLight, 1);
      g.fillRect(x + 1, y + 1, w - 3, 1);
      g.fillRect(x + 1, y + 1, 1, h - 3);
      g.fillStyle(palette.rockDark, 1);
      g.fillRect(x + 2, y + h - 2, w - 3, 1);
      g.fillRect(x + w - 2, y + 2, 1, h - 3);
    }
  });
}

/** A little moss and grass on top of a rock, so a pillar has a green crown. */
function drawMossCap(
  g: Phaser.GameObjects.Graphics,
  palette: TilePalette,
  random: () => number,
): void {
  if (palette.surfaceStyle === 'dust') {
    g.fillStyle(palette.grass, 1);
    g.fillRect(0, 0, TILE, 1);
    for (let x = 0; x < TILE - 1; x += 3) {
      if (random() < 0.4) {
        g.fillStyle(palette.rockLight, 1);
        g.fillRect(x, 0, 2, 1);
      }
    }
    return;
  }

  g.fillStyle(palette.grassDark, 1);
  g.fillRect(0, 0, TILE, 2);
  g.fillStyle(palette.grass, 1);
  g.fillRect(0, 0, TILE, 1);

  for (let x = 0; x < TILE; x += 1) {
    if (random() < 0.4) {
      g.fillStyle(palette.leafLight, 1);
      g.fillRect(x, 0, 1, 1);
    }

    if (random() < 0.3) {
      g.fillStyle(palette.grassDark, 1);
      g.fillRect(x, 2, 1, 1 + Math.floor(random() * 2));
    }
  }
}

/**
 * The colours a level's tiles are drawn in.
 *
 * Every level uses the same tile *shapes* and differs by palette, which is what
 * lets a cave and a city reuse the whole tile format -- a girder and a branch
 * are the same one-way platform underneath. Character comes from the backdrop.
 */
/**
 * What a `T` column is made of, in this place. Not a liana -- `l` draws the
 * same liana everywhere, on its own, regardless of this.
 */
export type ColumnStyle = 'trunk' | 'rope' | 'pipe' | 'chain';

/** What a one-way platform is made of. */
export type PlatformStyle = 'branch' | 'shelf' | 'girder';

/**
 * What grows -- or lies -- on a surface. Grass where there is sun; dust and
 * pebbles where there is none. `grass` and `grassDark` are the surface's
 * colours either way: green outdoors, pale grey in a cave.
 */
export type SurfaceStyle = 'grass' | 'dust';

/** What the ground is made of: earth with stones in it, or fitted stone. */
export type GroundStyle = 'earth' | 'stone';

export interface TilePalette {
  columnStyle: ColumnStyle;
  platformStyle: PlatformStyle;
  surfaceStyle: SurfaceStyle;
  groundStyle: GroundStyle;
  /** What the ground fades to, a tile in from any surface. Near black. */
  shade: number;
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
  //
  // Three variants of every ground and rock tile, picked by the level from a
  // tile's own place in the grid, so a run of floor never repeats its stones
  // in step. The suffix-less one is variant 0; `Level.ts` adds `-1` and `-2`.
  for (let variant = 0; variant < TILE_VARIANTS; variant += 1) {
    const suffix = variant === 0 ? '' : `-${variant}`;

    bakeTexture(scene, key(`ground-top${suffix}`), TILE, TILE, (g) => {
      drawEarth(g, palette, createRandom(101 + variant * 17), true);
      drawGrassTop(g, palette, createRandom(211 + variant * 31));
    });

    bakeTexture(scene, key(`ground-fill${suffix}`), TILE, TILE, (g) => {
      drawEarth(g, palette, createRandom(307 + variant * 23), false);
    });

    bakeTexture(scene, key(`rock-top${suffix}`), TILE, TILE, (g) => {
      drawCobble(g, palette, createRandom(401 + variant * 29));
      drawMossCap(g, palette, createRandom(503 + variant * 37));
    });

    bakeTexture(scene, key(`rock-fill${suffix}`), TILE, TILE, (g) => {
      drawCobble(g, palette, createRandom(601 + variant * 41));
    });

    // The blades that stand up above a grass tile. Scenery: `GameScene` puts
    // one over every ground-top tile, so the ground's silhouette against the
    // sky is ragged rather than a ruled line.
    bakeTexture(scene, key(`grass-fringe${suffix}`), TILE, GRASS_FRINGE_HEIGHT, (g) => {
      drawGrassFringe(g, palette, createRandom(701 + variant * 43));
    });
  }

  // A few blades hanging over the corner where the ground ends, so an edge
  // reads as turf overhanging earth rather than a tile boundary.
  bakeTexture(scene, key('grass-droop'), GRASS_DROOP.width, GRASS_DROOP.height, (g) => {
    const { width, height } = GRASS_DROOP;
    g.fillStyle(palette.grassDark, 1);
    g.fillRect(0, 0, width, 2);
    g.fillRect(width - 2, 2, 2, height - 4);
    g.fillRect(width - 3, height - 3, 2, 3);
    g.fillStyle(palette.grass, 1);
    g.fillRect(1, 0, width - 1, 1);
    g.fillRect(width - 1, 1, 1, 3);
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
        // Bark, the full width of the tile: ridges in four tones, lit from the
        // left, with the odd notch so the edge is not a ruler. The climb zone
        // is the tile anyway; a thin pole in the middle of it read as a post.
        const deep = shade(palette.trunkDark, 20);
        g.fillStyle(palette.trunkDark, 1);
        g.fillRect(0, 0, TILE, TILE);
        g.fillStyle(palette.trunk, 1);
        g.fillRect(1, 0, TILE - 3, TILE);
        g.fillStyle(palette.trunkLight, 1);
        g.fillRect(2, 0, 2, TILE);
        g.fillRect(7, 0, 1, TILE);
        g.fillStyle(palette.trunkDark, 1);
        g.fillRect(5, 0, 1, TILE);
        g.fillRect(9, 0, 2, TILE);
        g.fillRect(13, 0, 1, TILE);
        g.fillStyle(deep, 1);
        g.fillRect(TILE - 2, 0, 2, TILE);
        g.fillRect(10, 3, 1, 5);
        g.fillRect(5, 10, 1, 4);
        // Notches in the bark.
        g.fillStyle(palette.trunkLight, 1);
        g.fillRect(3, 6, 2, 1);
        g.fillRect(8, 12, 2, 1);
        g.fillStyle(deep, 1);
        g.fillRect(6, 2, 1, 1);
        g.fillRect(11, 9, 1, 1);
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

  /**
   * The bare stem both the liana and the dead vine grow from. Baked
   * unconditionally, in every theme, rather than switched on by `columnStyle`
   * the way the trunk above is -- these look the same wherever they hang, in
   * a level that may also have real, unclimbable trees standing in the same
   * `columnStyle`.
   */
  const drawVineStem = (g: Phaser.GameObjects.Graphics): void => {
    g.fillStyle(palette.trunk, 1);
    g.fillRect(6, 0, 4, TILE);
    g.fillStyle(palette.trunkDark, 1);
    g.fillRect(7, 0, 1, TILE);
  };

  const drawLiana = (g: Phaser.GameObjects.Graphics): void => {
    drawVineStem(g);
    // Leaves along it -- this, and nothing about the stem, is what tells a
    // liana apart from a dead vine at a glance.
    g.fillStyle(palette.leaf, 1);
    g.fillEllipse(3, 4, 6, 4);
    g.fillEllipse(13, 11, 6, 4);
    g.fillStyle(palette.leafLight, 1);
    g.fillEllipse(12, 10, 3, 2);
  };

  bakeTexture(scene, key('liana'), TILE, TILE, drawLiana);

  // Top and anchor point are the same picture: a liana has nothing like the
  // city's lamp or the cave's bolted ring to be instead, only ever leaves.
  const drawLianaAnchor = (g: Phaser.GameObjects.Graphics): void => {
    drawLiana(g);
    g.fillStyle(palette.leaf, 1);
    g.fillCircle(3, 3, 4);
    g.fillCircle(13, 4, 4);
    g.fillStyle(palette.leafLight, 1);
    g.fillCircle(8, 1, 3);
  };

  bakeTexture(scene, key('liana-top'), TILE, TILE, drawLianaAnchor);
  bakeTexture(scene, key('liana-head'), TILE, TILE, drawLianaAnchor);

  /**
   * The dead vine: the same stem as a liana, and nothing else -- no leaves at
   * the top or anywhere along it, and so no reason for a separate top/head
   * picture either. One texture for the whole thing, decoration only.
   */
  bakeTexture(scene, key('dead-vine'), TILE, TILE, drawVineStem);

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

    // Bark: a lit top edge, grain lines in the wood, and a knot.
    g.fillStyle(lighten(palette.branch, 14), 1);
    g.fillRect(0, 0, TILE, 1);
    g.fillStyle(palette.branchDark, 1);
    g.fillRect(2, 2, 5, 1);
    g.fillRect(9, 3, 6, 1);
    g.fillRect(0, 4, 3, 1);
    g.fillStyle(shade(palette.branchDark, 18), 1);
    g.fillRect(12, 1, 2, 2);
    g.fillRect(6, 5, 1, 3);
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

  for (let variant = 0; variant < TILE_VARIANTS; variant += 1) {
    const suffix = variant === 0 ? '' : `-${variant}`;
    const random = createRandom(811 + variant * 47);

    bakeTexture(scene, key(`branch-leaves${suffix}`), TILE, BRANCH_LEAF_DROP, (g) => {
      // Shadowed leaves hanging under the wood, lit ones catching light at
      // the sides, and a few single leaves at the bottom so the edge is
      // ragged. Three drawings, so a long branch does not scallop in step.
      const dark = shade(palette.leaf, 22);

      g.fillStyle(dark, 1);
      for (let i = 0; i < 3; i += 1) {
        g.fillCircle(2 + i * 6 + random() * 3, 3 + random() * 3, 3 + random() * 2);
      }
      g.fillStyle(palette.leaf, 1);
      for (let i = 0; i < 3; i += 1) {
        g.fillCircle(1 + i * 6 + random() * 4, 1 + random() * 2, 2);
      }
      g.fillStyle(dark, 1);
      for (let i = 0; i < 3; i += 1) {
        g.fillRect(2 + i * 5 + Math.floor(random() * 3), 7 + Math.floor(random() * 3), 1, 2);
      }
    });
  }

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

      // Light on the upper lumps only: the canopy is lit from above, and a
      // clump that is lighter at the top and darker beneath has a shape.
      g.fillStyle(shade(palette.leaf, 10), 1);
      g.fillCircle(width * 0.3, height * 0.34, height * 0.14);
      g.fillCircle(width * 0.56, height * 0.22, height * 0.12);
      g.fillCircle(width * 0.72, height * 0.4, height * 0.1);
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
    // A fallen log: lit along the top, grain along its length, dark under.
    g.fillStyle(shade(palette.branchDark, 18), 1);
    g.fillRect(0, 0, TILE, TILE);
    g.fillStyle(palette.branchDark, 1);
    g.fillRect(0, 2, TILE, 11);
    g.fillStyle(palette.branch, 1);
    g.fillRect(0, 3, TILE, 7);
    g.fillStyle(lighten(palette.branch, 14), 1);
    g.fillRect(0, 3, TILE, 1);
    g.fillStyle(palette.branchDark, 1);
    g.fillRect(1, 6, 6, 1);
    g.fillRect(9, 8, 6, 1);
    g.fillRect(12, 5, 3, 1);
    g.fillStyle(shade(palette.branchDark, 18), 1);
    g.fillRect(5, 4, 2, 2);

    // Moss along the top.
    g.fillStyle(palette.leaf, 1);
    g.fillRect(0, 0, TILE, 3);
    g.fillStyle(palette.leafLight, 1);
    g.fillRect(3, 0, 4, 1);
    g.fillRect(11, 0, 3, 1);
    g.fillStyle(shade(palette.leaf, 22), 1);
    g.fillRect(2, 2, 2, 1);
    g.fillRect(9, 2, 3, 1);
  });

  // Roots flaring out at the foot of a trunk, wider than the tile, so a tree
  // grows out of the ground rather than standing on it.
  bakeTexture(scene, key('trunk-foot'), TRUNK_FOOT.width, TRUNK_FOOT.height, (g) => {
    const { width, height } = TRUNK_FOOT;
    const centre = width / 2;
    g.fillStyle(palette.trunkDark, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(centre - 8, 0),
        new Phaser.Math.Vector2(centre + 8, 0),
        new Phaser.Math.Vector2(width, height),
        new Phaser.Math.Vector2(0, height),
      ],
      true,
    );
    g.fillStyle(palette.trunk, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(centre - 7, 0),
        new Phaser.Math.Vector2(centre + 5, 0),
        new Phaser.Math.Vector2(width - 4, height),
        new Phaser.Math.Vector2(3, height),
      ],
      true,
    );
    g.fillStyle(palette.trunkLight, 1);
    g.fillRect(centre - 6, 0, 2, height - 2);
    g.fillStyle(palette.trunkDark, 1);
    g.fillRect(centre - 1, 2, 1, height - 2);
    g.fillRect(centre + 3, 4, 1, height - 4);
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

/** How far a whole trunk bulges past its column of cells, px, each side. */
export const TRUNK_BULGE = 6;

/** How far a whole branch reaches into its trunk, and how high its twigs stand. */
export const BRANCH_BULGE = { root: 5, top: 3 };

/**
 * One trunk, covering a column of `T` cells: drawn on demand by the scene at
 * whatever height a column turns out to be, and cached by key.
 *
 * A tree, not a post: wider at the foot than the top, flaring into roots at
 * the very bottom, with bark ridges in four tones running the whole height,
 * a knot or two, and the odd notch in the outline. Lit from the left.
 */
export function bakeTrunk(
  scene: Phaser.Scene,
  key: string,
  cells: number,
  palette: TilePalette,
  seed: number,
): void {
  const width = TILE + TRUNK_BULGE * 2;
  const height = cells * TILE;
  const centre = width / 2;
  const random = createRandom(seed);
  const deep = shade(palette.trunkDark, 22);
  const footHeight = Math.min(10, height);

  // Width at the top and the base, and how far the roots flare.
  const topWidth = cells <= 2 ? 16 : 14;
  const baseWidth = cells <= 2 ? 18 : 20;

  // A wobble along the outline, so the edges are not ruled lines.
  const wobble: number[] = [];
  let w = 0;
  for (let y = 0; y < height; y += 1) {
    if (y % 6 === 0) {
      w = Math.floor(random() * 3) - 1;
    }
    wobble.push(w);
  }

  const knots = Array.from({ length: Math.max(1, Math.floor(cells / 3)) }, () => ({
    y: 8 + Math.floor(random() * Math.max(1, height - 16)),
    side: random() < 0.5 ? -1 : 1,
  }));

  bakeTexture(scene, key, width, height, (g) => {
    for (let y = 0; y < height; y += 1) {
      const t = y / Math.max(1, height - 1);
      let half = (topWidth + (baseWidth - topWidth) * t) / 2 + wobble[y] * 0.5;

      // Roots.
      const fromFoot = height - y;
      if (fromFoot <= footHeight) {
        const f = 1 - fromFoot / footHeight;
        half += f * f * (width / 2 - half);
      }

      const left = Math.round(centre - half);
      const right = Math.round(centre + half);
      const span = right - left;

      g.fillStyle(palette.trunkDark, 1);
      g.fillRect(left, y, span, 1);
      g.fillStyle(palette.trunk, 1);
      g.fillRect(left + 1, y, span - 3, 1);
      // Lit edge on the left, ridges across, deep shadow on the right.
      g.fillStyle(palette.trunkLight, 1);
      g.fillRect(left + 2, y, 2, 1);
      g.fillRect(left + Math.round(span * 0.45), y, 1, 1);
      g.fillStyle(palette.trunkDark, 1);
      g.fillRect(left + Math.round(span * 0.3), y, 1, 1);
      g.fillRect(left + Math.round(span * 0.62), y, 2, 1);
      g.fillStyle(deep, 1);
      g.fillRect(left + Math.round(span * 0.82), y, 1, 1);
      g.fillRect(right - 2, y, 2, 1);
    }

    // Knots: a dark ring with a lit centre, set a little into the bark.
    for (const knot of knots) {
      const kx = centre + knot.side * 3;
      g.fillStyle(deep, 1);
      g.fillEllipse(kx, knot.y, 6, 5);
      g.fillStyle(palette.trunk, 1);
      g.fillEllipse(kx, knot.y, 4, 3);
      g.fillStyle(palette.trunkLight, 1);
      g.fillRect(kx - 1, knot.y - 1, 1, 1);
    }

    // Notches in the bark.
    for (let i = 0; i < cells * 2; i += 1) {
      const ny = Math.floor(random() * height);
      g.fillStyle(random() < 0.5 ? deep : palette.trunkLight, 1);
      g.fillRect(centre - 6 + Math.floor(random() * 10), ny, 1 + Math.floor(random() * 2), 1);
    }
  });
}

/**
 * One branch, covering a run of `=` cells, growing out of a trunk on `base`'s
 * side (or free-standing, for `none`): thick where it leaves the trunk, thin
 * and rounded at the tip, with a lit top, a dark underside, grain, and a few
 * twigs standing up off it. The top surface stays flat: that is what the cat
 * stands on, and the taper is all taken out of the underside.
 *
 * @returns the wood's thickness under each cell, so leaves can hang from it.
 */
export function bakeBranch(
  scene: Phaser.Scene,
  key: string,
  cells: number,
  base: 'left' | 'right' | 'none',
  palette: TilePalette,
  seed: number,
): number[] {
  const root = base === 'none' ? 0 : BRANCH_BULGE.root;
  const width = cells * TILE + root;
  const height = BRANCH_THICKNESS + BRANCH_BULGE.top;
  const top = BRANCH_BULGE.top;
  const random = createRandom(seed);
  const deep = shade(palette.branchDark, 18);
  const lit = lighten(palette.branch, 14);
  const thicknessAt: number[] = [];

  // Thickness along the wood, from the trunk to the tip. Free-standing wood
  // is a fallen bough: even all along, rounded at both ends.
  const thickness = (x: number): number => {
    const length = cells * TILE;
    const fromBase = base === 'right' ? length - 1 - x : x;
    const t = base === 'none' ? 0.5 : fromBase / Math.max(1, length - 1);
    const tipFade = Math.min(1, (length - fromBase) / 6);
    const endFade = base === 'none' ? Math.min(1, x / 4, (length - 1 - x) / 4) : 1;
    return Math.max(2, Math.round((BRANCH_THICKNESS - 3 * t) * (0.6 + 0.4 * tipFade) * (0.5 + 0.5 * endFade)));
  };

  bakeTexture(scene, key, width, height, (g) => {
    for (let cx = 0; cx < cells * TILE; cx += 1) {
      const th = thickness(cx);
      const x = base === 'left' ? cx + root : cx;

      g.fillStyle(palette.branchDark, 1);
      g.fillRect(x, top, 1, th);
      g.fillStyle(palette.branch, 1);
      g.fillRect(x, top + 1, 1, Math.max(0, th - 2));
      g.fillStyle(lit, 1);
      g.fillRect(x, top, 1, 1);

      if (cx % TILE === 0) {
        thicknessAt.push(th);
      }
    }

    // The flare where the wood leaves the trunk: a little wider than the
    // branch, a little higher, so the join is hidden and looks grown.
    if (base !== 'none') {
      const fx = base === 'left' ? 0 : width - root;
      g.fillStyle(palette.branchDark, 1);
      g.fillRect(fx, top - 1, root, BRANCH_THICKNESS + 2);
      g.fillStyle(palette.branch, 1);
      g.fillRect(fx + (base === 'left' ? 1 : 0), top, root - 1, BRANCH_THICKNESS);
      g.fillStyle(lit, 1);
      g.fillRect(fx, top - 1, root, 1);
    }

    // Grain and a knot.
    g.fillStyle(palette.branchDark, 1);
    for (let i = 0; i < cells * 2; i += 1) {
      g.fillRect(root + Math.floor(random() * (cells * TILE - 6)), top + 2 + Math.floor(random() * 3), 3 + Math.floor(random() * 4), 1);
    }
    g.fillStyle(deep, 1);
    g.fillRect(root + Math.floor(random() * (cells * TILE - 4)), top + 1, 2, 2);

    // Twigs standing up off the top, each with a leaf or two.
    const twigs = Math.max(1, Math.round(cells * 0.6));
    for (let i = 0; i < twigs; i += 1) {
      const tx = root + 3 + Math.floor(random() * (cells * TILE - 6));
      g.fillStyle(palette.branchDark, 1);
      g.fillRect(tx, 0, 1, top);
      g.fillStyle(random() < 0.5 ? palette.leaf : palette.leafLight, 1);
      g.fillRect(tx - 1, 0, 2, 1);
      g.fillRect(tx + 1, 1, 1, 1);
    }
  });

  return thicknessAt;
}

/** How far a stone shelf bulges past its cells, px: sideways, and up for lichen. */
export const SHELF_BULGE = { side: 1, top: 2 };

/**
 * One stone shelf, covering a run of `=` cells in a place whose platforms are
 * rock: a slab with rounded ends, lit along the top, dark underneath, a
 * crack or two and lichen on top. The top stays flat: the cat stands on it.
 */
export function bakeShelf(
  scene: Phaser.Scene,
  key: string,
  cells: number,
  palette: TilePalette,
  seed: number,
): void {
  const width = cells * TILE + SHELF_BULGE.side * 2;
  const height = BRANCH_THICKNESS + SHELF_BULGE.top;
  const top = SHELF_BULGE.top;
  const random = createRandom(seed);
  const dark = shade(palette.rock, 26);
  const radius = 3;

  bakeTexture(scene, key, width, height, (g) => {
    g.fillStyle(dark, 1);
    g.fillRoundedRect(0, top, width, BRANCH_THICKNESS, radius);
    g.fillStyle(palette.rockLight, 1);
    g.fillRoundedRect(1, top + 1, width - 2, BRANCH_THICKNESS - 3, radius);
    g.fillStyle(palette.rock, 1);
    g.fillRoundedRect(2, top + 2, width - 4, BRANCH_THICKNESS - 5, 2);

    // Cracks and a darker patch or two.
    for (let i = 0; i < cells; i += 1) {
      const cx = 3 + Math.floor(random() * (width - 6));
      g.fillStyle(dark, 1);
      g.fillRect(cx, top + 2 + Math.floor(random() * 3), 1 + Math.floor(random() * 3), 1);
      if (random() < 0.5) {
        g.fillStyle(shade(palette.rock, 10), 1);
        g.fillRect(cx - 2, top + 3, 4, 2);
      }
    }

    // Lichen on top, in dots, standing up a little.
    for (let x = 2; x < width - 2; x += 1) {
      if (random() < 0.3) {
        g.fillStyle(random() < 0.5 ? palette.grass : palette.grassDark, 1);
        g.fillRect(x, top - 1 + Math.floor(random() * 2), 1, 1 + Math.floor(random() * 2));
      }
    }
  });
}

/** How far a fallen log bulges past its cells: sideways, and up for stubs and moss. */
export const LOG_BULGE = { side: 2, top: 4 };

/**
 * One fallen tree, covering a run of `B` cells. Drawn on demand at the
 * length the level asks for and cached by key.
 *
 * A trunk lying down: bark ridges running along its length in four tones,
 * lit along the top and dark underneath, rounded at both ends with the grain
 * showing in rings on the one that was broken off, a knot or two, a couple
 * of snapped branch stubs standing up off it, and moss along the top.
 */
export function bakeLog(
  scene: Phaser.Scene,
  key: string,
  cells: number,
  palette: TilePalette,
  seed: number,
): void {
  const width = cells * TILE + LOG_BULGE.side * 2;
  const height = TILE + LOG_BULGE.top;
  const top = LOG_BULGE.top;
  const random = createRandom(seed);
  const deep = shade(palette.trunkDark, 22);
  const radius = 7;
  const bodyW = width;
  const bodyH = TILE;

  bakeTexture(scene, key, width, height, (g) => {
    // Silhouette, then the lit top, the bark, the dark underside.
    g.fillStyle(deep, 1);
    g.fillRoundedRect(0, top, bodyW, bodyH, radius);
    g.fillStyle(palette.trunkDark, 1);
    g.fillRoundedRect(1, top + 1, bodyW - 2, bodyH - 2, radius - 1);
    g.fillStyle(palette.trunk, 1);
    g.fillRoundedRect(2, top + 2, bodyW - 4, bodyH - 6, radius - 2);
    g.fillStyle(palette.trunkLight, 1);
    g.fillRoundedRect(3, top + 2, bodyW - 6, 2, 2);

    // Bark ridges along the length: broken lines in the light and dark tones,
    // never the full length, so the wood reads as bark rather than stripes.
    for (let y = top + 5; y < top + bodyH - 3; y += 2) {
      let x = 4 + Math.floor(random() * 6);
      while (x < bodyW - 6) {
        const len = 4 + Math.floor(random() * 9);
        const tone = random() < 0.35 ? palette.trunkLight : y > top + 10 ? deep : palette.trunkDark;
        g.fillStyle(tone, 1);
        g.fillRect(x, y, Math.min(len, bodyW - 6 - x), 1);
        x += len + 2 + Math.floor(random() * 5);
      }
    }

    // Knots.
    for (let i = 0; i < Math.max(1, Math.round(cells / 2)); i += 1) {
      const kx = 8 + Math.floor(random() * (bodyW - 16));
      const ky = top + 5 + Math.floor(random() * 6);
      g.fillStyle(deep, 1);
      g.fillEllipse(kx, ky, 6, 4);
      g.fillStyle(palette.trunk, 1);
      g.fillEllipse(kx, ky, 4, 2);
    }

    // The broken end: rings of grain, on the right.
    const ex = bodyW - radius - 1;
    const ey = top + bodyH / 2;
    g.fillStyle(deep, 1);
    g.fillEllipse(ex, ey, 9, bodyH - 3);
    g.fillStyle(lighten(palette.trunkLight, 10), 1);
    g.fillEllipse(ex, ey, 7, bodyH - 6);
    g.fillStyle(palette.trunk, 1);
    g.fillEllipse(ex, ey, 5, bodyH - 9);
    g.fillStyle(deep, 1);
    g.fillEllipse(ex, ey, 2, 3);

    // Snapped branch stubs standing up off the top.
    const stubs = Math.max(1, Math.round(cells * 0.5));
    for (let i = 0; i < stubs; i += 1) {
      const sx = 6 + Math.floor(random() * (bodyW - 18));
      const sh = 2 + Math.floor(random() * 3);
      g.fillStyle(palette.trunkDark, 1);
      g.fillRect(sx, top - sh, 4, sh + 2);
      g.fillStyle(palette.trunk, 1);
      g.fillRect(sx + 1, top - sh, 2, sh + 1);
      g.fillStyle(lighten(palette.trunkLight, 10), 1);
      g.fillRect(sx + 1, top - sh, 2, 1);
    }

    // Moss along the top, ragged, thickest away from the broken end.
    for (let x = 3; x < bodyW - 10; x += 1) {
      const roll = random();
      if (roll < 0.6) {
        g.fillStyle(roll < 0.2 ? palette.leafLight : roll < 0.4 ? palette.leaf : shade(palette.leaf, 22), 1);
        g.fillRect(x, top - 1 + Math.floor(random() * 2), 1, 2 + Math.floor(random() * 2));
      }
    }
  });
}
