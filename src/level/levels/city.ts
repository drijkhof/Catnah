import type { LevelDefinition } from '../Level';

/**
 * Level 2: the city, at night.
 *
 * Built at the scale of the thing walking through it. The cat is 22x18 game
 * pixels; a block of flats here is eleven storeys of brick, an awning is four
 * tiles of steel and a parked car is two tiles tall and five long. Standing in
 * the street you can see the tops of nothing.
 *
 * **Every drainpipe runs down a wall.** That is the whole difference between a
 * drainpipe and a pole: it is bolted to a building, from the gutter to the
 * pavement, and it is how you get off the street and onto the roofs. The only
 * columns standing on their own are the lampposts, and they are short.
 *
 * Roofs are **sloped** -- stepped, in one direction or the other -- so the
 * skyline is a skyline rather than a row of boxes, and landing on one puts you
 * on a slope you have to climb.
 *
 * The route is a street-and-roof braid: the pavement is quick and has rats on
 * it, the roofs are slower and carry the berries, and the gaps between
 * buildings are crossed by awning, girder or drainpipe. The spare heart is in a
 * crow's nest on the highest roof in the city.
 *
 * Girders are not branches: `solidPlatforms` is on, so you cannot pass up
 * through one, which is what makes a roof a roof.
 */

const WIDTH = 176;
const HEIGHT = 34;

/** The first solid row of the street. Everything above it is air or building. */
const ROW_STREET = 30;

/** The last row of the grid, so the pavement has something under it. */
const ROW_BASE = HEIGHT - 1;

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

/** A drainpipe, from a gutter down to the pavement, hard against a wall. */
function drainpipe(grid: Grid, x: number, fromRow: number): void {
  block(grid, x, fromRow, 1, ROW_STREET - fromRow, 'T');
}

/**
 * A building.
 *
 * `storeys` is how far it rises above the street. The roof is stepped up
 * towards `high`, in `steps` stages, so the top of the building is a slope. The
 * brick under each column runs from that column's own roof line all the way
 * down to the pavement.
 */
function tower(
  grid: Grid,
  x: number,
  w: number,
  storeys: number,
  options: { high?: 'left' | 'right'; steps?: number } = {},
): number[] {
  const steps = options.steps ?? 3;
  const stepWidth = Math.max(1, Math.floor(w / steps));
  const roof: number[] = [];

  for (let i = 0; i < w; i += 1) {
    const stage = Math.min(steps - 1, Math.floor(i / stepWidth));
    const rise = options.high === 'left' ? steps - 1 - stage : stage;
    const roofRow = ROW_STREET - storeys - rise;

    block(grid, x + i, roofRow, 1, ROW_STREET - roofRow, 'R');
    roof.push(roofRow);
  }

  // **A drainpipe down each side, always.** A building sits on the pavement and
  // blocks it, so the way past one is over it -- and a pipe on only one side is
  // a wall to whoever arrives from the other. One up, one down, every time.
  drainpipe(grid, x - 1, roof[0]);
  drainpipe(grid, x + w, roof[w - 1]);

  // Handed back so anything that sits *on* this building -- berries, a nest --
  // can be put on the actual roof rather than at a row someone counted by hand.
  return roof;
}

/** Puts something on a roof, at the column of that roof's own top row. */
function onRoof(grid: Grid, x: number, roof: number[], i: number, chars: string): void {
  for (let n = 0; n < chars.length; n += 1) {
    put(grid, x + i + n, roof[i] - 1, chars[n]);
  }
}

/** A lamppost: short, free-standing, and the only column here that is not a pipe. */
function lamppost(grid: Grid, x: number): void {
  block(grid, x, ROW_STREET - 6, 1, 6, 'T');
}

/** An awning over the pavement, sticking out from a wall. */
function awning(grid: Grid, x: number, w: number, row: number): void {
  block(grid, x, row, w, 1, '=');
}

/**
 * A parked car: five tiles long, two tall, with the cabin over the middle
 * three. Written as the shape it is, and each tile works out which part of the
 * car it holds from its own neighbours.
 */
function car(grid: Grid, x: number): void {
  block(grid, x, ROW_STREET - 1, 5, 1, 'A');
  block(grid, x + 1, ROW_STREET - 2, 3, 1, 'A');
}

