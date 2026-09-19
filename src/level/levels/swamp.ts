import type { LevelDefinition } from '../Level';

/**
 * Level 2: the swamp.
 *
 * Standing water nearly everywhere, crossed by logs. Each liana hangs in the
 * gap *between* two logs, running from the height of the upper one down to
 * the height of the lower -- so it is the way across rather than something
 * dangling overhead with nothing at either end.
 *
 * Nothing grew where it stands, so `branchesNeedTrunks` is off.
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
  '.'.repeat(52) + 'ooo',
  '.'.repeat(48) + '+' + 'T' + '.' + '='.repeat(6) + '.' + 'T',
  '.'.repeat(34) + 'ooo' + '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T',
  '.'.repeat(31) + 'T' + '.' + '='.repeat(6) + '.' + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T',
  '.'.repeat(16) + 'ooo' + '.'.repeat(12) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T',
  '.'.repeat(13) + 'T' + '.' + '='.repeat(6) + '.' + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T',
  '.'.repeat(13) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '..' + 'ooo',
  '.'.repeat(13) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '.'.repeat(8) + 'T' + '..' + 'ooo' + '...' + 'T' + '.'.repeat(8) + 'T' + '.' + '='.repeat(6),
  '.'.repeat(13) + 'T' + '.'.repeat(8) + 'T' + '..' + 'ooo' + '...' + 'T' + '.'.repeat(8) + 'T' + '.' + '='.repeat(6) + '.' + 'T',
  '.'.repeat(7) + 'ooo' + '...' + 'T' + '.'.repeat(8) + 'T' + '.' + '='.repeat(6) + '.' + 'T',
  '.'.repeat(6) + '='.repeat(6) + '.' + 'T',
  '',
  '',
  '..' + 'P' + '.'.repeat(19) + 'h' + '.'.repeat(17) + 'h' + '.'.repeat(30) + 'h' + '.' + 'E',
  '#'.repeat(8) + 'w'.repeat(4) + 'f' + 'w'.repeat(6) + '#'.repeat(7) + 'w'.repeat(10) + '#'.repeat(8) + 'w'.repeat(4) + 'f' + 'w'.repeat(5) + '#'.repeat(6) + 'w'.repeat(4) + 'f' + 'w'.repeat(4) + '#'.repeat(7),
  '#'.repeat(8) + 'w'.repeat(11) + '#'.repeat(7) + 'w'.repeat(10) + '#'.repeat(8) + 'w'.repeat(10) + '#'.repeat(6) + 'w'.repeat(9) + '#'.repeat(7),
  '#'.repeat(8) + 'w'.repeat(11) + '#'.repeat(7) + 'w'.repeat(10) + '#'.repeat(8) + 'w'.repeat(10) + '#'.repeat(6) + 'w'.repeat(9) + '#'.repeat(7),
  '#'.repeat(76),
];

export const SWAMP: LevelDefinition = {
  name: 'Swamp',
  theme: 'swamp',
  widthInTiles: 76,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
