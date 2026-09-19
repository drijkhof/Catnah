import type { LevelDefinition } from '../Level';
import { FOREST } from './forest';
import { CAVE } from './cave';
import { CITY } from './city';
import { SWAMP } from './swamp';
import { CANOPY } from './canopy';
import { VOLCANO } from './volcano';

/** The levels, in the order they are played. */
export const LEVELS: LevelDefinition[] = [FOREST, CAVE, CITY, SWAMP, CANOPY, VOLCANO];
