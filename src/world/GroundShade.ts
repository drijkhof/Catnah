import Phaser from 'phaser';
import { GROUND_SHADE, TILE } from '../config';
import { bakeTexture } from '../art';
import type { Solid } from '../level/Level';

/**
 * The darkness inside the ground.
 *
 * A surface is lit and a mass is dark: grass, the lip of earth under it and a
 * cliff face show their texture, and a tile or so in, everything fades to the
 * same near-black. Nothing is drawn where nothing can be seen -- which is
 * also what stops a wall of identical fill tiles reading as wallpaper.
 *
 * Built as a distance field: for every full solid tile, each 4x4 cell of it
 * measures how far it is from the nearest air, and that distance sets how
 * dark it is. The result is cached per pattern and placed as one overlay
 * image per tile, so a level of fifteen thousand tiles costs a few dozen
 * textures and no per-frame drawing.
 */
export function addGroundShade(
  scene: Phaser.Scene,
  solids: Solid[],
  widthInPixels: number,
  heightInPixels: number,
  colour: number,
): void {
  const columns = Math.ceil(widthInPixels / TILE);
  const rows = Math.ceil(heightInPixels / TILE);

  const index = (column: number, row: number): number => row * columns + column;
  const cellOf = (solid: Solid): number => index(solid.x / TILE, solid.y / TILE);
  const fullCell = (solid: Solid): boolean =>
    !solid.isBranch && solid.width === TILE && solid.height === TILE;

  // Every full cell, whatever it is made of, for telling buried from exposed.
  const anything = new Set<number>(solids.filter(fullCell).map(cellOf));
  const inside = (column: number, row: number): boolean =>
    column >= 0 && row >= 0 && column < columns && row < rows;
  const buried = buriedRocks(solids.filter((solid) => fullCell(solid) && isRock(solid)), anything, index, inside, columns);

  // What the darkness lives in: earth, cave wall, and stones buried in them.
  const full = new Set<number>();

  for (const solid of solids) {
    if (isMass(solid, buried.has(cellOf(solid)))) {
      full.add(cellOf(solid));
    }
  }

  // Outside the level counts as solid: the bottom rows go fully dark rather
  // than being lit from below by nothing.
  const isAir = (column: number, row: number): boolean =>
    inside(column, row) && !full.has(index(column, row));

  const CELL = 2;
  const cellsPerSide = TILE / CELL;
  const reach = Math.ceil(GROUND_SHADE.full / TILE) + 1;
  const cache = new Map<string, string>();

  for (const solid of solids) {
    if (!isMass(solid, buried.has(cellOf(solid)))) {
      continue;
    }

    const column = solid.x / TILE;
    const row = solid.y / TILE;
    const alphas: number[] = [];
    let any = false;

    for (let cy = 0; cy < cellsPerSide; cy += 1) {
      for (let cx = 0; cx < cellsPerSide; cx += 1) {
        const px = cx * CELL + CELL / 2;
        const py = cy * CELL + CELL / 2;
        let nearest = Number.POSITIVE_INFINITY;

        for (let dr = -reach; dr <= reach; dr += 1) {
          for (let dc = -reach; dc <= reach; dc += 1) {
            if (!isAir(column + dc, row + dr)) {
              continue;
            }

            // Distance from this cell's centre to that air tile's rectangle.
            const left = dc * TILE;
            const top = dr * TILE;
            const ox = Math.max(left - px, 0, px - (left + TILE));
            const oy = Math.max(top - py, 0, py - (top + TILE));
            nearest = Math.min(nearest, Math.hypot(ox, oy));
          }
        }

        const alpha = shadeFor(nearest);
        alphas.push(alpha);
        any ||= alpha > 0;
      }
    }

    if (!any) {
      continue;
    }

      const pattern = alphas.map((alpha) => Math.round(alpha * 64)).join(',');
    let key = cache.get(pattern);

    if (!key) {
      key = `ground-shade:${cache.size}:${colour}`;
      cache.set(pattern, key);

      bakeTexture(scene, key, TILE, TILE, (g) => {
        alphas.forEach((alpha, i) => {
          if (alpha <= 0) {
            return;
          }

          g.fillStyle(colour, alpha);
          g.fillRect((i % cellsPerSide) * CELL, Math.floor(i / cellsPerSide) * CELL, CELL, CELL);
        });
      });
    }

    scene.add.image(solid.x, solid.y, key).setOrigin(0, 0);
  }
}

/**
 * What the darkness lives in: earth, the walls of a cave, and stones buried
 * in them. Not:
 *
 * - a branch, a bar of wood with air both sides of it;
 * - a rock (`R`) that touches air, which is a boulder lying *on* the ground,
 *   not part of it -- it stays lit all through, and the earth under it keeps
 *   its grass, as if the rock had been set down on the lawn. The same `R`
 *   with earth on every side is a stone *in* the ground, there to break up
 *   the earth, and it darkens with it -- see `buriedRocks`;
 * - a building, a wall with a room behind it -- darkening its inside made a
 *   house read as a tunnel.
 *
 * Everything that is not mass counts as air for the distance field too, so
 * the ground beside a boulder or a house is lit from that side.
 */
function isMass(solid: Solid, isBuried: boolean): boolean {
  if (solid.isBranch || solid.width !== TILE || solid.height !== TILE) {
    return false;
  }

  if (isRock(solid)) {
    return isBuried;
  }

  // A fallen tree is a thing lying on the ground, like a boulder, not part
  // of it.
  return !solid.textureKey.startsWith('house-') && solid.textureKey !== 'bough';
}

function isRock(solid: Solid): boolean {
  return solid.textureKey.startsWith('rock-');
}

/**
 * Which rock cells belong to a cluster that never touches air.
 *
 * Whole clusters, not cells: the middle of a boulder on the lawn has rock on
 * every side too, and is not buried. A cluster is buried when none of its
 * cells has a neighbour that is air or outside the level. The level's own
 * layout decides, so no extra glyph is needed to tell a boulder from a stone
 * in the earth.
 */
function buriedRocks(
  rocks: Solid[],
  anything: Set<number>,
  index: (column: number, row: number) => number,
  inside: (column: number, row: number) => boolean,
  columns: number,
): Set<number> {
  const rockCells = new Set<number>(rocks.map((solid) => index(solid.x / TILE, solid.y / TILE)));
  const seen = new Set<number>();
  const result = new Set<number>();

  for (const start of rockCells) {
    if (seen.has(start)) {
      continue;
    }

    const cluster: number[] = [];
    const queue = [start];
    let exposed = false;
    seen.add(start);

    while (queue.length) {
      const cell = queue.pop() as number;
      cluster.push(cell);
      const column = cell % columns;
      const row = Math.floor(cell / columns);

      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = column + dc;
        const r = row + dr;

        if (!inside(c, r)) {
          continue;
        }

        const next = index(c, r);

        if (!anything.has(next)) {
          exposed = true;
        } else if (rockCells.has(next) && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }

    if (!exposed) {
      for (const cell of cluster) {
        result.add(cell);
      }
    }
  }

  return result;
}

/**
 * How dark a point this far from the nearest air is.
 *
 * Nothing until `start`, then a smooth ramp to `max` at `full`. Smoothstep
 * rather than linear, so the lit band has a soft underside instead of a
 * visible line where the fade begins.
 */
function shadeFor(distance: number): number {
  const { start, full, max } = GROUND_SHADE;

  if (distance <= start) {
    return 0;
  }

  if (distance >= full) {
    return max;
  }

  const t = (distance - start) / (full - start);

  return max * t * t * (3 - 2 * t);
}
