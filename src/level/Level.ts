import { TILE } from '../config';
import { BRANCH_THICKNESS } from '../art';
import type { ThemeName } from './themes';
import type { GroundEnemyKind } from '../config';

/**
 * One level, as a grid of characters.
 *
 *   `#`  floor / earth
 *   `=`  one-way platform — a branch, a stone shelf, a girder
 *   `B`  full-height solid used for low overhangs
 *   `R`  boulder / brick — solid rock, and what wall jumps are taken from
 *   `T`  climbable column — a trunk, a vine, a drainpipe
 *   `w`  water — swimmable, not solid, harmless on its own
 *   `N`  nest, decoration
 *   `o`  berry
 *   `P`  cat spawn (exactly one)
 *   `E`  the way out, to the next level
 *   `h`  hedgehog, pacing the floor it stands on
 *   `r`  rat, the same but faster — the city's version
 *   `A`  parked car, solid and climbable
 *   `f`  piranha — water *with* a piranha in it, so placing one never
 *        punches a hole in the pool it is meant to be swimming in
 *   `S`  star — a nest tile *with* the star in it, so placing one never
 *        punches a hole in the nest it is meant to be sitting in
 *   `c`  crow, which circles the nest it is placed at
 *   `.`  empty
 *
 * Rows may be written short; they are padded out with empty tiles.
 */
export interface LevelDefinition {
  name: string;
  theme: ThemeName;
  widthInTiles: number;
  /** Row of the floor's surface, which scenery is planted against. */
  groundRow: number;
  /**
   * Whether every `=` run must touch a `T`.
   *
   * True in the forest, where a branch belongs to a tree. The cave and the city
   * have no trees, so their ledges stand on their own.
   */
  branchesNeedTrunks: boolean;
  /**
   * Whether `=` platforms are solid from every side rather than one-way.
   *
   * The forest and the cave grow theirs out of the world, so you pass up
   * through them. A city girder is a girder.
   */
  solidPlatforms?: boolean;
  rows: string[];
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
  x: number;
  y: number;
  width: number;
  height: number;
  /** Bare texture name; the scene prefixes it with the level's theme. */
  textureKey: string;
  isBranch: boolean;
  /**
   * Sides facing into a neighbouring solid are switched off. Nothing can ever
   * be there to hit them, and leaving them on makes things snag on the seams
   * between tiles -- see `exposedFaces`.
   */
  faces: Faces;
}

/** A creature that paces the floor, and which kind it is. */
export interface Walker extends Point {
  kind: GroundEnemyKind;
}

/** A position in world (pixel) space. */
export interface Point {
  x: number;
  y: number;
}

/** A tile of water. Not collision -- the cat swims through it. */
export interface WaterZone extends Point {
  width: number;
  height: number;
  isSurface: boolean;
}

/** A stretch of climbable column. Not collision -- purely a zone. */
export interface ClimbZone extends Point {
  width: number;
  height: number;
  isTop: boolean;
}

export interface ParsedLevel {
  name: string;
  theme: ThemeName;
  solids: Solid[];
  climbZones: ClimbZone[];
  waterZones: WaterZone[];
  /** Creatures that pace the floor: hedgehogs, and rats in the city. */
  walkers: Walker[];
  piranhas: Point[];
  crows: Point[];
  nests: Point[];
  berries: Point[];
  /** The star, if this level has one. Required to leave. */
  star: Point | null;
  /** Where the cat starts, and returns to after dying. */
  spawn: Point;
  /** Where the level is left, if it has a way out. */
  exit: Point | null;
  groundLine: number;
  widthInPixels: number;
  heightInPixels: number;
}

/**
 * Turns a level's character grid into world-space rectangles.
 *
 * Kept free of Phaser so levels can come from a file, a Tiled export or a
 * generator without touching rendering or physics: anything that can produce a
 * `ParsedLevel` will work.
 */
