import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';
import { gridRows } from './grid';
import grid from './venus.txt?raw';

/**
 * Venus, taken over by the robots. 127 tiles.
 *
 * Cracked dark basalt glowing orange at its edges, under a thick yellow haze, smoking volcanoes on the horizon. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Lava lakes** to jump, the wide ones with a stepping rock in the middle. Thorns, a tower and a slab between them.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **1 of Bob's 10 part** (`K`), faint until the cat is near, and well
 * hidden: inside a rock: a room reached only by dropping into the gap on
 * top.
 *
 * Its portal goes back out into space.
 */

/**
 * The grid, laid out once with a throwaway script and frozen into its `.txt` file
 * like every other level.
 */
const ROWS = gridRows(grid);

export const VENUS: LevelDefinition = {
  name: 'Venus',
  theme: 'venus',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Its own gravity, as a share of the Earth's: near enough the real one.
  gravity: GRAVITY.venus,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
