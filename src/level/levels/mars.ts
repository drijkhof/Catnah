import type { LevelDefinition } from '../Level';

/**
 * Mars, taken over by the robots. 124 tiles.
 *
 * Rust-red dust and rock under a butterscotch sky, two little moons in it.
 * Robots and their grey blocks, as on the moon, and **five of Bob's ten
 * parts** (`K`):
 *
 * 1. on the ground near the start -- easy;
 * 2. on a shelf at the top of the rocks;
 * 3. on top of the tall tower, up its chain;
 * 4. under the long slab of rock, where only a sneaking cat goes;
 * 5. at the top of a staircase of shelves.
 *
 * Its portal goes back out into space, to the map.
 */

/**
 * The grid, written out and frozen into this file like every other level.
 */
const ROWS: string[] = [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '..........................................................K',
  '........................................................TQQQ',
  '........................................................TQQQ',
  '........................................................TQQQ',
  '........................................................TQQQ...................................K',
  '.......................................................oTQQQ..................................===',
  '...................................K....................TQQQ',
  '.................................====...................TQQQ...............................o',
  '........................................................TQQQ..............................===',
  '..............................oo.......................oTQQQ...........ooo',
  '.............................GGG........................TQQQ..........RRRRRRRRRR.......o',
  '...........................ooGGG........................TQQQ..........RRRRRRRRRR......===.................ooo',
  '..........................RRRGGG........................TQQQ..........RRRRRRRRRR',
  '..........................RRRGGG........................TQQQ..........RRRRRRRRRR',
  '..P......K.....D......h...RRRGGG..................*.....TQQQ..D...h........K........................D...h.....D.......E',
  '########################################.ooo...#############################################################################',
  '#'.repeat(124),
  '#'.repeat(124),
  '#'.repeat(124),
];

export const MARS: LevelDefinition = {
  name: 'Mars',
  theme: 'mars',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Back out into space, to the map.
  next: 'space',
  rows: ROWS,
};
