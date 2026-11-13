import Phaser from 'phaser';
import { fbm, makeNoise, paint } from './noise';

/** The sun's disc, px across: the scene burns the cat a little past its rim. */
export const SPACE_SUN_SIZE = 260;

/** The flames round it, px across: the corona, two layers of it. */
export const SPACE_SUN_CORONA = Math.round(SPACE_SUN_SIZE * 2.3);

/**
 * From cold to hot: dark red, red, orange, yellow, white. Every part of the
 * sun takes its colour from here by how hot it is, 0 to 1.
 */
const HEAT: Array<[number, [number, number, number]]> = [
  [0, [70, 8, 0]],
  [0.25, [200, 60, 8]],
  [0.5, [255, 138, 26]],
  [0.7, [255, 190, 60]],
  [0.85, [255, 226, 140]],
  [1, [255, 251, 236]],
];

function heat(t: number): [number, number, number] {
  const v = Phaser.Math.Clamp(t, 0, 1);
  for (let i = 1; i < HEAT.length; i += 1) {
    const [to, high] = HEAT[i];
    const [from, low] = HEAT[i - 1];
    if (v <= to) {
      const k = (v - from) / (to - from);
      return [low[0] + (high[0] - low[0]) * k, low[1] + (high[1] - low[1]) * k, low[2] + (high[2] - low[2]) * k];
    }
  }
  return HEAT[HEAT.length - 1][1];
}

/**
 * The sun, worked out per pixel, after a photograph of it: a ball of
 * boiling orange with white-hot swirls, brightest round its rim, in a mane
 * of red and yellow flames reaching out.
 *
 * - `space-sun` -- the ball. Swirls are noise pushed about by more noise.
 * - `space-sun-churn` -- just the hottest swirls, on nothing: laid over the
 *   ball twice, added, and turned against each other by the scene, which is
 *   what makes the surface boil.
 * - `space-sun-corona-a` and `-b` -- the flames: noise laid round the
 *   circle, fine round it and coarse outwards, so it streaks outwards like
 *   flames; two of them, turned opposite ways, flicker where they cross.
 * - `space-sun-glow` -- the soft red haze behind everything.
 */
export function generateSun(scene: Phaser.Scene): void {
  const r = SPACE_SUN_SIZE / 2;
  const surface = makeNoise(11);
  const warp = makeNoise(12);
  paint(scene, 'space-sun', SPACE_SUN_SIZE, (x, y) => {
    const d = Math.hypot(x, y) / r;
    if (d > 1) {
      return undefined;
    }
    const u = x / r;
    const v = y / r;
    const q = fbm(warp, u * 2.5 + 7, v * 2.5 + 3, 4);
    const n = fbm(surface, u * 3.2 + q * 2.2, v * 3.2 - q * 2.2, 5);
    // Hotter at the rim, as in the photograph, and the swirls whiter.
    const rim = Phaser.Math.Clamp((d - 0.82) / 0.18, 0, 1);
    // Never darker than deep orange: the photograph's dark patches are
    // only a shade down from the rest.
    const t = Math.max(0.4, 0.56 + (n - 0.5) * 1.4) + rim * rim * 0.45;
    const [red, green, blue] = heat(t);
    const edge = Phaser.Math.Clamp((1 - d) * r, 0, 1);
    return [red, green, blue, 255 * edge];
  });

  const churn = makeNoise(21);
  const churnWarp = makeNoise(22);
  paint(scene, 'space-sun-churn', SPACE_SUN_SIZE, (x, y) => {
    const d = Math.hypot(x, y) / r;
    if (d > 0.98) {
      return undefined;
    }
    const q = fbm(churnWarp, x / r * 2 + 1, y / r * 2 + 5, 3);
    const n = fbm(churn, x / r * 3.5 + q * 2.5, y / r * 3.5 + q * 1.5, 4);
    const strength = Phaser.Math.Clamp((n - 0.5) / 0.22, 0, 1);
    const fade = Phaser.Math.Clamp((0.98 - d) / 0.12, 0, 1);
    return [255, 236, 170, 255 * strength * strength * 0.55 * fade];
  });

  const flames = (key: string, seed: number): void => {
    const streaks = makeNoise(seed);
    const bend = makeNoise(seed + 1);
    const around = 36;
    paint(scene, key, SPACE_SUN_CORONA, (x, y) => {
      const s = Math.hypot(x, y) / r;
      if (s < 0.9) {
        return undefined;
      }
      const a = (Math.atan2(y, x) / (Math.PI * 2) + 0.5) * around;
      // The flames lean and wave: where round the circle they are read
      // from wanders a little with the distance out.
      const lean = (fbm(bend, a * 0.25, s * 1.4, 3, around * 0.25) - 0.5) * 6;
      const n = fbm(streaks, a + lean, s * 1.6, 4, around);
      const out = s - 1;
      const reach = Math.exp(-Math.max(0, out) * 2.4);
      const flame = Math.pow(Phaser.Math.Clamp((n - 0.38) / 0.45, 0, 1), 1.6) * reach;
      // White-hot right at the rim, red further out.
      const halo = Math.exp(-Math.max(0, out) * 11);
      const fadeIn = Phaser.Math.Clamp((s - 0.9) / 0.12, 0, 1);
      const fadeOut = Phaser.Math.Clamp((SPACE_SUN_CORONA / 2 / r - s) / 0.35, 0, 1);
      const t = flame * 0.85 + halo * 0.75;
      const [red, green, blue] = heat(t);
      const alpha = Phaser.Math.Clamp(flame * 1.3 + halo, 0, 1) * fadeIn * fadeOut;
      return [red, green, blue, 255 * alpha];
    });
  };
  flames('space-sun-corona-a', 31);
  flames('space-sun-corona-b', 41);

  const glow = SPACE_SUN_SIZE * 3;
  paint(scene, 'space-sun-glow', glow, (x, y) => {
    const s = Math.hypot(x, y) / r;
    const fall = Math.exp(-Math.max(0, s - 0.9) * 1.6) * Phaser.Math.Clamp((glow / 2 / r - s) / 0.4, 0, 1);
    return [200, 50, 10, 255 * fall * 0.5];
  });
}
