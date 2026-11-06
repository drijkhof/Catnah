import type { LevelDefinition } from '../Level';

/**
 * Level 10: the moon. 179 tiles.
 *
 * Reached from the map at the end of the flight through space. Grey dust
 * over grey rock, craters to drop into, moon rocks to climb, and the sky
 * full of stars and planets with the Earth hanging in it. After the first
 * stretch: a staircase of rock up to a plateau with a block on it, a wide
 * crater with robots in the bottom and shelves over it, a chain up a tall tower
 * for a spare heart, a last run of blocks, and at the end the **moon base**
 * (`M`) with a laboratory inside and Bob in it. American flags (`F`) stand
 * planted in the dust.
 *
 * **There is no portal.** The way on is Bob: he tells the cat the robots
 * have taken the planets, that he needs ten parts to stop them, and sends
 * it off in his rocket to find them on Mars and Saturn.
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
  '...................................................................................................................................oTGGG',
  '......................................................................+........................o...D...oo...........................TGGG',
  '................................................................oooo.===......................RRRGGGGGGGG..............ooo..........TGGG.........................MMMMMMMMMMMMMMMM',
  '.........................oooo...................................====........................o.RRRGGGGGGGG.ooo.........====......oo..TGGG.........................M..............M',
  '.........................====..............ooo.............................................QQQRRRGGGGGGGG.===..................RRR..TGGG...............ooo.......M...ooo........M',
  '..........................................=====...................................ooo....o.QQQRRRGGGGGGGG........====..........RRR..TGGG.....ooo......=====......M...====.......M',
  '......ooo........................................D......................................GGGQQQRRRGGGGGGGG...===................RRR..TGGG.........................M..............M',
  '..........................RR....................RRR.........................RR..........GGGQQQRRRGGGGGGGG......................RRR..TGGG',
  '..P.....F...D.............RR.....D....h.........RRR..*..........D.D.....h...RR..D.......GGGQQQRRRGGGGGGGG..................*...RRRD.TGGG...D....h..D........D..F..........oo.*',
  '##################.ooo.##################################.h...##################################################..hoo.h..##########################################################',
  '#'.repeat(179),
  '#'.repeat(179),
  '#'.repeat(179),
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
