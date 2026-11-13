import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';
import { gridRows } from './grid';
import grid from './neptune.txt?raw';

/**
 * Neptune, taken over by the robots. 137 tiles.
 *
 * Deep blue ice under a black sky with Uranus and Pluto in it, blue spires behind. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Seas to swim**, three deep -- no fish: piranhas live only on the Earth -- and a spare heart on the bottom of the first. A tower and a slab between them.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **1 of Bob's 10 part** (`K`), faint until the cat is near, and well
 * hidden -- never in the water: in a room inside a rock, up the chain on
 * its side and down the shaft in its top.
 *
 * Its portal goes back out into space.
 */

/**
 * The grid, laid out once with a throwaway script and frozen into its `.txt` file
 * like every other level.
 */
const ROWS = gridRows(grid);

export const NEPTUNE: LevelDefinition = {
  name: 'Neptune',
  theme: 'neptune',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Its own gravity, as a share of the Earth's: near enough the real one.
  gravity: GRAVITY.neptune,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
