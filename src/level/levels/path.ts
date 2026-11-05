import type { LevelDefinition } from '../Level';

/**
 * Level 9, the last: the sand path. 66 tiles.
 *
 * Nothing hunts here. A path of flat stones laid in sand, grass along its
 * edges and bushes beside it, out in the open under the sun, with a few
 * hearts to pick up and a boulder or two to hop -- and at the end of it
 * the **big portal**, three times the size of any other, which ends the
 * game.
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
  '........................o',
  '.......................o.o',
  '.............oooo.....o...o.....ooo',
  '.......ooo..............................ooo.....oo',
  '..............RR.................G',
  '..P...........RR................GGG...........R..........E',
  '#'.repeat(66),
  '#'.repeat(66),
  '#'.repeat(66),
  '#'.repeat(66),
];

export const PATH: LevelDefinition = {
  name: 'Sand path',
  theme: 'path',
  groundRow: 30,
  branchesNeedTrunks: false,
  portalScale: 3,
  rows: ROWS,
};
