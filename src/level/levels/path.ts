import type { LevelDefinition } from '../Level';

/**
 * Level 9: the sand path. 84 tiles.
 *
 * Nothing hunts here. A path of flat stones laid in sand, grass along its
 * edges and bushes beside it, out in the open under the sun. The path
 * climbs over **plateaus** -- raised banks of earth two to four tiles high,
 * one stepped -- and past **rocks** on the ground and on the plateaus, with
 * hearts on top to pick up -- and at the end of it
 * the **big portal**, three times the size of any other, which sends the
 * cat off into space.
 */

/**
 * The grid, written out and frozen into this file like every other level.
 */
const ROWS: string[] = [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '...............................oooo...............$',
  '.....................oo.......######..oo.......oo.Q.oo',
  '...........ooG.oo..........oo.######........o.#########.o.....o..oo',
  '..........########...RR...##########.....G....#########...R.....####',
  '..P...R...########...RR...##########....GGG...#########...RR....####.......E',
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
];

export const PATH: LevelDefinition = {
  // A mystery on purpose: the player is not told where the path leads.
  name: '???',
  theme: 'path',
  groundRow: 30,
  branchesNeedTrunks: false,
  portalScale: 3,
  // Come within four tiles of it and it sucks you in.
  portalPull: 4,
  // Through the big portal and off into space, to the moon.
  next: 'space',
  rows: ROWS,
};
