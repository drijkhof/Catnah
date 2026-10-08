import type { LevelDefinition } from '../Level';

/**
 * Level 2: the desert. 108 tiles.
 *
 * Sand and sandstone under a white sun, with pyramids on the skyline. Flat
 * going, mostly, with low dunes of stacked sand to climb and a few shelves
 * of sandstone to jump between; nothing here hunts you. What there is:
 *
 * - **Camels** (`k`) stand on the flats and hurt nobody. You jump on their
 *   backs and stand there.
 * - **Mounds** (`u`) with a **worm** in each: every few seconds it comes up
 *   out of the sand, stands tall for a moment, and sinks again. The part
 *   that is out kills.
 * - **Cacti** (`Y`), two tiles tall, deadly to touch from any side. No
 *   crawling under one and no jumping out of one.
 * - A few **rocks** (`R`), to climb and to wall-jump off.
 */

/**
 * The grid, written out.
 *
 * Laid out once with a throwaway script and then **frozen into this file**,
 * so the level is a fixed thing -- the same on every machine, in every run,
 * for every player -- rather than something computed at boot. Rows are
 * written short and padded out to the level's width by `parseLevel`, which
 * is why the right-hand ends are ragged.
 */
const ROWS: string[] = [
  '',
  '',
  '',
  '',
  '',
  '',
  '.............................................................................................................',
  '...................................................................................+.........................',
  '.................................................................................=====.......................',
  '.............................................................................................................',
  '..........................................................................oo.................................',
  '......................................ooo....................................................................',
  '.....................................=====..........................oo.......................................',
  '............................................................o................................................',
  '...........................ooo.............................===...............................................',
  '..........................=====..............................................................................',
  '.............................................................................................................',
  '.....................................................................................u...Y...................',
  '...................................................................................RR#RR.Y...................',
  '..P.....k......Y.....k......Y......u....k.......Y......Y..u......u......u.....k....RRRRR.Y....u...........E..',
  '#############################################################################################################',
  '#############################################################################################################',
  '#############################################################################################################',
  '#############################################################################################################',
];

export const DESERT: LevelDefinition = {
  name: 'Desert',
  theme: 'desert',
  groundRow: 20,
  branchesNeedTrunks: false,
  rows: ROWS,
};
