import type { LevelDefinition } from '../Level';
import { GRAVITY } from '../../config';

/**
 * Inside the bar on Pluto: one warm room behind the hut's door, seen close
 * up. The aliens on their stools, the keeper behind the counter -- walk up
 * to him to order -- and the door the cat came in by, to go back out onto
 * Pluto where it left off.
 *
 * Only ever reached through that door: its place in `LEVELS` is only so
 * there is one, and it has no portal.
 */
const ROWS: string[] = [
  '______________________',
  '______________________',
  '__..................__',
  '__..................__',
  '__..................__',
  '__..................__',
  '__..................__',
  '__..................__',
  '__..................__',
  '__.n.P..a...........__',
  '######################',
  '######################',
];

export const PLUTO_BAR: LevelDefinition = {
  name: 'Bar',
  theme: 'pluto',
  groundRow: 10,
  branchesNeedTrunks: false,
  // Still on Pluto: the helmet stays on, and a game over in here is a game
  // over in space.
  helmet: true,
  gravity: GRAVITY.pluto,
  inside: 'Pluto',
  rows: ROWS,
};
