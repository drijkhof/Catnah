import type { LevelDefinition } from '../Level';
import { CAT } from '../../config';

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
 * The grid, laid out once with a throwaway script and frozen into this file
 * like every other level.
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
  '.............................................................................+',
  '...........................................................................TQQQ',
  '...........................................................................TQQQ',
  '...........................................................................TQQQ',
  '...........................................................................TQQQ',
  '...........................................................................TQQQ',
  '...........................................................................TQQQ',
  '...........................................................................TQQQ',
  '.........................................................R..RRRR...........TQQQ',
  '.........................................................R..RRRR...........TQQQ..................oooooo',
  '...............ooo.......oooo...............oooo.........R..RRRR......oooo.TQQQ..oooo...........RRRRRRRR..oooo',
  '.......ooo..........ooo.........ooo.....ooo..........ooo.R..RRRR..ooo......TQQQ............ooo..RRRRRRRR..........ooo',
  '.........................................................R.....R...........TQQQ.................RRRRRRRR',
  '.........................................................R....KR...........TQQQ.................RRRRRRRR',
  '..P..................h..............^^..D......R......h..RRRRRRR...........TQQQ......R.......h......o........R.............E',
  '###############LLL#######LLLLL##############LLLRLLL###################LLLL#######LLLLRLLL#################LLLRLL###############',
  '###############LLL#######LLLLL##############LLLRLLL###################LLLL#######LLLLRLLL#################LLLRLL###############',
  '#'.repeat(127),
  '#'.repeat(127),
];

export const VENUS: LevelDefinition = {
  name: 'Venus',
  theme: 'venus',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Off the Earth: lighter, so the cat jumps higher.
  gravity: CAT.offEarthGravity,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
