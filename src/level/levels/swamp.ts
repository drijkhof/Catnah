import type { LevelDefinition } from '../Level';

/**
 * Level 2: the swamp.
 *
 * Standing water almost everywhere, and lianas to hang from instead of
 * trunks. The logs across the water are not attached to anything, so
 * `branchesNeedTrunks` is off: nothing here grew where it stands.
 */
const ROWS: string[] = [
  '',
  '',
  '',
  '.'.repeat(30) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(17) + 'T' + '.'.repeat(17) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(17) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(15) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(5) + 'ooo',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(4) + '='.repeat(5),
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(7) + 'ooo' + '.'.repeat(7) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(7) + 'ooo' + '.'.repeat(7) + 'T' + '.'.repeat(6) + '='.repeat(5) + '.'.repeat(6) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(6) + '='.repeat(5) + '.'.repeat(6) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(16) + 'ooo' + '.'.repeat(5) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(7) + 'ooo' + '.'.repeat(16) + 'T' + '.'.repeat(15) + '='.repeat(5) + '.'.repeat(4) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(6) + '='.repeat(5) + '.'.repeat(14) + 'ooo' + '.'.repeat(16) + 'T' + '.'.repeat(6) + 'T',
  '.'.repeat(12) + 'T' + '.'.repeat(24) + '='.repeat(5) + '.'.repeat(22) + 'T',
  '.'.repeat(11) + 'ooo' + '.'.repeat(25) + 'T',
  '.'.repeat(10) + '='.repeat(5),
  '',
  '',
  '..' + 'P' + '.'.repeat(19) + 'h' + '.'.repeat(17) + 'h' + '.'.repeat(28) + 'h' + '.' + 'E',
  '#'.repeat(8) + 'w'.repeat(4) + 'f' + 'w'.repeat(6) + '#'.repeat(7) + 'w'.repeat(10) + '#'.repeat(8) + 'w'.repeat(4) + 'f' + 'w'.repeat(5) + '#'.repeat(6) + 'www' + 'f' + 'www' + '#'.repeat(7),
  '#'.repeat(8) + 'w'.repeat(11) + '#'.repeat(7) + 'w'.repeat(10) + '#'.repeat(8) + 'w'.repeat(10) + '#'.repeat(6) + 'w'.repeat(7) + '#'.repeat(7),
  '#'.repeat(8) + 'w'.repeat(11) + '#'.repeat(7) + 'w'.repeat(10) + '#'.repeat(8) + 'w'.repeat(10) + '#'.repeat(6) + 'w'.repeat(7) + '#'.repeat(7),
  '#'.repeat(74),
];

export const SWAMP: LevelDefinition = {
  name: 'Swamp',
  theme: 'swamp',
  widthInTiles: 74,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
