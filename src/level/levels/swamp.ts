import type { LevelDefinition } from '../Level';

/**
 * Level 4: the swamp.
 *
 * One long gauntlet of water, and the whole level is about how you get over it.
 * The crossings alternate, and the two kinds never mix:
 *
 * - **Crocodile water** has crocodiles lying in it and nothing else. They are a
 *   floor until you stand on one, then they go under -- so a crossing is
 *   something you keep moving through. They are never close enough together to
 *   stroll between: every gap is a jump that has to be aimed.
 * - **Piranha water** has no crocodiles and a great many fish, and **lianas
 *   hanging over it**. There is no way across at water level, so the lianas are
 *   the route rather than scenery: jump, catch one, leap to the next.
 *
 * Fall in either and it costs you. A crocodile eats a cat that is in the water
 * beside it, and piranha water has more fish in it than anything can swim past.
 *
 * **Nothing walks the banks.** The banks are where you stand still and work out
 * the next crossing, and a hedgehog wandering into that is an interruption
 * rather than a danger. Everything in this level is in the water.
 *
 * **The lianas hang from nothing, and that is deliberate.** They are five tiles
 * long, low over the water, so all you can do with one is cross. There is no
 * roof in this level to hang them from and none should ever come into view --
 * a swamp is a place with sky over it.
 *
 * Nothing grew where any of it stands, so `branchesNeedTrunks` is off.
 */

/** Rows in the grid. Everything above `LIANA_TOP` is empty sky. */
const HEIGHT = 30;

/** Where the lianas hang: five tiles, ending well short of anything. */
const LIANA_TOP = 19;
const LIANA_BOTTOM = 23;

/** The line the cat walks along, where the spawn, the way out and the hedgehogs sit. */
const ROW_LINE = 25;

/** The water's surface, which is also the top of the banks. */
const ROW_SURFACE = 26;

/** The last row that is water, and the bedrock under all of it. */
const ROW_BED = 28;
const ROW_ROCK = 29;

/** Something written into a segment: `[row, column, character]`. */
type Mark = [number, number, string];

function blank(width: number): string[] {
  return Array.from({ length: HEIGHT }, () => '.'.repeat(width));
}

function put(rows: string[], row: number, column: number, char: string): void {
  rows[row] = rows[row].slice(0, column) + char + rows[row].slice(column + 1);
}

function fill(rows: string[], row: number, char: string): void {
  rows[row] = char.repeat(rows[row].length);
}

function applyMarks(rows: string[], marks: Mark[]): string[] {
  for (const [row, column, char] of marks) {
    put(rows, row, column, char);
  }

  return rows;
}

/** Solid ground, which is where everything that is not a crossing happens. */
function bank(width: number, marks: Mark[] = []): string[] {
  const rows = blank(width);

  for (let row = ROW_SURFACE; row <= ROW_ROCK; row += 1) {
    fill(rows, row, '#');
  }

  return applyMarks(rows, marks);
}

function water(width: number): string[] {
  const rows = blank(width);

  for (let row = ROW_SURFACE; row <= ROW_BED; row += 1) {
    fill(rows, row, 'w');
  }

  fill(rows, ROW_ROCK, '#');

  return rows;
}

/** A crossing made of crocodiles. No fish: one danger per stretch of water. */
function crocodiles(width: number, backs: number[], marks: Mark[] = []): string[] {
  const rows = water(width);

  for (const column of backs) {
    put(rows, ROW_SURFACE, column, 'C');
  }

  return applyMarks(rows, marks);
}

/**
 * A crossing made of lianas, over water too full of fish to swim.
 *
 * The fish go a row under the surface so the surface itself stays water, which
 * is what keeps the pool whole for the piranhas that patrol it.
 */
