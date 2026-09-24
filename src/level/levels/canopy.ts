import type { LevelDefinition } from '../Level';

/**
 * Level 4: the canopy. 78 tiles, and one idea all the way through it.
 *
 * Built around **jumping off a liana onto a platform out of its reach**. The
 * lianas hang from the roof rather than standing on the floor, and every
 * platform is far too high to be reached from the ground -- the best jump from
 * down there falls 138px short -- so there is no way through that does not
 * involve letting go in mid-air.
 *
 * In the middle, **five lianas hang side by side**: holding on is not pinned to
 * one rope, so that stretch is crossed sideways as much as it is climbed.
 *
 * The cat starts on a small boulder. A hedgehog paces the floor it would
 * otherwise start on, and nothing should be able to kill a player who has not
 * touched the controls yet.
 */

/**
 * The grid, written out.
 *
 * Laid out once and then **frozen into this file**, so the level is a fixed
 * thing -- the same on every machine, in every run, for every player -- rather
 * than something computed at boot. Rows are written short and padded out to the
 * level's width by `parseLevel`, which is why the right-hand ends are ragged.
 */
const ROWS: string[] = [
  '##############################################################################',
  '##############################################################################',
  '##############################################################################',
  '.......l...............l.............lllll..............l',
  '.......l...............l.............lllll..............l',
  '.......l...............l.............lllll..............l',
  '.......lo..............lo............lllll..............lo',
  '.......l...............l.............lllll..............l',
  '.......l...............l......ooo....lllll..............l',
  '.......l...............l.....=====...lllll..............l',
  '.......l...............l.............lllll..............l......oEo',
  '.......lo.....ooo......lo............lllll..............lo....=====',
  '.......l.....=====.....l.............lllll..............l',
  '.......l...............l.............lllll.....ooo......l',
  '.......l...............l.............lllll....=====.....l',
  '.......l.............................lllll..............l',
  '.......lo............................lllll..............l',
  '.......l.............................lllll..............l',
  '.......l.............................lllll',
  '.......l..................................',
  '.......l..................................',
  '.......lo.....................................................................',
  '.......l.....................................................................',
  '.......l...............................................................RR....',
  '..P....l................................................................RR...',
  '.RRR..............h...............h...............h.....................RR....',
  '######################www####wwww#######wwwwwwwwww##########wwwwwwwwwwww######',
  '##########RRR######################RR######wwwww#############wwwwwwwwww#######',
  '########RRR##########R#######################ww#############wwwwwwwwwww#######',
  '##############################R###############################################',

];

export const CANOPY: LevelDefinition = {
  name: 'Canopy',
  theme: 'jungle',
  widthInTiles: 78,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
