import type { LevelDefinition } from '../Level';
import { FOREST } from './forest';
import { CAVE } from './cave';
import { CITY } from './city';
import { SWAMP } from './swamp';
import { CANOPY } from './canopy';
import { VOLCANO } from './volcano';

/**
 * The levels, in the order they are played.
 *
 * The cave sits second to last, not second. It is the descent, and what it
 * descends into is the volcano -- so it has to be the thing you do immediately
 * before arriving there.
 */
export const LEVELS: LevelDefinition[] = [FOREST, CITY, SWAMP, CANOPY, CAVE, VOLCANO];
