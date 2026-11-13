import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './facebook.txt?raw';

/**
 * Level 20: facebook. 125 tiles.
 *
 * The internet, level 3: a friends site. Blue and white, thumbs up and
 * chat bubbles floating behind. Two cables close together, pits either
 * side of spikes, and a long walk of shelves over spikes.
 *
 * Laid out once with a throwaway script and frozen into its `.txt` file.
 */
const ROWS = gridRows(grid);

export const FACEBOOK: LevelDefinition = {
  name: 'Facebook',
  theme: 'facebook',
  groundRow: 30,
  branchesNeedTrunks: false,
  rows: ROWS,
};
