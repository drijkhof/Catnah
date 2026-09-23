import { MAX_CHARMS_PER_LEVEL, SPIDER, TILE } from '../config';
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
 *   `o`  charm
 *   `P`  cat spawn (exactly one)
 *   `E`  the way out, to the next level
 *   `h`  hedgehog, pacing the floor it stands on
 *   `r`  rat, the same but faster — the city's version
 *   `A`  parked car, solid and climbable
 *   `f`  piranha — water *with* a piranha in it, so placing one never
 *        punches a hole in the pool it is meant to be swimming in
 *   `C`  crocodile — likewise water, with a crocodile lying at the surface of
 *        it. A stepping stone that sinks once it has been stepped on
 *   `+`  extra life — a nest tile with a spare heart in it. Never required,
 *        and always guarded.
 *   `c`  crow, which circles the nest it is placed at
 *   `^`  thorns -- reeds, stalagmites, a spiked railing. Deadly to touch, and
 *        the only hazard that is neither alive nor a liquid. Needs something
 *        solid directly under it
 *   `*`  checkpoint -- touch it and dying no longer sends you back to the
 *        start of the level, but here. `C` was already the crocodile, so this
 *        one is a literal asterisk rather than a letter
 *   `s`  spider, which walks the ceiling above the tile it is placed on and
 *        drops on a thread. Needs solid rock directly above it
 *   `S`  the same, ten times the size. One of them, guarding the cave's heart
 *   `X`  the boss, which guards the end of the level it is placed in
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
  /**
   * Whether the `T` columns here can be climbed.
   *
   * True everywhere but the forest. A liana, a rope, a drainpipe and a chain
   * are things you go up; a tree trunk is a tree. Turning it off leaves the
   * trunks drawn and walk-through exactly as they were, and their crowns still
   * something to stand on -- it takes away only the climb, so the way up a tree
   * is its branches.
   */
  climbableColumns?: boolean;
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

/** A piranha, and the pool it lives in. */
export interface Piranha extends Point {
  /** Index into `pools`. A fish belongs to one body of water, and only that. */
  poolIndex: number;
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

/** A spider hanging under a ceiling. `size` is 1, or ten for the giant. */
export interface Spider extends Point {
  size: number;
}

/** A crocodile lying in a pool, which is also the only water it will enter. */
export interface Crocodile extends Point {
  /** Index into `pools`. A crocodile never leaves the water it lies in. */
  poolIndex: number;
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
  /**
   * Whether the column is bolted to something.
   *
   * A column with a wall beside it is a drainpipe running down a building; one
   * standing on its own in the open is a lamppost. They are drawn differently
   * at the top, and nothing else about them differs.
   */
  againstWall: boolean;
}

export interface ParsedLevel {
  name: string;
  theme: ThemeName;
  solids: Solid[];
  climbZones: ClimbZone[];
  waterZones: WaterZone[];
  /** Whether the columns above can be climbed, or are only scenery to stand on. */
  columnsAreClimbable: boolean;
  /** Water, grouped into connected pools. A piranha never leaves its own. */
  pools: WaterZone[][];
  /** Lava. Shaped like water, but touching it kills. */
  lavaZones: WaterZone[];
  /** Creatures that pace the floor: hedgehogs, and rats in the city. */
  walkers: Walker[];
  /** Where each piranha lurks, and which pool it belongs to. */
  piranhas: Piranha[];
  /** Crocodiles, by where their backs rest and which pool they hunt in. */
  crocodiles: Crocodile[];
  crows: Point[];
  /** Spiders, by the underside of the ceiling each hangs from, and how big. */
  spiders: Spider[];
  /** Where the boss holds its ground, if the level has one. */
  boss: Point | null;
  nests: Point[];
  charms: Point[];
  /** Thorn tiles. Deadly, and scenery otherwise -- nothing stands on them. */
  thorns: Point[];
  /** Checkpoints, in the order they appear in the grid. */
  checkpoints: Point[];
  /** Spare hearts sitting in nests. Always optional. */
  extraLives: Point[];
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
  const lavaZones: WaterZone[] = [];
  const walkers: Walker[] = [];
  const piranhaSpots: Point[] = [];
  const crocodileSpots: Point[] = [];
  const crows: Point[] = [];
  const spiders: Spider[] = [];
  const nests: Point[] = [];
  const charms: Point[] = [];
  const thorns: Point[] = [];
  const checkpoints: Point[] = [];
  let spawn: Point | null = null;
  let boss: Point | null = null;
  const extraLives: Point[] = [];
  let exit: Point | null = null;

