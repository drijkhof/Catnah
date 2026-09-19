import type { LevelDefinition } from '../Level';

/**
 * Level 6: the volcano.
 *
 * The floor is a lava lake and only the islands are safe, so the level is
 * read as somewhere not to land rather than somewhere to walk. Chains hang
 * over the gaps where there is nothing living left to climb.
 *
 * Lava is shaped exactly like water and behaves nothing like it: not solid,
 * and fatal to touch.
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
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + 'o' + '.'.repeat(13) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(13) + 'T' + 'o' + '.'.repeat(11) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + 'o',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(11) + 'ooo' + '.' + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(10) + 'ooo' + '.' + 'T' + '.'.repeat(10) + '='.repeat(4) + '.' + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(8) + 'ooo' + '.' + 'T' + '.'.repeat(9) + '='.repeat(4) + '.'.repeat(17) + 'T',
  '.'.repeat(9) + 'ooo' + '.' + 'T' + '.'.repeat(7) + '='.repeat(4) + '.'.repeat(32) + 'T' + '.'.repeat(8) + 'ooo',
  '.'.repeat(8) + '='.repeat(4) + '.'.repeat(53) + '='.repeat(4),
  '',
  '',
  '..' + 'P' + '.'.repeat(12) + 'o' + 'h' + '.'.repeat(12) + 'oo' + 'h' + '.'.repeat(13) + 'oo' + 'h' + '.'.repeat(11) + 'oo' + 'h' + '.'.repeat(12) + 'E',
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(6) + '#'.repeat(8),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(6) + '#'.repeat(8),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(6) + '#'.repeat(8),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(6) + '#'.repeat(8),
];

export const VOLCANO: LevelDefinition = {
  name: 'Volcano',
  theme: 'volcano',
  widthInTiles: 78,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
