import type { LevelDefinition } from '../Level';

/**
 * Level 3: the city at night.
 *
 * Buildings are rock, ledges are girders, climbable columns are drainpipes
 * and the pool is a canal. A crow nests on a rooftop.
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
  '.'.repeat(51) + 'oo',
  '.'.repeat(50) + 'R'.repeat(6) + '.' + 'c',
  '.'.repeat(16) + 'oo' + '.'.repeat(32) + 'R'.repeat(6) + 'NNN' + 'o',
  '.'.repeat(15) + 'R'.repeat(6) + '.'.repeat(29) + 'R'.repeat(6) + '='.repeat(4),
  '.'.repeat(15) + 'R'.repeat(6) + '.'.repeat(12) + 'ooo' + '.'.repeat(14) + 'R'.repeat(6) + '.' + 'h',
  '.'.repeat(15) + 'R'.repeat(6) + '.'.repeat(11) + '='.repeat(6) + '.'.repeat(12) + 'R'.repeat(6),
  '.'.repeat(15) + 'R'.repeat(6) + '.' + 'ooo' + '.'.repeat(25) + 'R'.repeat(6) + '.'.repeat(5) + 'oo',
  '.'.repeat(15) + 'R'.repeat(6) + '='.repeat(5) + '.'.repeat(24) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(7) + 'oo' + '.'.repeat(6) + 'R'.repeat(6) + '.'.repeat(27) + 'ooo' + 'R'.repeat(5) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(26) + '='.repeat(6) + 'RRR' + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(6) + 'oo' + '.'.repeat(21) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + 'R'.repeat(6) + '.'.repeat(18) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + 'R'.repeat(6) + '..' + 'h' + 'oo' + '.'.repeat(13) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + 'R'.repeat(6) + '.' + '='.repeat(7) + '.'.repeat(10) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + 'R'.repeat(6) + '.'.repeat(18) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + 'R'.repeat(6) + '.'.repeat(18) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '..' + 'P' + '...' + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + 'R'.repeat(6) + '..' + 'B'.repeat(6) + '.'.repeat(4) + 'h' + '.'.repeat(5) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6) + '..' + 'E',
  '#'.repeat(40) + 'www' + 'f' + 'www' + '#'.repeat(23),
  '#'.repeat(40) + 'w'.repeat(7) + '#'.repeat(23),
  '#'.repeat(40) + 'w'.repeat(7) + '#'.repeat(23),
  '#'.repeat(70),
];

export const CITY: LevelDefinition = {
  name: 'City',
  theme: 'city',
  widthInTiles: 70,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
