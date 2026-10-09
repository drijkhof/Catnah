import Phaser from 'phaser';
import { TILE } from '../config';
import { bakeTexture, createRandom } from './canvas';

/** Room above a castle's top row for the flags on its towers, px. */
export const CASTLE_FLAG_HEADROOM = 16;

/** One cell of a castle, in cells from the castle's top-left corner. */
export interface CastleCell {
  column: number;
  row: number;
  /** A gate cell: `Q` in the map. Drawn as an arched doorway, still solid. */
  gate: boolean;
}

const SAND = 0xdcbf7e;
const SAND_LIGHT = 0xf1dca4;
const SAND_DARK = 0xa8894f;
const SAND_DEEP = 0x7c6338;
const DOOR = 0x4a3620;
const POLE = 0x6b4a2a;
const PENNANT = 0xd8352b;

/**
 * A sand castle, baked as one picture.
 *
 * The cells are a cluster of `R`/`G`/`Q` from the map, any shape. It is
 * drawn as one mass of pressed sand: a cell's edge is only drawn where no
 * other cell is beside it, so the inside is seamless and the outline is the
 * castle's own silhouette. Along the top -- every cell with sky above it --
 * the sand is cut into battlements, two merlons and a notch per cell. Each
 * **tower**, a run of two or more top cells side by side, flies a flag from
 * its middle; a single top cell is a merlon on a wall and gets none. The
 * texture has `CASTLE_FLAG_HEADROOM` above the top row for the flags.
 *
 * `Q` cells are the gate: an arched doorway, dark inside, drawn over the
 * bounding box of each connected run of them. They are as solid as the
 * rest; the arch is a picture, and the castle is still a wall.
 */
export function bakeSandCastle(
  scene: Phaser.Scene,
  key: string,
  cells: CastleCell[],
  wide: number,
  high: number,
  seed: number,
): void {
  const width = wide * TILE;
  const height = high * TILE + CASTLE_FLAG_HEADROOM;
  const top = CASTLE_FLAG_HEADROOM;
  const random = createRandom(seed);
  const has = new Set(cells.map((cell) => `${cell.column},${cell.row}`));
  const at = (column: number, row: number): boolean => has.has(`${column},${row}`);

  bakeTexture(scene, key, width, height, (g) => {
    // The mass. A top cell is filled below its battlement line, plus the two
    // merlons; the notch between them is simply never painted.
    for (const cell of cells) {
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      g.fillStyle(SAND, 1);
      if (at(cell.column, cell.row - 1)) {
        g.fillRect(x, y, TILE, TILE);
      } else {
        g.fillRect(x, y + 5, TILE, TILE - 5);
        g.fillRect(x, y, 5, 5);
        g.fillRect(x + 11, y, 5, 5);
      }
    }

    // Grains, all over, so the blocks read as sand rather than as paint.
    for (const cell of cells) {
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      for (let i = 0; i < 7; i += 1) {
        g.fillStyle(i % 2 ? SAND_LIGHT : SAND_DARK, 0.75);
        g.fillRect(x + 1 + Math.floor(random() * 14), y + 6 + Math.floor(random() * 9), 1, 1);
      }
    }

    // Edges, only where the castle meets air: light where the sun is (top
    // and left), dark in the shade (right and bottom). A top cell's edge
    // follows its merlons and the notch between them.
    for (const cell of cells) {
      const x = cell.column * TILE;
      const y = top + cell.row * TILE;
      const open = {
        up: !at(cell.column, cell.row - 1),
        down: !at(cell.column, cell.row + 1),
        left: !at(cell.column - 1, cell.row),
        right: !at(cell.column + 1, cell.row),
      };
      if (open.up) {
        g.fillStyle(SAND_LIGHT, 1);
        g.fillRect(x, y, 5, 1);
        g.fillRect(x + 11, y, 5, 1);
        g.fillRect(x + 5, y + 5, 6, 1);
        g.fillStyle(SAND_DARK, 1);
        g.fillRect(x + 4, y, 1, 5);
        g.fillRect(x + 11, y, 1, 5);
      }
      if (open.left) {
        g.fillStyle(SAND_LIGHT, 1);
        g.fillRect(x, y, 1, TILE);
      }
      if (open.right) {
        g.fillStyle(SAND_DARK, 1);
        g.fillRect(x + TILE - 1, y, 1, TILE);
      }
      if (open.down) {
        g.fillStyle(SAND_DEEP, 1);
        g.fillRect(x, y + TILE - 1, TILE, 1);
      }
      // A shade line under a lip: where this cell has air to its left or
      // right *and* a cell below, the block above the drop casts a little.
      if (!open.down && open.up) {
        g.fillStyle(SAND_DARK, 0.5);
        g.fillRect(x + 5, y + 6, 6, 1);
      }
    }

    // Gates: each connected run of gate cells is one arched doorway over
    // its bounding box, a dark opening with a pale rim of sand round it.
    const gates = cells.filter((cell) => cell.gate);
    const seen = new Set<string>();
    for (const start of gates) {
      const startKey = `${start.column},${start.row}`;
      if (seen.has(startKey)) {
        continue;
      }
      const run: CastleCell[] = [];
      const queue = [start];
      seen.add(startKey);
      while (queue.length > 0) {
        const cell = queue.pop() as CastleCell;
        run.push(cell);
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const next = gates.find((other) => other.column === cell.column + dc && other.row === cell.row + dr);
          const nextKey = next ? `${next.column},${next.row}` : '';
          if (next && !seen.has(nextKey)) {
            seen.add(nextKey);
            queue.push(next);
          }
        }
      }
      const left = Math.min(...run.map((cell) => cell.column)) * TILE;
      const right = (Math.max(...run.map((cell) => cell.column)) + 1) * TILE;
      const above = top + Math.min(...run.map((cell) => cell.row)) * TILE;
      const below = top + (Math.max(...run.map((cell) => cell.row)) + 1) * TILE;
      const w = right - left - 4;
      const h = below - above - 2;
      const radius = Math.min(w / 2, 10);
      g.fillStyle(SAND_LIGHT, 1);
      g.fillRoundedRect(left + 1, above + 1, w + 2, h + 1, { tl: radius + 1, tr: radius + 1, bl: 0, br: 0 });
      g.fillStyle(DOOR, 1);
      g.fillRoundedRect(left + 2, above + 2, w, h, { tl: radius, tr: radius, bl: 0, br: 0 });
      // The doorstep, and a glint of sand at the top of the arch.
      g.fillStyle(SAND_DARK, 1);
      g.fillRect(left + 2, below - 2, w, 1);
    }

    // Flags on the towers.
    const tops = cells
      .filter((cell) => !at(cell.column, cell.row - 1))
      .sort((a, b) => a.row - b.row || a.column - b.column);
    let i = 0;
    while (i < tops.length) {
      let count = 1;
      while (i + count < tops.length && tops[i + count].row === tops[i].row && tops[i + count].column === tops[i].column + count) {
        count += 1;
      }
      if (count >= 2) {
        const fx = Math.round((tops[i].column + count / 2) * TILE) - 1;
        const fy = top + tops[i].row * TILE;
        g.fillStyle(POLE, 1);
        g.fillRect(fx, fy - 14, 1, 14);
        g.fillStyle(PENNANT, 1);
        g.fillTriangle(fx + 1, fy - 14, fx + 9, fy - 11, fx + 1, fy - 8);
        g.fillStyle(SAND_LIGHT, 1);
        g.fillRect(fx + 1, fy - 12, 3, 1);
      }
      i += count;
    }
  });
}
