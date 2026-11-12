import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';

/**
 * Pluto, taken over by the robots. 115 tiles.
 *
 * Beige rock with white frost along every top, Neptune and its moon in the sky, so far out the sun is a star. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Crumbling ice**: gaps bridged by blocks of ice that crack and fall once stood on -- run! -- and crumbling steps up to ledges over pits. They come back after a while.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **1 of Bob's 10 part** (`K`), faint until the cat is near, and well
 * hidden: under the floor: fall through a crumbling bridge onto a ledge
 * down in the pit, and off the ledge a tunnel runs on with the part in it,
 * and a way back up.
 *
 * **The aliens' bar** is a hut of ice right at the start (`n`, its door):
 * walk in through the door and the bar is inside (`pluto-bar.ts`).
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
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '................................ooo...............................................ooo',
  '..............................Z.RRR.............................................Z.RRR',
  '.......ooo......................RRR...............................................RRR',
  '............................Z...RRR...........................................Z...RRR',
  '...............oooo..ooo........RRR..ooo.oooo....ooo....................ooo.......RRR..ooo..oooo......ooo',
  '..........................Z.....RRR.........................................Z.....RRR',
  '................................RRR...............................................RRR',
  '..P...n...............h.........RRR..D............h...^^..........................RRR...h......................E',
  '###############ZZZZ######.......#########ZZZZZZ###########ZZZZZZZZZ#..#####.......##########ZZZZZZZZ###############',
  '###############....######.......#########......###########............#####.......##########........###############',
  '###############....######.......#########......###########.........K..#####.......##########........###############',
  '###############....######.......#########......###########...RRRRRR########.......##########........###############',
];

export const PLUTO: LevelDefinition = {
  name: 'Pluto',
  theme: 'pluto',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Its own gravity, as a share of the Earth's: near enough the real one.
  gravity: GRAVITY.pluto,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
