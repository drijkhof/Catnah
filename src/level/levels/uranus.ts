import type { LevelDefinition } from '../Level';
import { CAT } from '../../config';

/**
 * Uranus, taken over by the robots. 101 tiles.
 *
 * Pale cyan ice laid in tiles, Saturn and Neptune in the black sky, cyan spires behind. Flown to in Bob's rocket.
 *
 * Its own obstacle, found on no other world: **Bounce pads**: step on one and it throws you high -- over walls too tall to jump, and up to shelves too high to reach.
 * Robots and their grey blocks, as on every robots' world.
 *
 * **1 of Bob's 10 part** (`K`), faint until the cat is near, and well
 * hidden: on a shelf above the top of the screen, reached only off a bounce
 * pad.
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
  '...........................................................ooo..K',
  '...........................ooo...........................========',
  '..........................=====....................................................ooo',
  '...................................................................................GGG',
  '................................................ooo................................GGG',
  '................................................GGG................................GGG',
  '................................................GGG................................GGG',
  '.................ooo............................GGG................................GGG',
  '.................GGG............................GGG................................GGG',
  '.................GGG............................GGG................................GGG',
  '.................GGG............................GGG................................GGG',
  '.................GGG............................GGG................................GGG',
  '.................GGG............................GGG................................GGG',
  '.......ooo.......GGG..ooo........ooo.ooo..ooo...GGG..ooo...........ooo.ooo...ooo...GGG..ooo',
  '.................GGG............................GGG................................GGG',
  '.................GGG............................GGG................................GGG',
  '..P............J.GGG...h...J..............D...J.GGG...h...J..................Dh..J.GGG...........E',
  '#####################################...###############################....##########################',
  '#####################################...###############################....##########################',
  '#####################################...###############################....##########################',
  '#####################################...###############################....##########################',
];

export const URANUS: LevelDefinition = {
  name: 'Uranus',
  theme: 'uranus',
  groundRow: 30,
  branchesNeedTrunks: false,
  // No air.
  helmet: true,
  // Off the Earth: lighter, so the cat jumps higher.
  gravity: CAT.offEarthGravity,
  // Back out into space.
  next: 'space',
  rows: ROWS,
};
