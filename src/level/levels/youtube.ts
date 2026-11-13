import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './youtube.txt?raw';

/**
 * Level 18: youtube. 110 tiles.
 *
 * The internet, level 1: a video site. Red and black, videos and play
 * buttons floating behind. The first **cables** (`I`) across the way: too
 * tall to jump, so the cat scratches through them, holding down against
 * one until it snaps. **Spikes** are the only danger here -- nothing alive
 * is inside the internet.
 *
 * Laid out once with a throwaway script and frozen into its `.txt` file.
 */
const ROWS = gridRows(grid);

export const YOUTUBE: LevelDefinition = {
  name: 'YouTube',
  theme: 'youtube',
  groundRow: 30,
  branchesNeedTrunks: false,
  rows: ROWS,
};
