import type { LevelDefinition } from '../Level';

/**
 * Level 2: underground.
 *
 * No trees, so the ledges stand on their own -- `branchesNeedTrunks` is off.
 * The climbable columns are vines hanging from the roof.
 */
const ROWS: string[] = [
  '#'.repeat(70),
  '#'.repeat(70),
  '#'.repeat(70),
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(17) + 'ooo' + '.'.repeat(11) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(16) + '='.repeat(6) + '.'.repeat(9) + 'T' + '.'.repeat(9) + 'oo' + '...' + 'oo',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T' + '.'.repeat(9) + 'RR' + '...' + 'RR',
  '.'.repeat(13) + 'T' + '.'.repeat(31) + 'T' + '.'.repeat(9) + 'RR' + '...' + 'RR',
  '.'.repeat(13) + 'T' + '.'.repeat(25) + 'o' + '.' + 'o' + '...' + 'T' + '.'.repeat(9) + 'RR' + '...' + 'RR',
  '.'.repeat(13) + 'T' + '.' + 'ooo' + '.'.repeat(20) + '='.repeat(6) + '.'.repeat(11) + 'RR' + '...' + 'RR',
  '.'.repeat(14) + '='.repeat(6) + '.'.repeat(35) + 'RR' + '...' + 'RR',
  '.'.repeat(55) + 'RR' + '...' + 'RR',
  '.'.repeat(47) + 'ooo' + '.'.repeat(5) + 'RR' + '...' + 'RR',
  '.'.repeat(7) + 'o' + '.' + 'o' + '.'.repeat(13) + 'ooo' + '.'.repeat(20) + '='.repeat(6) + '...' + 'RR' + '...' + 'RR',
  '.'.repeat(6) + '='.repeat(6) + '.'.repeat(10) + '='.repeat(6) + '.'.repeat(27) + 'RR' + '...' + 'RR',
  '.'.repeat(55) + 'RR' + '...' + 'RR',
  '.'.repeat(8) + 'B'.repeat(6) + '.'.repeat(46) + 'RR',
  '..' + 'P' + '..' + 'h' + '.'.repeat(14) + 'h' + '.'.repeat(29) + 'h' + '.'.repeat(9) + 'RR' + '.'.repeat(5) + 'E',
  '#'.repeat(30) + 'www' + 'f' + 'www' + '#'.repeat(33),
  '#'.repeat(30) + 'w'.repeat(7) + '#'.repeat(33),
  '#'.repeat(30) + 'w'.repeat(7) + '#'.repeat(33),
  '#'.repeat(70),
];

export const CAVE: LevelDefinition = {
  name: 'Cave',
  theme: 'cave',
  widthInTiles: 70,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