function lianas(
  width: number,
  fish: number[],
  ropes: number[],
  marks: Mark[] = [],
): string[] {
  const rows = water(width);

  for (const column of fish) {
    put(rows, ROW_SURFACE + 1, column, 'f');
  }

  for (const column of ropes) {
    for (let row = LIANA_TOP; row <= LIANA_BOTTOM; row += 1) {
      put(rows, row, column, 'T');
    }
  }

  return applyMarks(rows, marks);
}

/**
 * The level, left to right.
 *
 * **Thirty-five crossings over more than twelve hundred tiles**, alternating crocodile water and
 * piranha water, with a bank between each pair to stand on and work out the
 * next one. Nothing walks the banks; everything in this level is in the water.
 *
 * Built rather than listed. At this length a hand-written list of segments is
 * unreadable and impossible to keep honest, so the crossings are generated from
 * a pattern that widens as it goes:
 *
 * - Crocodile gaps start at 5 tiles and finish at 7 (80px to 112px). A jump
 *   carries about 130px from a run and 119px from a standstill, and a back is
 *   38px wide, so the last ones are everything the cat has.
 * - Liana water starts short and ends long, and the fish thicken with it.
 *
 * The little hearts are spread over the banks rather than heaped on the first
 * few, and there are fewer of them than there are banks, because a level may
 * hold sixty at the outside and this one has a lot of banks.
 */

/** How many water crossings the level has, counting both kinds. */
const CROSSINGS = 35;

/** Every nth bank gets a little heart on it. */
const HEART_EVERY = 2;

function crossings(): string[][] {
  const made: string[][] = [];

  for (let i = 0; i < CROSSINGS; i += 1) {
    // How far through the level this one is, 0 to 1. Everything scales on it.
    const t = i / (CROSSINGS - 1);

    if (i % 2 === 0) {
      // Crocodile water. Backs 5 tiles apart at the start, 7 at the end.
      const gap = Math.round(5 + t * 2);
      const count = 3 + (i % 3);
      const backs = Array.from({ length: count }, (_, n) => 3 + n * gap);
      const width = backs[backs.length - 1] + 4;

      made.push(crocodiles(width, backs));
    } else {
      // Piranha water, crossed by liana. Ropes 5 to 6 tiles apart, with a fish
      // between every pair of them.
      const gap = Math.round(5 + t);
      const count = 3 + (i % 3);
      const ropes = Array.from({ length: count }, (_, n) => 4 + n * gap);
      const width = ropes[ropes.length - 1] + 5;
      const fish = Array.from({ length: count + 2 }, (_, n) => 2 + n * (gap - 1));

      made.push(lianas(width, fish.filter((x) => x < width - 1), ropes));
    }

    // The bank after it, with a little heart on some of them.
    const heart = i % HEART_EVERY === 0;
    made.push(
      bank(
        9,
        heart
          ? [
              [ROW_LINE, 3, 'o'],
              [ROW_LINE, 5, 'o'],
            ]
          : [],
      ),
    );
  }

  return made;
}

const SEGMENTS: string[][] = [
  // A rock to start on, where nothing can reach a player who has not touched
  // the controls yet.
  bank(12, [
    [ROW_LINE - 1, 2, 'P'],
    [ROW_LINE, 1, 'R'],
    [ROW_LINE, 2, 'R'],
    [ROW_LINE, 3, 'R'],
    [ROW_LINE, 6, 'o'],
    [ROW_LINE, 8, 'o'],
  ]),
  ...crossings(),
  bank(12, [
    [ROW_LINE, 3, 'o'],
    [ROW_LINE, 5, 'o'],
    [ROW_LINE, 8, 'E'],
  ]),
];

const ROWS: string[] = Array.from({ length: HEIGHT }, (_, row) =>
  SEGMENTS.map((segment) => segment[row]).join(''),
);

export const SWAMP: LevelDefinition = {
  name: 'Swamp',
  theme: 'swamp',
  widthInTiles: ROWS[0].length,
  groundRow: ROW_SURFACE,
  branchesNeedTrunks: false,
  rows: ROWS,
};
