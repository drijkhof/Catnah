import type { LevelDefinition } from '../Level';

/**
 * Level 5: the cave, and the way down to the volcano.
 *
 * **Long, and all the way down.** 240 tiles from end to end like everywhere
 * else, but the way out is forty rows lower than the way in -- so the level
 * reads as a descent rather than as a walk, without ever being a shaft. It
 * steps down to the right, chamber by chamber, and each step down is a drop you
 * cannot climb back up.
 *
 * Carved rather than built. The grid starts as one block of rock and the
 * passages are cut out of it, which is why no floor is level and every passage
 * has a roof.
 *
 * **There is no water down here.** A cave is dry rock; everything in it is
 * something to climb over, squeeze through or drop off.
 *
 * **It branches, and most branches go nowhere.** They climb *away* from the
 * main run, because the main run only ever goes down: a dead end you have to
 * drop into would be a trap, and one you climb into is a decision.
 *
 * The longest of them runs back over the top of the level for thirty tiles and
 * ends in a chamber with a **spare heart** in it -- and a spider ten times the
 * size of the others hanging over the way in. It cannot be beaten, only timed.
 */

const WIDTH = 240;
const HEIGHT = 64;

/** How many chambers the main run is made of. */
const STEPS = 16;

/** Columns per chamber, including the way down into the next one. */
const STEP_WIDTH = 14;

/** Where the first chamber's floor sits, and where the last one's does. */
const FIRST_FLOOR = 12;
const LAST_FLOOR = 54;

/** Rows of headroom in a chamber. The floor is the rock under it. */
const HEADROOM = 7;

type Grid = string[][];

/** The floor row of chamber `i`, stepping evenly from the first to the last. */
function floorOf(step: number): number {
  return Math.round(
    FIRST_FLOOR + ((LAST_FLOOR - FIRST_FLOOR) * step) / (STEPS - 1),
  );
}

