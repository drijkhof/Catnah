import type { LevelDefinition } from '../Level';
import { CANOPY } from './canopy';
import { FOREST } from './forest';
import { SWAMP } from './swamp';
import { CAVE } from './cave';
import { CITY } from './city';

/** The levels, in the order they are played. */
export const LEVELS: LevelDefinition[] = [CANOPY, FOREST, SWAMP, CAVE, CITY];
