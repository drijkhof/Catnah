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
 *   `R`  boulder — solid rock, and the surface wall jumps are taken from
 *   `T`  tree trunk — climbable, and deliberately *not* solid
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
 * gap to clear, then climbs again. The fallen bough on row 17 is the sneaking
 * passage: it leaves a one-tile gap above the floor, and the standing cat is
 * taller than that, so the only way through at ground level is sneaking. It can
 * still be jumped onto and crossed over the top, which keeps it a choice rather
 * than a wall.
 *
 * Two trunks, each ending two tiles *above* the branch beside it. That gap is
 * deliberate: letting go at the top has to leave enough fall time for the cat
 * to drift sideways over the branch before it drops past the level of it. The short one at column 13
 * introduces the idea; the tall one at column 73 runs from the floor to the
 * high branch, as a route that skips the whole climb.
 *
 * The columns either side of a trunk are kept clear for its whole length. The
 * cat is 22px wide against a 16px tile, so it overhangs its trunk by about 3px
 * on each side, and a branch merely *next to* a trunk is enough to catch its
 * shoulder and stop the climb dead.
 *
 * Two boulders. The small one at columns 14-15 is two tiles tall and met early,
 * to introduce rock as something solid and climbable. The tower at columns
 * 65-66 is seven tiles: its top sits 112px above the floor, and a single jump
 * only clears 86px, so the face has to be wall jumped. The reward is the berries
 * on top and a short hop across to the high branch that otherwise takes the
 * long way round.
 */
const LEVEL_SOURCE: string[] = [
  '',
  '',
  '',
  '',
  '',
  '.'.repeat(73) + 'T',
  '.'.repeat(69) + 'ooo' + '.' + 'T',
  '.'.repeat(69) + '='.repeat(4) + 'T',
  '.'.repeat(30) + 'T' + '.'.repeat(29) + 'oo' + '...' + 'oo' + '.'.repeat(6) + 'T',
  '.'.repeat(30) + 'T' + 'ooo' + '.'.repeat(26) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T',
  '.'.repeat(30) + 'T' + '='.repeat(5) + '.'.repeat(24) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T',
  '.'.repeat(10) + 'T' + '.'.repeat(15) + 'ooo' + '.' + 'T' + '.'.repeat(13) + 'T' + '.'.repeat(15) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T' + 'ooo',
  '.'.repeat(10) + 'T' + 'ooo' + '.'.repeat(12) + '='.repeat(4) + 'T' + '.'.repeat(13) + 'T' + 'ooo' + '.'.repeat(12) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T' + '='.repeat(5),
  '.'.repeat(10) + 'T' + '='.repeat(5) + '.'.repeat(14) + 'T' + '.'.repeat(13) + 'T' + '='.repeat(4) + '.'.repeat(11) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T',
  '.'.repeat(6) + 'ooo' + '.' + 'T' + '.'.repeat(19) + 'T' + '.'.repeat(9) + 'ooo' + '.' + 'T' + '.'.repeat(15) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T',
  '.'.repeat(6) + '='.repeat(4) + 'T' + '.'.repeat(19) + 'T' + '.'.repeat(9) + '='.repeat(4) + 'T' + '.'.repeat(8) + 'ooo' + '.'.repeat(4) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T',
  '.'.repeat(10) + 'T' + '.'.repeat(5) + 'ooo' + '.'.repeat(11) + 'T' + '.'.repeat(4) + 'ooo' + '.'.repeat(6) + 'T' + '.'.repeat(7) + 'R'.repeat(6) + '..' + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'T',
  '.'.repeat(10) + 'T' + '.'.repeat(4) + 'R'.repeat(6) + '.' + 'B'.repeat(6) + '..' + 'T' + '...' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + '.'.repeat(7) + 'R'.repeat(6) + '.'.repeat(7) + 'RR' + '.'.repeat(6) + 'T',
  '...' + 'P' + '.'.repeat(6) + 'T' + '.'.repeat(4) + 'R'.repeat(6) + '.'.repeat(9) + 'T' + '...' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + '.'.repeat(7) + 'R'.repeat(6) + '.'.repeat(7) + 'RR' + '.'.repeat(6) + 'T',
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(29),
];

/**
 * Row of the forest floor's surface. Scenery is planted against this line, so
 * it is stated once here rather than guessed from the parsed tiles -- the
 * sneaking overhang is also made of earth and would otherwise be mistaken for
 * ground level.
 */
export const GROUND_ROW = 19;

/** A position in world (pixel) space. */
export interface Point {
  x: number;
  y: number;
}

