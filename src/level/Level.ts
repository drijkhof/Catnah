import { TILE } from '../config';

/** Level width in tiles. Every row is padded to this length when parsed. */
export const LEVEL_WIDTH_IN_TILES = 60;

/**
 * The level, one string per row of tiles.
 *
 *   `#`  solid ground
 *   `o`  coin
 *   `P`  player spawn
 *   `.`  empty
 *
 * Rows may be written short -- `parseLevel` pads them out with empty tiles --
 * so only the interesting left-hand part of a row needs to be typed.
 */
const LEVEL_SOURCE: string[] = [
  '',
  '',
  '',
  '.'.repeat(18) + 'ooo',
  '.'.repeat(17) + '#####',
  '',
  '.'.repeat(9) + 'ooo',
  '.'.repeat(8) + '#####',
  '',
  '.'.repeat(33) + 'ooo',
  '.'.repeat(32) + '#####',
  '',
  '.'.repeat(45) + 'oo',
  '.'.repeat(44) + '####',
  '.'.repeat(24) + 'oo',
  '.'.repeat(23) + '####',
  '',
  '',
  '..P' + '.'.repeat(47) + 'ooo',
  '#'.repeat(28) + '.'.repeat(5) + '#'.repeat(27),
  '#'.repeat(28) + '.'.repeat(5) + '#'.repeat(27),
  '#'.repeat(28) + '.'.repeat(5) + '#'.repeat(27),
];

/** A position in world (pixel) space. */
export interface Point {
  x: number;
  y: number;
}

export interface ParsedLevel {
  /** Top-left corner of each solid tile, in world pixels. */
  solids: Point[];
  /** Centre of each coin, in world pixels. */
  coins: Point[];
  /** Where the player starts, and returns to after falling out. */
  spawn: Point;
  widthInPixels: number;
  heightInPixels: number;
}

/**
 * Turns the character grid above into world-space coordinates.
 *
 * Kept separate from the scene so levels can be swapped, generated or loaded
 * from a file later without touching rendering or physics code.
 */
export function parseLevel(source: string[] = LEVEL_SOURCE): ParsedLevel {
  const solids: Point[] = [];
  const coins: Point[] = [];
  let spawn: Point | null = null;

  source.forEach((rawRow, row) => {
    const tiles = rawRow.padEnd(LEVEL_WIDTH_IN_TILES, '.');

    for (let column = 0; column < LEVEL_WIDTH_IN_TILES; column += 1) {
      const x = column * TILE;
      const y = row * TILE;

      switch (tiles[column]) {
        case '#':
          solids.push({ x, y });
          break;
        case 'o':
          coins.push({ x: x + TILE / 2, y: y + TILE / 2 });
          break;
        case 'P':
          spawn = { x: x + TILE / 2, y: y + TILE / 2 };
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
    coins,
    spawn,
    widthInPixels: LEVEL_WIDTH_IN_TILES * TILE,
    heightInPixels: source.length * TILE,
  };
}
