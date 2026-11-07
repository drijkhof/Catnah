import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';

/**
 * Saturn, taken over by the robots. 146 tiles.
 *
 * Out on the rings: fractured floes of pale blue ice, Jupiter and Uranus in the black sky, spires of ice behind. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Ice**: the cat's feet barely grip, so it is slow to start, slow to stop and slides -- and past every gap there are thorns to slide into.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **2 of Bob's 10 parts** (`K`), faint until the cat is near, and well
 * hidden: one in a tunnel under a block of ice, behind thorns -- sneak
 * through both; and one in a room inside a block of ice, reached only by
 * dropping into the gap on top.
 *
 * Its portal goes back out into space.
 */

/**
 * The grid, laid out once with a throwaway script and frozen into this file
 * like every other level.
 */
const ROWS: string[] = [
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '.................................................................................................+',
  '...............................................................................................TQQQ',
  '...............................................................................................TQQQ',
  '...............................................................................................TQQQ',
  '...............................................................................................TQQQ',
  '...............................................................................................TQQQ',
  '...............................................................................................TQQQ',
  '...............................................................................................TQQQ',
  '...................................................ooo...........................TG..GGGG......TQQQ',
  '..................................................GGGGGGGGG......................TG..GGGG......TQQQ',
  '..................................................GGGGGGGGG......................TG..GGGG......TQQQ',
  '.......ooo.....ooo.........ooo..ooo..........ooo..GGGGGGGGG..ooo..ooo.........oooTG..GGGG..ooo.TQQQ..ooo...........ooo...ooo..........ooo',
  '..................................................GGGGGGGGG......................TG.....G......TQQQ',
  '..................................................GGGGGGGGG......................TG....KG......TQQQ',
  '..P....................^^...h............^^..D..^^......K.....h...........^^.....TGGGGGGG...h..TQQQ............^^....h............^^...........E',
  '###############...##############....##############################...################################.....###############....######################',
  '###############...##############....##############################...################################.....###############....######################',
  '###############...##############....##############################...################################.....###############....######################',
  '###############...##############....##############################...################################.....###############....######################',
];

export const SATURN: LevelDefinition = {
  name: 'Saturn',
  theme: 'saturn',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Its own gravity, as a share of the Earth's: near enough the real one.
  gravity: GRAVITY.saturn,
  // Ice underfoot.
  slippery: true,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
