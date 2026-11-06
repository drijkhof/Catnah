import type { LevelDefinition } from '../Level';
import { CAT } from '../../config';

/**
 * Mars, taken over by the robots. 156 tiles.
 *
 * Rust-red dust and rock under a butterscotch sky, two little moons, mesas and a great volcano on the horizon. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Sand worms** under the red dust: long dunes with a worm in each mound, that comes up to look, hunts the cat under the sand and lunges. Craters, thorns, a tower with a chain and a slab to sneak under between them.
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
  '............................................................................................................DDD',
  '........................................................................................+...................DKD',
  '......................................................................................TQQQ.................TQQQQ',
  '......................................................................................TQQQ.................TQQQQ',
  '......................................................................................TQQQ.................TQQQQ',
  '......................................................................................TQQQ.................TQQQQ',
  '......................................................................................TQQQ.................TQQQQ',
  '......................................................................................TQQQ.................TQQQQ',
  '......................................................................................TQQQ.................TQQQQ',
  '......................................................................................TQQQ.................TQQQQ',
  '........................................ooo...........................................TQQQ.................TQQQQ',
  '....................oo.................RRRRRRRRR.............oo.......................TQQQ.......oo........TQQQQ.............oo',
  '.......ooo.........................ooo.RRRRRRRRR..ooo.............................ooo.TQQQ.................TQQQQ..ooo..........................ooo',
  '.......................................RRRRRRRRR......................................TQQQ.................TQQQQ',
  '.......................................RRRRRRRRR......................................TQQQ.................TQQQQ',
  '..P...............u......u.....^^...h...............D......u..........u............h..TQQQ.....u......u....TQQQQ....h......u........u.....^^^...........E',
  '##########################################..################################....############################################################################',
  '##########################################....K#############################################################################################################',
  '#'.repeat(156),
  '#'.repeat(156),
];

export const MARS: LevelDefinition = {
  name: 'Mars',
  theme: 'mars',
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
