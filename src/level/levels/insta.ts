import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './insta.txt?raw';

/**
 * Level 19: insta. 120 tiles.
 *
 * The internet, level 2: a photo site. Pink, orange and purple, photos
 * and hearts floating behind. More cables, wider spikes, and a stair of
 * shelves over a long bed of them.
 *
 * Laid out once with a throwaway script and frozen into its `.txt` file.
 */
const ROWS = gridRows(grid);

export const INSTA: LevelDefinition = {
  name: 'Insta',
  theme: 'insta',
  groundRow: 30,
  branchesNeedTrunks: false,
  rows: ROWS,
};
