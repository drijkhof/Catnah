import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';
import { gridRows } from './grid';
import grid from './jupiter.txt?raw';

/**
 * Jupiter, taken over by the robots. 167 tiles.
 *
 * Drifts of frozen cloud in cream and tan with a fluffy fringe, towers of cloud behind, Io and Europa going by. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Clouds that move**: wide gaps with a cloud platform sliding back and forth across each -- jump on and ride it over.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **2 of Bob's 10 parts** (`K`), faint until the cat is near, and well
 * hidden: at the end of a cloud ride from the top of a tower, on a ledge in
 * the sky; and in the room inside the bank of cloud. A coin (`$`) floats
 * over the start of a cloud ride.
 *
 * Its portal goes back out into space.
 */

/**
 * The grid, laid out once with a throwaway script and frozen into its `.txt` file
 * like every other level.
 */
const ROWS = gridRows(grid);

export const JUPITER: LevelDefinition = {
  name: 'Jupiter',
  theme: 'jupiter',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Its own gravity, as a share of the Earth's: near enough the real one.
  gravity: GRAVITY.jupiter,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
