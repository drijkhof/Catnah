import type { LevelDefinition } from '../Level';

/** Dev test #1: an empty level -- flat ground, a spawn and an exit. */
const ROWS: string[] = [
  '....P.....................E',
  '###########################',
  '___________________________',
];

export const DEV_TEST_1: LevelDefinition = {
  name: 'Dev 1: Empty',
  theme: 'forest',
  groundRow: 1,
  branchesNeedTrunks: false,
  climbableColumns: false,
  rows: ROWS,
};
