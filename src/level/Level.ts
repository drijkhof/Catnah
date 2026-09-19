import { TILE } from '../config';
import { BRANCH_THICKNESS } from '../art';

/** Level width in tiles. Every row is padded to this length when parsed. */
export const LEVEL_WIDTH_IN_TILES = 80;

/**
 * Level 1, a sunlit forest. One string per row of tiles.
 *
 *   `#`  forest floor / earth
 *   `=`  branch, which is what the platforms are here
 *   `B`  fallen bough, a full-height solid used for low overhangs
 *   `o`  berry
 *   `P`  cat spawn (exactly one)
 *   `.`  empty
 *
 * Rows may be written short -- `parseLevel` pads them to
 * `LEVEL_WIDTH_IN_TILES` -- so only the interesting left-hand part of a row
 * needs typing. Long runs use `repeat()` rather than hand-counted characters,
 * because miscounting a row by one is invisible in review and maddening to
 * debug.
 *
 * The route climbs the branches left to right, drops back to the floor for a
 * gap to clear, then climbs again. The fallen bough on row 17 is the crouch
 * passage: it leaves a one-tile gap above the floor, and the standing cat is
 * taller than that, so the only way through at ground level is crouched. It can
 * still be jumped onto and crossed over the top, which keeps it a choice rather
 * than a wall.
 */
const LEVEL_SOURCE: string[] = [
  '',
  '',
  '',
  '',
  '',
  '',
  '.'.repeat(69) + 'ooo',
  '.'.repeat(68) + '=====',
  '.'.repeat(25) + 'ooo',
  '.'.repeat(24) + '=====' + '.'.repeat(32) + 'ooo',
  '.'.repeat(60) + '=====',
  '.'.repeat(17) + 'ooo' + '.'.repeat(13) + 'ooo',
  '.'.repeat(16) + '=====' + '.'.repeat(11) + '=====',
  '.'.repeat(53) + 'ooo',
  '.'.repeat(9) + 'ooo' + '.'.repeat(29) + 'oo' + '.'.repeat(9) + '=====',
  '.'.repeat(8) + '=====' + '.'.repeat(27) + '====',
  '',
  '.'.repeat(22) + 'BBBBBB',
  '...P' + '.'.repeat(71) + 'ooo',
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
];

/**
 * Row of the forest floor's surface. Scenery is planted against this line, so
 * it is stated once here rather than guessed from the parsed tiles -- the
 * crouch overhang is also made of earth and would otherwise be mistaken for
 * ground level.
 */
export const GROUND_ROW = 19;

/** A position in world (pixel) space. */
export interface Point {
  x: number;
  y: number;
}

/** One piece of collision, already resolved to a texture and a rectangle. */
export interface Solid {
  /** Top-left corner, in world pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  textureKey: string;
  /** Branches get decorative leaves hung underneath; earth does not. */
  isBranch: boolean;
}

export interface ParsedLevel {
  solids: Solid[];
  /** Centre of each berry, in world pixels. */
  berries: Point[];
  /**
   * Where the cat starts, and returns to after falling out. `y` is the ground
   * line, because the cat's origin is at its paws.
   */
  spawn: Point;
  /** World y of the forest floor's surface, for planting scenery. */
  groundLine: number;
  widthInPixels: number;
  heightInPixels: number;
}

/**
 * Turns the character grid above into world-space rectangles.
 *
 * Kept free of Phaser so levels can later come from a file, a Tiled export or
 * a generator without touching rendering or physics: anything that can produce
 * a `ParsedLevel` will work.
 */
export function parseLevel(source: string[] = LEVEL_SOURCE): ParsedLevel {
  const rows = source.map((row) => row.padEnd(LEVEL_WIDTH_IN_TILES, '.'));
  const at = (column: number, row: number): string =>
    rows[row]?.[column] ?? '.';

  const solids: Solid[] = [];
  const berries: Point[] = [];
  let spawn: Point | null = null;

  rows.forEach((tiles, row) => {
    for (let column = 0; column < LEVEL_WIDTH_IN_TILES; column += 1) {
      const x = column * TILE;
      const y = row * TILE;

      switch (tiles[column]) {
        case '#':
          solids.push({
            x,
            y,
            width: TILE,
            height: TILE,
            // Grass only where the earth is actually exposed to the sky. This
            // is what stops a stack of tiles reading as stripes.
            textureKey: at(column, row - 1) === '#' ? 'ground-fill' : 'ground-top',
            isBranch: false,
          });
          break;

        case 'B':
          solids.push({
            x,
            y,
            width: TILE,
            height: TILE,
            textureKey: 'bough',
            isBranch: false,
          });
          break;

        case '=':
          solids.push({
            x,
            y,
            width: TILE,
            // A branch is only as tall as its wood, so the collision box is
            // exactly the surface the cat lands on.
            height: BRANCH_THICKNESS,
            textureKey: branchTexture(at(column - 1, row), at(column + 1, row)),
            isBranch: true,
          });
          break;

        case 'o':
          berries.push({ x: x + TILE / 2, y: y + TILE / 2 });
          break;

        case 'P':
          spawn = { x: x + TILE / 2, y: y + TILE };
          break;

        default:
          break;
      }
    }
  });

  if (!spawn) {
    throw new Error("Level has no 'P' spawn tile.");
  }

  return {
    solids,
    berries,
    spawn,
    groundLine: GROUND_ROW * TILE,
    widthInPixels: LEVEL_WIDTH_IN_TILES * TILE,
    heightInPixels: rows.length * TILE,
  };
}

/** Picks the branch end-cap so a branch is rounded off rather than sawn through. */
function branchTexture(left: string, right: string): string {
  if (left !== '=') {
    return 'branch-left';
  }

  if (right !== '=') {
    return 'branch-right';
  }

  return 'branch-mid';
}
