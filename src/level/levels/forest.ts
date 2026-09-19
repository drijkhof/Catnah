import type { LevelDefinition } from '../Level';

/**
 * Level 1: a sunlit forest.
 *
 * **450 tiles of it**, built rather than written out. At this length a
 * hand-counted grid of strings stops being readable and stops being honest --
 * miscount one row by one and nothing says so.
 *
 * It is made of **bays**: a stretch of forest floor with a tree in it and
 * something to do. The bays cycle through four shapes so the level has a
 * rhythm without repeating itself, and every fourth one is left plain, because
 * a level that never lets up is a level nobody finishes.
 *
 * **You cannot climb a tree here.** The way up one is its branches, four tiles
 * apart and alternating sides of the trunk, which is why every branch grows out
 * of a trunk (`branchesNeedTrunks` holds the parser to it).
 *
 * Two thirds of the way along stands **the great tree**: taller than anything
 * else, with the crow's nest at the top of it and the spare heart in the nest.
 */

const WIDTH = 450;
const HEIGHT = 34;

/** The first solid row. Everything above it is air, everything below is earth. */
const ROW_GROUND = 30;

/** The row things stand on: creatures, the spawn, the way out. */
const ROW_LINE = ROW_GROUND - 1;

/** How wide a bay is, and how many of them there are. */
const BAY = 30;
const BAYS = Math.floor((WIDTH - 20) / BAY);

/** Which bay the great tree stands in. */
const GREAT_TREE_BAY = Math.floor(BAYS * 0.66);

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

/**
 * A tree: a trunk from the ground up, with branches off it.
 *
 * Each branch is written *touching* the trunk, which is what
 * `branchesNeedTrunks` insists on, and they alternate sides so climbing one is
 * a zigzag rather than a ladder.
 */
function tree(
  grid: Grid,
  x: number,
  height: number,
  branches: Array<{ up: number; side: 1 | -1; length: number }>,
): void {
  block(grid, x, ROW_GROUND - height, 1, height, 'T');

  for (const { up, side, length } of branches) {
    const from = side > 0 ? x + 1 : x - length;

    block(grid, from, ROW_GROUND - up, length, 1, '=');
  }
}

/** A boulder pile. Solid rock, and what wall jumps are taken from. */
function boulders(grid: Grid, x: number, w: number, h: number): void {
  block(grid, x, ROW_GROUND - h, w, h, 'R');
}

/**
 * A pool, sunk into the earth.
 *
 * Three rows deep in four rows of earth, so there is always ground under it --
 * water with nothing holding it looks exactly as wrong as it is.
 */
function pool(grid: Grid, x: number, w: number, fish: number[]): void {
  block(grid, x, ROW_GROUND, w, 3, 'w');

  for (const at of fish) {
    put(grid, x + at, ROW_GROUND + 1, 'f');
  }
}

function hearts(grid: Grid, x: number, row: number, count: number): void {
  block(grid, x, row, count, 1, 'o');
}

function build(): string[] {
  const grid: Grid = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => '.'),
  );

  // Earth the whole way. The pools are cut back out of it.
  block(grid, 0, ROW_GROUND, WIDTH, HEIGHT - ROW_GROUND, '#');

  // The way in: a boulder to stand on that a hedgehog turns at, because a
  // player who has not touched the controls yet should not be able to lose.
  boulders(grid, 2, 3, 1);
  put(grid, 3, ROW_GROUND - 2, 'P');

  for (let bay = 0; bay < BAYS; bay += 1) {
    const x = 10 + bay * BAY;

    if (bay === GREAT_TREE_BAY) {
      // The great tree. Branches every four rows, alternating sides, from head
      // height to the top -- 64px a step against a 90px jump, so the climb is a
      // zigzag of jumps and the nest at the top is the last of them.
      tree(grid, x + 12, 25, [
        { up: 4, side: -1, length: 4 },
        { up: 8, side: 1, length: 5 },
        { up: 12, side: -1, length: 4 },
        { up: 16, side: 1, length: 5 },
        { up: 20, side: -1, length: 4 },
      ]);

      put(grid, x + 11, ROW_GROUND - 26, 'N');
      put(grid, x + 12, ROW_GROUND - 26, '+');
      put(grid, x + 13, ROW_GROUND - 26, 'N');
      put(grid, x + 12, ROW_GROUND - 29, 'c');

      hearts(grid, x + 4, ROW_LINE, 3);
      continue;
    }

    switch (bay % 4) {
      case 0: {
        // A tree to climb, with something on the branches.
        tree(grid, x + 8, 14, [
          { up: 4, side: 1, length: 5 },
          { up: 8, side: -1, length: 5 },
          { up: 12, side: 1, length: 4 },
        ]);
        hearts(grid, x + 10, ROW_GROUND - 5, 3);
        put(grid, x + 20, ROW_LINE, 'h');
        break;
      }

      case 1: {
        // A pool with a fish in it, and a tree on the far bank.
        pool(grid, x + 4, 9, [4]);
        tree(grid, x + 18, 11, [
          { up: 5, side: -1, length: 4 },
          { up: 9, side: 1, length: 5 },
        ]);
        hearts(grid, x + 19, ROW_GROUND - 10, 3);
        break;
      }

      case 2: {
        // Two boulder towers with a shaft between them: the wall jump, which is
        // the one move this level has to teach.
        boulders(grid, x + 6, 2, 6);
        boulders(grid, x + 11, 2, 6);
        hearts(grid, x + 8, ROW_GROUND - 7, 3);
        tree(grid, x + 20, 9, [{ up: 5, side: 1, length: 4 }]);
        put(grid, x + 2, ROW_LINE, 'h');
        break;
      }

      default: {
        // Plain floor and a hedgehog on it. Somewhere to run.
        hearts(grid, x + 6, ROW_LINE, 3);
        put(grid, x + 16, ROW_LINE, 'h');
        break;
      }
    }
  }

  // The way out, at the far end of the last bay.
  put(grid, WIDTH - 5, ROW_LINE, 'E');

  return grid.map((row) => row.join(''));
}

export const FOREST: LevelDefinition = {
  name: 'Forest',
  theme: 'forest',
  widthInTiles: WIDTH,
  groundRow: ROW_GROUND,
  branchesNeedTrunks: true,
  // You cannot climb a tree. The trunks are still drawn and still walked
  // through, and their crowns are still something to stand on -- but the way up
  // a tree is its branches, which is why every branch here grows out of one.
  climbableColumns: false,
  rows: build(),
};
