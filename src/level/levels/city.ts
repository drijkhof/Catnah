import type { LevelDefinition } from '../Level';

/**
 * Level 1: the city. 104 tiles.
 *
 * A Dutch town on a sunny morning: a street of brick pavers, and on it a
 * row of gabled houses that are the level. A house stands on the pavement
 * and blocks it, so each one is a way through or a way over:
 *
 * - **Over**, by the steps of its gable. A low house is jumped onto; a
 *   tall one has a **drainpipe** (`T`) up its side, climbable, with the
 *   hopper at the top level with the roof -- or **awnings** (`=`) sticking
 *   out of its wall, one-way, a jump apart.
 * - **Through**, under an arcade: the upper storeys carried over the
 *   street on arches. Two rows high is walked through; one row high has
 *   to be sneaked.
 *
 * A house is one letter, and touching houses are told apart by alternating
 * `R`, `G` and `Q`. **Rats** (`r`) run the pavement between the houses and
 * under the arcades, and a canal crosses the street halfway.
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
  '.....................................................................G..+...Q',
  '....................................................................GGG....QQQ',
  '.......................oooo....................R...................GGGGG.TQQQQQ',
  '........................GG....................RRR..................GGGGG.TQQQQQ',
  '.......................GGGG..................RRRRR.oo..............GGGGG.TQQQQQ',
  '............RR.......TGGGGGG.................RRRRR..GG.............GGGGG.TQQQQQ........RR',
  '...........RRRR......TGGGGGG...............==RRRRR.GGGG............GGGGG.TQQQQQ.......RRRR',
  '..........RRRRRR.....TGGGGGG.QQ..............RRRRRGGGGGG...........GGGGG.TQQQQQ......RRRRRR...G',
  '..........RRRRRR.....TGGGGGGQQQQ...oooo......RRRRRGGGGGG.....R.....GGGGG.TQQQQQ.ooo==RRRRRR..GGG',
  '.....ooo..RRRRRR.....TGGGGGGQQQQ...........==RRRRRGGGGGG....RRR....GGGGG.TQQQQQ......RRRRRR.GGGGG',
  '..........RRRRRR.....TGGGGGGQQQQ.............RRRRRGGGGGG...RRRRR...GGGGG.TQQQQQ......RRRRRR.GGGGG',
  '.....................TGGGGGGQQQQ.............RRRRRGGGGGG...RRRRR.........TQQQQQ......RRRRRR.GGGGG',
  '..P........oooo......TGGGGGGQQQQ..........r..RRRRRGGGGGG*..RRRRR.r..ooo..TQQQQQ..r....oooo..GGGGG.r..E',
  '##################################wwwwww################################################################',
  '##################################wwwwww################################################################',
  '#'.repeat(104),
  '#'.repeat(104),
];

export const CITY: LevelDefinition = {
  name: 'City',
  theme: 'city',
  groundRow: 30,
  branchesNeedTrunks: false,
  rows: ROWS,
};
