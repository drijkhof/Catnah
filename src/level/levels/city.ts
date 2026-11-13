import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './city.txt?raw';

/**
 * Level 1: the city. 104 tiles.
 *
 * A Dutch town at night, in the rain: a street of brick pavers, and on it a
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
 * `R`, `G` and `Q`. **Rats** (`r`) run the pavement between the houses in
 * the middle of the street, two to a gap past the checkpoint; the first
 * stretch and the last one before the portal are free of them, so the level
 * starts gently and ends without a rat on the doorstep. No water anywhere.
 */

/**
 * The grid, written out.
 *
 * Laid out once with a throwaway script and then **frozen into its `.txt` file**,
 * so the level is a fixed thing -- the same on every machine, in every run,
 * for every player -- rather than something computed at boot. Rows are
 * written short and padded out to the level's width by `parseLevel`, which
 * is why the right-hand ends are ragged.
 */
const ROWS = gridRows(grid);

export const CITY: LevelDefinition = {
  name: 'City',
  theme: 'city',
  groundRow: 30,
  branchesNeedTrunks: false,
  rows: ROWS,
};
