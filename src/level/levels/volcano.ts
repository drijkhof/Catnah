import type { LevelDefinition } from '../Level';

/**
 * Level 6: the volcano.
 *
 * **520 tiles**, built rather than written out. The floor is a lava lake and
 * only the islands are safe, so nearly all of it reads as somewhere not to land
 * rather than somewhere to walk.
 *
 * It is made of **crossings**: an island, a stretch of lava, another island.
 * The gaps widen as the level goes on, from four tiles to seven, and the wide
 * ones have a **chain** hanging over them to catch -- nothing grows here, so
 * the chains are bolted to rings in the roof of nothing.
 *
 * Nothing walks the lava fields. The only living thing in this level is what
 * waits at the end of it.
 *
 * It ends at the volcano itself: a cone of rock with a crater notch at the top
 * and a mouth at ground level. Inside is the lair of the **evil lord beetle** --
 * one long enclosed floor, not more islands, because a boss you cannot step
 * aside from is not a fight. The way out is at the far end of the arena.
 */

const WIDTH = 520;
const HEIGHT = 32;

/** The top of the lava lake, which is also the top of the islands. */
const ROW_GROUND = 28;
const ROW_LINE = ROW_GROUND - 1;

/** Where the cone begins. Everything before it is the approach. */
const ARENA_START = WIDTH - 120;

/** How thick the cone's walls are. */
const WALL = 4;

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

/** A chain over a gap, hanging from nothing. */
function chain(grid: Grid, x: number, from: number, to: number): void {
  block(grid, x, from, 1, to - from + 1, 'T');
}

function hearts(grid: Grid, x: number, row: number, count: number): void {
  block(grid, x, row, count, 1, 'o');
}

function build(): string[] {
  const grid: Grid = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => '.'),
  );

  // Rock the whole way, then the lava lake burned back out of it.
  block(grid, 0, ROW_GROUND, WIDTH, HEIGHT - ROW_GROUND, '#');

  // The way in: a shelf of rock, well clear of the first crossing.
  block(grid, 1, ROW_LINE, 4, 1, 'R');
  put(grid, 2, ROW_GROUND - 2, 'P');

  // --- the approach: island, lava, island, all the way to the cone --------
  let x = 12;
  let crossing = 0;

  while (x < ARENA_START - 30) {
    // The gap widens as the level goes on: four tiles at the start, seven at
    // the end. A jump carries about eight tiles from a run, so the last ones
    // are most of what the cat has.
    const gap = 4 + Math.min(3, Math.floor(crossing / 4));
    const island = 7 + (crossing % 3) * 2;

    block(grid, x, ROW_GROUND, gap, 3, 'L');

    // Wide gaps get a chain over them, to catch halfway.
    if (gap >= 6) {
      chain(grid, x + Math.floor(gap / 2), ROW_GROUND - 12, ROW_GROUND - 4);
    }

    if (crossing % 3 === 0) {
      hearts(grid, x + gap + 2, ROW_LINE, 3);
    }

    // Every third island has a shelf over it, worth climbing to.
    if (crossing % 3 === 2) {
      block(grid, x + gap + 2, ROW_GROUND - 6, 4, 1, '=');
      hearts(grid, x + gap + 3, ROW_GROUND - 7, 2);
    }

    x += gap + island;
    crossing += 1;
  }

  // --- the cone -----------------------------------------------------------
  // Walls up both sides and a roof over the middle, with a crater notch left
  // open at the top. The mouth is the gap in the left wall at ground level.
  const coneTop = 6;

  block(grid, ARENA_START, coneTop, WALL, ROW_GROUND - coneTop, '#');
  block(grid, WIDTH - WALL, coneTop, WALL, ROW_GROUND - coneTop, '#');
  block(grid, ARENA_START, coneTop, WIDTH - ARENA_START, 2, '#');

  // The crater notch, so the cone reads as a volcano rather than as a box.
  const notch = ARENA_START + Math.floor((WIDTH - ARENA_START) / 2);
  block(grid, notch - 2, coneTop, 5, 2, '.');

  // The mouth: walk in at ground level.
  block(grid, ARENA_START, ROW_LINE - 1, WALL, 2, '.');

  // One long floor to fight on, and the way out at the far end of it.
  hearts(grid, ARENA_START + 10, ROW_LINE, 3);
  put(grid, ARENA_START + 30, coneTop + 8, 'X');
  put(grid, WIDTH - WALL - 4, ROW_LINE, 'E');

  return grid.map((row) => row.join(''));
}

export const VOLCANO: LevelDefinition = {
  name: 'Volcano',
  theme: 'volcano',
  widthInTiles: WIDTH,
  groundRow: ROW_GROUND,
  branchesNeedTrunks: false,
  rows: build(),
};
