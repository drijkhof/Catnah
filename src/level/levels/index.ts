import type { LevelDefinition } from '../Level';
import { FOREST } from './forest';
import { CAVE } from './cave';
import { SWAMP } from './swamp';
import { CANOPY } from './canopy';
import { VOLCANO } from './volcano';
import { DESERT } from './desert';
import { BEACH } from './beach';

/**
 * The levels, in the order they are played.
 *
 * It starts at the sea and ends in the fire. The beach first, then the
 * desert behind it, then the forest and the canopy, the swamp, and the cave
 * -- which sits immediately before the volcano because it is the descent,
 * and what it descends into is the volcano. The volcano is last: its portal
 * only appears once the beetle is dead, so the beetle is the end of the game.
 */
export const LEVELS: LevelDefinition[] = [BEACH, DESERT, FOREST, CANOPY, SWAMP, CAVE, VOLCANO];
