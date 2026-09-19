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
  '.'.repeat(51) + 'oo' + '.'.repeat(4) + 'c',
  '.'.repeat(50) + 'R'.repeat(6),
  '.'.repeat(16) + 'oo' + '.'.repeat(32) + 'R'.repeat(6) + 'N' + '+' + 'N' + 'o',
  '.'.repeat(15) + 'R'.repeat(6) + '.'.repeat(29) + 'R'.repeat(6) + '='.repeat(4),
  '.'.repeat(15) + 'R'.repeat(6) + '.'.repeat(12) + 'ooo' + '.'.repeat(14) + 'R'.repeat(6),
  '.'.repeat(15) + 'R'.repeat(6) + '.'.repeat(11) + '='.repeat(6) + '.'.repeat(12) + 'R'.repeat(6),
  '.'.repeat(15) + 'R'.repeat(6) + '.' + 'ooo' + '.'.repeat(25) + 'R'.repeat(6) + '.'.repeat(5) + 'oo',
  '.'.repeat(15) + 'R'.repeat(6) + '='.repeat(5) + '.'.repeat(24) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(7) + 'oo' + '.'.repeat(6) + 'R'.repeat(6) + '.'.repeat(27) + 'ooo' + 'R'.repeat(5) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(26) + '='.repeat(6) + 'RRR' + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(6) + 'oo' + '.'.repeat(21) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.'.repeat(4) + 'T' + 'R'.repeat(6) + '.'.repeat(18) + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6),
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.' + 'T' + '..' + 'T' + 'R'.repeat(6) + '...' + 'oo' + '.'.repeat(10) + 'T' + '..' + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6) + '.' + 'T',
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.' + 'T' + '..' + 'T' + 'R'.repeat(6) + '.' + '===' + '.' + '===' + '.'.repeat(7) + 'T' + '..' + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6) + '.' + 'T',
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.' + 'T' + '..' + 'T' + 'R'.repeat(6) + '.'.repeat(15) + 'T' + '..' + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6) + '.' + 'T',
  '.'.repeat(6) + 'R'.repeat(6) + 'T' + '..' + 'R'.repeat(6) + '.' + 'T' + '..' + 'T' + 'R'.repeat(6) + '.'.repeat(15) + 'T' + '..' + 'R'.repeat(6) + '...' + 'T' + 'R'.repeat(6) + '.' + 'T',
  '..' + 'P' + '...' + 'R'.repeat(6) + 'T' + 'r' + '.' + 'R'.repeat(6) + '.' + 'T' + 'r' + '.' + 'T' + 'R'.repeat(6) + 'A'.repeat(4) + 'B'.repeat(4) + '.'.repeat(7) + 'T' + 'r' + '.' + 'R'.repeat(6) + 'A'.repeat(4) + 'R'.repeat(6) + '.' + 'T' + 'E',
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
  // Girders, not branches: you cannot pass up through one.
  solidPlatforms: true,
  rows: ROWS,
};
