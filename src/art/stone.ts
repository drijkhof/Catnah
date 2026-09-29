import Phaser from 'phaser';
import { TILE } from '../config';
import { createRandom } from './canvas';
import type { TilePalette } from './tiles';

/**
 * One stone of a fitted-stone mass, in cells: it starts at cell (column,
 * row) and runs `cells` wide. `exposed` says which of its sides meet air.
 * `top` is the walking surface -- a stone in the course that the cat walks
 * on, which is drawn broader, paler, and lit along its top face.
 */
export interface Stone {
  column: number;
  row: number;
  cells: number;
  exposed: { up: boolean; down: boolean; left: boolean; right: boolean };
  top: boolean;
}

/**
 * Draws a mass of fitted stone, stone by stone, into a Graphics object.
 *
 * The mass has no edge of its own: its silhouette is the outline of the
 * stones along it. Every stone is a polygon -- its rectangle with each
 * corner nudged a few pixels, outward on a side that meets air, inward
 * where it meets another stone (that gap is the mortar) -- and some corners
 * are cut. Stones are lit from above-left; a stone in the walking course
 * has a broad pale top face, like a flat stone catching the light.
 */
export function drawStoneMass(g: Phaser.GameObjects.Graphics, stones: Stone[], palette: TilePalette): void {
  const random = createRandom(9241);
  const mortar = shade(palette.rockDark, 12);
  const rim = shade(palette.rockDark, 30);
  const tones = [shade(palette.rock, 8), shade(palette.rock, 16), palette.rock, shade(palette.rock, 12)];
  const topTones = [lighten(palette.rock, 8), lighten(palette.rock, 3), lighten(palette.rock, 12)];

  // Mortar behind everything, inset from the faces that meet air so it never
  // shows past the stones.
  g.fillStyle(mortar, 1);
  for (const stone of stones) {
    const x = stone.column * TILE;
    const y = stone.row * TILE;
    const w = stone.cells * TILE;
    const inL = stone.exposed.left ? 3 : 0;
    const inR = stone.exposed.right ? 3 : 0;
    const inT = stone.exposed.up ? 3 : 0;
    const inB = stone.exposed.down ? 3 : 0;
    g.fillRect(x + inL, y + inT, w - inL - inR, TILE - inT - inB);
  }

  for (const stone of stones) {
    const x0 = stone.column * TILE;
    const y0 = stone.row * TILE;
    const x1 = x0 + stone.cells * TILE;
    const y1 = y0 + TILE;
    const { up, down, left, right } = stone.exposed;

    // A corner's nudge: out past the cell where the side meets air, in a
    // little where it meets mortar.
    const out = (): number => 1 + Math.floor(random() * 3);
    const gap = (): number => 1 + Math.floor(random() * 2);
    const nx = (side: boolean): number => (side ? out() : -gap());
    const corners: Array<[number, number]> = [
      [x0 - nx(left), y0 - nx(up)],
      [x1 + nx(right), y0 - nx(up)],
      [x1 + nx(right), y1 + nx(down)],
      [x0 - nx(left), y1 + nx(down)],
    ];

    // Some corners cut, which adds a vertex; only ever a third of the
    // shorter side, so the shape stays simple.
    const poly: Phaser.Math.Vector2[] = [];
    corners.forEach(([cx, cy], i) => {
      const [nxp, nyp] = corners[(i + 1) % 4];
      const [pxp, pyp] = corners[(i + 3) % 4];
      const toNext = Math.hypot(nxp - cx, nyp - cy) || 1;
      const toPrev = Math.hypot(pxp - cx, pyp - cy) || 1;
      if (random() < 0.4) {
        const cut = Math.min(2 + random() * 4, Math.min(toNext, toPrev) / 3);
        poly.push(new Phaser.Math.Vector2(cx + ((pxp - cx) / toPrev) * cut, cy + ((pyp - cy) / toPrev) * cut));
        poly.push(new Phaser.Math.Vector2(cx + ((nxp - cx) / toNext) * cut, cy + ((nyp - cy) / toNext) * cut));
      } else {
        poly.push(new Phaser.Math.Vector2(cx, cy));
      }
    });

    const tone = stone.top ? topTones[Math.floor(random() * topTones.length)] : tones[Math.floor(random() * tones.length)];
    const lit = lighten(tone, 9);
    const dark = shade(tone, 16);

    // A rim round the whole stone, then the face, lit along the top-left.
    g.fillStyle(rim, 1);
    g.fillPoints(inset(poly, -1, 0, 0), true);
    g.fillStyle(dark, 1);
    g.fillPoints(poly, true);
    g.fillStyle(lit, 1);
    g.fillPoints(inset(poly, 1, -1, -1), true);
    g.fillStyle(tone, 1);
    g.fillPoints(inset(poly, 2, 0, 0), true);

    if (stone.top && up) {
      // The walking surface: a broad pale band along the top face, following
      // the stone's own top edge -- the stone drawn again, then its face
      // drawn lower, so the band between is what shows.
      g.fillStyle(palette.rockLight, 1);
      g.fillPoints(inset(poly, 1, 0, 0), true);
      g.fillStyle(tone, 1);
      g.fillPoints(inset(poly, 2, 0, 4), true);
    }

    // A crack, on the bigger stones.
    if (stone.cells >= 2 && random() < 0.6) {
      let cx = x0 + 6 + Math.floor(random() * (stone.cells * TILE - 12));
      let cy = y0 + 3 + Math.floor(random() * 4);
      g.fillStyle(dark, 1);
      for (let t = 0; t < 4 + Math.floor(random() * 4); t += 1) {
        g.fillRect(cx, cy, 1, 1);
        cx += random() < 0.5 ? -1 : 1;
        cy += 1;
        if (cy > y1 - 4) break;
      }
    }
  }
}

/** The polygon moved `by` px toward its centre (negative: outward), then shifted. */
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
