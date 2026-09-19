import type { LevelDefinition } from '../Level';

/**
 * Level 3: the swamp. 248 tiles, and all of it is one question: how do you get
 * over the water?
 *
 * **Eight crossings**, alternating, with a bank between each pair to stand on
 * and work out the next one. The two kinds never mix; a stretch of water has
 * one danger, not two.
 *
 * - **Crocodile water** has crocodiles lying in it and nothing else. Their
 *   backs are a floor, so the way over is to hop from one to the next -- but
 *   they are 5 to 7 tiles apart, which is most of a jump, and none of them
 *   stays up. Land on one and it takes half a second to notice, then it goes
 *   under. **A crocodile eats a cat that is in the water beside it**, and the
 *   whole pool turns and swims at you.
 * - **Piranha water** has no crocodiles and four to six fish, which is more
 *   than anything can swim past. **Lianas hang over it** and they are the whole
 *   route: jump off the bank, catch one in mid-air, leap on.
 *
 * **Nothing walks the banks.** The banks are where you stand still and work out
 * the next crossing; everything dangerous in this level is in the water.
 *
 * The lianas are five tiles long, hang low over the water and **hang from
 * nothing**. All you can do with one is cross, and the swamp has sky overhead
 * rather than a roof to climb to.
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
  '........................................T....T....T.............................................T.....T.....T...T................................................T.....T.....T.................................................T.....T....T',
  '........................................T....T....T.............................................T.....T.....T...T................................................T.....T.....T.................................................T.....T....T',
  '........................................T....T....T.............................................T.....T.....T...T................................................T.....T.....T.................................................T.....T....T',
  '........................................T....T....T.............................................T.....T.....T...T................................................T.....T.....T.................................................T.....T....T',
  '........................................T....T....T.............................................T.....T.....T...T................................................T.....T.....T.................................................T.....T....T',
  '..P',
  '.RRR.oo..................................................oo...........................................................ooo............................................................oo.........................................................oo..E',
  '############wwwCwwwwCwwwwCww########wwwwwwwwwwwwwwwwww########wwwCwwwwwCwwwwwCwwwwCw#######wwwwwwwwwwwwwwwwwwwwwwww########wwwwCwwwwwCwwwwwwCwwwwwCww#######wwwwwwwwwwwwwwwwwwwwww########wwwwCwwwwwwCwwwwwwCwwwww########wwwwwwwwwwwwwwwwwwww##########',
  '############wwwwwwwwwwwwwwww########wwfwwwfwwwfwwwfwww########wwwwwwwwwwwwwwwwwwwwww#######wwfwwwfwwwfwwwfwwwfwwwfw########wwwwwwwwwwwwwwwwwwwwwwwwww#######wwfwwwfwwwfwwwfwwwfwww########wwwwwwwwwwwwwwwwwwwwwwww########wwfwwwfwwwfwwwfwwwfw##########',
  '############wwwwwwwwwwwwwwww########wwwwwwwwwwwwwwwwww########wwwwwwwwwwwwwwwwwwwwww#######wwwwwwwwwwwwwwwwwwwwwwww########wwwwwwwwwwwwwwwwwwwwwwwwww#######wwwwwwwwwwwwwwwwwwwwww########wwwwwwwwwwwwwwwwwwwwwwww########wwwwwwwwwwwwwwwwwwww##########',
  '########################################################################################################################################################################################################################################################',
];

export const SWAMP: LevelDefinition = {
  name: 'Swamp',
  theme: 'swamp',
  widthInTiles: 248,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
