import type { LevelDefinition } from '../Level';

/**
 * Level 5: the cave, and the way down to the volcano.
 *
 * The only level in the game that is about **going down**. Eight chambers
 * stacked one under the other, each crossed to reach the hole in its floor, and
 * the holes alternate ends so the route zigzags deeper and deeper instead of
 * dropping straight through. You can never climb back to the chamber above, and
 * you never need to: everything worth having is on the level you are on.
 *
 * Carved rather than built. The grid starts as one block of rock and the
 * chambers are cut out of it, which is why no passage has a level floor and
 * every one of them has a roof. The floor between chambers is **three rows
 * thick**, so a pit or a pool can be sunk into it without opening a hole into
 * the chamber below -- which is what kept the old cave's water hanging in
 * mid-air with nothing holding it.
 *
 * **Not every passage goes anywhere.** Three of them are dead ends, and the
 * longest -- a low tunnel running the whole right-hand side of the fifth
 * chamber -- has a **spare heart** at the back of it, with spiders on the roof
 * the whole way in.
 *
 * The spider is this cave's own creature: it walks the ceiling and drops on a
 * thread, so the roof of a tunnel is somewhere you have to look.
 */

const WIDTH = 48;

/** How many chambers the descent has. */
const CHAMBERS = 8;

/** Rows from the top of one chamber to the top of the next. */
const CHAMBER_SPAN = 11;

/** Rock above the first chamber and below the last. */
const CAP = 4;

const HEIGHT = CAP + CHAMBERS * CHAMBER_SPAN + CAP;

/** How many rows of headroom a chamber has. The floor is the three under it. */
const HEADROOM = 8;

type Grid = string[][];

/** Top row of a chamber's opening. */
function top(chamber: number): number {
  return CAP + chamber * CHAMBER_SPAN;
}

/** The row a cat walks on in a chamber. Two more solid rows sit under it. */
function floor(chamber: number): number {
  return top(chamber) + HEADROOM;
}

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

/** Cuts rock away. */
function carve(grid: Grid, x: number, y: number, w: number, h: number): void {
  block(grid, x, y, w, h, '.');
}

/** A row of berries, which is how a dead end says it was worth walking into. */
function berries(grid: Grid, x: number, y: number, count: number): void {
  block(grid, x, y, count, 1, 'o');
}

/**
 * The hole through a chamber's floor into the next one.
 *
 * Three rows, because the floor is three rows thick. Always at one end or the
 * other, never under the hole above it.
 */
function dropThrough(grid: Grid, chamber: number, x: number, w = 3): void {
  carve(grid, x, floor(chamber), w, 3);
}

/** An empty chamber, ready to have things put in it. */
function hollow(grid: Grid, chamber: number, x: number, w: number): void {
  carve(grid, x, top(chamber), w, HEADROOM);
}

