import type { LevelDefinition } from '../Level';
import { CAT } from '../../config';

/**
 * Mars, taken over by the robots. 160 tiles.
 *
 * Rust-red dust and rock under a butterscotch sky, two little moons, mesas and a great volcano on the horizon. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Sand worms** under the red dust: long dunes with a worm in each mound, that comes up to look, hunts the cat under the sand and lunges. Craters, thorns, a tower with a chain and a slab to sneak under between them.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **2 of Bob's 10 parts** (`K`), faint until the cat is near: down a hole in the ground, along a low pocket only a sneaking cat gets down, and in a cage of grey blocks -- break one to get in.
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
  '.....................................................................................+',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ',
  '...................................................................................TQQQ............................oooooo',
  '....................oo....................................oo.......................TQQQ.......oo..................RRRRRRRR.......oo',
  '.......ooo.........................ooo.........ooo.............................ooo.TQQQ......................ooo..RRRRRRRR.........................ooo',
  '...................................................................................TQQQ...........................RRRRRRRR',
  '...................................................................................TQQQ.................DDD.......RRRRRRRR',
  '..P...............u......u.....^^...h............D......u..........u............h..TQQQ.....u......u....DKD....h......o........u........u.....^^^...........E',
  '#######################################..################################....###################################################################################',
  '#######################################.....K###################################################################################################################',
  '#'.repeat(160),
  '#'.repeat(160),
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
