import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';

/**
 * Jupiter, taken over by the robots. 167 tiles.
 *
 * Drifts of frozen cloud in cream and tan with a fluffy fringe, towers of cloud behind, Io and Europa going by. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Clouds that move**: wide gaps with a cloud platform sliding back and forth across each -- jump on and ride it over.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **1 of Bob's 10 parts** (`K`), faint until the cat is near, and well
 * hidden: at the end of a cloud ride from the top of a tower, on a ledge in
 * the sky. The room inside the bank of cloud holds a spare heart now; its
 * part went up to the moon's secret place.
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
  '...............................................................................................mmm~~~~~~~~~..K',
  '...........................................................................................TQQQ.............GG',
  '...........................................................................................TQQQ.............GG',
  '...........................................................................................TQQQ',
  '...........................................................................................TQQQ',
  '...........................................................................................TQQQ',
  '...........................................................................................TQQQ',
  '...........................................................................................TQQQ',
  '............................................................TG..GGGG.......................TQQQ',
  '............................................................TG..GGGG.......................TQQQ',
  '............................................................TG..GGGG.......................TQQQ',
  '.......ooo.......oooooo.....ooo.....ooo...oooooo........ooo.TG..GGGG..ooo...oooooo......oooTQQQ.................ooo..oooooo..........ooo.....oooooo.......ooo',
  '............................................................TG.....G.......................TQQQ',
  '............................................................TG....+G.......................TQQQ',
  '..P...........mmm~~~~~~~~~...h...^.....mmm~~~~~~~~~~~~...D..TGGGGGGG...h.mmm~~~~~~~~~~.....TQQQ...................mmm~~~~~~~~~~~~~~....h..mmm~~~~~~~~~~~...........E',
  '################........#################...........#######################.........################################.............###########..........#################',
  '################........#################...........#######################.........################################.............###########..........#################',
  '################........#################...........#######################.........################################.............###########..........#################',
  '################........#################...........#######################.........################################.............###########..........#################',
];

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
