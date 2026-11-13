import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './google.txt?raw';

/**
 * Level 21: Google. 130 tiles.
 *
 * The internet, level 4: the search engine. White and bright, with lines
 * in its four colours, magnifying glasses and search bars floating behind. The hardest of the four: narrow shelves,
 * blocks between pits, and cables in pairs.
 *
 * Laid out once with a throwaway script and frozen into its `.txt` file.
 */
const ROWS = gridRows(grid);

export const GOOGLE: LevelDefinition = {
  name: 'Google',
  theme: 'google',
  groundRow: 30,
  branchesNeedTrunks: false,
  rows: ROWS,
};
