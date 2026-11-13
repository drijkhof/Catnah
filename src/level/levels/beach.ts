import type { LevelDefinition } from '../Level';
import { gridRows } from './grid';
import grid from './beach.txt?raw';

/**
 * Level 1: the beach. 128 tiles.
 *
 * Where the desert runs out: a strip of sand with the sea behind it. The map
 * is deliberately **nearly empty** -- one of everything the beach has, so
 * each can be seen on its own before the level is laid out properly:
 *
 * - A **crab** (`h`, the hedgehog's letter here): scuttles, quicker than a
 *   hedgehog, and comes after a cat it sees.
 * - A **jellyfish** (`j`): a mine, washed up on the sand. Kills from any
 *   side.
 * - A **gull** (`c`, the crow's letter here): glides along the shore and
 *   swoops at a cat ahead of it, skimming at chest height -- duck under it.
 * - A **palm** (`T`): a tall trunk you can climb, with a crown of big fronds
 *   and a place to stand at the top.
 */
const ROWS = gridRows(grid);

export const BEACH: LevelDefinition = {
  name: 'Beach',
  theme: 'beach',
  groundRow: 20,
  branchesNeedTrunks: false,
  crowBehaviour: 'swoop',
  rows: ROWS,
};
