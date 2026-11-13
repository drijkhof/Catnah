import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';
import { gridRows } from './grid';
import grid from './moon.txt?raw';

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
 * **A secret place** high over the first stretch, out of sight from the
 * ground: an island of rock with a coin (`$`) on it -- no parts on the moon -- and two grey
 * blocks, reached up three stone shelves where a few hearts lead up into
 * the dark. Six more islands hang up there along the whole level, well
 * apart, to hop between; two have a shelf to get up to them.
 *
 * **There is no portal.** The way on is Bob: he tells the cat the robots
 * have taken the planets, that he needs ten parts to stop them, and sends
 * it off in his rocket to find them on Mars and Saturn.
 *
 * - **Robots** (`h`, the hedgehog's letter, on the moon) roll about and
 *   come for the cat once they see it, wanting to grab it.
 * - **Grey blocks** (`D`) are where they come from: one climbs out every
 *   thirty seconds while the cat is near, one at a time. Hold down on or beside a block and
 *   it breaks, and nothing comes out of it again.
 */

/**
 * The grid, written out and frozen into its `.txt` file like every other level.
 */
const ROWS = gridRows(grid);

export const MOON: LevelDefinition = {
  name: 'Moon',
  theme: 'moon',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air: the cat wears its space helmet here.
  helmet: true,
  // A sixth of the Earth's, as on the real moon.
  gravity: GRAVITY.moon,
  rows: ROWS,
};
