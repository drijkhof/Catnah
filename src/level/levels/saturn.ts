import type { LevelDefinition } from '../Level';

/**
 * Saturn, taken over by the robots: out on its rings. 124 tiles.
 *
 * Blue-white ice under a black sky, with Saturn itself filling it. Gaps in
 * the ice to jump -- falling through one costs a heart -- robots and their
 * grey blocks, and **five of Bob's ten parts** (`K`):
 *
 * 1. on the ice near the start -- easy;
 * 2. in the air over the second gap, caught in the jump;
 * 3. under the big block of ice, where only a sneaking cat goes;
 * 4. at the top of a zigzag of shelves;
 * 5. **past the portal**, on a pillar: walk into the portal and it is
 *    missed -- jump over it.
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
  '',
  '.....................................................................K',
  '....................................................................===',
  '',
  '.................................................................o',
  '................................................................===',
  '',
  '..........................................ooooo......................o',
  '........................................GGGGGGGGGGGGG...............===',
  '........................................GGGGGGGGGGGGG',
  '........................................GGGGGGGGGGGGG............o.......................................................K',
  '..............ooo..............K........GGGGGGGGGGGGG...........===............................oo.......................RRR',
  '........................................GGGGGGGGGGGGG...................................................................RRR',
  '........................................GGGGGGGGGGGGG...................................................................RRR',
  '..P.....K.............h....D..................K.........*...........................h...D.............D...h.......E.....RRR',
  '##############...#############....##########################################...###############...###########################',
  '##############...#############....##########################################...###############...###########################',
  '##############...#############....##########################################...###############...###########################',
  '##############...#############....##########################################...###############...###########################',
];

export const SATURN: LevelDefinition = {
  name: 'Saturn',
  theme: 'saturn',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Back out into space, to the map.
  next: 'space',
  rows: ROWS,
};
