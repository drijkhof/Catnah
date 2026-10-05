import Phaser from 'phaser';
import { LAVA, TILE } from '../config';
import { bakeTexture, createRandom } from './canvas';
import type { TilePalette } from './tiles';
import type { WaterZone } from '../level/Level';

/**
 * A lake of lava: one connected group of `L` cells, drawn as one picture.
 *
 * Drawn per tile, lava is a repeat of the same sixteen pixels and reads as a
 * grid of orange blocks. Drawn per lake -- the way a run of rock cells is one
 * boulder -- it can have features bigger than a tile: a crust that heaps up
 * across the whole width, plates and lumps scattered rather than striped,
 * veins that wander the length of it, bubbles where the lake decides.
 */
export interface LavaPool {
  /** World position of the pool's top-left cell. */
  x: number;
  y: number;
  /** Size in cells. */
  cols: number;
  rows: number;
  /** The cells that are lava, as `c,r` relative to the top-left. Not every cell of the box is. */
  cells: Set<string>;
}

/** Frames one lake cycles through. */
export const POOL_FRAMES = 8;

/**
 * Room above the top row of cells for the lava to heap up into: the surface's
 * rise, plus a little dome on top of that. The pool's picture is placed this
 * much above its top cell.
 */
export const POOL_HEADROOM = LAVA.rise + 3;

/** Groups lava cells into connected pools (four-connected). */
export function groupLavaPools(zones: WaterZone[]): LavaPool[] {
  const key = (x: number, y: number): string => `${x},${y}`;
  const unvisited = new Map<string, WaterZone>();
  for (const zone of zones) {
    unvisited.set(key(zone.x, zone.y), zone);
  }

  const pools: LavaPool[] = [];
  while (unvisited.size > 0) {
    const [first] = unvisited.values();
    const members: WaterZone[] = [];
    const stack = [first];
    unvisited.delete(key(first.x, first.y));
    while (stack.length > 0) {
      const zone = stack.pop() as WaterZone;
      members.push(zone);
      for (const [dx, dy] of [[TILE, 0], [-TILE, 0], [0, TILE], [0, -TILE]]) {
        const next = unvisited.get(key(zone.x + dx, zone.y + dy));
        if (next) {
          unvisited.delete(key(next.x, next.y));
          stack.push(next);
        }
      }
    }

    const minX = Math.min(...members.map((m) => m.x));
    const minY = Math.min(...members.map((m) => m.y));
    const maxX = Math.max(...members.map((m) => m.x));
    const maxY = Math.max(...members.map((m) => m.y));
    const cells = new Set(members.map((m) => `${(m.x - minX) / TILE},${(m.y - minY) / TILE}`));
    pools.push({ x: minX, y: minY, cols: (maxX - minX) / TILE + 1, rows: (maxY - minY) / TILE + 1, cells });
  }
  return pools;
}

function shade(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).darken(amount).color;
}

function lighten(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).lighten(amount).color;
}

/**
 * Bakes one frame of one pool.
 *
 * Everything that varies between frames is driven by `frame` alone; the
 * layout of the features comes from `seed`, drawn the same way for every
 * frame, so the plates, lumps and bubbles of a pool stay where they are
 * between frames and only *move* the way they are meant to.
 */
