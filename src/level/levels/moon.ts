import type { LevelDefinition } from '../Level';

/**
 * Level 10, the last: the moon. 192 tiles.
 *
 * Reached from the map at the end of the flight through space. Grey dust
 * over grey rock, craters to drop into, moon rocks to climb, and the sky
 * full of stars and planets with the Earth hanging in it. After the first
 * stretch: a staircase of rock up to a plateau with a block on it, a wide
 * crater with robots in the bottom and shelves over it, a chain up a tall tower
 * for a spare heart, a **moon base** (`M`) with doors at both ends and a
 * laboratory inside, and a last run of blocks to the way out. American
 * flags (`F`) stand planted in the dust.
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
  '......................................................................................................................................+',
  '....................................................................................................................................TGGG',
  '...................................................................................................................................oTGGG',
  '....................................................................................................................................TGGG',
  '....................................................................................................................................TGGG',
  '...................................................................................................................................oTGGG...MMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  '......................................................................+........................o...D...oo...........................TGGG...MMMMMMMMMMMMMMMMMMMMMMMMMMMM',
  '................................................................oooo.===......................RRRGGGGGGGG..............ooo..........TGGG...MM........................MM',
  '.........................oooo...................................====........................o.RRRGGGGGGGG.ooo.........====......oo..TGGG...MM................ooo.....MM',
  '.........................====..............ooo.............................................QQQRRRGGGGGGGG.===..................RRR..TGGG...MM....ooo........====.....MM..............ooo',
  '..........................................=====...................................ooo....o.QQQRRRGGGGGGGG........====..........RRR..TGGG...MM....====................MM....ooo......=====',
  '......ooo........................................D......................................GGGQQQRRRGGGGGGGG...===................RRR..TGGG...MM........................MM',
  '..........................RR....................RRR.........................RR..........GGGQQQRRRGGGGGGGG......................RRR..TGGG',
  '..P.....F...D.............RR.....D....h.........RRR..*..........D.D.....h...RR..D.......GGGQQQRRRGGGGGGGG..................*...RRRD.TGGG.F............ooo.........*......D....h..D........D..E',
  '##################.ooo.##################################.h...##################################################..hoo.h..#######################################################################',
  '#'.repeat(192),
  '#'.repeat(192),
  '#'.repeat(192),
];

export const MOON: LevelDefinition = {
  name: 'Moon',
  theme: 'moon',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air: the cat wears its space helmet here.
  helmet: true,
  rows: ROWS,
};