/** A stretch of canal, cut into the street with pavement either side. */
function canal(grid: Grid, x: number, w: number, fish: number[]): void {
  block(grid, x, ROW_STREET, w, 3, 'w');

  for (const column of fish) {
    put(grid, x + column, ROW_STREET + 1, 'f');
  }
}

function build(): string[] {
  const grid: Grid = Array.from({ length: HEIGHT }, () =>
    Array.from({ length: WIDTH }, () => '.'),
  );

  // Pavement the whole way, with the canal cut out of it further on.
  block(grid, 0, ROW_STREET, WIDTH, ROW_BASE - ROW_STREET + 1, '#');

  // --- the doorway you start in -----------------------------------------
  // A brick stoop with the cat on it, walled in by the first building. Nothing
  // reaches it, which is the point: standing still at the start of a level
  // should never cost a heart.
  block(grid, 3, ROW_STREET - 1, 3, 1, 'R');
  put(grid, 4, ROW_STREET - 2, 'P');

  // Nine buildings, each climbed rather than walked past: pipe up the near
  // side, over the roof, pipe down the far side. The awnings between them are
  // the shortcuts, and the roofs are where the berries are.

  const b1 = tower(grid, 7, 10, 6, { high: 'right' });
  awning(grid, 18, 4, ROW_STREET - 5);
  lamppost(grid, 22);
  put(grid, 20, ROW_STREET - 1, 'r');
  onRoof(grid, 7, b1, 4, 'ooo');

  const b2 = tower(grid, 26, 12, 11, { high: 'left' });
  awning(grid, 21, 4, ROW_STREET - 9);
  awning(grid, 39, 4, ROW_STREET - 12);
  onRoof(grid, 26, b2, 4, 'ooo');

  // The canal: eleven tiles of water with four fish in it, and two awnings over
  // it with a five-tile gap between them. There is no way across at street
  // level and nothing survives swimming it.
  const b3 = tower(grid, 44, 8, 8, { high: 'right' });
  canal(grid, 54, 11, [2, 5, 8, 10]);
  awning(grid, 53, 3, ROW_STREET - 10);
  awning(grid, 61, 4, ROW_STREET - 10);
  onRoof(grid, 44, b3, 5, 'ooo');

  const b4 = tower(grid, 66, 10, 9, { high: 'left' });
  car(grid, 77);
  lamppost(grid, 82);
  onRoof(grid, 66, b4, 6, 'ooo');

  // The tallest building in the city, and the crow's nest on top of it.
  const b5 = tower(grid, 84, 14, 16, { high: 'right', steps: 4 });
  awning(grid, 78, 4, ROW_STREET - 13);
  awning(grid, 99, 5, ROW_STREET - 14);
  onRoof(grid, 84, b5, 10, 'N+N');
  put(grid, 95, b5[10] - 3, 'c');

  car(grid, 104);
  put(grid, 110, ROW_STREET - 1, 'r');

  const b6 = tower(grid, 113, 9, 13, { high: 'left' });
  awning(grid, 123, 4, ROW_STREET - 11);
  onRoof(grid, 113, b6, 3, 'ooo');

  const b7 = tower(grid, 128, 9, 10, { high: 'right' });
  awning(grid, 123, 4, ROW_STREET - 6);
  onRoof(grid, 128, b7, 2, 'ooo');
  put(grid, 125, ROW_STREET - 1, 'r');

  const b8 = tower(grid, 142, 8, 7, { high: 'left' });
  awning(grid, 138, 3, ROW_STREET - 6);
  onRoof(grid, 142, b8, 4, 'ooo');

  car(grid, 151);
  lamppost(grid, 157);
  put(grid, 156, ROW_STREET - 1, 'r');

  const b9 = tower(grid, 160, 10, 5, { high: 'right' });
  onRoof(grid, 160, b9, 6, 'oo');
  put(grid, 172, ROW_STREET - 1, 'r');
  put(grid, 174, ROW_STREET - 1, 'E');

  return grid.map((row) => row.join(''));
}

export const CITY: LevelDefinition = {
  name: 'City',
  theme: 'city',
  widthInTiles: WIDTH,
  groundRow: ROW_STREET,
  branchesNeedTrunks: false,
  // Girders, not branches: you cannot pass up through one.
  solidPlatforms: true,
  rows: build(),
};
