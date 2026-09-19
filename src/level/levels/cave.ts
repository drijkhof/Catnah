import type { LevelDefinition } from '../Level';

/**
 * Level 3: the cave.
 *
 * Carved rather than built: the grid starts as solid rock and tunnels are cut
 * out of it, which is why the floor is never level and every passage has a
 * roof. It branches, and **not every branch goes anywhere** -- several are
 * dead ends with berries at the back, so exploring is the point rather than
 * running right.
 *
 * One passage is a single tile high, so only a sneaking cat fits through it.
 */
const ROWS: string[] = [
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(24) + '.'.repeat(7) + '#'.repeat(53),
  '#'.repeat(24) + '..' + 'o'.repeat(4) + '.' + '#'.repeat(53),
  '#'.repeat(24) + '.'.repeat(7) + '#'.repeat(53),
  '#'.repeat(24) + '...' + '+' + 'T' + '..' + '#'.repeat(53),
  '#'.repeat(26) + '..' + 'T' + '..' + '#'.repeat(15) + '.'.repeat(6) + 'T' + '.'.repeat(14) + '#'.repeat(17),
  '#'.repeat(26) + '..' + 'T' + '..' + '#'.repeat(15) + '..' + 'o'.repeat(4) + 'T' + '.'.repeat(14) + '#'.repeat(17),
  '#'.repeat(26) + '..' + 'T' + '..' + '#'.repeat(15) + '.'.repeat(6) + 'T' + '.'.repeat(14) + '#'.repeat(17),
  '#'.repeat(26) + '..' + 'T' + '..' + '#'.repeat(19) + '..' + 'T' + '..' + '#'.repeat(5) + '.'.repeat(7) + '#'.repeat(17),
  '#'.repeat(26) + '..' + 'T' + '..' + '#'.repeat(19) + '..' + 'T' + '..' + '#'.repeat(5) + '.'.repeat(19) + '#'.repeat(5),
  '#'.repeat(26) + '..' + 'T' + '..' + '#'.repeat(19) + '..' + 'T' + '..' + '#'.repeat(5) + '.'.repeat(6) + 'o'.repeat(4) + '.'.repeat(9) + '#'.repeat(5),
  '###' + '.' + 'o'.repeat(4) + '.'.repeat(12) + 'T' + '.'.repeat(16) + '#'.repeat(13) + '..' + 'T' + '..' + '#'.repeat(9) + '.'.repeat(10) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '###' + '.'.repeat(8) + 'o'.repeat(4) + '.'.repeat(5) + 'T' + '.'.repeat(5) + 'o'.repeat(4) + '.'.repeat(7) + '#'.repeat(13) + '..' + 'T' + '..' + '#'.repeat(15) + '.'.repeat(4) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#'.repeat(9) + '.'.repeat(11) + 'T' + '.'.repeat(4) + 'h' + '.'.repeat(8) + 'T' + '..' + '#'.repeat(13) + '..' + 'T' + '..' + '#'.repeat(15) + '.'.repeat(4) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#'.repeat(17) + '...' + 'T' + '.'.repeat(4) + '###' + '.'.repeat(6) + 'T' + '..' + '#'.repeat(13) + '..' + 'T' + '..' + '###' + '.'.repeat(7) + '#'.repeat(5) + '.'.repeat(4) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#'.repeat(17) + '...' + 'T' + '.'.repeat(4) + '#'.repeat(4) + 'ooo' + '..' + 'T' + '..' + '#'.repeat(13) + '..' + 'T' + '..' + '###' + '.' + 'o'.repeat(4) + '..' + '#'.repeat(5) + '.'.repeat(4) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#'.repeat(17) + '...' + 'T' + '.'.repeat(13) + 'T' + '..' + '#'.repeat(13) + '..' + 'T' + '.'.repeat(12) + '#'.repeat(5) + '.'.repeat(4) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#'.repeat(17) + '...' + 'T' + '#'.repeat(8) + '.'.repeat(5) + 'T' + '..' + '#'.repeat(11) + '.'.repeat(4) + 'T' + '.'.repeat(12) + '#'.repeat(5) + '.'.repeat(4) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#' + '.'.repeat(9) + '#'.repeat(7) + '.'.repeat(8) + '#'.repeat(5) + '.'.repeat(4) + 'T' + '.'.repeat(26) + '#'.repeat(9) + '.'.repeat(4) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#' + '.'.repeat(9) + '#'.repeat(7) + '.'.repeat(8) + '#'.repeat(5) + '.'.repeat(20) + 'ooo' + '.' + 'h' + '...' + '#'.repeat(8) + '.'.repeat(8) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#' + '.'.repeat(19) + 'T' + '.'.repeat(4) + '#'.repeat(5) + '.'.repeat(19) + '#'.repeat(17) + '.'.repeat(8) + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#' + '.'.repeat(19) + 'T' + '.'.repeat(4) + '#'.repeat(5) + '...' + 'w'.repeat(5) + 'f' + 'w'.repeat(6) + '.'.repeat(4) + '#'.repeat(17) + 'ooo' + '..' + 'E' + '..' + 'T' + '.'.repeat(4) + '#'.repeat(5),
  '#' + '..' + 'P' + '.'.repeat(10) + 'h' + '.'.repeat(10) + '#'.repeat(5) + '...' + 'w'.repeat(12) + '.'.repeat(4) + '#'.repeat(17) + '.'.repeat(13) + '#'.repeat(5),
  '#'.repeat(84),
  '#'.repeat(84),
  '#'.repeat(84),
];

export const CAVE: LevelDefinition = {
  name: 'Cave',
  theme: 'cave',
  widthInTiles: 84,
  groundRow: 31,
  branchesNeedTrunks: false,
  rows: ROWS,
};