export function parseLevel(definition: LevelDefinition): ParsedLevel {
  const width = definition.widthInTiles;
  const rows = definition.rows.map((row) => row.padEnd(width, '.'));
  const at = (column: number, row: number): string => rows[row]?.[column] ?? '.';

  const solids: Solid[] = [];
  const climbZones: ClimbZone[] = [];
  const waterZones: WaterZone[] = [];
  const walkers: Walker[] = [];
  const piranhas: Point[] = [];
  const crows: Point[] = [];
  const nests: Point[] = [];
  const berries: Point[] = [];
  let spawn: Point | null = null;
  let star: Point | null = null;
  let exit: Point | null = null;

  /**
   * A thin one-way ledge, used for the tops of trees and for nests. Invisible
   * in itself -- whatever drew the tile is what you see.
   */
  const platform = (x: number, y: number, textureKey: string): Solid => ({
    x,
    y,
    width: TILE,
    height: BRANCH_THICKNESS,
    textureKey,
    isBranch: true,
    faces: { up: true, down: false, left: false, right: false },
  });

  const block = (x: number, y: number, textureKey: string, column: number, row: number): void => {
    solids.push({
      x,
      y,
      width: TILE,
      height: TILE,
      textureKey,
      isBranch: false,
      faces: exposedFaces(at, column, row),
    });
  };

  rows.forEach((tiles, row) => {
    for (let column = 0; column < width; column += 1) {
      const x = column * TILE;
      const y = row * TILE;

      switch (tiles[column]) {
        case '#':
          // Grass only where the earth is actually exposed to the sky. This is
          // what stops a stack of tiles reading as stripes.
          block(x, y, at(column, row - 1) === '#' ? 'ground-fill' : 'ground-top', column, row);
          break;

        case 'R':
          block(x, y, at(column, row - 1) === 'R' ? 'rock-fill' : 'rock-top', column, row);
          break;

        case 'B':
          block(x, y, 'bough', column, row);
          break;

        case '=':
          solids.push({
            x,
            y,
            width: TILE,
            // Only as tall as the platform itself, so the collision box is
            // exactly the surface something lands on.
            height: BRANCH_THICKNESS,
            textureKey: branchTexture(at(column - 1, row), at(column + 1, row)),
            isBranch: !definition.solidPlatforms,
            faces: definition.solidPlatforms
              ? exposedFaces(at, column, row)
              // One-way: solid underfoot and nothing else. You pass up through
              // one from below and land on it coming down.
              : { up: true, down: false, left: false, right: false },
          });
          break;

        case 'T': {
          const isTop = at(column, row - 1) !== 'T';

          climbZones.push({ x, y, width: TILE, height: TILE, isTop });

          // The crown of a tree is somewhere to stand. One-way, so climbing up
          // the inside of the trunk still passes through it.
          if (isTop) {
            solids.push(platform(x, y, 'trunk-top-ledge'));
          }
          break;
        }

        case 'w':
        case 'f':
          waterZones.push({
            x,
            y,
            width: TILE,
            height: TILE,
            isSurface: !'wf'.includes(at(column, row - 1)),
          });

          if (tiles[column] === 'f') {
            piranhas.push({ x: x + TILE / 2, y });
          }
          break;

        case 'h':
          walkers.push({ x: x + TILE / 2, y: y + TILE, kind: 'hedgehog' });
          break;

        case 'r':
          walkers.push({ x: x + TILE / 2, y: y + TILE, kind: 'rat' });
          break;

        case 'A':
          block(x, y, carTexture(at(column - 1, row), at(column + 1, row)), column, row);
          break;

        case 'c':
          crows.push({ x: x + TILE / 2, y: y + TILE / 2 });
          break;

        case 'N':
          nests.push({ x, y });
          solids.push(platform(x, y, 'nest-ledge'));
          break;

        case 'o':
          berries.push({ x: x + TILE / 2, y: y + TILE / 2 });
          break;

        case 'S':
          star = { x: x + TILE / 2, y: y + TILE / 2 };
          nests.push({ x, y });
          solids.push(platform(x, y, 'nest-ledge'));
          break;

        case 'P':
          spawn = { x: x + TILE / 2, y: y + TILE };
          break;

        case 'E':
          exit = { x: x + TILE / 2, y: y + TILE };
          break;

        default:
          break;
      }
    }
  });

  if (!spawn) {
    throw new Error(`Level "${definition.name}" has no 'P' spawn tile.`);
  }

  if (definition.branchesNeedTrunks) {
    assertBranchesGrowFromTrunks(rows, width, definition.name);
  }
  assertCreaturesHaveRoom(rows, width, definition.name);
  assertWalkersStandOnGround(rows, width, definition.name);
  assertSpawnHasFooting(rows, width, definition.name, spawn);

  return {
    name: definition.name,
    theme: definition.theme,
    solids,
    climbZones,
    waterZones,
    walkers,
    piranhas,
    crows,
    nests,
    berries,
    star,
    spawn,
    exit,
    groundLine: definition.groundRow * TILE,
    widthInPixels: width * TILE,
    heightInPixels: rows.length * TILE,
  };
}

/**
 * Refuses a level containing a branch that is not attached to a trunk.
 *
 * Branches hang in the air quite happily as far as the physics is concerned, so
 * this is a rule about the world rather than about the code: in the forest, a
 * branch belongs to a tree.
 */
function assertBranchesGrowFromTrunks(rows: string[], width: number, name: string): void {
  const orphans: string[] = [];

  rows.forEach((tiles, row) => {
    let column = 0;

    while (column < width) {
      if (tiles[column] !== '=') {
        column += 1;
        continue;
      }

      const first = column;
      while (tiles[column] === '=') {
        column += 1;
      }

      if (tiles[first - 1] !== 'T' && tiles[column] !== 'T') {
        orphans.push(`row ${row}, columns ${first}-${column - 1}`);
      }
    }
  });

  if (orphans.length > 0) {
    throw new Error(
      `Every branch in "${name}" must grow from a trunk. Unattached: ${orphans.join('; ')}.`,
    );
  }
}

