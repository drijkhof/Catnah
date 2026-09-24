import type { LevelDefinition } from '../Level';

/**
 * Level 1: a sunlit forest. 90 tiles.
 *
 * Every branch grows from a trunk here and `branchesNeedTrunks` holds the
 * parser to it. The later levels have no trees, so their ledges stand on their
 * own.
 *
 * **You cannot climb a tree.** The trunks are still drawn, still walked
 * straight through, and their crowns are still something to stand on -- the way
 * *up* a tree is its branches, four rows apart and alternating sides, which is
 * 64px a step against a 90px jump.
 *
 * Near the end stands the great tree, with the crow's nest at the top of it and
 * the spare heart in the nest.
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
  '..........................................................c',
  '..........................................................+.',
  '.........................................................NNN',
  '..........................................................T',
  '..........................................................T',
  '.................c........................................T',
  '......................................................ooo.T',
  '......................................................====T',
  '..........................................................T',
  '..........................................................T',
  '..........................................................Tooo',
  '..........................................................T=====',
  '..........................................................T',
  '..........................................................T',
  '......................................................ooo.T......oo...oo',
  '......................................................====T......RR...RR',
  '..............................T...........................T......RR...RR...........ooo',
  '..............................Too.........................T......RR...RR..........T=====',
  '..............................T=====......................Tooo...RR...RR..........T',
  '..........T...............ooo.T.............T.............T=====.RR...RR..........T',
  '..........Tooo............====T.............Tooo..........T......RR...RR......ooo.T',
  '..........T=====..............T.............T====.........T......RR...RR......====T',
  '......ooo.T...................T.........ooo.T.........ooo.T......RR...RR..........T',
  '......====T...................T.........====T........oo===T......RR...RR..........T',
  '..........T.......o.o.........T.......ooo...T.......RRRRRRT......RR...RR..........T',
  '..........T......RRRRRR.BBBBBBT......RRRRRR.T.......RRRRRRT......RR...RR..........T',
  '...P......T......RRRRRR.......T...h..RRRRRR.T.......RRRRRRT....h.RR...RR..........T.....E',
  '#####wwwww####################################wwwfw######################wwfww############',
  '##############################################wfwww######################wwwww############',
  '#########################################################################wwwww############',
  '##########################################################################################',
];

export const FOREST: LevelDefinition = {
  name: 'Forest',
  theme: 'forest',
  widthInTiles: 90,
  groundRow: 30,
  branchesNeedTrunks: true,
  // You cannot climb a tree. The way up one is its branches, which is why
  // every branch here grows out of a trunk.
  climbableColumns: false,
  rows: ROWS,
};
