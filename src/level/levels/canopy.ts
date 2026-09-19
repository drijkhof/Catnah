import type { LevelDefinition } from '../Level';

/**
 * Level 4: the canopy.
 *
 * **390 tiles**, built rather than written out, around one move: **jumping off
 * a liana onto a platform out of its reach**. The lianas hang from the roof
 * rather than standing on the floor, and every platform is too high to be
 * reached from the ground, so there is no way along the top that does not
 * involve letting go in mid-air.
 *
 * The floor is still there and still walkable, with hedgehogs on it. It is the
 * slow way and the safe way; the canopy is the fast way and the way the little
 * hearts are on.
 *
 * It is made of **spans**, each one liana, gap, platform, liana. Every third
 * span hangs **a bank of lianas side by side** instead of a single rope --
 * holding on is not pinned to one of them, so that stretch is crossed sideways
 * as much as it is climbed.
 *
 * The cat starts on a small boulder, because a hedgehog paces the floor it
 * would otherwise start on.
 */

const WIDTH = 390;
const HEIGHT = 30;

/** The roof the lianas hang from, and the floor a long way under it. */
const ROOF = 3;
const ROW_GROUND = 26;
const ROW_LINE = ROW_GROUND - 1;

/** How wide one span is, and how many there are. */
const SPAN = 26;
const SPANS = Math.floor((WIDTH - 24) / SPAN);

type Grid = string[][];

function put(grid: Grid, x: number, y: number, char: string): void {
  if (grid[y]?.[x] !== undefined) {
    grid[y][x] = char;
  }
}

function block(grid: Grid, x: number, y: number, w: number, h: number, char: string): void {
  for (let row = y; row < y + h; row += 1) {
    for (let column = x; column < x + w; column += 1) {
      put(grid, column, row, char);
    }
  }
}

/** A liana, hanging from the roof down to `to`. */
function liana(grid: Grid, x: number, to: number): void {
  block(grid, x, ROOF, 1, to - ROOF + 1, 'T');
}

/** A platform, hanging in the air with nothing holding it up. */
function platform(grid: Grid, x: number, w: number, row: number): void {
  block(grid, x, row, w, 1, '=');
}

function hearts(grid: Grid, x: number, row: number, count: number): void {
  block(grid, x, row, count, 1, 'o');
}

function build(): string[] {
  const grid: Grid = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => '.'),
  );

  // Roof over the whole level, and floor under the whole level.
  block(grid, 0, 0, WIDTH, ROOF, '#');
  block(grid, 0, ROW_GROUND, WIDTH, HEIGHT - ROW_GROUND, '#');

  // A rock to start on, where the hedgehogs cannot reach.
  block(grid, 1, ROW_LINE, 3, 1, 'R');
  put(grid, 2, ROW_GROUND - 2, 'P');

  for (let span = 0; span < SPANS; span += 1) {
    const x = 12 + span * SPAN;

    // The platform this span is about, and the little hearts on it.
    const deck = 12 + (span % 3) * 2;
    platform(grid, x + 9, 6, deck);
    hearts(grid, x + 10, deck - 1, 3);

    if (span % 3 === 2) {
      // A bank of five, to be crossed sideways.
      for (let n = 0; n < 5; n += 1) {
        liana(grid, x + n, deck + 4);
      }
    } else {
      liana(grid, x + 1, deck + 3);
    }

    // And one on the far side, to leave by.
    liana(grid, x + 18, deck + 2);

    // Something on the floor, well clear of the span before it.
    put(grid, x + 6, ROW_LINE, 'h');
  }

  put(grid, WIDTH - 6, ROW_LINE, 'E');

  return grid.map((row) => row.join(''));
}

export const CANOPY: LevelDefinition = {
  name: 'Canopy',
  theme: 'jungle',
  widthInTiles: WIDTH,
  groundRow: ROW_GROUND,
  branchesNeedTrunks: false,
  rows: build(),
};
