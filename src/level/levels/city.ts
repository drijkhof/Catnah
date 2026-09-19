import type { LevelDefinition } from '../Level';

/**
 * Level 2: the city, at night. 176 tiles.
 *
 * Built at the scale of the thing walking through it: a block of flats is
 * sixteen storeys of brick, an awning is four tiles of steel and a parked car
 * is two tiles tall and five long.
 *
 * A building stands on the pavement and blocks it, so each one is either **gone
 * through** -- an arcade at street level -- or **gone over**, and the four that
 * are gone over have one drainpipe, on the side you arrive at. Coming down the
 * far side needs nothing: falling is free.
 *
 * **Nothing swims in this city.** The canal is eleven tiles of plain water with
 * two awnings over it and five tiles of nothing between them.
 */

/**
 * The grid, written out.
 *
 * Laid out once and then **frozen into this file**, so the level is a fixed
 * thing -- the same on every machine, in every run, for every player -- rather
 * than something computed at boot. Rows are written short and padded out to the
 * level's width by `parseLevel`, which is why the right-hand ends are ragged.
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
  '..........................................................................................................c',
  '',
  '.........................................................................................................N+N',
  '........................................................................................................RRRRR',
  '.....................................................................................................RRRRRRRR',
  '..................................................................................................RRRRRRRRRRR',
  '..............................................................................................TRRRRRRRRRRRRRR',
  '..............................................................................................TRRRRRRRRRRRRRR...........RRRooo',
  '..............................................................................................TRRRRRRRRRRRRRR...........RRRRRR',
  '..........................TRRRRooo........................................................====TRRRRRRRRRRRRRR...........RRRRRRRRR',
  '..........................TRRRRRRRR...........................................................TRRRRRRRRRRRRRR...........RRRRRRRRR...............RRR',
  '..........................TRRRRRRRRRRRR................ooo................RRR.................TRRRRRRRRRRRRRR...........RRRRRRRRR...........oooRRRR',
  '..........................TRRRRRRRRRRRR...............RRRR===.....====....RRRRRRooo...........TRRRRRRRRRRRRRR...........RRRRRRRRR........TRRRRRRRRR',
  '..........................TRRRRRRRRRRRR.............RRRRRR................RRRRRRRRRR..........TRRRRRRRRRRRRRR...........RRRRRRRRR........TRRRRRRRRR.....RR',
  '............oooRRR........TRRRRRRRRRRRR..........TRRRRRRRR................RRRRRRRRRR..........TRRRRRRRRRRRRRR...........RRRRRRRRR........TRRRRRRRRR.....RRRRooo.............oo',
  '...........RRRRRRR........TRRRRRRRRRRRR..........TRRRRRRRR................RRRRRRRRRR..........TRRRRRRRRRRRRRR...........RRRRRRRRR........TRRRRRRRRR.....RRRRRRRR...........RRRR',
  '........RRRRRRRRRR......T.TRRRRRRRRRRRR=====.....TRRRRRRRR................RRRRRRRRRR..........TRRRRRRRRRRRRRR........T..RRRRRRRRR........TRRRRRRRRR.....RRRRRRRR.........RRRRRR',
  '........RRRRRRRRRR......T.TRRRRRRRRRRRR.....====.TRRRRRRRR................RRRRRRRRRR..........TRRRRRRRRRRRRRR........T..RRRRRRRRR...====.TRRRRRRRRR.....RRRRRRRR.......RRRRRRRR',
  '........RRRRRRRRRR......T.TRRRRRRRRRRRR..........TRRRRRRRR................RRRRRRRRRR..........TRRRRRRRRRRRRRR........T..RRRRRRRRR........TRRRRRRRRR.....RRRRRRRR.......RRRRRRRR',
  '........RRRRRRRRRR......T.TRRRRRRRRRRRR..........TRRRRRRRR................RRRRRRRRRR..........TRRRRRRRRRRRRRR........T..RRRRRRRRR........TRRRRRRRRR.....RRRRRRRR.......RRRRRRRR',
  '....P..............AAA..T.TRRRRRRRRRRRR..........TRRRRRRRR...............................AAA..TRRRRRRRRRRRRRR...AAA..T...................TRRRRRRRRR...............AAA',
  '...RRR............AAAAA.T.TRRRRRRRRRRRR.....r....TRRRRRRRR............................r.AAAAA.TRRRRRRRRRRRRRR..AAAAA.T...............r...TRRRRRRRRR..............AAAAr........E',
  '############################################################wwwwwwwwwww#########################################################################################################',
  '############################################################wwwwwwwwwww#########################################################################################################',
  '############################################################wwwwwwwwwww#########################################################################################################',
  '################################################################################################################################################################################',
];

export const CITY: LevelDefinition = {
  name: 'City',
  theme: 'city',
  widthInTiles: 176,
  groundRow: 30,
  branchesNeedTrunks: false,
  // Girders, not branches: you cannot pass up through one.
  solidPlatforms: true,
  rows: ROWS,
};
