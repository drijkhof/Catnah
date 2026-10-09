import Phaser from 'phaser';
import { TILE } from '../config';
import { bakeTexture, createRandom } from './canvas';
import { shade } from './tiles';
import type { TilePalette } from './tiles';

/** How far a palm's trunk flares past its cells at the foot, px, each side. */
export const PALM_BULGE = 2;

/**
 * A palm's trunk, baked as one picture for a column of `T` cells -- or two
 * columns side by side, which is one **big** palm rather than two thin ones
 * standing together. A trunk is `columns` cells wide at the foot and tapers
 * toward the top, flares into a boss of roots at the base, and is ringed
 * with the scars old fronds leave, a light band over a dark line every few
 * pixels, slightly uneven. The crown goes on separately, scaled to the
 * trunk.
 */
export function bakePalmTrunk(
  scene: Phaser.Scene,
  key: string,
  columns: number,
  cells: number,
  palette: TilePalette,
  seed: number,
): void {
  const width = columns * TILE + PALM_BULGE * 2;
  const height = cells * TILE;
  const random = createRandom(seed);
  const centre = width / 2;
  const footWidth = columns * TILE;
  const topWidth = columns === 1 ? 9 : 18;
  const dark = shade(palette.trunkDark, 18);

  bakeTexture(scene, key, width, height, (g) => {
    // Half-width at each row: foot to top, with a slight bow one way.
    const bow = (random() - 0.5) * (columns === 1 ? 3 : 5);
    const half = (y: number): number => {
      const t = y / height;
      return (topWidth + (footWidth - topWidth) * t) / 2;
    };
    const mid = (y: number): number => centre + Math.sin((y / height) * Math.PI) * bow;

    // Silhouette in the dark bark, then the lit side.
    for (let y = 0; y < height; y += 1) {
      const h = half(y);
      const m = mid(y);
      g.fillStyle(dark, 1);
      g.fillRect(Math.round(m - h), y, Math.round(h * 2), 1);
      g.fillStyle(palette.trunk, 1);
      g.fillRect(Math.round(m - h) + 1, y, Math.round(h * 2) - 2, 1);
      g.fillStyle(palette.trunkLight, 1);
      g.fillRect(Math.round(m - h) + 1, y, Math.max(1, Math.round(h * 0.6)), 1);
    }

    // The rings: the scars of fallen fronds, every few pixels, uneven.
    for (let y = 5; y < height - 4; y += 5 + Math.floor(random() * 3)) {
      const h = half(y);
      const m = mid(y);
      g.fillStyle(dark, 1);
      g.fillRect(Math.round(m - h) + 1, y, Math.round(h * 2) - 2, 1);
      g.fillStyle(palette.trunkLight, 1);
      g.fillRect(Math.round(m - h) + 2, y - 1, Math.round(h * 2) - 4, 1);
    }

    // The foot: a boss of roots, wider than the trunk, dark underneath.
    const footHeight = Math.min(8, height);
    g.fillStyle(dark, 1);
    g.fillRoundedRect(0, height - footHeight, width, footHeight, { tl: 5, tr: 5, bl: 0, br: 0 });
    g.fillStyle(palette.trunk, 1);
    g.fillRoundedRect(1, height - footHeight + 1, width - 2, footHeight - 2, { tl: 4, tr: 4, bl: 0, br: 0 });
    g.fillStyle(palette.trunkLight, 1);
    g.fillRect(2, height - footHeight + 1, Math.round(width * 0.4), 1);
  });
}
