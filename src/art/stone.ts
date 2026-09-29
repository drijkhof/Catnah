import Phaser from 'phaser';
import { TILE } from '../config';
import { createRandom } from './canvas';
import type { TilePalette } from './tiles';

/** The packing grid: half a cell, so stones can be small as well as big. */
const SUB = TILE / 2;

/** One stone of a fitted-stone mass, in px. `exposed` says which sides meet air. */
export interface Stone {
  x: number;
  y: number;
  w: number;
  h: number;
  exposed: { up: boolean; down: boolean; left: boolean; right: boolean };
  /** In the course the cat walks on: air above, on a ground-top cell. */
  top: boolean;
}

/**
 * Packs a mass of ground cells with stones of many sizes.
 *
 * Works on a grid of half-cells. Walking it top to bottom, left to right,
 * each free half-cell of ground starts a stone: a rectangle of random size,
 * one to six half-cells wide and one to four tall, shrunk until every
 * half-cell in it is ground and free. Big stones first come out big, and
 * what is left between them comes out as small ones -- which is what a real
 * wall of fitted stone looks like. A stone never crosses into air, so the
 * mass's silhouette is the outline of its stones.
 *
 * @param isGround whether the cell at (column, row) is ground.
 * @param isTop whether that cell is the top of the ground (grass-top).
 */
export function packStones(
  columns: number,
  rows: number,
  isGround: (column: number, row: number) => boolean,
  isTop: (column: number, row: number) => boolean,
  seed: number,
): Stone[] {
  const random = createRandom(seed);
  const W = columns * 2;
  const H = rows * 2;
  const free = new Uint8Array(W * H);
  const groundAt = (sx: number, sy: number): boolean =>
    sx >= 0 && sy >= 0 && sx < W && sy < H && isGround(Math.floor(sx / 2), Math.floor(sy / 2));

  for (let sy = 0; sy < H; sy += 1) {
    for (let sx = 0; sx < W; sx += 1) {
      free[sy * W + sx] = groundAt(sx, sy) ? 1 : 0;
    }
  }

  const stones: Stone[] = [];
  const fits = (sx: number, sy: number, w: number, h: number): boolean => {
    for (let y = sy; y < sy + h; y += 1) {
      for (let x = sx; x < sx + w; x += 1) {
        if (x >= W || y >= H || !free[y * W + x]) {
          return false;
        }
      }
    }
    return true;
  };

  for (let sy = 0; sy < H; sy += 1) {
    for (let sx = 0; sx < W; sx += 1) {
      if (!free[sy * W + sx]) {
        continue;
      }

      // Big or small: mostly two to four half-cells wide, sometimes six,
      // sometimes one; one to three tall, the odd four.
      const roll = random();
      let w = roll < 0.15 ? 1 : roll < 0.75 ? 2 + Math.floor(random() * 3) : 5 + Math.floor(random() * 2);
      let h = random() < 0.2 ? 1 : random() < 0.8 ? 2 : 3 + Math.floor(random() * 2);
      while (w > 1 && !fits(sx, sy, w, h)) w -= 1;
      while (h > 1 && !fits(sx, sy, w, h)) h -= 1;

      for (let y = sy; y < sy + h; y += 1) {
        for (let x = sx; x < sx + w; x += 1) {
          free[y * W + x] = 0;
        }
      }

      const airLeft = Array.from({ length: h }, (_, i) => !groundAt(sx - 1, sy + i)).some(Boolean);
      const airRight = Array.from({ length: h }, (_, i) => !groundAt(sx + w, sy + i)).some(Boolean);
      const airUp = Array.from({ length: w }, (_, i) => !groundAt(sx + i, sy - 1)).some(Boolean);
      const airDown = Array.from({ length: w }, (_, i) => !groundAt(sx + i, sy + h)).some(Boolean);

      stones.push({
        x: sx * SUB,
        y: sy * SUB,
        w: w * SUB,
        h: h * SUB,
        exposed: { up: airUp, down: airDown, left: airLeft, right: airRight },
        top: airUp && isTop(Math.floor(sx / 2), Math.floor(sy / 2)),
      });
    }
  }

  return stones;
}

/**
 * Draws a packed mass of stone into a Graphics object.
 *
 * Every stone is a polygon: its rectangle with each corner nudged, outward
 * on a side that meets air, inward where it meets another stone (that gap
 * is the mortar), and many corners cut, deeply on the bigger stones, so the
 * shapes are angular rather than rectangular. Lit from above-left. On the
 * walking course, a pebble now and then; in the inner corners of the mass,
 * where a floor meets a wall, a little dust.
 */
