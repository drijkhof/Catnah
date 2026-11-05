import type { LevelDefinition } from '../Level';
import { CITY } from './city';
import { FOREST } from './forest';
import { CAVE } from './cave';
import { SWAMP } from './swamp';
import { CANOPY } from './canopy';
import { VOLCANO } from './volcano';
import { DESERT } from './desert';
import { BEACH } from './beach';
import { PATH } from './path';

/**
 * The levels, in the order they are played.
 *
 * Out of town and into the wild, through the fire, and out the other side
 * to the sea. The city first, then the forest and the canopy, the swamp,
 * and the cave -- which sits immediately before the volcano because it is
 * the descent, and what it descends into is the volcano. The volcano's
 * portal only appears once the beetle is dead, and it leads out into the
 * desert, then the beach, and last the sand path, which ends at the big
 * portal: that one is the end of the game.
 */
export const LEVELS: LevelDefinition[] = [CITY, FOREST, CANOPY, SWAMP, CAVE, VOLCANO, DESERT, BEACH, PATH];
