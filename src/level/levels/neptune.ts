import type { LevelDefinition } from '../Level';
import { CAT } from '../../config';

/**
 * Neptune, taken over by the robots. 130 tiles.
 *
 * Deep blue ice under a black sky with Uranus and Pluto in it, blue spires behind. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Seas to swim**, three deep, with alien fish in them -- and a spare heart on the bottom of the first. A tower and a slab between them.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **1 of Bob's 10 part** (`K`), faint until the cat is near, and well
 * hidden: in an underwater cave off the bottom of a sea, running on under
 * the floor.
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
  '..............................................................+',
  '............................................................TQQQ',
  '............................................................TQQQ',
  '............................................................TQQQ',
  '............................................................TQQQ',
  '............................................................TQQQ',
  '............................................................TQQQ',
  '............................................................TQQQ',
  '............................................................TQQQ',
  '............................................................TQQQ.................................oooooo',
  '............................................................TQQQ................................RRRRRRRR',
  '.......ooo...............ooo......ooo...............ooo..oooTQQQ..ooo......................ooo..RRRRRRRR.............ooo',
  '............................................................TQQQ................................RRRRRRRR',
  '............................................................TQQQ................................RRRRRRRR',
  '..P.......................h...^^.....................D....h.TQQQ.............................h......o.........................E',
  '###############wwwwwwww###############wwwwwwwwwwww#####################wwwwwwwwwwww#######################wwwwwwwww###############',
  '###############wwwwfwww###############wwfwwwwwwwfw#####################wwwfwwwwfwwwwwwwww#################wwfwwwwfw###############',
  '###############wwwWwwww###############wwwwwWwwwwww#####################wwwwwwwwwwwwwwwwwK#################wwwWwwwww###############',
  '#'.repeat(130),
];

export const NEPTUNE: LevelDefinition = {
  name: 'Neptune',
  theme: 'neptune',
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
