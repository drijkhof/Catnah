import type { LevelDefinition } from '../Level';

/**
 * Level 1: the canopy.
 *
 * Built around jumping off a liana onto a platform out of its reach. The
 * lianas hang from the roof rather than standing on the floor, and every
 * platform is far too high to be reached from the ground, so there is no way
 * through that does not involve letting go in mid-air.
 *
 * In the middle, five lianas hang side by side: holding on is not pinned to
 * one rope, so that stretch is crossed sideways as much as climbed.
 *
 * The cat starts on a small boulder. A hedgehog paces the floor it would
 * otherwise start on, and nothing should be able to kill a player who has not
 * touched the controls yet.
 */
const ROWS: string[] = [
  '#'.repeat(78),
  '#'.repeat(78),
  '#'.repeat(78),
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(13) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(13) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(13) + 'o'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + 'o' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(12) + 'T'.repeat(5) + '.'.repeat(14) + 'T' + 'o',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(13) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(6) + 'ooo' + '.'.repeat(4) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(5) + '='.repeat(5) + '...' + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(13) + 'T'.repeat(5) + '.'.repeat(14) + 'T' + '.'.repeat(6) + 'o' + 'E' + 'o',
  '.'.repeat(7) + 'T' + 'o' + '.'.repeat(5) + 'ooo' + '.'.repeat(6) + 'T' + 'o' + '.'.repeat(12) + 'T'.repeat(5) + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(4) + '='.repeat(5),
  '.'.repeat(7) + 'T' + '.'.repeat(5) + '='.repeat(5) + '.'.repeat(5) + 'T' + '.'.repeat(13) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(13) + 'T'.repeat(5) + '.'.repeat(5) + 'ooo' + '.'.repeat(6) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(13) + 'T'.repeat(5) + '.'.repeat(4) + '='.repeat(5) + '.'.repeat(5) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(29) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + 'o' + '.'.repeat(28) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(29) + 'T'.repeat(5) + '.'.repeat(14) + 'T',
  '.'.repeat(7) + 'T' + '.'.repeat(29) + 'T'.repeat(5),
  '.'.repeat(7) + 'T' + '.'.repeat(29) + 'T'.repeat(5),
  '.'.repeat(7) + 'T' + '.'.repeat(29) + 'T'.repeat(5),
  '.'.repeat(7) + 'T' + 'o',
  '.'.repeat(7) + 'T',
  '.'.repeat(7) + 'T',
  '..' + 'P' + '.'.repeat(4) + 'T',
  '.' + 'RRR' + '.'.repeat(30) + 'h',
  '#'.repeat(78),
  '#'.repeat(78),
  '#'.repeat(78),
  '#'.repeat(78),
];

export const CANOPY: LevelDefinition = {
  name: 'Canopy',
  theme: 'jungle',
  widthInTiles: 78,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
