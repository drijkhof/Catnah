import type { LevelDefinition } from '../Level';

/**
 * Level 6: the volcano.
 *
 * The floor is a lava lake and only the islands are safe, so most of the
 * level is read as somewhere not to land rather than somewhere to walk.
 *
 * The last stretch is the lair of the evil lord beetle, and it is one long
 * floor rather than more islands. A boss you cannot step aside from is not a
 * fight: on four-tile islands the only way out of its path was into the lava.
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
  '.'.repeat(41) + 'T',
  '.'.repeat(26) + 'T' + '.'.repeat(14) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + 'o' + '.'.repeat(13) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(13) + 'T' + 'o' + '.'.repeat(11) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + 'o',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(26) + 'X',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + 'o' + '.'.repeat(13) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(13) + 'T' + 'o' + '.'.repeat(11) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + 'o',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(11) + 'ooo' + '.' + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(10) + 'ooo' + '.' + 'T' + '.'.repeat(10) + '='.repeat(4) + '.' + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(8) + 'ooo' + '.' + 'T' + '.'.repeat(9) + '='.repeat(4) + '.'.repeat(17) + 'T' + '.'.repeat(16) + 'ooo' + '.'.repeat(15) + 'ooo',
  '.'.repeat(9) + 'ooo' + '.' + 'T' + '.'.repeat(7) + '='.repeat(4) + '.'.repeat(32) + 'T',
  '.'.repeat(8) + '='.repeat(4),
  '',
  '',
  '..' + 'P' + '.'.repeat(12) + 'o' + 'h' + '.'.repeat(12) + 'oo' + 'h' + '.'.repeat(13) + 'oo' + 'h' + '.'.repeat(11) + 'oo' + 'h' + '.'.repeat(4) + 'ooo' + '.'.repeat(28) + 'E',
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'LL' + '##' + 'LL' + '#'.repeat(30),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'LL' + '##' + 'LL' + '#'.repeat(30),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'LL' + '##' + 'LL' + '#'.repeat(30),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'LL' + '##' + 'LL' + '#'.repeat(30),
];

export const VOLCANO: LevelDefinition = {
  name: 'Volcano',
  theme: 'volcano',
  widthInTiles: 100,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
