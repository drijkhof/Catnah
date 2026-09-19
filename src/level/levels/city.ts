import type { LevelDefinition } from '../Level';

/**
 * Level 2: the city, at night.
 *
 * Built at the scale of the thing walking through it. The cat is 22x18 game
 * pixels; a block of flats here is eleven storeys of brick, an awning is four
 * tiles of steel and a parked car is two tiles tall and five long. Standing in
 * the street you can see the tops of nothing.
 *
 * **Four drainpipes in the whole city**, and every one of them runs down a
 * wall. That is the difference between a drainpipe and a pole: it is bolted to
 * a building, gutter to pavement. The only columns standing on their own are
 * the lampposts, and they are short.
 *
 * A building stands on the pavement and blocks it, so each one is either **gone
 * through** -- an arcade at street level -- or **gone over**, and the four that
 * are gone over have one pipe, on the side you arrive at. Coming down the far
 * side never needs anything: falling is free.
 *
 * The awnings are shortcuts and scenery, not a staircase. A girder here is
 * solid, so an awning is something you come at from the side; stacked up a wall
 * they are a ceiling rather than a stair.
 *
 * **Nothing swims in this city.** The canal is water and no more than water --
 * eleven tiles of it, with two awnings over it and five tiles of nothing
 * between them. Swim it the slow way, or make that jump.
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

/**
 * A way straight through a building at street level.
 *
 * NOTE ordering: anything written into a gap after an awning will be cut by it,
 * and the other way round. Furniture first, climbs last.
 *
 *
 * Two rows, which is headroom for a standing cat and nothing more. Half the
 * buildings here have one, and that is what keeps the pavement a route: a
 * building with no way through has to be gone over, and one with a way through
 * is the quick way past.
 */
function arcade(grid: Grid, x: number, w: number): void {
  block(grid, x, ROW_STREET - 2, w, 2, '.');
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
function canal(grid: Grid, x: number, w: number): void {
  block(grid, x, ROW_STREET, w, 3, 'w');
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

  // Nine buildings. A building stands on the pavement and blocks it, so each
  // one is either **gone through** -- an arcade at street level -- or **gone
  // over**, and the four that are gone over have a drainpipe up the side you
  // arrive at. Four pipes in the whole city, where there were eighteen.
  //
  // Coming down the far side never needs anything: falling is free. Only the
  // way up has to be built, which is why there is one pipe per climb and not
  // two.
  //
  // The awnings are shortcuts and scenery rather than a staircase. A girder
  // here is solid, so an awning is something you have to come at from the side
  // -- a stack of them up a wall is a ceiling, not a stair.

  const b1 = tower(grid, 8, 10, 6, { high: 'right' });
  arcade(grid, 8, 10);
  onRoof(grid, 8, b1, 4, 'ooo');
  car(grid, 18);
  lamppost(grid, 24);

  const b2 = tower(grid, 27, 12, 11, { high: 'left' });
  drainpipe(grid, 26, b2[0]);
  awning(grid, 39, 5, ROW_STREET - 6);
  onRoof(grid, 27, b2, 4, 'ooo');
  put(grid, 44, ROW_STREET - 1, 'r');

  const b3 = tower(grid, 50, 8, 8, { high: 'right' });
  drainpipe(grid, 49, b3[0]);
  awning(grid, 44, 4, ROW_STREET - 5);
  onRoof(grid, 50, b3, 5, 'ooo');

  // The canal. No fish: nothing swims in a city. It is eleven tiles of water
  // with two awnings over it and five tiles of nothing between them -- swim it
  // the slow way, or make that jump.
  canal(grid, 60, 11);
  awning(grid, 58, 3, ROW_STREET - 10);
  awning(grid, 66, 4, ROW_STREET - 10);

  const b4 = tower(grid, 74, 10, 9, { high: 'left' });
  arcade(grid, 74, 10);
  onRoof(grid, 74, b4, 6, 'ooo');
  put(grid, 86, ROW_STREET - 1, 'r');
  car(grid, 88);

  // The tallest building in the city, sixteen storeys, with the crow's nest on
  // top of it and the spare heart in the nest.
  const b5 = tower(grid, 95, 14, 16, { high: 'right', steps: 4 });
  drainpipe(grid, 94, b5[0]);
  awning(grid, 90, 4, ROW_STREET - 13);
  onRoof(grid, 95, b5, 10, 'N+N');
  put(grid, 106, b5[10] - 3, 'c');

  car(grid, 111);
  lamppost(grid, 117);

  const b6 = tower(grid, 120, 9, 13, { high: 'left' });
  arcade(grid, 120, 9);
  onRoof(grid, 120, b6, 3, 'ooo');
  put(grid, 133, ROW_STREET - 1, 'r');

  const b7 = tower(grid, 138, 9, 10, { high: 'right' });
  drainpipe(grid, 137, b7[0]);
  awning(grid, 132, 4, ROW_STREET - 5);
  onRoof(grid, 138, b7, 2, 'ooo');

  const b8 = tower(grid, 152, 8, 7, { high: 'left' });
  arcade(grid, 152, 8);
  onRoof(grid, 152, b8, 4, 'ooo');
  car(grid, 161);
  put(grid, 165, ROW_STREET - 1, 'r');

  const b9 = tower(grid, 167, 8, 5, { high: 'right' });
  arcade(grid, 167, 8);
  onRoof(grid, 167, b9, 5, 'oo');
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
