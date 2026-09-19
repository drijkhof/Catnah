import type { LevelDefinition } from '../Level';

/**
 * Level 2: the city, at night. 450 tiles.
 *
 * **Houses as well as flats.** A city made only of tower blocks is one building
 * repeated: the terraces here are plastered walls under pitched pantile roofs
 * with chimneys on them, and the flats behind are brick and sixteen storeys and
 * flat on top. The skyline is the point.
 *
 * Built at the scale of the thing walking through it. The cat is 22x18 game
 * pixels; a parked car is two tiles tall and five long and a block of flats is
 * twenty-one storeys.
 *
 * **The alleys are the way up.** A building stands on the pavement and blocks
 * it, and the gaps between them are three tiles wide -- which is a wall-jump
 * shaft, the same one the forest teaches. Awnings and balconies step up the
 * faces of the tall ones, a few houses have a passage cut through at street
 * level, and there are four drainpipes in the whole city for the climbs that
 * are too tall for anything else.
 *
 * Twelve pieces, no two the same: a street with a stoop and a low house; a
 * terrace of three with alleys between them; a flat with balconies alternating
 * up its face; **the canal**, crossed on three awnings because nothing swims
 * here; two flats with an alley that has no way through at street level; houses
 * with passages cut through them; a zigzag of balconies; **the tallest building
 * in the city**, with the crow's nest and the spare heart on top; a rank of
 * parked cars to hop along; a long terrace of roofs at four different heights;
 * one last alley, taller and narrower; and the way out.
 *
 * Girders are not branches: `solidPlatforms` is on, so you cannot pass up
 * through an awning -- it is something you come at from the side.
 */

/**
 * The grid, written out.
 *
 * Laid out once with a throwaway script and then **frozen into this file**, so
 * the level is a fixed thing -- the same on every machine, in every run, for
 * every player. Rows are written short and padded out to the level's width by
 * `parseLevel`, which is why the right-hand ends are ragged.
 */