/**
 * Refuses a level where a creature has been placed inside solid ground.
 *
 * Writing an `h` over a boulder tile leaves a hole in the boulder and a
 * hedgehog wedged in it, jittering on the spot. The symptom looks like broken
 * patrol logic rather than a misplaced character.
 */
function assertCreaturesHaveRoom(rows: string[], width: number, name: string): void {
  const wedged: string[] = [];

  rows.forEach((tiles, row) => {
    for (let column = 0; column < width; column += 1) {
      if (!'hrfc'.includes(tiles[column])) {
        continue;
      }

      if (FULL_CELL.has(rows[row - 1]?.[column] ?? '.')) {
        wedged.push(`${tiles[column]} at row ${row}, column ${column}`);
      }
    }
  });

  if (wedged.length > 0) {
    throw new Error(`Creatures in "${name}" need clear space: ${wedged.join('; ')}.`);
  }
}

/**
 * Refuses a level whose spawn is buried in the floor.
 *
 * A `P` written one row too low replaces a floor tile and leaves the cat in a
 * sealed hole beneath the surface, where it drops straight out of the world and
 * respawns into the same hole. The level looks fine in the grid and is
 * unplayable from the first frame, so it is worth refusing outright.
 */
function assertSpawnHasFooting(
  rows: string[],
  width: number,
  name: string,
  spawn: Point,
): void {
  const column = Math.floor(spawn.x / TILE);
  const row = Math.floor(spawn.y / TILE) - 1;

  // Something to stand on, within a few tiles.
  for (let below = row + 1; below < rows.length && below <= row + 4; below += 1) {
    if (FULL_CELL.has(rows[below]?.[column] ?? '.')) {
      return;
    }
  }

  void width;
  throw new Error(
    `The spawn in "${name}" (row ${row}, column ${column}) has no floor under it.`,
  );
}

/**
 * Refuses a level with a hedgehog or rat anywhere but on the floor.
 *
 * They belong on the ground: not on platforms, not on top of boulders, and
 * not under water. That is a rule about the world, and it is far easier to hold
 * to here than to notice by looking at a grid.
 */
function assertWalkersStandOnGround(rows: string[], width: number, name: string): void {
  const misplaced: string[] = [];

  rows.forEach((tiles, row) => {
    for (let column = 0; column < width; column += 1) {
      if (!'hr'.includes(tiles[column])) {
        continue;
      }

      if ((rows[row + 1]?.[column] ?? '.') !== '#') {
        misplaced.push(`row ${row}, column ${column}`);
      }
    }
  });

  if (misplaced.length > 0) {
    throw new Error(
      `Floor creatures in "${name}" must stand on plain floor: ${misplaced.join('; ')}.`,
    );
  }
}

/** Solids that fill their whole cell, as opposed to a platform's thin bar. */
const FULL_CELL = new Set(['#', 'B', 'R']);

/**
 * Works out which sides of a tile anything could ever touch.
 *
 * Each tile is its own rectangle, and by default all four sides are solid --
 * including the ones buried inside a mass of rock, where nothing can reach.
 * Those are not harmless: when the cat presses against a wall the overlap is a
 * fraction of a pixel, and so is the overlap with the tile above once its head
 * crosses a seam. Arcade separates on whichever axis overlaps least, so it can
 * pick the vertical one and report a ceiling, killing a jump against a flat
 * wall. Switching the buried sides off removes the choice.
 */
function exposedFaces(
  at: (column: number, row: number) => string,
  column: number,
  row: number,
): Faces {
  const self = at(column, row);

  const covered = (neighbour: string, horizontal: boolean): boolean => {
    if (FULL_CELL.has(neighbour)) {
      return true;
    }

    return neighbour === '=' && self === '=' && horizontal;
  };

  return {
    up: !covered(at(column, row - 1), false),
    down: !covered(at(column, row + 1), false),
    left: !covered(at(column - 1, row), true),
    right: !covered(at(column + 1, row), true),
  };
}

/** Picks which part of a car a tile is, so a run of them reads as one vehicle. */
function carTexture(left: string, right: string): string {
  if (left !== 'A') {
    return 'car-left';
  }

  if (right !== 'A') {
    return 'car-right';
  }

  return 'car-mid';
}

/** Picks the end-cap so a platform is rounded off rather than sawn through. */
function branchTexture(left: string, right: string): string {
  if (left !== '=') {
    return 'branch-left';
  }

  if (right !== '=') {
    return 'branch-right';
  }

  return 'branch-mid';
}
