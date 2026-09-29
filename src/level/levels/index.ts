import type { LevelDefinition } from '../Level';
import { FOREST } from './forest';
import { CAVE } from './cave';
import { CITY } from './city';
import { SWAMP } from './swamp';
import { CANOPY } from './canopy';
import { VOLCANO } from './volcano';
import { DEV_TEST_1 } from './devTest1';

/**
 * The levels, in the order they are played.
 *
 * The cave sits second to last, not second. It is the descent, and what it
 * descends into is the volcano -- so it has to be the thing you do immediately
 * before arriving there.
 */
// TEMPORARY: the cave first, to test whether its lag on a phone is the cave's
// own or something the earlier levels leave behind. Restore to
// [FOREST, CANOPY, SWAMP, CAVE, VOLCANO, CITY] afterwards.
export const LEVELS: LevelDefinition[] = [CAVE, FOREST, CANOPY, SWAMP, VOLCANO, CITY];

// Dev-only test levels, appended past the real game so a player never reaches
// one by simply finishing City -- except in a dev build, where finishing it
// is exactly how you would want to land on the next thing to test. The `if`
// has to wrap the `.push`, not just the import: `DEV_TEST_1` is inert data
// with no call site to hide behind the way `installLevelSkip` hides a
// function, so what makes it provably unreachable in production is this
// branch being dead code, not the import above.
if (import.meta.env.DEV) {
  LEVELS.push(DEV_TEST_1);
}