const ROWS: string[] = [
  '',
  '............................................................................................................................................................................................................................................................................................c',
  '',
  '',
  '...........................................................................................................................................................................................................................................................................................N+N',
  '',
  '................................................................................................................................................................................................................................................................................................RRRR',
  '............................................................................................................................................................................................................................................................................................RRRRRRRR',
  '.................................................................................................................................................................................................................................................ooo...............................T....RRRRRRRRRRRR',
  '.....................................................................................ooo...........................................................................................................................................................................................TRRRRRRRRRRRRRRRR',
  '.......................................................................................................................................................................................................................................................RRRR........................TRRRRRRRRRRRRRRRR....................................................................................................ooo',
  '.............................................................................................RRR...................................................................................................................................................RRRRRRRR........................TRRRRRRRRRRRRRRRR.............................................................................................................===',
  '.........................................................................................RRRRRRRT.............................................................................................................................................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR................................................................................................RRRRRRRRRRRRR...RRRRRRRRRRRRR',
  '......................................................................................RRRRRRRRRRT===..........................................................................ooo.............................................................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR................................................................................................RRRRRRRRRRRRR...RRRRRRRRRRRRR',
  '..................................................................................RRRRRRRRRRRRRRT......................................................................................T......................................................RRRRRRRRRRRRR====....................TRRRRRRRRRRRRRRRR................................................................................................RRRRRRRRRRRRR...RRRRRRRRRRRRR',
  '..................................................................................RRRRRRRRRRRRRRT...............................................................ooo........RRRRRRRRRRRRT......................................................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR................................................................................................RRRRRRRRRRRRR...RRRRRRRRRRRRR',
  '....................................................ooo...........................RRRRRRRRRRRRRRT..........................................................................RRRRRRRRRRRRT......................................................RRRRRRRRRRRRR...................=====TRRRRRRRRRRRRRRRR.......................................................................................ooM......RRRRRRRRRRRRR...RRRRRRRRRRRRR',
  '.....................................................MM.M.........M...........====RRRRRRRRRRRRRRT...........................................................RRRRRRRRRRRR...RRRRRRRRRRRRT...........................Moo........................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR.................................................................ooo....................MM......RRRRRRRRRRRRR...RRRRRRRRRRRRR',
  '.......................................oo...........MMMMM.........M...............RRRRRRRRRRRRRRT...........................................................RRRRRRRRRRRR...RRRRRRRRRRRRT...........................MMMM...................====RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR..................................................................M.M..................MMM......RRRRRRRRRRRRR...RRRRRRRRRRRRR',
  '......................................M.MM.........MMMMMM.........MM..............RRRRRRRRRRRRRRT...........................................................RRRRRRRRRRRR...RRRRRRRRRRRRT.............ooo...........MMMMM......................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR.................................................................MMMM.......M.........MMMMM.....RRRRRRRRRRRRR...RRRRRRRRRRRRR..........ooo',
  '.....................M................MMMMM.......MMMMMMMM.......MMMM.............RRRRRRRRRRRRRRT.................RRRRRR...........oo.............M.M.......RRRRRRRRRRRR...RRRRRRRRRRRRT.............MMM.M........MMMMMMM.....................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR................................................................MMMMM.......MM.......MMMMMMM....RRRRRRRRRRRRR...RRRRRRRRRRRRR...........MMM.M',
  '.....................ooo..............MMMMMM.....MMMMMMMMMM.....MMMMMM............RRRRRRRRRRRRRRT===..............RRRRRR.====.....====....====....MMMM......RRRRRRRRRRRR...RRRRRRRRRRRRT............MMMMMM.......MMMMMMMMM....................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR............................................M.M......M.M.......MMMMMMM......MMM.....MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR..........MMMMMM',
  '.....................MMM.............MMMMMMMM....MMMMMMMMMM....MMMMMMMM...........RRRRRRRRRRRRRRT.................RRRRRR..........................MMMMM.....RRRRRRRRRRRR...RRRRRRRRRRRRT...........MMMMMMM......MMMMMMMMMMM...................RRRRRRRRRRRRR====....................TRRRRRRRRRRRRRRRR...........................................MMMM......MMMM.....MMMMMMMMM....MMMMM....MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR.........MMMMMMM',
  '....................MMMMM...........MMMMMMMMMM...MMMMMMMMMM...MMMMMMMMMM..........RRRRRRRRRRRRRRT.................RRRRRR.........................MMMMMMM....RRRRRRRRRRRR...RRRRRRRRRRRRT..........MMMMMMMMM.....MMMMMMMMMMM...................RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR..........................................MMMMM......MMMMM....MMMMMMMMM...MMMMMMM...MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR........MMMMMMMMM',
  '...................MMMMMMM..........MMMMMMMMMM...MMMMMMMMMM...MMMMMMMMMM.T........RRRRRRRRRRRRRRT.................RRRRRR........................MMMMMMMMM...RRRRRRRRRRRR...RRRRRRRRRRRRT.........MMMMMMMMMMM....MMMMMMMMMMM...T...............RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR.........................................MMMMMMM....MMMMMMM...MMMMMMMMM..MMMMMMMMM..MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR.......MMMMMMMMMMM.....T',
  '..................MMMMMMMMM.........MMMMMMMMMM...MMMMMMMMMM...MMMMMMMMMM.T....====RRRRRRRRRRRRRRT.................RRRRRR........................MMMMMMMMM...RRRRRRRRRRRR...RRRRRRRRRRRRT.........MMMMMMMMMMM....MMMMMMMMMMM...T...............RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR........................................MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR.......MMMMMMMMMMM.....T',
  '...............===MMMMMMMMM.........MMMMMMMMMM...MMMMMMMMMM...MMMMMMMMMM.T........RRRRRRRRRRRRRRT.................RRRRRR........................MMMMMMMMM...RRRRRRRRRRRR...RRRRRRRRRRRRT.........MMMMMMMMMMM....MMMMMMMMMMM...T...........====RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR.........................ooo............MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR.......MMMMMMMMMMM.....T',
  '..................MMMMMMMMM.........MMMMMMMMMM...MMMMMMMMMM...MMMMMMMMMM.T........RRRRRRRRRRRRRRT.................RRRRRR........................MMMMMMMMM...RRRRRRRRRRRR...RRRRRRRRRRRRT.........MMMMMMMMMMM....MMMMMMMMMMM...T...............RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR........................................MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR.......MMMMMMMMMMM.....T',
  '...P......AAA.....MMMMMMMMM.........MMMMMMMMMM...MMMMMMMMMM...MMMMMMMMMM.T........RRRRRRRRRRRRRRT......AAA........RRRRRR........................MMMMMMMMM...RRRRRRRRRRRR...RRRRRRRRRRRRT......................................T.AAA...........RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR.....AAA........AAA......AAA......AAA...MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR.......................T',
  '..RRR....AAAAA....MMMMMMMMM...r.....MMMMMMMMMM...MMMMMMMMMM...MMMMMMMMMM.T........RRRRRRRRRRRRRRT.....AAAAA...r...RRRRRR........................MMMMMMMMM...RRRRRRRRRRRR...RRRRRRRRRRRRT...r..................................TAAAAA...r......RRRRRRRRRRRRR........................TRRRRRRRRRRRRRRRR....AAAAA......AAAAA....AAAAA....AAAAA..MMMMMMMrM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM..MMMMMMMMM...RRRRRRRRRRRRR...RRRRRRRRRRRRR.....................r.T.....E',
  '############################################################################################################################wwwwwwwwwwwwwwwwww####################################################################################################################################################################################################################################################################################################################',
  '############################################################################################################################wwwwwwwwwwwwwwwwww####################################################################################################################################################################################################################################################################################################################',
  '############################################################################################################################wwwwwwwwwwwwwwwwww####################################################################################################################################################################################################################################################################################################################',
  '##################################################################################################################################################################################################################################################################################################################################################################################################################################################################',
];

export const CITY: LevelDefinition = {
  name: 'City',
  theme: 'city',
  widthInTiles: 450,
  groundRow: 30,
  branchesNeedTrunks: false,
  // Girders, not branches: you cannot pass up through one.
  solidPlatforms: true,
  rows: ROWS,
};
