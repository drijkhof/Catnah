import type { LevelDefinition } from '../Level';

/**
 * Level 1: the canopy.
 *
 * Built around one move: jumping off a liana to a platform out of its reach.
 * The lianas hang from the roof rather than standing on the floor, and every
 * platform is far too high to be reached from the ground, so there is no way
 * through that does not involve letting go in mid-air.
 *
 * It is also why jump and climb are separate buttons: on one button this
 * level would be impossible.
 */
const ROWS: string[] = [
  '#'.repeat(72),
  '#'.repeat(72),
  '#'.repeat(72),
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + 'o' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T' + 'o',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(6) + 'ooo' + '.'.repeat(6) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(5) + '='.repeat(5) + '.'.repeat(5) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(6) + 'o' + 'E' + 'o',
  '.'.repeat(7) + 'T' + 'o' + '.'.repeat(5) + 'ooo' + '.'.repeat(6) + 'T' + 'o' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(4) + '='.repeat(5),
  '.'.repeat(7) + 'T' + '.'.repeat(5) + '='.repeat(5) + '.'.repeat(5) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(6) + 'ooo' + '.'.repeat(6) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(5) + '='.repeat(5) + '.'.repeat(5) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(31) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(7) + 'T' + 'o' + '.'.repeat(46) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(47) + 'T',
  '.'.repeat(7) + 'T',
  '.'.repeat(7) + 'T',
  '.'.repeat(7) + 'T',
  '.'.repeat(7) + 'T' + 'o',
  '.'.repeat(7) + 'T',
  '.'.repeat(7) + 'T',
  '.'.repeat(7) + 'T',
  '..' + 'P' + '.'.repeat(31) + 'h',
  '#'.repeat(72),
  '#'.repeat(72),
  '#'.repeat(72),
  '#'.repeat(72),
];

export const CANOPY: LevelDefinition = {
  name: 'Canopy',
  theme: 'jungle',
  widthInTiles: 72,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
