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

  // Full cells only. A branch is a bar of wood with air on both sides of it,
  // and water is not ground.
  const full = new Set<number>();
  const index = (column: number, row: number): number => row * columns + column;

  for (const solid of solids) {
    if (!solid.isBranch && solid.width === TILE && solid.height === TILE) {
      full.add(index(solid.x / TILE, solid.y / TILE));
    }
  }

  // Outside the level counts as solid: the bottom rows go fully dark rather
  // than being lit from below by nothing.
  const isAir = (column: number, row: number): boolean =>
    column >= 0 && row >= 0 && column < columns && row < rows && !full.has(index(column, row));

  const CELL = 4;
  const cellsPerSide = TILE / CELL;
  const reach = Math.ceil(GROUND_SHADE.full / TILE) + 1;
  const cache = new Map<string, string>();

  for (const solid of solids) {
    if (solid.isBranch || solid.width !== TILE || solid.height !== TILE) {
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

    const pattern = alphas.map((alpha) => Math.round(alpha * 32)).join(',');
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