export function bakeLavaPool(
  scene: Phaser.Scene,
  key: string,
  pool: LavaPool,
  palette: TilePalette,
  frame: number,
  seed: number,
): void {
  const { cols, rows, cells } = pool;
  const W = cols * TILE;
  const H = rows * TILE + POOL_HEADROOM;
  const HEAD = POOL_HEADROOM;
  const random = createRandom(seed);

  const lava = palette.lava;
  const lavaMid = lighten(lava, 14);
  const lavaDim = shade(lava, 16);
  const lavaDeep = palette.lavaDeep;
  const lavaDeeper = shade(lavaDeep, 22);
  const lavaBright = palette.lavaBright;
  const lavaHot = 0xfff0b0;

  const inCell = (c: number, r: number): boolean => cells.has(`${c},${r}`);
  const inPool = (x: number, y: number): boolean => {
    if (x < 0 || x >= W || y < HEAD || y >= H) return false;
    return inCell(Math.floor(x / TILE), Math.floor((y - HEAD) / TILE));
  };

  // The top lava cell of each column, or -1 where the column has none.
  const topRow: number[] = [];
  for (let c = 0; c < cols; c += 1) {
    let top = -1;
    for (let r = 0; r < rows; r += 1) {
      if (inCell(c, r)) {
        top = r;
        break;
      }
    }
    topRow.push(top);
  }

  // The surface line: the top cells' edge, raised by the rise, heaped up a
  // little more in the middle and wavering along its length.
  const wavePhase = random() * Math.PI * 2;
  const surfaceY = (x: number): number => {
    const c = Math.min(cols - 1, Math.max(0, Math.floor(x / TILE)));
    if (topRow[c] < 0) return -1;
    const dome = 2.2 * Math.sin((Math.PI * (x + 0.5)) / W) + 0.8 * Math.sin(x / 7 + wavePhase);
    return HEAD + topRow[c] * TILE - LAVA.rise - Math.max(0, Math.round(dome));
  };

  // Features, laid out once from the seed.
  const lumps = Array.from({ length: Math.max(2, Math.round(W / 9)) }, () => ({ x: random() * W, w: 2 + Math.floor(random() * 2) }));
  const plates = Array.from({ length: Math.max(2, Math.round(W / 11)) }, () => ({
    x: random() * W,
    w: 3 + Math.floor(random() * 4),
    row: 4 + Math.floor(random() * 6),
    h: 2 + Math.floor(random() * 2),
  }));
  const bubbles = Array.from({ length: Math.max(1, Math.round(W / 20)) }, () => ({
    x: 3 + random() * (W - 6),
    down: 9 + random() * 7,
    phase: Math.floor(random() * POOL_FRAMES),
  }));
  const veins = Array.from({ length: 2 + Math.floor(random() * 2) }, () => ({
    at: 0.3 + random() * 0.6,
    amp: 2 + random() * 3,
    period: 9 + random() * 10,
    phase: random() * Math.PI * 2,
  }));
  const darkPlates = Array.from({ length: Math.max(1, Math.round((cols * rows) / 2.5)) }, () => ({
    x: random() * W,
    y: HEAD + 14 + random() * Math.max(1, rows * TILE - 16),
    rx: 4 + random() * 6,
    ry: 2 + random() * 2.5,
  }));
  const specks = Array.from({ length: cols * rows * 3 }, () => ({ x: Math.floor(random() * W), y: HEAD + Math.floor(random() * (rows * TILE)), hot: random() < 0.4 }));

  const flow = frame * 2;

  bakeTexture(scene, key, W, H, (g) => {
    // 1. The body: molten at the top row, darker and cooler the deeper down.
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (!inCell(c, r)) continue;
        const depth = r - topRow[c];
        const y = HEAD + r * TILE;
        if (depth === 0) {
          g.fillStyle(lava, 1);
          g.fillRect(c * TILE, y, TILE, TILE);
          g.fillStyle(lavaDim, 1);
          g.fillRect(c * TILE, y + 11, TILE, 5);
        } else if (depth === 1) {
          g.fillStyle(lavaDim, 1);
          g.fillRect(c * TILE, y, TILE, 4);
          g.fillStyle(lavaDeep, 1);
          g.fillRect(c * TILE, y + 4, TILE, TILE - 4);
        } else {
          g.fillStyle(lavaDeep, 1);
          g.fillRect(c * TILE, y, TILE, TILE);
        }
      }
    }

    // 2. The heap: lava from the surface line down to the top cells' edge.
    g.fillStyle(lava, 1);
    for (let x = 0; x < W; x += 1) {
      const ys = surfaceY(x);
      if (ys < 0) continue;
      const edge = HEAD + topRow[Math.floor(x / TILE)] * TILE;
      g.fillRect(x, ys, 1, edge - ys + 1);
    }

    // 3. Dark cooled plates in the body, each with a hot rim along its top.
    for (const plate of darkPlates) {
      const ok = inPool(plate.x - plate.rx, plate.y) && inPool(plate.x + plate.rx, plate.y) && inPool(plate.x, plate.y - plate.ry) && inPool(plate.x, plate.y + plate.ry);
      if (!ok) continue;
      g.fillStyle(lavaMid, 1);
      g.fillEllipse(plate.x, plate.y - 1, plate.rx * 2, plate.ry * 2);
      g.fillStyle(lavaDeeper, 1);
      g.fillEllipse(plate.x, plate.y, plate.rx * 2, plate.ry * 2);
    }

    // 4. Veins of hot lava wandering the length of the pool, creeping down.
    for (const vein of veins) {
      for (let x = 0; x < W; x += 1) {
        const bodyTop = HEAD;
        const span = rows * TILE;
        const wave = Math.sin(x / vein.period + vein.phase) * vein.amp;
        const y = bodyTop + ((vein.at * span + wave + frame + span) % span);
        const ys = surfaceY(x);
        if (ys < 0 || y < ys + 10 || !inPool(x, y)) continue;
        g.fillStyle(lava, 1);
        g.fillRect(x, Math.round(y), 1, 2);
        if ((x + frame) % 5 === 0) {
          g.fillStyle(lavaMid, 1);
          g.fillRect(x, Math.round(y), 1, 1);
        }
      }
    }

    // 5. Specks of glow, coming and going.
    for (let i = 0; i < specks.length; i += 1) {
      const speck = specks[i];
      if ((i + frame) % 3 === 0 || !inPool(speck.x, speck.y)) continue;
      g.fillStyle(speck.hot ? lavaBright : lavaMid, 0.9);
      g.fillRect(speck.x, speck.y, 1, 1);
    }

    // 6. The surface: a bright crust along the line, white-hot in places.
    for (let x = 0; x < W; x += 1) {
      const ys = surfaceY(x);
      if (ys < 0) continue;
      g.fillStyle(lavaBright, 1);
      g.fillRect(x, ys, 1, 3);
      if ((x + flow) % 9 < 2) {
        g.fillStyle(lavaHot, 1);
        g.fillRect(x, ys, 1, 1);
      }
    }

    // Cooled lumps riding on the rim, drifting at half the flow.
    g.fillStyle(lavaDeep, 0.85);
    for (const lump of lumps) {
      const x = Math.floor((lump.x + flow / 2) % W);
      const ys = surfaceY(x);
      if (ys < 0) continue;
      g.fillRect(x, ys + 2, lump.w, 1);
    }

    // Plates of dark skin just under the crust, drifting with the flow, with
    // a white-hot crack on the side they are pulling away from.
    for (const plate of plates) {
      const x = Math.floor((plate.x + flow) % W);
      const ys = surfaceY(x);
      if (ys < 0 || !inPool(x, ys + plate.row + plate.h) || !inPool(x + plate.w, ys + plate.row)) continue;
      g.fillStyle(lavaDeep, 1);
      g.fillRect(x, ys + plate.row, plate.w, plate.h);
      g.fillStyle(lavaDeeper, 1);
      g.fillRect(x + 1, ys + plate.row + 1, plate.w - 2, 1);
      g.fillStyle(lavaHot, 1);
      g.fillRect(x - 1, ys + plate.row, 1, plate.h);
      g.fillStyle(lavaBright, 1);
      g.fillRect(x + plate.w, ys + plate.row + 1, 1, Math.max(1, plate.h - 1));
    }

    // Bubbles, each on its own clock: swell, then burst in a ring.
    for (const bubble of bubbles) {
      const ys = surfaceY(Math.floor(bubble.x));
      if (ys < 0) continue;
      const t = (frame + bubble.phase) % POOL_FRAMES;
      const by = ys + bubble.down;
      if (t < 6) {
        const r = 0.6 + t * 0.4;
        g.fillStyle(lavaBright, 1);
        g.fillCircle(bubble.x, by - t * 0.3, r);
        g.fillStyle(lavaHot, 0.9);
        g.fillCircle(bubble.x - r * 0.3, by - t * 0.3 - r * 0.3, Math.max(0.5, r * 0.4));
      } else if (t === 6) {
        g.fillStyle(lavaHot, 1);
        g.fillCircle(bubble.x, by - 2, 3.2);
        g.fillStyle(lava, 1);
        g.fillCircle(bubble.x, by - 2, 2);
      }
    }
  });
}
