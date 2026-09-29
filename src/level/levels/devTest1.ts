import type { LevelDefinition } from '../Level';

/**
 * Dev test #1: a duck.
 *
 * One idea, nothing else: a low overhang, with the wall above it running all
 * the way up to the top of the level rather than stopping a tile or two above
 * -- measured this against a held jump before shipping it, since a wall that
 * stops short leaves open air a jump can arc through above the obstacle
 * rather than through it. Sneaking under is the only way past, which is the
 * point; a level that merely *allows* sneaking, the way the forest's own
 * overhang does, does not reliably test it.
 */
const ROWS: string[] = [
  '..........#####............',
  '..........#####............',
  '..........#####............',
  '........BBBBBBBBB..........',
  '....P........===..........E',
  '#  #################  #####',
  '___________________________',
];

export const DEV_TEST_1: LevelDefinition = {
  name: 'Dev 1: Duck',
  theme: 'forest',
  groundRow: 5,
  branchesNeedTrunks: false,
  climbableColumns: false,
  rows: ROWS,
};
