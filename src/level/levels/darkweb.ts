import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './darkweb.txt?raw';

/**
 * Level 22: the dark web. 140 tiles.
 *
 * The internet, level 5: the dark web. Black, code falling in green,
 * skulls and locks floating behind. **Hackers** stand at every fork with a
 * sign, and the sign always points the wrong way: along the ground into
 * spikes too wide to jump, down a hole, up a stair of shelves that ends
 * over a roof of spikes. The way on is the other one. Its portal is the
 * way out of the internet, and the end of the game.
 *
 * Laid out once with a throwaway script and frozen into its `.txt` file.
 */
const ROWS = gridRows(grid);

export const DARKWEB: LevelDefinition = {
  name: 'Dark web',
  theme: 'darkweb',
  groundRow: 30,
  branchesNeedTrunks: false,
  // The way out of the internet is the end of the game.
  next: 'victory',
  rows: ROWS,
};
