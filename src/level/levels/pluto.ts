import type { LevelDefinition } from '../Level';
import { CAT } from '../../config';

/**
 * Pluto, taken over by the robots. 108 tiles.
 *
 * Beige rock with white frost along every top, Neptune and its moon in the sky, so far out the sun is a star. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Crumbling ice**: gaps bridged by blocks of ice that crack and fall once stood on -- run! -- and crumbling steps up to ledges over pits. They come back after a while.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **1 of Bob's 10 part** (`K`), faint until the cat is near: down a hole in the ground, along a low pocket only a sneaking cat gets down.
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
  '................................ooo........................................ooo',
  '..............................Z.RRR......................................Z.RRR',
  '................................RRR........................................RRR',
  '............................Z...RRR....................................Z...RRR',
  '.......ooo.....oooo..ooo........RRR..ooo.oooo....ooo.........ooo...........RRR..ooo..oooo......ooo',
  '..........................Z.....RRR..................................Z.....RRR',
  '................................RRR........................................RRR',
  '..P...................h.........RRR..D............h..............^^........RRR...h......................E',
  '###############ZZZZ######.......#########ZZZZZZ######..#############.......##########ZZZZZZZZ###############',
  '###############....######.......#########......######.....K#########.......##########........###############',
  '###############....######.......#########......#####################.......##########........###############',
  '###############....######.......#########......#####################.......##########........###############',
];

export const PLUTO: LevelDefinition = {
  name: 'Pluto',
  theme: 'pluto',
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
