import Phaser from 'phaser';
import { TILE } from '../config';
import type { TilePalette } from './tiles';

/**
 * Rounding the ground off at its corners.
 *
 * A tile is a square, and a floor made of squares has square corners at
 * every edge and every waterline, which is most of what makes it read as a
 * grid. Two things fix that, both worked out from the level's own shape:
 *
 * - a **convex** corner -- a ground tile with air on two adjacent sides -- is
 *   cut round, with the grass or the dark earth following the curve. Done
 *   pixel by pixel on a copy of the baked tile, so the edge stays crisp;
 * - a **concave** corner -- where a floor meets a wall, or the bottom of a
 *   pool meets its side -- is filled with a quarter-disc of earth, grass
 *   along its curve, drawn into the air cell.
 *
 * Both are pictures only. Collision is still the square tile underneath.
 */

/** The radius of a convex corner's rounding, px. */
export const CORNER_RADIUS = 6;

/**
 * The radius of a concave corner's fillet, px. Larger than the convex one:
 * a fillet is mostly earth with grass along its curve, and at six pixels
 * the grass was all there was of it.
 */
export const FILLET_RADIUS = 9;

export interface Corners {
  tl: boolean;
  tr: boolean;
  bl: boolean;
  br: boolean;
}

/**
 * A copy of `baseKey` with the given corners cut round, cached by shape.
 * Returns the key to draw.
 */
export function roundedTileKey(
  scene: Phaser.Scene,
  baseKey: string,
  corners: Corners,
  palette: TilePalette,
): string {
  const key = `${baseKey}:round-${corners.tl ? 1 : 0}${corners.tr ? 1 : 0}${corners.bl ? 1 : 0}${corners.br ? 1 : 0}`;

  if (scene.textures.exists(key)) {
    return key;
  }

  const source = scene.textures.get(baseKey).getSourceImage() as CanvasImageSource;
  const canvas = scene.textures.createCanvas(key, TILE, TILE) as Phaser.Textures.CanvasTexture;
  const ctx = canvas.context;

  ctx.drawImage(source, 0, 0);
  const image = ctx.getImageData(0, 0, TILE, TILE);
  const r = CORNER_RADIUS;
  const grass = Phaser.Display.Color.IntegerToRGB(palette.grass);
  const grassDark = Phaser.Display.Color.IntegerToRGB(palette.grassDark);
  const earthDark = Phaser.Display.Color.IntegerToRGB(palette.dirtDark);

  const cut = (cornerX: number, cornerY: number, top: boolean): void => {
    // The circle's centre sits `r` in from the corner on both axes.
    const cx = cornerX === 0 ? r : TILE - r;
    const cy = cornerY === 0 ? r : TILE - r;

    for (let y = cornerY; y < cornerY + r; y += 1) {
      for (let x = cornerX; x < cornerX + r; x += 1) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        const i = (y * TILE + x) * 4;

        if (d > r) {
          image.data[i + 3] = 0;
        } else if (d > r - 1.2) {
          const c = top ? grass : earthDark;
          image.data[i] = c.r;
          image.data[i + 1] = c.g;
          image.data[i + 2] = c.b;
        } else if (top && d > r - 2.4) {
          image.data[i] = grassDark.r;
          image.data[i + 1] = grassDark.g;
          image.data[i + 2] = grassDark.b;
        }
      }
    }
  };

  if (corners.tl) cut(0, 0, true);
  if (corners.tr) cut(TILE - r, 0, true);
  if (corners.bl) cut(0, TILE - r, false);
  if (corners.br) cut(TILE - r, TILE - r, false);

  ctx.putImageData(image, 0, 0);
  canvas.refresh();

  return key;
}

/**
 * The quarter-disc of earth that fills an inner corner: drawn for the
 * bottom-left of an air cell that has ground to its left and below, and
 * flipped for the other three corners. Grass along the curve, since that
 * curve is a surface.
 */
export function bakeFillet(scene: Phaser.Scene, key: string, palette: TilePalette): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const r = FILLET_RADIUS;
  const canvas = scene.textures.createCanvas(key, r, r) as Phaser.Textures.CanvasTexture;
  const ctx = canvas.context;
  const image = ctx.createImageData(r, r);
  const earth = Phaser.Display.Color.IntegerToRGB(palette.dirt);
  const earthLip = Phaser.Display.Color.IntegerToRGB(
    Phaser.Display.Color.ValueToColor(palette.dirt).lighten(10).color,
  );
  const grass = Phaser.Display.Color.IntegerToRGB(palette.grass);
  const grassDark = Phaser.Display.Color.IntegerToRGB(palette.grassDark);

  // The circle's centre is the top-right corner of this square; the inner
  // corner of the ground is its bottom-left. Earth is everything outside the
  // circle.
  for (let y = 0; y < r; y += 1) {
    for (let x = 0; x < r; x += 1) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5);
      const i = (y * r + x) * 4;

      if (d <= r) {
        continue;
      }

      const c = d < r + 1 ? grass : d < r + 2 ? grassDark : d < r + 3.5 ? earthLip : earth;
      image.data[i] = c.r;
      image.data[i + 1] = c.g;
      image.data[i + 2] = c.b;
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  canvas.refresh();
}
