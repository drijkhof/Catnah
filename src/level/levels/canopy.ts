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
  '.......T...............T.............TTTTT..............T',
  '.......T...............T.............TTTTT..............T',
  '.......T...............T.............ooooo..............T',
  '.......To..............To............TTTTT..............To',
  '.......T...............T.............TTTTT..............T',
  '.......T...............T......ooo....TTTTT..............T',
  '.......T...............T.....=====...TTTTT..............T',
  '.......T...............T.............TTTTT..............T......oEo',
  '.......To.....ooo......To............TTTTT..............To....=====',
  '.......T.....=====.....T.............TTTTT..............T',
  '.......T...............T.............TTTTT.....ooo......T',
  '.......T...............T.............TTTTT....=====.....T',
  '.......T.............................TTTTT..............T',
  '.......To............................TTTTT..............T',
  '.......T.............................TTTTT..............T',
  '.......T.............................TTTTT',
  '.......T.............................TTTTT',
  '.......T.............................TTTTT',
  '.......To',
  '.......T',
  '.......T',
  '..P....T',
  '.RRR..............................h',
  '##############################################################################',
  '##############################################################################',
  '##############################################################################',
  '##############################################################################',
];

export const CANOPY: LevelDefinition = {
  name: 'Canopy',
  theme: 'jungle',
  widthInTiles: 78,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
