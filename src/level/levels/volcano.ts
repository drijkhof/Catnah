import type { LevelDefinition } from '../Level';

/**
 * Level 6: the volcano.
 *
 * The floor is a lava lake and only the islands are safe, so most of the
 * level is read as somewhere not to land rather than somewhere to walk.
 *
 * It ends at the volcano itself: a cone of rock with a crater notch at the
 * top and a mouth at ground level. Inside is the lair of the evil lord
 * beetle -- an enclosed floor to fight on, with the way out at the far end.
 *
 * The arena is one long floor rather than more islands. A boss you cannot
 * step aside from is not a fight: on four-tile islands the only way out of
 * its path was into the lava.
 */
const ROWS: string[] = [
  '',
  '',
  '',
  '.'.repeat(76) + '#'.repeat(7) + '.'.repeat(7) + '#'.repeat(7),
  '.'.repeat(76) + '#'.repeat(7) + '.'.repeat(7) + '#'.repeat(7),
  '.'.repeat(75) + '#'.repeat(8) + '.'.repeat(7) + '#'.repeat(8),
  '.'.repeat(74) + '#'.repeat(25),
  '.'.repeat(73) + '#'.repeat(27),
  '.'.repeat(73) + '#'.repeat(27),
  '.'.repeat(72) + '#'.repeat(29),
  '.'.repeat(41) + 'T' + '.'.repeat(29) + '#'.repeat(31),
  '.'.repeat(26) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(28) + '#'.repeat(33),
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T' + '.'.repeat(11) + '#'.repeat(35),
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + 'o' + '.'.repeat(13) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(11) + '#'.repeat(35),
  '.'.repeat(13) + 'T' + 'o' + '.'.repeat(11) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + 'o' + '.'.repeat(9) + '#'.repeat(4) + '.'.repeat(29) + '###',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(9) + '#'.repeat(5) + '.'.repeat(29) + '###',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(8) + '#'.repeat(6) + '.'.repeat(29) + '###',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + 'o' + '.'.repeat(14) + 'T' + '.'.repeat(7) + '#'.repeat(7) + '..' + 'ooo' + '.'.repeat(9) + 'X' + '.'.repeat(9) + 'ooo' + '..' + '###',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + 'o' + '.'.repeat(13) + 'T' + '.'.repeat(15) + 'T' + '.'.repeat(7) + '#'.repeat(7) + '.'.repeat(29) + '###',
  '.'.repeat(13) + 'T' + 'o' + '.'.repeat(11) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(15) + 'T' + 'o' + '.'.repeat(5) + '#'.repeat(8) + '.'.repeat(29) + '###',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(14) + 'T' + '.'.repeat(11) + 'ooo' + '.' + 'T' + '.'.repeat(5) + '#'.repeat(9) + '.'.repeat(29) + '###',
  '.'.repeat(13) + 'T' + '.'.repeat(12) + 'T' + '.'.repeat(10) + 'ooo' + '.' + 'T' + '.'.repeat(10) + '='.repeat(4) + '.' + 'T' + '.'.repeat(4) + '#'.repeat(10) + '.'.repeat(29) + '###',
  '.'.repeat(13) + 'T' + '.'.repeat(8) + 'ooo' + '.' + 'T' + '.'.repeat(9) + '='.repeat(4) + '.'.repeat(17) + 'T' + '.'.repeat(4) + '#'.repeat(10) + '.'.repeat(29) + '###',
  '.'.repeat(9) + 'ooo' + '.' + 'T' + '.'.repeat(7) + '='.repeat(4) + '.'.repeat(32) + 'T' + '...' + '#'.repeat(11) + '.'.repeat(29) + '###',
  '.'.repeat(8) + '='.repeat(4) + '.'.repeat(48) + '#'.repeat(12) + '.'.repeat(29) + '###',
  '.'.repeat(101) + '###',
  '.'.repeat(101) + '###',
  '..' + 'P' + '.'.repeat(12) + 'o' + 'h' + '.'.repeat(12) + 'oo' + 'h' + '.'.repeat(13) + 'oo' + 'h' + '.'.repeat(50) + 'E' + '..' + '###',
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(7) + '#'.repeat(47),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(6) + '#'.repeat(48),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(5) + '#'.repeat(49),
  '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(8) + '#'.repeat(6) + 'L'.repeat(10) + '#'.repeat(6) + 'L'.repeat(4) + '#'.repeat(50),
];

export const VOLCANO: LevelDefinition = {
  name: 'Volcano',
  theme: 'volcano',
  widthInTiles: 104,
  groundRow: 28,
  branchesNeedTrunks: false,
  rows: ROWS,
};
