import type { LevelDefinition } from '../Level';

/**
 * Level 10, the last: the moon. 92 tiles.
 *
 * Reached from the map at the end of the flight through space. Grey dust
 * over grey rock, a crater or two to drop into, moon rocks to climb, and
 * the sky full of stars and planets with the Earth hanging in it.
 *
 * - **Robots** (`h`, the hedgehog's letter, on the moon) roll about and
 *   come for the cat once they see it, wanting to grab it.
 * - **Grey blocks** (`D`) are where they come from: one climbs out every
 *   five seconds while the cat is near. Hold down on or beside a block and
 *   it breaks, and nothing comes out of it again.
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
  '',
  '',
  '',
  '',
  '',
  '',
  '......................................................................+',
  '................................................................oooo.===',
  '.........................oooo...................................====',
  '.........................====..............ooo',
  '..........................................=====...................................ooo',
  '......ooo........................................D',
  '..........................RR....................RRR.........................RR',
  '..P.........D.............RR.....D....h.........RRR..*..........D.D.....h...RR..D.......E',
  '##################.ooo.##################################.h...##############################',
  '#'.repeat(92),
  '#'.repeat(92),
  '#'.repeat(92),
];

export const MOON: LevelDefinition = {
  name: 'Moon',
  theme: 'moon',
  groundRow: 30,
  branchesNeedTrunks: false,
  rows: ROWS,
};
