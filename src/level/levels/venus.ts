import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';

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
  '..............................................................................+',
  '............................................................................TQQQ',
  '............................................................................TQQQ',
  '............................................................................TQQQ',
  '............................................................................TQQQ',
  '............................................................................TQQQ',
  '............................................................................TQQQ',
  '............................................................................TQQQ',
  '.........................................................TR..RRRR...........TQQQ',
  '.........................................................TR..RRRR...........TQQQ..................oooooo',
  '...............ooo.......oooo...............oooo.........TR..RRRR......oooo.TQQQ..oooo...........RRRRRRRR..oooo',
  '.......ooo..........ooo.........ooo.....ooo..........ooo.TR..RRRR..ooo......TQQQ............ooo..RRRRRRRR..........ooo',
  '.........................................................TR.....R...........TQQQ.................RRRRRRRR',
  '.........................................................TR....KR...........TQQQ.................RRRRRRRR',
  '..P..................h..............^^..D......R......h..TRRRRRRR...........TQQQ......R.......h......o........R.............E',
  '###############LLL#######LLLLL##############LLLRLLL####################LLLL#######LLLLRLLL#################LLLRLL###############',
  '###############LLL#######LLLLL##############LLLRLLL####################LLLL#######LLLLRLLL#################LLLRLL###############',
  '#'.repeat(128),
  '#'.repeat(128),
];

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
