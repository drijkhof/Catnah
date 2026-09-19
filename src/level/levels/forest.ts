import type { LevelDefinition } from '../Level';

/**
 * Level 1: a sunlit forest.
 *
 * Every branch grows from a trunk here and `branchesNeedTrunks` holds the
 * parser to it. The later levels have no trees, so their ledges stand on
 * their own.
 */
const ROWS: string[] = [
  '',
  '',
  '',
  '',
  '.'.repeat(58) + 'c',
  '.'.repeat(57) + 'NNN',
  '.'.repeat(58) + 'T',
  '.'.repeat(58) + 'T',
  '.'.repeat(58) + 'T',
  '.'.repeat(54) + 'ooo' + '.' + 'T',
  '.'.repeat(54) + '='.repeat(4) + 'T',
  '.'.repeat(58) + 'T',
  '.'.repeat(58) + 'T',
  '.'.repeat(58) + 'T' + 'ooo',
  '.'.repeat(58) + 'T' + '='.repeat(5),
  '.'.repeat(58) + 'T',
  '.'.repeat(58) + 'T',
  '.'.repeat(54) + 'ooo' + '.' + 'T' + '.'.repeat(6) + 'oo' + '...' + 'oo',
  '.'.repeat(54) + '='.repeat(4) + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR',
  '.'.repeat(30) + 'T' + '.'.repeat(27) + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR' + '.'.repeat(11) + 'ooo',
  '.'.repeat(30) + 'T' + 'oo' + 'h' + '.'.repeat(24) + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR' + '.'.repeat(10) + 'T' + '='.repeat(5),
  '.'.repeat(30) + 'T' + '='.repeat(5) + '.'.repeat(22) + 'T' + 'ooo' + '...' + 'RR' + '...' + 'RR' + '.'.repeat(10) + 'T',
  '.'.repeat(10) + 'T' + '.'.repeat(15) + 'ooo' + '.' + 'T' + '.'.repeat(13) + 'T' + '.'.repeat(13) + 'T' + '='.repeat(5) + '.' + 'RR' + '...' + 'RR' + '.'.repeat(10) + 'T',
  '.'.repeat(10) + 'T' + 'ooo' + '.'.repeat(12) + '='.repeat(4) + 'T' + '.'.repeat(13) + 'T' + 'ooo' + '.'.repeat(10) + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR' + '.'.repeat(6) + 'ooo' + '.' + 'T',
  '.'.repeat(10) + 'T' + '='.repeat(5) + '.'.repeat(14) + 'T' + '.'.repeat(13) + 'T' + '='.repeat(4) + '.'.repeat(9) + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR' + '.'.repeat(6) + '='.repeat(4) + 'T',
  '.'.repeat(6) + 'ooo' + '.' + 'T' + '.'.repeat(19) + 'T' + '.'.repeat(9) + 'ooo' + '.' + 'T' + '.'.repeat(9) + 'ooo' + '.' + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR' + '.'.repeat(10) + 'T',
  '.'.repeat(6) + '='.repeat(4) + 'T' + '.'.repeat(19) + 'T' + '.'.repeat(9) + '='.repeat(4) + 'T' + '.'.repeat(8) + 'oo' + '===' + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR' + '.'.repeat(10) + 'T',
  '.'.repeat(10) + 'T' + '.'.repeat(7) + 'o' + 'h' + 'o' + '.'.repeat(9) + 'T' + '.'.repeat(7) + 'ooo' + '...' + 'T' + '.'.repeat(7) + 'R'.repeat(6) + 'T' + '.'.repeat(6) + 'RR' + '...' + 'RR' + '.'.repeat(10) + 'T',
  '.'.repeat(10) + 'T' + '.'.repeat(6) + 'R'.repeat(6) + '.' + 'B'.repeat(6) + 'T' + '.'.repeat(6) + 'R'.repeat(6) + '.' + 'T' + '.'.repeat(7) + 'R'.repeat(6) + 'T' + '.'.repeat(11) + 'RR' + '.'.repeat(10) + 'T',
  '...' + 'P' + '.'.repeat(6) + 'T' + '.'.repeat(6) + 'R'.repeat(6) + '.'.repeat(7) + 'T' + '.'.repeat(6) + 'R'.repeat(6) + '.' + 'T' + '.'.repeat(7) + 'R'.repeat(6) + 'T' + '.'.repeat(4) + 'h' + '.'.repeat(6) + 'RR' + '.'.repeat(10) + 'T' + '.'.repeat(5) + 'E',
  '#'.repeat(5) + 'w'.repeat(5) + '#'.repeat(36) + '.'.repeat(5) + '#'.repeat(22) + 'ww' + 'f' + 'ww' + '#'.repeat(12),
  '#'.repeat(5) + 'w'.repeat(5) + '#'.repeat(36) + '.'.repeat(5) + '#'.repeat(22) + 'w'.repeat(5) + '#'.repeat(12),
  '#'.repeat(5) + 'w'.repeat(5) + '#'.repeat(36) + '.'.repeat(5) + '#'.repeat(22) + 'w'.repeat(5) + '#'.repeat(12),
  '#'.repeat(46) + '.'.repeat(5) + '#'.repeat(39),
];


export const FOREST: LevelDefinition = {
  name: 'Forest',
  theme: 'forest',
  widthInTiles: 90,
  groundRow: 30,
  branchesNeedTrunks: true,
  rows: ROWS,
};
