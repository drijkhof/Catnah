import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';
import { gridRows } from './grid';
import grid from './mars.txt?raw';

/**
 * Mars, taken over by the robots. 243 tiles.
 *
 * Rust-red dust and rock under a butterscotch sky, two little moons, mesas and a great volcano on the horizon. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Sand worms** under the red dust: long dunes with a worm in each mound, that comes up to look, hunts the cat under the sand and lunges. Craters, thorns, a tower with a chain and a slab to sneak under between them.
 * And, since a jump on Mars goes high and far, big obstacles: three wide
 * **canyons** with a rock pillar in each, two **stairs of boulders** with
 * thorns in the sand between, and long beds of thorns.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **2 of Bob's 10 parts** (`K`), faint until the cat is near, and well
 * hidden: one under a long slab of rock, down a hole only a sneaking cat
 * finds and along a low pocket; and one shut in a cage of grey blocks on
 * top of a tall tower, up its chain.
 *
 * Its portal goes back out into space.
 */

/**
 * The grid, laid out once with a throwaway script and frozen into its `.txt` file
 * like every other level.
 */
const ROWS = gridRows(grid);

export const MARS: LevelDefinition = {
  name: 'Mars',
  theme: 'mars',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Its own gravity, as a share of the Earth's: near enough the real one.
  gravity: GRAVITY.mars,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