  /**
   * A thin one-way ledge, used for the tops of trees and for nests. Invisible
   * in itself -- whatever drew the tile is what you see.
   */
  /**
   * How far down its tile a nest's floor sits, in pixels.
   *
   * The cat sits *in* a nest, not on top of one, so the ledge is partway down
   * and the near rim is drawn over its legs.
   */
  const NEST_SIT_DEPTH = 9;

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

        case 'M':
          block(x, y, houseTexture(at, column, row), column, row);
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
          const againstWall =
            'R#BM'.includes(at(column - 1, row)) || 'R#BM'.includes(at(column + 1, row));

          climbZones.push({ x, y, width: TILE, height: TILE, isTop, againstWall });

          // The crown of a tree is somewhere to stand. One-way, so climbing up
          // the inside of the trunk still passes through it.
          if (isTop) {
            solids.push(platform(x, y, 'trunk-top-ledge'));
          }
          break;
        }

        case 'L':
          lavaZones.push({
            x,
            y,
            width: TILE,
            height: TILE,
            isSurface: at(column, row - 1) !== 'L',
          });
          break;

        case 'w':
        case 'f':
        case 'C':
          waterZones.push({
            x,
            y,
            width: TILE,
            height: TILE,
            isSurface: !'wfC'.includes(at(column, row - 1)),
          });

          if (tiles[column] === 'f') {
            piranhaSpots.push({ x: x + TILE / 2, y });
          }

          if (tiles[column] === 'C') {
            crocodileSpots.push({ x: x + TILE / 2, y });
          }
          break;

        case 'h':
          walkers.push({ x: x + TILE / 2, y: y + TILE, kind: 'hedgehog' });
          break;

        case 'r':
          walkers.push({ x: x + TILE / 2, y: y + TILE, kind: 'rat' });
          break;

        case 'A':
          block(x, y, carTexture(at, column, row), column, row);
          break;

        case 's':
          spiders.push({ x: x + TILE / 2, y, size: 1 });
          break;

        case 'S':
          spiders.push({ x: x + TILE / 2, y, size: SPIDER.giantScale });
          break;

        case 'c':
          crows.push({ x: x + TILE / 2, y: y + TILE / 2 });
          break;

        case '^':
          thorns.push({ x, y });
          break;

        case '*':
          checkpoints.push({ x: x + TILE / 2, y: y + TILE / 2 });
          break;

        case 'X':
          boss = { x: x + TILE / 2, y: y + TILE / 2 };
          break;

        case 'N':
          nests.push({ x, y });
          solids.push(platform(x, y + NEST_SIT_DEPTH, 'nest-ledge'));
          break;

        case 'o':
          charms.push({ x: x + TILE / 2, y: y + TILE / 2 });
          break;

        case '+':
          extraLives.push({ x: x + TILE / 2, y: y + TILE / 2 });
          nests.push({ x, y });
          solids.push(platform(x, y + NEST_SIT_DEPTH, 'nest-ledge'));
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
  assertSpidersHangFromRock(rows, width, definition.name);
  assertCharmBudget(charms, definition.name);
  assertThornsStandOnGround(rows, width, definition.name);
  assertSpawnHasFooting(rows, width, definition.name, spawn);

  const pools = groupIntoPools(waterZones);

  const crocodiles: Crocodile[] = crocodileSpots.map((at) => ({
    ...at,
    poolIndex: pools.findIndex((pool) =>
      pool.some((tile) => tile.x === at.x - TILE / 2 && tile.y === at.y),
    ),
  }));
  const piranhas: Piranha[] = piranhaSpots.map((spot) => ({
    ...spot,
    poolIndex: pools.findIndex((pool) =>
      pool.some((tile) => tile.x === spot.x - TILE / 2 && tile.y === spot.y),
    ),
  }));