/** Which sides of a solid can actually be collided with. */
export interface Faces {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
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
  /**
   * Sides facing into a neighbouring solid are switched off. Nothing can ever
   * be there to hit them, and leaving them on makes the cat snag on the seams
   * between tiles -- see `exposedFaces`.
   */
  faces: Faces;
}

/** A stretch of trunk the cat can climb. Not collision -- purely a zone. */
export interface ClimbZone {
  x: number;
  y: number;
  width: number;
  height: number;
  /** The topmost tile of a trunk, which gets the leafy cap. */
  isTop: boolean;
}

export interface ParsedLevel {
  solids: Solid[];
  /** Trunks, which are climbed rather than stood on. */
  climbZones: ClimbZone[];
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
  const climbZones: ClimbZone[] = [];
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
            faces: exposedFaces(at, column, row),
          });
          break;

        case 'T':
          climbZones.push({
            x,
            y,
            width: TILE,
            height: TILE,
            isTop: at(column, row - 1) !== 'T',
          });
          break;

        case 'R':
          solids.push({
            x,
            y,
            width: TILE,
            height: TILE,
            // Same top/fill rule as the earth: rock only weathers where it is
            // actually exposed, so a stack reads as one mass.
            textureKey: at(column, row - 1) === 'R' ? 'rock-fill' : 'rock-top',
            isBranch: false,
            faces: exposedFaces(at, column, row),
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
            faces: exposedFaces(at, column, row),
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
            // Branches are one-way: solid underfoot, and nothing else. You jump
            // up through one from below and land on it coming down. Leaving the
            // sides solid would also mean a branch could catch the shoulder of
            // a cat climbing the very trunk it grows from.
            faces: { up: true, down: false, left: false, right: false },
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

  assertBranchesGrowFromTrunks(rows);

  return {
    solids,
    climbZones,
    berries,
    spawn,
    groundLine: GROUND_ROW * TILE,
    widthInPixels: LEVEL_WIDTH_IN_TILES * TILE,
    heightInPixels: rows.length * TILE,
  };
}

/**
 * Refuses a level containing a branch that is not attached to a trunk.
 *
 * Branches hang in the air on their own quite happily as far as the physics is
 * concerned, so this is a rule about the world rather than about the code: a
 * branch belongs to a tree. Checking it here means a level cannot quietly drift
 * out of that shape while nobody is looking.
 */
function assertBranchesGrowFromTrunks(rows: string[]): void {
  const orphans: string[] = [];

  rows.forEach((tiles, row) => {
    let column = 0;

    while (column < LEVEL_WIDTH_IN_TILES) {
      if (tiles[column] !== '=') {
        column += 1;
        continue;
      }

      const first = column;
      while (tiles[column] === '=') {
        column += 1;
      }
      const last = column - 1;

      // A run is attached if a trunk stands at either end of it.
      const attached = tiles[first - 1] === 'T' || tiles[last + 1] === 'T';

      if (!attached) {
        orphans.push(`row ${row}, columns ${first}-${last}`);
      }
    }
  });

  if (orphans.length > 0) {
    throw new Error(
      `Every branch must grow from a trunk. Unattached: ${orphans.join('; ')}.`,
    );
  }
}

/** Solids that fill their whole cell, as opposed to a branch's thin bar of wood. */
const FULL_CELL = new Set(['#', 'B', 'R']);

/**
 * Works out which sides of a tile anything could ever touch.
 *
 * Each tile is its own rectangle, and by default all four of its sides are
 * solid -- including the ones buried inside a mass of rock or earth, where
 * nothing can reach. Those buried sides are not harmless: when the cat presses
 * against a wall, the overlap with the tile it is touching is a fraction of a
 * pixel, and so is the overlap with the tile above once its head crosses a
 * seam. Arcade separates on whichever axis overlaps least, so it can pick the
 * vertical one and report the cat as having hit a ceiling -- killing a jump
 * against a flat wall. Switching the buried sides off removes the choice.
 *
 * This is the same thing Phaser's own tilemaps do when they calculate faces.
 */
function exposedFaces(
  at: (column: number, row: number) => string,
  column: number,
  row: number,
): Faces {
  const self = at(column, row);

  /** Does `neighbour` completely cover the side of `self` that faces it? */
  const covered = (neighbour: string, horizontal: boolean): boolean => {
    if (FULL_CELL.has(neighbour)) {
      return true;
    }

    // A branch is only the top half of its cell, so it covers the side of
    // another branch beside it, but leaves the lower half of a full tile's
    // side reachable.
    return neighbour === '=' && self === '=' && horizontal;
  };

  return {
    up: !covered(at(column, row - 1), false),
    down: !covered(at(column, row + 1), false),
    left: !covered(at(column - 1, row), true),
    right: !covered(at(column + 1, row), true),
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