function build(): string[] {
  const grid: Grid = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => '#'),
  );

  // 1 -- The way in. Wide and plain, so the first thing the cave teaches is
  // that the floor has a hole in it. The cat starts on a rock nothing can get
  // onto: a player who has not touched the controls yet should not be able to
  // lose.
  hollow(grid, 0, 2, 44);
  block(grid, 3, floor(0) - 1, 3, 1, 'R');
  put(grid, 4, floor(0) - 2, 'P');
  block(grid, 14, floor(0) - 3, 2, 3, '#');
  block(grid, 28, floor(0) - 2, 2, 2, '#');
  berries(grid, 20, floor(0) - 1, 3);
  put(grid, 22, top(0), 's');
  dropThrough(grid, 0, 41);

  // 2 -- A wall with its gap at the ceiling, and three shelves up to it. The
  // first thing here that has to be worked out rather than walked past.
  hollow(grid, 1, 2, 44);
  block(grid, 20, top(1) + 4, 2, 5, '#');
  block(grid, 33, floor(1) - 2, 4, 1, '=');
  block(grid, 27, floor(1) - 4, 4, 1, '=');
  block(grid, 23, floor(1) - 6, 3, 1, '=');
  berries(grid, 27, floor(1) - 5, 3);
  put(grid, 11, top(1), 's');
  dropThrough(grid, 1, 3);

  // 3 -- The sump. A pool sunk into the floor with a lip of rock over the
  // middle of it, so the only way past is under the water. Two rows deep, in a
  // floor three rows thick: there is rock beneath it, which is what a pool in a
  // cave needs and what the old one never had.
  hollow(grid, 2, 2, 44);
  block(grid, 16, floor(2), 12, 2, 'w');
  block(grid, 20, floor(2) - 1, 5, 1, '#');
  berries(grid, 32, floor(2) - 1, 3);
  put(grid, 36, top(2), 's');
  dropThrough(grid, 2, 41);

  // 4 -- Two rock towers with a shaft between them, which is the way over. The
  // sides alternate, so it is left, right, left, exactly as the forest taught.
  hollow(grid, 3, 2, 44);
  // Six rows, which is 96px: a straight jump from the floor reaches 90 and
  // falls short by a hand's width. The shaft between them is three tiles wide,
  // the same as the forest's, so the move is the one the forest taught.
  block(grid, 18, top(3) + 2, 2, 6, 'R');
  block(grid, 23, top(3) + 2, 2, 6, 'R');
  berries(grid, 20, top(3) + 1, 3);
  put(grid, 32, top(3), 's');
  dropThrough(grid, 3, 3);

  // 5 -- The fork. The hole down is in the middle and in plain sight; the whole
  // right-hand side is a low tunnel that goes nowhere, and at the back of it is
  // a spare heart in a nest. It is the longest dead end in the game.
  //
  // **No spiders in this tunnel.** The walk in is long, the roof is low and
  // there is nowhere to dodge, so a spider dropping in it is not a threat to
  // read but a toll to pay. What guards the heart is the length of the detour.
  hollow(grid, 4, 2, 21);
  carve(grid, 23, top(4) + 4, 23, 4);
  berries(grid, 33, floor(4) - 1, 3);
  put(grid, 44, floor(4) - 1, '+');
  dropThrough(grid, 4, 20);

  // 6 -- The squeeze, and a dead end on the other side of the landing. One tile
  // of headroom is not enough for a standing cat and is plenty for a sneaking
  // one, so the level grid alone makes a passage that has to be crawled.
  hollow(grid, 5, 2, 44);
  block(grid, 26, top(5), 9, HEADROOM - 1, '#');
  berries(grid, 5, floor(5) - 1, 4);
  put(grid, 12, top(5), 's');
  dropThrough(grid, 5, 41);

  // 7 -- The deepest gallery, and the last real crossing. A shelf climb with
  // the roof close over it, so the spiders are within reach of the route rather
  // than off to one side of it.
  hollow(grid, 6, 2, 44);
  block(grid, 30, floor(6) - 3, 4, 1, '=');
  block(grid, 22, floor(6) - 5, 4, 1, '=');
  block(grid, 14, floor(6) - 3, 4, 1, '=');
  block(grid, 36, floor(6) - 2, 2, 2, '#');
  berries(grid, 22, floor(6) - 6, 3);
  put(grid, 27, top(6), 's');
  put(grid, 18, top(6), 's');
  dropThrough(grid, 6, 3);

  // 8 -- The bottom. A short walk to the way out, which is the only door in the
  // game that leads further down rather than further along.
  hollow(grid, 7, 2, 44);
  block(grid, 24, floor(7) - 2, 2, 2, '#');
  berries(grid, 15, floor(7) - 1, 3);
  put(grid, 33, top(7), 's');
  put(grid, 43, floor(7) - 1, 'E');

  return grid.map((row) => row.join(''));
}

export const CAVE: LevelDefinition = {
  name: 'Cave',
  theme: 'cave',
  widthInTiles: WIDTH,
  // Nothing is planted against a floor down here; there is no sky to plant it
  // under. The backdrop draws rock at every depth.
  groundRow: CAP,
  branchesNeedTrunks: false,
  rows: build(),
};