  return {
    name: definition.name,
    theme: definition.theme,
    solids,
    climbZones,
    columnsAreClimbable: definition.climbableColumns ?? true,
    waterZones,
    pools,
    crocodiles,
    lavaZones,
    walkers,
    piranhas,
    crows,
    spiders,
    boss,
    nests,
    charms,
    thorns,
    checkpoints,
    extraLives,
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
      if (!'hrfcX'.includes(tiles[column])) {
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
/**
 * A spider hangs from the rock directly over it.
 *
 * Without something up there its thread is anchored to nothing and it walks a
 * ceiling that is not there, which looks exactly like a bug because it is one.
 */
/**
 * No level holds more than `MAX_CHARMS_PER_LEVEL` little hearts.
 *
 * A hundred of them buys a life, and the cap is well under that, so a life is
 * always at least two levels of collecting. A long level that simply scattered
 * more of them would quietly turn that into one.
 */
function assertCharmBudget(charms: Point[], name: string): void {
  if (charms.length > MAX_CHARMS_PER_LEVEL) {
    throw new Error(
      `${name} has ${charms.length} little hearts in it; the most a level may hold is ${MAX_CHARMS_PER_LEVEL}.`,
    );
  }
}

/**
 * Thorns grow out of something. A patch hanging in mid-air over a crossing is
 * an invisible wall you die on, and it is far too easy to write one by nudging
 * a row sideways.
 */
function assertThornsStandOnGround(rows: string[], width: number, name: string): void {
  for (let row = 0; row < rows.length; row += 1) {
    for (let column = 0; column < width; column += 1) {
      if ((rows[row]?.[column] ?? '.') !== '^') {
        continue;
      }

      const below = rows[row + 1]?.[column] ?? '.';

      if (!'#RBMA='.includes(below)) {
        throw new Error(
          `${name}: the thorns at ${column},${row} stand on nothing (found '${below}').`,
        );
      }
    }
  }
}

function assertSpidersHangFromRock(rows: string[], width: number, name: string): void {
  for (let row = 0; row < rows.length; row += 1) {
    for (let column = 0; column < width; column += 1) {
      if (!'sS'.includes(rows[row][column])) {
        continue;
      }

      const above = rows[row - 1]?.[column] ?? '.';

      if (!'#RBM'.includes(above)) {
        throw new Error(
          `${name}: the spider at ${column},${row} has no rock over it (found '${above}').`,
        );
      }
    }
  }
}

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

/**
 * Groups water tiles into connected pools.
 *
 * A piranha is given one of these and never leaves it. Without that, chasing a
 * swimming cat steered the fish straight at it -- across dry land, through the
 * ground, and into somebody else's pond.
 */
function groupIntoPools(tiles: WaterZone[]): WaterZone[][] {
  const byKey = new Map<string, WaterZone>();
  const key = (x: number, y: number): string => `${x},${y}`;

  for (const tile of tiles) {
    byKey.set(key(tile.x, tile.y), tile);
  }

  const pools: WaterZone[][] = [];
  const seen = new Set<string>();

  for (const tile of tiles) {
    if (seen.has(key(tile.x, tile.y))) {
      continue;
    }

    const pool: WaterZone[] = [];
    const queue = [tile];
    seen.add(key(tile.x, tile.y));

    while (queue.length > 0) {
      const current = queue.pop() as WaterZone;
      pool.push(current);

      for (const [dx, dy] of [[TILE, 0], [-TILE, 0], [0, TILE], [0, -TILE]]) {
        const neighbourKey = key(current.x + dx, current.y + dy);
        const neighbour = byKey.get(neighbourKey);

        if (neighbour && !seen.has(neighbourKey)) {
          seen.add(neighbourKey);
          queue.push(neighbour);
        }
      }
    }

    pools.push(pool);
  }

  return pools;
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

/**
 * Picks which part of a house a tile is.
 *
 * The top of a column is its roof. Everything under it is wall, and **one wall
 * tile in nine has a window in it** -- picked off the tile's own place in the
 * grid, so the windows line up in courses the way a house's do. Putting one in
 * every tile, which is what this did first, turns a terrace into graph paper.
 */
function houseTexture(
  at: (column: number, row: number) => string,
  column: number,
  row: number,
): string {
  if (at(column, row - 1) !== 'M') {
    return 'house-top';
  }

  return column % 3 === 1 && row % 3 === 1 ? 'house-window' : 'house-fill';
}

/**
 * Picks which part of a car a tile is, so a block of them reads as one vehicle.
 *
 * A car is written as two rows: a long lower one and a shorter upper one over
 * the middle of it, which is a bonnet, a cabin and a boot.
 *
 *     .AAA.
 *     AAAAA
 *
 * The tile works out where it sits from its neighbours alone, so a car can be
 * any length and still come out with one nose, one tail and a cabin between
 * them.
 */
function carTexture(
  at: (column: number, row: number) => string,
  column: number,
  row: number,
): string {
  const leftEnd = at(column - 1, row) !== 'A';
  const rightEnd = at(column + 1, row) !== 'A';

  // Something below means this is the cabin rather than the body.
  if (at(column, row + 1) === 'A') {
    if (leftEnd) {
      return 'car-windscreen';
    }

    if (rightEnd) {
      return 'car-rear-window';
    }

    return 'car-roof';
  }

  if (leftEnd) {
    return 'car-nose';
  }

  if (rightEnd) {
    return 'car-tail';
  }

  // Under the cabin is a door; the rest is the sill between wheel and cabin.
  return at(column, row - 1) === 'A' ? 'car-door' : 'car-sill';
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
