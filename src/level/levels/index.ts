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
import { MOON } from './moon';
import { MARS } from './mars';
import { SATURN } from './saturn';
import { JUPITER } from './jupiter';
import { VENUS } from './venus';
import { URANUS } from './uranus';
import { NEPTUNE } from './neptune';
import { PLUTO } from './pluto';
import { PLUTO_BAR } from './pluto-bar';
import { YOUTUBE } from './youtube';
import { INSTA } from './insta';
import { FACEBOOK } from './facebook';
import { GOOGLE } from './google';
import { DARKWEB } from './darkweb';

/**
 * The levels, in the order they are played.
 *
 * Out of town and into the wild, through the fire, and out the other side
 * to the sea. The city first, then the forest and the canopy, the swamp,
 * and the cave -- which sits immediately before the volcano because it is
 * the descent, and what it descends into is the volcano. The volcano's
 * portal only appears once the beetle is dead, and it leads out into the
 * desert, then the beach, and last the sand path, which ends at the big
 * portal. That one sends the cat off into space, past the planets, to a map,
 where only the Moon can be picked. On the moon Bob tells it the robots have
 taken the planets and sends it off in his rocket for the ten parts he
 needs: back on the map, Mars and Saturn are open, five parts on each, and
 each one's portal goes back to the map. Leaving a planet with all ten is
 the end of the game. Mars and Saturn, and the other worlds the robots hold -- Jupiter, Venus,
 Uranus, Neptune and Pluto, with no parts on them -- are only reached from the
 map; their
 place in this list is only so there is one. So is the bar's, inside its
 hut on Pluto, which is only reached through its door.
 */
export const LEVELS: LevelDefinition[] = [CITY, FOREST, CANOPY, SWAMP, CAVE, VOLCANO, DESERT, BEACH, PATH, MOON, MARS, SATURN, JUPITER, VENUS, URANUS, NEPTUNE, PLUTO, PLUTO_BAR, YOUTUBE, INSTA, FACEBOOK, GOOGLE, DARKWEB];