export function drawStoneMass(
  g: Phaser.GameObjects.Graphics,
  stones: Stone[],
  corners: Array<{ x: number; y: number; side: 1 | -1 }>,
  palette: TilePalette,
): void {
  const random = createRandom(9241);
  const mortar = shade(palette.rockDark, 12);
  const rim = shade(palette.rockDark, 30);
  const tones = [shade(palette.rock, 8), shade(palette.rock, 16), palette.rock, shade(palette.rock, 12), lighten(palette.rock, 4)];

  // Mortar behind everything, inset from the faces that meet air so it never
  // shows past the stones.
  g.fillStyle(mortar, 1);
  for (const s of stones) {
    const inL = s.exposed.left ? 3 : 0;
    const inR = s.exposed.right ? 3 : 0;
    const inT = s.exposed.up ? 3 : 0;
    const inB = s.exposed.down ? 3 : 0;
    g.fillRect(s.x + inL, s.y + inT, s.w - inL - inR, s.h - inT - inB);
  }

  for (const s of stones) {
    const { up, down, left, right } = s.exposed;
    const out = (): number => 1 + Math.floor(random() * 3);
    const gap = (): number => 1 + Math.floor(random() * 2);
    const nudge = (side: boolean): number => (side ? out() : -gap());
    const x0 = s.x;
    const y0 = s.y;
    const x1 = s.x + s.w;
    const y1 = s.y + s.h;
    const corners4: Array<[number, number]> = [
      [x0 - nudge(left), y0 - nudge(up)],
      [x1 + nudge(right), y0 - nudge(up)],
      [x1 + nudge(right), y1 + nudge(down)],
      [x0 - nudge(left), y1 + nudge(down)],
    ];

    // Corners cut: often, and up to two fifths of the shorter side on a big
    // stone, so it reads as a lump of rock rather than a brick.
    const poly: Phaser.Math.Vector2[] = [];
    const big = s.w >= 24 && s.h >= 16;
    corners4.forEach(([cx, cy], i) => {
      const [nxp, nyp] = corners4[(i + 1) % 4];
      const [pxp, pyp] = corners4[(i + 3) % 4];
      const toNext = Math.hypot(nxp - cx, nyp - cy) || 1;
      const toPrev = Math.hypot(pxp - cx, pyp - cy) || 1;
      if (random() < (big ? 0.7 : 0.45)) {
        const cut = Math.min(2 + random() * (big ? 6 : 3), Math.min(toNext, toPrev) * (big ? 0.4 : 0.33));
        poly.push(new Phaser.Math.Vector2(cx + ((pxp - cx) / toPrev) * cut, cy + ((pyp - cy) / toPrev) * cut));
        poly.push(new Phaser.Math.Vector2(cx + ((nxp - cx) / toNext) * cut, cy + ((nyp - cy) / toNext) * cut));
      } else {
        poly.push(new Phaser.Math.Vector2(cx, cy));
      }
    });

    const tone = tones[Math.floor(random() * tones.length)];
    const lit = lighten(tone, 9);
    const dark = shade(tone, 16);

    g.fillStyle(rim, 1);
    g.fillPoints(inset(poly, -1, 0, 0), true);
    g.fillStyle(dark, 1);
    g.fillPoints(poly, true);
    g.fillStyle(lit, 1);
    g.fillPoints(inset(poly, 1, -1, -1), true);
    g.fillStyle(tone, 1);
    g.fillPoints(inset(poly, 2, 0, 0), true);

    // A crack on the bigger stones.
    if (big && random() < 0.6) {
      let cx = x0 + 5 + Math.floor(random() * (s.w - 10));
      let cy = y0 + 3 + Math.floor(random() * 4);
      g.fillStyle(dark, 1);
      for (let t = 0; t < 4 + Math.floor(random() * 5); t += 1) {
        g.fillRect(cx, cy, 1, 1);
        cx += random() < 0.5 ? -1 : 1;
        cy += 1;
        if (cy > y1 - 4) break;
      }
    }

    // A pebble or two on the walking course, now and then.
    if (s.top && random() < 0.3) {
      const px = x0 + 2 + Math.floor(random() * Math.max(1, s.w - 5));
      const py = Math.min(corners4[0][1], corners4[1][1]) - 2;
      g.fillStyle(palette.rockLight, 1);
      g.fillRect(px, py, 2, 1);
      g.fillStyle(dark, 1);
      g.fillRect(px, py + 1, 2, 1);
    }
  }

  // Dust in the inner corners: a little wedge of pale grey where a floor
  // meets a wall, on the floor, against the wall.
  g.fillStyle(palette.grass, 1);
  for (const corner of corners) {
    if (random() > 0.55) {
      continue;
    }
    // `side` 1: the wall is to the right of the corner, -1: to the left.
    const d = corner.side;
    g.fillRect(corner.x - (d > 0 ? 5 : 0), corner.y - 1, 5, 1);
    g.fillRect(corner.x - (d > 0 ? 3 : 0), corner.y - 2, 3, 1);
    g.fillRect(corner.x - (d > 0 ? 1 : 0), corner.y - 3, 1, 1);
  }
}

function inset(poly: Phaser.Math.Vector2[], by: number, dx: number, dy: number): Phaser.Math.Vector2[] {
  const cx = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
  const cy = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
  return poly.map((p) => {
    const vx = p.x - cx;
    const vy = p.y - cy;
    const len = Math.hypot(vx, vy) || 1;
    return new Phaser.Math.Vector2(cx + vx - (vx / len) * by + dx, cy + vy - (vy / len) * by + dy);
  });
}

function shade(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).darken(amount).color;
}

function lighten(colour: number, amount: number): number {
  return Phaser.Display.Color.ValueToColor(colour).lighten(amount).color;
}
