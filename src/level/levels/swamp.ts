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
 * **Nothing walks the banks** -- but they are no longer a rest. A swamp of
 * nothing but crocodiles and piranhas is one idea eight times over, so the dry
 * ground now costs something too, and none of it is another set of teeth:
 *
 * - **Thorns**, in patches of two, in the middle of four banks. Deadly, and the
 *   only hazard in the game that is neither alive nor a liquid. You jump them,
 *   which means landing off a crossing and immediately setting up another jump.
 * - **Low overhangs** on two banks. A standing cat is 18 pixels and the gap is
 *   16, so the only way past is to sneak -- and one of them has the bank's
 *   hearts under it.
 * - **A boulder block** at the lip of the fifth bank, two tiles high. It cannot
 *   be walked round, so the crossing after it is taken from the top of it, and
 *   from two tiles higher than every other crossing in the level.
 * - **Crows**, over two of the liana crossings. A bird that comes at you while
 *   you are hanging over piranhas is the most dangerous thing here, and it is
 *   the only one that comes looking.
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
  '............................................................................................................................................................................................................................................',
  '............................................................................................................................................................................................................................................',
  '............................................................................................................................................................................................................................................',
  '...............................................................................................................................................................................................................................+............',
  '............................................................................................................................................................................................................................................',
  '.............................................c..............................................................c...............................................................................................................................',
  '............................................................................................................................................................................................................................................',
  '.............................c..........................................................................................c...................................................................................................................',
  '............................................................................................................................................................................................................................................',
  '................................................................................................c...........................................................................................................................................',
  '..............................................................................................................c......................................................................................................................B......',
  '............................................................................................................................................................................................................................................',
  '..........................................................................................................................................c................................................................................o................',
  '................................................c...........................................................................................................................................................................................',
  '............................................................................................................................................................................................................................................',
  '....................................................................................................o..............o........................................................................................................................',
  '............................................................................................................+....................................................................o...................................oo...................l.',
  '........................................l....l....l.............................................l.....o.....l...o.........................................................................................................................l.',
  '........................................l....l....l.............................................l...........l..........o..................................................................................................................l.',
  '........................................l....l....l........................................o....l...........l...........................................o....................B............................................................l.',
  '........................................l....l....l.............................................l...........l...........................................o........B........................................................................l.',
  '........................................l....l....l.....^^^^................................................l...........................................o..............o....................................................................',
  '..P............o..o......o..............................BBBB..........................................................RRR......o.....o......o.....o.....o.............BBB.............RR......o......o......o.....#R....R#.........o........',
  '.RRR.oo..................................................oo..*........................^^^.............................RRR.*............................^^^..........................^^RR^^........................RR^..^RR....................###....',
  '#######RRR#wwwwCwwCwwwwwwCww########wwwwwwwwwwwwwwwwww########wwwCwwwwwCwwwwwCwwwwCw#######wwwwwwwwwwwwwwwwwwwwwwww#RRRRRR#wwwwCwwwwwCwwwwwwCwwwwwCww#######wwwwwfwwwwwwwwwfwwwwwwRRRRRRRRwwwwCwwwwwwCwwwwwwCwwwwwRRR^^RRRwwwwwwwwwCwwwwwwwwww#RRRR..RRR',
  '###########wwwwwwwwwwwwwwwww########wwfwwwfwwwfwwwfwww##RRRR##wwwwwwwwwwwwwwwwwwwwww#RRR###wwfwwwfwwwfwwwwwwwwwwwww#R#RR#RRwwwwwwwwwwwwwwwwwwwwwwwwww#######wwfwwwwwwwfwwwwwwwfwwRRRRRRRRRwwwwwwwwwwwwwwwwwwwwwwww#RRRRRRRwwfwwwfwwwwwwwfwwwfw##RRR....R',
  '############wwwwwwwwwwwwwww##########wwwwwwwwwwwwwwwwRRRRRRRRRRwwwwwwwwwwwwwwwwwwwww##RRRR#wwwwwwwwwwwwwfwwwwwwwwww##RR#RR#wwwwwwwwwwwwwwwwwwwwwwwwww#######wwwwwwwwwwwwwwwwwwwwRRRRRRRRRRRwwwwwwwwwwwwwwwwwwwwww##RRRRRR###wwwwwwwwwwwwwwwwww##RRR...ER',
  '#####################################################RRRRRRRRRR#####################RRRRRRR#####################################################################################RRRRRRRRRRR#########################RRRR#########################RRRRRRR',

];

export const SWAMP: LevelDefinition = {
  name: 'Swamp',
  theme: 'swamp',
  widthInTiles: 248,
  groundRow: 26,
  branchesNeedTrunks: false,
  rows: ROWS,
};
