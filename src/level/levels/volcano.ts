import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './volcano.txt?raw';

/**
 * Level 7, the last: the volcano. 104 tiles.
 *
 * The floor is a lava lake and only the islands are safe, so most of the level
 * reads as somewhere not to land rather than somewhere to walk. Chains hang
 * over the gaps where there is nothing living left to climb, bolted to rings in
 * the roof of nothing.
 *
 * Nothing walks the lava fields. The only living thing here is what waits at
 * the end of it.
 *
 * It ends at the volcano itself: a cone of rock with a crater notch at the top
 * and a mouth at ground level. Inside is the lair of the **evil lord beetle** --
 * one long enclosed floor, not more islands, because a boss you cannot step
 * aside from is not a fight. The way out is at the far end of the arena.
 */

/**
 * The grid, written out.
 *
 * Laid out once and then **frozen into its `.txt` file**, so the level is a fixed
 * thing -- the same on every machine, in every run, for every player -- rather
 * than something computed at boot. Rows are written short and padded out to the
 * level's width by `parseLevel`, which is why the right-hand ends are ragged.
 */
const ROWS = gridRows(grid);

export const VOLCANO: LevelDefinition = {
  name: 'Volcano',
  theme: 'volcano',
  groundRow: 32,
  branchesNeedTrunks: false,
  rows: ROWS,
};