/** Where chamber `i` starts, in columns. */
function startOf(step: number): number {
  return 4 + step * STEP_WIDTH;
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

function build(): string[] {
  const grid: Grid = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => '#'),
  );

  const floors: number[] = [];

  // --- the main run: sixteen chambers, each lower than the last -----------
  for (let step = 0; step < STEPS; step += 1) {
    const floor = floorOf(step);
    const x = startOf(step);

    floors.push(floor);
    carve(grid, x, floor - HEADROOM, STEP_WIDTH, HEADROOM);
  }

  // The way from one chamber into the next: an opening tall enough to cover
  // both floors, so the cat walks off the higher one and lands on the lower.
  for (let step = 1; step < STEPS; step += 1) {
    const topRow = Math.min(floors[step - 1], floors[step]) - HEADROOM;

    carve(grid, startOf(step) - 3, topRow, 3, floors[step] - topRow);
  }

  // --- what is in each chamber -------------------------------------------
  // One idea per chamber, and never the same one twice running. They are all
  // things the five levels before this have taught.
  const pillar = (step: number, at: number, height: number): void => {
    block(grid, startOf(step) + at, floors[step] - height, 2, height, '#');
  };

  const shelf = (step: number, at: number, up: number, w = 4): void => {
    block(grid, startOf(step) + at, floors[step] - up, w, 1, '=');
  };

  const spider = (step: number, at: number): void => {
    put(grid, startOf(step) + at, floors[step] - HEADROOM, 's');
  };

  // The way in. A rock to stand on that nothing can reach, and a plain floor,
  // so the first thing the cave teaches is that it goes down.
  block(grid, startOf(0) + 1, floors[0] - 1, 3, 1, 'R');
  put(grid, startOf(0) + 2, floors[0] - 2, 'P');
  berries(grid, startOf(0) + 8, floors[0] - 1, 3);

  pillar(1, 5, 3);
  spider(1, 10);

  shelf(2, 3, 3);
  shelf(2, 8, 5);
  berries(grid, startOf(2) + 8, floors[2] - 6, 3);

  // A low roof over the middle of the chamber. Not low enough to crawl under --
  // low enough that the jump across the pillars under it has to be flat.
  block(grid, startOf(3) + 4, floors[3] - HEADROOM, 6, 3, '#');
  pillar(3, 3, 3);
  pillar(3, 9, 3);
  spider(3, 1);

  // A squeeze. One tile of headroom fits a sneaking cat and nothing else.
  block(grid, startOf(4) + 4, floors[4] - HEADROOM, 7, HEADROOM - 1, '#');
  berries(grid, startOf(4) + 1, floors[4] - 1, 3);

  pillar(5, 3, 4);
  pillar(5, 8, 3);
  spider(5, 6);

  shelf(6, 2, 4);
  shelf(6, 7, 3);
  berries(grid, startOf(6) + 2, floors[6] - 5, 3);

  shelf(7, 2, 3);
  pillar(7, 6, 5);
  shelf(7, 9, 4, 3);
  spider(7, 7);

  // Chamber 8 is the fork: the long branch climbs out of it. See below.
  spider(9, 5);
  pillar(9, 9, 4);

  shelf(10, 3, 3);
  shelf(10, 8, 5);
  berries(grid, startOf(10) + 8, floors[10] - 6, 3);

  block(grid, startOf(11) + 5, floors[11] - HEADROOM, 6, HEADROOM - 1, '#');
  spider(11, 1);

  pillar(12, 2, 5);
  pillar(12, 7, 3);
  pillar(12, 11, 4);

  shelf(13, 2, 4);
  shelf(13, 8, 3);
  spider(13, 6);
  berries(grid, startOf(13) + 2, floors[13] - 5, 3);

  pillar(14, 4, 4);
  spider(14, 10);

  // The bottom, and the only door in the game that leads further down.
  berries(grid, startOf(15) + 3, floors[15] - 1, 3);
  put(grid, startOf(15) + 10, floors[15] - 1, 'E');

  // --- the short dead ends ------------------------------------------------
  // Each climbs out of the main run and stops. They are worth berries and
  // nothing else, which is what makes the long one mean something.
  const deadEnd = (step: number, at: number, length: number): void => {
    const x = startOf(step) + at;
    const mouth = floors[step] - HEADROOM;

    // A shaft up out of the chamber, then a gallery running on from it.
    carve(grid, x, mouth - 5, 3, 6);
    carve(grid, x, mouth - 5, length, 4);
    berries(grid, x + length - 4, mouth - 2, 3);
  };

  deadEnd(2, 11, 9);
  deadEnd(6, 10, 11);
  deadEnd(12, 10, 10);

  // --- the long one -------------------------------------------------------
  // A shaft out of chamber 8, thirty tiles running back over the top of the
  // level, and a chamber with the spare heart at the back of it -- with
  // something very large hanging over the doorway.
  const forkX = startOf(8) + 6;
  const mouth = floors[8] - HEADROOM;
  const gallery = mouth - 8;

  carve(grid, forkX, gallery, 3, mouth - gallery + 1);
  carve(grid, forkX, gallery - 4, 30, 5);

  const lairX = forkX + 26;
  const lairFloor = gallery + 1;

  carve(grid, lairX, lairFloor - 14, 26, 14);
  put(grid, lairX + 6, lairFloor - 14, 'S');
  berries(grid, lairX + 14, lairFloor - 1, 3);
  put(grid, lairX + 22, lairFloor - 1, '+');

  return grid.map((row) => row.join(''));
}

export const CAVE: LevelDefinition = {
  name: 'Cave',
  theme: 'cave',
  widthInTiles: WIDTH,
  // Nothing is planted against a floor down here; there is no sky to plant it
  // under. The backdrop draws rock at every depth.
  groundRow: FIRST_FLOOR,
  branchesNeedTrunks: false,
  rows: build(),
};
