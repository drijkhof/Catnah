import type { LevelDefinition } from '../Level';

/**
 * Level 3: the swamp. 1220 tiles, and all of it is one question: how do you get
 * over the water?
 *
 * **Thirty-five crossings**, alternating, with a bank between each pair to
 * stand on and work out the next one. The two kinds never mix; a stretch of
 * water has one danger, not two.
 *
 * - **Crocodile water** has crocodiles lying in it and nothing else. Their
 *   backs are a floor, so the way over is to hop from one to the next -- but
 *   they are 5 to 7 tiles apart, which is most of a jump, and none of them
 *   stays up. Land on one and it goes under. **A crocodile eats a cat that is
 *   in the water beside it**, and the whole pool turns and swims at you.
 * - **Piranha water** has no crocodiles and far too many fish to swim past.
 *   **Lianas hang over it**, and they are the whole route: jump off the bank,
 *   catch one in mid-air, leap to the next, and land on the far side.
 *
 * The crossings widen as the level goes on. **Nothing walks the banks** -- the
 * banks are where you stand still and work out the next crossing, and
 * everything dangerous here is in the water.
 *
 * The lianas are five tiles long, hang low over the water and **hang from
 * nothing**. All you can do with one is cross; there is no roof in this level
 * and none should ever come into view.
 */

/**
 * The grid, written out.
 *
 * Laid out once with a builder and then **frozen into this file**, so the level
 * is a fixed thing that is the same on every machine and in every run rather
 * than something computed at boot. Rows are written short and padded out to the
 * level's width by `parseLevel`, which is why the ends are ragged.
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
  '..........................................T....T....T....T.....................................................T....T....T................................................T....T....T....T....T...........................................T....T....T....T.....................................................T....T....T...................................................T....T....T....T....T.............................................T....T....T....T.........................................................T....T....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.........................................................T.....T.....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.............................................................T.....T.....T......................................................T.....T.....T.....T.....T...............................................T.....T.....T.....T.............................................................T.....T.....T',
  '..........................................T....T....T....T.....................................................T....T....T................................................T....T....T....T....T...........................................T....T....T....T.....................................................T....T....T...................................................T....T....T....T....T.............................................T....T....T....T.........................................................T....T....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.........................................................T.....T.....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.............................................................T.....T.....T......................................................T.....T.....T.....T.....T...............................................T.....T.....T.....T.............................................................T.....T.....T',
  '..........................................T....T....T....T.....................................................T....T....T................................................T....T....T....T....T...........................................T....T....T....T.....................................................T....T....T...................................................T....T....T....T....T.............................................T....T....T....T.........................................................T....T....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.........................................................T.....T.....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.............................................................T.....T.....T......................................................T.....T.....T.....T.....T...............................................T.....T.....T.....T.............................................................T.....T.....T',
  '..........................................T....T....T....T.....................................................T....T....T................................................T....T....T....T....T...........................................T....T....T....T.....................................................T....T....T...................................................T....T....T....T....T.............................................T....T....T....T.........................................................T....T....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.........................................................T.....T.....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.............................................................T.....T.....T......................................................T.....T.....T.....T.....T...............................................T.....T.....T.....T.............................................................T.....T.....T',
  '..........................................T....T....T....T.....................................................T....T....T................................................T....T....T....T....T...........................................T....T....T....T.....................................................T....T....T...................................................T....T....T....T....T.............................................T....T....T....T.........................................................T....T....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.........................................................T.....T.....T...................................................T.....T.....T.....T.....T.............................................T.....T.....T.....T.............................................................T.....T.....T......................................................T.....T.....T.....T.....T...............................................T.....T.....T.....T.............................................................T.....T.....T',
  '..P',
  '.RRR..o.o.......................o.o..................................................................o.o........................................................o.o.............................................................o.o..................................................................o.o...........................................................o.o...............................................................o.o......................................................................o.o...........................................................o.o...................................................................o.o.........................................................................o.o.............................................................o.o...................................................................o.o.............................................................................o.o................................................................o.o.....................................................................o.o.............................................................................o.o................................................................o.o......o.o..E',
  '############wwwCwwwwCwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwCwwwwCwwwwCwwwwCwww#########wwwwwwwwwwwwwwwwwww#########wwwCwwwwCwwwwCwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwCwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwCwwwwCwwwwCwwwwCwww#########wwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwCwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwwCwwwwwwCwwwwwwCwwwwwwCwww#########wwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwwCwwwwwwCwwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwwCwwwwwwCwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwwCwwwwwwCwwwwwwCwwwwwwCwww#########wwwwwwwwwwwwwwwwwwwww#########wwwCwwwwwwCwwwwwwCwwwwwwCwww#####################',
  '############wwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwwfwwwfw#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwww#########wwwwwwwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwwfwwwfwwwfww#########wwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwwfwwwfw#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwww#########wwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwwfwwwfwwwfww#########wwwwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwwfwwwfw#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwfwwwfwwwfwwww#########wwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwwwwfwwwwfwwwww#########wwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwwwwfwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwww#########wwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwwwwfwwwwfwwwww#########wwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwwwwfwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwwwwfwwwwfwwwww#########wwwwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwwwwfwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwfwwwwfwwwwfwwwwfwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwww#####################',
  '############wwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwww#########wwwwwwwwwwwwwwwwwwwwwwwwwwww#####################',
  '####################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################################',
];

export const SWAMP: LevelDefinition = {
  name: 'Swamp',
  theme: 'swamp',
  widthInTiles: 1220,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
